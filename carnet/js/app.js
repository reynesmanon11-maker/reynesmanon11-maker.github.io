// Démarrage, navigation et rendu. Chaque changement d'état redessine la page courante ; un champ
// en cours de saisie n'est jamais écrasé (le rendu attend qu'on le quitte).
import { actions, brancher } from './actions.js';
import { html, icone, toast, fermerFeuille, redessinerFeuille, feuilleOuverte } from './ui.js';
import { etat, calc, charger, abonner, changer, reglerLocal, surModification, definirSynchro } from './etat.js';
import { stockageDurable } from './stockage.js';
import * as G from './google.js';
import { synchroniser, messageErreur } from './synchro.js';
import { rendreAccueil, surGlisser, enOrganisation } from './vues/accueil.js';
import { rendreSemaine } from './vues/semaine.js';
import { rendreClasses } from './vues/classes.js';
import { rendreTaches } from './vues/taches.js';
import { rendreCahier } from './vues/cahier.js';
import { rendreReglages, apparence } from './vues/reglages.js';
import { rendreDemarrer, reprendreConnexion } from './vues/demarrer.js';
import { ouvrirCreneau } from './vues/creneau.js';
import { activerGlisser } from './dnd.js';
import { surChangementInstallation } from './installation.js';
import './vues/partage.js';
import { proposerImportLien } from './vues/importlien.js';
import { CONFIG } from '../config.js';
import { identite } from './identite.js';
import { dateLongue, heureDe, heureLisible, jourDe } from './dates.js';

// Les mêmes rubriques, et les mêmes mots, que l'espace professeur de Pronote.
const VUES = { accueil: rendreAccueil, semaine: rendreSemaine, cahier: rendreCahier, classes: rendreClasses, taches: rendreTaches, reglages: rendreReglages, demarrer: rendreDemarrer };
const TITRES = { accueil: "Page d'accueil", semaine: 'Emploi du temps', cahier: 'Cahier de textes', classes: 'Progressions', taches: 'Mes travaux', reglages: 'Mes données', demarrer: 'Mise en route' };
const main = document.getElementById('vue');
let routePrecedente = '';

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [vue, param] = h.split('/');
  return { vue: VUES[vue] ? vue : 'accueil', param: param ? decodeURIComponent(param) : '' };
}

