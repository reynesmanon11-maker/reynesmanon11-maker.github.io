// Google : connexion (Google Identity Services, jeton d'accès dans le navigateur, sans serveur),
// Agenda (lecture des agendas abonnés, écriture dans les seuls agendas créés par l'appli) et
// Drive (un fichier caché, propre à l'appli, pour retrouver ses données sur chaque appareil).
//
// Autorisations demandées, les plus étroites possibles :
//   calendar.calendarlist.readonly  voir la liste des agendas (pour trouver celui de Pronote)
//   calendar.events.readonly        lire les cours et les rendez-vous — sans pouvoir les modifier
//   calendar.app.created            créer SES agendas « Carnet », leur donner une couleur, y écrire
//   drive.appdata                   un dossier caché, propre à l'appli, invisible dans Drive
// Le jeton vit en mémoire, une heure ; il n'est jamais écrit sur l'appareil.
import { CONFIG } from '../config.js';
import { chargerScript } from './ui.js';
import { installee, surAndroid, adresseAppli } from './installation.js';

export const PORTEES = [
  'openid', 'email',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/drive.appdata',
];
const CAL = 'https://www.googleapis.com/calendar/v3';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UP = 'https://www.googleapis.com/upload/drive/v3';

let jeton = null, expiration = 0, manquantes = [];

export class ErreurGoogle extends Error {
  constructor(code, message, statut) { super(message); this.code = code; this.statut = statut; }
}

export const googleConfigure = () => !!CONFIG.googleClientId;
export const connecte = () => !!jeton && Date.now() < expiration - 60000;
export const porteesManquantes = () => manquantes;
export function oublierJeton() { jeton = null; expiration = 0; }

const CLE_RETOUR = 'carnet-connexion-google', CLE_METHODE = 'carnet-methode-connexion';
const lireLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrireLocal = (k, v) => {
  try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* stockage refusé */ }
};

/**
 * Comment se connecter. Dans un onglet, et dans l'appli installée sur ordinateur, une fenêtre
 * Google s'ouvre par-dessus le Carnet. Dans l'appli installée sur Android, une telle fenêtre revient
 * mal : la page part plutôt chez Google, puis revient (« redirection »). Si l'une coince, on peut
 * choisir l'autre (le choix est gardé sur l'appareil).
 */
export function methodeConnexion() {
  const m = lireLocal(CLE_METHODE) || CONFIG.connexion;
  if (m === 'fenetre' || m === 'redirection') return m;
  return installee() && surAndroid() ? 'redirection' : 'fenetre';
}
export function changerMethodeConnexion() {
  const autre = methodeConnexion() === 'fenetre' ? 'redirection' : 'fenetre';
  ecrireLocal(CLE_METHODE, autre);
  return autre;
}

/**
 * Se connecter. En fenêtre : à appeler pendant un geste de l'utilisateur (sinon le navigateur la
 * bloque), et la promesse rend la main une fois connecté. En redirection : la page part chez Google
 * et la promesse ne rend jamais la main ; au retour, retourDeGoogle() dit quoi faire (`suite`).
 */
export async function connecter({ consentement = false, indice, suite = 'synchro' } = {}) {
  if (!googleConfigure()) throw new ErreurGoogle('non-configure', "La connexion Google n'est pas encore configurée pour cette adresse.");
  if (methodeConnexion() === 'redirection') return rediriger({ consentement, indice, suite });
  await chargerScript('https://accounts.google.com/gsi/client');
  const g = globalThis.google;
  if (!g || !g.accounts || !g.accounts.oauth2) throw new ErreurGoogle('gis', 'Le service de connexion Google ne répond pas.');
  return new Promise((ok, ko) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,
      scope: PORTEES.join(' '),
      include_granted_scopes: true,
      prompt: consentement ? 'consent' : '',
      ...(indice ? { login_hint: indice } : {}),
      callback: (r) => {
        if (!r || r.error) { ko(new ErreurGoogle(r && r.error || 'refus', (r && (r.error_description || r.error)) || 'Connexion refusée.')); return; }
        jeton = r.access_token;
        expiration = Date.now() + (Number(r.expires_in) || 3600) * 1000;
        manquantes = PORTEES.filter((p) => p.startsWith('https://') && !g.accounts.oauth2.hasGrantedAllScopes(r, p));
        ok({ manquantes });
      },
      error_callback: (e) => ko(new ErreurGoogle((e && e.type) || 'fenetre', e && e.type === 'popup_failed_to_open'
        ? 'Le navigateur a bloqué la fenêtre de connexion Google : autorisez les fenêtres pour cette page.'
        : 'Fenêtre de connexion fermée.')),
    });
    client.requestAccessToken();
  });
}

