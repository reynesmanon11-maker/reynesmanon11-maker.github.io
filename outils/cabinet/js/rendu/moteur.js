// Le moteur de rendu : Three.js remplace le petit moteur WebGL de la version légère.
// La scène est la même (décor et curiosités modelés par le code, branchés par l'adaptateur).
// Selon le profil de qualité (voir qualite.js) :
//   basse           matières simples de l'étape 1, textures dessinées ;
//   moyenne, haute  matières réalistes (PBR), textures photographiées (donnees/credits.js),
//                   reflets : deux « sondes » photographient la pièce et la serre au démarrage,
//                   et chaque matière brillante y puise ses reflets.
// Dans tous les profils : ombres du soleil (calculées une seule fois, la scène ne bougeant
// pas), halo autour des flammes, objet tenu dessiné par-dessus tout le reste.
import * as THREE from 'three';
import { etat, J, cam, OBJETS, CURIOSITES, progression, reduitMouvement } from '../jeu/etat.js';
import { Constructeur, aleaGraine, qAxe, TAU, lisse, add, sca, nrm } from '../procedural/geometrie.js';
import { texParquet, texBois, texTapisserie, texBrique, texDalles, texTapis, texLivres, texEcaille, texPlanche,
  texPapillons, texEtiquettes, texHerbier, texGlobe } from '../procedural/textures.js';
import { construireCabinet, construireSerre, construireDehors, LUMIERES, ANIMES } from '../procedural/decor.js';
import { MODELES, TENUE, NE_TOURNE_PAS } from '../procedural/modeles.js';
import { PLACES } from '../donnees/objets.js';
import { creerTextures, versThree } from './adaptateur.js';
import { chargerJeux } from './matieres.js';
import { baseCamera, poseObjet } from '../jeu/joueur.js';

const COUCHE_TENU = 1;        // l'objet saisi est dessiné à part, par-dessus tout le reste
const SOLEIL = nrm([-0.45, 0.62, 0.6]);
const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
// où les deux sondes photographient leur environnement (au-dessus de la table, à côté du bassin)
const SONDES = {cabinet:[0.3, 1.6, 0.9], serre:[10, 1.6, 2.2]};
const LIMITE_SERRE = 6.2;     // au-delà (en x), une curiosité reflète la serre plutôt que le cabinet

let rendu, scene, camera, sceneVoile, camVoile, voile, lampeExamen;
let profil = {nom:'basse', pbr:false, ombre:1024, pixels:1, velours:false};
const lampes = [];            // {lumiere, base, vac, i}
const flammes = [];           // {groupe, vac, ph, halo, opacite, taille}

export function initMoteur(canvas, p){
  profil = p;
  rendu = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  rendu.toneMapping = THREE.AgXToneMapping;      // le plus proche des bruns de la version légère (essais ACES, AgX, Neutral)
  rendu.toneMappingExposure = 1.0;
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = THREE.PCFShadowMap;    // (PCFSoftShadowMap n’existe plus dans cette version)
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
  // Avec les reflets (profils moyen et haut), la pièce s'éclaire aussi d'elle-même par ses
  // sondes : la lumière ambiante, qui faisait ce travail, est réduite d'autant.
  const ambiance = new THREE.AmbientLight(srgb(1, 0.82, 0.64), profil.pbr ? 0.42 : 0.62);
  ambiance.layers.enableAll();
  scene.add(ambiance);
  const soleil = new THREE.DirectionalLight(srgb(0.95, 0.86, 0.68), 3.0);
  soleil.layers.enableAll();
  soleil.target.position.set(4, 0, 0);
  soleil.position.set(4 + SOLEIL[0]*40, SOLEIL[1]*40, SOLEIL[2]*40);
  soleil.castShadow = true;
  Object.assign(soleil.shadow.camera, {left:-17, right:17, top:17, bottom:-17, near:1, far:100});
  soleil.shadow.mapSize.set(profil.ombre, profil.ombre);
  soleil.shadow.bias = -0.0005;
  soleil.shadow.normalBias = 0.03;
  scene.add(soleil, soleil.target);
}

/* --- halo des flammes : une lueur douce, dessinée en addition, qui suit leur tremblement --- */
function textureHalo(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function ajouterHalo(f, a, tex){
  const grand = a.k > 2;                        // les flammes du foyer, plus grandes que celles des bougies
  const opacite = grand ? 0.22 : 0.5;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, color:srgb(1.0, 0.6, 0.25), blending:THREE.AdditiveBlending,
    transparent:true, depthWrite:false, toneMapped:false, fog:false, opacity:opacite}));
  const taille = 0.17 * a.k;
  halo.scale.set(taille, taille, 1);
  halo.position.set(a.p[0], a.p[1] + 0.03 * a.k, a.p[2]);
  halo.renderOrder = 20;
  scene.add(halo);
  Object.assign(f, {halo, opacite, taille});
}