function appliquerApparence() {
  const r = document.documentElement, l = etat.local;
  if (l.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', l.theme || 'light');
  r.setAttribute('data-accent', l.accent || 'vert');
  r.setAttribute('data-densite', l.densite || 'confort');
  const sombre = l.theme === 'dark' || (l.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const b = document.getElementById('bouton-theme');
  if (b) {
    const t = sombre ? 'Revenir au thème clair' : 'Passer au thème sombre';
    b.setAttribute('aria-label', t); b.title = t;
    b.innerHTML = String(icone(sombre ? 'soleil' : 'lune'));
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(r).getPropertyValue('--papier').trim() || '#f3f6f1';
}

/** « le samedi 24 octobre à 15h39 », « aujourd'hui à 8h12 ». */
function quandLisible(ms) {
  const tz = calc().fuseau, d = new Date(ms);
  const jour = jourDe(d, tz), auj = jourDe(new Date(), tz);
  return `${jour === auj ? "aujourd'hui" : `le ${dateLongue(jour)}`} à ${heureLisible(heureDe(d, tz))}`;
}

function rendreEntete(vue) {
  document.body.classList.toggle('sans-nav', !etat.local.mode);
  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === vue) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  // L'identité, comme en tête de Pronote : établissement, espace professeur, nom.
  const id = document.getElementById('identite');
  if (id) {
    const { etablissement, nom } = etat.local.mode ? identite() : {};
    id.hidden = !etablissement && !nom;
    id.querySelector('b').textContent = etablissement || '';
    id.querySelector('span').textContent = nom ? `Espace professeur · ${nom}` : 'Espace professeur';
  }
  // La barre sous le menu : la rubrique, le réglage de la page d'accueil, la dernière synchronisation.
  const rubrique = document.getElementById('rubrique');
  if (rubrique) rubrique.textContent = TITRES[vue] || '';
  const perso = document.getElementById('bouton-personnaliser');
  if (perso) { perso.hidden = vue !== 'accueil'; perso.setAttribute('aria-pressed', String(enOrganisation())); }
  const derniere = document.getElementById('derniere-synchro');
  if (derniere) {
    const l = etat.local;
    derniere.textContent = l.mode === 'google' && l.derniereSynchro ? `Dernière synchronisation ${quandLisible(l.derniereSynchro)}`
      : l.mode === 'local' && etat.brut.lu ? `Emploi du temps lu ${quandLisible(etat.brut.lu)}`
      : l.mode === 'demo' ? 'Mode démo : un emploi du temps fictif' : '';
  }
  const p = document.getElementById('pastille-synchro');
  if (!p) return;
  const s = etat.synchro, mode = etat.local.mode;
  let etatP = s.etat, texte = s.message;
  if (mode === 'demo') { etatP = 'demo'; texte = 'Mode démo'; }
  else if (!mode) { etatP = 'repos'; texte = 'Pas encore configuré'; }
  else if (mode === 'local' && s.etat === 'repos') { etatP = 'ok'; texte = 'Sur cet appareil'; }
  else if (mode === 'google' && !G.connecte() && s.etat !== 'cours') { etatP = 'connexion'; texte = 'Se reconnecter à Google'; }
  if (!etat.durable && mode) texte += ' · non mémorisé';
  p.dataset.etat = etatP === 'connexion' ? 'erreur' : etatP;
  p.querySelector('.texte').textContent = texte || '…';
  p.title = mode === 'google' ? 'Toucher pour synchroniser' : texte;
}

// Un rendu remplace la page : on rend au champ qui avait le focus sa valeur, son curseur et son
// défilement, pour qu'une frappe en cours ne soit jamais perdue ni interrompue.
function capturerFocus() {
  const a = document.activeElement;
  if (!a || !a.id || !main.contains(a)) return null;
  const texte = a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|url|email|number|date)$/.test(a.type));
  return { id: a.id, texte, valeur: texte ? a.value : null, debut: texte ? a.selectionStart : null, fin: texte ? a.selectionEnd : null, defil: a.scrollTop };
}
function restaurerFocus(f) {
  if (!f) return;
  const el = document.getElementById(f.id);
  if (!el) return;
  if (f.texte && el.value !== f.valeur) el.value = f.valeur;
  el.focus({ preventScroll: true });
  if (f.texte && f.debut != null) { try { el.setSelectionRange(f.debut, f.fin); } catch { /* type sans sélection */ } }
  el.scrollTop = f.defil || 0;
}

function rendre() {
  if (!etat.pret) return;
  appliquerApparence();
  let r = route();
  if (!etat.local.mode && r.vue !== 'demarrer') { location.replace('#/demarrer'); r = { vue: 'demarrer', param: '' }; }
  rendreEntete(r.vue);
  const focus = capturerFocus();
  const cle = `${r.vue}/${r.param}`;
  const memeVue = cle === routePrecedente;
  const defilement = memeVue ? window.scrollY : 0;
  try {
    main.innerHTML = String(VUES[r.vue](r));
  } catch (e) {
    console.error(e);
    main.innerHTML = String(html`<div class="bandeau"><span><strong>Cet écran n'a pas pu s'afficher.</strong> ${e.message}</span><a class="btn mini" href="#/accueil">Accueil</a></div>`);
  }
  if (!memeVue) {
    document.title = `${TITRES[r.vue]} · Carnet de bord`;
    window.scrollTo(0, 0);
  } else {
    if (defilement) window.scrollTo(0, defilement);
    restaurerFocus(focus);
  }
  routePrecedente = cle;
  redessinerFeuille();
}

