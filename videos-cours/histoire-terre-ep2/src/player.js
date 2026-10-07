/* ===================== lecteur =====================
   #render dans l'adresse : mode rendu (pas d'audio, pas d'interface).
   Sinon : la page joue l'épisode en lisant voix.m4a, posé à côté d'elle. */
(function(){
const stage = document.getElementById('stage');
function fit(){ const k = Math.min(innerWidth/1920, innerHeight/1080); stage.style.transform = `scale(${k})`; }
addEventListener('resize', fit); fit();

const OFF = window.OFFSET;                    // durée du générique muet avant la voix
const barre = document.getElementById('barre'), chap = document.getElementById('chap');
const CHAPS = window.CHAPITRES;
window.onSeek = t => {
  barre.style.width = (100*Math.max(0,(t+OFF))/(window.EP_END+OFF)) + '%';
  let c = ''; for (const [t0,txt] of CHAPS) if (t >= t0) c = txt;
  if (chap.textContent !== c) chap.textContent = c;
};
if (location.hash === '#render'){ document.body.classList.add('render'); window.seek(-OFF); return; }

const audio = new Audio('voix.m4a'); audio.preload = 'auto';
const pos = document.getElementById('pos'), bt = document.getElementById('bt'), st = document.getElementById('st');
let t0 = null, debut = 0, sousTitres = true;
// avant la voix (générique), on fait tourner une horloge ; ensuite l'audio fait foi
function now(){ return t0 !== null ? (performance.now()-t0)/1000 - OFF + debut : audio.currentTime; }
function boucle(){
  let t = now();
  if (t0 !== null && t >= 0){ t0 = null; audio.currentTime = t; audio.play(); }
  window.seek(t);
  pos.value = (t+OFF)/(window.EP_END+OFF)*1000;
  const s = sousTitres ? window.SUBS.find(x => t >= x[0] && t <= x[1]) : null;
  const h = s ? `<span>${s[2]}</span>` : '';
  if (st.innerHTML !== h) st.innerHTML = h;
  if (!document.body.classList.contains('pause')) requestAnimationFrame(boucle);
}
function lire(){
  document.body.classList.remove('pause'); bt.textContent = 'Pause';
  const t = audio.currentTime;
  if (t < .01 && debut <= 0){ t0 = performance.now(); debut = 0; } else audio.play();
  requestAnimationFrame(boucle);
}
function pause(){ document.body.classList.add('pause'); bt.textContent = 'Lecture'; audio.pause(); t0 = null; }
document.getElementById('go').onclick = e => { e.currentTarget.remove(); lire(); };
bt.onclick = () => document.body.classList.contains('pause') ? lire() : pause();
document.getElementById('cc').onclick = e => { sousTitres = !sousTitres; e.target.style.opacity = sousTitres ? 1 : .45; };
pos.oninput = () => { const t = pos.value/1000*(window.EP_END+OFF) - OFF;
  t0 = null; audio.currentTime = Math.max(0,t); window.seek(Math.max(0,t)); };
addEventListener('keydown', e => { if (e.code==='Space'){ e.preventDefault(); bt.click(); }
  if (e.code==='ArrowRight') audio.currentTime += 5; if (e.code==='ArrowLeft') audio.currentTime -= 5; });
audio.onended = pause;
document.body.classList.add('pause'); window.seek(-OFF);
})();
