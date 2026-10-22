// QR code (modèle 2, mode octet, correction de niveau M), sans bibliothèque ni réseau : de quoi
// montrer l'adresse du Carnet sur un écran pour qu'un téléphone l'ouvre — le sien, ou celui d'un
// collègue en salle des profs. Versions 1 à 10 : jusqu'à 213 octets, bien plus qu'une adresse.
// L'algorithme suit la norme ISO/IEC 18004 ; le calcul des pénalités reprend celui, devenu la
// référence, de la bibliothèque de Project Nayuki.

// Par version : [octets de correction par bloc, blocs du groupe 1, octets de données par bloc
// du groupe 1, blocs du groupe 2, octets de données par bloc du groupe 2] — niveau M.
const BLOCS_M = [null,
  [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
];
// Centres des motifs d'alignement, par version.
const ALIGNEMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const NIVEAU_M = 0; // bits du niveau de correction dans l'information de format (L=1, M=0, Q=3, H=2)

// Corps de Galois à 256 éléments (polynôme 0x11D), pour le code de Reed-Solomon.
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function generateur(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const s = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) { s[j] ^= g[j]; s[j + 1] ^= mul(g[j], EXP[i]); }
    g = s;
  }
  return g;
}

/** Octets de correction : reste de la division des données par le polynôme générateur. */
export function correction(donnees, n) {
  const g = generateur(n);
  const r = [...donnees, ...new Array(n).fill(0)];
  for (let i = 0; i < donnees.length; i++) {
    const c = r[i];
    if (c) for (let j = 1; j < g.length; j++) r[i + j] ^= mul(g[j], c);
  }
  return r.slice(donnees.length);
}

const capacite = (v) => { const [, b1, d1, b2, d2] = BLOCS_M[v]; return b1 * d1 + b2 * d2; };
const bitsCompte = (v) => (v < 10 ? 8 : 16);

function versionPour(n) {
  for (let v = 1; v < BLOCS_M.length; v++) if (4 + bitsCompte(v) + 8 * n <= capacite(v) * 8) return v;
  throw new Error('Texte trop long pour un QR code de version 10.');
}

function octetsDeDonnees(octets, v) {
  const bits = [];
  const pousser = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  pousser(0b0100, 4); // mode octet
  pousser(octets.length, bitsCompte(v));
  for (const o of octets) pousser(o, 8);
  const max = capacite(v) * 8;
  pousser(0, Math.min(4, max - bits.length)); // terminateur
  while (bits.length % 8) bits.push(0);
  const res = [];
  for (let i = 0; i < bits.length; i += 8) res.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let k = 0; res.length < capacite(v); k++) res.push(k % 2 ? 0x11 : 0xec);
  return res;
}

function entrelacer(donnees, v) {
  const [ec, b1, d1, b2, d2] = BLOCS_M[v];
  const blocs = [];
  for (let i = 0, k = 0; i < b1 + b2; i++) { const n = i < b1 ? d1 : d2; blocs.push(donnees.slice(k, k + n)); k += n; }
  const corr = blocs.map((b) => correction(b, ec));
  const res = [];
  for (let i = 0; i < Math.max(d1, d2); i++) for (const b of blocs) if (i < b.length) res.push(b[i]);
  for (let i = 0; i < ec; i++) for (const c of corr) res.push(c[i]);
  return res;
}

function bchFormat(masque) {
  const d = (NIVEAU_M << 3) | masque;
  let r = d;
  for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
  return ((d << 10) | r) ^ 0x5412;
}

function bchVersion(v) {
  let r = v;
  for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
  return (v << 12) | r;
}

const MASQUES = [
  (l, c) => (l + c) % 2 === 0,
  (l) => l % 2 === 0,
  (l, c) => c % 3 === 0,
  (l, c) => (l + c) % 3 === 0,
  (l, c) => (Math.floor(l / 2) + Math.floor(c / 3)) % 2 === 0,
  (l, c) => ((l * c) % 2) + ((l * c) % 3) === 0,
  (l, c) => (((l * c) % 2) + ((l * c) % 3)) % 2 === 0,
  (l, c) => (((l + c) % 2) + ((l * c) % 3)) % 2 === 0,
];

