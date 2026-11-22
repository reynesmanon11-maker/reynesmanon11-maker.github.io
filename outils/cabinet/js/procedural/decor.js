// Le décor modelé par le code : la pièce du cabinet, son mobilier, la serre et le dehors.
// Repris tel quel de la version légère. Il sera remplacé peu à peu par des modèles GLB.
import { BLANC, Constructeur, I, PI, T, TAU, add, aleaGraine, base3, cross, geoCyl, geoSphere, melangeC, mult, nrm, sca } from './geometrie.js';
import { ETIQ_CABINET, ETIQ_SERRE, rectEtiquette, rectLivre } from './textures.js';

export const COUL = {
  noyer:[0.6,0.37,0.22], acajou:[0.55,0.25,0.15], chene:[0.8,0.6,0.4], ebene:[0.2,0.15,0.11],
  laiton:[0.8,0.6,0.27], fer:[0.17,0.21,0.2], marbre:[0.82,0.79,0.74], velours:[0.48,0.08,0.08],
  vertVelours:[0.1,0.22,0.16], papier:[0.95,0.91,0.82], noir:[0.04,0.035,0.03], peinture:[0.88,0.85,0.77],
  cuir:[0.42,0.21,0.12], terre:[0.22,0.15,0.1], cuite:[0.7,0.38,0.23], os:[0.88,0.84,0.72], cire:[0.96,0.94,0.86],
  feuillage:[0.2,0.42,0.16], feuillage2:[0.28,0.5,0.2], feuillageSombre:[0.12,0.3,0.12]
};
export const SOLIDES = [];         // rectangles [x0, z0, x1, z1] qu'on ne peut pas traverser
export function solide(x0,z0,x1,z1){ SOLIDES.push([Math.min(x0,x1), Math.min(z0,z1), Math.max(x0,x1), Math.max(z0,z1)]); }
export const ANIMES = [];          // flammes : petits modèles qui tremblent
export const LUMIERES = [
  {p:[0,3.0,0],        c:[1.0,0.72,0.42], k:1.55, r:9.5, vac:0.06},   // lustre
  {p:[-5.55,0.55,0],   c:[1.0,0.47,0.17], k:2.0,  r:6.5, vac:0.22},   // cheminée
  {p:[0.95,1.1,-0.35], c:[1.0,0.7,0.4],   k:0.65, r:3.2, vac:0.14},   // bougeoir de la table
  {p:[1.8,2.35,-3.1],  c:[1.0,0.82,0.58], k:0.65, r:3.4, vac:0},      // éclaire la vitrine
  {p:[-3.0,2.1,3.85],  c:[0.86,0.9,0.98], k:0.75, r:5.0, vac:0},      // fenêtre de gauche
  {p:[1.5,2.1,3.85],   c:[0.86,0.9,0.98], k:0.75, r:5.0, vac:0},      // fenêtre de droite
  {p:[11.0,4.0,0],     c:[0.95,1.0,0.88], k:0.55, r:8.0, vac:0},      // serre
  {p:[0,0,0],          c:[1.0,0.93,0.82], k:0,    r:2.4, vac:0}       // lampe d'examen, suit le regard
];


/* --- petits outils de construction --- */
export function rectanglesMur(s0, s1, y0, y1, trous){
  const xs=[s0,s1]; for (const t of trous) xs.push(Math.max(s0,Math.min(s1,t.s0)), Math.max(s0,Math.min(s1,t.s1)));
  xs.sort((a,b)=>a-b);
  const res=[];
  for (let k=0;k<xs.length-1;k++){
    const a=xs[k], b=xs[k+1]; if (b-a<1e-6) continue; const mid=(a+b)/2;
    let ys=[[y0,y1]];
    for (const t of trous) if (t.s0<mid && mid<t.s1){
      const nv=[]; for (const [c,d] of ys){ if (t.y1<=c || t.y0>=d){ nv.push([c,d]); continue; } if (t.y0>c) nv.push([c,t.y0]); if (t.y1<d) nv.push([t.y1,d]); } ys=nv;
    }
    for (const [c,d] of ys) if (d-c>1e-6) res.push([a,c,b,d]);
  }
  return res;
}
/* mur perpendiculaire à z (axe 'z', s = x) ou à x (axe 'x', s = z), d'épaisseur a0 → a1 */
export function mur(S, mat, axe, a0, a1, s0, s1, y0, y1, trous, col){
  for (const [sa,ya,sb,yb] of rectanglesMur(s0,s1,y0,y1,trous||[])){
    if (axe==='z') S.pave(mat, sa,ya,a0, sb,yb,a1, col); else S.pave(mat, a0,ya,sa, a1,yb,sb, col);
  }
}
export function etiquette(S, i, M, w){ w = w || 0.2; S.quad('etiquettes', M, w, w/4, BLANC, {uvRect:rectEtiquette(i)}); }
export function flamme(p, k, vac){
  const C = new Constructeur();
  C.cyl('lumineux', I, 0.012*k, 0, 0.055*k, 8, [1.0,0.62,0.2]);
  C.cyl('lumineux', T(0,0.005*k,0), 0.006*k, 0, 0.035*k, 8, [1.0,0.95,0.7]);
  ANIMES.push({C, p, vac:vac||0.18, ph:Math.random()*10});
}