// ---------- Actions communes ----------
actions['fermer-feuille'] = () => fermerFeuille();
actions['theme'] = () => {
  const sombre = etat.local.theme === 'dark' || (etat.local.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  apparence({ theme: sombre ? 'light' : 'dark' });
};
actions['synchro'] = async () => {
  if (etat.local.mode === 'demo') { toast('Mode démo : rien à synchroniser.'); return; }
  if (!etat.local.mode) { location.hash = '#/demarrer'; return; }
  if (etat.local.mode === 'google' && !G.connecte()) {
    try { await G.connecter({ indice: etat.local.compte && etat.local.compte.email }); } catch (e) { toast(messageErreur(e)); return; }
  }
  await synchroniser();
  if (etat.synchro.etat === 'erreur') toast(etat.synchro.message);
};

// ---------- Synchronisation automatique ----------
let minuteurSynchro;
surModification.appel = () => {
  if (etat.local.mode !== 'google') return;
  clearTimeout(minuteurSynchro);
  minuteurSynchro = setTimeout(() => { if (G.connecte()) synchroniser(); }, 3000);
};

// ---------- Liens profonds : #valider=CLE et #creneau=CLE (depuis Google Agenda), #importer=… ----------
function lienProfond() {
  const imp = location.hash.match(/^#importer=([A-Za-z0-9_-]+)/);
  if (imp) {
    // Les données du lien ne restent ni dans l'adresse, ni dans l'historique.
    history.replaceState(null, '', '#/accueil');
    setTimeout(() => proposerImportLien(imp[1]), 50);
    return true;
  }
  const m = location.hash.match(/^#(valider|creneau)=([^&]+)/);
  if (!m) return false;
  const cle = decodeURIComponent(m[2]);
  history.replaceState(null, '', '#/accueil');
  setTimeout(() => ouvrirCreneau(cle, { valider: m[1] === 'valider' }), 50);
  return true;
}

// ---------- Retour de chez Google (connexion par redirection) ----------
async function apresRetourGoogle(r) {
  if (r.erreur) {
    toast(r.erreur === 'access_denied' ? 'Connexion Google annulée.'
      : r.erreur === 'etat' ? "Cette connexion Google n'a pas été lancée par le Carnet : elle est ignorée. Recommencez depuis le Carnet."
      : `Google n'a pas accordé la connexion (${r.erreur}).`);
    return;
  }
  if (r.suite === 'demarrer') { await reprendreConnexion(r.manquantes); return; }
  if (etat.local.mode === 'google') {
    await synchroniser();
    if (etat.synchro.etat === 'erreur') toast(etat.synchro.message);
  }
}

async function demarrer() {
  brancher(document);
  activerGlisser(main, { surFin: surGlisser });
  abonner(rendre);
  await charger();
  // Avant tout affichage : un jeton revenu de Google ne doit pas rester dans l'adresse.
  const retourGoogle = G.retourDeGoogle();
  etat.durable = await stockageDurable();
  if (CONFIG.apercu && !etat.local.mode) actions['demarrer-demo']();
  if (etat.local.mode === 'demo') definirSynchro('demo', 'Mode démo');
  lienProfond();
  rendre();
  window.addEventListener('hashchange', () => { if (!lienProfond()) { if (feuilleOuverte()) fermerFeuille(); rendre(); } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => appliquerApparence());
  // L'installation devient possible (ou vient d'avoir lieu) : le bouton « Installer » apparaît ou s'en va.
  surChangementInstallation(() => changer());
  // Le temps passe : « à valider », « en cours », la ligne rouge de l'heure.
  setInterval(() => { if (document.visibilityState === 'visible') changer(); }, 60 * 1000);
  // Synchronisation régulière tant que l'appli est ouverte et connectée.
  setInterval(() => { if (etat.local.mode === 'google' && G.connecte() && document.visibilityState === 'visible') synchroniser(); }, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') changer(); });
  window.addEventListener('online', () => { if (etat.local.mode === 'google' && G.connecte()) synchroniser(); });
  if (etat.local.mode === 'local' && etat.local.ics && etat.local.ics.url) synchroniser();
  if (retourGoogle) apresRetourGoogle(retourGoogle);
  // Dans un cadre isolé (aperçu intégré), le simple accès au service worker peut lever une erreur.
  let sw = null;
  try { if (location.protocol !== 'file:' && !CONFIG.apercu) sw = navigator.serviceWorker || null; } catch { /* pas de service worker */ }
  if (sw) {
    sw.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const n = reg.installing;
        if (!n) return;
        n.addEventListener('statechange', () => {
          if (n.state === 'installed' && sw.controller) {
            toast('Une nouvelle version du Carnet est prête.', { action: { libelle: 'Recharger', faire: () => location.reload() } });
          }
        });
      });
    }).catch(() => { /* aperçu sans service worker : l'appli marche en ligne */ });
  }
}

demarrer().catch((e) => {
  console.error(e);
  main.textContent = `Le Carnet n'a pas pu démarrer : ${e.message}`;
});
export { reglerLocal };
