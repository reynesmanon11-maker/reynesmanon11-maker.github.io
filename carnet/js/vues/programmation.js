// Importer sa programmation depuis un tableur (Excel, LibreOffice, Google Sheets, Numbers, CSV,
// ou des cellules collées), l'exporter pour un collègue, ou partir d'un modèle vierge.
// Le fichier est lu dans le navigateur : il ne quitte jamais l'appareil.
//
// Une feuille à la fois, comme les onglets du tableur : le Carnet devine la ligne des titres et le
// rôle de chaque colonne, montre les étapes qu'il en tire, et l'on corrige ce qu'il a mal deviné
// avant d'appliquer. Une feuille par niveau (« 6e », « 5e »…) est la disposition la plus courante.
import { actions, changements, saisies } from '../actions.js';
import { html, icone, ouvrirFeuille, fermerFeuille, redessinerFeuille, toast, telecharger } from '../ui.js';
import { calc, ecrireDoc, modifierDoc, nomClasse, classesDetectees } from '../etat.js';
import { lireTableur, lireTexteTabule, ecrireXlsx } from '../tableur.js';
import { ROLES, analyser, versEtapes, planImport, niveauDansTexte, anneeRentree, lignesExport, modeleProgrammation } from '../programmation.js';
import { seancesLisible } from '../moteur.js';
import { dateCourte } from '../dates.js';
import { nouvelId } from '../donnees.js';

const NIVEAUX = ['6e', '5e', '4e', '3e', '2nde', '1re', 'Tle', 'Autre'];
const FORMATS = { demi: 'demi-groupe', entiere: 'classe entière' };
const APERCU_MAX = 80;

let imp = null; // { nom, feuilles: [{ nom, lignes, entete, colonnes, niveau, cibles, mode, faite }], k, lecture, erreur, collage, voirColonnes, surFin }

/** Redessine la fenêtre en rendant le focus au champ qu'on vient de changer (il a été remplacé). */
function redessiner(el) {
  const id = el && el.id;
  redessinerFeuille(true);
  if (id) document.getElementById(id)?.focus({ preventScroll: true });
}

const niveauxSuivis = () => {
  const v = calc().v;
  return [...new Set(Object.values(v.classes).filter((cl) => !cl.masquee).map((cl) => cl.niveau))];
};
const classesDuNiveau = (niveau) => Object.entries(calc().v.classes).filter(([, cl]) => !cl.masquee && cl.niveau === niveau).map(([k]) => k).sort();

function preparerFeuille(f, nomFichier, rang) {
  const a = analyser(f.lignes);
  const suivis = niveauxSuivis();
  // Le niveau : le nom de la feuille, sinon celui du fichier, sinon le seul niveau suivi.
  const niveau = niveauDansTexte(f.nom) || (rang === 0 ? niveauDansTexte(nomFichier) : '') || (suivis.length === 1 ? suivis[0] : suivis[rang] || suivis[0] || '6e');
  return { ...f, entete: a.entete, colonnes: a.colonnes, niveau, cibles: new Set(classesDuNiveau(niveau)), mode: 'ajouter', faite: false };
}

function ouvrirAvec(nom, feuilles) {
  Object.assign(imp, { nom, feuilles: feuilles.map((f, k) => preparerFeuille(f, nom, k)), k: 0, lecture: false, erreur: '' });
  redessinerFeuille(true);
}

/** Les réglages de durée : la séance de Pronote, et le nombre de cours par semaine des classes visées. */
function contexte(f) {
  const c = calc();
  const detectees = classesDetectees();
  const parSemaine = [...f.cibles].map((k) => (detectees.find((d) => d.code === k) || {}).parSemaine || 0).filter(Boolean);
  return {
    dureeSeance: c.dureeSeance || 55,
    seancesParSemaine: parSemaine.length ? Math.max(...parSemaine) : 0,
    rentree: anneeRentree(c.v.reglages.debut || c.auj),
  };
}

function resultat(f) {
  return versEtapes(f.lignes, { entete: f.entete, colonnes: f.colonnes, niveau: f.niveau, ...contexte(f) });
}

// ---------- La feuille d'import ----------

