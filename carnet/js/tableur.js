// Lecture d'un tableur sans bibliothèque : .xlsx (Excel, Numbers, Google Sheets), .ods
// (LibreOffice), .csv et .tsv, et le copier-coller de cellules. Ce qu'il en sort est toujours la
// même chose : des feuilles, chacune un tableau de lignes, chaque ligne un tableau de textes.
//
// Un .xlsx ou un .ods est un dossier zippé de fichiers XML : on lit le zip (DecompressionStream,
// présent dans les navigateurs et dans Node), puis le XML avec un petit lecteur maison, le même
// partout (DOMParser n'existe pas sous Node). Les dates deviennent « AAAA-MM-JJ », les cellules
// fusionnées sur plusieurs lignes répètent leur valeur dans chaque ligne (une colonne « Chapitre »
// fusionnée reste lisible ligne par ligne). Aucune formule n'est calculée : on lit la dernière
// valeur enregistrée par le tableur.

const MAX_LIGNES = 2000, MAX_COLONNES = 40, MAX_OCTETS = 40 * 1024 * 1024;

export class ErreurTableur extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

// ---------- Zip ----------

const u16 = (o, i) => o[i] | (o[i + 1] << 8);
const u32 = (o, i) => (o[i] | (o[i + 1] << 8) | (o[i + 2] << 16) | (o[i + 3] << 24)) >>> 0;

/** Les entrées d'un zip : nom → { methode, taille, debut, compresse }. */
export function entreesZip(octets) {
  let fin = -1;
  for (let i = octets.length - 22; i >= Math.max(0, octets.length - 22 - 65535); i--) {
    if (u32(octets, i) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new ErreurTableur('Ce fichier zip est incomplet ou abîmé.', 'zip');
  const n = u16(octets, fin + 10);
  let p = u32(octets, fin + 16);
  const entrees = new Map(), noms = new TextDecoder();
  for (let k = 0; k < n && p + 46 <= octets.length; k++) {
    if (u32(octets, p) !== 0x02014b50) break;
    const methode = u16(octets, p + 10), compresse = u32(octets, p + 20), taille = u32(octets, p + 24);
    const lNom = u16(octets, p + 28), lExtra = u16(octets, p + 30), lComm = u16(octets, p + 32);
    const local = u32(octets, p + 42);
    const nom = noms.decode(octets.subarray(p + 46, p + 46 + lNom));
    if (u32(octets, local) === 0x04034b50) {
      const debut = local + 30 + u16(octets, local + 26) + u16(octets, local + 28);
      entrees.set(nom, { methode, taille, compresse, debut });
    }
    p += 46 + lNom + lExtra + lComm;
  }
  return entrees;
}

/** Décompresse une entrée (stockée ou « deflate »), sans dépasser une taille raisonnable. */
export async function extraire(octets, entree) {
  const brut = octets.subarray(entree.debut, entree.debut + entree.compresse);
  if (entree.methode === 0) return brut;
  if (entree.methode !== 8) throw new ErreurTableur('Ce fichier utilise une compression inconnue.', 'zip');
  if (entree.taille > MAX_OCTETS) throw new ErreurTableur('Ce fichier est trop gros pour un tableur de progression.', 'taille');
  const flux = new Blob([brut]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const lecteur = flux.getReader(), morceaux = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.length;
    if (total > MAX_OCTETS) { lecteur.cancel(); throw new ErreurTableur('Ce fichier est trop gros pour un tableur de progression.', 'taille'); }
    morceaux.push(value);
  }
  const res = new Uint8Array(total);
  let k = 0;
  for (const m of morceaux) { res.set(m, k); k += m.length; }
  return res;
}

async function texteZip(octets, entrees, nom) {
  const e = entrees.get(nom);
  return e ? new TextDecoder().decode(await extraire(octets, e)) : null;
}

// ---------- XML ----------

const ENTITES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
export const decoderXml = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (t, e) => {
  if (e[0] === '#') {
    const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : t;
  }
  return ENTITES[e.toLowerCase()] ?? t;
});

/**
 * Découpe un XML en jetons : ['o', nom, attributs, autoFermant], ['f', nom], ['t', texte].
 * Les espaces de noms restent dans les noms (« table:table-cell »), on les compare tels quels.
 */
export function* jetonsXml(xml) {
  const n = xml.length;
  let i = 0;
  while (i < n) {
    const lt = xml.indexOf('<', i);
    if (lt < 0) { yield ['t', decoderXml(xml.slice(i))]; return; }
    if (lt > i) yield ['t', decoderXml(xml.slice(i, lt))];
    if (xml.startsWith('<!--', lt)) { const f = xml.indexOf('-->', lt + 4); i = f < 0 ? n : f + 3; continue; }
    if (xml.startsWith('<![CDATA[', lt)) {
      const f = xml.indexOf(']]>', lt + 9);
      yield ['t', xml.slice(lt + 9, f < 0 ? n : f)];
      i = f < 0 ? n : f + 3;
      continue;
    }
    if (xml[lt + 1] === '?' || xml[lt + 1] === '!') { const f = xml.indexOf('>', lt); i = f < 0 ? n : f + 1; continue; }
    // Fin de la balise, en sautant les « > » écrits entre guillemets dans les attributs.
    let j = lt + 1, guillemet = '';
    for (; j < n; j++) {
      const c = xml[j];
      if (guillemet) { if (c === guillemet) guillemet = ''; } else if (c === '"' || c === "'") guillemet = c; else if (c === '>') break;
    }
    const brut = xml.slice(lt + 1, j);
    i = j + 1;
    if (brut[0] === '/') { yield ['f', brut.slice(1).trim()]; continue; }
    const auto = brut.endsWith('/');
    const corps = auto ? brut.slice(0, -1) : brut;
    const m = corps.match(/^\s*([^\s/>]+)/);
    if (!m) continue;
    const attrs = {};
    const re = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = re.exec(corps.slice(m[0].length)))) attrs[a[1]] = decoderXml(a[3] ?? a[4] ?? '');
    yield ['o', m[1], attrs, auto];
  }
}

