/* ============================================================================
   Affichage du bandeau « À voir, à lire ».

   Le défilement est celui du conteneur lui-même, avancé image par image,
   plutôt qu'une animation CSS par `transform` : ainsi le doigt, la molette et
   la souris agissent sur la même chose que le défilement automatique, sans se
   battre avec lui. La liste est écrite deux fois, ce qui permet de revenir au
   début sans que la boucle se voie.

   Il s'arrête au survol et dès qu'une carte reçoit le focus au clavier : viser
   une cible qui bouge est pénible, et impossible pour qui n'a pas une souris
   précise.
   ========================================================================== */
(function () {
  'use strict';

  const piste = document.getElementById('actus-piste');
  if (!piste || !window.ACTUALITES || !window.ACTUALITES.length) return;

  const cadre = piste.parentElement;
  const O = window.ACTUS_OUTILS;
  const ech = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function carte(a, copie) {
    const img = O.vignette(a);
    const src = O.source(a.h);
    /* referrerpolicy : la vignette vient de YouTube, inutile de lui dire depuis
       quelle page de quel élève elle est demandée. */
    const visuel = img
      ? `<img src="${ech(img)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"
             draggable="false" onerror="this.closest('.actu').classList.add('sans-image')" />`
      : '';
    return `<li class="actu${img ? '' : ' sans-image'}">
      <a href="${ech(a.h)}" target="_blank" rel="noopener" draggable="false"${copie ? ' tabindex="-1"' : ''}>
        <span class="vign">${visuel}<span class="repli">${ech(src)}</span></span>
        <span class="tt">${ech(a.t)}</span>
        <span class="src">${ech(src)} &#8599;</span>
      </a></li>`;
  }

  const liste = (copie) =>
    `<ul class="actus-rail"${copie ? ' aria-hidden="true"' : ''}>`
    + window.ACTUALITES.map((a) => carte(a, copie)).join('') + '</ul>';

  /* La seconde liste est la même, en double. Elle est masquée aux lecteurs
     d'écran et retirée du parcours clavier : c'est un artifice d'affichage. */
  piste.innerHTML = liste(false) + liste(true);

  /* ---- avance automatique ------------------------------------------------ */
  const lent = window.matchMedia('(prefers-reduced-motion: reduce)');
  const VITESSE = 40;            // pixels par seconde : lisible sans agiter la page
  let position = 0;              // on garde le compte en décimales, scrollLeft arrondit
  let precedent = 0;

  /* Chaque raison d'arrêter a son état : un simple compteur se déséquilibrerait
     au premier événement manqué. Le focus est relu à chaque image plutôt que
     mémorisé, et seulement s'il vient du clavier : un clic sur une carte laisse
     le lien focalisé, et le bandeau serait resté figé au retour sur la page. */
  let survol = false, tire = false;
  function focusClavier() {
    const a = document.activeElement;
    if (!a || !cadre.contains(a)) return false;
    try { return a.matches(':focus-visible'); } catch (e) { return true; }
  }
  const arrete = () => survol || tire || focusClavier() || document.hidden || lent.matches;

  const moitie = () => {
    const r = cadre.querySelector('.actus-rail');
    return r ? r.getBoundingClientRect().width : 0;
  };

  function image(t) {
    const dt = precedent ? Math.min((t - precedent) / 1000, 0.1) : 0;
    precedent = t;
    if (!arrete()) {
      position = cadre.scrollLeft + VITESSE * dt;
      const m = moitie();
      /* Arrivé au bout de la première liste, on revient de sa largeur : la
         seconde est identique, le saut ne se voit pas. */
      if (m && position >= m) position -= m;
      cadre.scrollLeft = position;
    }
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);

  cadre.addEventListener('pointerenter', () => { survol = true; });
  cadre.addEventListener('pointerleave', () => { survol = false; relacher(); });
  /* ---- glisser à la souris -----------------------------------------------
     Au doigt, le défilement natif du conteneur suffit déjà. */
  let departX = 0, departScroll = 0, bouge = false;

  function relacher() {
    if (!tire) return;
    tire = false;
    cadre.classList.remove('tire');
  }

  cadre.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    /* Sans ceci, Chrome démarre son propre glisser-déposer du lien et le geste
       n'arrive jamais jusqu'ici. */
    e.preventDefault();
    tire = true; bouge = false;
    departX = e.clientX;
    departScroll = cadre.scrollLeft;
    cadre.classList.add('tire');
  });
  cadre.addEventListener('pointermove', (e) => {
    if (!tire) return;
    const d = e.clientX - departX;
    if (Math.abs(d) > 4) bouge = true;
    cadre.scrollLeft = departScroll - d;
  });
  cadre.addEventListener('pointerup', relacher);
  cadre.addEventListener('pointercancel', relacher);

  /* Un glissement ne doit pas ouvrir la vidéo qu'on avait sous le curseur. */
  cadre.addEventListener('click', (e) => {
    if (bouge) { e.preventDefault(); e.stopPropagation(); bouge = false; }
  }, true);
})();
