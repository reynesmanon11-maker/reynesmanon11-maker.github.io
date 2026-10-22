// L'état de l'appli et ses calculs dérivés.
//   docs   : les données de l'enseignant (synchronisées entre appareils)
//   local  : les préférences de CET appareil (thème, disposition du tableau de bord, mode)
//   brut   : les derniers événements lus (Pronote, agendas perso), gardés pour le hors-ligne
import { lire, ecrire as ecrireStockage } from './stockage.js';
import { vue, fusionner, purger, fusionImport } from './donnees.js';
import { interpreter, deduireNoms, niveauDe } from './pronote.js';
import { construireCreneaux, planifier, coupures, dureeSeanceProbable } from './moteur.js';
import { FUSEAU_APPAREIL, aujourdhui, lundiDe, jourDe } from './dates.js';

export const LOCAL_DEFAUT = {
  theme: 'light', accent: 'vert', densite: 'confort',
  disposition: null,
  mode: null,
  ics: { url: '' },
  vueSemaine: null,
  persoVisible: true,
  installPlusTard: 0,
  compte: null,
  derniereLecture: null,
  derniereEcriture: null,
};

export const etat = {
  pret: false,
  docs: {},
  local: { ...LOCAL_DEFAUT },
  brut: { pronote: [], perso: [], agendas: {}, lu: null },
  synchro: { etat: 'repos', message: '' },
  sale: false,
  durable: true,
  version: 0,
};

const abonnes = new Set();
export const abonner = (fn) => { abonnes.add(fn); return () => abonnes.delete(fn); };
let memo = null, prevu = false;
export const surModification = { appel: null };

export function changer() {
  etat.version++;
  memo = null;
  if (prevu) return;
  prevu = true;
  const lancer = () => { prevu = false; abonnes.forEach((f) => f()); };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(lancer); else queueMicrotask(lancer);
}

// On écrit tout de suite (regroupé à la fin de l'instruction en cours, pas plus tard) : un
// téléphone peut fermer la page juste après « Enregistrer », la validation ne doit pas se perdre.
let sauvegardePrevue = false;
function sauver() {
  if (sauvegardePrevue) return;
  sauvegardePrevue = true;
  queueMicrotask(() => {
    sauvegardePrevue = false;
    ecrireStockage('docs', etat.docs);
    ecrireStockage('local', etat.local);
  });
}
if (typeof addEventListener === 'function') {
  addEventListener('pagehide', () => { ecrireStockage('docs', etat.docs); ecrireStockage('local', etat.local); });
}

export async function charger() {
  const [docs, local, brut] = await Promise.all([lire('docs'), lire('local'), lire('brut')]);
  if (docs && typeof docs === 'object') etat.docs = docs;
  if (local && typeof local === 'object') etat.local = { ...LOCAL_DEFAUT, ...local };
  if (brut && typeof brut === 'object') etat.brut = { ...etat.brut, ...brut };
  etat.pret = true;
  changer();
}

// ---------- Écritures ----------
const vivant = (d) => d && !d._x;

export function ecrireDoc(chemin, donnees) {
  etat.docs[chemin] = { ...donnees, _m: Date.now() };
  etat.sale = true;
  sauver(); changer();
  if (surModification.appel) surModification.appel(chemin);
}

export function modifierDoc(chemin, fn) {
  const actuel = etat.docs[chemin];
  const d = vivant(actuel) ? structuredClone(actuel) : {};
  delete d._m;
  fn(d);
  ecrireDoc(chemin, d);
}

export function supprimerDoc(chemin) {
  etat.docs[chemin] = { _x: 1, _m: Date.now() };
  etat.sale = true;
  sauver(); changer();
  if (surModification.appel) surModification.appel(chemin);
}

export function fusionnerDocs(autres) {
  etat.docs = purger(fusionner(etat.docs, autres));
  sauver(); changer();
}

/** Un import choisi par l'utilisateur : voir fusionImport. */
export function importerDocs(importes) {
  etat.docs = purger(fusionImport(etat.docs, importes));
  etat.sale = true;
  sauver(); changer();
  if (surModification.appel) surModification.appel('import');
}

