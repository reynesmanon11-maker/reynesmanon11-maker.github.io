// Outils de modelage du cabinet : vecteurs, matrices, quaternions, formes de base,
// et le « Constructeur » qui range les triangles par matière. Repris tel quel de la
// version légère ; seule la partie dessin (WebGL) est remplacée par Three.js.

export const PI = Math.PI, TAU = Math.PI*2;
export const BLANC = [1,1,1];
export function hex(h){ const n = parseInt(h.slice(1),16); return [(n>>16&255)/255, (n>>8&255)/255, (n&255)/255]; }
export function mult(c,k){ return [c[0]*k, c[1]*k, c[2]*k]; }
export function melangeC(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
export function aleaGraine(s){ return function(){ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function lisse(t){ t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); }

/* --- vecteurs --- */
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const sca=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export const len=a=>Math.hypot(a[0],a[1],a[2]);
export const nrm=a=>{ const l=len(a)||1; return [a[0]/l,a[1]/l,a[2]/l]; };

/* --- matrices 4×4, rangées par colonnes comme WebGL les attend --- */
export const M4 = {
  id(){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; },
  mul(a,b){
    const o = new Array(16);
    for (let c=0;c<4;c++) for (let r=0;r<4;r++)
      o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
    return o;
  },
  tr(x,y,z){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; },
  sc(x,y,z){ return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]; },
  rx(a){ const c=Math.cos(a), s=Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; },
  ry(a){ const c=Math.cos(a), s=Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; },
  rz(a){ const c=Math.cos(a), s=Math.sin(a); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; },
  persp(fovy, asp, n, f){ const t = 1/Math.tan(fovy/2); return [t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0]; }
};
/* Transformations enchaînées : T(1,0,2).ry(0.5).s(2) = translation, puis rotation, puis échelle. */
export class Tr {
  constructor(m){ this.m = m; }
  t(x,y,z){ return new Tr(M4.mul(this.m, M4.tr(x,y,z))); }
  rx(a){ return new Tr(M4.mul(this.m, M4.rx(a))); }
  ry(a){ return new Tr(M4.mul(this.m, M4.ry(a))); }
  rz(a){ return new Tr(M4.mul(this.m, M4.rz(a))); }
  s(x,y,z){ if (y === undefined){ y = x; z = x; } return new Tr(M4.mul(this.m, M4.sc(x,y,z))); }
  fois(o){ return new Tr(M4.mul(this.m, o.m || o)); }
}
export const I = new Tr(M4.id());
export function T(x,y,z){ return I.t(x||0, y||0, z||0); }
export function enTr(M){ return M instanceof Tr ? M : new Tr(M); }
/* matrice dont les colonnes sont trois axes donnés (pour orienter une forme le long d'une direction) */
export function base3(o, ax, ay, az){ return new Tr([ax[0],ax[1],ax[2],0, ay[0],ay[1],ay[2],0, az[0],az[1],az[2],0, o[0],o[1],o[2],1]); }

/* --- quaternions, pour faire pivoter en douceur l'objet saisi --- */
export function qAxe(x,y,z,a){ const s=Math.sin(a/2); return [x*s,y*s,z*s,Math.cos(a/2)]; }
export function qMul(a,b){ return [
  a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
  a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
  a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
  a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]; }
export function qSlerp(a,b,t){
  let c = a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]; let bb = b;
  if (c < 0){ c = -c; bb = [-b[0],-b[1],-b[2],-b[3]]; }
  if (c > 0.9995){ const r=[a[0]+(bb[0]-a[0])*t, a[1]+(bb[1]-a[1])*t, a[2]+(bb[2]-a[2])*t, a[3]+(bb[3]-a[3])*t]; const l=Math.hypot(...r); return r.map(v=>v/l); }
  const th = Math.acos(c), s = Math.sin(th), wa = Math.sin((1-t)*th)/s, wb = Math.sin(t*th)/s;
  return [a[0]*wa+bb[0]*wb, a[1]*wa+bb[1]*wb, a[2]*wa+bb[2]*wb, a[3]*wa+bb[3]*wb];
}
export function composer(p, q, s){
  const [x,y,z,w] = q, x2=x+x, y2=y+y, z2=z+z;
  const xx=x*x2, yx=y*x2, yy=y*y2, zx=z*x2, zy=z*y2, zz=z*z2, wx=w*x2, wy=w*y2, wz=w*z2;
  return [(1-yy-zz)*s,(yx+wz)*s,(zx-wy)*s,0, (yx-wz)*s,(1-xx-zz)*s,(zy+wx)*s,0, (zx+wy)*s,(zy-wx)*s,(1-xx-yy)*s,0, p[0],p[1],p[2],1];
}

