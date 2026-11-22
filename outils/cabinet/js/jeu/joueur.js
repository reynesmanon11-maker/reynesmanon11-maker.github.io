// Le joueur : marcher, viser, saisir, tourner et reposer une curiosité.
// Repris de la version légère (section 6) ; seule la pose de l'objet tenu est rendue
// sous forme position + quaternion + échelle, pour Three.js, au lieu d'une matrice.
import { etat, J, cam, OBJETS, CURIOSITES, parId, progression, sauver, PORTEE, $, reduitMouvement } from './etat.js';
import { add, sub, sca, dot, cross, nrm, qAxe, qMul, qSlerp } from '../procedural/geometrie.js';
import { SOLIDES } from '../procedural/decor.js';
import { ouvrirFiche, majCompteur, toast, consigne, ouvrirBilan } from '../ui/interface.js';

export const touches = new Set();
export const manette = {id:null, x0:0, y0:0, x:0, y:0};
// glisser pour regarder (tactile, ou souris sans capture) et glisser pour tourner l'objet tenu
export const glisse = {regard:null, tourne:null};

export function baseCamera(yaw, pitch){
  const cp=Math.cos(pitch);
  const f=[Math.sin(yaw)*cp, Math.sin(pitch), -Math.cos(yaw)*cp];
  const d=[Math.cos(yaw), 0, Math.sin(yaw)];
  return {f, d, h:cross(d,f)};
}

export function collision(x, z){
  const r = 0.28;
  for (const s of SOLIDES) if (x>s[0]-r && x<s[2]+r && z>s[1]-r && z<s[3]+r) return true;
  return false;
}
export function deplacer(dt){
  let av=0, la=0;
  if (touches.has('KeyW')||touches.has('ArrowUp')) av+=1;
  if (touches.has('KeyS')||touches.has('ArrowDown')) av-=1;
  if (touches.has('KeyD')||touches.has('ArrowRight')) la+=1;
  if (touches.has('KeyA')||touches.has('ArrowLeft')) la-=1;
  if (manette.id!==null){ av += -manette.y; la += manette.x; }
  const n=Math.hypot(av,la); if (n>1){ av/=n; la/=n; }
  const v=((touches.has('ShiftLeft')||touches.has('ShiftRight')) ? 3.6 : 2.0)*dt;
  const fx=Math.sin(J.yaw), fz=-Math.cos(J.yaw), rx=Math.cos(J.yaw), rz=Math.sin(J.yaw);
  const dx=(fx*av+rx*la)*v, dz=(fz*av+rz*la)*v;
  if (dx && !collision(J.x+dx, J.z)) J.x+=dx;
  if (dz && !collision(J.x, J.z+dz)) J.z+=dz;
  if (n>0.05) J.pas += dt*9*Math.min(1,n);
}

/* --- visée : une sphère invisible autour de chaque curiosité, même pour un modèle détaillé --- */
export function interSphere(o, d, c, r){
  const oc=sub(o,c), b=dot(oc,d), cc=dot(oc,oc)-r*r, disc=b*b-cc;
  if (disc<0) return null;
  const s=Math.sqrt(disc); let t=-b-s; if (t<0) t=-b+s; return t<0 ? null : t;
}
export function viser(o, d){
  let best=null, bt=PORTEE;
  for (const ob of OBJETS){ const t=interSphere(o,d,ob.pos,Math.max(0.12, ob.rayon*0.85)); if (t!==null && t<bt){ bt=t; best=ob; } }
  return best;
}
export function rayonEcran(px, py){
  const r=$('scene').getBoundingClientRect(), nx=((px-r.left)/r.width)*2-1, ny=1-((py-r.top)/r.height)*2;
  const th=Math.tan(cam.fov/2), b=baseCamera(J.yaw,J.pitch);
  return nrm(add(b.f, add(sca(b.d, nx*th*cam.asp), sca(b.h, ny*th))));
}
export function majCible(){
  const ancienne = etat.cible;
  etat.cible = (etat.ecran==='jeu' && !etat.inspection && !etat.modale) ? viser(cam.pos, baseCamera(J.yaw,J.pitch).f) : null;
  if (ancienne === etat.cible) return;
  const v=$('viseur'), c=$('cible'), bs=$('b-saisir');
  if (etat.cible){
    v.classList.add('actif');
    const nom = progression.vus[etat.cible.id] ? parId[etat.cible.id].nom : 'Une curiosité';
    c.textContent = (etat.tactile ? '✋ ' : '✋ Saisir : ') + nom;
    if (!etat.tactile){ const k=document.createElement('kbd'); k.textContent='clic ou E'; c.appendChild(k); }
    c.classList.remove('hidden');
    if (etat.tactile) bs.classList.remove('hidden');
  } else { v.classList.remove('actif'); c.classList.add('hidden'); bs.classList.add('hidden'); }
}