// ---------- Cellules ----------

/** « B12 » → { l: 11, c: 1 } (à partir de 0). */
export function adresse(ref) {
  const m = String(ref || '').match(/^\$?([A-Z]{1,3})\$?(\d+)$/i);
  if (!m) return null;
  let c = 0;
  for (const ch of m[1].toUpperCase()) c = c * 26 + (ch.charCodeAt(0) - 64);
  return { l: Number(m[2]) - 1, c: c - 1 };
}

/** Numéro de série Excel → « AAAA-MM-JJ » (calendrier de 1900, celui de tous les Excel récents). */
export function dateExcel(serie) {
  const n = Number(serie);
  if (!Number.isFinite(n) || n < 1 || n > 2958465) return null;
  const ms = Math.round((Math.floor(n) - 25569) * 864e5);
  return new Date(ms).toISOString().slice(0, 10);
}

const FORMATS_DATE = new Set([14, 15, 16, 17, 22, 27, 28, 29, 30, 31, 34, 35, 36, 50, 51, 52, 53, 54, 57, 58]);
const FORMATS_HEURE = new Set([18, 19, 20, 21, 45, 46, 47]);
const sansLitteraux = (code) => String(code || '').replace(/"[^"]*"|\[(?![hms]\])[^\]]*\]|\\./gi, '').toLowerCase();
/** Un code de format de nombre parle-t-il d'une date (et pas seulement d'une heure) ? */
export function formatEstDate(code) {
  const sans = sansLitteraux(code);
  return /[dy]/.test(sans) || /(^|[^h:])m{3,}/.test(sans);
}
/** … ou d'une heure, d'une durée (« h:mm », « [h]:mm ») ? */
export function formatEstHeure(code) {
  const sans = sansLitteraux(code);
  return !formatEstDate(code) && /h|s/.test(sans.replace(/\[|\]/g, ''));
}