/** La matrice de base : motifs fixes posés, zones réservées marquées, données placées. */
function matrice(v, flux) {
  const n = v * 4 + 17;
  const m = Array.from({ length: n }, () => new Array(n).fill(false));
  const fixe = Array.from({ length: n }, () => new Array(n).fill(false));
  const poser = (l, c, noir) => { m[l][c] = noir; fixe[l][c] = true; };

  // Motifs de repérage des trois coins, avec leur liseré blanc.
  for (const [l0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    for (let dl = -1; dl <= 7; dl++) {
      for (let dc = -1; dc <= 7; dc++) {
        const l = l0 + dl, c = c0 + dc;
        if (l < 0 || l >= n || c < 0 || c >= n) continue;
        const dedans = dl >= 0 && dl <= 6 && dc >= 0 && dc <= 6;
        poser(l, c, dedans && (dl === 0 || dl === 6 || dc === 0 || dc === 6 || (dl >= 2 && dl <= 4 && dc >= 2 && dc <= 4)));
      }
    }
  }
  // Lignes de synchronisation.
  for (let i = 8; i < n - 8; i++) { poser(6, i, i % 2 === 0); poser(i, 6, i % 2 === 0); }
  // Motifs d'alignement, sauf ceux qui tomberaient sur un motif de repérage.
  const pos = ALIGNEMENT[v], der = pos.length - 1;
  pos.forEach((l, a) => pos.forEach((c, b) => {
    if ((a === 0 && b === 0) || (a === 0 && b === der) || (a === der && b === 0)) return;
    for (let dl = -2; dl <= 2; dl++) for (let dc = -2; dc <= 2; dc++) poser(l + dl, c + dc, Math.max(Math.abs(dl), Math.abs(dc)) !== 1);
  }));
  // Zones de l'information de format (écrite après le choix du masque) et module toujours noir.
  for (let i = 0; i < 9; i++) { fixe[8][i] = true; fixe[i][8] = true; }
  for (let i = 0; i < 8; i++) { fixe[8][n - 1 - i] = true; fixe[n - 1 - i][8] = true; }
  poser(n - 8, 8, true);
  // Information de version, à partir de la version 7.
  if (v >= 7) {
    const bits = bchVersion(v);
    for (let i = 0; i < 18; i++) {
      const noir = ((bits >>> i) & 1) === 1, a = Math.floor(i / 3), b = n - 11 + (i % 3);
      poser(a, b, noir); poser(b, a, noir);
    }
  }
  // Données : en zigzag par paires de colonnes, de droite à gauche, en sautant la colonne 6.
  let k = 0;
  for (let droite = n - 1; droite >= 1; droite -= 2) {
    if (droite === 6) droite = 5;
    const montee = ((droite + 1) & 2) === 0;
    for (let j = 0; j < n; j++) {
      for (let d = 0; d < 2; d++) {
        const c = droite - d, l = montee ? n - 1 - j : j;
        if (fixe[l][c] || k >= flux.length * 8) continue;
        m[l][c] = ((flux[k >>> 3] >>> (7 - (k & 7))) & 1) === 1;
        k++;
      }
    }
  }
  return { n, m, fixe };
}

function appliquerMasque({ n, m, fixe }, masque) {
  const f = MASQUES[masque];
  for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (!fixe[l][c] && f(l, c)) m[l][c] = !m[l][c];
}

function poserFormat({ n, m }, masque) {
  const bits = bchFormat(masque), b = (i) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) m[i][8] = b(i);
  m[7][8] = b(6); m[8][8] = b(7); m[8][7] = b(8);
  for (let i = 9; i < 15; i++) m[8][14 - i] = b(i);
  for (let i = 0; i < 8; i++) m[8][n - 1 - i] = b(i);
  for (let i = 8; i < 15; i++) m[n - 15 + i][8] = b(i);
  m[n - 8][8] = true;
}