/* ---------- la pièce du cabinet ---------- */
export function construireCabinet(S, rng){
  const trousSud = [{s0:-3.7,s1:-2.3,y0:0.9,y1:3.0},{s0:0.8,s1:2.2,y0:0.9,y1:3.0}];
  const trouEst = [{s0:-1.1,s1:1.1,y0:0,y1:2.7}];
  // sol, plafond, poutres
  S.pave('parquet', -6,-0.02,-4.5, 6,0,4.5);
  S.pave('bois', -6.3,4.2,-4.8, 6.3,4.4,4.8, [0.42,0.3,0.2]);
  for (let x=-5; x<=5.01; x+=2.5) S.pave('bois', x-0.12,3.95,-4.5, x+0.12,4.2,4.5, [0.36,0.24,0.15]);
  // murs (briques dehors, tapisserie et lambris dedans)
  mur(S,'brique','z',-4.8,-4.5,-6.3,6.3,0,4.4);
  mur(S,'brique','z',4.5,4.8,-6.3,6.3,0,4.4,trousSud);
  mur(S,'brique','x',-6.3,-6.0,-4.8,4.8,0,4.4);
  mur(S,'brique','x',6.0,6.3,-4.8,4.8,0,4.4,trouEst);
  const lambris=[0.5,0.31,0.19], cimaise=[0.4,0.25,0.15];
  mur(S,'tapisserie','z',-4.5,-4.485,-6,6,1.0,4.2);
  mur(S,'tapisserie','z',4.485,4.5,-6,6,1.0,4.2,trousSud);
  mur(S,'tapisserie','x',-6.0,-5.985,-4.5,4.5,1.0,4.2);
  mur(S,'tapisserie','x',5.985,6.0,-4.5,4.5,1.0,4.2,trouEst);
  mur(S,'bois','z',-4.5,-4.47,-6,6,0,1.0,[],lambris);
  mur(S,'bois','z',4.47,4.5,-6,6,0,1.0,trousSud,lambris);
  mur(S,'bois','x',-6.0,-5.97,-4.5,4.5,0,1.0,[],lambris);
  mur(S,'bois','x',5.97,6.0,-4.5,4.5,0,1.0,trouEst,lambris);
  mur(S,'bois','z',-4.5,-4.45,-6,6,0.97,1.04,[],cimaise);
  mur(S,'bois','z',4.45,4.5,-6,6,0.97,1.04,trousSud,cimaise);
  mur(S,'bois','x',-6.0,-5.95,-4.5,4.5,0.97,1.04,[],cimaise);
  mur(S,'bois','x',5.95,6.0,-4.5,4.5,0.97,1.04,trouEst,cimaise);
  for (const [a,b,ax] of [[-4.5,-4.42,'z'],[4.42,4.5,'z'],[-6.0,-5.92,'x'],[5.92,6.0,'x']]) mur(S,'bois',ax,a,b,ax==='z'?-6:-4.5,ax==='z'?6:4.5,4.05,4.2,[],cimaise);
  solide(-6.4,-4.9,6.4,-4.5); solide(-6.4,4.5,6.4,4.9); solide(-6.4,-4.9,-6.0,4.9);
  solide(6.0,-4.9,6.3,-1.1); solide(6.0,1.1,6.3,4.9);

  // fenêtres
  for (const t of trousSud){
    const wa=t.s0, wb=t.s1, wm=(wa+wb)/2, blanc=COUL.peinture;
    // embrasure doublée de bois (elle cache la brique) et chambranle côté pièce
    S.pave('bois', wa,0.9,4.47, wa+0.03,3.0,4.81, blanc); S.pave('bois', wb-0.03,0.9,4.47, wb,3.0,4.81, blanc);
    S.pave('bois', wa,2.97,4.47, wb,3.0,4.81, blanc);
    S.pave('bois', wa-0.09,0.9,4.43, wa+0.01,3.1,4.47, blanc); S.pave('bois', wb-0.01,0.9,4.43, wb+0.09,3.1,4.47, blanc);
    S.pave('bois', wa-0.09,3.0,4.43, wb+0.09,3.1,4.47, blanc);
    S.pave('bois', wa-0.1,0.85,4.38, wb+0.1,0.92,4.86, blanc);
    S.pave('satin', wa,0.9,4.62, wb,0.96,4.68, blanc); S.pave('satin', wa,2.94,4.62, wb,3.0,4.68, blanc);
    S.pave('satin', wa,0.9,4.62, wa+0.05,3.0,4.68, blanc); S.pave('satin', wb-0.05,0.9,4.62, wb,3.0,4.68, blanc);
    S.pave('satin', wm-0.025,0.9,4.62, wm+0.025,3.0,4.68, blanc);
    for (const y of [1.45,2.0,2.5]) S.pave('satin', wa,y-0.015,4.63, wb,y+0.015,4.67, blanc);
    S.quad('verre', T(wm,1.95,4.65), wb-wa, 2.1);
    // rideaux de velours, plissés
    S.cyl('laiton', T(wa-0.5,3.18,4.36).rz(-PI/2), 0.015,0.015, wb-wa+1.0, 8, COUL.laiton);
    for (const [c0,sens] of [[wa-0.45,1],[wb+0.45,-1]]){
      for (let k=0;k<6;k++){ const x=c0+sens*k*0.065; S.cyl('mat', T(x,0.06,4.36+(k%2?0.025:-0.01)), 0.045,0.045, 3.1, 8, mult(COUL.velours, 0.85+0.15*(k%2))); }
    }
  }
  // porte de la serre
  S.pave('bois', 5.92,0,-1.24, 6.02,2.84,-1.1, COUL.noyer); S.pave('bois', 5.92,0,1.1, 6.02,2.84,1.24, COUL.noyer);
  S.pave('bois', 5.92,2.7,-1.24, 6.02,2.9,1.24, COUL.noyer);
  S.pave('bois', 6.0,0,-1.12, 6.3,2.7,-1.1, COUL.noyer); S.pave('bois', 6.0,0,1.1, 6.3,2.7,1.12, COUL.noyer);
  S.pave('bois', 6.0,2.68,-1.1, 6.3,2.7,1.1, COUL.noyer); S.pave('dalles', 6.0,-0.02,-1.1, 6.3,0.0,1.1);
  S.pave('bois', 5.9,3.0,-0.38, 5.96,3.24,0.38, COUL.ebene);
  etiquette(S, ETIQ_SERRE, T(5.895,3.12,0).ry(-PI/2), 0.66);
  // tapis
  S.pave('tapis', -2.6,0,-1.75, 2.6,0.008,1.75);
  // cheminée (mur ouest)
  const m=COUL.marbre;
  S.pave('satin', -6,0,-1.15, -5.3,0.06,1.15, mult(m,0.9));
  S.pave('satin', -6,0.06,-0.95, -5.6,1.2,-0.62, m); S.pave('satin', -6,0.06,0.62, -5.6,1.2,0.95, m);
  S.pave('satin', -6,0.95,-0.95, -5.6,1.2,0.95, m);
  S.pave('satin', -6,1.2,-1.08, -5.48,1.27,1.08, mult(m,0.95));
  S.pave('mat', -5.98,0.06,-0.62, -5.9,0.95,0.62, COUL.noir); S.pave('mat', -5.98,0.06,-0.62, -5.6,0.95,-0.6, [0.1,0.08,0.07]); S.pave('mat', -5.98,0.06,0.6, -5.6,0.95,0.62, [0.1,0.08,0.07]);
  S.pave('mat', -5.98,0.93,-0.62, -5.6,0.95,0.62, [0.08,0.06,0.05]);
  for (const z of [-0.3,0.3]) { S.cyl('fer', T(-5.7,0.06,z), 0.02,0.02,0.14,8,COUL.noir); S.sphere('fer', T(-5.66,0.22,z), 0.03, 8,6, COUL.noir); }
  for (const [z,a] of [[-0.12,0.1],[0.1,-0.15],[0,0.02]]) S.cyl('bois', T(-5.75,0.12+(z===0?0.07:0),z-0.3).rx(PI/2).rz(a), 0.05,0.05,0.6,8,[0.3,0.18,0.1]);
  S.pave('lumineux', -5.9,0.07,-0.35, -5.6,0.1,0.35, [1.0,0.42,0.1]);
  [[-5.78,0.13,-0.2,4.2],[-5.75,0.12,0.05,5.2],[-5.78,0.13,0.25,3.8],[-5.72,0.15,-0.05,3.2],[-5.8,0.12,0.12,4.6]].forEach(([x,y,z,k])=>flamme([x,y,z],k,0.35));
  solide(-6.0,-1.15,-5.3,1.15);
  // vanité et chandeliers sur la tablette
  crane(S, T(-5.74,1.27,-0.72).ry(PI/2+0.4));
  for (const z of [-0.35,0.45]) chandelierPetit(S, -5.72, 1.27, z);
  // bibliothèques et vitrine (mur nord)
  bibliotheque(S, -5.85, -1.0, -4.5, 0.45, 3.0, rng);
  bibliotheque(S, 3.65, 5.85, -4.5, 0.45, 3.0, rng);
  vitrine(S, 0.3, 3.3, -4.5, 0.55);
  chouette(S, T(-3.2,3.12,-4.25));
  globe(S, -5.05, -3.35);
  // table centrale et ce qu'il y a dessus
  table(S, -1.4,-0.7, 1.4,0.7, 0.78);
  chaise(S, 0.1, 1.15, PI); chaise(S, -0.9, -1.15, 0);
  herbier(S, T(0.45,0.78,0.12).ry(-0.2));
  chandelierPetit(S, 0.95, 0.78, -0.35);
  loupe(S, T(0.1,0.785,-0.4).ry(0.6));
  pileLivres(S, 1.1, 0.78, 0.35, rng);
  encrier(S, -1.12, 0.78, 0.42);
  S.quad('mat', T(-0.05,0.782,0.38).rx(-PI/2).rz(0.3), 0.21, 0.29, COUL.papier);
  S.quad('mat', T(-1.05,0.781,-0.3).rx(-PI/2).rz(-0.5), 0.21, 0.29, mult(COUL.papier,0.95));
  // lustre
  lustre(S, 0, 0);
  // fauteuil près du feu
  fauteuil(S, -4.35, 1.5, -PI/2+0.35);
  // médaillier sous la fenêtre de gauche, bureau sous celle de droite
  medaillier(S, -3.8, -2.2, 3.84, 4.38, 0.86);
  etiquette(S, 10, T(-3.0,0.868,3.93).ry(PI).rx(-1.25), 0.22);
  bureau(S, 0.85, 2.15, 3.72, 4.38, 0.76);
  chaise(S, 1.5, 3.22, 0);
  // guéridon et cloche des pinsons
  gueridon(S, 4.25, -2.25);
  S.tour('verre', T(4.25,0.755,-2.25), [[0.205,0],[0.21,0.02],[0.21,0.3],[0.195,0.38],[0.155,0.43],[0.085,0.455],[0,0.462]], 28);
  S.sphere('verre', T(4.25,1.225,-2.25), 0.025, 10,8);
  etiquette(S, 0, T(4.25,0.758,-2.25).ry(-1.08).t(0,0,0.31).rx(-1.25), 0.16);
  // coffre de la tortue
  coffre(S, 4.0, 5.3, 2.95, 3.85, 0.5);
  etiquette(S, 2, T(4.0-0.005,0.38,3.4).ry(-PI/2), 0.24);
  // cordes du crocodile
  for (const dx of [-0.75,0.8]) S.cyl('mat', T(2.4+dx,3.3,0.9+dx*0.12), 0.008,0.008,0.9,6,[0.55,0.45,0.3]);
}