function ecranSource() {
  return html`<div class="section-feuille">
      <p>Le fichier de votre programmation, tel quel : une ligne par séance ou par activité. Le Carnet devine les colonnes, vous corrigez avant d'appliquer.</p>
      <label class="depot" id="depot-programmation">
        <input type="file" accept=".xlsx,.xlsm,.ods,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,text/csv" data-change="prog-fichier" class="visuellement-cache">
        ${icone('televerser')}<strong>${imp.lecture ? 'Lecture…' : 'Choisir le fichier'}</strong>
        <span class="aide">Excel (.xlsx), LibreOffice (.ods), CSV — ou glissez-le ici. Depuis Google Sheets : Fichier → Télécharger → Microsoft Excel.</span>
      </label>
      ${imp.erreur ? html`<p class="avert" role="alert">${imp.erreur}</p>` : ''}
    </div>
    <div class="section-feuille">
      <h3>Ou coller les cellules</h3>
      <label class="champ"><span>Sélectionnez le tableau dans le tableur (ou dans Word), copiez, collez ici</span>
        <textarea id="prog-collage" rows="5" data-saisie="prog-collage" placeholder="Chapitre	Séance	Durée&#10;Le vivant	Sortie dehors	1">${imp.collage}</textarea></label>
      <div class="outils"><button class="btn" data-action="prog-lire-collage" ${imp.collage.trim() ? '' : 'disabled'}>Lire le collage</button></div>
    </div>
    <div class="section-feuille">
      <h3>Pas encore de fichier ?</h3>
      <p class="aide">Le modèle vierge a déjà les colonnes que le Carnet reconnaît, avec trois lignes d'exemple. Rien n'est obligatoire sauf l'intitulé : une durée vide compte une séance.</p>
      <div class="outils"><button class="btn mini" data-action="prog-modele">${icone('telecharger')} Télécharger le modèle (Excel)</button></div>
    </div>`;
}

function ongletsFeuilles() {
  if (imp.feuilles.length < 2) return '';
  return html`<div class="onglets-feuilles" role="tablist" aria-label="Feuilles du classeur">${imp.feuilles.map((f, k) => html`<button role="tab" aria-selected="${k === imp.k}" data-action="prog-onglet" data-k="${k}">${f.faite ? icone('valider') : ''}${f.nom}</button>`)}</div>`;
}

function tableColonnes(f) {
  const utiles = f.colonnes.filter((c) => c.exemples.length || (f.entete >= 0 && String((f.lignes[f.entete] || [])[c.i] || '').trim()));
  return html`<div class="colonnes-import">${utiles.map((c) => html`<label class="colonne-import${c.role === 'ignorer' ? ' ignoree' : ''}">
      <span class="nom">${c.libelle}</span>
      <span class="exemples">${c.exemples.length ? c.exemples.join(' · ') : '—'}</span>
      <select id="prog-role-${c.i}" data-change="prog-role" data-i="${c.i}" aria-label="Rôle de la colonne ${c.libelle}">${Object.entries(ROLES).map(([r, lib]) => html`<option value="${r}"${c.role === r ? ' selected' : ''}>${lib}</option>`)}</select>
    </label>`)}</div>`;
}

function apercu(etapes, chapitres) {
  if (!etapes.length) return html`<p class="vide">Aucune étape : choisissez la colonne de l'intitulé ci-dessus.</p>`;
  const lignes = [];
  let ch = null;
  for (const e of etapes.slice(0, APERCU_MAX)) {
    if (e.chapitre && e.chapitre !== ch) { ch = e.chapitre; lignes.push(html`<li class="chapitre">${ch}</li>`); }
    lignes.push(html`<li class="${e.eval ? 'eval' : ''}"><span class="titre">${e.eval ? '✎ ' : ''}${e.titre}</span>
      <span class="meta">${seancesLisible(e.duree)}${FORMATS[e.format] ? ` · ${FORMATS[e.format]}` : ''}${e.jalons.length ? ` · ${e.jalons.length} jalons` : ''}${e.cible ? ` · semaine du ${dateCourte(e.cible)}` : ''}${e.devoirs ? ' · travail à faire' : ''}${e.afaire ? ' · matériel' : ''}</span></li>`);
  }
  const total = etapes.reduce((s, e) => s + e.duree, 0);
  return html`<p class="aide resume-import"><b>${etapes.length} étape${etapes.length > 1 ? 's' : ''}</b>${chapitres.length ? ` en ${chapitres.length} chapitre${chapitres.length > 1 ? 's' : ''}` : ''} · ${seancesLisible(total)} en tout · ${etapes.filter((e) => e.eval).length} évaluation(s)</p>
    <ol class="apercu-import">${lignes}${etapes.length > APERCU_MAX ? html`<li class="vide">… et ${etapes.length - APERCU_MAX} autres</li>` : ''}</ol>`;
}

