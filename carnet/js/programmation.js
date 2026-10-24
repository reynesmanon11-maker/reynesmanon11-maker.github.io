// Une programmation venue d'un tableur (la sienne, celle d'un ou d'une collègue, celle de l'an
// dernier) devient une file d'étapes. On devine la ligne d'en-tête et le rôle de chaque colonne
// — intitulé, chapitre, durée, évaluation… —, la personne corrige au besoin, et chaque ligne
// devient une étape. Fonctions pures : elles tournent sous Node pour les tests.
//
// Ce qui n'est pas compris n'est jamais inventé : une durée illisible vaut une séance et le dit,
// une ligne sans intitulé est écartée et le dit.
import { lundiDe, ajouteJours } from './dates.js';
import { niveauDe, sansAccents } from './pronote.js';

export const ROLES = {
  titre: 'Intitulé de l’étape',
  chapitre: 'Chapitre, séquence',
  duree: 'Durée',
  type: 'Type (TP, évaluation…)',
  eval: 'Évaluation (oui, x…)',
  format: 'Classe entière ou demi-groupe',
  jalons: 'Jalons (déroulé de l’étape)',
  materiel: 'Matériel à prévoir',
  photocopies: 'Photocopies (pages par élève)',
  pronote: 'Texte du cahier de textes',
  complement: 'Ajouter au cahier de textes',
  devoirs: 'Travail à faire',
  semaine: 'Semaine visée',
  niveau: 'Niveau',
  ignorer: 'Ne pas importer',
};

export const norm = (s) => sansAccents(s).toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9½¼¾/]+/g, ' ').trim();

// L'ordre compte : « Nombre de séances » est une durée avant d'être un intitulé, « Travail à
// faire » des devoirs avant d'être du matériel.
const MOTIFS = [
  ['devoirs', /\b(travail a faire|devoirs?|a faire pour|pour la prochaine fois|travail maison|travail personnel)\b/],
  ['pronote', /\b(cahier de textes?|cdt|texte pronote|pronote|resume de (la )?seance|resume)\b/],
  ['photocopies', /\b(photocop\w*|copies|nombre de pages|pages)\b/],
  ['materiel', /\b(materiels?|a prevoir|fournitures?|ressources|necessaire|supports?|salle)\b/],
  ['jalons', /\b(jalons?|deroule\w*|etapes de (la )?seance|phases?|plan de (la )?seance)\b/],
  ['duree', /\b(duree|durees|nb (de )?seances|nombre (de )?seances|seances prevues|nb (d )?heures|nombre (d )?heures|heures|horaire|volume|temps)\b|^(h|nb|nb s)$/],
  ['semaine', /\b(semaines?|sem|periodes?|dates?|quand|calendrier|mois)\b|^s$/],
  ['chapitre', /\b(chapitres?|sequences?|themes?|parties?|modules?|unites?|thematiques?|sous themes?|ch|chap)\b/],
  ['eval', /\b(evaluations?|evals?|controles?|ds|evalue|note)\b/],
  ['type', /\b(types?|nature|modalites?|formes?|organisation|categorie)\b/],
  ['format', /\b(format|groupes?|effectif|demi groupe|classe entiere)\b/],
  ['complement', /\b(competences?|attendus?|capacites?|savoirs?|objectifs?|notions?|programme|reperes?)\b/],
  ['niveau', /\b(niveaux?|classes?)\b/],
  ['titre', /\b(seances?|activites?|titres?|intitules?|contenus?|lecons?|sujets?|descriptions?|cours|taches?|situations?|travail|etapes?|deroulement)\b/],
];

const estVide = (l) => !l || !l.some((v) => String(v || '').trim());
const valeurs = (lignes, i) => lignes.map((l) => String(l[i] || '').trim()).filter(Boolean);
const longueurMoyenne = (t) => (t.length ? t.reduce((s, x) => s + x.length, 0) / t.length : 0);

