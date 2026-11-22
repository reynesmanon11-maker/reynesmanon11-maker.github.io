// Interface : fiche d'examen, carnet, bilan, impression, messages.
// Reprise de la version légère (section 5) ; les questions viennent de js/donnees/curiosites.js.
import { etat, CURIOSITES, parId, OBJETS, progression, sauver, toutEffacer, NIVEAUX, $, reduitMouvement } from '../jeu/etat.js';
import { touches, saisir, reposer } from '../jeu/joueur.js';

export function melanger(t){ const a=t.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
// on ne compte que les curiosités présentes : une entrée écartée ne fausse pas le bilan
const traitees = niv => CURIOSITES.filter(c=>progression.rep[niv][c.id]);
export function compteBonnes(niv){ return traitees(niv).filter(c=>progression.rep[niv][c.id].ok).length; }
export function majCompteur(){
  const vus = CURIOSITES.filter(c=>progression.vus[c.id]).length;
  $('compteur').textContent = `🔍 ${vus} / ${CURIOSITES.length} curiosités · ✓ ${compteBonnes(etat.niveau)}`;
}

/* --- fiche d'examen --- */
export function ouvrirFiche(ob){
  const c = parId[ob.id], Q = c[etat.niveau];
  $('f-emoji').textContent = c.emoji; $('f-nom').textContent = c.nom; $('f-latin').textContent = c.latin;
  $('f-regne').textContent = c.regne; $('f-niveau').textContent = 'Question ' + NIVEAUX[etat.niveau].toLowerCase();
  $('f-desc').textContent = c.desc; $('f-savais').textContent = c.savais;
  $('f-q').textContent = Q.q;
  $('f-astuce').textContent = etat.tactile ? 'Fais glisser le doigt sur l’objet pour le tourner.' : 'Fais glisser l’objet avec la souris pour le tourner. Échap pour le reposer.';
  const zone = $('f-choix'); zone.textContent = '';
  const ordre = melanger(Q.choix.map((_,i)=>i));
  ordre.forEach((idx,k)=>{
    const bt = document.createElement('button'); bt.type='button'; bt.dataset.i = idx;
    const l = document.createElement('span'); l.className='lettre'; l.textContent = String(k+1);
    const t = document.createElement('span'); t.textContent = Q.choix[idx];
    bt.append(l,t); bt.addEventListener('click', ()=>repondre(ob, idx));
    zone.appendChild(bt);
  });
  $('f-retour').textContent = '';
  const deja = progression.rep[etat.niveau][ob.id];
  if (deja) afficherRetour(ob, deja.choix, true);
  $('fiche').classList.remove('hidden');
  $('fiche').scrollTop = 0;
  const premier = zone.querySelector('button:not(:disabled)') || $('f-fermer');
  setTimeout(()=>premier.focus({preventScroll:true}), 60);
}
function repondre(ob, idx){
  const niv = etat.niveau;
  if (progression.rep[niv][ob.id]) return;
  const ok = idx === 0;
  progression.rep[niv][ob.id] = {ok, choix:idx};
  sauver(); majCompteur();
  afficherRetour(ob, idx, false);
}
function afficherRetour(ob, idx, deja){
  const c = parId[ob.id], Q = c[etat.niveau], ok = idx === 0;
  $('f-choix').querySelectorAll('button').forEach(bt=>{
    const i = +bt.dataset.i; bt.disabled = true;
    if (i === 0){ bt.classList.add('juste'); bt.querySelector('.lettre').textContent='✓'; bt.setAttribute('aria-label','Bonne réponse : '+Q.choix[i]); }
    else if (i === idx){ bt.classList.add('faux'); bt.querySelector('.lettre').textContent='✗'; bt.setAttribute('aria-label','Ta réponse, inexacte : '+Q.choix[i]); }
  });
  const box = document.createElement('div'); box.className = 'retour ' + (ok?'ok':'ko');
  const tit = document.createElement('strong');
  tit.textContent = (ok ? '✅ Bien vu !' : '❌ Pas tout à fait.') + (deja ? ' (tu avais déjà répondu)' : '');
  box.appendChild(tit);
  if (!ok){ const r=document.createElement('p'); r.className='rappel'; r.textContent='La bonne réponse : '+Q.choix[0]; box.appendChild(r); }
  const ex = document.createElement('p'); ex.textContent = Q.expl; box.appendChild(ex);
  const mots = document.createElement('div'); mots.className='mots';
  const lab = document.createElement('span'); lab.textContent='À retenir'; lab.style.background='#e8dcc0'; mots.appendChild(lab);
  c.mots.forEach(m=>{ const s=document.createElement('span'); s.textContent=m; mots.appendChild(s); });
  box.appendChild(mots);
  const pr = document.createElement('p'); pr.className='prog'; pr.textContent = Q.prog; box.appendChild(pr);
  const act = document.createElement('div'); act.className='f-actions';
  const bt = document.createElement('button'); bt.type='button'; bt.className='btn principal'; bt.textContent='Reposer l’objet';
  bt.addEventListener('click', reposer); act.appendChild(bt);
  box.appendChild(act);
  const zone = $('f-retour'); zone.textContent=''; zone.appendChild(box);
  if (!deja){ setTimeout(()=>{ box.scrollIntoView({behavior: reduitMouvement()?'auto':'smooth', block:'nearest'}); bt.focus({preventScroll:true}); }, 80); }
}

/* --- carnet et bilan --- */
export function ouvrirModale(id){
  fermerModales(); touches.clear();
  if (document.pointerLockElement) document.exitPointerLock();
  etat.modale = id; $(id).classList.remove('hidden');
  const f = $(id).querySelector('button'); if (f) setTimeout(()=>f.focus({preventScroll:true}), 30);
}
export function fermerModales(){ ['m-aide','m-carnet','m-bilan'].forEach(i=>$(i).classList.add('hidden')); etat.modale=null; }
function autreNiveau(){ return etat.niveau==='college' ? 'lycee' : 'college'; }
export function ouvrirCarnet(){
  const niv = etat.niveau, rep = progression.rep[niv];
  const vus = CURIOSITES.filter(c=>progression.vus[c.id]).length, faites = traitees(niv).length, bonnes = compteBonnes(niv);
  $('carnet-niveau').textContent = 'Niveau ' + NIVEAUX[niv].toLowerCase();
  $('carnet-barre').style.width = (100*faites/CURIOSITES.length)+'%';
  $('carnet-resume').textContent = `${vus} curiosité${vus>1?'s':''} trouvée${vus>1?'s':''} sur ${CURIOSITES.length} · ${faites} question${faites>1?'s':''} traitée${faites>1?'s':''}, dont ${bonnes} réussie${bonnes>1?'s':''} du premier coup.`;
  const g = $('carnet-grille'); g.textContent='';
  CURIOSITES.forEach(c=>{
    const d=document.createElement('div'); const connu=!!progression.vus[c.id];
    d.className='entree'+(connu?'':' inconnue');
    const em=document.createElement('span'); em.className='e-emoji'; em.textContent = connu ? c.emoji : '❔'; em.setAttribute('aria-hidden','true');
    const nm=document.createElement('strong'); nm.textContent = connu ? c.nom : 'À trouver';
    const et=document.createElement('span'); et.className='etat';
    if (!connu) et.textContent = c.ou;
    else if (!rep[c.id]) et.textContent = 'Question pas encore traitée';
    else et.textContent = rep[c.id].ok ? '✓ réussie' : '✗ à revoir';
    d.append(em,nm,et);
    if (connu){ const b=document.createElement('button'); b.type='button'; b.textContent='Faire venir l’objet'; b.addEventListener('click',()=>{ fermerModales(); saisir(OBJETS.find(o=>o.id===c.id)); }); d.appendChild(b); }
    g.appendChild(d);
  });
  $('b-niveau-carnet').textContent = 'Passer au niveau ' + NIVEAUX[autreNiveau()].toLowerCase();
  $('b-bilan-carnet').disabled = faites === 0;
  ouvrirModale('m-carnet');
}
export function ouvrirBilan(){
  const niv = etat.niveau, rep = progression.rep[niv];
  const faites = traitees(niv).length, bonnes = compteBonnes(niv), pct = faites ? Math.round(100*bonnes/faites) : 0;
  $('bilan-niveau').textContent = 'Niveau ' + NIVEAUX[niv].toLowerCase();
  const corps = $('bilan-corps'); corps.textContent='';
  const p1=document.createElement('p');
  p1.textContent = faites === CURIOSITES.length
    ? `Ton carnet est complet : ${bonnes} bonne${bonnes>1?'s':''} réponse${bonnes>1?'s':''} du premier coup sur ${CURIOSITES.length} (${pct} %).`
    : `${faites} question${faites>1?'s':''} traitée${faites>1?'s':''} sur ${CURIOSITES.length}, dont ${bonnes} réussie${bonnes>1?'s':''} du premier coup (${pct} %). Il reste des curiosités à trouver !`;
  const p2=document.createElement('p');
  p2.textContent = pct>=80 ? 'Un vrai regard de naturaliste.' : pct>=50 ? 'Belle exploration : relis les fiches marquées « à revoir ».' : 'Les explications des fiches sont là pour ça : refais venir les objets marqués « à revoir » depuis ton carnet.';
  const p3=document.createElement('p');
  p3.textContent = 'Ce que racontent ces curiosités : la diversité du vivant est le fruit de l’évolution (variations héréditaires, sélection naturelle, isolement), et la parenté entre les êtres vivants se lit dans les attributs qu’ils partagent.';
  const h=document.createElement('p'); h.className='sur-titre'; h.textContent='Les notions rencontrées';
  const mots=document.createElement('div'); mots.className='mots';
  const vus=new Set(); CURIOSITES.filter(c=>rep[c.id]).forEach(c=>c.mots.forEach(m=>{ if(!vus.has(m)){ vus.add(m); const s=document.createElement('span'); s.textContent=m; mots.appendChild(s);} }));
  corps.append(p1,p2,p3,h,mots);
  const ul=document.createElement('ul'); ul.style.cssText='margin:12px 0 0 18px;font-size:15px;line-height:1.6';
  CURIOSITES.forEach(c=>{ if(!rep[c.id]) return; const li=document.createElement('li'); li.textContent=(rep[c.id].ok?'✓ ':'✗ ')+c.nom; ul.appendChild(li); });
  corps.appendChild(ul);
  $('b-niveau-bilan').textContent = 'Essayer les questions ' + NIVEAUX[autreNiveau()].toLowerCase();
  ouvrirModale('m-bilan');
}
export function imprimer(){
  const niv = etat.niveau, rep = progression.rep[niv], zone = $('impression');
  zone.textContent='';
  const h=document.createElement('h1'); h.textContent='Mon carnet de naturaliste — Cabinet des curiosités';
  const p=document.createElement('p'); p.textContent=`Niveau ${NIVEAUX[niv].toLowerCase()} · ${new Date().toLocaleDateString('fr-FR')} · ${compteBonnes(niv)} réussite(s) du premier coup sur ${traitees(niv).length} question(s) traitée(s).`;
  const tb=document.createElement('table'); const tr0=document.createElement('tr');
  ['Curiosité','Question','Résultat','À retenir'].forEach(t=>{ const th=document.createElement('th'); th.textContent=t; tr0.appendChild(th); }); tb.appendChild(tr0);
  CURIOSITES.forEach(c=>{
    const tr=document.createElement('tr'); const r=rep[c.id];
    [c.nom+' ('+c.latin+')', c[niv].q, r ? (r.ok?'✓ réussie':'✗ à revoir — '+c[niv].choix[0]) : 'non traitée', c.mots.join(', ')].forEach(t=>{ const td=document.createElement('td'); td.textContent=t; tr.appendChild(td); });
    tb.appendChild(tr);
  });
  zone.append(h,p,tb);
  window.print();
}
let minuteurToast = 0;
export function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('vu'); clearTimeout(minuteurToast); minuteurToast=setTimeout(()=>t.classList.remove('vu'), 2600); }
export function consigne(msg){ const c=$('consigne'); if (!msg){ c.classList.add('hidden'); return; } c.textContent=msg; c.classList.remove('hidden'); }

