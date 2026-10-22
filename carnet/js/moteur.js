// Le moteur : des cours Pronote aux créneaux de progression, puis la file d'étapes de chaque
// classe répartie sur ces créneaux. Aucune dépendance au navigateur : ce fichier tourne aussi
// sous Node pour les tests, et pourra tourner ailleurs (synchronisation automatique, plus tard).
//
// Une classe a une FILE d'étapes (« Activité 5 – Le sol », « Bilan », « Évaluation »…). Chaque
// étape dure un certain nombre de séances et peut avoir des JALONS (situation déclenchante,
// hypothèses, protocole…). La progression d'une classe n'est pas une somme de « ce qu'on a
// fait » : c'est un POINT D'ARRÊT, « on s'est arrêtés après les hypothèses de l'activité 5 ».
// Le dernier point d'arrêt validé fait foi ; tout ce qui est avant est fait, la suite coule
// sur les créneaux à venir. Une séance oubliée ne fausse donc rien.
import { jourDe, heureDe, minutesDe, ajouteJours, ecartJours } from './dates.js';

export const EPS = 1e-6;
const arrondi = (x) => Math.round(x * 1000) / 1000;
const auQuart = (x) => Math.round(x * 4) / 4;
const uniques = (t) => [...new Set(t)];
const dureeMin = (c) => Math.max(0, (c.fin - c.debut) / 60000);

/** Durée d'une séance la plus fréquente dans l'emploi du temps (55 min au collège, souvent). */
export function dureeSeanceProbable(cours) {
  const compte = new Map();
  for (const c of cours) {
    if (!c || c.type !== 'cours' || !c.debut || !c.fin) continue;
    const m = Math.round(dureeMin(c) / 5) * 5;
    if (m >= 20 && m <= 240) compte.set(m, (compte.get(m) || 0) + 1);
  }
  let meilleure = 55, n = 0;
  for (const [m, k] of compte) if (k > n || (k === n && m < meilleure)) { meilleure = m; n = k; }
  return meilleure;
}

const memesEleves = (a, b) => (a.groupe || '') === (b.groupe || '') && (a.parties || []).join('|') === (b.parties || []).join('|');

/**
 * Regroupe les cours en créneaux de progression :
 * - les demi-groupes d'une classe le même jour (P2 à 9h20, P1 à 10h35) forment UN créneau :
 *   les deux moitiés font la même chose, la classe n'avance qu'une fois ;
 * - deux heures enchaînées avec les mêmes élèves forment un créneau double.
 * La capacité d'un créneau se compte en séances : 55 min → 1, 1h50 → 2.
 */
export function construireCreneaux(cours, { fuseau, dureeSeance = 55, exclus = [] } = {}) {
  const ignores = new Set(exclus);
  const lus = cours.filter((c) => c && c.type === 'cours' && c.debut && !ignores.has(c.code))
    .sort((a, b) => a.debut - b.debut);
  const res = [];
  for (const c of lus) {
    const jour = jourDe(c.debut, fuseau);
    let voisin = null;
    if (c.demi) {
      voisin = res.find((x) => x.code === c.code && x.jour === jour && x.demi
        && !x.parties.some((p) => p.groupe === c.groupe));
    } else {
      voisin = res.find((x) => x.code === c.code && x.jour === jour && !x.demi
        && c.debut - x.fin >= 0 && c.debut - x.fin <= 10 * 60000 && memesEleves(x.parties[0], c));
    }
    if (voisin) {
      voisin.parties.push(c);
      if (c.fin > voisin.fin) voisin.fin = c.fin;
      continue;
    }
    res.push({
      cle: `${c.code}_${jour.replace(/-/g, '')}_${heureDe(c.debut, fuseau).replace(':', '')}`,
      code: c.code, jour, debut: c.debut, fin: c.fin, demi: !!c.demi, parties: [c],
    });
  }
  for (const x of res) {
    x.parties.sort((a, b) => a.debut - b.debut);
    const actives = x.parties.filter((p) => !p.annule);
    x.annule = actives.length === 0;
    x.partiel = !x.annule && actives.length < x.parties.length;
    const minutes = x.demi ? Math.max(0, ...actives.map(dureeMin)) : actives.reduce((s, p) => s + dureeMin(p), 0);
    x.capacite = x.annule ? 0 : Math.max(0.25, auQuart(minutes / dureeSeance));
    x.salle = uniques(x.parties.map((p) => p.salle).filter(Boolean)).join(', ');
    x.accompagnants = uniques(x.parties.map((p) => p.accompagnant).filter(Boolean));
    x.inclusions = uniques(x.parties.flatMap((p) => p.inclusions || []));
    x.groupes = x.parties.map((p) => p.groupe).filter(Boolean);
    x.matiere = x.parties[0].matiere || '';
    x.statut = uniques(x.parties.map((p) => p.statutPronote).filter(Boolean)).join(' · ');
  }
  return res;
}