/* --- géométries de base, en coordonnées locales ---
   Chaque géométrie est une liste de triangles : positions P, normales N, coordonnées de texture U. */
export function triangle(g, a,b,c, na,nb,nc, ua,ub,uc){
  g.P.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
  g.N.push(na[0],na[1],na[2], nb[0],nb[1],nb[2], nc[0],nc[1],nc[2]);
  g.U.push(ua[0],ua[1], ub[0],ub[1], uc[0],uc[1]);
}
export function quadri(g, a,b,c,d, na,nb,nc,nd, ua,ub,uc,ud){ triangle(g,a,b,c,na,nb,nc,ua,ub,uc); triangle(g,a,c,d,na,nc,nd,ua,uc,ud); }
export const GEO_BOITE = (function(){       // cube de côté 1 centré sur l'origine
  const g={P:[],N:[],U:[]}, h=0.5, uv=[[0,0],[1,0],[1,1],[0,1]];
  const f=(n,a,b,c,d)=>quadri(g,a,b,c,d,n,n,n,n,uv[0],uv[1],uv[2],uv[3]);
  f([1,0,0],[h,-h,h],[h,-h,-h],[h,h,-h],[h,h,h]);
  f([-1,0,0],[-h,-h,-h],[-h,-h,h],[-h,h,h],[-h,h,-h]);
  f([0,1,0],[-h,h,h],[h,h,h],[h,h,-h],[-h,h,-h]);
  f([0,-1,0],[-h,-h,-h],[h,-h,-h],[h,-h,h],[-h,-h,h]);
  f([0,0,1],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]);       // face avant : la texture s'y lit à l'endroit
  f([0,0,-1],[h,-h,-h],[-h,-h,-h],[-h,h,-h],[h,h,-h]);
  return g;
})();
export const GEO_QUAD = (function(){        // carré de côté 1 dans le plan XY, tourné vers +z
  const g={P:[],N:[],U:[]}, n=[0,0,1];
  quadri(g,[-0.5,-0.5,0],[0.5,-0.5,0],[0.5,0.5,0],[-0.5,0.5,0],n,n,n,n,[0,0],[1,0],[1,1],[0,1]);
  return g;
})();
/* cylindre ou cône : base en y = 0, sommet en y = h */
export function geoCyl(rb, rt, h, seg, plat, sansFonds){
  const g={P:[],N:[],U:[]}, pente=(rb-rt)/h;
  const pt=(a,r,y)=>[r*Math.cos(a), y, r*Math.sin(a)];
  for (let i=0;i<seg;i++){
    const a0=i/seg*TAU, a1=(i+1)/seg*TAU, am=(a0+a1)/2;
    const n0 = nrm([Math.cos(plat?am:a0), pente, Math.sin(plat?am:a0)]);
    const n1 = plat ? n0 : nrm([Math.cos(a1), pente, Math.sin(a1)]);
    const u0=i/seg, u1=(i+1)/seg;
    quadri(g, pt(a0,rb,0), pt(a1,rb,0), pt(a1,rt,h), pt(a0,rt,h), n0,n1,n1,n0, [u0,0],[u1,0],[u1,1],[u0,1]);
    if (!sansFonds){
      const c0=[.5+.5*Math.cos(a0),.5+.5*Math.sin(a0)], c1=[.5+.5*Math.cos(a1),.5+.5*Math.sin(a1)];
      if (rb>0) triangle(g, [0,0,0], pt(a1,rb,0), pt(a0,rb,0), [0,-1,0],[0,-1,0],[0,-1,0], [.5,.5], c1, c0);
      if (rt>0) triangle(g, [0,h,0], pt(a0,rt,h), pt(a1,rt,h), [0,1,0],[0,1,0],[0,1,0], [.5,.5], c0, c1);
    }
  }
  return g;
}
/* sphère de rayon 1 (thMax < π pour une calotte) */
export const cacheSph = {};
export function geoSphere(sw, sh, thMax){
  thMax = thMax || PI;
  const cle = sw+'/'+sh+'/'+thMax;
  if (cacheSph[cle]) return cacheSph[cle];
  const g={P:[],N:[],U:[]};
  const pt=(th,ph)=>[Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph)];
  for (let j=0;j<sh;j++) for (let i=0;i<sw;i++){
    const t0=j/sh*thMax, t1=(j+1)/sh*thMax, p0=i/sw*TAU, p1=(i+1)/sw*TAU;
    const a=pt(t0,p0), b=pt(t0,p1), c=pt(t1,p1), d=pt(t1,p0);
    quadri(g, a,b,c,d, a,b,c,d, [i/sw,1-t0/PI],[(i+1)/sw,1-t0/PI],[(i+1)/sw,1-t1/PI],[i/sw,1-t1/PI]);
  }
  return cacheSph[cle] = g;
}
/* surface de révolution autour de l'axe y, à partir d'un profil [[rayon, y], …] */
export function geoTour(prof, seg, dur){
  const g={P:[],N:[],U:[]}, n=prof.length;
  const n2 = [];
  for (let j=0;j<n;j++){
    const a=prof[Math.max(0,j-1)], b=prof[Math.min(n-1,j+1)];
    const dr=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dr,dy)||1;
    n2.push([dy/l, -dr/l]);
  }
  for (let j=0;j<n-1;j++){
    let na=n2[j], nb=n2[j+1];
    if (dur){ const dr=prof[j+1][0]-prof[j][0], dy=prof[j+1][1]-prof[j][1], l=Math.hypot(dr,dy)||1; na=nb=[dy/l,-dr/l]; }
    for (let i=0;i<seg;i++){
      const a0=i/seg*TAU, a1=(i+1)/seg*TAU, c0=Math.cos(a0), s0=Math.sin(a0), c1=Math.cos(a1), s1=Math.sin(a1);
      const [r0,y0]=prof[j], [r1,y1]=prof[j+1];
      quadri(g, [r0*c0,y0,r0*s0],[r0*c1,y0,r0*s1],[r1*c1,y1,r1*s1],[r1*c0,y1,r1*s0],
        [na[0]*c0,na[1],na[0]*s0],[na[0]*c1,na[1],na[0]*s1],[nb[0]*c1,nb[1],nb[0]*s1],[nb[0]*c0,nb[1],nb[0]*s0],
        [i/seg,j/(n-1)],[(i+1)/seg,j/(n-1)],[(i+1)/seg,(j+1)/(n-1)],[i/seg,(j+1)/(n-1)]);
    }
  }
  return g;
}
/* tube le long d'un chemin ; rayon(t) donne r, ou [largeur, hauteur] pour une section ovale */
export function geoTube(pts, rayon, seg, o){
  o = o || {};
  const g={P:[],N:[],U:[]}, n=pts.length, Ts=[], rf = typeof rayon === 'function' ? rayon : ()=>rayon;
  for (let i=0;i<n;i++) Ts.push(nrm(sub(pts[Math.min(n-1,i+1)], pts[Math.max(0,i-1)])));
  let Nv = o.haut || [0,1,0];
  const anneaux = [];
  for (let i=0;i<n;i++){
    const Tg = Ts[i];
    let Np = sub(Nv, sca(Tg, dot(Nv,Tg)));
    if (len(Np) < 1e-5) Np = Math.abs(Tg[0]) < 0.9 ? cross(Tg,[1,0,0]) : cross(Tg,[0,0,1]);
    Np = nrm(Np); Nv = Np;
    const B = cross(Tg, Np);
    let r = rf(i/(n-1)); if (typeof r === 'number') r = [r,r];
    const rw = Math.max(r[0],1e-4), rh = Math.max(r[1],1e-4);
    const anneau = [];
    for (let k=0;k<=seg;k++){
      const a=k/seg*TAU, ca=Math.cos(a), sa=Math.sin(a);
      anneau.push([add(pts[i], add(sca(B,rw*ca), sca(Np,rh*sa))), nrm(add(sca(B,ca/rw), sca(Np,sa/rh))), [i/(n-1), k/seg]]);
    }
    anneaux.push(anneau);
  }
  for (let i=0;i<n-1;i++) for (let k=0;k<seg;k++){
    const a=anneaux[i][k], b=anneaux[i][k+1], c=anneaux[i+1][k+1], d=anneaux[i+1][k];
    quadri(g, a[0],b[0],c[0],d[0], a[1],b[1],c[1],d[1], a[2],b[2],c[2],d[2]);
  }
  if (o.bouts !== false){
    const n0 = sca(Ts[0],-1), n1 = Ts[n-1];
    for (let k=0;k<seg;k++){
      triangle(g, pts[0], anneaux[0][k+1][0], anneaux[0][k][0], n0,n0,n0, [0,.5],[0,.5],[0,.5]);
      triangle(g, pts[n-1], anneaux[n-1][k][0], anneaux[n-1][k+1][0], n1,n1,n1, [1,.5],[1,.5],[1,.5]);
    }
  }
  return g;
}
/* feuille : le long de +z, nervure en x = 0, face supérieure vers +y.
   largeur(t) et hauteur(t) pour t de 0 (pétiole) à 1 (pointe). */