/** Une fraction de jour (0,0625) → « 1h30 » : une durée tapée « 1:30 » dans le tableur. */
export function heureDepuisFraction(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  const minutes = Math.round(n * 24 * 60);
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function nombreLisible(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  // 1.4999999999 → 1.5 : on garde ce que la personne a tapé, pas l'arrondi binaire.
  return String(Math.round(n * 1e9) / 1e9);
}

/** Range une grille clairsemée (Map ligne → Map colonne → texte) en tableau de lignes. */
function versLignes(grille, fusions = []) {
  // Une cellule fusionnée sur plusieurs lignes : sa valeur vaut pour chaque ligne de la fusion.
  for (const f of fusions) {
    if (f.l1 <= f.l0) continue;
    const v = grille.get(f.l0) && grille.get(f.l0).get(f.c0);
    if (v == null || v === '') continue;
    for (let l = f.l0 + 1; l <= Math.min(f.l1, MAX_LIGNES); l++) {
      if (!grille.has(l)) grille.set(l, new Map());
      const ligne = grille.get(l);
      if (!ligne.get(f.c0)) ligne.set(f.c0, v);
    }
  }
  const nl = Math.min(MAX_LIGNES, grille.size ? Math.max(...grille.keys()) + 1 : 0);
  const lignes = [];
  for (let l = 0; l < nl; l++) {
    const ligne = grille.get(l);
    if (!ligne || !ligne.size) { lignes.push([]); continue; }
    const nc = Math.min(MAX_COLONNES, Math.max(...ligne.keys()) + 1);
    const t = [];
    for (let c = 0; c < nc; c++) t.push(ligne.has(c) ? String(ligne.get(c)) : '');
    lignes.push(t);
  }
  return nettoyer(lignes);
}

/** Retire les espaces de bord, les colonnes vides en bout de ligne et les lignes vides finales. */
export function nettoyer(lignes) {
  const res = lignes.slice(0, MAX_LIGNES).map((l) => {
    const t = l.slice(0, MAX_COLONNES).map((v) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[ \t ]+$/gm, '').trim());
    while (t.length && !t[t.length - 1]) t.pop();
    return t;
  });
  while (res.length && !res[res.length - 1].length) res.pop();
  return res;
}

// ---------- Excel (.xlsx) ----------

function lireChainesPartagees(xml) {
  const res = [];
  if (!xml) return res;
  let courante = null, dansT = false, phonetique = 0;
  for (const [type, nom, attrs, auto] of jetonsXml(xml)) {
    if (type === 'o') {
      if (nom === 'si') { courante = ''; if (auto) { res.push(''); courante = null; } } else if (nom === 'rPh') phonetique++; else if (nom === 't' && !auto) dansT = true;
    } else if (type === 'f') {
      if (nom === 'si') { res.push(courante ?? ''); courante = null; } else if (nom === 'rPh') phonetique--; else if (nom === 't') dansT = false;
    } else if (type === 't' && dansT && courante != null && !phonetique) courante += nom;
  }
  return res;
}

/** Pour chaque style de cellule : 'date', 'heure' ou '' (un nombre ordinaire). */
function lireStyles(xml) {
  const formats = new Map(), genres = [];
  if (!xml) return genres;
  let dansXfs = false;
  for (const [type, nom, attrs] of jetonsXml(xml)) {
    if (type === 'o' && nom === 'numFmt') formats.set(Number(attrs.numFmtId), attrs.formatCode || '');
    else if (type === 'o' && nom === 'cellXfs') dansXfs = true;
    else if (type === 'f' && nom === 'cellXfs') dansXfs = false;
    else if (type === 'o' && nom === 'xf' && dansXfs) {
      const id = Number(attrs.numFmtId || 0), code = formats.get(id);
      genres.push(FORMATS_DATE.has(id) || (code != null && formatEstDate(code)) ? 'date'
        : FORMATS_HEURE.has(id) || (code != null && formatEstHeure(code)) ? 'heure' : '');
    }
  }
  return genres;
}