// ---------- Positions dans une file ----------
// Une position est { i, f } : l'étape d'indice i est faite à la fraction f (0 ≤ f < 1).
// i = longueur de la file : tout est fait. Stockée, elle devient un « arrêt » { u, f, rang }
// qui désigne l'étape par son identifiant dans la file (u), pour survivre à un réordonnancement.

function normaliser(p, n) {
  let i = Math.max(0, p.i | 0), f = Math.max(0, Number(p.f) || 0);
  if (f >= 1 - EPS) { i += 1; f = 0; }
  if (i >= n) return { i: n, f: 0 };
  return { i, f };
}

export function positionDe(arret, file) {
  if (!arret) return null;
  const i = file.findIndex((it) => it.u === arret.u);
  if (i < 0) return arret.rang != null ? normaliser({ i: Math.min(+arret.rang, file.length), f: 0 }, file.length) : null;
  return normaliser({ i, f: arret.f }, file.length);
}

export function arretDe(pos, file) {
  if (!file.length) return { u: null, f: 0, rang: 0 };
  if (pos.i >= file.length) return { u: file[file.length - 1].u, f: 1, rang: file.length };
  return { u: file[pos.i].u, f: arrondi(pos.f), rang: pos.i };
}

// ---------- Jalons et libellés ----------

export const jalonsDe = (etape) => (etape && Array.isArray(etape.jalons) ? etape.jalons.map((j) => String(j).trim()).filter(Boolean) : []);

export function fractionLisible(f) {
  const q = Math.round(f * 4);
  return Math.abs(f * 4 - q) < 0.02 ? ['0', '¼', '½', '¾', 'tout'][q] : `${Math.round(f * 100)} %`;
}

/** « 1 séance », « ½ séance », « 2 séances ¼ » */
export function seancesLisible(x) {
  const r = arrondi(x);
  if (r <= EPS) return '0 séance';
  const ent = Math.floor(r + EPS), frac = r - ent;
  const q = Math.round(frac * 4);
  const f = q ? ['', '¼', '½', '¾'][q] || '' : '';
  if (!ent) return `${f} séance`;
  return `${ent} séance${ent > 1 ? 's' : ''}${f ? ' ' + f : ''}`;
}

/** Où reprendre une étape commencée à la fraction « de ». */
export function reprise(seg, etape) {
  const J = jalonsDe(etape), n = J.length;
  if (seg.de < EPS) return { debut: true, texte: 'début' };
  if (n) { const k = Math.min(n - 1, Math.floor(seg.de * n + EPS)); return { texte: J[k], jalon: k }; }
  return { texte: fractionLisible(seg.de) };
}

/** Jusqu'où va un segment qui s'arrête à la fraction « a ». */
export function jusqua(seg, etape) {
  const J = jalonsDe(etape), n = J.length;
  if (seg.a >= 1 - EPS) return { fin: true, texte: 'fin' };
  if (n) {
    const k = Math.floor(seg.a * n + EPS) - 1;
    return k >= 0 ? { texte: J[k], jalon: k } : { texte: 'début', jalon: -1 };
  }
  return { texte: fractionLisible(seg.a) };
}

/** Les points d'arrêt qu'on peut choisir dans une étape : jalons, sinon quarts. */
export function pointsArret(etape) {
  const J = jalonsDe(etape);
  if (J.length) return [{ f: 0, libelle: 'Pas commencée' }, ...J.map((j, k) => ({ f: (k + 1) / J.length, libelle: j }))];
  return [
    { f: 0, libelle: 'Pas commencée' }, { f: 0.25, libelle: '¼' }, { f: 0.5, libelle: '½' },
    { f: 0.75, libelle: '¾' }, { f: 1, libelle: 'Terminée' },
  ];
}

// ---------- Planification ----------