/** Pénalité d'un masque (règles N1 à N4 de la norme, telles que Project Nayuki les calcule). */
function penalite({ n, m }) {
  let total = 0;
  const ajouterHistorique = (longueur, h) => { if (h[0] === 0) longueur += n; h.pop(); h.unshift(longueur); };
  const motifs = (h) => {
    const u = h[1];
    const coeur = u > 0 && h[2] === u && h[3] === u * 3 && h[4] === u && h[5] === u;
    return (coeur && h[0] >= u * 4 && h[6] >= u ? 1 : 0) + (coeur && h[6] >= u * 4 && h[0] >= u ? 1 : 0);
  };
  const terminer = (couleur, longueur, h) => {
    if (couleur) { ajouterHistorique(longueur, h); longueur = 0; }
    ajouterHistorique(longueur + n, h);
    return motifs(h);
  };
  for (const ligneOuColonne of [(i, j) => m[i][j], (i, j) => m[j][i]]) {
    for (let i = 0; i < n; i++) {
      let couleur = false, longueur = 0;
      const h = [0, 0, 0, 0, 0, 0, 0];
      for (let j = 0; j < n; j++) {
        if (ligneOuColonne(i, j) === couleur) {
          longueur++;
          if (longueur === 5) total += 3; else if (longueur > 5) total++;
        } else {
          ajouterHistorique(longueur, h);
          if (!couleur) total += motifs(h) * 40;
          couleur = ligneOuColonne(i, j);
          longueur = 1;
        }
      }
      total += terminer(couleur, longueur, h) * 40;
    }
  }
  for (let l = 0; l < n - 1; l++) {
    for (let c = 0; c < n - 1; c++) {
      const x = m[l][c];
      if (x === m[l][c + 1] && x === m[l + 1][c] && x === m[l + 1][c + 1]) total += 3;
    }
  }
  let noirs = 0;
  for (const ligne of m) for (const x of ligne) if (x) noirs++;
  total += (Math.ceil(Math.abs(noirs * 20 - n * n * 10) / (n * n)) - 1) * 10;
  return total;
}

/**
 * Code un texte. Renvoie { version, masque, taille, modules } où modules[l][c] vaut true pour un
 * module noir. `masque` (0 à 7) force un masque ; sinon le moins pénalisé est retenu.
 */
export function qr(texte, { masque } = {}) {
  const octets = [...new TextEncoder().encode(String(texte))];
  const v = versionPour(octets.length);
  const base = matrice(v, entrelacer(octetsDeDonnees(octets, v), v));
  let choisi = masque;
  if (choisi == null) {
    let meilleure = Infinity;
    for (let k = 0; k < 8; k++) {
      appliquerMasque(base, k); poserFormat(base, k);
      const p = penalite(base);
      if (p < meilleure) { meilleure = p; choisi = k; }
      appliquerMasque(base, k); // le masque est une inversion : l'appliquer deux fois l'annule
    }
  }
  appliquerMasque(base, choisi); poserFormat(base, choisi);
  return { version: v, masque: choisi, taille: base.n, modules: base.m };
}

/**
 * Le QR code en SVG : modules noirs sur fond blanc quel que soit le thème (les lecteurs lisent mal
 * un code inversé), avec la marge blanche de quatre modules que la norme demande.
 */
export function qrSvg(texte, { marge = 4, titre = '' } = {}) {
  const { taille, modules } = qr(texte);
  const cote = taille + 2 * marge;
  let d = '';
  modules.forEach((ligne, l) => {
    for (let c = 0; c < taille; c++) {
      if (!ligne[c]) continue;
      let fin = c;
      while (fin + 1 < taille && ligne[fin + 1]) fin++;
      d += `M${c + marge} ${l + marge}h${fin - c + 1}v1h-${fin - c + 1}z`;
      c = fin;
    }
  });
  const echapper = (s) => String(s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));
  return `<svg class="qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cote} ${cote}" shape-rendering="crispEdges" role="img" aria-label="${echapper(titre || `QR code : ${texte}`)}">`
    + `<rect width="${cote}" height="${cote}" fill="#fff"/><path fill="#111" d="${d}"/></svg>`;
}
