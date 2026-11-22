// Démarrage de la nouvelle version du cabinet, dessinée par Three.js.
// Les textes et le moteur sont chargés à part : une erreur dans l'un d'eux affiche un
// message et un lien vers la version légère, au lieu d'une page blanche.
import { etat, J, cam, CURIOSITES, parId, OBJETS, progression, $, reduitMouvement, entreeValide } from './jeu/etat.js';
import { touches, deplacer, majCible, majInspection, saisir, reposer } from './jeu/joueur.js';
import { brancherCommandes } from './jeu/commandes.js';
import { brancherBoutons, majCompteur, consigne, compteBonnes, fermerModales, imprimer, ouvrirBilan } from './ui/interface.js';
import { MODELES } from './procedural/modeles.js';
import { PLACES } from './donnees/objets.js';

const LEGERE = '../cabinet_curiosites.html';
let moteur = null;

function webgl2Disponible(){
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch(e){ return false; }
}
function erreurFatale(msg){
  const b = $('b-entrer'); b.disabled = true; b.textContent = '3D indisponible';
  $('chargement').textContent = msg + ' La version légère du cabinet reste disponible : ';
  const a = document.createElement('a'); a.href = LEGERE; a.textContent = 'ouvrir la version légère';
  $('chargement').appendChild(a);
}

function entrer(){
  if (!etat.pret) return;
  etat.ecran = 'jeu'; etat.cible = null;
  $('accueil').classList.add('hidden'); $('hud').classList.remove('hidden'); $('viseur').classList.remove('hidden');
  J.x=-4.3; J.z=2.9; J.yaw=1.15; J.pitch=-0.06;
  majCompteur();
  consigne(etat.tactile ? 'Glisse le pouce à gauche pour marcher, un doigt à droite pour regarder. Touche un objet qui luit pour le saisir.'
                        : 'Clique dans la vue pour regarder avec la souris · ZQSD ou flèches pour marcher · vise un objet qui luit et clique pour le saisir.');
  etat.derniereConsigne = etat.temps;
  $('scene').focus({preventScroll:true});
}

/* --- compteur de performances : ajouter ?perf à l'adresse --- */
const perf = new URLSearchParams(location.search).has('perf') ? {n:0, cumul:0, el:null} : null;
function majPerf(dt){
  if (!perf) return;
  if (!perf.el){ perf.el = document.createElement('div'); perf.el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:30;font:12px/1.4 monospace;background:rgba(0,0,0,.7);color:#9f9;padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre'; document.body.appendChild(perf.el); }
  perf.n++; perf.cumul += dt;
  if (perf.cumul >= 1){
    const i = moteur.infosRendu();
    perf.el.textContent = `${Math.round(perf.n/perf.cumul)} images/s · ${(1000*perf.cumul/perf.n).toFixed(1)} ms\n${i.appels} appels · ${Math.round(i.triangles/1000)} k triangles · pixels ×${i.pixels.toFixed(2)}`;
    perf.n = 0; perf.cumul = 0;
  }
}

/* --- boucle --- */
let tPrec = performance.now(), mesures = [];
function boucle(t){
  const vrai = Math.max(0, (t-tPrec)/1000), dt = Math.min(0.05, vrai); tPrec = t; etat.temps += dt;
  if (etat.ecran==='jeu'){
    if (!etat.inspection && !etat.modale) deplacer(dt);
    const bob = reduitMouvement() ? 0 : Math.sin(J.pas)*0.022;
    cam.pos = [J.x, 1.6+bob, J.z];
  } else {
    // à l'accueil, la caméra fait lentement le tour de la pièce
    const a = reduitMouvement() ? 0.6 : etat.temps*0.07+0.6;
    J.x = 0.6+Math.cos(a)*3.2; J.z = Math.sin(a)*2.4; J.pitch = -0.12;
    J.yaw = Math.atan2(0.6-J.x, J.z);
    cam.pos = [J.x, 1.75, J.z];
  }
  majInspection(dt);
  if (etat.ecran==='jeu') majCible();
  if (etat.temps-etat.derniereConsigne>9 && etat.ecran==='jeu' && !etat.inspection && document.pointerLockElement===$('scene')) consigne('');
  moteur.rendre();
  majPerf(vrai);
  // si l'appareil peine, on dessine moins de pixels
  mesures.push(dt); if (mesures.length>90){ const moy=mesures.reduce((a,b)=>a+b,0)/mesures.length; mesures=[]; if (moy>0.04 && etat.qualite>0.6){ etat.qualite*=0.8; moteur.redimensionner(); } }
  requestAnimationFrame(boucle);
}

/* --- accès pour les tests automatiques (tests/parcours.mjs) : les mêmes noms que dans la version légère --- */
function exposerPourLesTests(){
  Object.assign(window, {etat, J, cam, touches, deplacer, majCible, majInspection, saisir, reposer, OBJETS, parId, CURIOSITES,
    compteBonnes, fermerModales, imprimer, ouvrirBilan, progression});
}

async function demarrer(){
  etat.tactile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  etat.niveau = progression.niveau === 'lycee' ? 'lycee' : 'college';
  document.querySelectorAll('[data-niveau]').forEach(x=>x.setAttribute('aria-pressed', x.dataset.niveau===etat.niveau ? 'true':'false'));
  brancherBoutons(entrer);
  exposerPourLesTests();
  // Three.js exige WebGL 2 : sans lui, direction la version légère.
  if (!webgl2Disponible()){ erreurFatale('Cet appareil ne peut pas afficher cette version (WebGL 2).'); location.replace(LEGERE); return; }

  let donnees;
  try { donnees = await import('./donnees/curiosites.js'); }
  catch(err){ console.error(err); erreurFatale('Les textes du cabinet (outils/cabinet/js/donnees/curiosites.js) contiennent une erreur : ' + err.message + '.'); return; }
  for (const c of donnees.CURIOSITES || []){
    if (entreeValide(c) && MODELES[c.id] && PLACES[c.id] && !parId[c.id]){ CURIOSITES.push(c); parId[c.id] = c; }
    else console.warn('Curiosité écartée (entrée incomplète, en double, ou sans modèle ni place) :', c && c.id);
  }
  if (!CURIOSITES.length){ erreurFatale('Aucune curiosité utilisable dans js/donnees/curiosites.js.'); return; }

  try { moteur = await import('./rendu/moteur.js'); moteur.initMoteur($('scene')); window.moteur3d = moteur; }
  catch(err){ console.error(err); erreurFatale('La 3D n’a pas pu démarrer (' + err.message + ').'); return; }
  brancherCommandes(moteur.redimensionner);
  moteur.redimensionner();
  window.addEventListener('resize', moteur.redimensionner);
  // on laisse la page s'afficher avant de modeler tout le cabinet
  setTimeout(()=>{
    try { moteur.construireScene(); }
    catch(err){ console.error(err); erreurFatale('Le cabinet n’a pas pu être construit (' + err.message + ').'); return; }
    etat.pret = true; etat.ecran = 'accueil';
    const b=$('b-entrer'); b.disabled=false; b.textContent='Entrer dans le cabinet';
    requestAnimationFrame(boucle);
  }, 30);
}
demarrer();
