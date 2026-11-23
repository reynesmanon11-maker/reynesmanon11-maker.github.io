// L'hôpital du « garçon à utérus », en 3D.
// Le bâtiment (modeles/hopital.glb) a été modelé et éclairé dans Blender (atelier/), d'après le plan de
// l'exercice. L'exercice lui-même (exercice.html) n'est pas réécrit : il s'ouvre dans un panneau quand
// on parle au médecin de la pièce, à l'étape de ce médecin. Ses questions, ses vérifications, son
// dossier patient et sa mémoire (localStorage) restent les siens.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { creerPorte } from './portes.js';

const $ = id => document.getElementById(id);
const DOSSIER = 'modeles/';
const GAIN = 2.4;                 // la cuisson est en unités physiques : exposition de la page
const OEIL = 1.62, RAYON = 0.26, PORTEE = 2.3;
const reduit = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const lire = (cle, defaut) => { try { return localStorage.getItem(cle) ?? defaut; } catch (e){ return defaut; } };
const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e){ /* navigation privée : tant pis */ } };

/* ------------------------------------------------------------ qualités */
// Légère : le rendu cuit tel quel (ordinateurs du lycée). Belle : halo des lumières, étalonnage, anticrénelage.
// Très belle : en plus, occlusion ambiante (les ombres de contact entre les objets) et plus de pixels.
const QUALITES = {
  legere:    {nom:'Légère',     post:false, ao:false, ratio:1.25, sonde:96},
  belle:     {nom:'Belle',      post:true,  ao:false, ratio:1.5,  sonde:160},
  tresbelle: {nom:'Très belle', post:true,  ao:true,  ratio:2,    sonde:256}
};
function choisirQualite(r){
  const q = new URLSearchParams(location.search).get('qualite') || lire('hopital-qualite', 'auto');
  if (QUALITES[q]) return q;
  const gl = r.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
  const carte = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|softpipe/i.test(carte) || (matchMedia && matchMedia('(pointer: coarse)').matches)) return 'legere';
  return 'belle';
}
let Q = QUALITES.legere, qualite = 'legere', composer = null;
const ETALONNAGE = {
  uniforms: {tDiffuse:{value:null}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv); vec3 x = c.rgb;
      float l = dot(x, vec3(0.2126, 0.7152, 0.0722));
      x = mix(vec3(l), x, 1.07);                       // un peu plus de couleur
      x = (x - 0.5) * 1.05 + 0.5;                      // un peu plus de contraste
      x *= vec3(1.015, 1.0, 0.975);                    // une pointe de chaleur
      float v = smoothstep(0.9, 0.3, length(vUv - 0.5));
      x *= mix(0.84, 1.0, v);                          // vignetage discret
      gl_FragColor = vec4(clamp(x, 0.0, 1.0), c.a);
    }`
};
// Qualité automatique : si la machine peine (moins de 40 images/s avec le post-traitement, ou moins de 28 sans),
// on renonce au post-traitement, puis on baisse la définition par paliers ; on la remonte si elle redevient aisée.
const adapt = {auto: true, n: 0, t: 0, ratio: 1};
function adapter(dt){
  if (!adapt.auto || ecran !== 'jeu') return;
  adapt.n++; adapt.t += dt;
  if (adapt.t < 2.5) return;
  const fps = adapt.n / adapt.t; adapt.n = 0; adapt.t = 0;
  if (composer && fps < 40){ composer = null; adapt.note = 'post-traitement coupé'; return; }
  if (!composer && fps < 28 && adapt.ratio > 0.6){ adapt.ratio = Math.max(0.6, adapt.ratio - 0.15); }
  else if (fps > 55 && adapt.ratio < 1){ adapt.ratio = Math.min(1, adapt.ratio + 0.1); }
  else return;
  rendu.setPixelRatio(Math.min(devicePixelRatio || 1, Q.ratio) * adapt.ratio);
  adapt.note = `définition ${Math.round(adapt.ratio * 100)} %`;
}
async function postTraitement(){
  const P = './vendor/three-r187-post/postprocessing/';
  const [{EffectComposer}, {RenderPass}, {UnrealBloomPass}, {OutputPass}, {ShaderPass}] = await Promise.all(
    ['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'OutputPass', 'ShaderPass'].map(n => import(P + n + '.js')));
  const t = rendu.getDrawingBufferSize(new THREE.Vector2());
  const cible = new THREE.WebGLRenderTarget(t.x, t.y, {type:THREE.HalfFloatType, samples:4});
  composer = new EffectComposer(rendu, cible);
  composer.addPass(new RenderPass(scene, camera));
  if (Q.ao){
    const {GTAOPass} = await import(P + 'GTAOPass.js');
    const ao = new GTAOPass(scene, camera, t.x, t.y);
    ao.blendIntensity = 0.75;
    ao.updateGtaoMaterial({radius:0.3, distanceExponent:1.4, thickness:1.2, scale:1.0, samples:12});
    composer.addPass(ao);
  }
  // seules les sources (LED, dalles lumineuses, ciel) dépassent ce seuil : les murs éclairés restent nets
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(t.x, t.y), 0.22, 0.4, 6.0));
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass(ETALONNAGE));
}

/* ------------------------------------------------------------ les personnes et leurs services */
const PERSONNES = {
  AC: {nom:'Accueil', role:"Hall d'accueil", salut:"Bonjour ! Vous êtes l'équipe qui suit le fils de Mme D. ? Inscrivez votre équipe, je vous ouvre les services au fur et à mesure."},
  DL: {nom:'Dr Lefèvre', role:'Étape 1 · Médecin', salut:"Avant d'expliquer le cas de cet enfant, vous devez comprendre comment l'appareil génital se met en place chez l'embryon."},
  DB: {nom:'Dr Benali', role:'Étape 2 · Cytogénéticien', salut:"Bonjour ! Mon métier, c'est d'observer les chromosomes."},
  DR: {nom:'Dr Roche', role:'Étape 3 · Endocrinologue', salut:"Je suis spécialiste des hormones. Nous allons faire une prise de sang à l'enfant."},
  DN: {nom:'Dr Nguyen', role:'Étape 4 · Généticienne', salut:"Pour qu'un canal de Müller régresse, plusieurs maillons doivent fonctionner. Cherchons lequel manque."},
  DP: {nom:'Dr Petit', role:'Étape 5 · Échographiste', salut:"Mme D. se demande si on aurait pu voir cet utérus pendant sa grossesse."},
  DM: {nom:'Dr Morel', role:'Étape 6 · Médecin de la reproduction', salut:"Mme D. veut savoir si son fils sera fertile plus tard."},
  CS: {nom:'Dr Vasseur', role:'Cheffe de service · Bloc opératoire', salut:"C'est ici que tout a commencé. Revenez me voir pour rédiger le compte-rendu, quand l'enquête sera finie."}
};
const NOMS_SALLES = {hall:"Hall d'accueil", consult:'Consultations', cyto:'Laboratoire de cytogénétique', endo:'Endocrinologie', gene:'Génétique',
  imagerie:'Imagerie médicale', repro:'Médecine de la reproduction', bloc:'Bloc opératoire'};

/* ------------------------------------------------------------ état */
const J = {x:3.9, z:2.6, yaw:-2.64, pitch:-0.06};   // dans le hall, près de la porte, face à la banque d'accueil
const touches = new Set();
let rendu, scene, camera, donnees, exo = null;
let ecran = 'accueil', parle = null, cible = null;
const solides = [];               // rectangles fixes [x0, z0, x1, z1]
const portes = {};                // salle → Porte (portes.js)
let ciblePorte = null;            // porte qu'on regarde, à portée de main
const gens = {};                  // code → {pivot, yaw0, yaw}
const enseignes = {};             // salle → {canvas, tex, etat}
const portesAuto = [];            // vantaux coulissants de l'entrée
const sources = [];               // matières qui émettent (LED, dalles) : intensifiées pour le halo, après la capture des sondes
let cibleObjet = null;            // objet du décor qu'on peut utiliser (borne, plan, gel…)

/* ------------------------------------------------------------ matières */
const SANS_DIFFUS_IBL = THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', '');
function lumiereCuite(m){
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_fragment_begin>', '#undef RE_Direct\n#include <lights_fragment_begin>\nirradiance = vec3( 0.0 );')
      .replace('#include <lights_fragment_maps>', SANS_DIFFUS_IBL);
  };
  m.customProgramCacheKey = () => 'lumiere-cuite';
}
function verre(src){
  const opa = src.opacity >= 0.3 && src.opacity < 1 ? src.opacity * 0.85 : 0.08;
  const m = new THREE.MeshStandardMaterial({color:src.color, roughness:0.04, transparent:true, opacity:opa, depthWrite:false, side:THREE.DoubleSide});
  m.userData.verre = true;
  if (Q.post) m.envMapIntensity = 0.25;   // en HDR, le reflet n'est plus plafonné avant le mélange : on le tempère
  return m;
}
const estVerre = m => (m.transmission > 0) || (m.transparent && m.opacity < 0.5 && !m.map) || /verre|glass/i.test(m.name);
function carte(chargeur, f){
  return chargeur.loadAsync(DOSSIER + f).then(t => {
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.channel = 1; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
  });
}

/* ------------------------------------------------------------ construction */
async function construire(){
  rendu = new THREE.WebGLRenderer({canvas:$('scene'), antialias:true, powerPreference:'high-performance'});
  rendu.toneMapping = THREE.AgXToneMapping;
  rendu.toneMappingExposure = 0.7;  // murs et sols clairs : sans cela tout sort blanc
  rendu.info.autoReset = false;
  qualite = choisirQualite(rendu); Q = QUALITES[qualite];
  adapt.auto = !new URLSearchParams(location.search).get('qualite') && lire('hopital-qualite', 'auto') === 'auto';
  rendu.setPixelRatio(Math.min(devicePixelRatio || 1, Q.ratio));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(62, 1, 0.05, 300);
  camera.rotation.order = 'YXZ';
  redimensionner();
  const chargeur = new THREE.TextureLoader();
  const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  $('chargement').textContent = 'Chargement du bâtiment…';
  const [modele, d, cA, cB, fond] = await Promise.all([
    gltf.loadAsync(DOSSIER + 'hopital.glb'),
    fetch(DOSSIER + 'hopital.json').then(r => r.json()),
    carte(chargeur, 'lumiere-a.webp'), carte(chargeur, 'lumiere-b.webp'),
    chargeur.loadAsync('../cabinet/modeles/cabinet/dehors.webp').then(t => { t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })
      .catch(() => null)
  ]);
  donnees = d;
  if (fond) scene.background = fond;
  const cartes = {A:cA, B:cB}, cache = new Map(), sondes = [];
  modele.scene.traverse(o => {
    if (!o.isMesh) return;
    const info = Object.keys(o.userData).length ? o.userData : (o.parent ? o.parent.userData : {});
    const atlas = info.lumiere === 'carte' ? (info.atlas || 'A') : null;
    const un = m => {
      const cle = m.uuid + (atlas || 's');
      if (cache.has(cle)) return cache.get(cle);
      let n;
      if (estVerre(m)) n = verre(m);
      else if (/^(panneau|ecran)$/.test(m.name)){
        n = new THREE.MeshBasicMaterial({color: m.name === 'panneau' ? new THREE.Color(1, 1, 0.95) : 0x5a8ec0});
        if (m.name === 'panneau') sources.push(n);
      }
      // écrans allumés (leur image est leur lumière) et LED : dessinés tels quels, sans éclairage
      else if (/^ecran_/.test(m.name) && m.name !== 'ecran_tv') n = new THREE.MeshBasicMaterial({map: m.emissiveMap || m.map, color: 0xffffff});
      else if (m.name === 'ecran_tv') n = new THREE.MeshBasicMaterial({map: tele.tex});
      else if (m.name === 'ecran_appel') n = new THREE.MeshBasicMaterial({map: appel.tex});
      else if (/^(led|voyant)/.test(m.name)){
        n = new THREE.MeshBasicMaterial({color: (m.emissive && m.emissive.getHex() ? m.emissive : m.color).clone().multiplyScalar(1.6)});
        sources.push(n);
      }
      else if (atlas){ n = m.clone(); n.lightMap = cartes[atlas]; n.lightMapIntensity = Math.PI * d.lumiere[atlas].max * GAIN; lumiereCuite(n); }
      else n = m;
      // affiches, plaques et touches : collées à un demi-millimètre de leur support, elles passent toujours devant
      if (/^(affiche_|plan_hall|signal_|clavier|ecran_)/.test(m.name)){ n.polygonOffset = true; n.polygonOffsetFactor = -1; n.polygonOffsetUnits = -4; }
      cache.set(cle, n);
      return n;
    };
    o.material = Array.isArray(o.material) ? o.material.map(un) : un(o.material);
    if (!atlas) sondes.push(o);
    if ([].concat(o.material).some(m => m.userData.verre)) o.renderOrder = 2;
  });
  scene.add(modele.scene);
  // les personnes : chacune sur un pivot, pour se tourner vers qui lui parle
  for (const [code, p] of Object.entries(d.personnes)){
    const ob = modele.scene.getObjectByName('medecin_' + code);
    if (!ob) continue;
    const pivot = new THREE.Group(); pivot.position.set(p.p[0], 0, p.p[2]);
    scene.add(pivot); pivot.attach(ob);
    gens[code] = {pivot, yaw0:0, yaw:0, p:p.p, salle:p.salle, etape:p.etape, zone: ob.userData.zone || p.salle};
  }
  for (const s of d.solides) solides.push(s);
  for (const cote of ['g', 'd']){
    const objs = ['porte_auto_' + cote, 'porte_auto_' + cote + '_vitre'].map(n => modele.scene.getObjectByName(n)).filter(Boolean);
    if (!objs.length) continue;
    const g = new THREE.Group(); scene.add(g); for (const o of objs) g.attach(o);
    portesAuto.push({g, sens: cote === 'g' ? -1 : 1, ouverture:0});
  }
  ombresDeContact();
  construirePortes();
  // lumière des objets mobiles et des personnes : un peu d'ambiance, et les sondes
  scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x8a8478, 0.35));
  $('chargement').textContent = 'Lumière des pièces…';
  const pmrem = new THREE.PMREMGenerator(rendu), envs = [];
  for (const p of d.sondes){
    const cible = new THREE.WebGLCubeRenderTarget(Q.sonde, {type:THREE.HalfFloatType}), cam = new THREE.CubeCamera(0.05, 120, cible);
    cam.position.set(...p); scene.add(cam); cam.update(rendu, scene); scene.remove(cam);
    envs.push(pmrem.fromCubemap(cible.texture).texture); cible.dispose();
  }
  pmrem.dispose();
  const boite = new THREE.Box3(), c = new THREE.Vector3(), parSonde = new Map();
  const proche = q => { let k = 0, best = Infinity; d.sondes.forEach((s, i) => { const e = (s[0]-q.x)**2 + (s[2]-q.z)**2; if (e < best){ best = e; k = i; } }); return k; };
  scene.traverse(o => {
    if (!o.isMesh) return;
    boite.setFromObject(o).getCenter(c); const k = proche(c);
    o.material = [].concat(o.material).map(m => {
      if (!m.isMeshStandardMaterial) return m;
      if (m.userData.sonde === undefined){ m.userData.sonde = k; m.envMap = envs[k]; return m; }
      if (m.userData.sonde === k) return m;
      const cle = m.uuid + '|' + k;
      if (!parSonde.has(cle)){ const n = m.clone(); n.onBeforeCompile = m.onBeforeCompile; n.customProgramCacheKey = m.customProgramCacheKey; n.envMap = envs[k]; n.userData.sonde = k; parSonde.set(cle, n); }
      return parSonde.get(cle);
    });
    if (o.material.length === 1) o.material = o.material[0];
  });
  // le décor ne bouge pas : ses matrices sont calculées une fois pour toutes
  modele.scene.traverse(o => { o.updateMatrix(); o.matrixAutoUpdate = false; });
  rangerParZone(modele.scene);
  if (Q.post){
    for (const m of new Set(sources)) m.color.multiplyScalar(6);
    $('chargement').textContent = 'Réglage de l’image…';
    try { await postTraitement(); } catch (e){ console.warn('post-traitement indisponible', e); composer = null; }
  }
}

/* ------------------------------------------------------------ rendu par zone */
// Chaque objet du décor porte sa zone (une salle, « couloir », « dehors »), écrite par l'atelier. On ne dessine que
// la zone où l'on est, le couloir, et les salles qu'on peut voir : porte ouverte et pas trop loin, ou porte toute
// proche (l'oculus). Une salle fermée n'est pas dessinée : c'est la plus grosse économie de la page.
const zones = {};                 // zone → objets
let zonesCle = '';
function rangerParZone(racine){
  for (const o of [...racine.children]){
    const z = o.userData && o.userData.zone;
    if (z) (zones[z] = zones[z] || []).push(o);
  }
  for (const g of Object.values(gens)){
    const z = g.zone; if (z) (zones[z] = zones[z] || []).push(g.pivot);
  }
}
function zoneDe(x, z){
  for (const [nom, s] of Object.entries(donnees.salles)) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) return nom;
  return 'couloir';
}
function majZones(){
  const ici = zoneDe(J.x, J.z), v = new Set([ici, 'couloir']);
  for (const [nom, s] of Object.entries(donnees.salles)){
    if (v.has(nom)) continue;
    const p = portes[nom], ouverte = !p || p.angle > 0.06;
    const d = Math.hypot(J.x - (s.porte[0] + s.porte[1]) / 2, J.z - s.z_couloir);
    if ((ouverte && d < 16) || d < 2.6) v.add(nom);
  }
  if (v.has('hall')) v.add('dehors');
  const cle = [...v].sort().join('|');
  if (cle === zonesCle) return;
  zonesCle = cle;
  for (const [z, objs] of Object.entries(zones)) for (const o of objs) o.visible = v.has(z);
}

/* ------------------------------------------------------------ ombres de contact */
// La lumière cuite est douce et vient du plafond : sous les pieds, l'ombre serrée qui « pose » un corps au sol
// manquerait. Une tache sombre aux bords fondus, sous chaque personne, la remplace.
function ombresDeContact(){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.45, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
  for (const g of Object.values(gens)){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.6), mat);
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.006, 0); m.renderOrder = 1;
    g.pivot.add(m);
  }
}

/* ------------------------------------------------------------ portes et enseignes */
const COULEURS = {cyto:'#ece6f6', bloc:'#d6ece9', endo:'#fbeede', gene:'#e3f4ea', repro:'#f9e3ec', consult:'#e4f0fb', hall:'#f6ead2', imagerie:'#e1eef7'};
function construirePortes(){
  for (const [nom, s] of Object.entries(donnees.salles)){
    enseigne(nom, s);
    if (nom === 'hall') continue;                       // le hall n'a qu'une baie, sans battant
    const [a, b] = s.porte, L = b - a - 0.02, zp = s.z_porte;
    const sens = s.cote === 'sud' ? 1 : -1;            // la pièce est du côté −z (porte au sud) ou +z : le battant s'ouvre vers elle
    const rect = [a, Math.min(zp, s.z_couloir) - 0.02, b, Math.max(zp, s.z_couloir) + 0.02];
    // le battant modelé dans Blender (âme, oculus, plaque de propreté, béquilles, paumelles) pivote sur sa charnière
    let objets = ['battant_' + nom, 'battant_' + nom + '_vitre'].map(n => scene.getObjectByName(n)).filter(Boolean);
    if (!objets.length){
      // à défaut : un battant dessiné ici (bois clair, hublot, poignée), modelé en place
      const bois = new THREE.MeshStandardMaterial({color:0xc9a27a, roughness:0.5});
      const feuille = new THREE.Mesh(new THREE.BoxGeometry(L, 2.06, 0.045), bois); feuille.position.set(a + 0.01 + L/2, 1.03, zp);
      const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.09), new THREE.MeshStandardMaterial({color:0xcfd3d6, roughness:0.25, metalness:1}));
      poignee.position.set(a + 0.01 + L - 0.1, 1.0, zp);
      scene.add(feuille, poignee); objets = [feuille, poignee];
    }
    portes[nom] = creerPorte({nom, objets, charniere:[a + 0.01, zp], largeur:L, sens, embrasure:rect, scene});
  }
}
function viserPorte(){
  let mieux = null, dmin = 1.9;
  const fx = Math.sin(J.yaw), fz = -Math.cos(J.yaw);
  for (const p of Object.values(portes)){
    const [cx, cz] = p.centre, dx = cx - J.x, dz = cz - J.z, d = Math.hypot(dx, dz);
    if (d > dmin || d < 0.01) continue;
    if ((dx * fx + dz * fz) / d < 0.5) continue;
    mieux = p; dmin = d;
  }
  return mieux;
}
function actionnerPorte(p){
  if (p.verrouillee){
    bulle(NOMS_SALLES[p.nom], 'Porte fermée : ce service n’est pas encore ouvert à votre équipe. Suivez l’objectif indiqué en bas de l’écran.');
    return;
  }
  p.basculer();
}
function enseigne(nom, s){
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({map:tex}));
  const xm = (s.porte[0] + s.porte[1]) / 2, z = s.z_couloir + (s.cote === 'sud' ? -0.012 : 0.012);
  m.position.set(xm, 2.42, nom === 'hall' ? s.z0 + 0.012 : z);
  if (s.cote === 'sud' && nom !== 'hall') m.rotation.y = Math.PI;
  scene.add(m);
  enseignes[nom] = {c, tex, etat:null};
}
function dessinerEnseigne(nom, connue, ouverte, numero){
  const E = enseignes[nom]; const etat = connue + '|' + ouverte + '|' + numero;
  if (!E || E.etat === etat) return; E.etat = etat;
  const x = E.c.getContext('2d');
  x.fillStyle = connue ? '#18212e' : '#3a4656'; x.fillRect(0, 0, 512, 128);
  x.fillStyle = connue ? COULEURS[nom] : '#6b7685'; x.fillRect(0, 0, 14, 128);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (connue){
    x.font = '700 40px "Segoe UI", system-ui, sans-serif'; x.fillStyle = '#ffffff';
    const t = NOMS_SALLES[nom]; const mots = t.length > 22 ? [t.slice(0, t.lastIndexOf(' ', 22)), t.slice(t.lastIndexOf(' ', 22) + 1)] : [t];
    mots.forEach((m, i) => x.fillText(m, 256 + (numero ? 24 : 0), 64 + (i - (mots.length - 1) / 2) * 44));
    if (numero){ x.fillStyle = ouverte ? '#0b6b77' : '#5d6878'; x.beginPath(); x.arc(52, 64, 34, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '800 40px system-ui'; x.fillText(numero, 52, 66); }
  } else { x.font = '800 70px system-ui'; x.fillStyle = '#c3ccd6'; x.fillText('?', 256, 66); }
  E.tex.needsUpdate = true;
}

/* ------------------------------------------------------------ avancement : quelles portes s'ouvrent */
function majAvancement(){
  if (!exo) return;
  const i = id => exo.etapes.indexOf(id);
  for (const [code, g] of Object.entries(gens)){
    const k = i(g.etape);
    const ouverte = k >= 0 && exo.ouverte(k);
    const connue = g.salle === 'hall' || g.salle === 'bloc' || (k > 0 && ouverte);
    g.ouverte = ouverte;
    if (portes[g.salle]) portes[g.salle].verrouillee = g.salle === 'bloc' ? false : !ouverte;   // on ouvre soi-même (touche E)
    dessinerEnseigne(g.salle, connue, ouverte, (k >= 1 && k <= 6) ? String(k) : '');
  }
  const pts = exo.points(); $('score').textContent = pts + (pts > 1 ? ' points' : ' point');
  // l'objectif : la première étape ouverte et pas finie
  let obj = 'Présentez-vous à l’accueil, devant vous.';
  if (exo.equipe()){
    const k = [1, 2, 3, 4, 5, 6].find(n => exo.ouverte(n) && !exo.finie(n));
    const g = Object.values(gens).find(x => x.etape === (k ? exo.etapes[k] : 'compte-rendu'));
    if (k && g) obj = `Objectif : rejoindre ${PERSONNES[Object.keys(gens).find(c => gens[c] === g)].nom} (${NOMS_SALLES[g.salle]}).`;
    else if (exo.ouverte(7)) obj = 'Enquête finie : rejoignez le Dr Vasseur au bloc opératoire pour le compte-rendu.';
  }
  $('objectif').textContent = obj;
}

/* ------------------------------------------------------------ marche */
// On ne marche que dans une salle, un couloir ou l'embrasure d'une porte (les murs n'ont pas d'autre existence
// pour la marche) ; puis les meubles et les battants fermés arrêtent le pas.
function dansBatiment(x, z){
  const R = RAYON;
  for (const s of Object.values(donnees.salles)){
    if (x > s.x0 + R && x < s.x1 - R && z > s.z0 + R && z < s.z1 - R) return true;
    if (x > s.porte[0] + R && x < s.porte[1] - R && z > Math.min(s.z_porte, s.z_couloir) - R && z < Math.max(s.z_porte, s.z_couloir) + R) return true;
  }
  for (const c of donnees.couloirs || []) if (x > c[0] + R && x < c[2] - R && z > c[1] + R && z < c[3] - R) return true;
  return !donnees.couloirs;          // anciennes données sans couloirs : pas de murs (comportement d'avant)
}
function libre(x, z){
  if (!dansBatiment(x, z)) return false;
  for (const s of solides) if (x > s[0] - RAYON && x < s[2] + RAYON && z > s[1] - RAYON && z < s[3] + RAYON) return false;
  for (const p of Object.values(portes)) if (p.bloque(x, z, J.x, J.z, RAYON)) return false;
  return true;
}
const manette = {id:null, x0:0, y0:0, dx:0, dy:0}, regard = {id:null, x:0, y:0};
function deplacer(dt){
  let av = 0, la = 0;
  if (touches.has('KeyW') || touches.has('KeyZ') || touches.has('ArrowUp')) av += 1;
  if (touches.has('KeyS') || touches.has('ArrowDown')) av -= 1;
  if (touches.has('KeyA') || touches.has('KeyQ')) la -= 1;
  if (touches.has('KeyD')) la += 1;
  if (touches.has('ArrowLeft')) J.yaw -= 1.8 * dt;
  if (touches.has('ArrowRight')) J.yaw += 1.8 * dt;
  if (manette.id !== null){ av -= manette.dy / 50; la += manette.dx / 50; }
  const n = Math.hypot(av, la); if (n > 1){ av /= n; la /= n; }
  const v = (touches.has('ShiftLeft') || touches.has('ShiftRight') ? 3.4 : 2.0) * dt;
  const fx = Math.sin(J.yaw), fz = -Math.cos(J.yaw);
  const dx = (fx * av - fz * la) * v, dz = (fz * av + fx * la) * v;
  if (libre(J.x + dx, J.z)) J.x += dx;
  if (libre(J.x, J.z + dz)) J.z += dz;
}
function salleDe(x, z){
  for (const [nom, s] of Object.entries(donnees.salles)) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) return NOMS_SALLES[nom];
  return 'Couloir';
}

/* ------------------------------------------------------------ parler */
function viser(){
  let mieux = null, score = 0;
  const fx = Math.sin(J.yaw), fz = -Math.cos(J.yaw);
  for (const [code, g] of Object.entries(gens)){
    const dx = g.p[0] - J.x, dz = g.p[2] - J.z, d = Math.hypot(dx, dz);
    if (d > PORTEE) continue;
    const c = (dx * fx + dz * fz) / d;
    if (c > 0.7 && c / d > score){ score = c / d; mieux = code; }
  }
  return mieux;
}
function parler(code){
  if (!code || !exo) return;
  const g = gens[code], P = PERSONNES[code], k = exo.etapes.indexOf(g.etape);
  if (code === 'CS' && !exo.ouverte(k)){ bulle(P.nom, P.salut); return; }
  parle = code; ecran = 'panneau';
  document.exitPointerLock && document.exitPointerLock();
  $('qui').innerHTML = `${P.nom}<small>${P.role}</small>`;
  exo.aller(g.etape);
  $('panneau').classList.add('ouvert'); $('panneau').setAttribute('aria-hidden', 'false');
  $('invite').classList.add('hidden'); $('b-parler').classList.add('hidden'); $('bulle').classList.add('hidden');
  setTimeout(() => $('exercice').focus(), 360);
}
function fermerPanneau(){
  if (ecran !== 'panneau') return;
  $('panneau').classList.remove('ouvert'); $('panneau').setAttribute('aria-hidden', 'true');
  ecran = 'jeu'; parle = null;
  majAvancement();
  $('scene').focus();
}
let bulleT = null;
function bulle(nom, texte){
  $('bulle').innerHTML = `<b>${nom}</b>${texte}`; $('bulle').classList.remove('hidden');
  clearTimeout(bulleT); bulleT = setTimeout(() => $('bulle').classList.add('hidden'), 6000);
}

/* ------------------------------------------------------------ l'écran d'information du hall */
// Une toile dessinée par la page : bienvenue et heure, consigne d'hygiène, et l'objectif de l'équipe, en boucle.
const tele = (() => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
  return {c, tex, diapo: 0, t: 0};
})();
function dessinerTele(){
  const x = tele.c.getContext('2d'), W = 1024, H = 576;
  x.fillStyle = '#18212e'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#0b6b77'; x.fillRect(0, 0, 18, H);
  x.fillStyle = '#ffffff'; x.textBaseline = 'middle';
  const h = new Date(), heure = String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0');
  x.font = '600 34px "Segoe UI", system-ui, sans-serif'; x.textAlign = 'right'; x.fillStyle = '#9fd3d8'; x.fillText(heure, W - 40, 50);
  x.textAlign = 'left';
  const D = [
    ['Pôle Femme-Enfant', 'Bienvenue. L’accueil est à votre gauche en entrant.'],
    ['Hygiène des mains', 'Un geste avant d’entrer dans un service : le gel, près de la porte.'],
    ['Votre enquête', ($('objectif') && $('objectif').textContent) || 'Présentez-vous à l’accueil.'],
    ['Le saviez-vous ?', 'Appuyez sur M pour ouvrir le plan du rez-de-chaussée.']
  ][tele.diapo % 4];
  x.fillStyle = '#ffffff'; x.font = '800 64px "Segoe UI", system-ui, sans-serif'; x.fillText(D[0], 60, 220);
  x.fillStyle = '#c9d6e2'; x.font = '400 36px "Segoe UI", system-ui, sans-serif';
  const mots = D[1].split(' '); let ligne = '', y = 320;
  for (const m of mots){ if (x.measureText(ligne + m).width > 880){ x.fillText(ligne, 60, y); ligne = ''; y += 48; } ligne += m + ' '; }
  x.fillText(ligne, 60, y);
  for (let k = 0; k < 4; k++){ x.fillStyle = k === tele.diapo % 4 ? '#0b6b77' : '#3a4656'; x.beginPath(); x.arc(70 + k * 34, 520, 9, 0, 7); x.fill(); }
  tele.tex.needsUpdate = true;
}

const appel = (() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 152;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
  return {c, tex, numero: 16};
})();
function dessinerAppel(){
  const x = appel.c.getContext('2d');
  x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, 512, 152);
  x.fillStyle = '#ffb547'; x.textBaseline = 'middle';
  x.font = '600 30px ui-monospace, Menlo, monospace'; x.fillText('APPEL', 24, 46); x.fillText('GUICHET 1', 24, 108);
  x.font = '800 92px ui-monospace, Menlo, monospace'; x.textAlign = 'right'; x.fillText(String(appel.numero).padStart(3, '0'), 492, 80); x.textAlign = 'left';
  appel.tex.needsUpdate = true;
}

/* ------------------------------------------------------------ objets du décor qu'on peut utiliser */
const OBJETS = {
  borne:    {verbe:'Utiliser', faire: () => { ficheBorne(); setTimeout(() => { appel.numero = 17 + decouvertes.size; dessinerAppel(); }, 4000); }},
  plan:     {verbe:'Consulter', faire: () => fichePlan()},
  tv:       {verbe:'Regarder', faire: () => { tele.diapo++; tele.t = 0; dessinerTele(); }},
  gel:      {verbe:'Se frictionner les mains avec', faire: () => bulle('Hygiène', 'Paume contre paume, dos des mains, entre les doigts, pouces, bout des doigts… 30 secondes : vos mains sont prêtes pour entrer dans un service.')},
  fontaine: {verbe:'Boire à', faire: () => bulle('Fontaine', 'Un verre d’eau fraîche. Bien hydraté, on raisonne mieux !')},
  sortie:   {verbe:'Sortir par', faire: () => bulle('Entrée', exo && exo.ouverte(7) && exo.finie(7) ? 'Enquête bouclée : merci pour Mme D. et son fils !' : 'Pas encore : le petit patient et sa maman comptent sur votre enquête.')}
};
const decouvertes = new Set((() => { try { return JSON.parse(lire('hopital-decouvertes', '[]')); } catch (e){ return []; } })());
function utiliser(id){
  const o = OBJETS[id]; if (!o) return;
  o.faire();
  if (!decouvertes.has(id)){ decouvertes.add(id); ecrire('hopital-decouvertes', JSON.stringify([...decouvertes])); majDecouvertes(true); }
}
function majDecouvertes(nouveau){
  const n = decouvertes.size, total = (donnees.interactifs || []).length;
  const el = $('decouvertes'); if (!el || !total) return;
  el.textContent = `Découvertes ${n}/${total}`; el.classList.toggle('hidden', n === 0);
  if (nouveau){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}
function viserObjet(){
  let mieux = null, score = 0;
  const fx = Math.sin(J.yaw), fz = -Math.cos(J.yaw);
  for (const o of donnees.interactifs || []){
    const dx = o.p[0] - J.x, dz = o.p[2] - J.z, d = Math.hypot(dx, dz);
    if (d > 2.0 || d < 0.05) continue;
    const c = (dx * fx + dz * fz) / d;
    if (c > 0.75 && c / d > score){ score = c / d; mieux = o; }
  }
  return mieux;
}

/* ------------------------------------------------------------ fiches : borne d'accueil et plan */
function ouvrirFiche(titre, html){
  ecran = 'fiche';
  document.exitPointerLock && document.exitPointerLock();
  $('fiche-titre').textContent = titre; $('fiche-corps').innerHTML = html;
  $('fiche').classList.remove('hidden'); $('invite').classList.add('hidden');
  $('fiche-fermer').focus();
}
function fermerFiche(){ if (ecran !== 'fiche') return; $('fiche').classList.add('hidden'); ecran = 'jeu'; $('scene').focus(); }
function etatEtape(k){ return !exo ? 'ferme' : exo.finie(k) ? 'fini' : exo.ouverte(k) ? 'ouvert' : 'ferme'; }
function ficheBorne(){
  const equipe = exo && exo.equipe();
  let h = equipe ? `<p>Équipe <b>${equipe.replace(/[<>&]/g, '')}</b> · ${exo.points()} point${exo.points() > 1 ? 's' : ''}</p>`
                 : `<p class="ticket">Ticket n° ${String(17 + decouvertes.size).padStart(3, '0')}</p><p>Présentez-vous à la banque d’accueil, à gauche : on inscrira votre équipe et on vous ouvrira les services.</p>`;
  h += '<ol class="etapes">';
  for (const [code, g] of Object.entries(gens)){
    const k = exo ? exo.etapes.indexOf(g.etape) : -1;
    if (k < 1 || k > 6) continue;
    const e = etatEtape(k), P = PERSONNES[code];
    h += `<li class="${e}"><span>${e === 'fini' ? '✓' : e === 'ouvert' ? '→' : '🔒'}</span> Étape ${k} · ${e === 'ferme' ? 'service encore fermé' : P.nom + ', ' + NOMS_SALLES[g.salle]}</li>`;
  }
  h += '</ol>';
  ouvrirFiche('Borne d’accueil', h);
}
function fichePlan(){
  const S = donnees.salles, xs = Object.values(S).flatMap(s => [s.x0, s.x1]), zs = Object.values(S).flatMap(s => [s.z0, s.z1]);
  const x0 = Math.min(...xs) - 0.3, z0 = Math.min(...zs) - 0.3, W = Math.max(...xs) - x0 + 0.3, Hh = Math.max(...zs) - z0 + 0.3;
  let svg = `<svg viewBox="${x0} ${z0} ${W} ${Hh}" class="plan" role="img" aria-label="Plan du rez-de-chaussée">`;
  for (const c of donnees.couloirs || []) svg += `<rect x="${c[0]}" y="${c[1]}" width="${c[2] - c[0]}" height="${c[3] - c[1]}" fill="#e8e2d6"/>`;
  const objectif = $('objectif').textContent;
  for (const [nom, s] of Object.entries(S)){
    const g = Object.values(gens).find(x => x.salle === nom), k = g && exo ? exo.etapes.indexOf(g.etape) : -1;
    const e = nom === 'hall' || nom === 'bloc' ? 'connu' : k >= 1 ? etatEtape(k) : 'ferme';
    const fond = {connu:'#f3ead6', fini:'#d7ece6', ouvert:'#d9eef0', ferme:'#c3ccd6'}[e];
    const vise = g && objectif.includes(NOMS_SALLES[nom]);
    svg += `<rect x="${s.x0}" y="${s.z0}" width="${s.x1 - s.x0}" height="${s.z1 - s.z0}" fill="${fond}" stroke="${vise ? '#b4361a' : '#18212e'}" stroke-width="${vise ? 0.18 : 0.08}"/>`;
    const t = e === 'ferme' ? '?' : NOMS_SALLES[nom] + (e === 'fini' ? ' ✓' : '');
    svg += `<text x="${(s.x0 + s.x1) / 2}" y="${(s.z0 + s.z1) / 2}" font-size="${e === 'ferme' ? 1.2 : 0.55}" text-anchor="middle" dominant-baseline="middle" fill="#18212e">${t}</text>`;
  }
  const fx = Math.sin(J.yaw), fz = -Math.cos(J.yaw);
  svg += `<g transform="translate(${J.x} ${J.z}) rotate(${Math.atan2(fz, fx) * 180 / Math.PI})"><circle r="0.32" fill="#b4361a"/><path d="M0.2 -0.22 L0.75 0 L0.2 0.22 Z" fill="#b4361a"/></g></svg>`;
  ouvrirFiche('Plan du rez-de-chaussée', svg + `<p class="legende"><span class="pt"></span> vous êtes ici · encadré rouge : votre objectif · « ? » : service pas encore ouvert. Touche <kbd>M</kbd> pour rouvrir ce plan.</p>`);
}

/* ------------------------------------------------------------ commandes */
function brancher(){
  const sc = $('scene');
  addEventListener('keydown', e => {
    if (ecran === 'panneau'){ if (e.key === 'Escape') fermerPanneau(); return; }
    if (ecran === 'fiche'){ if (e.key === 'Escape' || e.code === 'KeyM' || e.code === 'KeyE') fermerFiche(); return; }
    if (ecran !== 'jeu') return;
    touches.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Enter'){ if (cible) parler(cible); else if (ciblePorte) actionnerPorte(ciblePorte); else if (cibleObjet) utiliser(cibleObjet.id); }
    if (e.code === 'KeyM') fichePlan();
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', e => touches.delete(e.code));
  addEventListener('blur', () => touches.clear());
  sc.addEventListener('click', () => {
    if (ecran !== 'jeu') return;
    if (cible){ parler(cible); return; }
    if (ciblePorte){ actionnerPorte(ciblePorte); return; }
    if (cibleObjet){ utiliser(cibleObjet.id); return; }
    if (!document.body.classList.contains('tactile') && sc.requestPointerLock) sc.requestPointerLock();
  });
  addEventListener('mousemove', e => {
    if (document.pointerLockElement !== sc) return;
    J.yaw += e.movementX * 0.0024; J.pitch = Math.max(-1.2, Math.min(1.2, J.pitch - e.movementY * 0.0024));
  });
  sc.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || ecran !== 'jeu') return;
    document.body.classList.add('tactile');
    if (e.clientX < innerWidth / 2 && manette.id === null){ manette.id = e.pointerId; manette.x0 = e.clientX; manette.y0 = e.clientY; manette.dx = manette.dy = 0; }
    else if (regard.id === null){ regard.id = e.pointerId; regard.x = e.clientX; regard.y = e.clientY; }
  });
  sc.addEventListener('pointermove', e => {
    if (e.pointerId === manette.id){
      manette.dx = Math.max(-50, Math.min(50, e.clientX - manette.x0)); manette.dy = Math.max(-50, Math.min(50, e.clientY - manette.y0));
      $('manette').firstElementChild.style.transform = `translate(${manette.dx}px,${manette.dy}px)`;
    } else if (e.pointerId === regard.id){
      J.yaw += (e.clientX - regard.x) * 0.006; J.pitch = Math.max(-1.1, Math.min(1.1, J.pitch - (e.clientY - regard.y) * 0.006));
      regard.x = e.clientX; regard.y = e.clientY;
    }
  });
  const fin = e => {
    if (e.pointerId === manette.id){ manette.id = null; manette.dx = manette.dy = 0; $('manette').firstElementChild.style.transform = ''; }
    if (e.pointerId === regard.id) regard.id = null;
  };
  sc.addEventListener('pointerup', fin); sc.addEventListener('pointercancel', fin);
  $('b-parler').addEventListener('click', () => { if (cible) parler(cible); else if (ciblePorte) actionnerPorte(ciblePorte); else if (cibleObjet) utiliser(cibleObjet.id); });
  $('fiche-fermer').addEventListener('click', fermerFiche);
  $('b-plan').addEventListener('click', () => { if (ecran === 'jeu') fichePlan(); else fermerFiche(); });
  $('qualite').addEventListener('change', e => { ecrire('hopital-qualite', e.target.value); const u = new URL(location.href); u.searchParams.delete('qualite'); location.href = u.href; });
  $('fermer').addEventListener('click', fermerPanneau);
  $('b-credits').addEventListener('click', () => $('credits').classList.toggle('hidden'));
  addEventListener('resize', redimensionner);
}
function redimensionner(){
  if (!rendu) return;
  rendu.setSize(innerWidth, innerHeight, false);
  if (composer){ const t = rendu.getDrawingBufferSize(new THREE.Vector2()); composer.setSize(innerWidth, innerHeight); composer.setPixelRatio(rendu.getPixelRatio()); }
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < innerHeight ? 78 : 62;
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------ boucle */
let t0 = performance.now(), pas = 0;
const dejaEcrit = {};
function afficher(id, cache, html, texte){
  const e = dejaEcrit[id] || (dejaEcrit[id] = {el: $(id)});
  if (e.cache !== cache){ e.el.classList.toggle('hidden', cache); e.cache = cache; }
  if (html != null && e.html !== html){ e.el.innerHTML = html; e.html = html; }
  if (texte != null && e.texte !== texte){ e.el.textContent = texte; e.texte = texte; }
}
// mesure (?perf) : images par seconde, temps de calcul de la page et d'envoi du dessin, appels de dessin, triangles
const PERF = /[?&]perf/.test(location.search);
const perf = {n:0, tFen:0, tJs:0, tRendu:0, fps:0, js:0, rendu:0, appels:0, triangles:0, programmes:0, textures:0, debut:performance.now()};
function noterPerf(tA, tB, tC){
  perf.n++; perf.tJs += tB - tA; perf.tRendu += tC - tB;
  const ecoule = tC - perf.debut;
  if (ecoule > 1000){
    Object.assign(perf, {fps: perf.n * 1000 / ecoule, js: perf.tJs / perf.n, rendu: perf.tRendu / perf.n,
      appels: rendu.info.render.calls, triangles: rendu.info.render.triangles, programmes: rendu.info.programs.length, textures: rendu.info.memory.textures});
    perf.n = 0; perf.tJs = perf.tRendu = 0; perf.debut = tC;
    if (PERF) $('perf').textContent = `${perf.fps.toFixed(0)} im/s · page ${perf.js.toFixed(1)} ms · dessin ${perf.rendu.toFixed(1)} ms · ${perf.appels} appels · ${(perf.triangles / 1000).toFixed(0)} k triangles · ${perf.programmes} programmes · ${Q.nom}${composer ? '' : ' (sans post)'}${adapt.note ? ' · ' + adapt.note : ''}`;
  }
}
function boucle(t){
  const tA = performance.now();
  const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
  if (ecran === 'jeu'){
    deplacer(dt);
    cible = viser();
    ciblePorte = cible ? null : viserPorte();
    cibleObjet = cible || ciblePorte ? null : viserObjet();
    const P = cible && PERSONNES[cible];
    const quoi = cible ? `Parler à ${P.nom === 'Accueil' ? 'l’accueil' : P.nom}`
      : ciblePorte ? (ciblePorte.verrouillee ? 'Porte fermée à clé' : ciblePorte.ouverte ? 'Fermer la porte' : 'Ouvrir la porte')
      : cibleObjet ? `${OBJETS[cibleObjet.id].verbe} ${cibleObjet.nom}` : '';
    const tactile = document.body.classList.contains('tactile');
    // la page n'est réécrite que si quelque chose change (sinon le navigateur recalcule la mise en page à chaque image)
    afficher('invite', !quoi || tactile, quoi ? `${quoi}<kbd>E</kbd>` : null);
    afficher('b-parler', !quoi || !tactile, null, quoi);
    afficher('lieu', false, null, salleDe(J.x, J.z));
  }
  // les personnes se tournent vers le visiteur quand il approche ; les portes s'ouvrent ou se ferment
  for (const g of Object.values(gens)){
    const dx = J.x - g.p[0], dz = J.z - g.p[2], d = Math.hypot(dx, dz);
    const vise = d < 3.5 ? Math.atan2(dx, dz) : null;
    // l'objet a été modelé déjà tourné (ry) : on applique un écart par rapport à cette orientation
    const ry = donnees.personnes[Object.keys(gens).find(c => gens[c] === g)].ry;
    let ecart = vise === null ? 0 : vise - ry;
    ecart = Math.atan2(Math.sin(ecart), Math.cos(ecart));
    ecart = Math.max(-1.4, Math.min(1.4, ecart));
    g.yaw += (ecart - g.yaw) * Math.min(1, dt * (reduit() ? 20 : 3));
    g.pivot.rotation.y = g.yaw;
  }
  for (const p of Object.values(portes)) p.animer(dt, reduit());
  majZones();
  adapter(dt);
  // l'écran d'information change de diapositive toutes les 7 secondes
  tele.t += dt; if (tele.t > 7){ tele.t = 0; tele.diapo++; dessinerTele(); }
  // portes de l'entrée : elles s'écartent quand on approche
  if (portesAuto.length){
    const h = donnees.salles.hall, pres = Math.abs(J.x - (h.x0 + h.x1) / 2) < 1.6 && h.z1 - J.z < 2.2 && J.z < h.z1 + 0.5;
    for (const p of portesAuto){ p.ouverture += ((pres ? 0.85 : 0) - p.ouverture) * Math.min(1, dt * (reduit() ? 30 : 3)); p.g.position.x = p.sens * p.ouverture; }
  }
  // un peu de vie : respiration des personnes, balancement du pas
  const tt = t / 1000;
  if (!reduit()) for (const g of Object.values(gens)) g.pivot.scale.y = 1 + 0.0045 * Math.sin(tt * 1.7 + g.p[0]);
  const marche = ecran === 'jeu' && !reduit() && ['KeyW', 'KeyZ', 'KeyS', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyQ', 'KeyD'].some(k => touches.has(k)) || manette.id !== null;
  pas = marche ? pas + dt * 8.5 : pas;
  const bob = marche && !reduit() ? Math.sin(pas) * 0.022 : 0;
  camera.position.set(J.x, OEIL + bob, J.z);
  camera.rotation.set(J.pitch, -J.yaw, 0);
  const tB = performance.now();
  rendu.info.reset();          // une seule remise à zéro par image (le post-traitement fait plusieurs passes)
  if (composer) composer.render(dt); else rendu.render(scene, camera);
  noterPerf(tA, tB, performance.now());
  requestAnimationFrame(boucle);
}

/* ------------------------------------------------------------ démarrage */
async function demarrer(){
  brancher();
  try { await construire(); }
  catch (err){ console.error(err); $('chargement').textContent = 'L’hôpital n’a pas pu être chargé (' + err.message + ').'; return; }
  for (const c of donnees.credits || []){
    const li = document.createElement('li'); li.textContent = `${c.titre} (${c.site}, ${c.licence}) : ${c.sert}. ${c.auteurs}.`; $('credits').appendChild(li);
  }
  // l'exercice se charge dans son panneau ; on attend sa passerelle
  const f = $('exercice');
  const pret = () => { try { return f.contentWindow && f.contentWindow.jeu3d; } catch (e){ return null; } };
  for (let i = 0; i < 200 && !pret(); i++) await new Promise(r => setTimeout(r, 50));
  exo = pret();
  if (!exo){ $('chargement').textContent = 'L’enquête n’a pas pu être chargée.'; return; }
  majAvancement();
  majDecouvertes(false);
  dessinerTele(); dessinerAppel();
  $('qualite').value = new URLSearchParams(location.search).get('qualite') || lire('hopital-qualite', 'auto');
  $('qualite-info').textContent = `Qualité utilisée : ${Q.nom}`;
  $('chargement').textContent = 'Prêt.';
  const b = $('b-entrer'); b.disabled = false; b.textContent = 'Entrer dans l’hôpital';
  b.addEventListener('click', () => {
    $('accueil').classList.add('hidden');
    for (const id of ['hud', 'viseur', 'objectif', 'b-plan']) $(id).classList.remove('hidden');
    ecran = 'jeu'; $('scene').focus();
    bulle('Accueil', exo.equipe() ? 'Bon retour ! Votre dossier vous attend : la suite de l’enquête est indiquée en bas de l’écran.' : PERSONNES.AC.salut);
  });
  requestAnimationFrame(boucle);
  Object.assign(window, {perf, J, parler, fermerPanneau, gens, portes, libre, utiliser, fichePlan, fermerFiche,
    actionnerPorte, etat: () => ({ecran, cible, porte: ciblePorte && ciblePorte.nom, objet: cibleObjet && cibleObjet.id, parle, pret: !!exo, qualite, post: !!composer, decouvertes: decouvertes.size})});
}
demarrer();
