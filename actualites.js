/* ============================================================================
   Le bandeau « À voir, à lire » de la page d'accueil.

   Une entrée = un titre, un lien, et une image facultative. Sans image, celle
   de la vidéo YouTube est retrouvée à partir du lien : rien à téléverser pour
   ajouter une vidéo. Se modifie depuis la page de gestion, onglet « Bandeau
   d'actualités ».
   ========================================================================== */

window.ACTUALITES = [
  { t: 'Les super-pouvoirs de notre microbiote', h: 'https://www.youtube.com/watch?v=TqyznGUuefo' },
  { t: 'Les futures épidémies que nous vivrons', h: 'https://www.youtube.com/watch?v=VJNt1AQ8p2A' },
  { t: 'Dirty biology', h: 'https://www.youtube.com/watch?v=WJ0f5wXETyg' },
  { t: 'Darwin chez les pokémons', h: 'https://youtu.be/OcKfWW7sAMk?si=EwL_6OZZSdLdxLbt' },
  { t: 'Les atouts de l’ADN synthétique pour stocker les données numériques', h: 'https://www.lemonde.fr/sciences/article/2024/09/03/les-atouts-de-l-adn-synthetique-pour-stocker-les-donnees-numeriques_6302640_1650684.html' },
  { t: 'Suivre l’actualité scientifique', h: 'https://youtube.com/@leblob_fr?si=1Vmq4BDFLd873EK5' },
];

/* Outils partagés entre le bandeau et la page de gestion, pour que les deux
   montrent exactement la même vignette. */
window.ACTUS_OUTILS = (function () {
  'use strict';

  /* L'identifiant d'une vidéo YouTube, quelle que soit la forme du lien :
     youtube.com/watch?v=…, youtu.be/…, /embed/…, /shorts/… */
  function videoYoutube(lien) {
    const h = String(lien || '');
    let m = h.match(/[?&]v=([A-Za-z0-9_-]{11})/)
         || h.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
         || h.match(/youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  /* L'image d'une entrée : celle qu'on a choisie, sinon celle de la vidéo. */
  function vignette(a) {
    if (a && a.img) return /^(https?:)?\//.test(a.img) ? a.img : '/' + a.img;
    const v = videoYoutube(a && a.h);
    return v ? 'https://i.ytimg.com/vi/' + v + '/hqdefault.jpg' : null;
  }

  /* De quoi habiller une entrée sans image : « lemonde.fr », « youtube.com ». */
  function source(lien) {
    try { return new URL(lien, location.href).hostname.replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  return { videoYoutube: videoYoutube, vignette: vignette, source: source };
})();