/** Le rôle qu'un intitulé de colonne suggère, ou null. */
export function roleDeTitre(texte) {
  const t = norm(texte);
  if (!t || t.length > 60) return null;
  for (const [role, re] of MOTIFS) if (re.test(t)) return role;
  return null;
}

// ---------- Durées ----------

const FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
const auQuart = (x) => Math.round(x * 4) / 4;

/**
 * Une durée écrite dans un tableur → un nombre de séances (au quart près), ou null.
 * « 1 », « 1,5 », « ½ », « 1 1/2 », « 2 séances », « 1h30 », « 55 min », « 1:30 », « 2 x 55 min ».
 * Une heure de cours compte pour une séance (« 1h30 » : une séance et demie, comme on le dit en
 * salle des profs) ; les minutes se rapportent à la durée réelle d'une séance (« 15 min » : ¼).
 */
const normDuree = (s) => sansAccents(s).toLowerCase().replace(/\(s\)/g, 's').replace(/(\d),(\d)/g, '$1.$2')
  .replace(/[^a-z0-9½¼¾/.:]+/g, ' ').replace(/\s+/g, ' ').trim();
export function lireDuree(texte, { dureeSeance = 55, seancesParSemaine = 0 } = {}) {
  let t = normDuree(texte);
  if (!t) return null;
  for (const [f, v] of Object.entries(FRACTIONS)) t = t.replace(new RegExp(`(\\d+)?\\s*${f}`), (_, ent) => String((Number(ent) || 0) + v));
  t = t.replace(/(\d+)\s+(\d)\/(\d)/, (_, e, a, b) => String(Number(e) + Number(a) / Number(b)))
    .replace(/^(\d)\/(\d)$|^(\d)\/(\d)(?=\s)/, (m, a, b, c, d) => String(Number(a ?? c) / Number(b ?? d)));
  const enSeances = (minutes) => auQuart(minutes / dureeSeance);
  let m;
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)\s*(?:min|mn|minutes?)?$/))) return borne(enSeances(Number(m[1]) * Number(m[2])));
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*h(?:eures?)?\s*(\d{1,2})?\s*(?:min|mn)?$/))) return borne(auQuart(Number(m[1]) + Number(m[2] || 0) / 60));
  if ((m = t.match(/^(\d+)\s*(?:min|mn|minutes?)$/))) return borne(enSeances(Number(m[1])));
  if ((m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/))) return borne(auQuart(Number(m[1]) + Number(m[2]) / 60));
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(?:semaines?|sem)$/))) return seancesParSemaine > 0 ? borne(auQuart(Number(m[1]) * seancesParSemaine)) : null;
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(?:seances?|s|cours|heures? de cours|h de cours)$/))) return borne(auQuart(Number(m[1])));
  // Un nombre seul : des séances, ou des heures de cours, ce qui revient au même.
  if ((m = t.match(/^(\d+(?:\.\d+)?)$/))) return borne(auQuart(Number(m[1])));
  return null;
}
const borne = (x) => (x > 0 ? Math.min(40, Math.max(0.25, x)) : null);

// ---------- Semaines ----------

const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const moisDe = (mot) => {
  const m = norm(mot).replace(/\.$/, '');
  if (m.length < 3) return -1;
  return MOIS.findIndex((x) => x.startsWith(m) || (m.startsWith(x.slice(0, 4)) && x.startsWith(m.slice(0, 3))));
};
const jj = (n) => String(n).padStart(2, '0');

/** Le lundi de la semaine ISO n d'une année. */
export function lundiSemaineIso(annee, n) {
  const j4 = new Date(Date.UTC(annee, 0, 4));
  const decal = (j4.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(annee, 0, 4 - decal) + (n - 1) * 7 * 864e5).toISOString().slice(0, 10);
}

/** L'année de la rentrée (septembre) d'une date : avant août, c'est l'année d'avant. */
export const anneeRentree = (jour) => { const [a, m] = String(jour).split('-').map(Number); return m >= 8 ? a : a - 1; };