export function geoFeuille(L, W, n, largeur, hauteur, pli){
  const g={P:[],N:[],U:[]}, rangs=[];
  for (let i=0;i<=n;i++){
    const t=i/n, z=t*L, hw=W/2*largeur(t), y=hauteur(t)*L;
    rangs.push({gch:[-hw, y+pli*hw, z], mil:[0,y,z], dr:[hw, y+pli*hw, z], t});
  }
  const nr = rangs.map((r,i)=>{ const a=rangs[Math.max(0,i-1)].mil, b=rangs[Math.min(n,i+1)].mil; return nrm(cross(nrm(sub(b,a)),[1,0,0])); });
  for (let i=0;i<n;i++){
    const A=rangs[i], B=rangs[i+1], na=nr[i], nb=nr[i+1];
    quadri(g, A.gch, A.mil, B.mil, B.gch, na,na,nb,nb, [0,A.t],[.5,A.t],[.5,B.t],[0,B.t]);
    quadri(g, A.mil, A.dr, B.dr, B.mil, na,na,nb,nb, [.5,A.t],[1,A.t],[1,B.t],[.5,B.t]);
  }
  return g;
}

/* --- « poser » une géométrie dans un lot : la transformer et la colorer ---
   col : [r,g,b] ou fonction (x,y,z,u,v) → [r,g,b] en coordonnées locales.
   o.uvMonde : texture plaquée d'après la position dans la pièce (bois, briques…)
   o.uvRect  : sous-rectangle [u0,v0,u1,v1] d'une planche de textures
   o.deforme : fonction qui modifie chaque point avant la transformation */