function rediriger({ consentement, indice, suite }) {
  const etat = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join('');
  ecrireLocal(CLE_RETOUR, JSON.stringify({ etat, suite, le: Date.now() }));
  const p = new URLSearchParams({
    client_id: CONFIG.googleClientId,
    redirect_uri: adresseAppli(),
    response_type: 'token',
    scope: PORTEES.join(' '),
    include_granted_scopes: 'true',
    state: etat,
  });
  if (consentement) p.set('prompt', 'consent');
  if (indice) p.set('login_hint', indice);
  location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${p}`);
  return new Promise(() => {}); // la page s'en va chez Google
}

/**
 * Au démarrage : la page revient-elle de chez Google (#access_token=… ou #error=…) ? Si oui, garde
 * le jeton en mémoire, retire tout de suite le jeton de l'adresse, et renvoie { suite, manquantes }
 * ou { suite, erreur }. Sinon, null. Un retour qui ne porte pas le numéro tiré au départ (state)
 * est refusé : il ne vient pas d'une connexion lancée par ce Carnet.
 */
export function retourDeGoogle() {
  const h = location.hash.slice(1);
  if (!/(^|&)(access_token|error)=/.test(h)) return null;
  const p = new URLSearchParams(h);
  let attendu = null;
  try { attendu = JSON.parse(lireLocal(CLE_RETOUR) || 'null'); } catch { attendu = null; }
  ecrireLocal(CLE_RETOUR, null);
  const suite = (attendu && attendu.suite) || 'synchro';
  history.replaceState(null, '', `${location.pathname}${location.search}#/${suite === 'demarrer' ? 'demarrer' : 'accueil'}`);
  if (!attendu || !p.get('state') || attendu.etat !== p.get('state') || Date.now() - attendu.le > 15 * 60000) return { suite, erreur: 'etat' };
  if (p.get('error') || !p.get('access_token')) return { suite, erreur: p.get('error') || 'refus' };
  jeton = p.get('access_token');
  expiration = Date.now() + (Number(p.get('expires_in')) || 3600) * 1000;
  const accordees = new Set((p.get('scope') || '').split(/\s+/));
  manquantes = PORTEES.filter((x) => x.startsWith('https://') && !accordees.has(x));
  return { suite, manquantes };
}

export function deconnecter() {
  const g = globalThis.google;
  if (jeton && g && g.accounts && g.accounts.oauth2) { try { g.accounts.oauth2.revoke(jeton, () => {}); } catch { /* déjà révoqué */ } }
  else if (jeton) {
    // Jeton obtenu par redirection : on le révoque sans charger la bibliothèque de Google.
    fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ token: jeton }) }).catch(() => {});
  }
  oublierJeton();
}

export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// Les refus de Google qui veulent dire « pas si vite » : on peut réessayer un peu plus tard.
const LIMITE = /rate ?limit|usage ?limits?|quota/i;
export const estLimite = (e) => !!e && (e.statut === 429 || (e.statut === 403 && LIMITE.test(e.message || '')));

async function api(url, { methode = 'GET', corps, params, brut, type } = {}) {
  if (!connecte()) throw new ErreurGoogle('jeton', 'La connexion Google a expiré.');
  const u = new URL(url);
  for (const [k, v] of Object.entries(params || {})) if (v != null && v !== '') u.searchParams.set(k, v);
  for (let essai = 0; ; essai++) {
    const r = await fetch(u, {
      method: methode,
      headers: { Authorization: `Bearer ${jeton}`, ...(corps != null ? { 'Content-Type': type || 'application/json' } : {}) },
      body: corps == null ? undefined : (brut ? corps : JSON.stringify(corps)),
    });
    if (r.status === 401) { oublierJeton(); throw new ErreurGoogle('jeton', 'La connexion Google a expiré.', 401); }
    const texte = await r.text();
    let json = null;
    try { json = texte ? JSON.parse(texte) : null; } catch { json = null; }
    const limite = r.status === 429 || r.status >= 500 || (r.status === 403 && LIMITE.test(texte));
    if (limite && essai < 3) { await attendre(700 * 2 ** essai + Math.random() * 300); continue; }
    if (!r.ok) {
      const msg = (json && json.error && json.error.message) || r.statusText || `Erreur ${r.status}`;
      throw new ErreurGoogle(r.status === 403 ? 'interdit' : r.status === 404 || r.status === 410 ? 'absent' : `http-${r.status}`, msg, r.status);
    }
    return json ?? (texte || null);
  }
}

