// Textures dessinées sur des canevas (parquet, bois, papier peint, planche d'anatomie,
// boîte de phalènes, étiquettes, globe…). Reprises telles quelles de la version légère.
import { TAU, aleaGraine } from './geometrie.js';

/* --- textures dessinées sur des canevas --- */
export function toile(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return [c, c.getContext('2d')]; }
export function texParquet(){
  const [c,x]=toile(512,512), r=aleaGraine(7);
  x.fillStyle='#2e1c10'; x.fillRect(0,0,512,512);
  const latte=(px,row,L,teinte,lum,graines)=>{
    x.save(); x.beginPath(); x.rect(px+1,row*64+1,L-2,62); x.clip();
    x.fillStyle=`hsl(${teinte},46%,${lum}%)`; x.fillRect(px,row*64,L,64);
    for (const gr of graines){
      x.strokeStyle=`rgba(25,12,4,${gr.a})`; x.lineWidth=gr.w; x.beginPath();
      for (let s=0;s<=L;s+=8){ const yy=row*64+gr.y+Math.sin((s+gr.ph)/38)*gr.am; s===0?x.moveTo(px+s,yy):x.lineTo(px+s,yy); }
      x.stroke();
    }
    x.restore();
  };
  for (let row=0;row<8;row++){
    let px = -Math.floor(r()*200);
    while (px < 512){
      const L=140+Math.floor(r()*220), teinte=22+r()*10, lum=27+r()*13, graines=[];
      for (let k=0;k<13;k++) graines.push({y:3+r()*58, ph:r()*300, am:0.6+r()*2.6, a:0.07+r()*0.13, w:0.6+r()*1.3});
      latte(px,row,L,teinte,lum,graines);
      if (px+L>512) latte(px-512,row,L,teinte,lum,graines);
      if (px<0) latte(px+512,row,L,teinte,lum,graines);
      px += L;
    }
  }
  return c;
}
export function texBois(){
  const [c,x]=toile(256,256), r=aleaGraine(11);
  x.fillStyle='#dcc6a4'; x.fillRect(0,0,256,256);
  for (let k=0;k<70;k++){
    const x0=r()*256, a=0.05+r()*0.16, w=0.5+r()*2.2, am=1+r()*5, f=1+Math.floor(r()*3), ph=r()*TAU;
    for (const dx of [0,-256,256]){
      x.strokeStyle=`rgba(95,58,30,${a})`; x.lineWidth=w; x.beginPath();
      for (let y=0;y<=256;y+=4){ const xx=x0+dx+Math.sin(y/256*TAU*f+ph)*am; y===0?x.moveTo(xx,y):x.lineTo(xx,y); }
      x.stroke();
    }
  }
  return c;
}
export function texTapisserie(){
  const [c,x]=toile(256,256);
  x.fillStyle='#284534'; x.fillRect(0,0,256,256);
  for (let i=0;i<256;i+=16){ x.fillStyle='rgba(0,0,0,0.06)'; x.fillRect(i,0,8,256); }
  const motif=(cx,cy)=>{
    x.save(); x.translate(cx,cy);
    x.strokeStyle='rgba(214,184,116,0.22)'; x.fillStyle='rgba(214,184,116,0.12)'; x.lineWidth=3;
    x.beginPath(); x.ellipse(0,0,14,30,0,0,TAU); x.fill(); x.stroke();
    for (const s of [-1,1]){
      x.beginPath(); x.moveTo(0,22); x.bezierCurveTo(s*40,30,s*52,-6,s*30,-26); x.bezierCurveTo(s*22,-34,s*10,-24,s*18,-14); x.stroke();
      x.beginPath(); x.moveTo(0,-30); x.bezierCurveTo(s*18,-46,s*30,-40,s*24,-56); x.stroke();
      x.beginPath(); x.arc(s*30,-26,4,0,TAU); x.fill();
    }
    x.beginPath(); x.arc(0,-46,7,0,TAU); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(0,30); x.lineTo(0,52); x.stroke();
    x.restore();
  };
  motif(128,128); motif(0,0); motif(256,0); motif(0,256); motif(256,256);
  const r=aleaGraine(5);
  for (let k=0;k<1500;k++){ x.fillStyle=`rgba(0,0,0,${r()*0.08})`; x.fillRect(r()*256,r()*256,2,2); }
  return c;
}
export function texBrique(){
  const [c,x]=toile(256,256), r=aleaGraine(3);
  x.fillStyle='#b8aa94'; x.fillRect(0,0,256,256);
  for (let row=0;row<8;row++) for (let k=-1;k<5;k++){
    const bx=k*64+(row%2?32:0), by=row*32;
    x.fillStyle=`hsl(${12+r()*12},${38+r()*14}%,${30+r()*12}%)`;
    x.fillRect(bx+3,by+3,58,26);
    x.fillStyle=`rgba(0,0,0,${r()*0.12})`; x.fillRect(bx+3,by+18,58,11);
  }
  return c;
}
export function texDalles(){
  const [c,x]=toile(256,256), r=aleaGraine(9);
  x.fillStyle='#6d6152'; x.fillRect(0,0,256,256);
  for (let i=0;i<4;i++) for (let j=0;j<4;j++){
    const clair=(i+j)%2===0;
    x.fillStyle = clair ? `hsl(40,${30+r()*8}%,${72+r()*6}%)` : `hsl(${18+r()*6},${45+r()*8}%,${40+r()*6}%)`;
    x.fillRect(i*64+2,j*64+2,60,60);
  }
  for (let k=0;k<2500;k++){ x.fillStyle=`rgba(0,0,0,${r()*0.07})`; x.fillRect(r()*256,r()*256,2,2); }
  return c;
}
export function texTapis(){
  const [c,x]=toile(512,512), r=aleaGraine(21);
  x.fillStyle='#5a1611'; x.fillRect(0,0,512,512);
  x.fillStyle='#1d2a44'; x.fillRect(0,0,512,46); x.fillRect(0,466,512,46); x.fillRect(0,0,46,512); x.fillRect(466,0,46,512);
  x.strokeStyle='#c9a24e'; x.lineWidth=4; x.strokeRect(50,50,412,412); x.strokeRect(14,14,484,484);
  for (let i=60;i<452;i+=24){ for (const [px,py] of [[i,23],[i,489],[23,i],[489,i]]){ x.fillStyle='#c9a24e'; x.beginPath(); x.moveTo(px,py-7); x.lineTo(px+7,py); x.lineTo(px,py+7); x.lineTo(px-7,py); x.fill(); } }
  x.save(); x.translate(256,256);
  x.fillStyle='#1d2a44'; x.beginPath(); x.moveTo(0,-150); x.lineTo(110,0); x.lineTo(0,150); x.lineTo(-110,0); x.closePath(); x.fill();
  x.strokeStyle='#c9a24e'; x.lineWidth=5; x.stroke();
  x.fillStyle='#8c2a1e'; x.beginPath(); x.moveTo(0,-90); x.lineTo(65,0); x.lineTo(0,90); x.lineTo(-65,0); x.closePath(); x.fill();
  x.fillStyle='#e4cf9a'; x.beginPath(); x.arc(0,0,22,0,TAU); x.fill();
  x.restore();
  for (const [px,py] of [[92,92],[420,92],[92,420],[420,420]]){ x.fillStyle='#1d2a44'; x.beginPath(); x.arc(px,py,26,0,TAU); x.fill(); x.strokeStyle='#c9a24e'; x.lineWidth=3; x.stroke(); }
  for (let k=0;k<60;k++){ const px=80+r()*352, py=80+r()*352; if (Math.abs(px-256)/110+Math.abs(py-256)/150<1.08) continue;
    x.fillStyle=r()<0.5?'#e4cf9a':'#c9a24e'; x.beginPath(); x.arc(px,py,3+r()*4,0,TAU); x.fill(); }
  for (let k=0;k<5000;k++){ x.fillStyle=`rgba(0,0,0,${r()*0.1})`; x.fillRect(r()*512,r()*512,2,2); }
  return c;
}
export const PALETTE_LIVRES = ['#6e1d17','#1f3d2b','#1d2a4a','#5a3a1c','#7a5a1e','#3b1f33','#2c2a26','#8a4a1c'];
export function texLivres(){
  const [c,x]=toile(512,256);
  PALETTE_LIVRES.forEach((coul,i)=>{
    const x0=i*64;
    const g=x.createLinearGradient(x0,0,x0+64,0); g.addColorStop(0,'rgba(0,0,0,0.45)'); g.addColorStop(0.5,'rgba(255,255,255,0.08)'); g.addColorStop(1,'rgba(0,0,0,0.45)');
    x.fillStyle=coul; x.fillRect(x0,0,64,256); x.fillStyle=g; x.fillRect(x0,0,64,256);
    x.fillStyle='#d3ad55';
    for (const y of [22,30,226,234]) x.fillRect(x0+4,y,56,3);
    if (i%2===0){ x.fillRect(x0+8,96,48,2); x.fillRect(x0+8,140,48,2); x.fillStyle='rgba(0,0,0,0.35)'; x.fillRect(x0+8,99,48,40); }
    else { x.fillRect(x0+6,110,52,3); x.fillRect(x0+6,124,52,3); }
  });
  return c;
}
export function rectLivre(i){ return [i/8, 0, (i+1)/8, 1]; }
export function texEcaille(){
  const [c,x]=toile(512,256), r=aleaGraine(13);
  x.fillStyle='#3a2512'; x.fillRect(0,0,512,256);
  // v = 1 en haut de la carapace (haut du canevas), 0,5 au bord : on dessine la moitié haute
  const rangs=[[0,26,1],[26,64,5],[64,104,8],[104,128,26]];
  for (const [y0,y1,n] of rangs){
    for (let k=0;k<n;k++){
      const x0=k*512/n, w=512/n;
      const cx=x0+w/2, cy=(y0+y1)/2;
      x.fillStyle=`hsl(${26+r()*8},${45+r()*10}%,${24+r()*8}%)`;
      x.fillRect(x0+2,y0+2,w-4,y1-y0-4);
      for (let a=0;a<5;a++){ const f=1-a*0.18; x.strokeStyle=`rgba(${a%2?20:120},${a%2?12:80},${a%2?6:40},0.35)`; x.lineWidth=2;
        x.strokeRect(cx-(w/2-4)*f, cy-((y1-y0)/2-4)*f, (w-8)*f, (y1-y0-8)*f); }
      x.fillStyle='rgba(190,140,70,0.35)'; x.fillRect(cx-w*0.12,cy-(y1-y0)*0.12,w*0.24,(y1-y0)*0.24);
    }
  }
  x.fillStyle='#5b4422'; x.fillRect(0,128,512,128);
  return c;
}

