// Ce que le Carnet écrit dans Google Agenda, et comment il le met à jour. Fonctions pures :
// testables sans Google, et la même synchronisation donne toujours les mêmes appels.
//
// Chaque événement écrit porte une propriété privée { carnet: '1', cle } : on ne touche jamais
// à un événement qui ne l'a pas, même s'il a été ajouté à la main dans un agenda « Carnet ».
import { ajouteJours, heureDe, heureLisible, dateLongue } from './dates.js';
import { reprise, jusqua, seancesLisible, EPS } from './moteur.js';

export const COULEURS_NIVEAUX = {
  '6e': '#4fae7a', '5e': '#7aa32f', '4e': '#3faea6', '3e': '#2f7150',
  '2nde': '#4f93d4', '1re': '#8f76cf', Tle: '#d56a97', Autre: '#8a8f87',
};
export const COULEUR_ETABLISSEMENT = '#8a8f87';
// Couleurs d'ÉVÉNEMENT de Google (les seules permises pour un événement) : identifiant → nom.
export const COULEURS_EVENEMENT = { '': 'Celle de l’agenda', 10: 'Basilic (vert foncé)', 2: 'Sauge (vert clair)', 5: 'Banane (jaune)', 6: 'Mandarine (orange)', 11: 'Tomate (rouge)' };

/** La description des agendas du Carnet : elle permet de les reconnaître (reprise, doublons). */
export const DESCRIPTION_AGENDA = 'Écrit par le Carnet de bord : les cours avec ce qui est prévu. Modifié automatiquement.';

/** Les agendas que le Carnet doit avoir, selon le mode choisi. */
export function agendasVoulus(ecriture, niveaux) {
  if (!ecriture || !ecriture.parNiveau) return [{ cle: 'general', nom: 'Carnet de bord', couleur: (ecriture && ecriture.couleurUnique) || '#2f7150' }];
  const couleurs = { ...COULEURS_NIVEAUX, ...((ecriture && ecriture.couleurs) || {}) };
  return [
    ...niveaux.map((n) => ({ cle: `niveau:${n}`, nom: `Carnet · ${n}`, couleur: couleurs[n] || COULEURS_NIVEAUX.Autre })),
    { cle: 'etablissement', nom: 'Carnet · Établissement', couleur: COULEUR_ETABLISSEMENT },
  ];
}

const court = (t) => String(t || '').replace(/\s*\(.*?\)\s*$/, '');