function ecranFeuille() {
  const f = imp.feuilles[imp.k];
  const { etapes, chapitres, avertissements } = resultat(f);
  const classes = classesDuNiveau(f.niveau);
  const nbLignes = Math.min(15, f.lignes.length);
  const v = calc().v;
  const dejaRemplies = [...f.cibles].filter((k) => (v.classes[k].file || []).length);
  return html`${ongletsFeuilles()}
    <div class="grille-champs">
      <label class="champ"><span>Niveau de cette feuille</span><select id="prog-niveau" data-change="prog-niveau">${NIVEAUX.map((n) => html`<option${n === f.niveau ? ' selected' : ''}>${n}</option>`)}</select></label>
      <label class="champ"><span>Ligne des titres de colonnes</span><select id="prog-entete" data-change="prog-entete">
        <option value="-1"${f.entete < 0 ? ' selected' : ''}>Aucune (pas de titres)</option>
        ${Array.from({ length: nbLignes }, (_, k) => html`<option value="${k}"${f.entete === k ? ' selected' : ''}>Ligne ${k + 1} : ${(f.lignes[k] || []).filter((x) => String(x).trim()).slice(0, 3).join(' · ').slice(0, 50) || '(vide)'}</option>`)}
      </select></label>
    </div>
    <details class="section-feuille"${imp.voirColonnes || !etapes.length ? ' open' : ''}><summary data-action="prog-voir-colonnes"><b>Colonnes reconnues</b> <span class="aide">— à corriger si besoin</span></summary>${tableColonnes(f)}</details>
    <div class="section-feuille"><h3>Ce que le Carnet en tire</h3>${apercu(etapes, chapitres)}
      ${avertissements.length ? html`<details><summary class="aide">${avertissements.length} ligne(s) à vérifier</summary><ul class="aide">${avertissements.slice(0, 30).map((a) => html`<li>${a}</li>`)}</ul></details>` : ''}</div>
    <div class="section-feuille"><h3>Pour quelles classes</h3>
      ${classes.length ? html`<div class="outils">${classes.map((k) => html`<label class="coche"><input type="checkbox" id="prog-cible-${k}" data-change="prog-cible" value="${k}"${f.cibles.has(k) ? ' checked' : ''}><span>${nomClasse(k)}</span></label>`)}</div>`
        : html`<p class="aide">Aucune classe de ${f.niveau} n'est suivie : les étapes seront rangées au niveau, prêtes pour « Reprendre une étape ».</p>`}
      ${dejaRemplies.length ? html`<div class="segmente" role="group" aria-label="Si la classe a déjà des étapes">
          <button data-action="prog-mode" data-mode="ajouter" aria-pressed="${f.mode === 'ajouter'}">Ajouter à la suite</button>
          <button data-action="prog-mode" data-mode="remplacer" aria-pressed="${f.mode === 'remplacer'}">Remplacer la file</button></div>
        <p class="aide">${f.mode === 'remplacer'
          ? 'La file prend l’ordre du tableur. Une étape au même intitulé garde son suivi ; les autres sortent de la file mais restent au niveau.'
          : 'Les étapes absentes de la file sont ajoutées à la fin ; une étape au même intitulé est complétée, pas dupliquée.'}</p>` : ''}
    </div>`;
}

function contenu() {
  if (!imp) return { titre: '', corps: '' };
  if (!imp.feuilles.length) {
    return { titre: 'Importer une programmation', corps: ecranSource(), pied: html`<button class="btn" data-action="fermer-feuille">Fermer</button>` };
  }
  const f = imp.feuilles[imp.k];
  const n = resultat(f).etapes.length;
  const reste = imp.feuilles.filter((x) => !x.faite).length;
  return {
    titre: `Importer « ${imp.nom} »`,
    corps: ecranFeuille(),
    pied: html`<button class="btn discret" data-action="prog-autre">Autre fichier</button>
      <button class="btn" data-action="fermer-feuille">${imp.feuilles.some((x) => x.faite) ? 'Terminer' : 'Annuler'}</button>
      <button class="btn plein" data-action="prog-appliquer" ${n && !f.faite ? '' : 'disabled'}>${icone('valider')} ${f.faite ? 'Feuille importée' : `Importer ${n} étape${n > 1 ? 's' : ''}${reste > 1 ? ' de cette feuille' : ''}`}</button>`,
  };
}

/**
 * Ouvre l'import. `fichier` (facultatif) est lu tout de suite ; `surFin(importe)` est appelé à la
 * fermeture, avec vrai si au moins une feuille a été importée.
 */
export function ouvrirImportProgression({ fichier, surFin } = {}) {
  imp = { nom: '', feuilles: [], k: 0, lecture: false, erreur: '', collage: '', voirColonnes: false, surFin };
  ouvrirFeuille(contenu, {
    classe: 'large',
    surFermeture: () => { const x = imp; imp = null; if (x && x.surFin) x.surFin(x.feuilles.some((f) => f.faite)); },
  });
  if (fichier) lireFichier(fichier);
}

async function lireFichier(fichier) {
  if (!imp) return;
  imp.lecture = true; imp.erreur = '';
  redessinerFeuille(true);
  try {
    const { feuilles } = await lireTableur(new Uint8Array(await fichier.arrayBuffer()), fichier.name);
    if (!imp) return;
    imp.lecture = false;
    ouvrirAvec(fichier.name.replace(/\.[^.]+$/, ''), feuilles);
  } catch (e) {
    if (!imp) return;
    imp.lecture = false;
    imp.erreur = e.code ? e.message : `Ce fichier n'a pas pu être lu (${e.message}).`;
    redessinerFeuille(true);
  }
}