async function toutesLesPages(url, params, cle = 'items') {
  const res = [];
  let page;
  for (let n = 0; n < 40; n++) {
    const r = await api(url, { params: { ...params, pageToken: page } });
    res.push(...((r && r[cle]) || []));
    page = r && r.nextPageToken;
    if (!page) return { elements: res, dernier: r };
  }
  return { elements: res, dernier: null };
}

// ---------- Compte ----------
export async function compte() {
  try { const r = await api('https://www.googleapis.com/oauth2/v3/userinfo'); return { email: r && r.email }; } catch { return { email: null }; }
}

// ---------- Agenda ----------
export async function listerAgendas() {
  const { elements } = await toutesLesPages(`${CAL}/users/me/calendarList`, { maxResults: 250 });
  return elements.map((c) => ({
    id: c.id, nom: c.summaryOverride || c.summary || c.id, description: c.description || '',
    couleur: c.backgroundColor || '', role: c.accessRole, principal: !!c.primary, cache: !!c.hidden, selectionne: c.selected !== false,
  }));
}

export async function listerEvenements(id, { timeMin, timeMax, prive } = {}) {
  const { elements, dernier } = await toutesLesPages(`${CAL}/calendars/${encodeURIComponent(id)}/events`, {
    timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: 2500, showDeleted: 'false',
    ...(prive ? { privateExtendedProperty: prive } : {}),
  });
  return { evenements: elements, maj: dernier && dernier.updated };
}

export const creerAgenda = (nom, description, fuseau) => api(`${CAL}/calendars`, { methode: 'POST', corps: { summary: nom, description, timeZone: fuseau } });
export const colorerAgenda = (id, fond, texte = '#ffffff') => api(`${CAL}/users/me/calendarList/${encodeURIComponent(id)}`, {
  methode: 'PATCH', params: { colorRgbFormat: 'true' }, corps: { backgroundColor: fond, foregroundColor: texte, selected: true },
});
export const supprimerAgenda = (id) => api(`${CAL}/calendars/${encodeURIComponent(id)}`, { methode: 'DELETE' });
export const creerEvenement = (cal, corps) => api(`${CAL}/calendars/${encodeURIComponent(cal)}/events`, { methode: 'POST', params: { sendUpdates: 'none' }, corps });
export const remplacerEvenement = (cal, id, corps) => api(`${CAL}/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(id)}`, { methode: 'PUT', params: { sendUpdates: 'none' }, corps });
export async function supprimerEvenement(cal, id) {
  try { await api(`${CAL}/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(id)}`, { methode: 'DELETE', params: { sendUpdates: 'none' } }); }
  catch (e) { if (e.code !== 'absent') throw e; }
}

// ---------- Drive : dossier caché de l'appli ----------
export async function trouverFichier(nom) {
  const r = await api(`${DRIVE}/files`, { params: { spaces: 'appDataFolder', q: `name='${nom}' and trashed=false`, fields: 'files(id,name,modifiedTime)', pageSize: 10 } });
  const f = (r && r.files) || [];
  return f.sort((a, b) => String(b.modifiedTime).localeCompare(String(a.modifiedTime)))[0] || null;
}
export const lireFichier = (id) => api(`${DRIVE}/files/${encodeURIComponent(id)}`, { params: { alt: 'media' } });
export async function creerFichier(nom, contenu) {
  const bord = `carnet${Math.random().toString(36).slice(2)}`;
  const corps = [
    `--${bord}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify({ name: nom, parents: ['appDataFolder'], mimeType: 'application/json' }),
    `--${bord}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify(contenu), `--${bord}--`, '',
  ].join('\r\n');
  return api(`${DRIVE_UP}/files`, { methode: 'POST', params: { uploadType: 'multipart', fields: 'id,modifiedTime' }, corps, brut: true, type: `multipart/related; boundary=${bord}` });
}
export const ecrireFichier = (id, contenu) => api(`${DRIVE_UP}/files/${encodeURIComponent(id)}`, {
  methode: 'PATCH', params: { uploadType: 'media', fields: 'id,modifiedTime' }, corps: JSON.stringify(contenu), brut: true, type: 'application/json; charset=UTF-8',
});

/** Exécute des tâches asynchrones, n à la fois. */
export async function parPaquets(taches, n = 4, surProgres) {
  let i = 0, faites = 0;
  const erreurs = [];
  const ouvrier = async () => {
    while (i < taches.length) {
      const t = taches[i++];
      try { await t(); } catch (e) { erreurs.push(e); if (e.code === 'jeton') throw e; }
      faites++;
      if (surProgres) surProgres(faites, taches.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, taches.length) }, ouvrier));
  return erreurs;
}