/* --- reflets : une photographie de l'environnement, prise une fois au démarrage --- */
function sonde(pmrem, pos){
  const cible = new THREE.WebGLCubeRenderTarget(128, {type:THREE.HalfFloatType});
  const appareil = new THREE.CubeCamera(0.05, 120, cible);
  appareil.position.set(...pos);
  scene.add(appareil);
  const ac = rendu.autoClear; rendu.autoClear = true;
  appareil.update(rendu, scene);
  rendu.autoClear = ac;
  scene.remove(appareil);
  const env = pmrem.fromCubemap(cible.texture).texture;
  cible.dispose();
  return env;
}
function donnerReflets(groupe, env){
  groupe.traverse(o => {
    if (!o.isMesh || !o.material.isMeshStandardMaterial) return;
    o.material.envMap = env; o.material.envMapIntensity = 1.0; o.material.needsUpdate = true;
  });
}

/* --- construction : textures, décor, curiosités, flammes --- */
export async function construireScene(annoncer = () => {}){
  const rng = aleaGraine(1840);   // même graine que la version légère : même décor
  const textures = creerTextures({
    parquet:texParquet(), bois:texBois(), tapisserie:texTapisserie(), brique:texBrique(), dalles:texDalles(),
    tapis:texTapis(), livres:texLivres(), ecaille:texEcaille(), planche:texPlanche(), papillons:texPapillons(),
    etiquettes:texEtiquettes(CURIOSITES), herbier:texHerbier(), globe:texGlobe()
  }, rendu);
  let jeux = {};
  if (profil.pbr){ annoncer('Chargement des matières…'); jeux = await chargerJeux(rendu); }
  annoncer('Construction du cabinet…');
  // Le décor est rangé en trois zones, chacune avec ses matières : la pièce reflète la pièce,
  // la serre et le dehors reflètent la serre. Même ordre de construction, donc même décor.
  const zones = {cabinet:new Constructeur(), serre:new Constructeur(), dehors:new Constructeur()};
  construireCabinet(zones.cabinet, rng);
  construireSerre(zones.serre, rng);
  construireDehors(zones.dehors, rng);
  const groupes = {};
  for (const [nom, C] of Object.entries(zones)){
    groupes[nom] = versThree(C, textures, {cache:{}, profil, jeux});
    groupes[nom].name = nom;
    scene.add(groupes[nom]);
  }
  // les curiosités, chacune dans son propre groupe pour pouvoir la saisir et la faire luire seule
  for (const c of CURIOSITES){
    const B = new Constructeur(); MODELES[c.id](B);
    const groupe = versThree(B, textures, {partage:false, profil, jeux});
    const pl = PLACES[c.id], q = qAxe(0, 1, 0, pl.ry);
    groupe.position.set(...pl.p); groupe.quaternion.set(...q);
    groupe.name = c.id;
    scene.add(groupe);
    const materiaux = [];
    groupe.traverse(o => { if (o.isMesh && o.material.emissive) materiaux.push(o.material); });
    OBJETS.push({id:c.id, groupe, materiaux, pos:pl.p, q, rayon:groupe.userData.rayon, tenue:TENUE[c.id]||0.22,
      tourne:!NE_TOURNE_PAS[c.id], ph:Math.random()*TAU, tenu:false});
  }
  const cacheFlammes = {}, texHalo = textureHalo();
  for (const a of ANIMES){
    const groupe = versThree(a.C, textures, {cache:cacheFlammes, profil, jeux});
    groupe.position.set(...a.p);
    scene.add(groupe);
    const f = {groupe, vac:a.vac, ph:a.ph};
    ajouterHalo(f, a, texHalo);
    flammes.push(f);
  }
  installerLumieres();
  rendu.shadowMap.needsUpdate = true;      // la première prise de vue (sonde ou image) calcule les ombres
  if (profil.pbr){
    annoncer('Reflets de la pièce…');
    const pmrem = new THREE.PMREMGenerator(rendu);
    const env = {cabinet:sonde(pmrem, SONDES.cabinet), serre:sonde(pmrem, SONDES.serre)};
    pmrem.dispose();
    donnerReflets(groupes.cabinet, env.cabinet);
    donnerReflets(groupes.serre, env.serre);
    donnerReflets(groupes.dehors, env.serre);
    for (const ob of OBJETS) donnerReflets(ob.groupe, ob.pos[0] > LIMITE_SERRE ? env.serre : env.cabinet);
  }
}

export function redimensionner(){
  const w = window.innerWidth, h = window.innerHeight;
  const plafond = Math.min(etat.tactile ? 1.5 : 2, profil.pixels);
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
    const h = calme ? 1 : 0.85 + 0.15*Math.sin(t*9+f.ph*3) + 0.1*(s-1);
    f.halo.material.opacity = f.opacite * h;
    f.halo.scale.set(f.taille * (0.9 + 0.1*h), f.taille * (0.9 + 0.1*h), 1);
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
export function interne(){ return {rendu, scene, camera, THREE, profil, flammes}; }

/** Pour le compteur ?perf : ce que coûte une image. */
export function infosRendu(){
  const i = rendu.info.render;
  return {appels:i.calls, triangles:i.triangles, pixels:rendu.getPixelRatio(), profil:profil.nom};
}