export function bibliotheque(S, x0, x1, zF, prof, h, rng){
  const zA=zF+prof, ep=0.04, c=COUL.noyer;
  S.pave('bois', x0,0,zF, x0+ep,h,zA, c); S.pave('bois', x1-ep,0,zF, x1,h,zA, c);
  S.pave('bois', x0-0.03,h,zF, x1+0.03,h+0.12,zA+0.06, c);
  S.pave('bois', x0,0,zF, x1,0.12,zA+0.01, mult(c,0.85));
  S.pave('bois', x0,0,zF, x1,h,zF+0.02, mult(c,0.6));
  const nb=Math.max(1,Math.round((x1-x0)/1.2)), lg=(x1-x0)/nb;
  for (let k=1;k<nb;k++){ const x=x0+k*lg; S.pave('bois', x-0.02,0.12,zF, x+0.02,h,zA, c); }
  const etages=[0.12,0.58,1.04,1.5,1.96,2.42];
  for (const y of etages){
    if (y>0.12) S.pave('bois', x0,y-0.025,zF, x1,y,zA, c);
    for (let k=0;k<nb;k++){ const a=x0+k*lg+(k?0.02:ep)+0.01, b=x0+(k+1)*lg-(k<nb-1?0.02:ep)-0.01; rangeeLivres(S, a, b, y, zF+0.02, zA, rng); }
  }
  solide(x0,zF,x1,zA);
}
export function rangeeLivres(S, a, b, y, zF, zA, rng){
  let x=a;
  while (x < b-0.03){
    if (rng()<0.05){ x += 0.06+rng()*0.12; continue; }
    const w=0.026+rng()*0.045; if (x+w>b) break;
    const hh=0.22+rng()*0.16, d=Math.min(zA-zF-0.03, 0.17+rng()*0.1), lum=0.7+rng()*0.3;
    S.pave('livres', x,y,zA-0.02-d, x+w,y+hh,zA-0.02, [lum,lum,lum], {uvRect:rectLivre(Math.floor(rng()*8))});
    x += w+0.003;
  }
  if (b-x>0.12 && rng()<0.7){   // une petite pile couchée au bout du rayon
    for (let k=0;k<3;k++){ const e=0.035+rng()*0.02, lum=0.7+rng()*0.3; S.pave('livres', x+0.01,y+k*0.045,zA-0.25, x+0.01+Math.min(0.2,b-x-0.02),y+k*0.045+e,zA-0.03, [lum,lum,lum], {uvRect:rectLivre(Math.floor(rng()*8))}); }
  }
}
export function vitrine(S, x0, x1, zF, prof){
  const zA=zF+prof, h=2.5, c=COUL.acajou, xm=(x0+x1)/2;
  S.pave('bois', x0,0,zF, x1,0.88,zA, c);
  for (let k=0;k<3;k++){ const w=(x1-x0-0.16)/3; S.pave('bois', x0+0.08+k*w+0.03,0.16,zA, x0+0.08+(k+1)*w-0.03,0.74,zA+0.015, mult(c,1.18)); S.sphere('laiton', T(x0+0.08+(k+0.5)*w,0.62,zA+0.03), 0.018, 8,6, COUL.laiton); }
  S.pave('bois', x0-0.02,0,zF, x1+0.02,0.1,zA+0.03, mult(c,0.8));
  S.pave('mat', x0+0.04,0.88,zF+0.02, x1-0.04,0.9,zA-0.04, COUL.vertVelours);
  S.pave('bois', x0,0.88,zF, x0+0.05,h,zA, c); S.pave('bois', x1-0.05,0.88,zF, x1,h,zA, c);
  S.pave('mat', x0+0.05,0.9,zF, x1-0.05,h-0.06,zF+0.02, COUL.vertVelours);
  for (const y of [1.45,1.95]) S.pave('bois', x0+0.05,y-0.025,zF+0.02, x1-0.05,y,zA-0.05, c);
  S.pave('bois', x0,h-0.06,zF, x1,h,zA, c); S.pave('bois', x0-0.04,h,zF, x1+0.04,h+0.1,zA+0.05, c);
  S.pave('bois', x0+0.05,0.9,zA-0.035, x1-0.05,0.95,zA, c); S.pave('bois', x0+0.05,h-0.11,zA-0.035, x1-0.05,h-0.06,zA, c);
  S.pave('bois', xm-0.025,0.9,zA-0.035, xm+0.025,h-0.06,zA, c);
  S.quad('verre', T((x0+0.05+xm-0.025)/2,(0.95+h-0.11)/2,zA-0.018), xm-x0-0.1, h-0.11-0.95);
  S.quad('verre', T((xm+0.025+x1-0.05)/2,(0.95+h-0.11)/2,zA-0.018), x1-xm-0.1, h-0.11-0.95);
  for (const xx of [xm-0.06, xm+0.06]) S.sphere('laiton', T(xx,1.6,zA+0.01), 0.014, 8,6, COUL.laiton);
  // bocaux et petites curiosités de décor
  bocal(S, T(1.7,0.9,-4.25), 0.07, 0.24, [0.82,0.72,0.42], (B,M)=>{ B.sphere('satin', M.t(0,0.1,0).s(1,0.7,1.2), 0.04, 10,8, [0.45,0.52,0.3]); B.sphere('satin', M.t(0,0.135,0.035), 0.022, 8,6, [0.5,0.56,0.33]); });
  bocal(S, T(2.15,0.9,-4.3), 0.055, 0.2, [0.75,0.8,0.55], (B,M)=>{ B.sphere('satin', M.t(0,0.09,0).s(0.6,1,0.35), 0.06, 10,8, [0.7,0.7,0.72]); });
  bocal(S, T(3.05,1.45,-4.3), 0.05, 0.17, [0.85,0.65,0.4], (B,M)=>{ for (let k=0;k<4;k++) B.tube('satin', M, [[0,0.03,0],[0.03*Math.cos(k*1.6),0.07,0.03*Math.sin(k*1.6)],[0.035*Math.cos(k*1.6+0.6),0.12,0.035*Math.sin(k*1.6+0.6)]], t=>0.01*(1-t*0.7), 6, [0.75,0.5,0.45]); B.sphere('satin', M.t(0,0.03,0), 0.03, 8,6, [0.75,0.5,0.45]); });
  oursin(S, T(1.95,1.975,-4.25));
  etoileMer(S, T(2.75,1.976,-4.25));
  for (let k=0;k<3;k++) S.sphere('satin', T(0.6+k*0.11,1.475,-4.2).s(1,0.6,1.3), 0.035, 10,6, [0.9-k*0.1,0.8-k*0.08,0.7]);
  etiquette(S, 3, T(1.0,1.925,-3.996), 0.18);
  etiquette(S, 4, T(1.95,1.425,-3.996), 0.18);
  etiquette(S, 5, T(2.7,0.85,-3.947), 0.18);
  solide(x0,zF,x1,zA);
}
export function bocal(S, M, r, h, couleur, contenu){
  S.tour('verre', M, [[0,0],[r,0],[r*1.05,0.012],[r*1.05,h*0.85],[r*0.85,h*0.93],[r*0.8,h]], 20);
  S.tour('liquide', M.t(0,0.004,0), [[0,0],[r*0.97,0],[r*0.97,h*0.78],[0,h*0.78]], 18, couleur);
  S.cyl('mat', M.t(0,h-0.005,0), r*0.82, r*0.82, 0.03, 16, [0.6,0.45,0.3]);
  contenu(S, M);
}
export function oursin(S, M){
  const rng=aleaGraine(41);
  S.sphere('satin', M.t(0,0.05,0).s(1,0.75,1), 0.05, 12,8, [0.45,0.2,0.35]);
  for (let k=0;k<70;k++){ const th=Math.acos(1-rng()*1.6), ph=rng()*TAU; const d=[Math.sin(th)*Math.cos(ph), Math.cos(th)*0.75, Math.sin(th)*Math.sin(ph)];
    const o=add([0,0.05,0], sca(d,0.045)); const z=nrm(d), x=nrm(cross([0,1,0.01],z)), y=cross(z,x);
    S.cyl('satin', base3(add(M.m.slice(12,15),o), x, z, y), 0.004, 0, 0.06, 4, [0.55,0.28,0.42]); }
}
export function etoileMer(S, M){
  for (let k=0;k<5;k++){ const a=k/5*TAU; S.tube('mat', M, [[0,0.012,0],[Math.cos(a)*0.05,0.012,Math.sin(a)*0.05],[Math.cos(a)*0.1,0.008,Math.sin(a)*0.1]], t=>[0.022*(1-t*0.8),0.01*(1-t*0.5)], 6, [0.85,0.5,0.25]); }
}
export function crane(S, M){
  const os=COUL.os;
  S.sphere('satin', M.t(0,0.1,-0.01).s(0.075,0.08,0.095), 1, 14,10, os);
  S.sphere('satin', M.t(0,0.055,0.06).s(0.06,0.05,0.05), 1, 12,8, os);
  for (const s of [-1,1]) S.sphere('mat', M.t(s*0.026,0.075,0.098).s(1,0.85,0.6), 0.02, 8,6, COUL.noir);
  S.sphere('mat', M.t(0,0.045,0.108).s(0.6,1,0.5), 0.012, 6,5, COUL.noir);
  S.boite('satin', M.t(0,0.012,0.05), 0.08,0.025,0.07, os);
  for (let k=-3;k<=3;k++) S.boite('satin', M.t(k*0.009,0.027,0.088-Math.abs(k)*0.004), 0.007,0.012,0.006, [0.95,0.92,0.82]);
}
export function chandelierPetit(S, x, y, z){
  S.tour('laiton', T(x,y,z), [[0,0],[0.05,0],[0.05,0.012],[0.015,0.03],[0.012,0.12],[0.022,0.14],[0.03,0.16],[0,0.16]], 14, COUL.laiton);
  S.cyl('mat', T(x,y+0.16,z), 0.012,0.012,0.12,10, COUL.cire);
  flamme([x,y+0.28,z], 1, 0.2);
}
export function chouette(S, M){
  const p=[0.48,0.36,0.24];
  S.sphere('mat', M.t(0,0.14,0).s(0.1,0.15,0.09), 1, 12,10, (x,y,z)=> y<0.2&&z>0.3 ? [0.75,0.66,0.5] : p);
  S.sphere('mat', M.t(0,0.31,0.01).s(0.085,0.075,0.075), 1, 12,10, p);
  for (const s of [-1,1]){ S.sphere('satin', M.t(s*0.035,0.32,0.065), 0.025, 10,8, [0.95,0.6,0.1]); S.sphere('satin', M.t(s*0.035,0.32,0.085), 0.012, 8,6, COUL.noir); S.cyl('mat', M.t(s*0.05,0.36,0.03).rz(-s*0.5), 0.015,0,0.05,6,p); }
  S.cyl('mat', M.t(0,0.29,0.07).rx(PI/2+0.4), 0.01,0,0.03,6,[0.3,0.25,0.15]);
  S.cyl('bois', M, 0.08,0.08,0.025,12,COUL.noyer);
}
export function globe(S, x, z){
  const c=COUL.noyer;
  for (let k=0;k<3;k++){ const a=k/3*TAU; S.tube('bois', I, [[x+Math.cos(a)*0.32,0,z+Math.sin(a)*0.32],[x+Math.cos(a)*0.22,0.4,z+Math.sin(a)*0.22],[x+Math.cos(a)*0.3,0.78,z+Math.sin(a)*0.3]], 0.025, 8, c); }
  S.tube('bois', I, Array.from({length:41},(_,i)=>[x+Math.cos(i/40*TAU)*0.33,0.8,z+Math.sin(i/40*TAU)*0.33]), [0.035,0.012], 6, c, {bouts:false});
  S.tube('laiton', T(x,0.92,z).rz(0.41), Array.from({length:33},(_,i)=>[Math.cos(i/32*TAU)*0.3,Math.sin(i/32*TAU)*0.3,0]), 0.008, 6, COUL.laiton, {bouts:false, haut:[0,0,1]});
  S.sphere('globe', T(x,0.92,z).rz(0.41).ry(2.3), 0.28, 36,20);
  solide(x-0.36,z-0.36,x+0.36,z+0.36);
}
export function table(S, x0,z0,x1,z1,h){
  const c=COUL.noyer;
  S.pave('bois', x0,h-0.05,z0, x1,h,z1, c);
  S.pave('bois', x0+0.08,h-0.17,z0+0.08, x1-0.08,h-0.05,z1-0.08, mult(c,0.85));
  const pied=[[0,0],[0.03,0],[0.045,0.05],[0.03,0.12],[0.028,0.4],[0.044,0.48],[0.03,0.56],[0.038,h-0.17],[0,h-0.17]];
  for (const [cx,cz] of [[x0+0.12,z0+0.12],[x1-0.12,z0+0.12],[x0+0.12,z1-0.12],[x1-0.12,z1-0.12]]) S.tour('bois', T(cx,0,cz), pied, 10, c);
  solide(x0,z0,x1,z1);
}
export function chaise(S, x, z, ry){
  const M=T(x,0,z).ry(ry), c=COUL.noyer;
  S.boite('bois', M.t(0,0.45,0), 0.44,0.04,0.42, c);
  S.boite('mat', M.t(0,0.485,0.01), 0.4,0.035,0.38, COUL.velours);
  for (const [a,b] of [[-0.19,-0.18],[0.19,-0.18],[-0.19,0.18],[0.19,0.18]]) S.cyl('bois', M.t(a,0,b), 0.018,0.016,0.45,8,c);
  for (const a of [-0.19,0.19]) S.cyl('bois', M.t(a,0.45,-0.19), 0.018,0.016,0.5,8,c);
  S.boite('bois', M.t(0,0.88,-0.19), 0.42,0.1,0.03, c); S.boite('bois', M.t(0,0.68,-0.19), 0.34,0.04,0.02, c);
  solide(x-0.26,z-0.26,x+0.26,z+0.26);
}
export function fauteuil(S, x, z, ry){
  const M=T(x,0,z).ry(ry), v=[0.16,0.3,0.2];
  S.boite('mat', M.t(0,0.25,0), 0.8,0.3,0.78, v); S.boite('mat', M.t(0,0.43,0.04), 0.62,0.08,0.64, mult(v,1.12));
  S.boite('mat', M.t(0,0.75,-0.33), 0.8,0.75,0.14, v);
  for (const s of [-1,1]) S.boite('mat', M.t(s*0.35,0.52,0), 0.12,0.28,0.74, v);
  for (const [a,b] of [[-0.34,-0.33],[0.34,-0.33],[-0.34,0.33],[0.34,0.33]]) S.cyl('bois', M.t(a,0,b), 0.03,0.02,0.1,8,COUL.noyer);
  solide(x-0.48,z-0.48,x+0.48,z+0.48);
}
export function gueridon(S, x, z){
  const c=COUL.acajou;
  S.cyl('bois', T(x,0.72,z), 0.42,0.42,0.035,32,c);
  S.tour('bois', T(x,0.12,z), [[0,0],[0.06,0],[0.05,0.08],[0.035,0.3],[0.055,0.42],[0.04,0.5],[0.05,0.6],[0,0.6]], 12, c);
  for (let k=0;k<3;k++){ const a=k/3*TAU+0.3; S.tube('bois', I, [[x,0.14,z],[x+Math.cos(a)*0.2,0.08,z+Math.sin(a)*0.2],[x+Math.cos(a)*0.34,0.0,z+Math.sin(a)*0.34]], t=>0.035*(1-t*0.5), 8, c); }
  solide(x-0.42,z-0.42,x+0.42,z+0.42);
}
export function coffre(S, x0, x1, z0, z1, h){
  const c=[0.45,0.27,0.15], f=COUL.fer;
  S.pave('bois', x0,0.03,z0, x1,h-0.06,z1, c); S.pave('bois', x0-0.02,h-0.06,z0-0.02, x1+0.02,h,z1+0.02, mult(c,1.1));
  for (const x of [x0+0.15, x1-0.15]){ S.pave('fer', x-0.03,0.03,z0-0.012, x+0.03,h+0.005,z0+0.005, f); S.pave('fer', x-0.03,0.03,z1-0.005, x+0.03,h+0.005,z1+0.012, f); S.pave('fer', x-0.03,h,z0, x+0.03,h+0.008,z1, f); }
  S.pave('laiton', x0-0.015,h-0.16,(z0+z1)/2-0.05, x0,h-0.06,(z0+z1)/2+0.05, COUL.laiton);
  for (const [x,z] of [[x0+0.05,z0+0.05],[x1-0.05,z0+0.05],[x0+0.05,z1-0.05],[x1-0.05,z1-0.05]]) S.sphere('bois', T(x,0.03,z), 0.035, 8,6, mult(c,0.8));
  solide(x0,z0,x1,z1);
}
export function medaillier(S, x0, x1, z0, z1, h){
  const c=COUL.acajou;
  S.pave('bois', x0,0,z0, x1,h,z1, c); S.pave('bois', x0-0.02,h-0.03,z0-0.03, x1+0.02,h,z1, mult(c,1.1));
  const n=6, w=(x1-x0-0.08)/2, hh=(h-0.14)/n;
  for (let col=0;col<2;col++) for (let k=0;k<n;k++){
    const a=x0+0.04+col*w, y=0.08+k*hh;
    S.pave('bois', a+0.01,y+0.008,z0-0.015, a+w-0.01,y+hh-0.008,z0, mult(c,1.15));
    S.sphere('laiton', T(a+w/2,y+hh/2,z0-0.025), 0.013, 8,6, COUL.laiton);
  }
  solide(x0,z0,x1,z1);
}
export function bureau(S, x0, x1, z0, z1, h){
  const c=COUL.noyer;
  S.pave('bois', x0,h-0.04,z0, x1,h,z1, c);
  S.pave('bois', x0,h-0.2,z0+0.05, x1,h-0.04,z1, mult(c,0.85));
  for (const [a,b] of [[x0+0.05,z0+0.05],[x1-0.05,z0+0.05],[x0+0.05,z1-0.05],[x1-0.05,z1-0.05]]) S.cyl('bois', T(a,0,b), 0.025,0.02,h-0.04,8,c);
  S.sphere('laiton', T((x0+x1)/2,h-0.12,z0+0.04), 0.014,8,6,COUL.laiton);
  S.quad('mat', T((x0+x1)/2-0.15,h+0.002,(z0+z1)/2).rx(-PI/2).rz(0.15), 0.22,0.3, COUL.papier);
  encrier(S, x1-0.2, h, (z0+z1)/2+0.05);
  loupe(S, T(x0+0.3,h+0.005,(z0+z1)/2+0.1).ry(-0.4));
  solide(x0,z0,x1,z1);
}
export function encrier(S, x, y, z){
  S.tour('verre', T(x,y,z), [[0,0],[0.035,0],[0.035,0.04],[0.015,0.05],[0.015,0.06],[0,0.06]], 12);
  S.cyl('mat', T(x,y+0.002,z), 0.03,0.03,0.035,12,[0.03,0.03,0.08]);
  S.tube('mat', I, [[x,y+0.04,z],[x+0.04,y+0.16,z+0.03],[x+0.07,y+0.26,z+0.06]], t=>[0.004+0.02*Math.sin(t*PI)*(t>0.2?1:0.2),0.003], 6, [0.92,0.9,0.85]);
}
export function loupe(S, M){
  S.tube('laiton', M.t(0,0.012,0), Array.from({length:25},(_,i)=>[Math.cos(i/24*TAU)*0.045,0,Math.sin(i/24*TAU)*0.045]), 0.006, 6, COUL.laiton, {bouts:false});
  S.cyl('verre', M.t(0,0.008,0), 0.045,0.045,0.008,20);
  S.cyl('bois', M.t(0.05,0.012,0).rz(PI/2).rz(PI), 0.008,0.01,0.11,8,COUL.ebene);
}
export function pileLivres(S, x, y, z, rng){
  let yy=y;
  for (let k=0;k<3;k++){ const e=0.04+rng()*0.02, a=(rng()-0.5)*0.4; S.boite('livres', T(x,yy+e/2,z).ry(a), 0.26-k*0.02, e, 0.19-k*0.01, [0.9,0.9,0.9], {uvRect:rectLivre(k*3%8)}); yy+=e; }
}
export function herbier(S, M){
  S.boite('bois', M.t(0,0.01,0), 0.5,0.02,0.34, COUL.cuir);
  S.quad('herbier', M.t(0,0.022,0).rx(-PI/2), 0.48, 0.32, BLANC);
}
export function lustre(S, x, z){
  const y=3.15;
  S.cyl('laiton', T(x,y-0.1,z), 0.02,0.02,0.85,8,COUL.laiton);
  for (let k=0;k<4;k++) S.tube('fer', I, [[x,3.95-k*0.12,z],[x,3.95-(k+1)*0.12,z]], 0.012, 5, COUL.fer);
  S.sphere('laiton', T(x,y-0.12,z), 0.05, 10,8, COUL.laiton);
  S.tube('laiton', I, Array.from({length:41},(_,i)=>[x+Math.cos(i/40*TAU)*0.45,y,z+Math.sin(i/40*TAU)*0.45]), 0.018, 6, COUL.laiton, {bouts:false});
  for (let k=0;k<6;k++){
    const a=k/6*TAU+0.3, px=x+Math.cos(a)*0.45, pz=z+Math.sin(a)*0.45;
    S.tube('laiton', I, [[x,y+0.25,z],[x+Math.cos(a)*0.25,y+0.12,z+Math.sin(a)*0.25],[px,y,pz]], 0.01, 5, COUL.laiton);
    S.cyl('laiton', T(px,y+0.01,pz), 0.028,0.02,0.03,10,COUL.laiton);
    S.cyl('mat', T(px,y+0.035,pz), 0.014,0.014,0.13,8,COUL.cire);
    flamme([px,y+0.165,pz], 1.1, 0.15);
  }
}
export function construireDehors(S, rng){
  S.pave('mat', -80,-0.08,-80, 80,-0.03,80, [0.3,0.4,0.19]);
  // ciel : une grande sphère éclairée d'elle-même, dégradée de l'horizon au zénith
  S.sphere('lumineux', I, 90, 24, 16, (x,y)=> y<0 ? [0.55,0.6,0.5] : melangeC([0.97,0.86,0.68],[0.42,0.6,0.86], Math.pow(Math.min(1,y*1.6),0.7)));
  // toit d'ardoise du cabinet et pignons
  for (const s of [-1,1]) S.boite('mat', T(0,5.3,s*2.4).rx(s*0.3588), 12.9, 0.1, 5.13, [0.24,0.26,0.3]);
  for (const x of [-6.3,6.15]) S.tri('brique', [x,4.4,-4.8],[x,4.4,4.8],[x,6.2,0],[x<0?-1:1,0,0]);
  // arbres et collines au loin
  for (let k=0;k<26;k++){
    const a=rng()*TAU, d=18+rng()*20, x=Math.cos(a)*d, z=Math.sin(a)*d;
    if (x>-9 && x<17 && Math.abs(z)<9) continue;
    const h=2.5+rng()*3;
    S.cyl('mat', T(x,0,z), 0.25,0.18,h,8,[0.3,0.22,0.15]);
    for (let j=0;j<4;j++) S.sphere('mat', T(x+(rng()-0.5)*1.6,h+rng()*1.4,z+(rng()-0.5)*1.6), 1.3+rng()*1.2, 10,7, melangeC(COUL.feuillageSombre,COUL.feuillage,rng()));
  }
  for (let k=0;k<9;k++){ const a=k/9*TAU+0.3; S.sphere('mat', T(Math.cos(a)*70,-4,Math.sin(a)*70).s(1,0.32,1), 22, 14,8, [0.36,0.45,0.34]); }
}