function lireFeuilleXlsx(xml, chaines, genres) {
  const grille = new Map(), fusions = [];
  let ligneCourante = -1, cellule = null, champ = '', dansIs = false;
  const poser = () => {
    if (!cellule || cellule.l >= MAX_LIGNES || cellule.c >= MAX_COLONNES) return;
    let v = '';
    const { t, s } = cellule;
    if (t === 's') v = chaines[Number(cellule.v)] ?? '';
    else if (t === 'inlineStr') v = cellule.is;
    else if (t === 'b') v = cellule.v === '1' ? 'VRAI' : cellule.v === '0' ? 'FAUX' : '';
    else if (t === 'str' || t === 'e') v = cellule.v;
    else if (cellule.v !== '') {
      v = genres[s] === 'date' ? (dateExcel(cellule.v) || nombreLisible(cellule.v))
        : genres[s] === 'heure' ? (heureDepuisFraction(cellule.v) || nombreLisible(cellule.v)) : nombreLisible(cellule.v);
    }
    if (v === '') return;
    if (!grille.has(cellule.l)) grille.set(cellule.l, new Map());
    grille.get(cellule.l).set(cellule.c, v);
  };
  let colSuivante = 0;
  for (const [type, nom, attrs, auto] of jetonsXml(xml)) {
    if (type === 'o') {
      if (nom === 'row') {
        ligneCourante = attrs.r ? Number(attrs.r) - 1 : ligneCourante + 1;
        colSuivante = 0;
      } else if (nom === 'c') {
        const a = adresse(attrs.r) || { l: Math.max(0, ligneCourante), c: colSuivante };
        cellule = { l: a.l, c: a.c, t: attrs.t || 'n', s: Number(attrs.s || 0), v: '', is: '' };
        colSuivante = a.c + 1;
        if (auto) { poser(); cellule = null; }
      } else if (nom === 'v' || (nom === 't' && dansIs)) { champ = nom; } else if (nom === 'is') dansIs = true;
      else if (nom === 'mergeCell' && attrs.ref) {
        const [a, b] = attrs.ref.split(':').map(adresse);
        if (a && b) fusions.push({ l0: a.l, c0: a.c, l1: b.l, c1: b.c });
      }
    } else if (type === 'f') {
      if (nom === 'c') { poser(); cellule = null; } else if (nom === 'is') dansIs = false;
      if (nom === champ) champ = '';
    } else if (type === 't' && cellule) {
      if (champ === 'v') cellule.v += nom;
      else if (champ === 't' && dansIs) cellule.is += nom;
    }
  }
  return versLignes(grille, fusions);
}

function cheminRelatif(base, cible) {
  if (cible.startsWith('/')) return cible.slice(1);
  const parts = base.split('/'); parts.pop();
  for (const p of cible.split('/')) { if (p === '..') parts.pop(); else if (p && p !== '.') parts.push(p); }
  return parts.join('/');
}

async function lireXlsx(octets, entrees) {
  const classeur = await texteZip(octets, entrees, 'xl/workbook.xml');
  if (!classeur) throw new ErreurTableur('Ce fichier zip n’est pas un classeur Excel.', 'format');
  const liens = await texteZip(octets, entrees, 'xl/_rels/workbook.xml.rels') || '';
  const cibles = {};
  for (const [type, nom, attrs] of jetonsXml(liens)) if (type === 'o' && nom === 'Relationship') cibles[attrs.Id] = attrs.Target;
  const declarees = [];
  for (const [type, nom, attrs] of jetonsXml(classeur)) {
    if (type !== 'o' || nom !== 'sheet') continue;
    const rid = Object.entries(attrs).find(([k]) => /(^|:)id$/i.test(k) && k !== 'sheetId');
    const cible = rid && cibles[rid[1]];
    declarees.push({ nom: attrs.name || `Feuille ${declarees.length + 1}`, chemin: cible ? cheminRelatif('xl/workbook.xml', cible) : `xl/worksheets/sheet${declarees.length + 1}.xml`, masquee: attrs.state === 'hidden' || attrs.state === 'veryHidden' });
  }
  const chaines = lireChainesPartagees(await texteZip(octets, entrees, 'xl/sharedStrings.xml'));
  const genres = lireStyles(await texteZip(octets, entrees, 'xl/styles.xml'));
  const feuilles = [];
  for (const d of declarees) {
    if (d.masquee) continue;
    const xml = await texteZip(octets, entrees, d.chemin);
    if (xml) feuilles.push({ nom: d.nom, lignes: lireFeuilleXlsx(xml, chaines, genres) });
  }
  return feuilles;
}

