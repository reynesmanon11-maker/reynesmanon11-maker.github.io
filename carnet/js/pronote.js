// Ce que raconte un événement de l'export iCal de Pronote.
//
// Forme réelle relevée dans un emploi du temps de collège (via Google Agenda) :
//   titre       « SCIENCES VIE & TERRE - [5G3P2] - <5G3> 5G3P2 »          demi-groupe
//               « SCIENCES VIE & TERRE - 5G1 »                             classe entière
//               « SCIENCES VIE & TERRE - <5G3> 503_G, <5G3> 503_ULIS X »   classe + élèves d'ULIS
//   description « Matière : … / Professeur : … / Classe : 5G1 / Groupe : [5G3P2] /
//                 Partie de classe : <5G3> 5G3P2 / Parties de classe : … / Salle : 107 /
//                 Accompagnant : Mme … »  — avec des entités HTML (&amp; &lt; &gt;) côté Google.
//   journées    « Vacances », « PARCOURS CITOYEN: … » ; événements sans matière : « Heure de com' ».
// Les champs de la description sont la source la plus sûre ; le titre sert de secours quand
// un établissement exporte sans description.
import { ajouteJours, jourDe } from './dates.js';

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function decoderEntites(s) {
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, e) => {
    const k = e.toLowerCase();
    if (k in ENTITES) return ENTITES[k];
    if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
    if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10));
    return tout;
  });
}

// Seules ces balises sont retirées : « <5G3> » ressemble à une balise mais c'est une classe.
const BALISES_HTML = /<\/?(?:a|b|i|u|s|em|strong|span|p|div|ul|ol|li|font|html|body|br|hr|small|big|sup|sub)\b[^<>]*>/gi;

/** Texte lisible d'une description qui peut contenir du HTML (Google) ou des entités. */
export function texteBrut(s) {
  // On retire les balises AVANT de décoder les entités : « &lt;5G3&gt; » doit survivre.
  return decoderEntites(String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(BALISES_HTML, ''))
    .replace(/\r\n?/g, '\n');
}

export const sansAccents = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const uniques = (t) => [...new Set(t)];

/** Un événement de l'API Google Agenda → la forme commune de l'appli. */
export function depuisGoogle(ev, fuseau) {
  const journee = !!(ev.start && ev.start.date && !ev.start.dateTime);
  const res = {
    id: ev.id,
    titre: decoderEntites(ev.summary || ''),
    description: texteBrut(ev.description || ''),
    lieu: decoderEntites(ev.location || ''),
    statut: ev.status || 'confirmed',
    journee,
    debut: null, fin: null, jour0: null, jour1: null,
  };
  if (journee) {
    res.jour0 = String(ev.start.date).slice(0, 10);
    const fin = ev.end && ev.end.date ? String(ev.end.date).slice(0, 10) : res.jour0;
    res.jour1 = ajouteJours(fin, -1);
    if (res.jour1 < res.jour0) res.jour1 = res.jour0;
  } else if (ev.start && ev.start.dateTime) {
    res.debut = new Date(ev.start.dateTime);
    res.fin = new Date((ev.end && ev.end.dateTime) || ev.start.dateTime);
    res.jour0 = jourDe(res.debut, fuseau);
    res.jour1 = jourDe(new Date(Math.max(res.debut.getTime(), res.fin.getTime() - 1)), fuseau);
  } else return null;
  return res;
}

/** « Clé : valeur » de chaque ligne de la description ; clés sans accents, en minuscules. */
export function lireChamps(description) {
  const champs = {};
  for (const ligne of texteBrut(description).split('\n')) {
    const m = ligne.match(/^\s*([^:\n]{2,40}?)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const cle = sansAccents(m[1]).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!(cle in champs)) champs[cle] = m[2];
  }
  return champs;
}

/** « <5G3> 503_G, <5G3> 503_ULIS GALVANI » → [{ classe: '5G3', nom: '503_G' }, …] */
export function lireParties(valeur) {
  return String(valeur || '').split(/\s*,\s*/).map((s) => {
    const m = s.trim().match(/^<([^<>]+)>\s*(.*)$/);
    return m ? { classe: m[1].trim(), nom: m[2].trim() } : { classe: null, nom: s.trim() };
  }).filter((p) => p.nom || p.classe);
}