export function remplacerDocs(docs) {
  etat.docs = docs;
  etat.sale = true;
  sauver(); changer();
}

export function reglerLocal(patch) {
  etat.local = { ...etat.local, ...patch };
  sauver(); changer();
}

export function definirBrut(patch) {
  etat.brut = { ...etat.brut, ...patch };
  ecrireStockage('brut', etat.brut);
  changer();
}

export function definirSynchro(etatSynchro, message = '') {
  etat.synchro = { etat: etatSynchro, message };
  changer();
}

export const reglages = () => vue(etat.docs).reglages;
export const modifierReglages = (fn) => modifierDoc('reglages', fn);

// ---------- Calculs dérivés ----------

/** Tout ce que les vues lisent, recalculé seulement quand l'état change. */
export function calc() {
  if (memo) return memo;
  const v = vue(etat.docs);
  const fuseau = v.reglages.fuseau || FUSEAU_APPAREIL;
  const cours = (etat.brut.pronote || []).map((e) => interpreter(e)).filter(Boolean);
  const dureeSeance = Number(v.reglages.dureeSeance) || dureeSeanceProbable(cours);
  const exclus = v.reglages.exclus || [];
  const tousCreneaux = construireCreneaux(cours, { fuseau, dureeSeance, exclus });
  const creneaux = tousCreneaux.filter((c) => v.classes[c.code] && !v.classes[c.code].masquee);
  const inconnus = [...new Set(tousCreneaux.filter((c) => !v.classes[c.code]).map((c) => c.code))];
  const maintenant = new Date();
  const auj = aujourdhui(fuseau);
  const plan = planifier(v, creneaux, { auj, maintenant, delaiAnnonce: Number(v.reglages.annonceJours) || 7 });
  memo = {
    v, fuseau, cours, creneaux, tousCreneaux, inconnus, plan, auj, maintenant, dureeSeance,
    coupures: coupures(cours, tousCreneaux),
    etablissement: cours.filter((c) => c.type === 'etablissement'),
    perso: etat.local.persoVisible ? (etat.brut.perso || []) : [],
  };
  return memo;
}

export const nomClasse = (code, v = calc().v) => (v.classes[code] && v.classes[code].nom) || code;
export const niveauClasse = (code, v = calc().v) => (v.classes[code] && v.classes[code].niveau) || niveauDe(code, nomClasse(code, v));

/** Variable CSS de couleur d'un niveau : choisie dans les réglages, sinon celle du thème. */
export function couleurNiveau(niveau, v = calc().v) {
  const perso = v.reglages.couleurs && v.reglages.couleurs[niveau];
  return perso || `var(--n-${niveau || 'Autre'})`;
}

/** Les classes que Pronote fait apparaître, avec de quoi les présenter au démarrage. */
export function classesDetectees() {
  const { cours, fuseau } = calc();
  const noms = deduireNoms(cours);
  const par = {};
  for (const c of cours) {
    if (c.type !== 'cours') continue;
    const x = (par[c.code] ||= { code: c.code, nom: noms[c.code] || c.code, cours: 0, demi: false, inclusions: new Set(), matieres: new Set(), semaines: new Set() });
    x.cours++;
    if (c.demi) x.demi = true;
    (c.inclusions || []).forEach((i) => x.inclusions.add(i));
    if (c.matiere) x.matieres.add(c.matiere);
    x.semaines.add(lundiDe(jourDe(c.debut, fuseau)));
  }
  return Object.values(par).map((x) => ({
    code: x.code, nom: x.nom, niveau: niveauDe(x.code, x.nom), demi: x.demi,
    inclusions: [...x.inclusions], matieres: [...x.matieres],
    parSemaine: Math.round((x.cours / Math.max(1, x.semaines.size)) * 10) / 10 || x.cours,
  })).sort((a, b) => a.niveau.localeCompare(b.niveau) || a.nom.localeCompare(b.nom));
}
