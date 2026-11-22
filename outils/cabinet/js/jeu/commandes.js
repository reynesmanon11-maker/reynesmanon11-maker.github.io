// Clavier, souris et écran tactile. Repris tels quels de la version légère (section 6).
import { etat, J, cam, $ } from './etat.js';
import { touches, manette, glisse, deplacer, viser, rayonEcran, saisir, reposer } from './joueur.js';
import { fermerModales, ouvrirCarnet, consigne } from '../ui/interface.js';

export { deplacer };

export function tournerRegard(dx, dy, k){ J.yaw += dx*k; J.pitch = Math.max(-1.45, Math.min(1.45, J.pitch - dy*k)); }

/** Branche les commandes ; « redimensionner » vient du moteur (le tactile change la résolution). */
export function brancherCommandes(redimensionner){
  const canvas = $('scene');

  /* --- clavier --- */
  window.addEventListener('keydown', e=>{
    if (etat.modale){ if (e.key==='Escape'){ fermerModales(); e.preventDefault(); if (etat.ecran!=='jeu') $('b-entrer').focus(); } return; }
    if (etat.ecran !== 'jeu') return;
    if (etat.inspection){
      if (e.key==='Escape'){ reposer(); e.preventDefault(); return; }
      if (/^[1-4]$/.test(e.key) && !e.target.closest('input,textarea')){
        const bts=$('f-choix').querySelectorAll('button'); const b=bts[+e.key-1]; if (b && !b.disabled){ b.click(); e.preventDefault(); }
      }
      return;
    }
    if (e.target.closest && e.target.closest('button,a') && (e.key===' '||e.key==='Enter')) return;
    touches.add(e.code);
    if (e.code==='KeyE'){ saisir(etat.cible); e.preventDefault(); }
    if (e.code==='KeyC'){ ouvrirCarnet(); e.preventDefault(); }
    if (/^Arrow/.test(e.code) || e.code==='Space') e.preventDefault();
  });
  window.addEventListener('keyup', e=>touches.delete(e.code));
  window.addEventListener('blur', ()=>{ touches.clear(); manette.id=null; });

  /* --- souris --- */
  canvas.addEventListener('mousedown', e=>{
    if (etat.ecran!=='jeu' || etat.modale || e.button!==0) return;
    if (etat.inspection){ glisse.tourne={x:e.clientX, y:e.clientY}; return; }
    if (document.pointerLockElement===canvas){ saisir(etat.cible); return; }
    glisse.regard={x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY, bouge:false};
  });
  window.addEventListener('mousemove', e=>{
    if (etat.ecran!=='jeu') return;
    const tourne = glisse.tourne, regard = glisse.regard;
    if (tourne && etat.inspection){ const i=etat.inspection; i.ry += (e.clientX-tourne.x)*0.01; i.rx = Math.max(-1.3, Math.min(1.5, i.rx + (e.clientY-tourne.y)*0.01)); glisse.tourne={x:e.clientX, y:e.clientY}; return; }
    if (document.pointerLockElement===canvas){ tournerRegard(e.movementX, e.movementY, 0.0024); return; }
    if (regard){ const dx=e.clientX-regard.x, dy=e.clientY-regard.y; regard.x=e.clientX; regard.y=e.clientY;
      if (Math.abs(e.clientX-regard.x0)+Math.abs(e.clientY-regard.y0)>5) regard.bouge=true;
      tournerRegard(dx, dy, 0.005); }
  });
  window.addEventListener('mouseup', e=>{
    glisse.tourne=null;
    if (!glisse.regard) return;
    const r=glisse.regard; glisse.regard=null;
    if (r.bouge || etat.inspection || etat.modale) return;
    const ob = viser(cam.pos, rayonEcran(e.clientX, e.clientY));
    if (ob){ saisir(ob); return; }
    demanderCapture();
  });
  function demanderCapture(){
    if (etat.verrouImpossible || !canvas.requestPointerLock) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(()=>{ etat.verrouImpossible = true; consigne('Fais glisser la souris pour regarder autour de toi.'); }); }
    catch(err){ etat.verrouImpossible = true; }
  }
  document.addEventListener('pointerlockchange', ()=>{
    if (document.pointerLockElement===canvas){ consigne(''); }
    else if (etat.ecran==='jeu' && !etat.inspection && !etat.modale){ consigne('Clique dans la vue pour reprendre la promenade.'); }
  });
  document.addEventListener('pointerlockerror', ()=>{ etat.verrouImpossible = true; consigne('Fais glisser la souris pour regarder autour de toi.'); });

  /* --- tactile --- */
  canvas.addEventListener('touchstart', e=>{
    if (etat.ecran!=='jeu' || etat.modale) return;
    e.preventDefault();
    if (!etat.tactile){ etat.tactile = true; redimensionner(); }
    for (const t of e.changedTouches){
      if (etat.inspection){ glisse.tourne={id:t.identifier, x:t.clientX, y:t.clientY}; continue; }
      if (t.clientX < window.innerWidth*0.45 && manette.id===null){
        Object.assign(manette, {id:t.identifier, x0:t.clientX, y0:t.clientY, x:0, y:0});
        const m=$('manette'); m.style.left=t.clientX+'px'; m.style.top=t.clientY+'px'; m.firstElementChild.style.transform=''; m.classList.remove('hidden');
      } else if (!glisse.regard){ glisse.regard={id:t.identifier, x:t.clientX, y:t.clientY, x0:t.clientX, y0:t.clientY, t0:performance.now(), bouge:false}; }
    }
    if (etat.temps-etat.derniereConsigne>1) consigne('');
  }, {passive:false});
  canvas.addEventListener('touchmove', e=>{
    if (etat.ecran!=='jeu') return;
    e.preventDefault();
    for (const t of e.changedTouches){
      const tourne = glisse.tourne, regard = glisse.regard;
      if (tourne && tourne.id===t.identifier && etat.inspection){ const i=etat.inspection; i.ry += (t.clientX-tourne.x)*0.012; i.rx=Math.max(-1.3,Math.min(1.5,i.rx+(t.clientY-tourne.y)*0.012)); tourne.x=t.clientX; tourne.y=t.clientY; }
      else if (t.identifier===manette.id){
        let dx=t.clientX-manette.x0, dy=t.clientY-manette.y0; const l=Math.hypot(dx,dy), max=50; if (l>max){ dx*=max/l; dy*=max/l; }
        manette.x=dx/max; manette.y=dy/max; $('manette').firstElementChild.style.transform=`translate(${dx}px,${dy}px)`;
      } else if (regard && regard.id===t.identifier){
        const dx=t.clientX-regard.x, dy=t.clientY-regard.y; regard.x=t.clientX; regard.y=t.clientY;
        if (Math.abs(t.clientX-regard.x0)+Math.abs(t.clientY-regard.y0)>10) regard.bouge=true;
        tournerRegard(dx, dy, 0.006);
      }
    }
  }, {passive:false});
  function finToucher(e){
    for (const t of e.changedTouches){
      if (glisse.tourne && glisse.tourne.id===t.identifier) glisse.tourne=null;
      if (t.identifier===manette.id){ manette.id=null; manette.x=manette.y=0; $('manette').classList.add('hidden'); }
      if (glisse.regard && glisse.regard.id===t.identifier){
        const r=glisse.regard; glisse.regard=null;
        if (!r.bouge && performance.now()-r.t0<350 && !etat.inspection){ const ob=viser(cam.pos, rayonEcran(t.clientX,t.clientY)); if (ob) saisir(ob); }
      }
    }
  }
  canvas.addEventListener('touchend', finToucher);
  canvas.addEventListener('touchcancel', finToucher);
}
