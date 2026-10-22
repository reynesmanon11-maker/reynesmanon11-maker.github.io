// Les données de l'enseignant : un ensemble de documents indépendants, rangés par chemin
// (« classes/5G3 », « etapes/e5-x1 », « journal/5G3_20261102_0920 »…). Chaque document porte
// sa date de modification (_m). Deux appareils se mettent d'accord document par document :
// le plus récent l'emporte, et une suppression laisse une pierre tombale (_x) le temps que
// tous les appareils l'aient vue. Fusionner deux fois, ou dans un autre ordre, donne le même
// résultat : un téléphone hors ligne en classe peut valider ses cours et rattraper plus tard.
import { positionDe, arretDe } from './moteur.js';

export const VERSION_DONNEES = 1;
const JOUR_MS = 864e5;

/** Le plus récent des deux, document par document. */
export function fusionner(a = {}, b = {}) {
  const res = { ...a };
  for (const [chemin, doc] of Object.entries(b)) {
    const ici = res[chemin];
    if (!ici || (doc && (doc._m || 0) > (ici._m || 0))) res[chemin] = doc;
  }
  return res;
}

/** Retire les pierres tombales plus vieilles que « jours ». */
export function purger(docs, maintenant = Date.now(), jours = 90) {
  const res = {};
  for (const [k, d] of Object.entries(docs)) {
    if (d && d._x && maintenant - (d._m || 0) > jours * JOUR_MS) continue;
    res[k] = d;
  }
  return res;
}

export const identiques = (a, b) => JSON.stringify(trier(a)) === JSON.stringify(trier(b));
function trier(o) {
  if (Array.isArray(o)) return o.map(trier);
  if (o && typeof o === 'object') return Object.keys(o).sort().reduce((r, k) => { r[k] = trier(o[k]); return r; }, {});
  return o;
}

/** Les documents vivants, rangés par collection, tels que le moteur les attend. */
export function vue(docs) {
  const v = { reglages: {}, classes: {}, etapes: {}, journal: {}, taches: {}, coches: {}, notes: '' };
  for (const [chemin, d] of Object.entries(docs)) {
    if (!d || d._x) continue;
    if (chemin === 'reglages') { v.reglages = d; continue; }
    if (chemin === 'notes') { v.notes = d.texte || ''; continue; }
    const k = chemin.indexOf('/');
    if (k < 0) continue;
    const coll = chemin.slice(0, k), id = chemin.slice(k + 1);
    if (v[coll] && typeof v[coll] === 'object') v[coll][id] = d;
  }
  return v;
}

export const nouvelId = (prefixe = '') => prefixe + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Une sauvegarde lisible et réimportable. */
export function exporter(docs) {
  return JSON.stringify({ format: 'carnet-de-bord', version: VERSION_DONNEES, exporte: new Date().toISOString(), docs }, null, 1);
}

/**
 * Lit une sauvegarde : celle de cette appli, ou les données du « Carnet de bord SVT » de
 * claude.ai (collections classes, seances, journal, taches, suivi/coches, reglages).
 * Renvoie des documents prêts à fusionner, horodatés « maintenant ».
 */
export function importer(texte, maintenant = Date.now()) {
  const o = typeof texte === 'string' ? JSON.parse(texte) : texte;
  if (o && o.format === 'carnet-de-bord' && o.docs) return { docs: o.docs, origine: 'carnet-de-bord' };
  if (o && (o.seances || o.classes)) return { docs: depuisCarnetClaude(o, maintenant), origine: 'carnet-claude' };
  throw new Error("Ce fichier n'est ni une sauvegarde du Carnet de bord, ni un export du carnet SVT.");
}

/**
 * Le carnet de claude.ai notait, à chaque séance, la part faite de chaque étape. On rejoue
 * ces parts dans l'ordre du temps pour retrouver, après chaque séance, le point d'arrêt.
 */
export function depuisCarnetClaude(o, maintenant = Date.now()) {
  const docs = {};
  const m = maintenant;
  const seances = o.seances || {};
  for (const [sid, s] of Object.entries(seances)) {
    docs[`etapes/${sid}`] = {
      titre: s.titre || 'Étape', niveau: s.niveau || '', duree: Number(s.duree) || 1,
      format: s.format || 'indiff', eval: !!s.eval, afaire: s.afaire || '', pronote: s.pronote || '',
      jalons: [], photocopies: 0, _m: m,
    };
  }
  const journal = o.journal || {};
  for (const [code, cl] of Object.entries(o.classes || {})) {
    const file = (cl.file || []).filter((it) => seances[it.sid]).map((it) => ({ u: it.u, eid: it.sid }));
    const duree = (it) => Math.max(0.25, Number(seances[it.eid].duree) || 1);
    const fait = {};
    (cl.file || []).forEach((it) => { fait[it.u] = Number(it.fait) || 0; });
    const position = () => {
      for (let i = 0; i < file.length; i++) {
        const f = (fait[file[i].u] || 0) / duree(file[i]);
        if (f < 1 - 1e-6) return { i, f: Math.max(0, f) };
      }
      return { i: file.length, f: 0 };
    };
    docs[`classes/${code}`] = {
      code, nom: cl.nom || code, niveau: cl.niveau || `${String(code)[0]}e`,
      effectif: 0, file, depart: arretDe(position(), file), annonces: cl.annonces || {}, _m: m,
    };
    const entrees = Object.entries(journal).filter(([, j]) => j && j.code === code).sort(([a], [b]) => a.localeCompare(b));
    for (const [cle, j] of entrees) {
      for (const x of j.items || []) if (x.u in fait) fait[x.u] += Number(x.h) || 0;
      const jour = (cle.match(/_(\d{4})(\d{2})(\d{2})_/) || []).slice(1).join('-');
      docs[`journal/${cle}`] = { code, jour, arret: arretDe(position(), file), note: j.note || '', le: j.le || '', _m: m };
    }
  }
  for (const [id, t] of Object.entries(o.taches || {})) docs[`taches/${id}`] = { ...t, _m: m };
  const coches = (o.suivi && o.suivi.coches && o.suivi.coches.c) || (o.coches && o.coches.c) || {};
  for (const id of Object.keys(coches)) docs[`coches/${id}`] = { fait: true, _m: m };
  if (o.reglages && o.reglages.general && o.reglages.general.debut) docs.reglages = { debut: o.reglages.general.debut, _m: m };
  return docs;
}

/** Position actuelle d'une classe, sous forme stockable. */
export function arretActuel(plan, code) {
  const pc = plan.parClasse[code];
  return pc ? arretDe(pc.position, pc.file) : null;
}

export { positionDe };
