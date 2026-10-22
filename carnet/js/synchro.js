// Synchronisation : lire Pronote et les agendas perso, mettre les données en commun entre
// appareils (Google Drive), écrire le plan dans les agendas « Carnet ». Une seule synchronisation
// à la fois ; une modification pendant qu'elle tourne en relance une à la fin.
import { CONFIG } from '../config.js';
import * as G from './google.js';
import { etat, calc, definirBrut, definirSynchro, fusionnerDocs, modifierReglages, reglages, reglerLocal, niveauClasse } from './etat.js';
import { fusionner, purger, identiques, VERSION_DONNEES } from './donnees.js';
import { depuisGoogle, estLienIcal } from './pronote.js';
import { lireIcs } from './ics.js';
import { agendasVoulus, evenementsVoulus, comparer, DESCRIPTION_AGENDA } from './agenda.js';
import { FUSEAU_APPAREIL, aujourdhui, ajouteJours, lundiDe, instantDe, heureDe, heureLisible } from './dates.js';
import { adresseAppli } from './installation.js';

const FICHIER = 'carnet-de-bord.json';
let enCours = null, encore = false, fichierId = null, relance = null;

export const urlAppli = () => adresseAppli().replace(/[?#].*$/, '');
const fuseau = () => reglages().fuseau || FUSEAU_APPAREIL;

/** Lance une synchronisation (ou attend celle en cours, puis en relance une). */
export function synchroniser(options = {}) {
  if (enCours) { encore = true; return enCours; }
  enCours = (async () => {
    try { await executer(options); } finally {
      enCours = null;
      if (encore) { encore = false; setTimeout(() => synchroniser(), 300); }
    }
  })();
  return enCours;
}

async function executer({ ecriture = true } = {}) {
  const mode = etat.local.mode;
  if (mode === 'local') return lectureLocale();
  if (mode !== 'google') return;
  if (!G.connecte()) { definirSynchro('connexion', 'Se reconnecter à Google'); return; }
  definirSynchro('cours', 'Synchronisation…');
  try {
    await synchroDrive();
    await lireAgendas();
    let bilan = null;
    if (ecriture && reglages().ecriture && reglages().ecriture.actif) bilan = await ecrireAgendas();
    if (etat.sale) await synchroDrive();
    const h = heureLisible(heureDe(new Date(), fuseau()));
    reglerLocal({ derniereSynchro: Date.now() });
    if (bilan && bilan.enAttente) {
      // Google a refusé de créer un agenda de plus pour l'instant : on réessaie dans deux minutes.
      clearTimeout(relance);
      relance = setTimeout(() => synchroniser(), 2 * 60000);
      definirSynchro('ok', `À jour à ${h} · encore ${bilan.enAttente} agenda${bilan.enAttente > 1 ? 's' : ''} à créer : Google demande d'attendre, nouvel essai dans 2 minutes`);
    } else {
      definirSynchro('ok', bilan && bilan.total ? `À jour à ${h} · ${bilan.total} changement${bilan.total > 1 ? 's' : ''} dans l'agenda` : `À jour à ${h}`);
    }
  } catch (e) {
    // Gardé pour les réglages : de quoi comprendre ce qui s'est passé, même une fois le message parti.
    reglerLocal({ dernierIncident: { le: Date.now(), message: String(e.message || e).slice(0, 300), statut: e.statut || null } });
    if (e.code === 'jeton') definirSynchro('connexion', 'Se reconnecter à Google');
    else definirSynchro('erreur', messageErreur(e));
  }
}

export function messageErreur(e) {
  if (!e) return 'Erreur inconnue.';
  if (G.estLimite(e)) return "Google limite le nombre d'opérations pour l'instant : le Carnet réessaiera dans quelques minutes.";
  if (e.code === 'interdit') return `Google refuse l'accès (${e.message}). Reconnectez-vous en cochant toutes les autorisations.`;
  if (e.code === 'non-configure') return e.message;
  if (e.code === 'popup_failed_to_open') return "Le navigateur a bloqué la fenêtre de connexion Google.";
  if (e.code === 'popup_closed') return 'La fenêtre de connexion Google s’est fermée avant la fin.';
  if (e instanceof TypeError) return 'Pas de réseau : vos changements sont gardés sur cet appareil.';
  return e.message || String(e);
}

// ---------- Drive ----------

/**
 * Lit la sauvegarde du Drive et la fusionne ici, sans rien envoyer. À faire AVANT toute écriture
 * sur un nouvel appareil : sinon ses documents, plus récents, écraseraient ceux de l'autre.
 * Renvoie true si une sauvegarde existait.
 */
export async function recupererDrive() {
  const f = await G.trouverFichier(FICHIER);
  if (!f) return false;
  fichierId = f.id;
  const contenu = await G.lireFichier(f.id);
  const distant = (contenu && contenu.docs) || {};
  fusionnerDocs(distant);
  return Object.keys(distant).length > 0;
}

async function synchroDrive() {
  let f = fichierId ? { id: fichierId } : await G.trouverFichier(FICHIER);
  let distant = {};
  if (f) {
    fichierId = f.id;
    try {
      const contenu = await G.lireFichier(f.id);
      distant = (contenu && contenu.docs) || {};
    } catch (e) {
      if (e.code !== 'absent') throw e;
      fichierId = null; f = null;
    }
  }
  const fus = purger(fusionner(etat.docs, distant));
  if (!identiques(fus, etat.docs)) fusionnerDocs(distant);
  if (!f || !identiques(fus, distant)) {
    const contenu = { format: 'carnet-de-bord', version: VERSION_DONNEES, ecrit: new Date().toISOString(), docs: fus };
    if (f) await G.ecrireFichier(f.id, contenu);
    else { const n = await G.creerFichier(FICHIER, contenu); fichierId = n && n.id; }
  }
  etat.sale = false;
}

// ---------- Lecture ----------
export async function lireAgendas() {
  const r = reglages(), tz = fuseau();
  const liste = await G.listerAgendas();
  const agendas = Object.fromEntries(liste.map((a) => [a.id, { nom: a.nom, couleur: a.couleur, description: a.description, principal: a.principal, role: a.role }]));
  const lundi = lundiDe(aujourdhui(tz));
  const t = (j) => instantDe(j, '00:00', tz).toISOString();
  let pronote = etat.brut.pronote, pronoteMaj = etat.brut.pronoteMaj;
  const src = r.source || {};
  if (src.agendaPronote) {
    const res = await G.listerEvenements(src.agendaPronote, { timeMin: t(ajouteJours(lundi, -42)), timeMax: t(ajouteJours(lundi, 7 * 12)) });
    pronote = res.evenements.map((e) => depuisGoogle(e, tz)).filter(Boolean);
    pronoteMaj = res.maj || null;
  }
  const perso = [];
  for (const id of src.agendasPerso || []) {
    if (!agendas[id] || agendas[id].description === DESCRIPTION_AGENDA) continue; // les agendas du Carnet ne sont pas de la vie perso
    try {
      const res = await G.listerEvenements(id, { timeMin: t(ajouteJours(lundi, -7)), timeMax: t(ajouteJours(lundi, 7 * 6)) });
      for (const e of res.evenements) {
        const n = depuisGoogle(e, tz);
        if (n && e.status !== 'cancelled' && e.transparency !== 'transparent') perso.push({ ...n, agenda: agendas[id].nom });
      }
    } catch (e) { if (e.code === 'jeton') throw e; }
  }
  definirBrut({ pronote, perso, agendas, lu: Date.now(), pronoteMaj });
  return liste;
}

/** Les agendas qui ressemblent à un export Pronote, les plus probables d'abord. */
export function agendasPronote(liste) {
  const score = (a) => (/pronote|index.?education/i.test(`${a.description} ${a.nom}`) ? 2 : 0) + (/@import\.calendar\.google\.com$/.test(a.id) ? 1 : 0);
  return liste.filter((a) => score(a) > 0).sort((a, b) => score(b) - score(a));
}

// ---------- Écriture ----------
export async function ecrireAgendas({ surProgres } = {}) {
  const c = calc(), r = reglages(), e = r.ecriture || {}, tz = fuseau();
  const niveaux = [...new Set(c.creneaux.map((cr) => niveauClasse(cr.code, c.v)))].sort();
  const voulus = agendasVoulus(e, niveaux);
  const liste = Object.values(etat.brut.agendas || {}).length ? null : await G.listerAgendas();
  const connus = { ...(liste ? Object.fromEntries(liste.map((a) => [a.id, a])) : etat.brut.agendas) };
  const ids = { ...(e.calendriers || {}) };
  const couleurs = { ...(e.couleursAppliquees || {}) };
  // Chaque agenda est noté dès qu'il existe : si la suite échoue, la prochaine synchronisation le
  // reprend au lieu d'en créer un autre du même nom.
  const noter = () => modifierReglages((x) => { x.ecriture = { ...(x.ecriture || {}), calendriers: { ...ids }, couleursAppliquees: { ...couleurs } }; });
  const duCarnet = (id) => !!connus[id] && connus[id].description === DESCRIPTION_AGENDA && (connus[id].role || 'owner') === 'owner';
  let creations = 0, enAttente = 0;
  for (const a of voulus) {
    let id = ids[a.cle];
    if (id && !connus[id]) id = null; // supprimé par l'utilisateur dans Google Agenda
    if (!id) {
      // Un agenda du Carnet de ce nom existe déjà (synchronisation interrompue, autre appareil) : on le reprend.
      id = Object.keys(connus).find((k) => duCarnet(k) && connus[k].nom === a.nom) || null;
      if (!id) {
        if (enAttente) { enAttente++; continue; }
        try {
          // Google refuse les créations d'agendas trop rapprochées : on les espace.
          if (creations++) await G.attendre(2000);
          id = (await G.creerAgenda(a.nom, DESCRIPTION_AGENDA, tz)).id;
          connus[id] = { nom: a.nom, description: DESCRIPTION_AGENDA, role: 'owner' };
        } catch (err) {
          if (!G.estLimite(err)) throw err;
          enAttente++;
          continue;
        }
      }
      ids[a.cle] = id;
      delete couleurs[a.cle];
      noter();
    }
    if (couleurs[a.cle] !== a.couleur) {
      try { await G.colorerAgenda(id, a.couleur); couleurs[a.cle] = a.couleur; noter(); } catch (err) { if (err.code === 'jeton') throw err; }
    }
  }
  // Les doublons laissés par une synchronisation interrompue : même nom, même description, créés
  // par le Carnet. Leurs cours sont réécrits dans l'agenda gardé ; on les retire.
  const gardes = new Set(Object.values(ids));
  for (const k of Object.keys(connus)) {
    if (!duCarnet(k) || gardes.has(k) || !voulus.some((a) => a.nom === connus[k].nom)) continue;
    try { await G.supprimerAgenda(k); delete connus[k]; } catch (err) { if (err.code === 'jeton') throw err; }
  }

  const auj = aujourdhui(tz);
  const fenetre = { debut: ajouteJours(auj, -7), fin: ajouteJours(auj, 7 * (Number(e.semaines) || 6)), urlAppli: urlAppli() };
  const voulusEv = evenementsVoulus(c, e, fenetre).map((x) => ({ ...x, calId: ids[x.agenda] })).filter((x) => x.calId);
  const existants = [];
  for (const id of new Set(Object.values(ids))) {
    try {
      const res = await G.listerEvenements(id, {
        timeMin: instantDe(fenetre.debut, '00:00', tz).toISOString(),
        timeMax: instantDe(ajouteJours(fenetre.fin, 26 * 7), '00:00', tz).toISOString(),
        prive: 'carnet=1',
      });
      for (const ev of res.evenements) existants.push({ calId: id, ev });
    } catch (err) { if (err.code !== 'absent') throw err; }
  }
  const { creer, modifier, supprimer } = comparer(voulusEv, existants);
  const taches = [
    ...supprimer.map((x) => () => G.supprimerEvenement(x.calId, x.ev.id)),
    ...creer.map((x) => () => G.creerEvenement(x.calId, x.corps)),
    ...modifier.map((x) => () => G.remplacerEvenement(x.calId, x.id, x.corps)),
  ];
  const erreurs = await G.parPaquets(taches, 4, surProgres);
  if (erreurs.length) throw erreurs[0];
  reglerLocal({ derniereEcriture: Date.now() });
  return { creer: creer.length, modifier: modifier.length, supprimer: supprimer.length, total: taches.length, enAttente };
}

/** Retire du Google Agenda tout ce que le Carnet y a écrit, puis ses agendas. */
export async function toutRetirer() {
  const e = reglages().ecriture || {};
  for (const id of new Set(Object.values(e.calendriers || {}))) {
    try { await G.supprimerAgenda(id); } catch (err) { if (err.code === 'jeton') throw err; }
  }
  modifierReglages((x) => { x.ecriture = { ...(x.ecriture || {}), actif: false, calendriers: {}, couleursAppliquees: {} }; });
}

// ---------- Mode local : un lien iCal ou un fichier ----------
export async function lireLienIcal(url) {
  const lien = String(url).trim().replace(/^webcal:\/\//i, 'https://');
  if (!estLienIcal(lien)) throw new Error("Ce n'est pas un lien d'agenda (iCal).");
  let texte = null;
  try {
    const r = await fetch(lien, { cache: 'no-store' });
    if (r.ok) texte = await r.text();
  } catch { /* bloqué par le navigateur (CORS) : on essaie le relais */ }
  if (texte == null && CONFIG.relaisIcal) {
    const r = await fetch(`${CONFIG.relaisIcal}?url=${encodeURIComponent(lien)}`, { cache: 'no-store' });
    if (r.ok) texte = await r.text();
  }
  if (texte == null) {
    const e = new Error("Le navigateur n'a pas le droit de lire ce lien directement (Pronote ne l'autorise pas). Passez par Google Agenda, ou importez le fichier .ics.");
    e.code = 'cors';
    throw e;
  }
  return lireTexteIcal(texte);
}

export function lireTexteIcal(texte) {
  const tz = fuseau();
  const { nom, evenements, repetitions } = lireIcs(texte, { fuseau: tz });
  if (!evenements.length) throw new Error('Aucun événement dans ce fichier.');
  definirBrut({ pronote: evenements, lu: Date.now(), pronoteMaj: new Date().toISOString(), nomIcal: nom });
  return { nom, n: evenements.length, repetitions };
}

// « 212 événements lus (3 répétés, non développés). »
export const bilanLecture = ({ n, repetitions }) => `${n} événements lus${repetitions ? ` (${repetitions} répétés, non développés)` : ''}.`;

async function lectureLocale() {
  const url = etat.local.ics && etat.local.ics.url;
  if (!url) return;
  definirSynchro('cours', 'Lecture de Pronote…');
  try {
    await lireLienIcal(url);
    definirSynchro('ok', `Pronote lu à ${heureLisible(heureDe(new Date(), fuseau()))}`);
  } catch (e) {
    definirSynchro('erreur', e.code === 'cors' ? 'Lien Pronote illisible directement' : messageErreur(e));
  }
}