/* --- boutons --- */
function changerNiveau(){ etat.niveau = autreNiveau(); progression.niveau = etat.niveau; sauver(); majCompteur(); fermerModales(); toast('Questions de niveau ' + NIVEAUX[etat.niveau].toLowerCase() + ' : les objets que tu as trouvés gardent leur place dans le carnet.'); }
export function brancherBoutons(entrer){
  document.querySelectorAll('[data-niveau]').forEach(b=>b.addEventListener('click', ()=>{
    etat.niveau = b.dataset.niveau; progression.niveau = etat.niveau; sauver();
    document.querySelectorAll('[data-niveau]').forEach(x=>x.setAttribute('aria-pressed', x===b ? 'true':'false'));
  }));
  $('b-entrer').addEventListener('click', entrer);
  $('b-commandes').addEventListener('click', ()=>{ $('m-aide').classList.remove('hidden'); etat.modale='m-aide'; $('m-aide').querySelector('button').focus(); });
  $('b-aide').addEventListener('click', ()=>ouvrirModale('m-aide'));
  $('b-carnet').addEventListener('click', ouvrirCarnet);
  $('b-saisir').addEventListener('click', ()=>saisir(etat.cible));
  $('f-fermer').addEventListener('click', reposer);
  $('b-bilan-carnet').addEventListener('click', ouvrirBilan);
  $('b-imprimer').addEventListener('click', imprimer);
  $('b-imprimer2').addEventListener('click', imprimer);
  $('b-niveau-carnet').addEventListener('click', changerNiveau);
  $('b-niveau-bilan').addEventListener('click', changerNiveau);
  $('b-effacer').addEventListener('click', ()=>{
    if (!confirm('Effacer toutes tes trouvailles et tes réponses, aux deux niveaux ?')) return;
    toutEffacer(); majCompteur(); ouvrirCarnet();
  });
  document.querySelectorAll('[data-fermer]').forEach(b=>b.addEventListener('click', ()=>{
    fermerModales();
    if (etat.ecran==='jeu' && !etat.inspection) consigne(etat.tactile ? 'Glisse à gauche pour marcher, à droite pour regarder.' : 'Clique dans la vue pour reprendre la promenade.');
    if (etat.ecran!=='jeu') $('b-entrer').focus();
  }));
}