// ---------- LibreOffice (.ods) ----------

function lireOds(xml) {
  const feuilles = [];
  let feuille = null, grille = null, l = -1, c = 0, repeteLignes = 1, ligneTampon = null;
  let cellule = null, profondeurP = 0, annotation = 0, verticales = new Map(); // colonne → { v, reste }
  // Une feuille masquée a un style de tableau « table:display=false » (déclaré avant les feuilles).
  const stylesMasques = new Set();
  let styleTableau = null;
  const finirCellule = () => {
    if (!cellule) return;
    const { valeur, colonnes, lignes } = cellule;
    for (let k = 0; k < Math.min(colonnes, MAX_COLONNES); k++) {
      if (valeur !== '' && c + k < MAX_COLONNES) ligneTampon.set(c + k, valeur);
    }
    if (lignes > 1 && valeur !== '') verticales.set(c, { v: valeur, reste: lignes - 1 });
    c += colonnes;
    cellule = null;
  };
  const finirLigne = () => {
    if (!ligneTampon) return;
    const fois = ligneTampon.size ? Math.min(repeteLignes, MAX_LIGNES) : Math.min(repeteLignes, 50);
    for (let k = 0; k < fois && l + 1 < MAX_LIGNES; k++) {
      l++;
      const ligne = new Map(ligneTampon);
      grille.set(l, ligne);
    }
    if (fois < repeteLignes) l += repeteLignes - fois;
    ligneTampon = null;
  };
  for (const [type, nom, attrs, auto] of jetonsXml(xml)) {
    if (type === 'o') {
      if (nom === 'style:style') styleTableau = attrs['style:family'] === 'table' ? attrs['style:name'] : null;
      else if (nom === 'style:table-properties' && styleTableau && attrs['table:display'] === 'false') stylesMasques.add(styleTableau);
      else if (nom === 'table:table') {
        feuille = { nom: attrs['table:name'] || `Feuille ${feuilles.length + 1}`, masquee: stylesMasques.has(attrs['table:style-name']) };
        grille = new Map(); l = -1; verticales = new Map();
      }
      else if (nom === 'table:table-row' && grille) {
        ligneTampon = new Map(); c = 0;
        repeteLignes = Math.max(1, Number(attrs['table:number-rows-repeated'] || 1));
        // Ce qui descend d'une cellule fusionnée au-dessus.
        for (const [col, x] of verticales) { ligneTampon.set(col, x.v); if (--x.reste <= 0) verticales.delete(col); }
        if (auto) finirLigne();
      } else if ((nom === 'table:table-cell' || nom === 'table:covered-table-cell') && ligneTampon) {
        const colonnes = Math.max(1, Number(attrs['table:number-columns-repeated'] || 1));
        let valeur = '';
        const tv = attrs['office:value-type'];
        if (nom === 'table:table-cell') {
          if (tv === 'date' && attrs['office:date-value']) valeur = attrs['office:date-value'].slice(0, 10);
          else if ((tv === 'float' || tv === 'percentage' || tv === 'currency') && attrs['office:value'] != null) valeur = nombreLisible(attrs['office:value']);
          else if (tv === 'boolean') valeur = attrs['office:boolean-value'] === 'true' ? 'VRAI' : 'FAUX';
          else if (tv === 'time' && attrs['office:time-value']) {
            const m = attrs['office:time-value'].match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            if (m) valeur = `${Number(m[1] || 0)}h${String(Number(m[2] || 0)).padStart(2, '0')}`;
          }
        }
        if (nom === 'table:covered-table-cell') {
          // Couverte par une fusion : la valeur descendue d'au-dessus est déjà posée, on avance seulement.
          c += colonnes;
          continue;
        }
        cellule = { valeur, texte: [], colonnes, lignes: Math.max(1, Number(attrs['table:number-rows-spanned'] || 1)), aValeur: !!valeur };
        if (auto) finirCellule();
      } else if (nom === 'office:annotation') annotation++;
      else if (nom === 'text:p' && cellule && !annotation) { profondeurP++; cellule.texte.push(''); }
      else if (cellule && profondeurP) {
        if (nom === 'text:s') cellule.texte[cellule.texte.length - 1] += ' '.repeat(Math.max(1, Number(attrs['text:c'] || 1)));
        else if (nom === 'text:tab') cellule.texte[cellule.texte.length - 1] += '\t';
        else if (nom === 'text:line-break') cellule.texte[cellule.texte.length - 1] += '\n';
      }
    } else if (type === 'f') {
      if (nom === 'office:annotation') annotation = Math.max(0, annotation - 1);
      else if (nom === 'text:p' && cellule && !annotation) profondeurP = Math.max(0, profondeurP - 1);
      else if (nom === 'table:table-cell' && cellule) {
        if (!cellule.aValeur) cellule.valeur = cellule.texte.join('\n');
        finirCellule();
      } else if (nom === 'table:table-row') finirLigne();
      else if (nom === 'table:table' && feuille) {
        if (!feuille.masquee) feuilles.push({ nom: feuille.nom, lignes: versLignes(grille) });
        feuille = null; grille = null;
      }
    } else if (type === 't' && cellule && profondeurP && !annotation) cellule.texte[cellule.texte.length - 1] += nom;
  }
  return feuilles;
}