/* ---------- la serre ---------- */
export function construireSerre(S, rng){
  const x0=6.3, x1=14, f=COUL.fer;
  S.pave('dalles', x0,-0.02,-4.5, x1,0,4.5);
  S.pave('brique', x0,0,-4.5, x1,0.6,-4.3); S.pave('brique', x0,0,4.3, x1,0.6,4.5); S.pave('brique', 13.8,0,-4.5, x1,0.6,4.5);
  S.pave('satin', x0,0.6,-4.52, x1,0.64,-4.28, COUL.marbre); S.pave('satin', x0,0.6,4.28, x1,0.64,4.52, COUL.marbre); S.pave('satin', 13.78,0.6,-4.5, 14.02,0.64,4.5, COUL.marbre);
  S.quad('verre', T((x0+x1)/2,1.92,-4.4), x1-x0, 2.56); S.quad('verre', T((x0+x1)/2,1.92,4.4), x1-x0, 2.56);
  S.quad('verre', T(13.9,1.92,0).ry(PI/2), 8.8, 2.56);
  for (let x=x0+0.02; x<=x1+0.01; x+=(x1-x0)/8){ for (const z of [-4.4,4.4]) S.pave('fer', x-0.025,0.64,z-0.03, x+0.025,3.2,z+0.03, f); }
  for (let z=-4.4; z<=4.41; z+=8.8/9) S.pave('fer', 13.87,0.64,z-0.025, 13.93,3.2,z+0.025, f);
  for (const y of [1.9,3.2]){ S.pave('fer', x0,y-0.025,-4.43, x1,y+0.025,-4.37, f); S.pave('fer', x0,y-0.025,4.37, x1,y+0.025,4.43, f); S.pave('fer', 13.87,y-0.025,-4.4, 13.93,y+0.025,4.4, f); }
  // toit de verre à deux pentes
  S.quad('verre', T((x0+x1)/2,4.1,-2.2).rx(1.183), x1-x0, 4.754);
  S.quad('verre', T((x0+x1)/2,4.1,2.2).rx(-1.183), x1-x0, 4.754);
  S.tri('verre', [13.9,3.2,-4.4],[13.9,3.2,4.4],[13.9,5.0,0],[1,0,0]);
  for (let x=x0+0.02; x<=x1+0.01; x+=(x1-x0)/8){
    S.boite('fer', T(x,4.1,-2.2).rx(-0.388), 0.05,0.05,4.754, f);
    S.boite('fer', T(x,4.1,2.2).rx(0.388), 0.05,0.05,4.754, f);
  }
  S.pave('fer', x0,4.96,-0.05, x1,5.04,0.05, f);
  for (const s of [-1,1]) S.boite('fer', T(13.9,4.1,s*2.2).rx(s*0.388), 0.05,0.05,4.754, f);
  etiquette(S, ETIQ_CABINET, T(6.32,3.0,0).ry(PI/2), 0.7);
  solide(x0,-4.9,x1+0.4,-4.3); solide(x0,4.3,x1+0.4,4.9); solide(13.8,-4.9,14.4,4.9);
  // bassin du nénuphar géant
  const bx0=8.0, bx1=11.6, bz=1.7;
  S.pave('satin', bx0,0,-bz, bx1,0.45,-bz+0.2, COUL.marbre); S.pave('satin', bx0,0,bz-0.2, bx1,0.45,bz, COUL.marbre);
  S.pave('satin', bx0,0,-bz, bx0+0.2,0.45,bz, COUL.marbre); S.pave('satin', bx1-0.2,0,-bz, bx1,0.45,bz, COUL.marbre);
  S.pave('mat', bx0+0.2,0.0,-bz+0.2, bx1-0.2,0.06,bz-0.2, [0.12,0.16,0.12]);
  S.quad('eau', T((bx0+bx1)/2,0.32,0).rx(-PI/2), bx1-bx0-0.4, 2*bz-0.4, [0.18,0.32,0.3]);
  for (const [x,z,r] of [[8.85,-0.65,0.68],[9.95,0.55,0.62],[10.95,-0.75,0.58],[8.85,0.95,0.48],[10.2,-0.35,0.3]]) feuilleVictoria(S, x, 0.322, z, r);
  etiquette(S, 13, T(10.9,0.452,bz-0.1).rx(-PI/2+0.25), 0.24);
  solide(bx0,-bz,bx1,bz);
  // plates-bandes : cacaoyer au nord, bananier au sud
  for (const [za,zb] of [[-4.3,-2.2],[2.2,4.3]]){
    S.pave('brique', 12.2,0,za, 13.8,0.22,za+0.08); S.pave('brique', 12.2,0,zb-0.08, 13.8,0.22,zb); S.pave('brique', 12.2,0,za, 12.28,0.22,zb);
    S.pave('mat', 12.28,0,za+0.08, 13.8,0.18,zb-0.08, COUL.terre);
    solide(12.2,za,13.8,zb);
  }
  cacaoyer(S, 12.95, -3.15, rng);
  bananier(S, 12.95, 3.1, rng);
  for (const [z,i] of [[-2.35,11],[2.35,12]]){ S.cyl('bois', T(12.32,0,z), 0.01,0.01,0.55,6,COUL.noyer); etiquette(S, i, T(12.32,0.6,z).ry(-PI/2).rx(-0.3), 0.22); }
  // palmiers en caisse près de l'entrée, fougères le long du mur sud, établi au nord
  palmier(S, 7.2, -3.6, rng); palmier(S, 7.2, 3.6, rng);
  for (const x of [8.6,10.0,11.4]) fougereEnPot(S, x, 3.75, rng);
  const c=COUL.noyer;
  S.pave('bois', 8.4,0.82,-4.3, 11.6,0.87,-3.72, c);
  for (const x of [8.5,11.5]) for (const z of [-4.22,-3.8]) S.pave('bois', x-0.03,0,z-0.03, x+0.03,0.82,z+0.03, c);
  S.pave('bois', 8.45,0.25,-4.25, 11.55,0.28,-3.77, c);
  for (let k=0;k<7;k++){ const x=8.7+k*0.42; S.tour('mat', T(x,0.87,-4.0), [[0,0],[0.06,0],[0.08,0.12],[0.085,0.12],[0,0.12]], 12, COUL.cuite); if (k%3!==2) for (let j=0;j<5;j++){ const a=j/5*TAU+k; S.feuille('feuille', T(x,0.99,-4.0).ry(a).rx(-0.7), 0.12,0.05,4, t=>Math.sin(PI*t), t=>-0.15*t*t, 0, COUL.feuillage2); } }
  arrosoir(S, T(11.3,0,-3.4).ry(0.6));
  solide(8.4,-4.3,11.6,-3.7);
}
export function feuilleVictoria(S, x, y, z, R){
  const prof=[[0,0],[R,0],[R,0.055],[R-0.016,0.055],[R-0.016,0.012],[R*0.75,0.012],[R*0.5,0.012],[R*0.25,0.012],[0,0.012]];
  S.tour('satin', T(x,y,z).ry(R*7), prof, 56, (px,py,pz,u)=>{
    const r=Math.hypot(px,pz);
    if (py<0.005) return [0.45,0.13,0.15];
    if (r>R-0.03) return [0.5,0.22,0.16];
    const nerv = Math.abs(Math.sin(u*TAU*8))<0.12;
    return nerv ? [0.32,0.48,0.18] : [0.22,0.42,0.14];
  }, {dur:true});
}
export function cacaoyer(S, x, z, rng){
  const tronc=[[x,0.18,z],[x+0.02,0.8,z+0.01],[x-0.02,1.5,z+0.03],[x,2.1,z]];
  S.tube('bois', I, tronc, t=>0.11-0.04*t, 10, [0.55,0.42,0.32]);
  const fe=COUL.feuillageSombre;
  for (let k=0;k<5;k++){
    const a=k/5*TAU+0.4, h=1.7+k*0.08, L=0.7+rng()*0.2;
    const p0=[x,h,z], p1=[x+Math.cos(a)*L*0.5,h+0.35,z+Math.sin(a)*L*0.5], p2=[x+Math.cos(a)*L,h+0.55,z+Math.sin(a)*L*0.9];
    S.tube('bois', I, [p0,p1,p2], t=>0.05-0.03*t, 7, [0.5,0.38,0.28]);
    for (let j=0;j<12;j++){
      const b=rng()*TAU, el=-0.3-rng()*0.6, q=add(p2,[(rng()-0.5)*0.4,(rng()-0.5)*0.25,(rng()-0.5)*0.4]);
      const jeune = rng()<0.15;
      S.feuille('feuille', T(q[0],q[1],q[2]).ry(b).rx(-el), 0.34,0.12,5, t=>Math.pow(Math.sin(PI*Math.min(1,t*1.05)),0.7), t=>-0.25*t*t, 0, jeune?[0.6,0.25,0.22]:melangeC(fe,COUL.feuillage,rng()*0.5));
    }
  }
  // fleurs minuscules et cabosses de décor, directement sur le tronc : la cauliflorie
  for (let k=0;k<22;k++){ const a=rng()*TAU, h=0.5+rng()*1.3; S.sphere('satin', T(x+Math.cos(a)*0.085,h,z+Math.sin(a)*0.085), 0.008, 5,4, [0.95,0.85,0.82]); }
  for (const [a,h,coul] of [[1.9,0.75,[0.55,0.15,0.2]],[4.0,1.35,[0.4,0.6,0.15]],[0.5,1.55,[0.85,0.55,0.12]],[5.0,0.95,[0.75,0.3,0.12]]]){
    const p=[x+Math.cos(a)*0.14, h, z+Math.sin(a)*0.14];
    S.geo('satin', T(p[0],p[1],p[2]).ry(PI-a).s(0.75), geoCabosse(), coul);
  }
}
export function geoCabosse(){
  // ellipsoïde allongé à dix côtes, en pointe vers le bas ; le pédoncule (vers +x) rejoint le tronc
  const g=geoSphere(20,14), d={P:[],N:g.N,U:g.U};
  for (let i=0;i<g.P.length;i+=3){
    let x=g.P[i], y=g.P[i+1], z=g.P[i+2];
    const ph=Math.atan2(z,x), cote=1+0.08*Math.cos(10*ph);
    let k=cote*(y<0 ? 1+0.45*y : 1-0.15*y*y);
    x*=k; z*=k; y=y*(y<0 ? 1+0.2*y*y : 1);
    d.P.push(x*0.06, y*0.11, z*0.06);
  }
  const t=geoCyl(0.008,0.006,0.06,6);
  for (let i=0;i<t.P.length;i+=3){ const x=t.P[i], y=t.P[i+1], z=t.P[i+2]; d.P.push(y*1.2, 0.09+x+y*0.35, z); }
  return {P:d.P, N:g.N.concat(t.N), U:g.U.concat(t.U)};
}
export function bananier(S, x, z, rng){
  const st=[[x,0.18,z],[x+0.03,1.2,z],[x+0.02,2.25,z+0.02]];
  S.tube('satin', I, st, t=>0.16-0.06*t, 10, (px,py,pz,u,v)=> Math.sin(v*TAU*5+u*6)>0.6 ? [0.38,0.4,0.18] : [0.5,0.6,0.25]);
  for (let k=0;k<8;k++){
    const a=k/8*TAU+rng()*0.4, el=0.9-rng()*0.5;
    S.cyl('feuille', T(x,2.2,z).ry(-a).rz(-0.4), 0.02,0.015,0.5,6,[0.4,0.55,0.2]);
    S.feuille('feuille', T(x+Math.cos(a)*0.18,2.55,z+Math.sin(a)*0.18).ry(PI/2-a).rx(-el), 1.2,0.4,12,
      t=>Math.min(1,t*5)*Math.min(1,(1-t)*5+0.25), t=>-0.55*t*t, 0.12, (px,py,pz,u)=> Math.abs(u-0.5)<0.1 ? [0.62,0.72,0.38] : melangeC([0.25,0.5,0.17],[0.35,0.58,0.2],rng()*0.3));
  }
  // la hampe qui porte le régime part du sommet et retombe
  S.tube('satin', I, [[x+0.02,2.3,z],[x-0.15,2.45,z-0.05],[x-0.32,2.25,z-0.12],[x-0.4,1.9,z-0.15]], 0.025, 8, [0.42,0.45,0.2]);
  for (let k=0;k<4;k++){ const r0=0.33+k*0.08; S.cyl('feuille', T(x,0.18,z).ry(k*1.7).t(r0,0,0), 0.08,0.05,0.28,8,[0.4,0.52,0.22]); }   // rejets
}
export function palmier(S, x, z, rng){
  S.pave('bois', x-0.3,0,z-0.3, x+0.3,0.5,z+0.3, [0.35,0.45,0.32]);
  S.pave('mat', x-0.27,0.5,z-0.27, x+0.27,0.52,z+0.27, COUL.terre);
  S.tube('bois', I, [[x,0.5,z],[x+0.05,1.4,z+0.03],[x+0.02,2.3,z]], t=>0.09-0.03*t, 9, (px,py,pz,u)=> Math.sin(u*60)>0.3 ? [0.48,0.38,0.26] : [0.4,0.31,0.21]);
  for (let k=0;k<11;k++){ const a=k/11*TAU+rng()*0.3; S.feuille('feuille', T(x,2.3,z).ry(a).rx(-0.5-rng()*0.4), 0.95,0.28,10, t=>Math.sin(PI*Math.min(1,t*1.1)), t=>-0.5*t*t, 0.25, (px,py,pz,u)=> Math.abs(u-0.5)<0.08?[0.55,0.62,0.3]:[0.22,0.45,0.18]); }
  solide(x-0.32,z-0.32,x+0.32,z+0.32);
}
export function fougereEnPot(S, x, z, rng){
  S.tour('mat', T(x,0,z), [[0,0],[0.16,0],[0.22,0.38],[0.24,0.4],[0.2,0.4],[0.2,0.36],[0,0.36]], 16, COUL.cuite, {dur:true});
  for (let k=0;k<12;k++){ const a=k/12*TAU+rng()*0.4; S.feuille('feuille', T(x,0.38,z).ry(a).rx(-0.9-rng()*0.4), 0.55,0.18,10, t=>Math.sin(PI*t)*(0.6+0.4*Math.abs(Math.sin(t*40))), t=>-0.6*t*t, 0, COUL.feuillage2); }
  solide(x-0.25,z-0.25,x+0.25,z+0.25);
}
export function arrosoir(S, M){
  const v=[0.42,0.5,0.45];
  S.cyl('fer', M, 0.11,0.1,0.26,16,v);
  S.tube('fer', M, [[0.08,0.06,0],[0.2,0.18,0],[0.3,0.3,0]], 0.014, 6, v);
  S.cyl('fer', M.t(0.3,0.3,0).rz(-0.9), 0.02,0.035,0.05,8,v);
  S.tube('fer', M, [[-0.09,0.24,0],[-0.02,0.36,0],[0.06,0.24,0]], 0.01, 5, v, {bouts:false});
}