// ---------- Actions ----------
actions['prog-importer'] = () => ouvrirImportProgression();
changements['prog-fichier'] = (el) => { const f = el.files && el.files[0]; if (f) lireFichier(f); };
saisies['prog-collage'] = (el) => {
  if (!imp) return;
  const avant = !!imp.collage.trim();
  imp.collage = el.value;
  // Le bouton « Lire le collage » s'active sans redessiner la zone de saisie.
  if (avant !== !!el.value.trim()) { const b = document.querySelector('[data-action="prog-lire-collage"]'); if (b) b.disabled = !el.value.trim(); }
};
actions['prog-lire-collage'] = () => {
  if (!imp || !imp.collage.trim()) return;
  const lignes = lireTexteTabule(imp.collage);
  if (!lignes.length) { imp.erreur = 'Le collage est vide.'; redessinerFeuille(true); return; }
  ouvrirAvec('cellules collées', [{ nom: 'Collage', lignes }]);
};
actions['prog-autre'] = () => { if (imp) { imp.feuilles = []; imp.erreur = ''; redessinerFeuille(true); } };
actions['prog-onglet'] = (el) => { if (imp) { imp.k = Number(el.dataset.k) || 0; redessinerFeuille(true); } };
actions['prog-voir-colonnes'] = () => { if (imp) { imp.voirColonnes = !imp.voirColonnes; redessinerFeuille(true); } };
changements['prog-niveau'] = (el) => {
  const f = imp && imp.feuilles[imp.k];
  if (!f) return;
  f.niveau = el.value;
  f.cibles = new Set(classesDuNiveau(f.niveau));
  redessiner(el);
};
changements['prog-entete'] = (el) => {
  const f = imp && imp.feuilles[imp.k];
  if (!f) return;
  const a = analyser(f.lignes, { entete: Number(el.value) });
  f.entete = a.entete; f.colonnes = a.colonnes;
  redessiner(el);
};
changements['prog-role'] = (el) => {
  const f = imp && imp.feuilles[imp.k];
  if (!f) return;
  const i = Number(el.dataset.i), role = el.value;
  // Un rôle à une seule colonne (sauf « ajouter au cahier de textes » et « ne pas importer ») : l'ancienne le perd.
  for (const c of f.colonnes) {
    if (c.i === i) c.role = role;
    else if (c.role === role && !['complement', 'ignorer'].includes(role)) c.role = 'ignorer';
  }
  redessiner(el);
};
changements['prog-cible'] = (el) => {
  const f = imp && imp.feuilles[imp.k];
  if (!f) return;
  if (el.checked) f.cibles.add(el.value); else f.cibles.delete(el.value);
  redessiner(el);
};
actions['prog-mode'] = (el) => { const f = imp && imp.feuilles[imp.k]; if (f) { f.mode = el.dataset.mode; redessinerFeuille(true); } };

