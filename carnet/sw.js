// Service worker : l'appli s'ouvre même sans réseau (en classe, le Wi-Fi est capricieux).
// Les fichiers de l'appli viennent du cache, mis à jour en arrière-plan ; Google et Pronote
// ne sont jamais mis en cache ici (données personnelles, jetons).
const VERSION = 'carnet-0.7.4-1';
const FICHIERS = [
  './', 'index.html', 'confidentialite.html', 'manifest.webmanifest', 'config.js', 'css/app.css',
  'js/avant.js', 'js/app.js', 'js/actions.js', 'js/ui.js', 'js/stockage.js', 'js/etat.js', 'js/dates.js',
  'js/ics.js', 'js/pronote.js', 'js/moteur.js', 'js/donnees.js', 'js/demo.js', 'js/dnd.js',
  'js/google.js', 'js/agenda.js', 'js/synchro.js', 'js/installation.js', 'js/qr.js',
  'js/tableur.js', 'js/programmation.js', 'js/identite.js',
  'js/vues/commun.js', 'js/vues/accueil.js', 'js/vues/semaine.js', 'js/vues/classes.js', 'js/vues/taches.js',
  'js/vues/reglages.js', 'js/vues/demarrer.js', 'js/vues/creneau.js', 'js/vues/partage.js', 'js/vues/importlien.js',
  'js/vues/programmation.js', 'js/vues/cahier.js', 'js/vues/rendezvous.js',
  'polices/onest-latin.woff2', 'polices/onest-latin-ext.woff2',
  'icones/logo.svg', 'icones/logo-192.png', 'icones/logo-512.png', 'icones/logo-masquable-512.png', 'icones/logo-180.png', 'icones/favicon.svg', 'icones/favicon-32.png',
];

self.addEventListener('install', (e) => {
  // « reload » : une nouvelle version se remplit au serveur, jamais au cache HTTP du navigateur
  // (GitHub Pages garde les fichiers dix minutes) — sinon elle pourrait garder l'ancienne icône.
  // La nouvelle version prend la main tout de suite : sinon elle attendrait que toutes les fenêtres
  // du Carnet soient fermées — une appli installée ne l'est presque jamais.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const enCache = await cache.match(e.request, { ignoreSearch: true });
    const reseau = fetch(e.request, { cache: 'no-cache' }).then((r) => {
      if (r.ok && r.type === 'basic') cache.put(e.request, r.clone());
      return r;
    }).catch(() => null);
    if (enCache) { e.waitUntil(reseau); return enCache; }
    const r = await reseau;
    if (r) return r;
    if (e.request.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }));
});