/**
 * Une semaine écrite dans un tableur → le lundi de cette semaine (« AAAA-MM-JJ »), ou null.
 * « 2026-11-02 », « 02/11/2026 », « 2/11 », « S45 », « semaine 45 », « 45 », « du 2 au 6 nov. »,
 * « novembre ». rentree : l'année de septembre de l'année scolaire.
 */
export function lireSemaine(texte, { rentree }) {
  const brut = String(texte || '').trim();
  if (!brut) return null;
  const annee = (mois) => (mois >= 7 ? rentree : rentree + 1); // mois de 0 à 11 : août et après, l'année de la rentrée
  const date = (a, m, j) => {
    const d = new Date(Date.UTC(a, m, j));
    return d.getUTCMonth() === m && d.getUTCDate() === j ? lundiDe(d.toISOString().slice(0, 10)) : null;
  };
  let m;
  if ((m = brut.match(/^(\d{4})-(\d{2})-(\d{2})/))) return date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if ((m = brut.match(/^(?:\D*?)(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?(?!\d)/))) {
    const mo = Number(m[2]) - 1;
    let a = m[3] ? Number(m[3]) : annee(mo);
    if (a < 100) a += 2000;
    return date(a, mo, Number(m[1]));
  }
  const t = norm(brut);
  if ((m = t.match(/^(?:s|sem|semaine|semaines|week|w)?\s*(\d{1,2})$/))) {
    const n = Number(m[1]);
    if (n < 1 || n > 53) return null;
    return lundiSemaineIso(n >= 30 ? rentree : rentree + 1, n);
  }
  if ((m = t.match(/(?:^|\s)(\d{1,2})(?:er)?\s+(?:au\s+\d{1,2}\s+)?([a-z]{3,})(?:\s+(\d{4}))?/))) {
    const mo = moisDe(m[2]);
    if (mo >= 0) return date(m[3] ? Number(m[3]) : annee(mo), mo, Number(m[1]));
  }
  const mo = moisDe(t.split(' ')[0]);
  if (mo >= 0 && t.split(' ').length <= 2) {
    // Un mois seul : la première semaine qui commence dans ce mois.
    const a = annee(mo), premier = `${a}-${jj(mo + 1)}-01`;
    const l = lundiDe(premier);
    return l === premier ? l : ajouteJours(l, 7);
  }
  return null;
}

// ---------- Analyse du tableau ----------

const OUI = /^(x|oui|o|1|vrai|true|yes|y|✓|✔|☑|e)$/i;
const MOT_EVAL = /\b(evaluation|evaluations|eval|controle|ds|devoir surveille|interro\w*|test|bilan note|ece|qcm note)\b/;
const DEBUT_EVAL = /^(evaluation|eval|controle|ds|devoir surveille|interrogation|interro|test)\b/;
const MOT_CHAPITRE = /^(chapitre|chap|ch|sequence|theme|partie|module|unite|periode|bloc)\b/;
const DEMI = /\b(demi|1 2 groupe|½ groupe|groupe)\b|½/;
const ENTIERE = /\b(classe entiere|entiere|cl entiere|classe complete)\b/;

/** Le niveau qu'un texte nomme : « 6e », « 5ème », « seconde »… ou ''. */
export function niveauDansTexte(texte) {
  const t = norm(texte);
  let m;
  if ((m = t.match(/(?:^|\s)([3-6])\s*(?:e|eme|ieme|em|è|ème)(?:\s|$)/))) return `${m[1]}e`;
  const mots = { sixieme: '6e', cinquieme: '5e', quatrieme: '4e', troisieme: '3e' };
  for (const [mot, n] of Object.entries(mots)) if (new RegExp(`\\b${mot}s?\\b`).test(t)) return n;
  if (/\b(seconde|2nde|2de)\b/.test(t)) return '2nde';
  if (/\b(premiere|1re|1ere)\b/.test(t)) return '1re';
  if (/\b(terminale|tle|term)\b/.test(t)) return 'Tle';
  if ((m = t.match(/^([3-6])$/))) return `${m[1]}e`;
  return '';
}

/**
 * Devine la ligne d'en-tête (-1 s'il n'y en a pas) et le rôle de chaque colonne.
 * Renvoie { entete, colonnes: [{ i, libelle, role, exemples }] }.
 */
export function analyser(lignes, { entete: imposee } = {}) {
  const nb = Math.max(0, ...lignes.map((l) => l.length));
  let entete = -1;
  if (imposee !== undefined) entete = imposee;
  else {
    let meilleur = 0;
    for (let k = 0; k < Math.min(15, lignes.length); k++) {
      const l = lignes[k] || [];
      const remplies = l.filter((v) => String(v).trim());
      if (remplies.length < 2) continue;
      const roles = new Set(remplies.map(roleDeTitre).filter(Boolean));
      // Au moins deux rôles différents, et des cellules courtes : c'est un en-tête, pas un contenu.
      const note = roles.size * 2 - remplies.filter((v) => String(v).length > 60).length;
      if (roles.size >= 2 && note > meilleur) { meilleur = note; entete = k; }
    }
  }
  const corps = lignes.slice(entete + 1).filter((l) => !estVide(l));
  const titres = entete >= 0 ? lignes[entete] : [];
  const colonnes = [];
  for (let i = 0; i < nb; i++) {
    const libelle = String(titres[i] || '').trim();
    const v = valeurs(corps, i);
    colonnes.push({ i, libelle: libelle || `Colonne ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`, role: libelle ? (roleDeTitre(libelle) || 'ignorer') : null, exemples: v.slice(0, 3), n: v.length, longueur: longueurMoyenne(v) });
  }
  // Ce que disent les valeurs, pour corriger ou compléter les intitulés.
  const partDuree = (c) => { const v = valeurs(corps, c.i); return v.length ? v.filter((x) => lireDuree(x) != null).length / v.length : 0; };
  // « Séance » rempli de 1, 2, 3… : une numérotation, ni un intitulé ni une durée.
  for (const c of colonnes) if ((c.role === 'titre' || c.role === 'duree' || c.role === null) && estNumerotation(valeurs(corps, c.i))) c.role = 'ignorer';
  for (const c of colonnes) {
    if (c.role === 'titre' && c.n && partDuree(c) > 0.7 && c.longueur < 14) c.role = 'duree';
    else if (c.role === 'duree' && c.n && partDuree(c) < 0.3 && c.longueur > 14) c.role = 'titre';
  }
  // Sans en-tête : la colonne au texte le plus long est l'intitulé, une colonne de nombres courts la durée.
  if (entete < 0) {
    for (const c of colonnes) c.role = 'ignorer';
    const pleines = colonnes.filter((c) => c.n);
    const titre = [...pleines].sort((a, b) => b.longueur - a.longueur)[0];
    if (titre) titre.role = 'titre';
    const duree = pleines.find((c) => c !== titre && partDuree(c) > 0.7 && c.longueur < 14);
    if (duree) duree.role = 'duree';
    const avant = titre ? pleines.filter((c) => c.i < titre.i && c.role === 'ignorer' && c.longueur > 4) : [];
    if (avant.length) avant[0].role = 'chapitre';
  }
  // Un seul titre : parmi plusieurs candidats, le premier qui a du texte, les autres vont au cahier de textes.
  unRole(colonnes, 'titre', (cands) => cands.sort((a, b) => (b.longueur > 12) - (a.longueur > 12) || a.i - b.i)[0]);
  for (const r of Object.keys(ROLES)) if (!['titre', 'ignorer', 'complement'].includes(r)) unRole(colonnes, r, (cands) => cands[0]);
  for (const c of colonnes) if (c.role === null) c.role = 'ignorer';
  if (!colonnes.some((c) => c.role === 'titre')) {
    const libre = colonnes.filter((c) => c.n && ['ignorer', 'complement'].includes(c.role)).sort((a, b) => b.longueur - a.longueur)[0];
    if (libre) libre.role = 'titre';
  }
  return { entete, colonnes: colonnes.map(({ i, libelle, role, exemples }) => ({ i, libelle, role, exemples })) };
}

/** 1, 2, 3… ou S1, S2, S3… : une colonne qui numérote les lignes. */
export function estNumerotation(v) {
  const n = v.map((x) => { const m = norm(x).match(/^(?:s|seance|sequence|n|no|num)?\s*(\d{1,3})$/); return m ? Number(m[1]) : null; });
  if (v.length < 3 || n.some((x) => x == null)) return false;
  // Une numérotation monte de un en un ; elle peut repartir à 1 à chaque chapitre, pas à chaque ligne.
  let suites = 0;
  for (let k = 1; k < n.length; k++) if (n[k] === n[k - 1] + 1 || (n[k] === 1 && n[k - 1] >= 2)) suites++;
  return suites >= 2 && suites >= (n.length - 1) * 0.8;
}

function unRole(colonnes, role, choisir) {
  const cands = colonnes.filter((c) => c.role === role);
  if (cands.length < 2) return;
  const garde = choisir([...cands]);
  for (const c of cands) if (c !== garde) c.role = role === 'titre' && c.longueur > 12 ? 'complement' : 'ignorer';
}

/**
 * Les lignes du tableau → des étapes. colonnes : celles d'analyser(), rôles éventuellement corrigés.
 * Renvoie { etapes, chapitres, avertissements }.
 */
export function versEtapes(lignes, { entete = -1, colonnes = [], dureeSeance = 55, seancesParSemaine = 0, rentree, niveau = '' } = {}) {
  const col = {};
  for (const c of colonnes) if (c.role && c.role !== 'ignorer' && c.role !== 'complement' && col[c.role] == null) col[c.role] = c.i;
  const complements = colonnes.filter((c) => c.role === 'complement');
  const lire = (l, role) => (col[role] == null ? '' : String(l[col[role]] || '').trim());
  const etapes = [], chapitres = [], avertissements = [];
  let chapitre = '';
  for (let k = entete + 1; k < lignes.length; k++) {
    const l = lignes[k] || [];
    if (estVide(l)) continue;
    const numero = k + 1;
    const titre = lire(l, 'titre');
    const remplies = l.map((v, i) => ({ v: String(v || '').trim(), i })).filter((x) => x.v);
    const ch = lire(l, 'chapitre');
    // Une ligne de chapitre : le chapitre sans intitulé, ou une seule cellule qui s'annonce comme tel.
    const seule = remplies.length === 1 ? remplies[0] : null;
    const enTete = seule && (seule.i === col.chapitre || (col.titre != null && seule.i < col.titre) || MOT_CHAPITRE.test(norm(seule.v)));
    if ((ch && !titre) || enTete) {
      chapitre = ch || seule.v;
      if (!chapitres.includes(chapitre)) chapitres.push(chapitre);
      continue;
    }
    if (ch && ch !== chapitre) { chapitre = ch; if (!chapitres.includes(chapitre)) chapitres.push(chapitre); }
    if (!titre) { avertissements.push(`Ligne ${numero} : pas d’intitulé, écartée.`); continue; }
    const brutDuree = lire(l, 'duree');
    let duree = lireDuree(brutDuree, { dureeSeance, seancesParSemaine });
    if (duree == null) {
      if (brutDuree) avertissements.push(`Ligne ${numero} : durée « ${brutDuree} » non comprise, comptée une séance.`);
      duree = 1;
    }
    const type = norm(lire(l, 'type')), fmt = norm(lire(l, 'format'));
    const ev = lire(l, 'eval');
    const evaluation = (!!ev && (OUI.test(ev) || MOT_EVAL.test(norm(ev)))) || MOT_EVAL.test(type) || DEBUT_EVAL.test(norm(titre));
    const format = DEMI.test(fmt) || (DEMI.test(type) && !ENTIERE.test(type)) ? 'demi' : ENTIERE.test(fmt) || ENTIERE.test(type) ? 'entiere' : 'indiff';
    const jalons = lire(l, 'jalons').split(/\n|;|→|->|•|•|\s\/\s/).map((x) => x.replace(/^\s*[-–*\d.)]+\s*/, '').trim()).filter(Boolean).slice(0, 12);
    const copies = lire(l, 'photocopies').match(/\d+/);
    const cible = col.semaine != null && rentree ? lireSemaine(lire(l, 'semaine'), { rentree }) : null;
    if (col.semaine != null && lire(l, 'semaine') && !cible) avertissements.push(`Ligne ${numero} : semaine « ${lire(l, 'semaine')} » non comprise.`);
    const plus = complements.map((c) => ({ c, v: String(l[c.i] || '').trim() })).filter((x) => x.v).map((x) => `${x.c.libelle} : ${x.v}`);
    const pronote = [lire(l, 'pronote'), ...plus].filter(Boolean).join('\n');
    etapes.push({
      titre, chapitre, duree, eval: evaluation, format, jalons,
      afaire: lire(l, 'materiel'), photocopies: copies ? Math.min(50, Number(copies[0])) : 0,
      pronote, devoirs: lire(l, 'devoirs'), cible: cible || '',
      niveau: niveauDansTexte(lire(l, 'niveau')) || (lire(l, 'niveau') ? niveauDe(lire(l, 'niveau')) : '') || niveau,
      ligne: numero,
    });
  }
  return { etapes, chapitres, avertissements };
}