actions['prog-appliquer'] = () => {
  const f = imp && imp.feuilles[imp.k];
  if (!f || f.faite) return;
  const { etapes } = resultat(f);
  if (!etapes.length) return;
  const v = calc().v;
  // Une colonne « Niveau » peut répartir une même feuille entre plusieurs niveaux.
  const parNiveau = new Map();
  for (const e of etapes) { const n = e.niveau || f.niveau; if (!parNiveau.has(n)) parNiveau.set(n, []); parNiveau.get(n).push(e); }
  let nouvelles = 0, reprises = 0, oublies = 0;
  const touchees = [];
  for (const [niveau, liste] of parNiveau) {
    const cibles = niveau === f.niveau ? [...f.cibles] : classesDuNiveau(niveau);
    const p = planImport(v, liste, { niveau, cibles, mode: f.mode, nouvelId });
    for (const [eid, doc] of Object.entries(p.etapes)) ecrireDoc(`etapes/${eid}`, doc);
    for (const [code, x] of Object.entries(p.classes)) {
      modifierDoc(`classes/${code}`, (cl) => { cl.file = x.file; if (x.depart) cl.depart = x.depart; else delete cl.depart; });
      touchees.push(code);
    }
    nouvelles += p.resume.nouvelles; reprises += p.resume.reprises; oublies += p.oublies.length;
  }
  f.faite = true;
  const suivante = imp.feuilles.findIndex((x) => !x.faite);
  if (suivante >= 0) imp.k = suivante;
  redessinerFeuille(true);
  toast(`${nouvelles} étape(s) créée(s)${reprises ? `, ${reprises} complétée(s)` : ''}${touchees.length ? ` · ${touchees.map((k) => nomClasse(k)).join(', ')}` : ' · rangées au niveau'}${oublies ? ` · ${oublies} validation(s) raccrochée(s) à la même place : à vérifier` : ''}.`, { duree: 6000 });
};

// ---------- Exporter, modèle ----------
const nomFichier = (s) => String(s).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();

actions['prog-modele'] = async () => {
  const o = await ecrireXlsx([{ nom: 'Programmation', lignes: modeleProgrammation() }]);
  telecharger('Programmation - modèle Carnet.xlsx', o, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

/** Toutes les classes suivies d'un niveau, une feuille chacune ; ou une seule classe. */
actions['prog-exporter'] = async (el) => {
  const v = calc().v;
  const codes = el.dataset.code ? [el.dataset.code] : Object.keys(v.classes).filter((k) => !v.classes[k].masquee && (v.classes[k].file || []).length);
  if (!codes.length) { toast('Aucune file d’étapes à exporter.'); return; }
  const feuilles = codes.map((k) => ({ nom: nomClasse(k), lignes: lignesExport(v, k) }));
  const o = await ecrireXlsx(feuilles);
  const nom = codes.length === 1 ? `Progression ${nomFichier(nomClasse(codes[0]))}.xlsx` : 'Progressions - Carnet de bord.xlsx';
  telecharger(nom, o, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  toast('Fichier Excel prêt : il se réimporte tel quel, chez vous ou chez un collègue.');
};

// Déposer un fichier n'importe où sur la fenêtre d'import.
if (typeof document !== 'undefined') {
  document.addEventListener('dragover', (e) => { if (imp && !imp.feuilles.length) { e.preventDefault(); document.getElementById('depot-programmation')?.classList.add('survol'); } });
  document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.getElementById('depot-programmation')?.classList.remove('survol'); });
  document.addEventListener('drop', (e) => {
    if (!imp || imp.feuilles.length) return;
    e.preventDefault();
    document.getElementById('depot-programmation')?.classList.remove('survol');
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) lireFichier(f);
  });
}

export { fermerFeuille };