/** Le titre et la description d'un cours, tels qu'on les lit dans Google Agenda. */
export function texteCours(cr, partie, { plan, v, fuseau, urlAppli }) {
  const pc = plan.parCreneau[cr.cle] || { etat: 'prevu', segments: [], libre: cr.capacite };
  const cl = v.classes[cr.code] || {};
  const nom = `${cl.nom || cr.code}${partie && partie.groupe ? ` ${partie.groupe}` : ''}`;
  const annule = partie ? partie.annule : cr.annule;
  if (annule || pc.etat === 'annule') {
    return { titre: `Annulé · ${nom}`, description: `${cr.statut || 'Cours annulé'} dans Pronote.\nLa progression passe au cours suivant.`, evaluation: false, annule: true };
  }
  const bouts = [], lignes = [];
  let evaluation = false;
  for (const s of (pc.segments || []).filter((x) => !x.recul)) {
    const e = v.etapes[s.eid] || { titre: '' };
    if (e.eval) evaluation = true;
    const r = reprise(s, e), j = jusqua(s, e);
    const ou = pc.etat === 'valide' ? '' : !r.debut ? `reprendre à ${r.texte}${j.fin ? '' : ` → ${j.texte}`}` : !j.fin ? `jusqu'à ${j.texte}` : '';
    bouts.push(`${e.eval ? '✎ ' : ''}${court(e.titre)}${ou && !bouts.length ? ` · ${ou}` : ''}`);
    lignes.push(`• ${e.titre}${ou ? ` — ${ou}` : ''} (${pc.etat === 'valide' ? 'fait' : seancesLisible(s.h)})`);
  }
  if (pc.etat === 'prevu' && pc.libre > 0.01) {
    if (pc.libre >= 0.99) bouts.push('à préparer');
    lignes.push(`• ${pc.libre >= 0.99 ? 'Rien de prévu : séance à préparer' : 'Temps restant à préparer'} (${seancesLisible(pc.libre)})`);
  }
  const annonces = plan.annonces[cr.cle] || [];
  let titre = `${nom} · ${bouts.join(' + ') || 'à préparer'}`;
  if (pc.etat === 'valide') titre = `✓ ${titre}`;
  if (annonces.length) titre = `📣 ${titre}`;
  const h = (d) => heureLisible(heureDe(d, fuseau));
  const d = [];
  d.push(`${cl.nom || cr.code} — ${cr.demi && cr.parties.length > 1 ? `demi-groupes (${cr.parties.map((p) => `${p.groupe} ${h(p.debut)}`).join(', ')})` : 'classe entière'}${cr.salle ? ` · salle ${cr.salle}` : ''}`);
  if (cr.accompagnants.length) d.push(`Avec ${cr.accompagnants.join(', ')}`);
  if (cr.inclusions.length) d.push(`Inclusion : ${cr.inclusions.join(', ')}`);
  d.push('', pc.etat === 'valide' ? 'Fait :' : 'Prévu :', ...(lignes.length ? lignes : ['• rien']));
  const debuts = (pc.segments || []).filter((s) => !s.recul && s.de < EPS && pc.etat === 'prevu').map((s) => v.etapes[s.eid]).filter((e) => e && (e.afaire || e.photocopies > 0));
  if (debuts.length) d.push('', `À prévoir : ${debuts.map((e) => [e.photocopies > 0 ? `photocopies (${cl.effectif ? `${cl.effectif} × ${e.photocopies}` : `${e.photocopies} p./élève`})` : '', e.afaire].filter(Boolean).join(', ')).join(' · ')}`);
  for (const a of annonces) d.push('', `${a.tard ? 'PRÉVENIR DÈS MAINTENANT' : 'ANNONCER'} : ${a.titre}, ${dateLongue(a.jourEval)}`);
  if (pc.etat === 'prevu') {
    for (const s of pc.segments || []) {
      const e = v.etapes[s.eid];
      if (e && e.format === 'demi' && !cr.demi) d.push('', `Attention : « ${e.titre} » est prévue en demi-groupe, ce cours est en classe entière.`);
      if (e && e.format === 'entiere' && cr.demi) d.push('', `Attention : « ${e.titre} » est prévue en classe entière, ce cours est en demi-groupes.`);
    }
  }
  if (pc.note) d.push('', `Note : ${pc.note}`);
  if (urlAppli) d.push('', `Où en est-on ? ${urlAppli}#valider=${cr.cle}`);
  d.push('— Carnet de bord');
  return { titre, description: d.join('\n'), evaluation, annule: false };
}

const iso = (d) => new Date(d).toISOString();

/**
 * Les événements que le Carnet veut voir dans Google Agenda sur la fenêtre [debut, fin] :
 * un par cours (un par moitié pour les demi-groupes), plus la vie de l'établissement.
 */
