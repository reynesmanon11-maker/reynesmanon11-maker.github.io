// Lecture d'un fichier iCalendar (RFC 5545), juste ce qu'il faut pour un export Pronote :
// lignes repliées, paramètres entre guillemets, textes échappés, dates en UTC, en heure locale
// d'un fuseau (TZID) ou « flottantes », journées entières. Les répétitions (RRULE) ne sont pas
// développées : Pronote écrit chaque cours un par un. On les signale pour ne pas les perdre en silence.
import { instantDe, ajouteJours, jourDe } from './dates.js';

/** Recolle les lignes repliées (une fin de ligne suivie d'une espace ou d'une tabulation). */
export function deplier(texte) {
  return String(texte).replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '');
}

/** Défait l'échappement des valeurs texte : \n, \, , \; et \\. */
export function desechapper(v) {
  return String(v).replace(/\\([nN,;\\])/g, (_, c) => (c === 'n' || c === 'N') ? '\n' : c);
}

function decouperHorsGuillemets(s, sep) {
  const res = []; let cur = '', g = false;
  for (const c of s) {
    if (c === '"') { g = !g; cur += c; continue; }
    if (c === sep && !g) { res.push(cur); cur = ''; continue; }
    cur += c;
  }
  res.push(cur);
  return res;
}

function lireLigne(ligne) {
  let i = 0, g = false;
  for (; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') g = !g;
    else if (c === ':' && !g) break;
  }
  const [nom, ...brut] = decouperHorsGuillemets(ligne.slice(0, i), ';');
  const params = {};
  for (const p of brut) {
    const k = p.indexOf('=');
    if (k > 0) params[p.slice(0, k).toUpperCase()] = p.slice(k + 1).replace(/^"|"$/g, '');
  }
  return { nom: nom.trim().toUpperCase(), params, valeur: ligne.slice(i + 1) };
}

// Fuseaux Windows que l'on croise dans des exports, ramenés à leur nom IANA.
const FUSEAUX_WINDOWS = {
  'romance standard time': 'Europe/Paris',
  'w. europe standard time': 'Europe/Berlin',
  'central europe standard time': 'Europe/Budapest',
  'gmt standard time': 'Europe/London',
  'utc': 'UTC',
};

function fuseauValide(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

export function nettoyerTzid(tzid, defaut) {
  if (!tzid) return defaut;
  const brut = tzid.trim();
  const iana = brut.match(/[A-Za-z]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/);
  if (iana && fuseauValide(iana[0])) return iana[0];
  const w = FUSEAUX_WINDOWS[brut.toLowerCase()];
  if (w) return w;
  return fuseauValide(brut) ? brut : defaut;
}

/** Une valeur DTSTART/DTEND → { journee, jour } ou { journee: false, instant }. */
export function lireDate(valeur, params, fuseau) {
  const v = String(valeur).trim();
  if ((params && params.VALUE === 'DATE') || /^\d{8}$/.test(v)) {
    return { journee: true, jour: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` };
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!m) return null;
  const [, a, mo, j, h, mi, s = '00', z] = m;
  if (z) return { journee: false, instant: new Date(Date.UTC(+a, +mo - 1, +j, +h, +mi, +s)) };
  const tz = nettoyerTzid(params && params.TZID, fuseau);
  return { journee: false, instant: instantDe(`${a}-${mo}-${j}`, `${h}:${mi}:${s}`, tz) };
}

/** « PT55M », « PT1H30M », « P1D » → millisecondes. */
export function lireDuree(v) {
  const m = String(v).trim().match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const [, signe, w = 0, d = 0, h = 0, mi = 0, s = 0] = m;
  const ms = ((((+w * 7 + +d) * 24 + +h) * 60 + +mi) * 60 + +s) * 1000;
  return signe === '-' ? -ms : ms;
}

function finaliser(brut, fuseau) {
  const val = (k) => brut[k] ? desechapper(brut[k].valeur) : '';
  const d0 = brut.DTSTART ? lireDate(brut.DTSTART.valeur, brut.DTSTART.params, fuseau) : null;
  if (!d0) return null;
  let d1 = brut.DTEND ? lireDate(brut.DTEND.valeur, brut.DTEND.params, fuseau) : null;
  const uid = val('UID') || `sans-uid-${brut.DTSTART.valeur}-${val('SUMMARY')}`;
  const rid = brut['RECURRENCE-ID'] ? `_${brut['RECURRENCE-ID'].valeur}` : '';
  const ev = {
    id: uid + rid,
    titre: val('SUMMARY'),
    description: val('DESCRIPTION'),
    lieu: val('LOCATION'),
    statut: (val('STATUS') || 'CONFIRMED').toLowerCase(),
    repete: !!brut.RRULE,
    journee: d0.journee,
    debut: null, fin: null, jour0: null, jour1: null,
  };
  if (d0.journee) {
    ev.jour0 = d0.jour;
    // DTEND d'une journée entière est exclusif : le dernier jour couvert est la veille.
    ev.jour1 = d1 && d1.journee ? ajouteJours(d1.jour, -1) : d0.jour;
    if (ev.jour1 < ev.jour0) ev.jour1 = ev.jour0;
  } else {
    ev.debut = d0.instant;
    if (!d1 && brut.DURATION) d1 = { journee: false, instant: new Date(d0.instant.getTime() + lireDuree(brut.DURATION.valeur)) };
    ev.fin = d1 && !d1.journee ? d1.instant : d0.instant;
    ev.jour0 = jourDe(ev.debut, fuseau);
    ev.jour1 = jourDe(new Date(Math.max(ev.debut.getTime(), ev.fin.getTime() - 1)), fuseau);
  }
  return ev;
}

/**
 * Lit un texte iCalendar. Renvoie { nom, description, evenements, repetitions }.
 * Les événements ont la forme commune de l'appli : id, titre, description, lieu, statut,
 * journee, debut/fin (Date) ou jour0/jour1 (« AAAA-MM-JJ », jour1 inclus).
 */
export function lireIcs(texte, { fuseau = 'Europe/Paris' } = {}) {
  const lignes = deplier(texte).split('\n');
  const evenements = [];
  let courant = null, imbrication = 0, nom = '', description = '';
  for (const ligne of lignes) {
    if (!ligne.trim()) continue;
    const { nom: n, params, valeur } = lireLigne(ligne);
    const v = valeur.trim().toUpperCase();
    if (n === 'BEGIN') {
      if (v === 'VEVENT' && !courant) { courant = {}; imbrication = 0; }
      else if (courant) imbrication++;
      continue;
    }
    if (n === 'END') {
      if (v === 'VEVENT' && courant && !imbrication) {
        const ev = finaliser(courant, fuseau);
        if (ev) evenements.push(ev);
        courant = null;
      } else if (courant && imbrication) imbrication--;
      continue;
    }
    if (!courant) {
      if (n === 'X-WR-CALNAME') nom = desechapper(valeur);
      else if (n === 'X-WR-CALDESC') description = desechapper(valeur);
      continue;
    }
    if (imbrication) continue; // VALARM et compagnie
    if (!(n in courant)) courant[n] = { valeur, params };
  }
  return { nom, description, evenements, repetitions: evenements.filter((e) => e.repete).length };
}