const jourDeCle = (cle) => {
  const m = String(cle).match(/_(\d{4})(\d{2})(\d{2})_\d{4}/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
};

/**
 * Répartit la file de chaque classe sur ses créneaux.
 * donnees : { classes, etapes, journal, reglages } ; creneaux : construireCreneaux(…)
 * Renvoie { parCreneau, parClasse, annonces, alertesEval }.
 */
export function planifier(donnees, creneaux, { auj, maintenant = new Date(), delaiAnnonce = 7 } = {}) {
  const { classes = {}, etapes = {}, journal = {}, reglages = {} } = donnees;
  const debutSuivi = reglages.debut || '0000-01-01';
  const parCreneau = {}, parClasse = {};
  const tous = [...creneaux].sort((a, b) => a.debut - b.debut);
  const cles = new Set(tous.map((c) => c.cle));

  // Une validation dont le créneau a changé d'heure dans Pronote se raccroche au même jour.
  const orphelins = {};
  for (const [cle, j] of Object.entries(journal)) {
    if (!j || j._x || cles.has(cle)) continue;
    const k = `${j.code}|${j.jour || jourDeCle(cle)}`;
    (orphelins[k] ||= []).push(cle);
  }

  for (const code of Object.keys(classes)) {
    const cl = classes[code];
    if (!cl || cl._x) continue;
    const file = (cl.file || []).filter((it) => it && etapes[it.eid] && !etapes[it.eid]._x);
    const n = file.length;
    const duree = (i) => Math.max(0.25, Number(etapes[file[i].eid].duree) || 1);
    const total = file.reduce((s, _, i) => s + duree(i), 0);
    const avancement = (p) => {
      let s = 0;
      for (let i = 0; i < Math.min(p.i, n); i++) s += duree(i);
      return p.i < n ? s + p.f * duree(p.i) : s;
    };
    const segmentsEntre = (a, b) => {
      if (b.i < a.i || (b.i === a.i && b.f < a.f - EPS)) return [{ recul: true }];
      const segs = [];
      let p = { ...a };
      while (p.i < n && (p.i < b.i || (p.i === b.i && p.f < b.f - EPS))) {
        const fin = p.i < b.i ? 1 : b.f;
        segs.push({ u: file[p.i].u, eid: file[p.i].eid, de: arrondi(p.f), a: arrondi(fin), h: arrondi((fin - p.f) * duree(p.i)) });
        p = { i: p.i + 1, f: 0 };
      }
      return segs;
    };

    const crs = tous.filter((c) => c.code === code && c.jour >= debutSuivi);
    const pris = new Set();
    const journalDe = (c) => {
      const j = journal[c.cle];
      if (j && !j._x) return j;
      const liste = orphelins[`${code}|${c.jour}`] || [];
      const k = liste.find((x) => !pris.has(x));
      if (k) { pris.add(k); return journal[k]; }
      return null;
    };
    const entrees = crs.map(journalDe);
    let dernierValide = -1;
    entrees.forEach((j, k) => { if (j && j.arret && !crs[k].annule) dernierValide = k; });

    const depart = positionDe(cl.depart, file) || { i: 0, f: 0 };
    let pos = depart, precedent = depart, posMaintenant = depart;
    let premierLibre = null, finFile = null, aValider = 0;
    const prochains = [];

    crs.forEach((c, k) => {
      const j = entrees[k];
      const passe = c.fin <= maintenant;
      if (c.annule) { parCreneau[c.cle] = { etat: 'annule', segments: [], libre: 0 }; return; }
      if (k <= dernierValide) {
        if (j && j.arret) {
          const p = positionDe(j.arret, file) || precedent;
          parCreneau[c.cle] = { etat: 'valide', segments: segmentsEntre(precedent, p), arret: p, note: j.note || '', libre: 0 };
          precedent = p; pos = p;
        } else {
          parCreneau[c.cle] = { etat: 'couvert', segments: [], libre: 0 };
        }
        if (passe || (j && j.arret)) posMaintenant = pos;
        return;
      }
      // À venir, ou passé sans validation : la file coule depuis le dernier point connu.
      let cap = c.capacite;
      const segments = [];
      while (cap > EPS && pos.i < n) {
        const D = duree(pos.i), e = etapes[file[pos.i].eid];
        // Une évaluation (ou une étape marquée « ne pas couper ») ne se coupe pas sur deux cours :
        // si elle ne tient pas dans ce qui reste du créneau, elle commence au cours suivant.
        // Seule exception : une étape plus longue qu'un créneau entier, qu'il faut bien répartir.
        if (pos.f < EPS && (e.eval || e.insecable) && cap < D - EPS && cap < c.capacite - EPS) break;
        const reste = D * (1 - pos.f), h = Math.min(cap, reste);
        const a = pos.f + h / D;
        segments.push({ u: file[pos.i].u, eid: file[pos.i].eid, de: arrondi(pos.f), a: arrondi(Math.min(1, a)), h: arrondi(h) });
        cap -= h;
        pos = a >= 1 - EPS ? { i: pos.i + 1, f: 0 } : { i: pos.i, f: a };
        if (pos.i >= n && !finFile) finFile = c;
      }
      const libre = arrondi(Math.max(0, cap));
      parCreneau[c.cle] = { etat: 'prevu', segments, libre, aValider: passe, note: (j && j.note) || '' };
      if (passe) { aValider++; posMaintenant = pos; } else {
        prochains.push(c);
        if (libre > 0.01 && !premierLibre) premierLibre = c;
      }
    });

    let couvertJusqua = null;
    if (premierLibre) {
      const avant = prochains.filter((c) => c.debut < premierLibre.debut);
      couvertJusqua = avant.length ? avant[avant.length - 1].jour : null;
    } else if (prochains.length) couvertJusqua = prochains[prochains.length - 1].jour;

    parClasse[code] = {
      file, total, n,
      position: posMaintenant, avancement: avancement(posMaintenant),
      positionFinale: pos, premierLibre, couvertJusqua, prochains, finFile, aValider,
      dernierValide: dernierValide >= 0 ? crs[dernierValide] : null,
    };
  }

  // Évaluations : prévenir les élèves une semaine avant (délai réglable).
  const annonces = {}, alertesEval = {};
  for (const code of Object.keys(parClasse)) {
    const cl = classes[code], pc = parClasse[code];
    const crs = tous.filter((c) => c.code === code && !c.annule && c.jour >= debutSuivi);
    for (const it of pc.file) {
      const e = etapes[it.eid];
      if (!e || !e.eval) continue;
      const cE = crs.find((c) => ((parCreneau[c.cle] || {}).segments || []).some((s) => s.u === it.u && s.de < EPS));
      if (!cE || cE.fin <= maintenant) continue;
      if (cl.annonces && cl.annonces[it.u]) continue;
      const avant = crs.filter((c) => c.debut < cE.debut);
      const ideal = avant.filter((c) => ecartJours(c.jour, cE.jour) >= delaiAnnonce).pop();
      const info = { code, u: it.u, eid: it.eid, titre: e.titre, jourEval: cE.jour, cleEval: cE.cle };
      if (ideal && ideal.jour >= auj) (annonces[ideal.cle] ||= []).push({ ...info, tard: false });
      else {
        const prochain = avant.find((c) => c.jour >= auj && c.fin > maintenant);
        if (prochain) (annonces[prochain.cle] ||= []).push({ ...info, tard: true });
        // Plus de cours avant l'évaluation : soit l'annonce a eu lieu sans être cochée (occasion
        // passée), soit il n'y a jamais eu de cours pour la faire.
        else (alertesEval[cE.cle] ||= []).push({ ...info, occasion: (ideal || avant[avant.length - 1] || {}).jour || null });
      }
    }
  }
  return { parCreneau, parClasse, annonces, alertesEval };
}

// ---------- Vacances et coupures ----------

/**
 * Périodes sans cours : les « Vacances » de Pronote, et tout trou de plus d'une semaine entre
 * deux jours de cours (utile quand l'export n'écrit pas les vacances).
 */
export function coupures(cours, creneaux) {
  const res = [];
  for (const c of cours) if (c && c.type === 'vacances') res.push({ debut: c.jour0, fin: c.jour1, titre: c.titre || 'Vacances', source: 'pronote' });
  const jours = uniques(creneaux.filter((c) => !c.annule).map((c) => c.jour)).sort();
  for (let k = 1; k < jours.length; k++) {
    if (ecartJours(jours[k - 1], jours[k]) > 7) {
      res.push({ debut: ajouteJours(jours[k - 1], 1), fin: ajouteJours(jours[k], -1), titre: 'Pas de cours', source: 'trou' });
    }
  }
  res.sort((a, b) => a.debut.localeCompare(b.debut));
  const fus = [];
  for (const r of res) {
    const d = fus[fus.length - 1];
    if (d && r.debut <= ajouteJours(d.fin, 1)) {
      if (r.fin > d.fin) d.fin = r.fin;
      if (d.source !== 'pronote' && r.source === 'pronote') { d.titre = r.titre; d.source = 'pronote'; }
    } else fus.push({ ...r });
  }
  return fus;
}

/** Pour une classe : tient-on la file d'ici la prochaine coupure ? */
export function avantCoupure(plan, creneaux, listeCoupures, code, { auj, maintenant = new Date() }) {
  const prochaine = listeCoupures.find((k) => k.debut > auj);
  const pc = plan.parClasse[code];
  if (!prochaine || !pc) return null;
  const crs = creneaux.filter((c) => c.code === code && !c.annule && c.fin > maintenant && c.jour < prochaine.debut);
  const capacite = arrondi(crs.reduce((s, c) => s + c.capacite, 0));
  const resteFile = arrondi(pc.total - pc.avancement);
  return {
    coupure: prochaine, seances: crs.length, capacite, resteFile,
    marge: arrondi(capacite - resteFile),
    finFile: pc.finFile && pc.finFile.jour < prochaine.debut ? pc.finFile : null,
  };
}

// ---------- Où en sont mes classes ----------

/** Par niveau, la position de chaque classe sur une même suite d'étapes. */
export function peloton(donnees, plan) {
  const parNiveau = {};
  for (const [code, cl] of Object.entries(donnees.classes || {})) {
    if (!cl || cl._x || cl.masquee || !plan.parClasse[code]) continue;
    (parNiveau[cl.niveau || 'Autre'] ||= []).push(code);
  }
  const ordre = ['6e', '5e', '4e', '3e', '2nde', '1re', 'Tle', 'Autre'];
  return Object.keys(parNiveau).sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b)).map((niveau) => {
    const codes = parNiveau[niveau];
    let ref = [];
    for (const code of codes) { const f = plan.parClasse[code].file; if (f.length > ref.length) ref = f; }
    const refEids = ref.map((it) => it.eid);
    const lignes = codes.map((code) => {
      const pc = plan.parClasse[code], p = pc.position, it = pc.file[p.i];
      const k = it ? refEids.indexOf(it.eid) : refEids.length;
      return {
        code, rang: (k >= 0 ? k : p.i) + (it ? p.f : 0), fini: !it,
        eid: it ? it.eid : null, f: it ? p.f : 0,
        avancement: pc.avancement, total: pc.total,
      };
    }).sort((a, b) => b.rang - a.rang || a.code.localeCompare(b.code));
    const tete = lignes[0];
    for (const l of lignes) l.retard = tete ? arrondi(tete.avancement - l.avancement) : 0;
    return { niveau, reference: refEids, lignes };
  });
}

