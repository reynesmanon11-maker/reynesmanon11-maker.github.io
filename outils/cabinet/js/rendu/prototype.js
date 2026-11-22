// Le nouveau décor du cabinet : la pièce modelée et éclairée dans Blender (modeles/cabinet/).
//
// Deux sortes de surfaces :
//   « carte »  les surfaces fixes (murs, sol, meubles, livres) : leur lumière est précalculée
//              (soleil, ciel, feu et tous les rebonds) dans deux cartes de lumière, lumiere-a/b.webp.
//              Elles ignorent les lumières de la page, qui sont déjà comptées dans la carte ;
//   « sonde »  les petits objets (spécimens, instruments) et les curiosités : ils sont éclairés par
//              une photographie de la pièce prise au démarrage près d'eux (une « sonde »), et par le
//              soleil quand il les touche — exactement comme les curiosités du décor dessiné.
// Les reflets du bois ciré, du verre et du laiton viennent aussi des sondes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DOSSIER, LUMIERE, SONDES } from '../donnees/prototype.js';
import { T } from '../procedural/geometrie.js';

// La carte de lumière remplace l'éclairage direct et l'éclairage d'ambiance : on les retire du calcul
// (sinon ils compteraient deux fois), en gardant les reflets (lumière spéculaire des sondes).
const SANS_DIFFUS_IBL = THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', '');
function lumiereCuite(mat){
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_fragment_begin>', '#undef RE_Direct\n#include <lights_fragment_begin>\nirradiance = vec3( 0.0 );')
      .replace('#include <lights_fragment_maps>', SANS_DIFFUS_IBL);
  };
  mat.customProgramCacheKey = () => 'lumiere-cuite';
}