// ---------- Appliquer à des classes ----------

export const cleTitre = (t) => norm(t).replace(/\s+/g, ' ');

/**
 * Ce qu'un import change : étapes créées ou complétées, files des classes. Ne touche à rien ;
 * renvoie de quoi écrire.
 *   v : la vue des données (classes, etapes, journal) ; etapes : celles de versEtapes ;
 *   cibles : codes des classes ; mode : 'ajouter' (à la suite) ou 'remplacer' (la file devient
 *   la programmation ; ce qui était déjà dans la file garde sa place dans le suivi).
 * Renvoie { etapes: { eid: doc }, classes: { code: { file, depart } }, oublies: [clés de journal],
 *           resume: { nouvelles, reprises, ajoutees: { code: n } } }.
 */
export function planImport(v, etapes, { niveau, cibles = [], mode = 'ajouter', nouvelId }) {
  const resEtapes = {}, resClasses = {}, oublies = [];
  const existantes = new Map();
  for (const [eid, e] of Object.entries(v.etapes || {})) {
    if (!e || e._x || (e.niveau || '') !== niveau) continue;
    const k = cleTitre(e.titre);
    if (!existantes.has(k)) existantes.set(k, eid);
  }
  const eids = [];
  let nouvelles = 0, reprises = 0;
  for (const e of etapes) {
    const k = cleTitre(e.titre);
    const vu = eids.find((x) => x.k === k);
    if (vu) { eids.push({ k, eid: vu.eid }); continue; } // deux lignes de même intitulé : une étape
    let eid = existantes.get(k);
    const champs = {
      titre: e.titre, niveau, duree: e.duree, eval: !!e.eval, format: e.format || 'indiff',
      jalons: e.jalons || [], afaire: e.afaire || '', photocopies: Number(e.photocopies) || 0,
      pronote: e.pronote || '', devoirs: e.devoirs || '', chapitre: e.chapitre || '', cible: e.cible || '',
    };
    if (eid) {
      // L'étape existe déjà au niveau : l'import la complète là où il dit quelque chose.
      const ancienne = { ...v.etapes[eid] };
      delete ancienne._m;
      const maj = { ...ancienne };
      for (const [c, val] of Object.entries(champs)) {
        const dit = Array.isArray(val) ? val.length > 0 : typeof val === 'boolean' ? val : !!val;
        if (dit || maj[c] == null) maj[c] = val;
      }
      resEtapes[eid] = maj;
      reprises++;
    } else {
      eid = nouvelId(`e${niveau}-`);
      resEtapes[eid] = { insecable: false, ...champs };
      nouvelles++;
    }
    eids.push({ k, eid });
  }
  const ordre = [...new Set(eids.map((x) => x.eid))];
  const ajoutees = {};
  for (const code of cibles) {
    const cl = (v.classes || {})[code];
    if (!cl) continue;
    const file = (cl.file || []).filter((it) => it && it.eid);
    const parEid = new Map(file.map((it) => [it.eid, it]));
    let nouvelle;
    if (mode === 'remplacer') {
      nouvelle = ordre.map((eid) => parEid.get(eid) || { u: nouvelId('u'), eid });
      const gardes = new Set(nouvelle.map((it) => it.u));
      for (const [cle, j] of Object.entries(v.journal || {})) {
        if (j && !j._x && j.code === code && j.arret && j.arret.u != null && !gardes.has(j.arret.u)) oublies.push(cle);
      }
      const depart = cl.depart && cl.depart.u != null && !gardes.has(cl.depart.u) ? { u: nouvelle[0] ? nouvelle[0].u : null, f: 0, rang: 0 } : cl.depart;
      resClasses[code] = { file: nouvelle, depart: depart || null };
      ajoutees[code] = nouvelle.filter((it) => !parEid.has(it.eid)).length;
    } else {
      const plus = ordre.filter((eid) => !parEid.has(eid)).map((eid) => ({ u: nouvelId('u'), eid }));
      resClasses[code] = { file: [...file, ...plus], depart: cl.depart || null };
      ajoutees[code] = plus.length;
    }
  }
  return { etapes: resEtapes, classes: resClasses, oublies, resume: { nouvelles, reprises, ajoutees } };
}

