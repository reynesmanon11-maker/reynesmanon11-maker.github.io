// Le moteur de rendu : Three.js remplace le petit moteur WebGL de la version légère.
// La scène est la même (décor et curiosités modelés par le code, branchés par l'adaptateur) ;
// ce qui change : les ombres du soleil (calculées une seule fois, la scène ne bougeant pas),
// la gestion des couleurs et l'exposition de Three.js.
import * as THREE from 'three';
import { etat, J, cam, OBJETS, CURIOSITES, progression, reduitMouvement } from '../jeu/etat.js';
import { Constructeur, aleaGraine, qAxe, TAU, lisse, add, sca, nrm } from '../procedural/geometrie.js';
import { texParquet, texBois, texTapisserie, texBrique, texDalles, texTapis, texLivres, texEcaille, texPlanche,
  texPapillons, texEtiquettes, texHerbier, texGlobe } from '../procedural/textures.js';
import { construireCabinet, construireSerre, construireDehors, LUMIERES, ANIMES } from '../procedural/decor.js';
import { MODELES, TENUE, NE_TOURNE_PAS } from '../procedural/modeles.js';
import { PLACES } from '../donnees/objets.js';
import { creerTextures, versThree } from './adaptateur.js';
import { baseCamera, poseObjet } from '../jeu/joueur.js';

const COUCHE_TENU = 1;        // l'objet saisi est dessiné à part, par-dessus tout le reste
const SOLEIL = nrm([-0.45, 0.62, 0.6]);
const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

let rendu, scene, camera, sceneVoile, camVoile, voile, lampeExamen;
const lampes = [];            // {lumiere, base, vac}
const flammes = [];           // {groupe, vac, ph}

export function initMoteur(canvas){
  rendu = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  rendu.toneMapping = THREE.AgXToneMapping;      // le plus proche des bruns de la version légère (essais ACES, AgX, Neutral)
  rendu.toneMappingExposure = 1.0;
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = THREE.PCFShadowMap;    // (PCFSoftShadowMap n’existe plus depuis r180 environ)
  rendu.shadowMap.autoUpdate = false;     // le décor ne bouge pas : ombres calculées une fois
  rendu.autoClear = false;
  rendu.info.autoReset = false;          // plusieurs passes par image : on compte l'image entière
  rendu.setClearColor(srgb(0.06, 0.045, 0.03));

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(srgb(0.82, 0.8, 0.72), 18, 95);   // la brume des lointains
  camera = new THREE.PerspectiveCamera(63, 1, 0.04, 200);
  camera.rotation.order = 'YXZ';

  // voile qui assombrit la pièce pendant qu'on examine un objet
  sceneVoile = new THREE.Scene();
  camVoile = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  voile = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0, depthTest:false, depthWrite:false, toneMapped:false}));
  sceneVoile.add(voile);
}

/* --- lumières : celles de la version légère, plus le soleil, qui porte maintenant des ombres --- */
function installerLumieres(){
  // Le moteur maison atténuait en (1 − d/r)² ; Three.js en 1/d (decay = 1) coupé à r.
  // L'intensité est réglée pour que les deux concordent au tiers de la portée.
  LUMIERES.forEach((L, i) => {
    // La lampe d'appoint de la serre portait jusque dans le cabinet, à travers le mur.
    // Le soleil, qui a maintenant ses ombres, éclaire la serre : on raccourcit sa portée
    // à la serre elle-même (une ombre dans toutes les directions coûtait trop cher).
    const r = L.p[0] > 6.5 ? Math.min(L.r, 4.8) : L.r;
    const lumiere = new THREE.PointLight(srgb(...L.c), 0, r, 1);
    lumiere.position.set(...L.p);
    lumiere.layers.enableAll();
    scene.add(lumiere);
    const base = L.k * Math.PI * 0.15 * L.r;
    if (i === LUMIERES.length - 1) lampeExamen = {lumiere, base:1.1 * Math.PI * 0.15 * L.r};
    else lampes.push({lumiere, base, vac:L.vac, i});
  });
  const ambiance = new THREE.AmbientLight(srgb(1, 0.82, 0.64), 0.62);
  ambiance.layers.enableAll();
  scene.add(ambiance);
  const soleil = new THREE.DirectionalLight(srgb(0.95, 0.86, 0.68), 3.0);
  soleil.layers.enableAll();
  soleil.target.position.set(4, 0, 0);
  soleil.position.set(4 + SOLEIL[0]*40, SOLEIL[1]*40, SOLEIL[2]*40);
  soleil.castShadow = true;
  Object.assign(soleil.shadow.camera, {left:-17, right:17, top:17, bottom:-17, near:1, far:100});
  soleil.shadow.mapSize.set(2048, 2048);
  soleil.shadow.bias = -0.0005;
  soleil.shadow.normalBias = 0.03;
  scene.add(soleil, soleil.target);
}

