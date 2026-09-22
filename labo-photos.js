/* ATTENTION — après toute modification de ce fichier, changer le jeton ?v= des
   balises <script> qui l'appellent, dans les pages HTML. Sans cela le
   navigateur des élèves garde l'ancienne version pendant des heures : GitHub
   Pages demande de la conserver dix minutes, et le disque la garde plus
   longtemps encore. Un simple rechargement ne suffit pas toujours. */
/* =============================================================================
   PHOTOS DES MANIPULATIONS

   Les laboratoires montrent des simulations. Une photo de la vraie paillasse
   dit ce qu'aucune simulation ne dit : à quoi ça ressemble pour de bon, et
   donc ce qu'il faut observer.

   Ce fichier ne touche à rien dans les pages de labo : il lit un petit
   répertoire, puis va poser un bouton « Photo » sur les lignes du catalogue
   qui en ont une. Les deux labos dessinent leurs lignes avec les mêmes
   classes (.exp et .num), ce qui suffit à les retrouver.

   Pourquoi un répertoire plutôt que tâtonner fichier par fichier : le
   catalogue de biologie compte plus de deux cents manipulations, et aller
   demander au serveur si chacune a une photo ferait deux cents requêtes à
   chaque ouverture de page. Un seul petit fichier répond pour toutes.

   Le répertoire est écrit par l'espace de gestion. Format :
     { "vegetal": { "1.2": [ {"f":"images/labo/vegetal/1-2-1.jpg","lg":"…"} ] },
       "geologie": { "A1": [ … ] } }

   Les photographies de roches du labo de géologie, elles, suivent une autre
   convention — images/roches/<id>-<n>.jpg — déjà gérée par cette page.
   ============================================================================= */
