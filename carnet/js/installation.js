// Installer le Carnet comme une application, et savoir où il vit. Chrome et Edge (Android,
// Windows, Mac) annoncent qu'ils peuvent l'installer par l'événement « beforeinstallprompt » :
// on le garde pour proposer « Installer » au bon moment, d'un seul toucher. Safari sur iPhone
// n'a pas cet événement : on y montre le chemin (Partager → Sur l'écran d'accueil).
import { CONFIG } from '../config.js';

let invitation = null;
const ecouteurs = new Set();
const prevenir = () => ecouteurs.forEach((f) => f());

if (typeof addEventListener === 'function') { // pas dans Node, où tournent les tests du moteur
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; prevenir(); });
  addEventListener('appinstalled', () => { invitation = null; prevenir(); });
}

/** Appelle `f` quand l'installation devient possible, ou vient d'avoir lieu. */
export const surChangementInstallation = (f) => { ecouteurs.add(f); };

/** Ouvert depuis son icône, comme une application (et non dans un onglet du navigateur). */
export function installee() {
  try {
    if (navigator.standalone === true) return true;
    return ['standalone', 'window-controls-overlay', 'minimal-ui', 'fullscreen'].some((m) => matchMedia(`(display-mode: ${m})`).matches);
  } catch { return false; }
}

const agent = () => navigator.userAgent || '';
export const surIphone = () => /iphone|ipad|ipod/i.test(agent()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const surAndroid = () => /android/i.test(agent());

/**
 * Ce qu'on peut proposer ici : 'invitation' (le navigateur installe d'un toucher), 'iphone' (montrer
 * la marche à suivre), ou null (déjà installé, page d'aperçu, ou navigateur qui ne sait pas).
 */
export function installation() {
  if (CONFIG.apercu || installee()) return null;
  if (invitation) return 'invitation';
  if (surIphone()) return 'iphone';
  return null;
}

/** Lance l'installation proposée par le navigateur. Renvoie true si elle a été acceptée. */
export async function installer() {
  if (!invitation) return false;
  const e = invitation;
  invitation = null;
  prevenir();
  e.prompt();
  try { return (await e.userChoice).outcome === 'accepted'; } catch { return false; }
}

/** L'adresse du Carnet, sans ce qui suit # ni ? : celle de config.js, sinon celle de la page. */
export function adresseAppli() {
  if (CONFIG.urlPublique) return CONFIG.urlPublique;
  return `${location.origin}${location.pathname}`.replace(/index\.html$/, '');
}