// Pas de \b ici : dans « 503_ULIS », le trait bas compte comme une lettre pour \b.
const MOT_INCLUSION = /(?:^|[^a-z])(ULIS|UPE2A|SEGPA|UEEA|UEMA|IME|ITEP|DISPOSITIF)(?![a-z])/i;
const MOTIF_DEMI = /^(?:P|G|GR|GRP|GROUPE|DEMI|DG)\s*\d+$|^\d$/i;

function statutDe(ev, champs) {
  const texte = [champs.statut, champs.etat, ev.titre].filter(Boolean).join(' · ');
  const annule = ev.statut === 'cancelled'
    || /\bannul/i.test(champs.statut || '')
    || /^\s*\[?\s*(cours\s+)?annul/i.test(ev.titre || '')
    || /^\s*cours\s+annul/i.test(ev.description || '')
    || /prof\.?\s*absent|absence\s+(du\s+)?prof|classe\s+absente/i.test(texte);
  let info = '';
  if (champs.statut) info = champs.statut;
  else if (/prof\.?\s*absent/i.test(texte)) info = 'Prof. absent';
  else if (/classe\s+absente/i.test(texte)) info = 'Classe absente';
  else if (annule) info = 'Cours annulé';
  else if (/exceptionnel|modifi[ée]|d[ée]plac[ée]|remplacement|changement de salle/i.test(texte)) {
    info = texte.match(/exceptionnel|cours modifi[ée]|d[ée]plac[ée]|remplacement|changement de salle/i)[0];
  }
  return { annule, info };
}

/**
 * Classe un événement Pronote : « cours », « vacances » ou « etablissement » (réunion,
 * information, journée banalisée). Un cours reçoit son code de classe (l'unité dont on suit
 * la progression), son éventuel demi-groupe et ce qui est utile en classe.
 */
export function interpreter(ev) {
  if (!ev) return null;
  const titre = ev.titre || '';
  if (ev.journee || !ev.debut) {
    const type = /vacances|cong[ée]s|f[ée]ri[ée]|\bpont\b|fermeture/i.test(sansAccents(titre)) ? 'vacances' : 'etablissement';
    return { ...ev, type };
  }
  const champs = lireChamps(ev.description);
  const morceaux = titre.split(/\s+-\s+/);
  const matiere = champs.matiere || (morceaux.length > 1 ? morceaux[0].trim() : '');
  const reste = morceaux.slice(1).join(' - ');
  // Sans ligne « Matière », on ne lit le titre que s'il n'y a pas de description du tout :
  // « Conseil de classe - 3G4 » ressemble à un cours mais n'en est pas un.
  const ressembleCours = !!champs.matiere
    || (!String(ev.description || '').trim() && morceaux.length > 1
      && !/conseil|r[ée]union|rencontre|parents|formation|examen|brevet|sortie/i.test(sansAccents(titre))
      && /<[^>]+>|\[[^\]]+\]|^\s*[0-9A-Z]{2,8}\s*$/.test(reste));
  if (!ressembleCours) return { ...ev, type: 'etablissement' };

  let groupe = champs.groupe || champs.groupes || (reste.match(/\[([^\]]+)\]/) || [])[1] || '';
  groupe = groupe.replace(/^\[|\]$/g, '').trim();
  const partieUnique = champs['partie de classe'];
  const textePartie = champs['parties de classe'] || partieUnique
    || (/<[^>]+>/.test(reste) ? reste.replace(/\[[^\]]*\]\s*(-\s*)?/g, '') : '');
  const parties = lireParties(textePartie);
  const classesParties = uniques(parties.map((p) => p.classe).filter(Boolean));
  const champClasse = champs.classe || champs.classes || '';

  let code = '';
  if (classesParties.length === 1) code = classesParties[0];
  else if (champClasse && !/,/.test(champClasse)) code = champClasse.trim();
  else if (groupe) code = groupe;
  else if (classesParties.length > 1) code = classesParties.join('+');
  else if (champClasse) code = champClasse.split(/\s*,\s*/).join('+');
  else code = reste.replace(/[<>[\]]/g, '').trim();
  if (!code) return { ...ev, type: 'etablissement' };

  // Demi-groupe : une seule partie de la classe, nommée comme un groupe (P1, G2, groupe 1…).
  let demi = false, sousGroupe = '';
  if (parties.length === 1 && parties[0].classe === code) {
    const nom = parties[0].nom;
    let suffixe = nom.toUpperCase().startsWith(code.toUpperCase()) ? nom.slice(code.length) : nom;
    suffixe = suffixe.replace(/^[\s_.-]+/, '');
    if (MOTIF_DEMI.test(suffixe) || (partieUnique && !MOT_INCLUSION.test(nom))) {
      demi = true;
      sousGroupe = MOTIF_DEMI.test(suffixe) ? suffixe.toUpperCase() : nom;
    }
  }
  const inclusions = uniques(parties.filter((p) => MOT_INCLUSION.test(p.nom))
    .map((p) => p.nom.replace(/^[^_]*_/, '').trim()));
  const { annule, info } = statutDe(ev, champs);

  // Nom affiché par l'établissement, deviné d'une partie « 503_G » rattachée à « <5G3> ».
  let nomSuggere = '';
  // « 5G3P2 » commence par le code : c'est un sous-groupe, pas un autre nom de la classe.
  for (const p of parties) {
    const tete = p.nom.split(/[_\s]/)[0];
    if (p.classe === code && tete && !tete.toUpperCase().startsWith(code.toUpperCase()) && /^[0-9A-Z]{2,6}$/i.test(tete)) {
      nomSuggere = tete; break;
    }
  }

  return {
    ...ev,
    type: 'cours',
    matiere: matiere.trim(),
    code,
    demi,
    groupe: sousGroupe,
    parties: parties.map((p) => p.nom),
    inclusions,
    salle: (champs.salle || champs.salles || ev.lieu || '').trim(),
    accompagnant: (champs.accompagnant || champs.accompagnants || '').trim(),
    professeur: (champs.professeur || champs.professeurs || '').trim(),
    annule,
    statutPronote: info,
    nomSuggere,
  };
}