// ---------- Préparation ----------

/** Les étapes qui commencent dans les prochains jours et demandent des photocopies ou du matériel. */
export function aPreparer(donnees, plan, creneaux, { auj, jours = 7 } = {}) {
  const fin = ajouteJours(auj, jours), res = [];
  for (const c of creneaux) {
    if (c.jour < auj || c.jour > fin || c.annule) continue;
    const pc = plan.parCreneau[c.cle];
    if (!pc || pc.etat !== 'prevu') continue;
    for (const s of pc.segments) {
      if (s.de > EPS) continue;
      const e = donnees.etapes[s.eid];
      if (!e || (!(Number(e.photocopies) > 0) && !String(e.afaire || '').trim())) continue;
      const cl = donnees.classes[c.code] || {};
      res.push({
        id: `prep_${c.cle}_${s.u}`, cle: c.cle, jour: c.jour, debut: c.debut, code: c.code, eid: s.eid,
        pages: Number(e.photocopies) || 0, effectif: Number(cl.effectif) || 0, afaire: String(e.afaire || '').trim(),
      });
    }
  }
  return res.sort((a, b) => a.debut - b.debut);
}

/**
 * Les trous d'une journée de cours : entre le premier et le dernier événement professionnel
 * du jour, ce qui reste libre une fois retirés cours, réunions et rendez-vous personnels.
 */
export function plagesLibres(evenements, jour, { fuseau, min = 30 } = {}) {
  const duJour = evenements.filter((e) => e && e.debut && !e.annule && e.jour0 <= jour && e.jour1 >= jour);
  const pro = duJour.filter((e) => e.pro);
  if (!pro.length) return [];
  const borne = (e, bord) => (bord === 'd'
    ? (e.jour0 < jour ? 0 : minutesDe(e.debut, fuseau))
    : (e.jour1 > jour ? 24 * 60 : minutesDe(e.fin, fuseau)));
  const debut = Math.min(...pro.map((e) => borne(e, 'd')));
  const fin = Math.max(...pro.map((e) => borne(e, 'f')));
  const occupe = duJour.map((e) => [Math.max(debut, borne(e, 'd')), Math.min(fin, borne(e, 'f'))])
    .filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const res = [];
  let t = debut;
  for (const [a, b] of occupe) { if (a - t >= min) res.push([t, a]); t = Math.max(t, b); }
  if (fin - t >= min) res.push([t, fin]);
  return res;
}