/* planche d'anatomie comparée : quatre membres antérieurs, os de même couleur ET de même numéro */
export const COUL_OS = {h:'#b5452f', r:'#d9a520', c:'#4f8f3a', m:'#3b6ea8'};
export function membres(){
  const os=(t,x1,y1,x2,y2,w)=>({t,s:[x1,y1,x2,y2],w});
  const rond=(x,y,r)=>({t:'c',o:[x,y,r]});
  const doigt=(x,y,ang,n,l,w0)=>{ const L=[]; let px=x, py=y; for (let k=0;k<n;k++){ const nx=px+Math.sin(ang)*l, ny=py+Math.cos(ang)*l; L.push(os('m',px,py,nx,ny,Math.max(2,w0-k*0.8))); px=nx+Math.sin(ang)*3; py=ny+Math.cos(ang)*3; } return L; };
  const homme = {nom:'Homme', usage:'saisir', os:[
    os('h',0,0,0,160,17), os('r',-8,170,-16,300,9), os('r',8,170,10,300,10),
    rond(-14,312,6), rond(-2,312,6), rond(10,312,6), rond(-16,325,6), rond(-4,325,6), rond(8,325,6), rond(18,320,5),
    ...doigt(-22,330,-0.55,3,20,7), ...doigt(-10,334,-0.1,4,22,6), ...doigt(1,336,0,4,24,6), ...doigt(12,334,0.1,4,22,6), ...doigt(21,331,0.25,4,18,5)
  ]};
  const chauve = {nom:'Chauve-souris', usage:'voler', voile:[[4,40],[70,300],[150,420],[188,545],[134,552],[86,505],[20,470],[-6,300]], os:[
    os('h',0,0,18,110,12), os('r',20,118,70,292,8), os('r',24,120,34,170,4),
    rond(68,302,5), rond(78,300,5), rond(73,311,5),
    os('m',70,307,58,330,4), os('m',58,333,52,346,3),
    ...doigt(80,308,0.55,3,48,5), ...doigt(80,310,0.42,3,72,5), ...doigt(78,312,0.22,3,68,5), ...doigt(75,312,0.05,3,62,4)
  ]};
  const baleine = {nom:'Baleine', usage:'nager', aileron:[[-24,-4],[-36,140],[-44,262],[-6,352],[30,270],[32,140],[24,-4]], os:[
    os('h',0,0,0,60,26), os('r',-11,70,-13,132,16), os('r',11,70,13,132,16),
    rond(-14,146,8), rond(0,146,8), rond(14,146,8), rond(-8,163,7), rond(8,163,7),
    ...doigt(-22,178,-0.12,3,16,8), ...doigt(-11,180,-0.05,7,17,8), ...doigt(0,181,0,8,17,8), ...doigt(11,180,0.05,6,17,8), ...doigt(21,178,0.1,3,16,7)
  ]};
  const cheval = {nom:'Cheval', usage:'courir', sabot:[[2,528],[30,528],[40,560],[-8,560]], os:[
    os('h',0,0,16,105,20), os('r',16,113,16,270,14), os('r',25,113,27,152,7),
    rond(8,282,7), rond(20,282,7), rond(31,283,6), rond(12,296,7), rond(25,296,7),
    os('m',16,310,16,452,12), os('m',6,312,5,392,4), os('m',26,312,27,392,4),
    os('m',16,458,17,492,11), os('m',17,497,18,520,10), os('m',18,526,18,548,9)
  ]};
  return [homme, chauve, baleine, cheval];
}
export function texPlanche(){
  const [c,x]=toile(1024,1024), r=aleaGraine(17);
  x.save(); x.scale(1, 1024/768);
  const g=x.createRadialGradient(512,384,120,512,384,720); g.addColorStop(0,'#f1e6c8'); g.addColorStop(1,'#cdb68a');
  x.fillStyle=g; x.fillRect(0,0,1024,768);
  for (let k=0;k<40;k++){ x.fillStyle=`rgba(120,85,40,${r()*0.05})`; x.beginPath(); x.arc(r()*1024,r()*768,10+r()*60,0,TAU); x.fill(); }
  x.strokeStyle='#5a4329'; x.lineWidth=3; x.strokeRect(18,18,988,732); x.lineWidth=1; x.strokeRect(26,26,972,716);
  x.fillStyle='#3a2a18'; x.textAlign='center';
  x.font='bold 40px Georgia, "Times New Roman", serif'; x.fillText('Membres antérieurs', 512, 70);
  x.font='italic 25px Georgia, "Times New Roman", serif'; x.fillText('quatre usages, un même plan d’organisation', 512, 104);
  membres().forEach((mb,i)=>{
    const pts=[]; mb.os.forEach(o=>{ if (o.s) pts.push([o.s[0],o.s[1]],[o.s[2],o.s[3]]); else pts.push([o.o[0],o.o[1]]); });
    (mb.voile||mb.aileron||mb.sabot||[]).forEach(p=>pts.push(p));
    const minX=Math.min(...pts.map(p=>p[0])), maxX=Math.max(...pts.map(p=>p[0])), maxY=Math.max(...pts.map(p=>p[1]));
    const k=Math.min(470/maxY, 200/(maxX-minX));
    const cx=128+i*256;
    x.save(); x.translate(cx-(minX+maxX)/2*k, 130); x.scale(k,k);
    const poly=(P,fill,stroke)=>{ x.beginPath(); P.forEach((p,j)=>j?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.fillStyle=fill; x.fill(); if (stroke){ x.strokeStyle=stroke; x.lineWidth=1.5/k*2; x.stroke(); } };
    if (mb.voile) poly(mb.voile,'rgba(110,85,70,0.22)','rgba(90,65,50,0.45)');
    if (mb.aileron) poly(mb.aileron,'rgba(70,100,130,0.2)','rgba(60,85,110,0.5)');
    if (mb.sabot) poly(mb.sabot,'rgba(45,36,28,0.55)','#2d241c');
    for (const o of mb.os){
      x.lineCap='round';
      if (o.s){
        x.strokeStyle='#3a2a1a'; x.lineWidth=o.w+3.5; x.beginPath(); x.moveTo(o.s[0],o.s[1]); x.lineTo(o.s[2],o.s[3]); x.stroke();
        x.strokeStyle=COUL_OS[o.t]; x.lineWidth=o.w; x.beginPath(); x.moveTo(o.s[0],o.s[1]); x.lineTo(o.s[2],o.s[3]); x.stroke();
      } else {
        x.fillStyle='#3a2a1a'; x.beginPath(); x.arc(o.o[0],o.o[1],o.o[2]+1.8,0,TAU); x.fill();
        x.fillStyle=COUL_OS.c; x.beginPath(); x.arc(o.o[0],o.o[1],o.o[2],0,TAU); x.fill();
      }
    }
    // numéros : la couleur n'est jamais la seule information
    const premier=t=>mb.os.find(o=>o.t===t);
    [['h','1'],['r','2'],['c','3'],['m','4']].forEach(([t,num])=>{
      const o=premier(t); let px, py;
      if (o.s){ px=(o.s[0]+o.s[2])/2; py=(o.s[1]+o.s[3])/2; } else { px=o.o[0]; py=o.o[1]; }
      if (t==='m'){ py += 18; }
      px -= 34/k*1.6 > 60 ? 60 : 34/k*1.6;
      x.fillStyle='#fffaf0'; x.strokeStyle='#3a2a1a'; x.lineWidth=1.6/k*1.5;
      x.beginPath(); x.arc(px,py,11/k*1.4,0,TAU); x.fill(); x.stroke();
      x.fillStyle='#3a2a1a'; x.font=`bold ${15/k*1.4}px Georgia, serif`; x.textAlign='center'; x.textBaseline='middle'; x.fillText(num,px,py+0.5);
    });
    x.restore();
    x.fillStyle='#3a2a18'; x.textAlign='center'; x.textBaseline='alphabetic';
    x.font='bold 28px Georgia, serif'; x.fillText(mb.nom, cx, 640);
    x.font='italic 22px Georgia, serif'; x.fillText(mb.usage, cx, 668);
  });
  const leg=[['h','1  humérus'],['r','2  radius et ulna'],['c','3  os du poignet'],['m','4  métacarpes et phalanges']];
  x.font='20px Georgia, serif'; x.textAlign='left';
  leg.forEach(([t,txt],i)=>{ const lx=70+i*236; x.fillStyle=COUL_OS[t]; x.fillRect(lx,700,26,18); x.strokeStyle='#3a2a1a'; x.lineWidth=1.5; x.strokeRect(lx,700,26,18); x.fillStyle='#3a2a18'; x.fillText(txt,lx+34,716); });
  x.restore();
  return c;
}
export function texPapillons(){
  const [c,x]=toile(512,512), r=aleaGraine(29);
  x.save(); x.scale(1, 512/384);
  x.fillStyle='#ece3cc'; x.fillRect(0,0,512,384);
  x.fillStyle='#3a2a18'; x.textAlign='center';
  x.font='italic bold 22px Georgia, serif'; x.fillText('Biston betularia', 256, 34);
  x.font='italic 16px Georgia, serif'; x.fillText('phalène du bouleau : forme claire et forme sombre', 256, 54);
  const ecorce=(x0,y0,w,h,fond,taches)=>{
    x.fillStyle=fond; x.fillRect(x0,y0,w,h);
    for (let k=0;k<420;k++){ x.fillStyle=taches[Math.floor(r()*taches.length)]; x.globalAlpha=0.55; x.beginPath(); x.ellipse(x0+r()*w,y0+r()*h,2+r()*10,2+r()*7,r()*3,0,TAU); x.fill(); }
    x.globalAlpha=1; x.strokeStyle='rgba(0,0,0,0.25)';
    for (let k=0;k<14;k++){ x.lineWidth=1+r()*2; x.beginPath(); let px=x0+r()*w, py=y0; x.moveTo(px,py); while (py<y0+h){ py+=10; px+=(r()-0.5)*6; x.lineTo(px,py); } x.stroke(); }
  };
  ecorce(24,70,224,250,'#b7b6a5',['#d8dac6','#a7b199','#e6e4d4','#8e9985','#c9cbb6']);
  ecorce(264,70,224,250,'#2d2925',['#3b3631','#1d1a17','#4a443c','#26221e']);
  const phalene=(cx,cy,s,sombre)=>{
    x.save(); x.translate(cx,cy); x.scale(s,s);
    const aile=(sg)=>{
      x.beginPath(); x.moveTo(0,-4); x.bezierCurveTo(sg*20,-26,sg*52,-30,sg*58,-20); x.lineTo(sg*50,6); x.bezierCurveTo(sg*32,10,sg*12,8,0,4); x.closePath();
      x.moveTo(0,4); x.bezierCurveTo(sg*16,8,sg*40,12,sg*38,28); x.bezierCurveTo(sg*28,38,sg*8,30,0,14); x.closePath();
    };
    x.fillStyle = sombre ? '#262220' : '#e4dfd1';
    aile(-1); x.fill(); aile(1); x.fill();
    x.save(); aile(-1); aile(1); x.clip();
    for (let k=0;k<(sombre?40:170);k++){ x.fillStyle = sombre ? 'rgba(120,115,105,0.5)' : 'rgba(30,26,22,0.75)'; x.fillRect(-60+r()*120,-32+r()*72,1.4+r()*1.8,1.4+r()*1.8); }
    if (!sombre){ x.strokeStyle='rgba(30,26,22,0.6)'; x.lineWidth=1.5; for (const sg of [-1,1]){ x.beginPath(); x.moveTo(sg*8,-10); x.lineTo(sg*20,-4); x.lineTo(sg*30,-12); x.lineTo(sg*44,-4); x.stroke(); } }
    x.restore();
    x.fillStyle = sombre ? '#171412' : '#6b5a48'; x.beginPath(); x.ellipse(0,6,4,16,0,0,TAU); x.fill();
    x.strokeStyle = x.fillStyle; x.lineWidth=1.2; for (const sg of [-1,1]){ x.beginPath(); x.moveTo(0,-8); x.quadraticCurveTo(sg*8,-22,sg*14,-26); x.stroke(); }
    x.fillStyle='#d8d2c0'; x.beginPath(); x.arc(0,-2,2.2,0,TAU); x.fill();
    x.restore();
  };
  const etq=(cx,cy,t)=>{ x.fillStyle='#f7f1e1'; x.fillRect(cx-38,cy,76,18); x.strokeStyle='#5a4329'; x.lineWidth=1; x.strokeRect(cx-38,cy,76,18); x.fillStyle='#2a1d10'; x.font='italic 13px Georgia, serif'; x.textAlign='center'; x.fillText(t,cx,cy+13); };
  phalene(100,140,0.95,false); etq(100,178,'typica');
  phalene(180,250,0.95,true);  etq(180,288,'carbonaria');
  phalene(350,140,0.95,false); etq(350,178,'typica');
  phalene(420,250,0.95,true);  etq(420,288,'carbonaria');
  x.fillStyle='#3a2a18'; x.font='15px Georgia, serif'; x.textAlign='center';
  x.fillText('écorce couverte de lichens', 136, 345); x.fillText('écorce noircie par la suie', 376, 345);
  x.font='italic 13px Georgia, serif'; x.fillText('(campagne)', 136, 364); x.fillText('(ville industrielle, XIXᵉ s.)', 376, 364);
  x.restore();
  return c;
}
/* étiquettes des spécimens : 16 cases de 512 × 128.
   Le décor colle l'étiquette n° i près de l'objet ORDRE_ETIQUETTES[i] : l'ordre est fixé ici,
   pour qu'un déplacement d'entrée dans curiosites.js ne mélange pas les étiquettes. */
export const ETIQ_SERRE = 14, ETIQ_CABINET = 15;
export const ORDRE_ETIQUETTES = ['pinsons','phalene','tortue','nautile','ammonite','corail','serpent',
  'crocodile','microscope','planche','glossopetres','cacao','banane','victoria'];
export function texEtiquettes(curiosites){
  const [c,x]=toile(1024,1024);
  const textes = ORDRE_ETIQUETTES.map(id=>{ const o = curiosites.find(e=>e.id===id); return o ? [o.nom, o.latin.split(',')[0]] : ['', '']; });
  textes[ETIQ_SERRE] = ['Serre tropicale','plantes d’Amazonie'];
  textes[ETIQ_CABINET] = ['Cabinet d’histoire naturelle','entrez, observez'];
  textes.forEach(([a,b],i)=>{
    const x0=(i%2)*512, y0=Math.floor(i/2)*128;
    x.fillStyle='#efe3c3'; x.fillRect(x0,y0,512,128);
    x.strokeStyle='#5a4329'; x.lineWidth=4; x.strokeRect(x0+8,y0+8,496,112); x.lineWidth=1.5; x.strokeRect(x0+16,y0+16,480,96);
    x.fillStyle='#2a1d10'; x.textAlign='center';
    let taille=40; x.font=`bold ${taille}px Georgia, serif`; while (x.measureText(a).width>460 && taille>20){ taille-=2; x.font=`bold ${taille}px Georgia, serif`; }
    x.fillText(a, x0+256, y0+58);
    taille=28; x.font=`italic ${taille}px Georgia, serif`; while (x.measureText(b).width>460 && taille>16){ taille-=2; x.font=`italic ${taille}px Georgia, serif`; }
    x.fillText(b, x0+256, y0+96);
  });
  return c;
}
export function rectEtiquette(i){ const col=i%2, row=Math.floor(i/2); return [col*0.5, 1-(row+1)/8, col*0.5+0.5, 1-row/8]; }
export function texHerbier(){
  const [c,x]=toile(512,256), r=aleaGraine(31);
  x.fillStyle='#eee3c6'; x.fillRect(0,0,512,256);
  const g=x.createLinearGradient(236,0,276,0); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.5,'rgba(60,40,20,0.35)'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(226,0,60,256);
  // fougère pressée
  x.strokeStyle='#5d6a32'; x.lineWidth=3; x.beginPath(); x.moveTo(60,236); x.quadraticCurveTo(110,140,180,24); x.stroke();
  for (let k=0;k<16;k++){ const t=k/16, px=60+t*(120)+Math.sin(t*3)*8, py=236-t*212; const l=34*(1-t*0.7);
    x.fillStyle=k%2?'#6f7d3a':'#7d8b45';
    for (const sg of [-1,1]){ x.save(); x.translate(px,py); x.rotate(sg*1.1-0.4); x.beginPath(); x.ellipse(l/2,0,l/2,5,0,0,TAU); x.fill(); x.restore(); } }
  x.fillStyle='#3a2a18'; x.font='italic 20px Georgia, serif'; x.fillText('Theobroma cacao L.', 296, 44);
  x.strokeStyle='rgba(58,42,24,0.7)'; x.lineWidth=1.3;
  for (let l=0;l<7;l++){ let px=296; const py=78+l*22; x.beginPath(); x.moveTo(px,py);
    while (px<480-r()*40){ x.quadraticCurveTo(px+3,py-5-r()*4,px+6,py); px+=6+r()*3; if (r()<0.12) { px+=8; x.moveTo(px,py); } } x.stroke(); }
  x.fillStyle='#b8762a'; x.beginPath(); x.ellipse(440,222,14,26,0.4,0,TAU); x.fill(); x.strokeStyle='#6d4317'; x.stroke();
  return c;
}
/* globe ancien : contours très simplifiés des continents et route du Beagle (1831-1836) */
export const CONTINENTS = [
  [[-168,66],[-140,70],[-110,73],[-85,70],[-80,63],[-65,60],[-55,52],[-66,45],[-75,38],[-81,31],[-80,25],[-90,30],[-97,26],[-97,20],[-90,15],[-83,9],[-79,8],[-86,13],[-95,16],[-105,20],[-112,30],[-118,34],[-124,40],[-125,48],[-135,58],[-150,60],[-165,62]],
  [[-50,60],[-42,60],[-20,70],[-20,80],[-60,82],[-70,76],[-55,68]],
  [[-80,8],[-72,12],[-62,10],[-50,0],[-35,-5],[-38,-15],[-48,-25],[-58,-35],[-65,-42],[-68,-52],[-72,-54],[-75,-48],[-73,-38],[-71,-25],[-76,-15],[-81,-5]],
  [[-17,15],[-17,21],[-10,30],[-6,36],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[40,-2],[40,-15],[33,-26],[20,-35],[17,-29],[12,-17],[13,-5],[9,4],[-8,4],[-14,10]],
  [[-10,36],[-9,43],[-2,44],[-5,48],[0,50],[5,54],[10,57],[5,62],[15,69],[30,71],[45,68],[60,70],[80,73],[100,77],[120,73],[140,72],[160,70],[180,68],[180,62],[160,60],[155,50],[140,47],[135,35],[122,30],[121,22],[108,18],[105,10],[100,13],[100,3],[104,1],[98,8],[92,22],[80,15],[77,8],[72,20],[66,25],[57,26],[56,23],[50,25],[48,30],[35,36],[27,37],[26,40],[23,40],[19,42],[16,38],[12,44],[8,44],[3,43],[-1,37]],
  [[35,28],[39,22],[43,13],[45,13],[52,16],[58,21],[56,26],[51,24],[48,29],[35,32]],
  [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[140,-38],[132,-32],[115,-34]],
  [[-180,-70],[-120,-72],[-60,-66],[0,-69],[60,-67],[120,-66],[180,-70],[180,-90],[-180,-90]],
  [[-5,50],[2,51],[0,53],[-3,58],[-6,56],[-4,53]],
  [[172,-34],[178,-38],[174,-41],[167,-46],[170,-46],[174,-40]],
  [[44,-25],[50,-15],[49,-12],[43,-17]]
];
export const BEAGLE = [[-4,50],[-23,15],[-38,-13],[-43,-23],[-56,-35],[-59,-52],[-68,-55],[-72,-33],[-77,-12],[-90,-0.5],[-149,-17.5],[-186,-35],[-209,-34],[-213,-43],[-242,-35],[-263,-12],[-302.5,-20],[-342,-34],[-365.7,-16],[-374,-8],[-398,-13],[-387,38],[-365,50]];
export function texGlobe(){
  const [c,x]=toile(512,256);
  const X=lon=>(180-lon)/360*512, Y=lat=>(90-lat)/180*256;   // miroir : la sphère se lit de l'extérieur
  x.fillStyle='#c6cdb0'; x.fillRect(0,0,512,256);
  x.strokeStyle='rgba(90,70,40,0.35)'; x.lineWidth=1;
  for (let l=-150;l<=180;l+=30){ x.beginPath(); x.moveTo(X(l),0); x.lineTo(X(l),256); x.stroke(); }
  for (let l=-60;l<=60;l+=30){ x.beginPath(); x.moveTo(0,Y(l)); x.lineTo(512,Y(l)); x.stroke(); }
  for (const P of CONTINENTS){ x.beginPath(); P.forEach(([lo,la],i)=>i?x.lineTo(X(lo),Y(la)):x.moveTo(X(lo),Y(la))); x.closePath(); x.fillStyle='#dcc38f'; x.fill(); x.strokeStyle='#6b5233'; x.lineWidth=1.2; x.stroke(); }
  x.strokeStyle='#9b2d1f'; x.lineWidth=2; x.setLineDash([5,4]);
  for (const dec of [0,360,-360]){ x.beginPath(); BEAGLE.forEach(([lo,la],i)=>i?x.lineTo(X(lo+dec),Y(la)):x.moveTo(X(lo+dec),Y(la))); x.stroke(); }
  x.setLineDash([]);
  return c;
}