/** Niveau scolaire déduit d'un code ou d'un nom de classe. */
export function niveauDe(code, nom) {
  for (const s of [nom, code]) {
    const t = sansAccents(s || '').toUpperCase().trim();
    if (!t) continue;
    let m = t.match(/^([3-6])(?:E|EME|IEME)?\b|^([3-6])[A-Z0-9]/);
    if (m) return `${m[1] || m[2]}e`;
    if (/^(2\b|2N|2D|SECONDE|2[A-Z0-9])/.test(t)) return '2nde';
    if (/^(1\b|1R|PREM|1[A-Z0-9])/.test(t)) return '1re';
    if (/^(T\b|TLE|TERM|T[A-Z0-9])/.test(t)) return 'Tle';
  }
  return 'Autre';
}

/**
 * Noms affichés pour chaque code de classe. Une suggestion trouvée dans les parties
 * (« <5G3> 503_G » → 503) sert aussi de règle pour les codes de même forme : 6G2 → 602.
 */
export function deduireNoms(cours) {
  const noms = {}, regles = [], votes = {};
  for (const c of cours) {
    if (c.type !== 'cours' || !c.nomSuggere) continue;
    const v = (votes[c.code] ||= {});
    v[c.nomSuggere] = (v[c.nomSuggere] || 0) + 1;
  }
  for (const [code, v] of Object.entries(votes)) {
    const nom = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
    noms[code] = nom;
    const a = code.match(/^(\d)([A-Z]+)(\d+)$/i), b = nom.match(/^(\d)(0*)(\d+)$/);
    if (a && b && a[1] === b[1] && a[3] === b[3]) regles.push({ lettres: a[2].toUpperCase(), zeros: b[2] });
  }
  for (const c of cours) {
    if (c.type !== 'cours' || noms[c.code]) continue;
    const a = c.code.match(/^(\d)([A-Z]+)(\d+)$/i);
    const r = a && regles.find((x) => x.lettres === a[2].toUpperCase());
    noms[c.code] = r ? `${a[1]}${r.zeros}${a[3]}` : c.code;
  }
  return noms;
}

/** Un lien iCal de Pronote ? (https://xxxx.index-education.net/pronote/ical/…) */
export function estLienIcal(texte) {
  const t = String(texte || '').trim();
  return /^(https?|webcal):\/\/\S+$/i.test(t) && /ical|\.ics(\?|$)/i.test(t);
}

/** Le QR code de connexion de l'application mobile Pronote (identifiant + jeton) ? */
export function estQrConnexionPronote(texte) {
  const t = String(texte || '').trim();
  if (!t.startsWith('{')) return false;
  try { const o = JSON.parse(t); return !!(o && (o.jeton || o.login) && o.url); } catch { return false; }
}
