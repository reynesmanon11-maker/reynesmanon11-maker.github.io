// Les 14 curiosités modelées par le code, chacune centrée sur son origine, face avant
// vers +z. Reprises telles quelles de la version légère : un modèle GLB pourra
// remplacer chacune d'elles (étape 3), celle-ci restant alors le modèle de secours.
import { BLANC, I, PI, T, TAU, add, aleaGraine, base3, cross, enTr, geoCyl, lisse, melangeC, mult, nrm, sca, sub } from './geometrie.js';
import { rectEtiquette } from './textures.js';
import { COUL, geoCabosse } from './decor.js';

/* ---------- modèles des curiosités (centrés sur leur origine) ---------- */
export function oiseau(B, M, type){
  const cfg = {gros:{col:[0.13,0.12,0.11], bec:[0.022,0.03], tete:0.034, cb:[0.18,0.17,0.15]},
               moyen:{col:[0.26,0.21,0.16], bec:[0.015,0.027], tete:0.031, cb:[0.3,0.27,0.22]},
               fin:{col:[0.45,0.42,0.28], bec:[0.006,0.034], tete:0.027, cb:[0.32,0.28,0.2]}}[type];
  B.sphere('satin', M.t(0,0.045,0).rx(-0.4).s(0.036,0.034,0.058), 1, 14,10, cfg.col);
  B.sphere('satin', M.t(0,0.082,0.042), cfg.tete, 12,10, cfg.col);
  for (const s of [-1,1]){ B.sphere('satin', M.t(s*0.031,0.05,-0.005).s(0.008,0.024,0.046), 1, 8,6, mult(cfg.col,0.8)); B.sphere('satin', M.t(s*0.021,0.088,0.06), 0.005, 6,5, [0.02,0.02,0.02]); }
  B.cyl('satin', M.t(0,0.08,0.042+cfg.tete*0.8).rx(PI/2), cfg.bec[0], 0.001, cfg.bec[1], 10, cfg.cb);
  B.boite('satin', M.t(0,0.03,-0.07).rx(0.35), 0.032,0.006,0.055, mult(cfg.col,0.85));
  for (const s of [-1,1]) B.cyl('mat', M.t(s*0.012,0,0.005), 0.0025,0.0025,0.02,4,[0.25,0.2,0.15]);
}
export function spirale(B, M, rFin, croissance, k, tours, pas, col, ecrase, cotes){
  const b=Math.log(croissance)/TAU, pts=[], th0=-tours*TAU;
  for (let th=th0; th<=0.0001; th+=pas){ const r=rFin*Math.exp(b*th); pts.push([r*Math.cos(th), r*Math.sin(th), 0]); }
  const n=pts.length;
  B.tube('satin', M, pts, t=>{ const th=th0+t*(-th0); const r=rFin*Math.exp(b*th); let rr=k*r; if (cotes) rr*=1+cotes*Math.pow(Math.max(0,Math.sin(th*18)),2); return [rr, rr*ecrase]; }, 14, col, {haut:[0,0,1]});
  return n;
}
export const MODELES = {
  pinsons(B){
    B.cyl('bois', T(0,-0.2,0), 0.15,0.15,0.03,24, COUL.noyer);
    for (const x of [-0.11,0.11]) B.cyl('bois', T(x,-0.17,0), 0.008,0.008,0.085,6, COUL.noyer);
    B.tube('mat', I, [[-0.17,-0.085,0],[-0.05,-0.095,0.015],[0.07,-0.08,-0.01],[0.17,-0.09,0]], t=>0.011-0.004*t, 7, [0.42,0.32,0.22]);
    oiseau(B, T(-0.11,-0.077,0).ry(0.35), 'gros');
    oiseau(B, T(0.0,-0.088,0.01).ry(-0.15), 'moyen');
    oiseau(B, T(0.12,-0.08,0).ry(0.55), 'fin');
  },
  phalene(B){
    const c=COUL.ebene, w=0.62, h=0.48, e=0.04;
    B.boite('bois', T(0,0,-0.02), w,h,0.02, c);
    B.boite('bois', T(0,h/2-e/2,0.01), w,e,0.06, c); B.boite('bois', T(0,-h/2+e/2,0.01), w,e,0.06, c);
    B.boite('bois', T(-w/2+e/2,0,0.01), e,h,0.06, c); B.boite('bois', T(w/2-e/2,0,0.01), e,h,0.06, c);
    B.quad('papillons', T(0,0,-0.009), w-2*e, h-2*e);
    B.quad('verre', T(0,0,0.035), w-2*e, h-2*e);
  },
  tortue(B){
    const sel = (x,y,z)=>{ const avant=Math.max(0,z); return [x, y + 0.42*Math.pow(avant,4)*(1-y), z]; };
    B.sphere('ecaille', T(0,-0.15,0).s(0.36,0.36,0.46), 1, 36, 12, BLANC, {thMax:PI/2, deforme:sel});
    B.cyl('satin', T(0,-0.17,0).s(0.33,1,0.43), 1,1,0.025,28, [0.62,0.5,0.3]);
  },
  nautile(B){
    B.cyl('bois', T(0,-0.14,0), 0.06,0.07,0.02,16, COUL.ebene);
    B.cyl('laiton', T(0,-0.12,0), 0.008,0.008,0.04,6, COUL.laiton);
    spirale(B, T(0.01,0.03,0).rz(-0.5), 0.085, 3.0, 0.58, 3, 0.09, (x,y,z,u)=>{
      const th=-3*TAU*(1-u); const flamme=Math.sin(th*7+Math.sin(th*2)*1.5);
      const efface=lisse((0.9-u)/0.25);
      if (u>0.995) return [0.82,0.78,0.84];
      return flamme>0.25 ? melangeC([0.94,0.89,0.8],[0.55,0.3,0.15],efface) : [0.94,0.89,0.8];
    }, 0.72, 0);
  },
  ammonite(B){
    B.boite('bois', T(0,-0.125,0), 0.2,0.03,0.09, COUL.ebene);
    spirale(B, T(0,0.03,0).rz(0.3), 0.1, 2.0, 0.38, 3.2, 0.045, (x,y,z,u)=>{
      const th=-3.2*TAU*(1-u); const cote=Math.pow(Math.max(0,Math.sin(th*18)),2);
      return melangeC([0.55,0.5,0.42],[0.72,0.66,0.55],cote*0.8);
    }, 0.8, 0.12);
  },
  corail(B){
    B.boite('bois', T(0,-0.18,0), 0.14,0.04,0.12, COUL.ebene);
    const rng=aleaGraine(23);
    const branche=(M,L,r,d)=>{
      B.cyl('mat', M, r, r*0.82, L, 7, (x,y,z)=> [0.93-0.05*rng(),0.89-0.05*rng(),0.8]);
      if (d===0){ B.sphere('mat', M.t(0,L,0), r*0.85, 7,5, [0.97,0.95,0.9]); return; }
      const n=2+(rng()<0.55?1:0);
      for (let k=0;k<n;k++){ const a=k/n*TAU+rng()*1.3, inc=0.3+rng()*0.45; branche(M.t(0,L*0.95,0).ry(a).rz(inc), L*(0.72+rng()*0.15), r*0.74, d-1); }
    };
    branche(T(0,-0.16,0), 0.1, 0.022, 4);
    branche(T(0.03,-0.16,0.01).rz(-0.5), 0.08, 0.017, 3);
  },
  serpent(B){
    const M=T(0,-0.18,0), r=0.115, h=0.36;
    B.tour('verre', M, [[0,0],[r,0],[r*1.04,0.012],[r*1.04,h*0.86],[r*0.86,h*0.93],[r*0.8,h]], 24);
    B.tour('liquide', M.t(0,0.004,0), [[0,0],[r*0.97,0],[r*0.97,h*0.8],[0,h*0.8]], 22, [0.85,0.75,0.45]);
    B.cyl('mat', M.t(0,h-0.005,0), r*0.83,r*0.83,0.035,20,[0.55,0.4,0.25]);
    B.cyl('mat', M.t(0,h+0.028,0), r*0.86,r*0.86,0.012,20,[0.35,0.12,0.1]);
    const pts=[];
    for (let s=0;s<=1.0001;s+=0.012){ const th=s*5.4*PI, R=0.075-0.025*s; pts.push([R*Math.cos(th), 0.03+s*0.2, R*Math.sin(th)]); }
    const fin=pts[pts.length-1]; pts.push([fin[0]*0.6,fin[1]+0.03,fin[2]*0.6]); pts.push([fin[0]*0.3,fin[1]+0.045,fin[2]*0.3]);
    B.tube('satin', M, pts, t=> t<0.12 ? 0.003+0.017*t/0.12 : (t>0.97 ? 0.022 : 0.02), 9, (x,y,z,u,v)=>{
      if (Math.cos(v*TAU) < -0.55) return [0.78,0.72,0.55];
      return (Math.sin(u*95)+0.4*Math.sin(v*TAU*2))>0.35 ? [0.62,0.48,0.27] : [0.2,0.14,0.09];
    });
    const p=pts[pts.length-1], q=pts[pts.length-3], dir=nrm(sub(p,q));
    const ax=nrm(cross([0,1,0],dir)), ay=cross(dir,ax);
    B.sphere('satin', enTr(M).fois(base3(p, ax, ay, dir)).s(0.026,0.018,0.034), 1, 10,8, [0.22,0.16,0.1]);
    B.quad('etiquettes', M.t(0,0.12,r*1.045), 0.14, 0.035, BLANC, {uvRect:rectEtiquette(6)});
  },
  crocodile(B){
    const prof=[[0,0.015,0.03],[0.2,0.08,0.11],[0.42,0.13,0.14],[0.5,0.2,0.14],[0.68,0.21,0.135],[0.76,0.15,0.1],[0.83,0.15,0.09],[0.88,0.12,0.07],[1,0.05,0.04]];
    const interp=t=>{ for (let i=0;i<prof.length-1;i++){ const a=prof[i], b=prof[i+1]; if (t<=b[0]){ const k=(t-a[0])/(b[0]-a[0]); return [a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k]; } } return [0.05,0.04]; };
    const pts=[]; for (let i=0;i<=60;i++){ const t=i/60, x=-1.1+t*2.2; pts.push([x, 0.02*Math.sin(t*3), 0.08*Math.sin(t*PI*1.6+0.4)*(1-t)]); }
    B.tube('satin', I, pts, interp, 14, (x,y,z,u,v)=>{
      if (Math.sin(v*TAU) < -0.5) return [0.66,0.6,0.44];          // ventre clair
      const ecaille=Math.sin(u*170)>0.4 ? 0.82 : 1;                  // bandes de plaques osseuses
      return mult([0.3,0.28,0.18], ecaille);
    });
    for (const s of [-1,1]){
      B.sphere('satin', T(0.82,0.075,s*0.045), 0.022, 8,6, [0.3,0.28,0.18]);
      B.sphere('satin', T(0.83,0.085,s*0.05), 0.01, 6,5, [0.55,0.45,0.1]);
      for (let k=0;k<9;k++){ const xx=0.9+k*0.022, w=interp((xx+1.1)/2.2); B.cyl('satin', T(xx,-w[1]*0.25,s*w[0]*0.93).rx(PI), 0.0045,0,0.014,4,[0.95,0.92,0.82]); }
      for (const [x,arr] of [[0.45,1],[-0.05,-1]]){
        B.tube('satin', I, [[x,0,s*0.18],[x+0.04*arr,-0.06,s*0.3],[x+0.07*arr,-0.15,s*0.33]], 0.035, 7, [0.32,0.29,0.19]);
        B.boite('satin', T(x+0.1*arr,-0.16,s*0.34), 0.09,0.02,0.07, [0.3,0.27,0.18]);
      }
    }
  },
  microscope(B){
    const L=COUL.laiton, n=[0.12,0.1,0.08];
    B.boite('satin', T(0,-0.19,0), 0.16,0.02,0.13, n);
    B.cyl('laiton', T(0,-0.18,-0.04), 0.016,0.014,0.13,10,L);
    B.boite('laiton', T(0,-0.045,0.005), 0.11,0.008,0.1, L);
    B.boite('mat', T(0,-0.039,0.01), 0.075,0.002,0.026, [0.85,0.9,0.92]);
    B.cyl('laiton', T(0,-0.12,0.01).rx(0.5), 0.027,0.027,0.006,16,L);
    B.cyl('laiton', T(0,-0.119,0.01).rx(0.5), 0.022,0.022,0.007,16,[0.9,0.92,0.95]);
    B.boite('laiton', T(0,0.06,-0.045), 0.024,0.2,0.022, L);
    B.boite('laiton', T(0,0.12,-0.022), 0.02,0.03,0.04, L);
    B.cyl('laiton', T(0,-0.015,0.01), 0.018,0.018,0.21,16,L);
    B.cyl('laiton', T(0,-0.035,0.01), 0.008,0.012,0.022,10,[0.2,0.18,0.15]);
    B.cyl('laiton', T(0,0.19,0.01), 0.014,0.014,0.04,12,L);
    B.cyl('mat', T(0,0.228,0.01), 0.016,0.016,0.006,12,[0.1,0.08,0.06]);
    for (const s of [-1,1]) B.cyl('laiton', T(s*0.012,0.1,-0.045).rz(s*PI/2), 0.018,0.018,0.012,14,L);
  },
  planche(B){
    const w=0.88, h=0.68, e=0.055, o=[0.78,0.6,0.28];
    B.boite('bois', T(0,0,-0.012), w,h,0.02, COUL.ebene);
    B.boite('laiton', T(0,h/2-e/2,0.01), w,e,0.04, o); B.boite('laiton', T(0,-h/2+e/2,0.01), w,e,0.04, o);
    B.boite('laiton', T(-w/2+e/2,0,0.01), e,h,0.04, o); B.boite('laiton', T(w/2-e/2,0,0.01), e,h,0.04, o);
    B.quad('planche', T(0,0,0.0), w-2*e, h-2*e);
  },
  glossopetres(B){
    B.boite('bois', T(0,-0.012,0), 0.34,0.024,0.22, COUL.noyer);
    for (const [x,z,w,d] of [[0,-0.105,0.34,0.012],[0,0.105,0.34,0.012],[-0.165,0,0.012,0.22],[0.165,0,0.012,0.22]]) B.boite('bois', T(x,0.008,z), w,0.025,d, COUL.noyer);
    B.boite('mat', T(0,0.001,0), 0.31,0.004,0.19, [0.42,0.08,0.08]);
    const dents=[[-0.11,-0.04,0.3,1.3],[-0.03,0.04,-0.4,1.0],[0.06,-0.03,0.9,1.45],[0.12,0.05,-0.2,0.85],[-0.1,0.06,1.7,0.75]];
    for (const [x,z,a,k] of dents){
      const M=T(x,0.008,z).ry(a).s(k).rx(PI/2);
      B.geo('satin', M.s(1,1,0.32), geoCyl(0.024,0.0015,0.055,14), (px,py)=> py<0.004 ? [0.42,0.32,0.22] : [0.38,0.37,0.36]);
      B.boite('mat', M.t(0,-0.006,0), 0.052,0.014,0.016, [0.45,0.34,0.22]);
    }
  },
  cacao(B){ B.geo('satin', T(0,0,0), geoCabosse(), (x,y)=> melangeC([0.93,0.68,0.16],[0.8,0.38,0.1], lisse(0.5-y*5))); },
  banane(B){
    B.tube('satin', I, [[0,0.42,0],[0.0,0.2,0.01],[0.02,-0.1,0],[0.01,-0.36,0]], 0.022, 8, [0.4,0.42,0.18]);
    const rng=aleaGraine(37);
    [0.25,0.1,-0.05,-0.2].forEach((y,m)=>{
      const n=8-m;
      for (let k=0;k<n;k++){
        const a=(k/(n-1)-0.5)*PI*1.4+(m%2?0.3:-0.3)+PI/2, d=[Math.cos(a),0,Math.sin(a)];
        const L=0.17-m*0.012, pts=[];
        for (let i=0;i<=8;i++){ const s=i/8; pts.push(add([0,y,0], add(sca(d,0.02+L*0.75*s), [0, L*(0.15*s+0.7*s*s)+ (rng()-0.5)*0.004, 0]))); }
        B.tube('satin', I, pts, t=>0.004+0.016*Math.pow(Math.sin(PI*Math.min(1,t*1.05)),0.6), 5, (x,yy,z,u)=> u>0.93 ? [0.2,0.18,0.1] : [0.6,0.68,0.2]);
      }
    });
    B.sphere('satin', T(0.01,-0.44,0).s(0.05,0.1,0.05), 1, 12,10, [0.42,0.1,0.16]);
    B.sphere('satin', T(0.01,-0.41,0.012).s(0.054,0.085,0.05), 1, 12,10, [0.5,0.14,0.2]);
  },
  victoria(B){
    B.sphere('satin', T(0,-0.02,0).s(0.06,0.04,0.06), 1, 12,8, [0.45,0.15,0.18]);
    const couronne=(n,L,W,el,r0,coul,dec)=>{ for (let k=0;k<n;k++){ const a=k/n*TAU+dec; B.feuille('feuille', T(Math.cos(a)*r0,0,Math.sin(a)*r0).ry(PI/2-a).rx(-el), L,W,6, t=>Math.pow(Math.sin(PI*Math.min(1,t*1.02)),0.6), t=>-0.12*t*t, 0.15, coul); } };
    couronne(4, 0.13, 0.06, 0.15, 0.04, [0.45,0.13,0.18], 0.4);
    couronne(14, 0.12, 0.045, 0.55, 0.035, (x,y,z,u,v)=>melangeC([0.97,0.95,0.9],[0.98,0.88,0.88],v), 0);
    couronne(12, 0.1, 0.04, 0.95, 0.03, [0.98,0.9,0.9], 0.13);
    couronne(10, 0.075, 0.035, 1.25, 0.022, [0.92,0.6,0.66], 0.3);
    B.cyl('satin', T(0,0.0,0), 0.025,0.012,0.05,12,[0.95,0.88,0.6]);
  }
};
/* une curiosité tenue en main occupe à peu près ce rayon (m) devant les yeux */
export const TENUE = {crocodile:0.32, planche:0.3, phalene:0.28, tortue:0.27};
export const NE_TOURNE_PAS = {planche:true, phalene:true};