export function cofacteurs(m){
  const a=m[0],b=m[4],c=m[8], d=m[1],e=m[5],f=m[9], g=m[2],h=m[6],i=m[10];
  const C=[e*i-f*h, -(d*i-f*g), d*h-e*g, -(b*i-c*h), a*i-c*g, -(a*h-b*g), b*f-c*e, -(a*f-c*d), a*e-b*d];
  const det = a*C[0] + b*C[1] + c*C[2];
  if (det < 0) for (let k=0;k<9;k++) C[k] = -C[k];
  // n' = C·n, C rangée par lignes (cofacteurs = inverse transposée × déterminant)
  return C;
}
export function poser(L, m, g, col, o){
  const C = cofacteurs(m), P=g.P, N=g.N, U=g.U, nv=P.length/3, fn = typeof col === 'function';
  for (let i=0;i<nv;i++){
    let x=P[3*i], y=P[3*i+1], z=P[3*i+2];
    if (o.deforme){ const q=o.deforme(x,y,z); x=q[0]; y=q[1]; z=q[2]; }
    const wx=m[0]*x+m[4]*y+m[8]*z+m[12], wy=m[1]*x+m[5]*y+m[9]*z+m[13], wz=m[2]*x+m[6]*y+m[10]*z+m[14];
    const nx=N[3*i], ny=N[3*i+1], nz=N[3*i+2];
    let tx=C[0]*nx+C[1]*ny+C[2]*nz, ty=C[3]*nx+C[4]*ny+C[5]*nz, tz=C[6]*nx+C[7]*ny+C[8]*nz;
    const l=Math.hypot(tx,ty,tz)||1; tx/=l; ty/=l; tz/=l;
    L.p.push(wx,wy,wz); L.n.push(tx,ty,tz);
    const c = fn ? col(x,y,z,U[2*i],U[2*i+1]) : col;
    L.c.push(c[0],c[1],c[2]);
    let u=U[2*i], v=U[2*i+1];
    if (o.uvRect){ const r=o.uvRect; u=r[0]+u*(r[2]-r[0]); v=r[1]+v*(r[3]-r[1]); }
    else if (o.uvMonde){
      const s=o.uvMonde, ax=Math.abs(tx), ay=Math.abs(ty), az=Math.abs(tz);
      if (ay>=ax && ay>=az){ u=wx*s; v=wz*s; } else if (ax>=az){ u=wz*s; v=wy*s; } else { u=wx*s; v=wy*s; }
    }
    L.u.push(u,v);
  }
}

