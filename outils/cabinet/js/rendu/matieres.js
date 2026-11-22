// Matières réalistes (PBR) des profils moyen et haut.
// Chaque matière du modelage (voir MATS dans procedural/geometrie.js) reçoit :
//   r       sa rugosité (0 = miroir, 1 = parfaitement mat)
//   m       son côté métallique (1 pour le laiton, 0 pour tout ce qui n'est pas du métal)
//   jeu     un jeu de textures photographiées (voir donnees/credits.js), s'il y en a un
//   ref     la teinte pour laquelle la photographie est « juste » : le modelage colore
//           ses meubles (noyer, acajou, ébène…) ; on garde ces nuances, rapportées à ref
//   teinte  un ajustement d'ensemble de la photographie, pour rester dans l'ambiance
//   velours un reflet de velours (profil haut seulement)
import * as THREE from 'three';
import { MATS } from '../procedural/geometrie.js';
import { TEXTURES } from '../donnees/credits.js';

export const PBR = {
  mat:        {r:0.85},
  satin:      {r:0.5},
  peinture:   {r:0.42},
  marbre:     {r:0.16},
  velours:    {r:0.95, velours:true},
  laiton:     {r:0.3, m:1},
  fer:        {r:0.55, m:0.35},
  feuille:    {r:0.6},
  bois:       {r:0.62, jeu:'bois', ref:[0.6,0.37,0.22], teinte:[1.2,1.46,1.3]},   // la photo est plus rouge que le noyer : moyennes comparées
  parquet:    {r:0.55, jeu:'parquet', teinte:[0.9,0.74,0.58]},
  tapisserie: {r:0.88},
  brique:     {r:0.92, jeu:'brique'},
  dalles:     {r:0.7, jeu:'tomettes'},
  tapis:      {r:0.97},
  livres:     {r:0.62},
  ecaille:    {r:0.35},
  planche:    {r:0.75},
  papillons:  {r:0.8},
  etiquettes: {r:0.85},
  herbier:    {r:0.85},
  globe:      {r:0.32},
  eau:        {r:0.04},
  liquide:    {r:0.08},
  verre:      {r:0.03}
};

/** Charge les textures photographiées ; un jeu qui manque est remplacé par la texture dessinée. */
export async function chargerJeux(rendu){
  const chargeur = new THREE.TextureLoader();
  const aniso = Math.min(8, rendu.capabilities.getMaxAnisotropy());
  const jeux = {};
  await Promise.all(Object.entries(TEXTURES).map(async ([id, t]) => {
    try {
      const [couleur, relief, arm] = await Promise.all(['couleur','relief','arm'].map(c => chargeur.loadAsync('textures/' + t.fichiers[c])));
      couleur.colorSpace = THREE.SRGBColorSpace;
      for (const x of [couleur, relief, arm]){ x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = aniso; }
      jeux[id] = {couleur, relief, arm, taille:t.taille};
    } catch(err){ console.warn('Textures « ' + id + ' » indisponibles : on garde la texture dessinée.', err); }
  }));
  return jeux;
}

/** La teinte de référence d'une matière photographiée (pour rapporter les couleurs du modelage), ou null. */
export function teinteRef(nom, jeux){
  const p = PBR[nom];
  return p && p.ref && p.jeu && jeux[p.jeu] ? p.ref : null;
}

export function creerMateriauPBR(nom, textures, jeux, profil){
  const m = MATS[nom], p = PBR[nom] || {r:0.7};
  if (m.unlit) return new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.DoubleSide, toneMapped:false, fog:false});
  const jeu = p.jeu && jeux[p.jeu];
  if (jeu){
    // la photographie couvre « taille » mètres ; le modelage plaque ses coordonnées à raison de uvMonde par mètre
    const rep = 1 / (jeu.taille * (m.uvMonde || 1));
    for (const t of [jeu.couleur, jeu.relief, jeu.arm]) t.repeat.set(rep, rep);
  }
  const Classe = p.velours && profil.velours ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const mat = new Classe({
    vertexColors:true, side:THREE.DoubleSide,
    roughness: jeu ? Math.min(1, p.r / 0.6) : p.r, metalness: p.m || 0,
    map: jeu ? jeu.couleur : (m.tex ? textures[m.tex] : null),
    normalMap: jeu ? jeu.relief : null,
    roughnessMap: jeu ? jeu.arm : null,
    aoMap: jeu ? jeu.arm : null,
    transparent: !!m.transp, opacity: m.alpha ?? 1, depthWrite: !m.transp
  });
  if (p.teinte) mat.color.setRGB(p.teinte[0], p.teinte[1], p.teinte[2], THREE.SRGBColorSpace);
  if (p.velours && profil.velours){ mat.sheen = 1; mat.sheenRoughness = 0.55; mat.sheenColor = new THREE.Color(0.55, 0.42, 0.42); }
  if (m.verre){
    // le verre devient plus visible vers ses bords, comme dans la version légère (effet de Fresnel)
    mat.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
        gl_FragColor.a = clamp( gl_FragColor.a + pow( 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ), 3.0 ) * 0.5, 0.0, 0.95 );`);
    };
    mat.customProgramCacheKey = () => 'verre-fresnel-pbr';
  }
  return mat;
}