// ---------- Texte (.csv, .tsv, copier-coller) ----------

/** Décode un fichier texte : UTF-8 s'il est valide, sinon Windows-1252 (les CSV d'Excel en français). */
export function decoderTexte(octets) {
  let t;
  try { t = new TextDecoder('utf-8', { fatal: true }).decode(octets); } catch { t = new TextDecoder('windows-1252').decode(octets); }
  return t.replace(/^﻿/, '');
}

function separateurProbable(texte) {
  const debut = texte.split(/\r\n?|\n/).filter((l) => l.trim()).slice(0, 12);
  if (!debut.length) return ',';
  let meilleur = ',', note = -1;
  for (const s of ['\t', ';', ',', '|']) {
    const comptes = debut.map((l) => l.replace(/"[^"]*"/g, '').split(s).length - 1);
    const avec = comptes.filter((n) => n > 0).length;
    if (!avec) continue;
    // Le bon séparateur revient sur presque toutes les lignes, à peu près autant de fois.
    const moyen = comptes.reduce((a, b) => a + b, 0) / comptes.length;
    const regulier = comptes.filter((n) => Math.abs(n - moyen) <= 1).length;
    const n = avec * 10 + regulier + (s === '\t' ? 5 : s === ';' ? 2 : 0);
    if (n > note) { note = n; meilleur = s; }
  }
  return meilleur;
}

/** Lit un texte séparé (CSV, TSV, cellules collées) : guillemets, guillemets doublés, retours à la ligne cités. */
export function lireTexteTabule(texte, separateur) {
  const t = String(texte || '').replace(/^﻿/, '');
  const sep = separateur || separateurProbable(t);
  const lignes = [];
  let ligne = [], champ = '', cite = false, debutChamp = true;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (cite) {
      if (ch === '"') { if (t[i + 1] === '"') { champ += '"'; i++; } else cite = false; } else champ += ch;
      continue;
    }
    if (ch === '"' && debutChamp) { cite = true; debutChamp = false; continue; }
    if (ch === sep) { ligne.push(champ); champ = ''; debutChamp = true; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      ligne.push(champ); lignes.push(ligne); ligne = []; champ = ''; debutChamp = true;
      if (lignes.length >= MAX_LIGNES) break;
      continue;
    }
    champ += ch; debutChamp = false;
  }
  if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return nettoyer(lignes);
}

// ---------- Point d'entrée ----------

/**
 * Lit un fichier de tableur. octets : Uint8Array (ou ArrayBuffer) ; nom : pour l'extension.
 * Renvoie { format, feuilles: [{ nom, lignes }] }, les feuilles vides en moins.
 */