(function () {
  'use strict';

  const LABO = /labo_geologie/.test(location.pathname) ? 'geologie'
             : /labo_vegetal/.test(location.pathname) ? 'vegetal' : null;
  if (!LABO) return;

  let repertoire = null;
  let vue = null;

  /* ---------------------------------------------------------------- styles */
  const style = document.createElement('style');
  style.textContent = `
  .photo-manip{ position:fixed; inset:0; z-index:99999; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:14px; padding:24px;
    background:rgba(8,10,14,.93); animation:pmEntre .18s ease }
  @keyframes pmEntre{ from{ opacity:0 } to{ opacity:1 } }
  @media (prefers-reduced-motion:reduce){ .photo-manip{ animation:none } }
  .photo-manip img{ max-width:min(100%,1100px); max-height:74vh; object-fit:contain;
    border-radius:10px; background:#111; box-shadow:0 24px 60px rgba(0,0,0,.5) }
  .photo-manip figcaption{ max-width:62ch; text-align:center; color:#e8e4dc; font-size:14px;
    line-height:1.6; font-family:system-ui,-apple-system,'Segoe UI',sans-serif }
  .photo-manip .titre{ color:rgba(255,255,255,.62); font-size:12px; letter-spacing:.08em;
    text-transform:uppercase; font-family:system-ui,sans-serif; text-align:center }
  .photo-manip .fermer{ position:absolute; top:16px; right:16px; width:40px; height:40px;
    border-radius:999px; border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.08);
    color:#fff; font-size:22px; line-height:1; cursor:pointer }
  .photo-manip .fermer:hover{ background:rgba(255,255,255,.18) }
  .photo-manip .fermer:focus-visible{ outline:2px solid #cf8047; outline-offset:2px }
  .photo-manip .nav{ display:flex; gap:10px; align-items:center }
  .photo-manip .nav button{ padding:6px 14px; border-radius:999px; cursor:pointer;
    border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.08); color:#fff;
    font-size:13px; font-family:system-ui,sans-serif }
  .photo-manip .nav button:hover{ background:rgba(255,255,255,.18) }
  .photo-manip .nav span{ color:rgba(255,255,255,.6); font-size:12px; font-family:system-ui,sans-serif }
  .btn-photo-manip{ background:#f3efe7 !important; border-color:#e0d6c4 !important; color:#8a4519 !important }`;
  document.head.appendChild(style);

  /* ------------------------------------------------------------ visionneuse */
  function fermer() {
    if (!vue) return;
    document.removeEventListener('keydown', auClavier);
    vue.remove(); vue = null;
  }
  function auClavier(e) {
    if (!vue) return;
    if (e.key === 'Escape') fermer();
    else if (e.key === 'ArrowRight') vue._aller(1);
    else if (e.key === 'ArrowLeft') vue._aller(-1);
  }

  function ouvrir(photos, titre, num) {
    fermer();
    let i = 0;
    vue = document.createElement('figure');
    vue.className = 'photo-manip';
    vue.setAttribute('role', 'dialog');
    vue.setAttribute('aria-modal', 'true');
    vue.setAttribute('aria-label', 'Photographie de la manipulation ' + num);
    vue.innerHTML =
      '<button class="fermer" aria-label="Fermer">&times;</button>' +
      '<p class="titre"></p>' +
      '<img alt="" />' +
      '<figcaption></figcaption>' +
      (photos.length > 1 ? '<div class="nav"><button data-p="-1">← Précédente</button>' +
        '<span></span><button data-p="1">Suivante →</button></div>' : '');

    const img = vue.querySelector('img');
    const leg = vue.querySelector('figcaption');
    const compteur = vue.querySelector('.nav span');
    vue.querySelector('.titre').textContent = num + ' — ' + titre;

    /* Le repertoire stocke des chemins depuis la racine du site, mais les labos
       vivent dans /outils/ : sans la barre oblique initiale, le navigateur irait
       chercher l'image dans /outils/images/... */
    const racine = (c) => /^(https?:)?\//.test(c) ? c : '/' + c;

    function montrer() {
      const p = photos[i];
      img.src = racine(p.f);
      img.alt = p.lg || ('Photographie de la manipulation ' + num + ' : ' + titre);
      leg.textContent = p.lg || '';
      leg.style.display = p.lg ? '' : 'none';
      if (compteur) compteur.textContent = (i + 1) + ' / ' + photos.length;
    }
    vue._aller = (d) => { if (photos.length < 2) return; i = (i + d + photos.length) % photos.length; montrer(); };
    montrer();

    img.addEventListener('error', () => { leg.style.display = ''; leg.textContent = "Cette photo n'a pas pu être chargée."; });
    vue.querySelector('.fermer').addEventListener('click', fermer);
    vue.querySelectorAll('[data-p]').forEach(b =>
      b.addEventListener('click', (e) => { e.stopPropagation(); vue._aller(+b.dataset.p); }));
    vue.addEventListener('click', (e) => { if (e.target === vue) fermer(); });
    document.addEventListener('keydown', auClavier);
    document.body.appendChild(vue);
    vue.querySelector('.fermer').focus();
  }

  /* ------------------------------------------------------------- décoration */
  function decorer() {
    if (!repertoire) return;
    document.querySelectorAll('.exp').forEach(ligne => {
      if (ligne.querySelector('.btn-photo-manip')) return;
      const num = ligne.querySelector('.num');
      if (!num) return;
      const photos = repertoire[num.textContent.trim()];
      if (!photos || !photos.length) return;
      const titre = (ligne.querySelector('.titre') || {}).textContent || '';
      const b = document.createElement('button');
      /* On reprend les classes du labo pour que le bouton ait l'air d'y appartenir,
         `no-print` compris : une photo n'a pas sa place sur un protocole imprimé. */
      b.className = 'btn mini no-print btn-photo-manip';
      b.type = 'button';
      b.textContent = photos.length > 1 ? 'Photos (' + photos.length + ')' : 'Photo';
      b.title = 'Voir la photo de la vraie paillasse';
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        ouvrir(photos, titre.trim(), num.textContent.trim());
      });
      const page = ligne.querySelector('.page');
      if (page) ligne.insertBefore(b, page); else ligne.appendChild(b);
    });
  }

  fetch('/images/labo/photos.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      repertoire = (d && d[LABO]) || null;
      if (!repertoire) return;
      decorer();
      /* Le catalogue est redessiné à chaque recherche et à chaque filtre :
         on redécore ce qui apparaît, sans avoir à toucher à leur code. */
      const cible = document.querySelector('#cat-liste') || document.body;
      new MutationObserver(() => decorer()).observe(cible, { childList: true, subtree: true });
    })
    .catch(() => { /* pas de répertoire : les labos fonctionnent comme avant */ });
})();