/* --- matières : réglage de l'éclairage et texture éventuelle --- */
export const MATS = {
  mat:        {spec:0.05, shin:10},
  satin:      {spec:0.3,  shin:28},
  laiton:     {spec:0.95, shin:46},
  fer:        {spec:0.35, shin:30},
  lumineux:   {unlit:true},
  feuille:    {spec:0.22, shin:18, double:true},
  bois:       {tex:'bois', spec:0.22, shin:26, uvMonde:1.1},
  parquet:    {tex:'parquet', spec:0.35, shin:40, uvMonde:0.5},
  tapisserie: {tex:'tapisserie', spec:0.04, shin:8, uvMonde:2.1},
  brique:     {tex:'brique', spec:0.03, shin:6, uvMonde:0.75},
  dalles:     {tex:'dalles', spec:0.15, shin:22, uvMonde:0.85},
  tapis:      {tex:'tapis', spec:0.02, shin:4},
  livres:     {tex:'livres', spec:0.18, shin:16},
  ecaille:    {tex:'ecaille', spec:0.55, shin:30},
  planche:    {tex:'planche', spec:0.06, shin:8},
  papillons:  {tex:'papillons', spec:0.05, shin:8},
  etiquettes: {tex:'etiquettes', spec:0.03, shin:6},
  herbier:    {tex:'herbier', spec:0.03, shin:6},
  globe:      {tex:'globe', spec:0.4, shin:30},
  eau:        {spec:1.3, shin:90, alpha:0.68, transp:true, ordre:1},
  liquide:    {spec:0.8, shin:60, alpha:0.38, transp:true, ordre:2},
  verre:      {spec:1.6, shin:120, alpha:0.1, transp:true, ordre:3, verre:true}
};

export class Constructeur {
  constructor(){ this.lots = {}; }
  lot(mat){ if (!MATS[mat]) throw new Error('Matière inconnue : '+mat); return this.lots[mat] || (this.lots[mat] = {p:[],n:[],c:[],u:[]}); }
  geo(mat, M, g, col, o){
    const opt = Object.assign({}, MATS[mat].uvMonde ? {uvMonde:MATS[mat].uvMonde} : {}, o || {});
    poser(this.lot(mat), (M.m || M), g, col || BLANC, opt); return this;
  }
  boite(mat, M, w,h,d, col, o){ return this.geo(mat, enTr(M).s(w,h,d), GEO_BOITE, col, o); }
  pave(mat, x0,y0,z0, x1,y1,z1, col, o){ return this.geo(mat, T((x0+x1)/2,(y0+y1)/2,(z0+z1)/2).s(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0)), GEO_BOITE, col, o); }
  cyl(mat, M, rb, rt, h, seg, col, o){ return this.geo(mat, M, geoCyl(rb,rt,h,seg,o&&o.plat,o&&o.sansFonds), col, o); }
  sphere(mat, M, r, sw, sh, col, o){ return this.geo(mat, enTr(M).s(r), geoSphere(sw,sh,o&&o.thMax), col, o); }
  tour(mat, M, prof, seg, col, o){ return this.geo(mat, M, geoTour(prof, seg, o&&o.dur), col, o); }
  tube(mat, M, pts, rayon, seg, col, o){ return this.geo(mat, M, geoTube(pts, rayon, seg, o), col, o); }
  quad(mat, M, w, h, col, o){ return this.geo(mat, enTr(M).s(w,h,1), GEO_QUAD, col, o); }
  feuille(mat, M, L, W, n, largeur, hauteur, pli, col, o){ return this.geo(mat, M, geoFeuille(L,W,n,largeur,hauteur,pli||0), col, o); }
  tri(mat, a,b,c, n, col, o){ const g={P:[],N:[],U:[]}; triangle(g,a,b,c,n,n,n,[0,0],[1,0],[.5,1]); return this.geo(mat, I, g, col, o); }
}
