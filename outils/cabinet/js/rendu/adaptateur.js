// Adaptateur : les « lots » du Constructeur (triangles rangés par matière) deviennent des
// maillages Three.js. C'est ce qui permet de garder tout le modelage de la version légère
// pendant que les modèles GLB arrivent, un objet après l'autre.
import * as THREE from 'three';
import { MATS } from '../procedural/geometrie.js';

// Les couleurs du modelage sont des couleurs « d'écran » ; Three.js calcule la lumière en linéaire.
const lineaire = v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);

/** Textures dessinées sur canevas → textures Three.js (répétées, filtrées, en sRGB). */
export function creerTextures(canevas, rendu){
  const aniso = Math.min(8, rendu.capabilities.getMaxAnisotropy());
  const t = {};
  for (const [nom, c] of Object.entries(canevas)){
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = aniso;
    t[nom] = tex;
  }
  return t;
}

/* Matières : on garde le réglage de la version légère (reflet, brillance, transparence).
   Seules les matières qui brillent vraiment (laiton, fer, vernis, carapace, verre, eau…)
   calculent un reflet : c'est ce calcul, refait pour chaque lampe, qui coûte le plus. Les
   matières mates (bois brut, papier, étoffes, feuillage) n'en avaient presque pas.
   Le reflet de Three.js est normalisé (il grandit avec la brillance) : on le compense
   pour retrouver à peu près l'aspect d'origine. Les vraies matières (PBR) viendront à l'étape 2. */
const SEUIL_BRILLANT = 0.25;
export function creerMateriau(nom, textures){
  const m = MATS[nom];
  if (m.unlit) return new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.DoubleSide, toneMapped:false, fog:false});
  if ((m.spec || 0) <= SEUIL_BRILLANT && !m.transp){
    return new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide, map: m.tex ? textures[m.tex] : null});
  }
  const s = Math.min(1, (m.spec || 0) * 4 / ((m.shin || 10) * 0.5 + 1));
  const mat = new THREE.MeshPhongMaterial({
    vertexColors:true, side:THREE.DoubleSide,
    map: m.tex ? textures[m.tex] : null,
    specular: new THREE.Color(s, s, s), shininess: m.shin || 10,
    transparent: !!m.transp, opacity: m.alpha ?? 1, depthWrite: !m.transp
  });
  if (m.verre){
    // le verre devient plus visible vers ses bords, comme dans la version légère (effet de Fresnel)
    mat.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
        gl_FragColor.a = clamp( gl_FragColor.a + pow( 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ), 3.0 ) * 0.45, 0.0, 0.95 );`);
    };
    mat.customProgramCacheKey = () => 'verre-fresnel';
  }
  return mat;
}

/**
 * Un Constructeur → un groupe Three.js (un maillage par matière).
 * partage : les matières du décor sont partagées ; une curiosité a les siennes, pour luire seule.
 */
export function versThree(C, textures, {partage = true, cache = {}} = {}){
  const groupe = new THREE.Group();
  let rayon = 0;
  for (const nom in C.lots){
    const L = C.lots[nom], n = L.p.length/3;
    if (!n) continue;
    const P = Float32Array.from(L.p), N = Float32Array.from(L.n), U = Float32Array.from(L.u);
    const K = Float32Array.from(L.c, lineaire);
    // Le moteur maison dessinait les deux faces de tout triangle : l'ordre de ses sommets
    // n'avait pas d'importance. Three.js s'en sert pour savoir quelle face il voit ; on
    // remet donc chaque triangle dans le sens de ses normales.
    for (let t=0; t<n; t+=3){
      const a=3*t, b=a+3, c=a+6;
      const e1x=P[b]-P[a], e1y=P[b+1]-P[a+1], e1z=P[b+2]-P[a+2], e2x=P[c]-P[a], e2y=P[c+1]-P[a+1], e2z=P[c+2]-P[a+2];
      const gx=e1y*e2z-e1z*e2y, gy=e1z*e2x-e1x*e2z, gz=e1x*e2y-e1y*e2x;
      const sx=N[a]+N[b]+N[c], sy=N[a+1]+N[b+1]+N[c+1], sz=N[a+2]+N[b+2]+N[c+2];
      if (gx*sx+gy*sy+gz*sz < 0){
        for (const T of [P,N,K]) for (let k=0;k<3;k++){ const x=T[b+k]; T[b+k]=T[c+k]; T[c+k]=x; }
        const ub=2*t+2, uc=2*t+4;
        for (let k=0;k<2;k++){ const x=U[ub+k]; U[ub+k]=U[uc+k]; U[uc+k]=x; }
      }
    }
    for (let i=0;i<P.length;i+=3) rayon = Math.max(rayon, Math.hypot(P[i],P[i+1],P[i+2]));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.BufferAttribute(K, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    g.computeBoundingSphere();
    const mat = partage ? (cache[nom] || (cache[nom] = creerMateriau(nom, textures))) : creerMateriau(nom, textures);
    const maille = new THREE.Mesh(g, mat);
    const m = MATS[nom];
    maille.castShadow = !m.transp && !m.unlit;
    maille.receiveShadow = !m.unlit;
    if (m.transp) maille.renderOrder = 10 + (m.ordre || 0);
    maille.name = nom;
    groupe.add(maille);
  }
  groupe.userData.rayon = rayon;
  return groupe;
}
