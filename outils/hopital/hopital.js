// L'hôpital du « garçon à utérus », en 3D.
// Le bâtiment (modeles/hopital.glb) a été modelé et éclairé dans Blender (atelier/), d'après le plan de
// l'exercice. L'exercice lui-même (exercice.html) n'est pas réécrit : il s'ouvre dans un panneau quand
// on parle au médecin de la pièce, à l'étape de ce médecin. Ses questions, ses vérifications, son
// dossier patient et sa mémoire (localStorage) restent les siens.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const $ = id => document.getElementById(id);
const DOSSIER = 'modeles/';
const GAIN = 2.4;                 // la cuisson est en unités physiques : exposition de la page
const OEIL = 1.62, RAYON = 0.26, PORTEE = 2.3;
const reduit = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
const J = {x:3.3, z:3.2, yaw:Math.PI, pitch:-0.05};   // dans le hall, face à l'accueil
const touches = new Set();
let rendu, scene, camera, donnees, exo = null;
let ecran = 'accueil', parle = null, cible = null;
const solides = [];               // rectangles fixes [x0, z0, x1, z1]
const portes = {};                // salle → {pivot, ouverte, angle, cible, rect}
const gens = {};                  // code → {pivot, yaw0, yaw}
const enseignes = {};             // salle → {canvas, tex, etat}

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
  rendu.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
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
      else if (/^(panneau|ecran)$/.test(m.name)) n = new THREE.MeshBasicMaterial({color: m.name === 'panneau' ? 0xffffff : 0x5a8ec0});
      // écrans allumés (leur image est leur lumière) et LED : dessinés tels quels, sans éclairage
      else if (/^ecran_/.test(m.name)) n = new THREE.MeshBasicMaterial({map: m.emissiveMap || m.map, color: 0xffffff});
      else if (/^(led|voyant)/.test(m.name)) n = new THREE.MeshBasicMaterial({color: m.emissive && m.emissive.getHex() ? m.emissive : m.color});
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
    gens[code] = {pivot, yaw0:0, yaw:0, p:p.p, salle:p.salle, etape:p.etape};
  }
  for (const s of d.solides) solides.push(s);
  ombresDeContact();
  construirePortes();
  // lumière des objets mobiles et des personnes : un peu d'ambiance, et les sondes
  scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x8a8478, 0.35));
  $('chargement').textContent = 'Lumière des pièces…';
  const pmrem = new THREE.PMREMGenerator(rendu), envs = [];
  for (const p of d.sondes){
    const cible = new THREE.WebGLCubeRenderTarget(96, {type:THREE.HalfFloatType}), cam = new THREE.CubeCamera(0.05, 120, cible);
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
    if (nom === 'hall') { enseigne(nom, s); continue; }
    const [a, b] = s.porte, L = b - a - 0.02, zp = s.z_porte;
    const sens = s.cote === 'sud' ? 1 : -1;            // la pièce est du côté −z (porte au sud) ou +z
    const rect = [a, Math.min(zp, s.z_couloir) - 0.02, b, Math.max(zp, s.z_couloir) + 0.02];
    // le battant modelé dans Blender (âme bois, oculus, plaque de propreté, béquilles) pivote sur sa charnière
    const modeles = ['battant_' + nom, 'battant_' + nom + '_vitre'].map(n => scene.getObjectByName(n)).filter(Boolean);
    if (modeles.length){
      const g = new THREE.Group(); g.position.set(a + 0.01, 0, zp); scene.add(g);
      for (const o of modeles) g.attach(o);
      portes[nom] = {g, ouverte:false, angle:0, sens, rect};
      enseigne(nom, s);
      continue;
    }
    // à défaut : un battant dessiné ici (bois clair, hublot, poignée), charnière côté a
    const g = new THREE.Group();
    const bois = new THREE.MeshStandardMaterial({color:0xc9a27a, roughness:0.5});
    const feuille = new THREE.Mesh(new THREE.BoxGeometry(L, 2.06, 0.045), bois); feuille.position.set(L/2, 1.03, 0);
    const hublot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.05), new THREE.MeshStandardMaterial({color:0x9fb8c8, roughness:0.05, metalness:0.1}));
    hublot.position.set(L - 0.3, 1.45, 0);
    const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.09), new THREE.MeshStandardMaterial({color:0xcfd3d6, roughness:0.25, metalness:1}));
    poignee.position.set(L - 0.1, 1.0, 0);
    g.add(feuille, hublot, poignee);
    g.position.set(a + 0.01, 0, zp);
    scene.add(g);
    portes[nom] = {g, ouverte:false, angle:0, sens, rect};
    enseigne(nom, s);
  }
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
    if (portes[g.salle]) portes[g.salle].ouverte = g.salle === 'bloc' ? true : ouverte;
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
  for (const p of Object.values(portes)) if (p.angle < 0.6){ const s = p.rect; if (x > s[0] - RAYON && x < s[2] + RAYON && z > s[1] - RAYON && z < s[3] + RAYON) return false; }
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

