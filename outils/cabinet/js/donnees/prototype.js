// Le nouveau décor du cabinet (prototype) : une pièce modelée dans Blender, meublée de vrais modèles
// (Poly Haven, Smithsonian, CC0) et dont la lumière est précalculée (voir modeles/cabinet/LISEZ-MOI.md).
// Ici, ce que la page doit savoir de ce décor et qui n'est pas dans le fichier 3D.

/** Le décor choisi : 'prototype' (nouveau) ou 'actuel' (dessiné par le code). ?decor=… dans l'adresse
 *  force le choix ; sinon le réglage de l'aide, gardé sous sa propre clé (jamais avec la progression). */
export const CLE_DECOR = 'cabinet-curiosites-decor';
export function choisirDecor(){
  const force = new URLSearchParams(location.search).get('decor');
  if (force === 'prototype' || force === 'actuel') return {decor:force, force:true};
  let v = null;
  try { v = localStorage.getItem(CLE_DECOR); } catch(e){ /* navigation privée */ }
  return {decor: v === 'actuel' ? 'actuel' : 'prototype', force:false};
}
export function enregistrerDecor(v){ try { localStorage.setItem(CLE_DECOR, v); } catch(e){ /* navigation privée */ } }

export const DOSSIER = 'modeles/cabinet/';

/** Le soleil de l'après-midi, plus rasant que celui du décor dessiné : c'est lui qui a été cuit. */
export const SOLEIL = [-0.5, 0.45, 0.75];

/** Ce qui change de place : l'établi est plus haut que l'ancienne table (0,92 m au lieu de 0,78). */
export const PLACES = {
  microscope: {p:[-0.55, 1.125, -0.05], ry:0.55}
};

/** Les étiquettes du cabinet : indice dans la planche d'étiquettes (procedural/textures.js), repère, largeur.
 *  Mêmes places que dans le décor dessiné, sauf l'enseigne de la serre, au-dessus de la nouvelle porte. */
export function etiquettes(T, ETIQ_SERRE){
  return [
    {i:ETIQ_SERRE, M:T(5.944, 3.306, 0).ry(-Math.PI/2), w:0.66},
    {i:0, M:T(4.25, 0.758, -2.25).ry(-1.08).t(0, 0, 0.31).rx(-1.25), w:0.16},
    {i:2, M:T(3.995, 0.38, 3.4).ry(-Math.PI/2), w:0.24},
    {i:3, M:T(1.0, 1.925, -3.996), w:0.18},
    {i:4, M:T(1.95, 1.425, -3.996), w:0.18},
    {i:5, M:T(2.7, 0.85, -3.947), w:0.18},
    {i:10, M:T(-3.0, 0.868, 3.93).ry(Math.PI).rx(-1.25), w:0.22}
  ];
}

/** Les flammes du foyer : [x, y, z, taille]. */
export const FLAMMES = [
  [-5.93, 0.16, -0.18, 4.2], [-5.97, 0.15, 0.04, 5.0], [-5.92, 0.17, 0.2, 3.6], [-6.02, 0.2, -0.05, 3.2], [-5.95, 0.15, 0.1, 4.4]
];

/** Où les sondes photographient la pièce : chaque objet éclairé par sonde prend la plus proche. */
export const SONDES = [
  [0.0, 1.35, 0.0],      // au-dessus de l'établi
  [1.8, 1.5, -3.55],     // devant la vitrine
  [-3.2, 1.4, -3.4],     // bibliothèque de gauche
  [4.5, 1.4, -3.3],      // bibliothèque de droite, guéridon
  [-4.9, 1.4, 0.4],      // cheminée
  [-2.6, 1.3, 3.6],      // verrière de gauche, médaillier
  [1.5, 1.3, 3.6],       // bureau
  [4.7, 1.2, 3.2]        // coffre
];

/** Réglages de la lumière cuite : gain d'exposition (la cuisson est en unités physiques) et
 *  intensité du soleil pour les objets mobiles, accordée à celle de la cuisson. */
export const LUMIERE = {gain:2.6, soleil:3.2};
