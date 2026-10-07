/* ===================== moteur de l'épisode =====================
   Tout est piloté par une seule fonction, seek(t) : l'état de chaque élément
   se calcule à partir du temps, jamais d'une animation CSS qui tournerait
   seule. Le même fichier sert donc au lecteur (t = position de l'audio) et au
   rendu image par image de la vidéo (t = numéro d'image / 25). */
(function(){
const clamp = (x,a=0,b=1) => Math.max(a, Math.min(b, x));
const ease = p => p<.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;      // cubique
const easeOut = p => 1 - Math.pow(1-p, 3);
const back = p => { const c=1.7; return 1 + (c+1)*Math.pow(p-1,3) + c*Math.pow(p-1,2); };
const lerp = (a,b,p) => a + (b-a)*p;

const scenes = [...document.querySelectorAll('.sc')].map(el => ({
  el, t0:+el.dataset.in, t1:+el.dataset.out,
  cam: el.querySelector('.cam'),
  keys: (el.dataset.cam||'').split(';').filter(s=>s.trim()).map(s=>s.trim().split(/[\s,]+/).map(Number))
}));
const items = [...document.querySelectorAll('[data-t]')].map(el => {
  const fx = el.dataset.fx || 'up';
  const it = { el, fx, t:+el.dataset.t, d:+(el.dataset.d || (fx==='draw'?1.4:fx==='type'?1.2:.7)),
    out: el.dataset.o!==undefined ? +el.dataset.o : null };
  if (fx==='type'){ it.txt = el.textContent; }
  if (fx==='count'){ it.to = +el.dataset.to; it.dec = +(el.dataset.dec||0); }
  if (fx==='rot'||fx==='move'){ it.to=+(el.dataset.to||0); it.dx=+(el.dataset.dx||0); it.dy=+(el.dataset.dy||0); }
  if (fx==='draw'){ el.setAttribute('pathLength','1'); el.style.strokeDasharray='1 1'; }
  return it;
});

function apply(it, t){
  const p = clamp((t - it.t)/it.d), e = ease(p), s = it.el.style;
  let o = 1;
  if (it.out!==null) o = 1 - clamp((t - it.out)/.45);
  switch(it.fx){
    case 'fade': s.opacity = e*o; break;
    case 'up':   s.opacity = e*o; s.transform = `translateY(${(1-easeOut(p))*34}px)`; break;
    case 'left': s.opacity = e*o; s.transform = `translateX(${(1-easeOut(p))*-60}px)`; break;
    case 'right':s.opacity = e*o; s.transform = `translateX(${(1-easeOut(p))*60}px)`; break;
    case 'pop':  s.opacity = clamp(p*3)*o; s.transform = `scale(${p<=0?.4:lerp(.4,1,back(p))})`; break;
    case 'zoom': s.opacity = e*o; s.transform = `scale(${lerp(1.25,1,easeOut(p))})`; break;
    case 'draw': s.strokeDashoffset = 1 - e; s.opacity = (p>0?1:0)*o; break;
    case 'wipe': s.opacity = o; s.clipPath = `inset(-5% ${(1-e)*105}% -5% -5%)`; break;
    case 'wipedown': s.opacity = o; s.clipPath = `inset(-5% -5% ${(1-e)*105}% -5%)`; break;
    case 'grow': s.opacity = (p>0?1:0)*o; s.transform = `scaleY(${easeOut(p)})`; break;
    case 'growx': s.opacity = (p>0?1:0)*o; s.transform = `scaleX(${easeOut(p)})`; break;
    case 'type': { s.opacity = o; const n = Math.round(it.txt.length*clamp((t-it.t)/it.d));
      const v = it.txt.slice(0,n); if (it.el.textContent!==v) it.el.textContent = v; break; }
    case 'count': { s.opacity = (p>0?1:0)*o; const v = (it.to*easeOut(p)).toFixed(it.dec).replace('.',',');
      const f = v.replace(/\B(?=(\d{3})+(?!\d))/g,' '); if (it.el.textContent!==f) it.el.textContent = f; break; }
    case 'hl':   s.backgroundSize = `${e*100}% 100%`; s.opacity = o; break;
    // rotation (data-to, en degrés) ou translation (data-dx, data-dy) progressives : l'élément reste visible avant
    case 'rot':  s.transform = `rotate(${it.to*e}deg)`; break;
    case 'move': s.transform = `translate(${it.dx*e}px,${it.dy*e}px)`; break;
    case 'glow': s.opacity = o; s.filter = `drop-shadow(0 0 ${e*14}px currentColor)`; break;
  }
}

function camAt(keys, t){
  if (!keys.length) return [0,0,1];
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i=1;i<keys.length;i++){
    const [ta,...a] = keys[i-1], [tb,...b] = keys[i];
    if (t <= tb){ const p = ease(clamp((t-ta)/(tb-ta))); return a.map((v,j)=>lerp(v,b[j],p)); }
  }
  return keys[keys.length-1].slice(1);
}

window.seek = function(t){
  for (const sc of scenes){
    const on = t >= sc.t0 - .8 && t <= sc.t1 + .8;
    sc.el.style.visibility = on ? 'visible' : 'hidden';
    if (!on) continue;
    sc.el.style.opacity = clamp((t - sc.t0)/.6) * (1 - clamp((t - sc.t1)/.6));
    if (sc.cam){
      const [x,y,k] = camAt(sc.keys, t);
      // dérive lente permanente : la caméra n'est jamais tout à fait figée
      const drift = 1 + .018*clamp((t-sc.t0)/Math.max(1,sc.t1-sc.t0));
      sc.cam.style.transform = `translate(${x}px,${y}px) scale(${k*drift})`;
    }
  }
  for (const it of items){
    const sc = it.el.closest('.sc');
    if (sc && sc.style.visibility==='hidden') continue;
    apply(it, t);
  }
  if (window.onSeek) window.onSeek(t);
};
window.EP_END = Math.max(...scenes.map(s=>s.t1));
})();