export function evenementsVoulus({ creneaux, plan, v, fuseau, etablissement = [], coupures = [] }, ecriture, { debut, fin, urlAppli }) {
  const res = [];
  const parNiveau = !!ecriture.parNiveau;
  const rappel = Number(ecriture.rappel) || 0;
  const rappels = rappel > 0 ? { useDefault: false, overrides: [{ method: 'popup', minutes: rappel }] } : { useDefault: false };
  const couleurEval = ecriture.couleurEval == null ? '10' : String(ecriture.couleurEval);
  for (const cr of creneaux) {
    if (cr.jour < debut || cr.jour > fin) continue;
    const cl = v.classes[cr.code];
    if (!cl || cl.masquee) continue;
    const agenda = parNiveau ? `niveau:${cl.niveau || 'Autre'}` : 'general';
    const parts = cr.demi && cr.parties.length > 1 ? cr.parties : [null];
    for (const p of parts) {
      const t = texteCours(cr, p, { plan, v, fuseau, urlAppli });
      const corps = {
        summary: t.titre,
        description: t.description,
        location: (p ? p.salle : cr.salle) ? `Salle ${p ? p.salle : cr.salle}` : '',
        start: { dateTime: iso(p ? p.debut : cr.debut), timeZone: fuseau },
        end: { dateTime: iso(p ? p.fin : cr.fin), timeZone: fuseau },
        reminders: rappels,
        transparency: 'opaque',
        extendedProperties: { private: { carnet: '1', cle: `${cr.cle}${p ? `_${p.groupe}` : ''}` } },
      };
      if (t.annule) corps.colorId = '8';
      else if (t.evaluation && couleurEval) corps.colorId = couleurEval;
      if (urlAppli) corps.source = { title: 'Carnet de bord', url: `${urlAppli}#creneau=${cr.cle}` };
      res.push({ cle: corps.extendedProperties.private.cle, agenda, corps });
    }
  }
  if (ecriture.etablissement !== false) {
    const agenda = parNiveau ? 'etablissement' : 'general';
    for (const e of etablissement) {
      if (e.jour1 < debut || e.jour0 > fin) continue;
      const corps = {
        summary: e.titre, description: `${e.description ? `${e.description}\n\n` : ''}(Pronote)`, location: e.lieu || '',
        transparency: e.journee ? 'transparent' : 'opaque', reminders: { useDefault: false },
        extendedProperties: { private: { carnet: '1', cle: `pronote_${String(e.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80)}` } },
        ...(e.journee
          ? { start: { date: e.jour0 }, end: { date: ajouteJours(e.jour1, 1) } }
          : { start: { dateTime: iso(e.debut), timeZone: fuseau }, end: { dateTime: iso(e.fin), timeZone: fuseau } }),
      };
      if (!parNiveau) corps.colorId = '8';
      res.push({ cle: corps.extendedProperties.private.cle, agenda, corps });
    }
    for (const k of coupures) {
      if (k.source !== 'pronote' || k.fin < debut || k.debut > fin) continue;
      const corps = {
        summary: k.titre, description: '(Pronote)', transparency: 'transparent', reminders: { useDefault: false },
        start: { date: k.debut }, end: { date: ajouteJours(k.fin, 1) },
        extendedProperties: { private: { carnet: '1', cle: `vacances_${k.debut}` } },
      };
      if (!parNiveau) corps.colorId = '8';
      res.push({ cle: corps.extendedProperties.private.cle, agenda, corps });
    }
  }
  return res;
}

const instant = (x) => (x && (x.dateTime ? new Date(x.dateTime).getTime() : x.date ? String(x.date).slice(0, 10) : null));
const plat = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** L'événement existant diffère-t-il de ce qu'on veut écrire ? */
export function different(ev, corps) {
  if (plat(ev.summary) !== plat(corps.summary)) return true;
  if (plat(ev.description) !== plat(corps.description)) return true;
  if (plat(ev.location) !== plat(corps.location)) return true;
  if (instant(ev.start) !== instant(corps.start) || instant(ev.end) !== instant(corps.end)) return true;
  if (String(ev.colorId || '') !== String(corps.colorId || '')) return true;
  const r = (x) => JSON.stringify(((x && x.overrides) || []).map((o) => o.minutes));
  if (r(ev.reminders) !== r(corps.reminders)) return true;
  if (((ev.source && ev.source.url) || '') !== ((corps.source && corps.source.url) || '')) return true;
  return false;
}

/**
 * Compare le voulu ({ cle, calId, corps }) et l'existant ({ calId, ev }) : ce qu'il faut créer,
 * remplacer, supprimer. Un événement en double est supprimé ; un événement qui change d'agenda
 * est supprimé ici et recréé là-bas.
 */
export function comparer(voulus, existants) {
  const parCle = new Map(), supprimer = [];
  for (const x of existants) {
    const p = x.ev && x.ev.extendedProperties && x.ev.extendedProperties.private;
    if (!p || p.carnet !== '1' || !p.cle) continue;
    if (parCle.has(p.cle)) supprimer.push(x); else parCle.set(p.cle, x);
  }
  const creer = [], modifier = [];
  for (const v of voulus) {
    const ex = parCle.get(v.cle);
    parCle.delete(v.cle);
    if (!ex) { creer.push(v); continue; }
    if (ex.calId !== v.calId) { supprimer.push(ex); creer.push(v); continue; }
    if (different(ex.ev, v.corps)) modifier.push({ ...v, id: ex.ev.id });
  }
  for (const ex of parCle.values()) supprimer.push(ex);
  return { creer, modifier, supprimer };
}