/* ------------------------------------------------------------ commandes */
function brancher(){
  const sc = $('scene');
  addEventListener('keydown', e => {
    if (ecran === 'panneau'){ if (e.key === 'Escape') fermerPanneau(); return; }
    if (ecran !== 'jeu') return;
    touches.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Enter') parler(cible);
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', e => touches.delete(e.code));
  addEventListener('blur', () => touches.clear());
  sc.addEventListener('click', () => {
    if (ecran !== 'jeu') return;
    if (cible){ parler(cible); return; }
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
  $('b-parler').addEventListener('click', () => parler(cible));
  $('fermer').addEventListener('click', fermerPanneau);
  $('b-credits').addEventListener('click', () => $('credits').classList.toggle('hidden'));
  addEventListener('resize', redimensionner);
}
function redimensionner(){
  if (!rendu) return;
  rendu.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < innerHeight ? 78 : 62;
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------ boucle */
let t0 = performance.now();
function boucle(t){
  const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
  if (ecran === 'jeu'){
    deplacer(dt);
    cible = viser();
    const P = cible && PERSONNES[cible];
    $('invite').classList.toggle('hidden', !cible || document.body.classList.contains('tactile'));
    $('b-parler').classList.toggle('hidden', !cible || !document.body.classList.contains('tactile'));
    if (cible){ $('invite').innerHTML = `Parler à ${P.nom === 'Accueil' ? 'l’accueil' : P.nom}<kbd>E</kbd>`; $('b-parler').textContent = `Parler à ${P.nom === 'Accueil' ? 'l’accueil' : P.nom}`; }
    $('lieu').textContent = salleDe(J.x, J.z);
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
  for (const p of Object.values(portes)){
    const but = p.ouverte ? 1.5 : 0;
    p.angle += (but - p.angle) * Math.min(1, dt * (reduit() ? 30 : 2.5));
    p.g.rotation.y = p.sens * p.angle;
  }
  camera.position.set(J.x, OEIL, J.z);
  camera.rotation.set(J.pitch, -J.yaw, 0);
  rendu.render(scene, camera);
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
  for (const p of Object.values(portes)) p.angle = p.ouverte ? 1.5 : 0;
  $('chargement').textContent = 'Prêt.';
  const b = $('b-entrer'); b.disabled = false; b.textContent = 'Entrer dans l’hôpital';
  b.addEventListener('click', () => {
    $('accueil').classList.add('hidden');
    for (const id of ['hud', 'viseur', 'objectif']) $(id).classList.remove('hidden');
    ecran = 'jeu'; $('scene').focus();
    bulle('Accueil', exo.equipe() ? 'Bon retour ! Votre dossier vous attend : la suite de l’enquête est indiquée en bas de l’écran.' : PERSONNES.AC.salut);
  });
  requestAnimationFrame(boucle);
  Object.assign(window, {J, parler, fermerPanneau, gens, portes, libre, etat: () => ({ecran, cible, parle, pret: !!exo})});
}
demarrer();