export async function lireTableur(octets, nom = '') {
  const o = octets instanceof Uint8Array ? octets : new Uint8Array(octets);
  if (!o.length) throw new ErreurTableur('Ce fichier est vide.', 'vide');
  if (o.length > MAX_OCTETS) throw new ErreurTableur('Ce fichier est trop gros pour un tableur de progression.', 'taille');
  let format, feuilles;
  if (u32(o, 0) === 0x04034b50) {
    const entrees = entreesZip(o);
    if (entrees.has('xl/workbook.xml')) { format = 'xlsx'; feuilles = await lireXlsx(o, entrees); }
    else if (entrees.has('content.xml')) { format = 'ods'; feuilles = lireOds(await texteZip(o, entrees, 'content.xml')); }
    else if (entrees.has('word/document.xml')) throw new ErreurTableur('C’est un document Word : dans Word, copiez le tableau et collez-le dans la case de texte.', 'word');
    else throw new ErreurTableur('Ce fichier zip ne contient pas de tableur.', 'format');
  } else if (u32(o, 0) === 0xe011cfd0) {
    throw new ErreurTableur('C’est un ancien fichier Excel (.xls) : enregistrez-le en .xlsx (Fichier → Enregistrer sous), ou copiez les cellules et collez-les ici.', 'xls');
  } else if (o[0] === 0x25 && o[1] === 0x50 && o[2] === 0x44 && o[3] === 0x46) {
    throw new ErreurTableur('C’est un PDF : ouvrez l’original dans le tableur, ou copiez le tableau et collez-le ici.', 'pdf');
  } else {
    format = /\.tsv$/i.test(nom) ? 'tsv' : 'csv';
    feuilles = [{ nom: nom.replace(/\.[^.]+$/, '') || 'Feuille 1', lignes: lireTexteTabule(decoderTexte(o), format === 'tsv' ? '\t' : undefined) }];
  }
  feuilles = feuilles.filter((f) => f.lignes.some((l) => l.length));
  if (!feuilles.length) throw new ErreurTableur('Ce tableur ne contient aucune cellule remplie.', 'vide');
  return { format, feuilles };
}

