/* ============================================================================
   Affichage du bandeau « À voir, à lire », dans la colonne d'accueil.

   Les entrées défilent vers le haut, lentement. Le mouvement est celui du
   conteneur, avancé image par image, et non une animation CSS : la molette et
   le doigt agissent alors sur la même chose que le défilement automatique, au
   lieu de se battre avec lui. La liste est écrite deux fois, ce qui permet de
   revenir au début sans que la boucle se voie.

   Il s'arrête au survol et dès qu'une entrée reçoit le focus au clavier :
   viser une cible qui bouge est pénible, et impossible sans souris précise.
   ========================================================================== */
(function () {
  'use strict';

  const piste = document.getElementById('actus-piste');
  if (!piste || !window.ACTUALITES || !window.ACTUALITES.length) return;

  const cadre = piste.parentElement;
  const O = window.ACTUS_OUTILS;
  const ech = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function entree(a, copie) {
    const img = O.vignette(a);
    const src = O.source(a.h);
    /* referrerpolicy : la vignette vient de YouTube, inutile de lui dire depuis
       quelle page de quel élève elle est demandée. */
    const visuel = img
      ? `<img src="${ech(img)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"
             draggable="false" onerror="this.closest('.actu').classList.add('sans-image')" />`
      : '';
    return `<li class="actu${img ? '' : ' sans-image'}">
      <a href="${ech(a.h)}" target="_blank" rel="noopener"${copie ? ' tabindex="-1"' : ''}>
        <span class="vign">${visuel}</span>
        <span class="txt"><span class="tt">${ech(a.t)}</span><span class="src">${ech(src)}</span></span>
      </a></li>`;
  }

  const liste = (copie) =>
    `<ul class="actus-rail"${copie ? ' aria-hidden="true"' : ''}>`
    + window.ACTUALITES.map((a) => entree(a, copie)).join('') + '</ul>';

  /* La liste est répétée : c'est ce qui permet de revenir au début sans que la
     boucle se voie. Deux exemplaires suffisent tant que la carte est plus courte
     qu'une liste ; étirée jusqu'au bas de la colonne, elle peut la dépasser, et
     le défilement se bloquerait en butée. On en met donc assez pour que le
     retour au début ait toujours de quoi s'effectuer. */
  function remplir() {
    piste.innerHTML = liste(false) + liste(true);
    const rail = piste.querySelector('.actus-rail');
    const hRail = rail ? rail.getBoundingClientRect().height : 0;
    if (!hRail) return;
    const voulu = Math.max(2, Math.ceil(cadre.clientHeight / hRail) + 1);
    for (let k = 2; k < voulu; k++) piste.insertAdjacentHTML('beforeend', liste(true));
  }
  remplir();

  /* La hauteur de la carte suit celle de la colonne : si elle change, le nombre
     d'exemplaires nécessaires change aussi. */
  let hauteurConnue = cadre.clientHeight;
  new ResizeObserver(() => {
    if (Math.abs(cadre.clientHeight - hauteurConnue) < 8) return;
    hauteurConnue = cadre.clientHeight;
    const y = cadre.scrollTop;
    remplir();
    cadre.scrollTop = y;
  }).observe(cadre);

  const lent = window.matchMedia('(prefers-reduced-motion: reduce)');
  const VITESSE = 14;            // pixels par seconde : on doit pouvoir lire
  let precedent = 0;
  /* La position est tenue à part, en décimales. À cette vitesse l'avance par
     image vaut un quart de pixel : relue depuis scrollTop, que le navigateur
     arrondit, elle serait retombée sur elle-même et le bandeau n'aurait
     quasiment pas bougé. */
  let position = 0;

  /* Chaque raison d'arrêter a son état : un compteur se déséquilibrerait au
     premier événement manqué. Le focus est relu à chaque image et seulement
     s'il vient du clavier — sans quoi un clic sur une entrée laisserait le
     bandeau figé au retour sur la page. */
  let survol = false;
  function focusClavier() {
    const a = document.activeElement;
    if (!a || !cadre.contains(a)) return false;
    try { return a.matches(':focus-visible'); } catch (e) { return true; }
  }
  const arrete = () => survol || focusClavier() || document.hidden || lent.matches;

  const moitie = () => {
    const r = cadre.querySelector('.actus-rail');
    return r ? r.getBoundingClientRect().height : 0;
  };

  function image(t) {
    const dt = precedent ? Math.min((t - precedent) / 1000, 0.1) : 0;
    precedent = t;
    if (!arrete()) {
      /* Écart net avec notre compte : c'est qu'on a fait défiler à la main. */
      if (Math.abs(cadre.scrollTop - position) > 2) position = cadre.scrollTop;
      position += VITESSE * dt;
      const m = moitie();
      /* Arrivé au bout de la première liste, on revient de sa hauteur : la
         seconde est identique, le saut ne se voit pas. */
      if (m && position >= m) position -= m;
      cadre.scrollTop = position;
    } else {
      /* À l'arrêt, la molette reste libre : on suit ce qu'elle fait. */
      position = cadre.scrollTop;
    }
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);

  cadre.addEventListener('pointerenter', () => { survol = true; });
  cadre.addEventListener('pointerleave', () => { survol = false; });
})();