/* --- construction : textures, décor, curiosités, flammes --- */
export function construireScene(){
  const rng = aleaGraine(1840);   // même graine que la version légère : même décor
  const textures = creerTextures({
    parquet:texParquet(), bois:texBois(), tapisserie:texTapisserie(), brique:texBrique(), dalles:texDalles(),
    tapis:texTapis(), livres:texLivres(), ecaille:texEcaille(), planche:texPlanche(), papillons:texPapillons(),
    etiquettes:texEtiquettes(CURIOSITES), herbier:texHerbier(), globe:texGlobe()
  }, rendu);
  const S = new Constructeur();
  construireCabinet(S, rng);
  construireSerre(S, rng);
  construireDehors(S, rng);
  const cache = {};
  scene.add(versThree(S, textures, {cache}));
  // les curiosités, chacune dans son propre groupe pour pouvoir la saisir et la faire luire seule
  for (const c of CURIOSITES){
    const B = new Constructeur(); MODELES[c.id](B);
    const groupe = versThree(B, textures, {partage:false});
    const pl = PLACES[c.id], q = qAxe(0, 1, 0, pl.ry);
    groupe.position.set(...pl.p); groupe.quaternion.set(...q);
    groupe.name = c.id;
    scene.add(groupe);
    const materiaux = [];
    groupe.traverse(o => { if (o.isMesh && o.material.emissive) materiaux.push(o.material); });
    OBJETS.push({id:c.id, groupe, materiaux, pos:pl.p, q, rayon:groupe.userData.rayon, tenue:TENUE[c.id]||0.22,
      tourne:!NE_TOURNE_PAS[c.id], ph:Math.random()*TAU, tenu:false});
  }
  for (const a of ANIMES){
    const groupe = versThree(a.C, textures, {cache});
    groupe.position.set(...a.p);
    scene.add(groupe);
    flammes.push({groupe, vac:a.vac, ph:a.ph});
  }
  installerLumieres();
  rendu.shadowMap.needsUpdate = true;
}

export function redimensionner(){
  const w = window.innerWidth, h = window.innerHeight;
  const plafond = etat.tactile ? 1.5 : 2;
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, plafond) * (etat.qualite || 1));
  rendu.setSize(w, h, false);
  cam.asp = w/h;
  // en portrait, on élargit le champ pour garder une vue confortable
  cam.fov = Math.min(1.75, Math.max(1.13, 2*Math.atan(Math.tan(0.62)/cam.asp)));
}

function placer(groupe, p, q, s){ groupe.position.set(p[0], p[1], p[2]); groupe.quaternion.set(q[0], q[1], q[2], q[3]); groupe.scale.setScalar(s); }
function couche(ob, tenu){
  if (ob.tenu === tenu) return;
  ob.tenu = tenu;
  ob.groupe.traverse(o => { o.layers.set(tenu ? COUCHE_TENU : 0); if (o.isMesh) o.receiveShadow = !tenu && o.material.type !== 'MeshBasicMaterial'; });
  if (!tenu) placer(ob.groupe, ob.pos, ob.q, 1);
}

/* --- une image --- */
export function rendre(){
  const t = etat.temps, calme = reduitMouvement();
  camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  camera.rotation.set(J.pitch, -J.yaw, 0);
  camera.fov = cam.fov * 180 / Math.PI; camera.aspect = cam.asp; camera.updateProjectionMatrix();

  for (const l of lampes){
    let k = l.base;
    if (l.vac && !calme) k *= 1 + l.vac*(Math.sin(t*7.3+l.i)*0.5 + Math.sin(t*13.1+2*l.i)*0.3 + Math.sin(t*23.7+l.i)*0.2);
    l.lumiere.intensity = k;
  }
  const insp = etat.inspection, e = insp ? lisse(insp.t) : 0, tenu = insp ? insp.ob : null;
  if (insp){ const b = baseCamera(J.yaw, J.pitch); lampeExamen.lumiere.position.set(...add(cam.pos, add(sca(b.h,0.35), sca(b.f,0.1)))); }
  lampeExamen.lumiere.intensity = insp ? lampeExamen.base * e : 0;

  for (const ob of OBJETS){
    couche(ob, ob === tenu);
    if (ob === tenu){ const p = poseObjet(ob, e); placer(ob.groupe, p.p, p.q, p.s); }
    // les curiosités pas encore vues luisent doucement ; celle qu'on vise brille plus fort
    let r = 0, g = 0, b = 0;
    if (ob !== tenu && ob === etat.cible){ const p = 0.65+0.35*Math.sin(t*5); r = 0.4*p; g = 0.29*p; b = 0.13*p; }
    else if (ob !== tenu && !progression.vus[ob.id] && etat.ecran === 'jeu'){ const p = 0.5+0.5*Math.sin(t*2.2+ob.ph); r = 0.19*p; g = 0.13*p; b = 0.05*p; }
    for (const m of ob.materiaux) m.emissive.setRGB(r, g, b);
  }
  for (const f of flammes){
    const s = calme ? 1 : 1 + f.vac*Math.sin(t*11+f.ph)*0.8 + 0.1*Math.sin(t*23+f.ph*2);
    f.groupe.scale.set(1, Math.max(0.6, s), 1);
  }

  rendu.info.reset();
  rendu.clear();
  camera.layers.set(0);
  rendu.render(scene, camera);
  if (tenu){
    voile.material.opacity = 0.5 * e;
    rendu.render(sceneVoile, camVoile);
    rendu.clearDepth();
    camera.layers.set(COUCHE_TENU);
    rendu.render(scene, camera);
  }
}

/** Accès au moteur Three.js, pour les réglages et les diagnostics (console, tests). */
export function interne(){ return {rendu, scene, camera, THREE}; }

/** Pour le compteur ?perf : ce que coûte une image. */
export function infosRendu(){
  const i = rendu.info.render;
  return {appels:i.calls, triangles:i.triangles, pixels:rendu.getPixelRatio()};
}
