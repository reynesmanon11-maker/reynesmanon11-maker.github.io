// Qui est connecté, et où : ce que Pronote affiche en tête de page (« COLLÈGE GALILÉE — Espace
// Professeurs — Mme … »). Réglé dans Mes données ; sinon deviné dans l'agenda exporté par Pronote,
// dont le nom porte souvent celui de l'enseignant (« Calendrier - DURAND M. - du … ») et la
// description, parfois, celui de l'établissement.
import { etat, reglages } from './etat.js';

const ETABLISSEMENT = /\b((?:coll[eè]ge|lyc[eé]e|lp|lpo|cit[eé] scolaire|erea|ensemble scolaire|institution|groupe scolaire)\b[^\n\r\-–—|,;()]{2,60})/i;

/** { nom, etablissement } d'après le nom et la description de l'agenda Pronote. */
export function deviner(nomAgenda = '', description = '') {
  const t = `${nomAgenda}\n${description}`;
  let nom = '';
  const m = String(nomAgenda).match(/^\s*(?:calendrier|emploi du temps|edt)\s*[-–—:]\s*(.+?)\s*(?:[-–—]\s*du\b|$)/i)
    || String(description).match(/calendrier\s+(.+?)\s+g[ée]n[ée]r[ée] par/i);
  if (m) nom = m[1].replace(/\s+/g, ' ').trim();
  const e = t.match(ETABLISSEMENT);
  const etablissement = e ? e[1].replace(/\s+/g, ' ').trim().replace(/\s+(semaines?|du|ann[ée]e)\b.*$/i, '') : '';
  return { nom: /pronote|index/i.test(nom) ? '' : nom.slice(0, 60), etablissement: etablissement.toUpperCase() };
}

export function identite() {
  const r = reglages(), src = r.source || {};
  const agenda = (etat.brut.agendas || {})[src.agendaPronote] || {};
  const devine = deviner(agenda.nom || etat.brut.nomIcal || '', agenda.description || '');
  return { nom: r.nomAffiche || devine.nom, etablissement: r.etablissement || devine.etablissement, devine };
}