// Le verre : pas de « transmission » (elle redessine toute la scène derrière chaque vitre), mais un
// verre fin, presque invisible de face et plus présent vers les bords (effet de Fresnel).
function verre(source, profil){
  // les liquides (plus opaques que le verre) gardent leur couleur et leur opacité
  const opacite = source.opacity >= 0.3 && source.opacity < 1 ? source.opacity * 0.85 : 0.1;
  const m = profil.pbr
    ? new THREE.MeshStandardMaterial({color:source.color, roughness:0.04, metalness:0, transparent:true, opacity:opacite, depthWrite:false, side:THREE.DoubleSide})
    : new THREE.MeshBasicMaterial({color:source.color, transparent:true, opacity:opacite + 0.02, depthWrite:false, side:THREE.DoubleSide});
  if (profil.pbr){
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
        gl_FragColor.a = clamp( gl_FragColor.a + pow( 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ), 3.0 ) * 0.55, 0.0, 0.9 );`);
    };
    m.customProgramCacheKey = () => 'verre-proto';
  }
  m.userData.verre = true;
  return m;
}
const estVerre = m => (m.transmission > 0) || (m.transparent && m.opacity < 0.5 && !m.map) || /verre|glass|lense/i.test(m.name);

function chargerCarte(chargeur, fichier){
  return chargeur.loadAsync(DOSSIER + fichier).then(t => {
    t.flipY = false;                       // même convention que les textures glTF
    t.colorSpace = THREE.SRGBColorSpace;   // codée en sRGB pour garder de la finesse dans les ombres
    t.channel = 1;                         // seconde carte de coordonnées du modèle
    t.generateMipmaps = false;             // pas de mélange entre îles voisines au loin
    t.minFilter = THREE.LinearFilter;
    return t;
  });
}

/** Charge la pièce et prépare ses matières. Renvoie {groupe, sondes, donnees}. */
export async function chargerPiece(rendu, profil, annoncer = () => {}){
  annoncer('Chargement du nouveau cabinet…');
  const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const chargeur = new THREE.TextureLoader();
  const [modele, donnees, carteA, carteB, fond] = await Promise.all([
    gltf.loadAsync(DOSSIER + 'cabinet.glb'),
    fetch(DOSSIER + 'cabinet.json').then(r => { if (!r.ok) throw new Error('cabinet.json introuvable'); return r.json(); }),
    chargerCarte(chargeur, 'lumiere-a.webp'),
    chargerCarte(chargeur, 'lumiere-b.webp'),
    // le dehors : un panorama photographique (CC0) autour de la maison, au lieu des arbres modelés
    chargeur.loadAsync(DOSSIER + 'dehors.webp').then(t => { t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })
      .catch(err => { console.warn('Panorama du dehors indisponible.', err); return null; })
  ]);
  const cartes = {A:carteA, B:carteB};
  const aniso = Math.min(8, rendu.capabilities.getMaxAnisotropy());
  const cache = new Map();
  const sondes = [];          // maillages à éclairer par sonde
  const groupe = modele.scene;
  groupe.name = 'cabinet-prototype';

  groupe.traverse(o => {
    if (!o.isMesh) return;
    const infos = Object.keys(o.userData).length ? o.userData : (o.parent ? o.parent.userData : {});
    const atlas = infos.lumiere === 'carte' ? (infos.atlas || 'A') : null;
    o.castShadow = true;
    o.receiveShadow = !atlas;
    const remplacer = m => {
      const cle = m.uuid + '|' + (atlas || 'sonde');
      if (cache.has(cle)) return cache.get(cle);
      let n;
      if (estVerre(m)) n = verre(m, profil);
      else if (atlas){
        const intensite = Math.PI * donnees.lumiere[atlas].max * LUMIERE.gain;
        if (profil.pbr){
          n = m.clone();
          n.lightMap = cartes[atlas]; n.lightMapIntensity = intensite;
          lumiereCuite(n);
        } else {
          // qualité basse : couleur × lumière cuite, sans aucun calcul de lumière (le moins cher possible)
          n = new THREE.MeshBasicMaterial({map:m.map, color:m.color, lightMap:cartes[atlas], lightMapIntensity:intensite,
            transparent:m.transparent, opacity:m.opacity, alphaTest:m.alphaTest, side:m.side});
        }
      } else {
        n = profil.pbr ? m : new THREE.MeshLambertMaterial({map:m.map, color:m.color, transparent:m.transparent, opacity:m.opacity,
          alphaTest:m.alphaTest, side:m.side, reflectivity:0});
        sondes.push(o);
      }
      for (const t of [n.map, n.normalMap, n.roughnessMap, n.aoMap]) if (t) t.anisotropy = aniso;
      cache.set(cle, n);
      return n;
    };
    o.material = Array.isArray(o.material) ? o.material.map(remplacer) : remplacer(o.material);
    if (!atlas && !sondes.includes(o)) sondes.push(o);
    if ((Array.isArray(o.material) ? o.material : [o.material]).some(m => m.userData.verre)){ o.castShadow = false; o.renderOrder = 2; }
  });
  return {groupe, sondes, donnees, fond};
}

/** La sonde la plus proche d'un point (indice dans SONDES). */
export function sondeProche(p){
  let k = 0, d = Infinity;
  SONDES.forEach((s, i) => { const e = (s[0]-p[0])**2 + (s[1]-p[1])**2 + (s[2]-p[2])**2; if (e < d){ d = e; k = i; } });
  return k;
}

/** Le dehors du nouveau décor : le toit d'ardoise et les pignons (comme dans le décor dessiné) ;
 *  la pelouse, les arbres et le ciel viennent du panorama photographique (scene.background). */
export function construireDehorsPrototype(S){
  // (pas de pelouse modelée : celle du panorama, photographiée à hauteur d'homme, se raccorde mieux)
  for (const s of [-1, 1]) S.boite('mat', T(0, 5.3, s*2.4).rx(s*0.3588), 12.9, 0.1, 5.13, [0.24, 0.26, 0.3]);
  for (const x of [-6.3, 6.15]) S.tri('brique', [x, 4.4, -4.8], [x, 4.4, 4.8], [x, 6.2, 0], [x < 0 ? -1 : 1, 0, 0]);
}