// ---------- Écriture d'un .xlsx ----------
// Le strict nécessaire pour qu'Excel, LibreOffice, Numbers et Google Sheets l'ouvrent : textes en
// ligne (pas de table de chaînes), nombres en nombres, première ligne en gras et figée, retours à
// la ligne visibles. Le zip est compressé quand le navigateur sait le faire, stocké sinon.

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(octets) {
  let c = 0xffffffff;
  for (let i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function comprimer(octets) {
  if (typeof CompressionStream !== 'function') return null;
  try {
    const flux = new Blob([octets]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  } catch { return null; }
}

/** Un zip : fichiers = [[nom, texte]]. */
export async function ecrireZip(fichiers) {
  const enc = new TextEncoder(), parties = [], central = [];
  let decalage = 0;
  const entier = (taille, v) => { const b = new Uint8Array(taille); for (let i = 0; i < taille; i++) b[i] = (v >>> (8 * i)) & 0xff; return b; };
  const assembler = (morceaux) => { const n = morceaux.reduce((s, m) => s + m.length, 0), r = new Uint8Array(n); let k = 0; for (const m of morceaux) { r.set(m, k); k += m.length; } return r; };
  for (const [nom, texte] of fichiers) {
    const brut = enc.encode(texte), n = enc.encode(nom), crc = crc32(brut);
    const comprime = await comprimer(brut);
    const [methode, donnees] = comprime && comprime.length < brut.length ? [8, comprime] : [0, brut];
    // Version 2.0, drapeau 0x0800 : noms en UTF-8 ; date fixe (1er janvier 2026, minuit).
    const commun = [entier(2, 20), entier(2, 0x0800), entier(2, methode), entier(2, 0), entier(2, (46 << 9) | (1 << 5) | 1), entier(4, crc), entier(4, donnees.length), entier(4, brut.length), entier(2, n.length), entier(2, 0)];
    const local = assembler([entier(4, 0x04034b50), ...commun, n]);
    central.push(assembler([entier(4, 0x02014b50), entier(2, 20), ...commun, entier(2, 0), entier(2, 0), entier(2, 0), entier(4, 0), entier(4, decalage), n]));
    parties.push(local, donnees);
    decalage += local.length + donnees.length;
  }
  const rep = assembler(central);
  const fin = assembler([entier(4, 0x06054b50), entier(2, 0), entier(2, 0), entier(2, fichiers.length), entier(2, fichiers.length), entier(4, rep.length), entier(4, decalage), entier(2, 0)]);
  return assembler([...parties, rep, fin]);
}

const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  // Les caractères de contrôle sont interdits en XML (sauf tabulation et retours à la ligne).
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const colonne = (i) => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const ENTETE_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_P = 'http://schemas.openxmlformats.org/package/2006/relationships';

/** Un nom de feuille accepté par Excel : 31 caractères au plus, sans []:*?/\ et sans doublon. */
function nomsDeFeuilles(feuilles) {
  const vus = new Set();
  return feuilles.map((f, k) => {
    const base = String(f.nom || `Feuille ${k + 1}`).replace(/[[\]:*?/\\]/g, ' ').replace(/^'+|'+$/g, '').replace(/\s+/g, ' ').trim().slice(0, 31) || `Feuille ${k + 1}`;
    let nom = base;
    for (let n = 2; vus.has(nom.toLowerCase()); n++) nom = `${base.slice(0, 27)} (${n})`;
    vus.add(nom.toLowerCase());
    return nom;
  });
}

/**
 * feuilles : [{ nom, lignes: [[valeur…]…], largeurs?: [nombre…] }] — la première ligne est l'en-tête.
 * Un nombre reste un nombre ; tout le reste est écrit en texte. Renvoie les octets du .xlsx.
 */
export async function ecrireXlsx(feuilles) {
  const noms = nomsDeFeuilles(feuilles);
  const fichiers = [];
  const types = feuilles.map((_, k) => `<Override PartName="/xl/worksheets/sheet${k + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  fichiers.push(['[Content_Types].xml', `${ENTETE_XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${types}</Types>`]);
  fichiers.push(['_rels/.rels', `${ENTETE_XML}<Relationships xmlns="${NS_P}"><Relationship Id="rId1" Type="${NS_R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`]);
  fichiers.push(['xl/workbook.xml', `${ENTETE_XML}<workbook xmlns="${NS}" xmlns:r="${NS_R}"><sheets>${noms.map((n, k) => `<sheet name="${xmlEsc(n)}" sheetId="${k + 1}" r:id="rId${k + 1}"/>`).join('')}</sheets></workbook>`]);
  fichiers.push(['xl/_rels/workbook.xml.rels', `${ENTETE_XML}<Relationships xmlns="${NS_P}">${feuilles.map((_, k) => `<Relationship Id="rId${k + 1}" Type="${NS_R}/worksheet" Target="worksheets/sheet${k + 1}.xml"/>`).join('')}<Relationship Id="rId${feuilles.length + 1}" Type="${NS_R}/styles" Target="styles.xml"/></Relationships>`]);
  // Styles : 0 ordinaire, 1 en-tête (gras, fond pâle, retour à la ligne), 2 corps (retour à la ligne, en haut).
  fichiers.push(['xl/styles.xml', `${ENTETE_XML}<styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F0E6"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`]);
  feuilles.forEach((f, k) => {
    const lignes = f.lignes || [];
    const nbCol = Math.max(1, ...lignes.map((l) => l.length));
    const largeurs = Array.from({ length: nbCol }, (_, i) => {
      if (f.largeurs && f.largeurs[i]) return f.largeurs[i];
      const plus = Math.max(8, ...lignes.slice(0, 200).map((l) => Math.max(...String(l[i] ?? '').split('\n').map((x) => x.length))));
      return Math.min(60, plus + 2);
    });
    const cols = largeurs.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
    const corps = lignes.map((l, r) => {
      const cellules = l.map((v, c) => {
        if (v == null || v === '') return '';
        const ref = `${colonne(c)}${r + 1}`, s = r === 0 ? 1 : 2;
        if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
        return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
      }).join('');
      return `<row r="${r + 1}">${cellules}</row>`;
    }).join('');
    const fige = lignes.length > 1 ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
    fichiers.push([`xl/worksheets/sheet${k + 1}.xml`, `${ENTETE_XML}<worksheet xmlns="${NS}">${fige}<cols>${cols}</cols><sheetData>${corps}</sheetData></worksheet>`]);
  });
  return ecrireZip(fichiers);
}
