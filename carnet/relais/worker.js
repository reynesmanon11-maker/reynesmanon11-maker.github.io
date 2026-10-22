// Relais iCal FACULTATIF (Cloudflare Workers, offre gratuite).
//
// Pourquoi : un navigateur n'a pas le droit de lire directement un lien iCal de Pronote (le
// serveur de Pronote ne l'autorise pas aux autres sites). Avec Google, ce n'est pas un problème :
// c'est Google Agenda qui va lire Pronote. Sans compte Google, ou pour avoir l'emploi du temps
// plus frais que les 8 à 24 h de Google, ce relais va chercher le fichier à la place du navigateur.
//
// Ce qu'il fait : il ne relaie QUE des liens iCal Pronote (https, *.index-education.net, /ical/),
// ne garde rien, n'écrit aucun journal, et ne répond qu'aux adresses de l'appli listées ci-dessous.
// Le lien iCal contient une clé secrète : n'utilisez qu'un relais que vous avez déployé vous-même.
//
// Déploiement : dash.cloudflare.com → Workers → Créer → coller ce fichier → Déployer, puis mettre
// l'adresse du relais dans config.js (relaisIcal).

const ORIGINES = [
  'https://reynesmanon11-maker.github.io', // à remplacer par l'adresse de l'appli
  'http://127.0.0.1:8080',
];
const HOTES = /\.index-education\.net$/i; // ajouter ici le domaine d'un Pronote auto-hébergé

export default {
  async fetch(requete) {
    const origine = requete.headers.get('Origin') || '';
    const entetes = { 'Access-Control-Allow-Origin': ORIGINES.includes(origine) ? origine : ORIGINES[0], Vary: 'Origin' };
    if (requete.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...entetes, 'Access-Control-Allow-Methods': 'GET' } });
    if (requete.method !== 'GET') return new Response('Méthode refusée', { status: 405, headers: entetes });
    let cible;
    try { cible = new URL(new URL(requete.url).searchParams.get('url') || ''); } catch {
      return new Response('Lien invalide', { status: 400, headers: entetes });
    }
    if (cible.protocol !== 'https:' || !HOTES.test(cible.hostname) || !/\/ical\//i.test(cible.pathname)) {
      return new Response('Seuls les liens iCal de Pronote sont relayés', { status: 403, headers: entetes });
    }
    const r = await fetch(cible.toString(), { headers: { 'User-Agent': 'CarnetDeBord-relais' } });
    return new Response(r.body, {
      status: r.status,
      headers: { ...entetes, 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300' },
    });
  },
};