// ---------- Exporter ----------

const ENTETES_EXPORT = ['Chapitre', 'Étape', 'Durée (séances)', 'Évaluation', 'Format', 'Jalons', 'Matériel', 'Photocopies (pages par élève)', 'Cahier de textes', 'Travail à faire', 'Semaine visée'];
const enFrancais = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const dateFr = (j) => (j ? `${j.slice(8, 10)}/${j.slice(5, 7)}/${j.slice(0, 4)}` : '');

/** La file d'une classe en lignes de tableur : se réimporte telle quelle, chez soi ou chez un collègue. */
export function lignesExport(v, code) {
  const cl = (v.classes || {})[code];
  if (!cl) return [ENTETES_EXPORT];
  const res = [ENTETES_EXPORT];
  for (const it of cl.file || []) {
    const e = (v.etapes || {})[it.eid];
    if (!e || e._x) continue;
    res.push([
      e.chapitre || '', e.titre || '', Math.round((Number(e.duree) || 1) * 100) / 100, e.eval ? 'oui' : '',
      e.format === 'demi' ? 'demi-groupe' : e.format === 'entiere' ? 'classe entière' : '',
      (e.jalons || []).join('\n'), e.afaire || '', Number(e.photocopies) || '',
      e.pronote || '', e.devoirs || '', dateFr(e.cible || ''),
    ]);
  }
  return res;
}

/** Un modèle à remplir : les colonnes que le Carnet reconnaît, avec trois lignes d'exemple. */
export function modeleProgrammation() {
  const ch = 'Chapitre 1 — Titre du chapitre';
  return [
    ENTETES_EXPORT,
    [ch, 'Activité 1 : la question du jour', 1, '', '', 'Documents\nQuestions\nMise en commun\nBilan', '', 1, 'Activité 1 : la question du jour', 'Finir la question 3', 'S45'],
    [ch, 'TP : le protocole à tester', 1.5, '', 'demi-groupe', 'Protocole\nManipulation\nRésultats\nInterprétation', 'Microscopes, lames', '', '', '', ''],
    [ch, 'Évaluation du chapitre 1', 0.5, 'oui', 'classe entière', '', '', 2, 'Évaluation du chapitre 1', 'Réviser le chapitre 1', ''],
  ];
}

/** Des lignes → un CSV qu'Excel ouvre directement en français (point-virgule, UTF-8 avec BOM). */
export function versCsv(lignes) {
  const champ = (x) => { const s = typeof x === 'number' ? enFrancais(x) : String(x ?? ''); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return `\ufeff${lignes.map((l) => l.map(champ).join(';')).join('\r\n')}\r\n`;
}
