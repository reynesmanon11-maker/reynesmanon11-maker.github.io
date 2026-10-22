// Dates et heures, toujours lues dans un fuseau explicite.
// Un jour se manipule sous la forme « AAAA-MM-JJ » : on compare et on trie des chaînes,
// on ajoute des jours en UTC pour ne jamais tomber dans un changement d'heure.

export const FUSEAU_APPAREIL = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'; }
  catch { return 'Europe/Paris'; }
})();

const formats = new Map();
function morceaux(instant, fuseau) {
  let f = formats.get(fuseau);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: fuseau, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    formats.set(fuseau, f);
  }
  const o = {};
  for (const p of f.formatToParts(instant)) o[p.type] = p.value;
  if (o.hour === '24') o.hour = '00';
  return o;
}

/** « AAAA-MM-JJ » du jour où tombe l'instant, dans le fuseau donné. */
export function jourDe(instant, fuseau) {
  const p = morceaux(instant, fuseau);
  return `${p.year}-${p.month}-${p.day}`;
}

/** « HH:MM » de l'instant, dans le fuseau donné. */
export function heureDe(instant, fuseau) {
  const p = morceaux(instant, fuseau);
  return `${p.hour}:${p.minute}`;
}

/** Minutes écoulées depuis minuit, dans le fuseau donné. */
export function minutesDe(instant, fuseau) {
  const p = morceaux(instant, fuseau);
  return Number(p.hour) * 60 + Number(p.minute);
}

/** Écart, en minutes, entre l'heure du fuseau et l'heure UTC à cet instant. */
export function decalage(ms, fuseau) {
  const p = morceaux(new Date(ms), fuseau);
  const commeUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((commeUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** L'instant qui correspond à une heure d'horloge locale (jour « AAAA-MM-JJ », heure « HH:MM[:SS] »). */
export function instantDe(jour, heure, fuseau) {
  const [a, m, j] = jour.split('-').map(Number);
  const [h = 0, mi = 0, s = 0] = String(heure || '00:00').split(':').map(Number);
  const naif = Date.UTC(a, m - 1, j, h, mi, s);
  // Deux passes : la seconde corrige le cas où l'on a franchi un changement d'heure.
  let t = naif - decalage(naif, fuseau) * 60000;
  t = naif - decalage(t, fuseau) * 60000;
  return new Date(t);
}

export const enUtc = (jour) => { const [a, m, j] = jour.split('-').map(Number); return new Date(Date.UTC(a, m - 1, j)); };
export const versJour = (d) => d.toISOString().slice(0, 10);
export const ajouteJours = (jour, n) => { const d = enUtc(jour); d.setUTCDate(d.getUTCDate() + n); return versJour(d); };
export const ecartJours = (a, b) => Math.round((enUtc(b) - enUtc(a)) / 864e5);
/** 0 = lundi … 6 = dimanche. */
export const jourSemaine = (jour) => (enUtc(jour).getUTCDay() + 6) % 7;
export const lundiDe = (jour) => ajouteJours(jour, -jourSemaine(jour));
export const aujourdhui = (fuseau) => jourDe(new Date(), fuseau);

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const nomJour = (jour) => JOURS[jourSemaine(jour)];
/** « lundi 2 novembre » */
export const dateLongue = (jour) => { const d = enUtc(jour); return `${JOURS[jourSemaine(jour)]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`; };
/** « lun. 2 nov. » */
export const dateCourte = (jour) => { const d = enUtc(jour); return `${JOURS[jourSemaine(jour)].slice(0, 3)}. ${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]}`; };
/** « 2 nov. » */
export const jourMois = (jour) => { const d = enUtc(jour); return `${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]}`; };
/** « 9h20 » à partir de « 09:20 » — l'écriture des emplois du temps. */
export const heureLisible = (hhmm) => { const [h, m] = hhmm.split(':'); return `${Number(h)}h${m}`; };
/** « 1h15 », « 45 min » */
export const dureeLisible = (minutes) => {
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

/** « Aujourd'hui », « Demain », « Hier » ou la date courte. */
export function jourRelatif(jour, auj) {
  const e = ecartJours(auj, jour);
  if (e === 0) return "aujourd'hui";
  if (e === 1) return 'demain';
  if (e === -1) return 'hier';
  return dateCourte(jour);
}