/* --- saisir, examiner, reposer --- */
export function saisir(ob){
  if (!ob || etat.inspection) return;
  if (document.pointerLockElement) document.exitPointerLock();
  touches.clear(); manette.id=null; $('manette').classList.add('hidden');
  etat.inspection = {ob, t:0, sens:1, rx:ob.tourne?0.3:0, ry:0};
  const nouveau = !progression.vus[ob.id];
  progression.vus[ob.id] = true; sauver(); majCompteur();
  if (nouveau) toast('📔 Nouvelle curiosité dans ton carnet : ' + parId[ob.id].nom);
  $('viseur').classList.add('hidden'); $('cible').classList.add('hidden'); $('b-saisir').classList.add('hidden'); consigne('');
  etat.cible = null;
  ouvrirFiche(ob);
}
export function reposer(){
  const insp = etat.inspection; if (!insp || insp.sens<0) return;
  insp.sens = -1;
  $('fiche').classList.add('hidden');
  $('scene').focus({preventScroll:true});
}
function finInspection(){
  etat.inspection = null;
  $('viseur').classList.remove('hidden');
  const niv = etat.niveau;
  if (CURIOSITES.every(c=>progression.rep[niv][c.id]) && !progression.bilanVu[niv]){
    progression.bilanVu[niv] = true; sauver(); ouvrirBilan(); return;
  }
  consigne(etat.tactile ? 'Glisse à gauche pour marcher, à droite pour regarder.' : (etat.verrouImpossible ? 'Fais glisser la souris pour regarder.' : 'Clique dans la vue pour reprendre la promenade.'));
  etat.derniereConsigne = etat.temps;
}
export function majInspection(dt){
  const insp = etat.inspection; if (!insp) return;
  insp.t += insp.sens*dt/0.5;
  if (insp.t >= 1){ insp.t = 1; if (insp.ob.tourne && !glisse.tourne && !reduitMouvement()) insp.ry += dt*0.4; }
  if (insp.t <= 0 && insp.sens < 0) finInspection();
}

/* Où se tient l'objet en main : devant les yeux, à gauche de la fiche sur grand écran,
   au-dessus d'elle sur téléphone, et assez grand pour être examiné. */
function poseTenue(ob){
  const large = window.innerWidth >= 820;
  const th = Math.tan(cam.fov/2), frac = large ? 0.42 : 0.3;
  const dist = Math.max(0.3, ob.tenue/(frac*th));
  const ndc = large ? [-0.38, 0.04] : [0, 0.47];
  const b = baseCamera(J.yaw, J.pitch);
  const p = add(cam.pos, add(sca(b.f,dist), add(sca(b.d, ndc[0]*th*cam.asp*dist), sca(b.h, ndc[1]*th*dist))));
  const insp = etat.inspection;
  const q = qMul(qAxe(0,1,0,-J.yaw), qMul(qAxe(1,0,0,insp.rx), qAxe(0,1,0,insp.ry)));
  return {p, q, s:Math.max(0.15, Math.min(3, ob.tenue/ob.rayon))};
}
/** Pose de l'objet saisi, entre sa place (e = 0) et la main (e = 1). */
export function poseObjet(ob, e){
  const t = poseTenue(ob);
  const p = [ob.pos[0]+(t.p[0]-ob.pos[0])*e, ob.pos[1]+(t.p[1]-ob.pos[1])*e, ob.pos[2]+(t.p[2]-ob.pos[2])*e];
  return {p, q:qSlerp(ob.q, t.q, e), s:1+(t.s-1)*e};
}
