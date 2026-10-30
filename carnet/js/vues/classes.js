// Les classes et leurs files d'étapes. Une étape appartient à un NIVEAU : son titre, sa durée,
// ses jalons et son texte Pronote sont les mêmes pour toutes les classes de ce niveau qui la
// font. Ce qui est propre à une classe, c'est l'ordre de sa file et l'endroit où elle en est.
import { actions, changements, envois } from '../actions.js';
import { html, icone, ouvrirFeuille, fermerFeuille, redessinerFeuille, toast } from '../ui.js';
import { calc, etat, reglerLocal, ecrireDoc, modifierDoc, supprimerDoc, nomClasse, niveauClasse, classesDetectees, modifierReglages } from '../etat.js';
import { niveauDe } from '../pronote.js';
import { seancesLisible, jalonsDe, EPS, arretDe, calendrierEtapes, prochainesEvaluations } from '../moteur.js';
import { dateCourte, jourMois, lundiDe, ecartJours } from '../dates.js';
import { nouvelId } from '../donnees.js';
import { pastille, styleNiveau } from './commun.js';
import { ouvrirImportProgression } from './programmation.js';

export const MODELES_JALONS = {
  aucun: { nom: 'Aucun jalon (on compte en quarts de séance)', jalons: [] },
  demarche: { nom: "Démarche d'investigation", jalons: ['Situation déclenchante', 'Problème', 'Hypothèses', 'Protocole', 'Résultats', 'Interprétation', 'Bilan'] },
  documentaire: { nom: 'Activité documentaire', jalons: ['Documents', 'Questions', 'Mise en commun', 'Bilan'] },
  tp: { nom: 'Travaux pratiques', jalons: ['Protocole', 'Manipulation', 'Résultats', 'Interprétation', 'Rangement'] },
  ece: { nom: 'Trame ECE', jalons: ['Problème', 'Stratégie', 'Manipulation', 'Résultats', 'Conclusion'] },
};
const DUREES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8];
// Une durée importée d'un tableur (« 3 semaines » = 4,5 séances) reste proposée telle quelle.
const dureesAvec = (d) => [...new Set([...DUREES, d])].sort((a, b) => a - b);
const ORDRE_NIVEAUX = ['6e', '5e', '4e', '3e', '2nde', '1re', 'Tle', 'Autre'];

/** L'écart entre la semaine où l'étape tombe et celle que visait la programmation. */
function ecartCible(e, jour) {
  if (!e || !e.cible || !jour) return '';
  const n = Math.round(ecartJours(lundiDe(e.cible), lundiDe(jour)) / 7);
  if (!n) return html`<span class="ecart ok" title="Dans la semaine visée">semaine visée</span>`;
  return n > 0
    ? html`<span class="ecart retard" title="Semaine visée : ${dateCourte(lundiDe(e.cible))}">+${n} sem.</span>`
    : html`<span class="ecart avance" title="Semaine visée : ${dateCourte(lundiDe(e.cible))}">${n} sem.</span>`;
}
const FORMATS = { indiff: 'Indifférent', entiere: 'Classe entière', demi: 'Demi-groupe' };

let edition = null; // { code, u, eid, donnees, nouvelle }

function carteClasse(code, cal) {
  const c = calc();
  const cl = c.v.classes[code];
  const pc = c.plan.parClasse[code];
  const dates = (cal && cal[code]) || {};
  const file = (cl.file || []).filter((it) => c.v.etapes[it.eid]);
  const pos = pc ? pc.position : { i: 0, f: 0 };
  const memeNiveau = Object.entries(c.v.etapes).filter(([id, e]) => e.niveau === cl.niveau && !file.some((it) => it.eid === id));
  const autres = Object.keys(c.v.classes).filter((k) => k !== code && c.v.classes[k].niveau === cl.niveau);
  return html`<section class="carte" id="classe-${code}" style="${styleNiveau(code)}">
    <div class="classe-tete">
      <h2>${pastille(code)}</h2>
      <span class="aide">${code} · ${cl.niveau}${cl.effectif ? ` · ${cl.effectif} élèves` : ''}</span>
      <span class="outils" style="margin-left:auto">
        ${file.length ? html`<button class="btn-rond" data-action="prog-exporter" data-code="${code}" aria-label="Exporter la progression de la ${nomClasse(code)} (Excel)" title="Exporter en Excel">${icone('telecharger')}</button>` : ''}
        <button class="btn-rond" data-action="classe-modifier" data-code="${code}" aria-label="Modifier la classe ${nomClasse(code)}">${icone('crayon')}</button>
      </span>
    </div>
    ${pc && pc.prochains[0] ? html`<p class="aide">Prochain cours : <b>${dateCourte(pc.prochains[0].jour)}</b>${pc.premierLibre ? (pc.couvertJusqua ? html` · préparée jusqu'au ${dateCourte(pc.couvertJusqua)}` : html` · <b class="retard">rien de prévu</b>`) : ' · tout est prévu'}</p>` : ''}
    <ol class="file">${file.length ? file.map((it, i) => {
      const e = c.v.etapes[it.eid];
      const J = jalonsDe(e);
      const etatEtape = i < pos.i ? 'faite' : i === pos.i ? 'encours' : '';
      const fait = i < pos.i ? 1 : i === pos.i ? pos.f : 0;
      const d = dates[it.u] || {};
      const chapitre = e.chapitre && (i === 0 || (c.v.etapes[file[i - 1].eid] || {}).chapitre !== e.chapitre)
        ? html`<li class="chapitre-file">${e.chapitre}</li>` : '';
      return html`${chapitre}<li class="etape ${etatEtape}">
        <span>${e.eval ? '✎ ' : ''}${e.titre}</span>
        <span class="mini-outils">
          <button data-action="etape-monter" data-code="${code}" data-i="${i}" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>${icone('haut')}</button>
          <button data-action="etape-descendre" data-code="${code}" data-i="${i}" aria-label="Descendre" ${i === file.length - 1 ? 'disabled' : ''}>${icone('bas')}</button>
          <button data-action="etape-editer" data-code="${code}" data-u="${it.u}" aria-label="Modifier « ${e.titre} »">${icone('crayon')}</button>
          <button data-action="etape-retirer" data-code="${code}" data-u="${it.u}" aria-label="Retirer « ${e.titre} » de la file">${icone('croix')}</button>
        </span>
        <span class="meta">${d.debut && etatEtape !== 'faite' ? html`<b>${etatEtape === 'encours' ? 'en cours' : dateCourte(d.debut)}</b> ${ecartCible(e, d.debut)} · ` : ''}${seancesLisible(Number(e.duree) || 1)} · ${FORMATS[e.format] || FORMATS.indiff}${e.photocopies ? ` · ${e.photocopies} p. à photocopier` : ''}${e.afaire ? ` · ${e.afaire}` : ''}${e.devoirs ? ` · travail : ${e.devoirs}` : ''}
          ${J.length ? html`<span class="jalons-apercu">${J.map((j, k) => html`<span class="${(k + 1) / J.length <= fait + EPS ? 'fait' : ''}">${j}</span>`)}</span>` : ''}
          ${i === pos.i && pos.f > EPS && !J.length ? html`<span>fait à ${Math.round(pos.f * 100)} %</span>` : ''}</span>
      </li>`;
    }) : html`<li class="vide">Aucune étape. Ajoutez la première ci-dessous, ou <button class="lien" data-action="prog-importer">importez votre programmation</button>.</li>`}</ol>
    <div class="outils">
      <button class="btn mini plein" data-action="etape-nouvelle" data-code="${code}">${icone('plus')} Nouvelle étape</button>
      ${memeNiveau.length ? html`<select data-change="etape-reprendre" data-code="${code}" aria-label="Reprendre une étape du niveau" style="width:auto">
        <option value="">Reprendre une étape des ${cl.niveau}…</option>${memeNiveau.map(([id, e]) => html`<option value="${id}">${e.titre}</option>`)}</select>` : ''}
      ${autres.length && file.length ? html`<button class="btn mini" data-action="file-copier" data-code="${code}">${icone('dupliquer')} Même file pour…</button>` : ''}
      ${file.length ? html`<button class="btn mini discret" data-action="classe-depart" data-code="${code}">${icone('depart')} Point de départ</button>` : ''}
    </div>
  </section>`;
}

export function rendreClasses(route) {
  const c = calc();
  const codes = Object.keys(c.v.classes).filter((k) => !c.v.classes[k].masquee);
  codes.sort((a, b) => ORDRE_NIVEAUX.indexOf(c.v.classes[a].niveau) - ORDRE_NIVEAUX.indexOf(c.v.classes[b].niveau) || nomClasse(a).localeCompare(nomClasse(b)));
  // #/classes/5G1 ouvre la carte de la classe ; #/classes/calendrier, le calendrier des évaluations.
  const cible = route.param === 'calendrier' ? '' : route.param;
  const vue = route.param === 'calendrier' ? 'calendrier' : cible ? 'classes' : etat.local.vueProgressions || 'classes';
  if (cible) setTimeout(() => document.getElementById(`classe-${cible}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
  const masquees = Object.keys(c.v.classes).filter((k) => c.v.classes[k].masquee);
  const cal = calendrierEtapes(c.plan, c.creneaux);
  const avecFile = codes.some((k) => (c.v.classes[k].file || []).length);
  return html`
    <div class="titre-page"><div><h1>Progressions</h1><p>Chaque classe a sa file d'étapes. Les étapes sont partagées par niveau : une activité écrite pour la 601 sert aussi à la 602.</p></div>
      <div class="outils">
        <button class="btn plein" data-action="prog-importer">${icone('televerser')} Importer une programmation</button>
        ${avecFile ? html`<button class="btn" data-action="prog-exporter">${icone('telecharger')} Exporter (Excel)</button>` : ''}
        <button class="btn" data-action="classe-ajouter">${icone('plus')} Ajouter une classe</button>
      </div></div>
    ${codes.length && avecFile ? html`<div class="segmente" role="group" aria-label="Affichage">
      <button data-action="vue-progressions" data-vue="classes" aria-pressed="${vue === 'classes'}">Par classe</button>
      <button data-action="vue-progressions" data-vue="calendrier" aria-pressed="${vue === 'calendrier'}">Calendrier et évaluations</button></div>` : ''}
    ${!codes.length ? html`<p class="vide">Aucune classe suivie pour l'instant.</p>`
      : vue === 'calendrier' && avecFile ? rendreCalendrier(codes, cal)
      : html`<div class="classes">${codes.map((k) => carteClasse(k, cal))}</div>`}
    ${masquees.length ? html`<p class="aide">Classes masquées : ${masquees.map((k) => html`<button class="lien" data-action="classe-afficher" data-code="${k}">${nomClasse(k)}</button> `)}</p>` : ''}`;
}
actions['vue-progressions'] = (el) => {
  reglerLocal({ vueProgressions: el.dataset.vue });
  if (/^#\/classes\/./.test(location.hash)) location.hash = '#/classes';
};

// ---------- Calendrier : chaque étape, chaque classe, la date où elle tombe ----------

/** Les étapes d'un niveau dans l'ordre des files, les absentes d'une file glissées à leur place. */
function ordreDuNiveau(codes, v) {
  const ordre = [];
  for (const code of codes) {
    let pos = -1;
    for (const it of v.classes[code].file || []) {
      if (!v.etapes[it.eid]) continue;
      const k = ordre.indexOf(it.eid);
      if (k >= 0) { pos = Math.max(pos, k); continue; }
      ordre.splice(pos + 1, 0, it.eid);
      pos++;
    }
  }
  return ordre;
}

function celluleCalendrier(code, eid, cal, v) {
  const it = (v.classes[code].file || []).find((x) => x.eid === eid);
  if (!it) return html`<td class="absent" title="Pas dans la file de la ${nomClasse(code)}">·</td>`;
  const d = (cal[code] || {})[it.u] || {};
  const e = v.etapes[eid];
  const annoncee = e.eval && v.classes[code].annonces && v.classes[code].annonces[it.u];
  if (d.etat === 'faite') return html`<td class="faite">✓${d.debut ? ` ${jourMois(d.debut)}` : ''}</td>`;
  if (d.etat === 'au-dela') return html`<td class="au-dela" title="Au-delà de l'emploi du temps connu">—</td>`;
  return html`<td class="${d.etat}">${d.etat === 'encours' ? 'en cours' : dateCourte(d.debut)}${d.fin && d.fin !== d.debut ? html`<span class="jusqua"> → ${jourMois(d.fin)}</span>` : ''}
    ${ecartCible(e, d.debut)}${e.eval ? html` <span class="etiquette ${annoncee ? 'ok' : 'attente'}">${annoncee ? 'annoncée' : 'à annoncer'}</span>` : ''}</td>`;
}

function rendreCalendrier(codes, cal) {
  const c = calc(), v = c.v;
  const evals = prochainesEvaluations(v, c.plan, c.creneaux, { maintenant: c.maintenant });
  const niveaux = ORDRE_NIVEAUX.filter((n) => codes.some((k) => v.classes[k].niveau === n));
  return html`${evals.length ? html`<section class="carte"><h2>Prochaines évaluations</h2>
      <ul class="liste evals-a-venir">${evals.slice(0, 12).map((e) => html`<li style="${styleNiveau(e.code)}">
        <span class="quand">${dateCourte(e.jour)}</span>${pastille(e.code)}<span class="quoi">${e.titre}</span>
        ${ecartCible(v.etapes[e.eid], e.jour)}<span class="etiquette ${e.annoncee ? 'ok' : 'attente'}">${e.annoncee ? 'annoncée' : 'à annoncer'}</span></li>`)}</ul></section>` : ''}
    ${niveaux.map((n) => {
      const cl = codes.filter((k) => v.classes[k].niveau === n);
      const ordre = ordreDuNiveau(cl, v);
      if (!ordre.length) return '';
      let chapitre = null;
      return html`<section class="carte calendrier-niveau"><h2>${n}</h2>
        <div class="defile-x"><table class="calendrier-etapes">
          <thead><tr><th scope="col">Étape</th><th scope="col">Durée</th><th scope="col">Visée</th>${cl.map((k) => html`<th scope="col">${pastille(k)}</th>`)}</tr></thead>
          <tbody>${ordre.map((eid) => {
            const e = v.etapes[eid];
            const tete = e.chapitre && e.chapitre !== chapitre ? html`<tr class="chapitre"><th colspan="${3 + cl.length}" scope="rowgroup">${e.chapitre}</th></tr>` : '';
            if (e.chapitre) chapitre = e.chapitre;
            return html`${tete}<tr class="${e.eval ? 'eval' : ''}"><th scope="row">${e.eval ? '✎ ' : ''}${e.titre}</th><td class="duree">${seancesLisible(Number(e.duree) || 1)}</td>
              <td class="visee">${e.cible ? jourMois(lundiDe(e.cible)) : ''}</td>${cl.map((k) => celluleCalendrier(k, eid, cal, v))}</tr>`;
          })}</tbody></table></div>
        <p class="aide">Dates calculées sur l'emploi du temps connu : elles bougent dès qu'un cours saute ou qu'une validation change le rythme.</p></section>`;
    })}`;
}

// ---------- Éditeur d'étape ----------
function feuilleEtape() {
  const e = edition.donnees;
  const modele = Object.entries(MODELES_JALONS).find(([, m]) => m.jalons.join('|') === (e.jalons || []).join('|'));
  const v = calc().v;
  const partage = Object.values(v.classes).filter((cl) => (cl.file || []).some((it) => it.eid === edition.eid)).length;
  const niveau = niveauClasse(edition.code);
  const chapitres = [...new Set(Object.values(v.etapes).filter((x) => x.niveau === niveau && x.chapitre).map((x) => x.chapitre))];
  return {
    titre: edition.nouvelle ? `Nouvelle étape · ${nomClasse(edition.code)}` : 'Modifier l’étape',
    corps: html`<form class="section-feuille" data-envoi="etape-enregistrer" id="form-etape">
      <label class="champ"><span>Intitulé</span><input type="text" name="titre" value="${e.titre || ''}" required autofocus placeholder="Activité 5 – Le sol, un milieu vivant"></label>
      <label class="champ"><span>Chapitre ou séquence</span><input type="text" name="chapitre" value="${e.chapitre || ''}" list="chapitres-niveau" placeholder="Chapitre 2 — Le sol, un milieu vivant">
        <datalist id="chapitres-niveau">${chapitres.map((x) => html`<option value="${x}"></option>`)}</datalist></label>
      <div class="grille-champs">
        <label class="champ"><span>Durée</span><select name="duree">${dureesAvec(Number(e.duree) || 1).map((d) => html`<option value="${d}"${Math.abs(d - (Number(e.duree) || 1)) < EPS ? ' selected' : ''}>${seancesLisible(d)}</option>`)}</select></label>
        <label class="champ"><span>Format</span><select name="format">${Object.entries(FORMATS).map(([k, v]) => html`<option value="${k}"${(e.format || 'indiff') === k ? ' selected' : ''}>${v}</option>`)}</select></label>
        <label class="champ"><span>Photocopies (pages par élève)</span><input type="number" name="photocopies" min="0" max="20" value="${Number(e.photocopies) || 0}"></label>
      </div>
      <label class="coche"><input type="checkbox" name="eval"${e.eval ? ' checked' : ''}><span>C'est une évaluation — le Carnet rappelle de l'annoncer, et ne la coupe pas sur deux cours</span></label>
      <label class="coche"><input type="checkbox" name="insecable"${e.insecable ? ' checked' : ''}><span>Ne pas couper sur deux cours (un TP, une sortie…)</span></label>
      <label class="champ"><span>Jalons — là où l'on peut s'arrêter en cours d'étape</span>
        <select data-change="etape-modele">${Object.entries(MODELES_JALONS).map(([k, m]) => html`<option value="${k}"${modele && modele[0] === k ? ' selected' : ''}>${m.nom}</option>`)}${!modele ? html`<option value="" selected>Jalons personnalisés</option>` : ''}</select></label>
      <label class="champ"><span>Un jalon par ligne (modifiable)</span><textarea name="jalons" rows="5">${(e.jalons || []).join('\n')}</textarea></label>
      <label class="champ"><span>Matériel à prévoir</span><input type="text" name="afaire" value="${e.afaire || ''}" placeholder="Microscopes, lames, épiderme d'oignon"></label>
      <label class="champ"><span>Texte pour le cahier de textes Pronote</span><textarea name="pronote" placeholder="Écrit une fois, repris pour toutes les classes du niveau">${e.pronote || ''}</textarea></label>
      <div class="grille-champs">
        <label class="champ"><span>Travail à faire (donné à la fin de l'étape)</span><input type="text" name="devoirs" value="${e.devoirs || ''}" placeholder="Apprendre le bilan"></label>
        <label class="champ"><span>Semaine visée (facultatif)</span><input type="date" name="cible" value="${e.cible || ''}"></label>
      </div>
      ${!edition.nouvelle && partage > 1 ? html`<p class="aide">Cette étape est dans la file de ${partage} classes : la modifier la modifie pour toutes.</p>` : ''}
    </form>`,
    pied: html`${!edition.nouvelle ? html`<button class="btn danger" data-action="etape-supprimer">Supprimer l'étape</button>` : ''}
      <button class="btn" data-action="fermer-feuille">Annuler</button>
      <button class="btn plein" type="submit" form="form-etape">${icone('valider')} Enregistrer</button>`,
  };
}

actions['etape-nouvelle'] = (el) => {
  const code = el.dataset.code;
  // La nouvelle étape reprend le chapitre de la dernière de la file : on écrit souvent à la suite.
  const c = calc(), file = (c.v.classes[code].file || []).filter((it) => c.v.etapes[it.eid]);
  const dernier = file.length ? c.v.etapes[file[file.length - 1].eid].chapitre || '' : '';
  edition = { code, u: null, eid: null, nouvelle: true, donnees: { titre: '', chapitre: dernier, duree: 1, format: 'indiff', eval: false, jalons: MODELES_JALONS.demarche.jalons, photocopies: 0, afaire: '', pronote: '', devoirs: '', cible: '' } };
  ouvrirFeuille(feuilleEtape, { surFermeture: () => { edition = null; } });
};
// Depuis un cours de l'emploi du temps : l'étape se glisse dans la file à l'endroit où ce cours
// commence, et tombe donc sur lui (les étapes d'après glissent d'un cran).
export function nouvelleEtapeAuCours(cle) {
  const c = calc();
  const cr = c.tousCreneaux.find((x) => x.cle === cle);
  if (!cr || !c.v.classes[cr.code]) return;
  const segs = ((c.plan.parCreneau[cle] || {}).segments || []).filter((s) => !s.recul);
  const file = c.v.classes[cr.code].file || [];
  let avantU = null;
  if (segs.length) {
    const k = file.findIndex((it) => it.u === segs[0].u);
    // Une étape commencée dans un cours précédent se finit d'abord : on se place juste après.
    const j = segs[0].de < EPS ? k : k + 1;
    avantU = j >= 0 && j < file.length ? file[j].u : null;
  }
  const precedente = avantU ? file[file.findIndex((it) => it.u === avantU) - 1] : file[file.length - 1];
  edition = {
    code: cr.code, u: null, eid: null, nouvelle: true, avantU, jour: cr.jour,
    donnees: { titre: '', chapitre: (precedente && (c.v.etapes[precedente.eid] || {}).chapitre) || '', duree: 1, format: 'indiff', eval: false, jalons: MODELES_JALONS.demarche.jalons, photocopies: 0, afaire: '', pronote: '', devoirs: '', cible: '' },
  };
  ouvrirFeuille(feuilleEtape, { surFermeture: () => { edition = null; } });
}
actions['etape-ici'] = (el) => nouvelleEtapeAuCours(el.dataset.cle);
actions['etape-editer'] = (el) => {
  const { code, u } = el.dataset;
  const c = calc();
  const it = (c.v.classes[code].file || []).find((x) => x.u === u);
  if (!it) return;
  edition = { code, u, eid: it.eid, nouvelle: false, donnees: structuredClone(c.v.etapes[it.eid]) };
  ouvrirFeuille(feuilleEtape, { surFermeture: () => { edition = null; } });
};
changements['etape-modele'] = (el) => {
  const m = MODELES_JALONS[el.value];
  const zone = document.querySelector('#form-etape [name="jalons"]');
  if (m && zone) zone.value = m.jalons.join('\n');
};
envois['etape-enregistrer'] = (f) => {
  if (!edition) return;
  const d = {
    ...edition.donnees,
    titre: f.titre.value.trim(),
    duree: Number(f.duree.value) || 1,
    format: f.format.value,
    eval: f.eval.checked,
    insecable: f.insecable.checked,
    photocopies: Math.max(0, Math.round(Number(f.photocopies.value) || 0)),
    jalons: f.jalons.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12),
    afaire: f.afaire.value.trim(),
    pronote: f.pronote.value.trim(),
    chapitre: f.chapitre.value.trim(),
    devoirs: f.devoirs.value.trim(),
    // La semaine, pas le jour : on garde son lundi, c'est à lui qu'on compare la date prévue.
    cible: /^\d{4}-\d{2}-\d{2}$/.test(f.cible.value) ? lundiDe(f.cible.value) : '',
    niveau: niveauClasse(edition.code),
  };
  delete d._m;
  if (!d.titre) { toast('Donnez un intitulé à l’étape.'); return; }
  const { nouvelle, code, avantU, jour } = edition;
  const eid = edition.eid || nouvelId(`e${d.niveau}-`);
  ecrireDoc(`etapes/${eid}`, d);
  if (nouvelle) {
    const u = nouvelId('u');
    modifierDoc(`classes/${code}`, (cl) => {
      const f = [...(cl.file || [])], k = avantU ? f.findIndex((it) => it.u === avantU) : -1;
      f.splice(k >= 0 ? k : f.length, 0, { u, eid });
      cl.file = f;
      // « Arrêtés au tout début de l'étape X » voulait dire « tout ce qui précède X est fait » :
      // l'arrêt passe au début de la nouvelle étape, sinon elle serait comptée comme déjà faite.
      if (avantU && cl.depart && cl.depart.u === avantU && !(cl.depart.f > EPS)) cl.depart = { ...cl.depart, u };
    });
    if (avantU) {
      for (const [cle, j] of Object.entries(calc().v.journal || {})) {
        if (j && j.code === code && j.arret && j.arret.u === avantU && !(j.arret.f > EPS)) modifierDoc(`journal/${cle}`, (x) => { x.arret = { ...x.arret, u }; });
      }
    }
  }
  fermerFeuille();
  if (nouvelle && jour) { toast(`Étape prévue pour le cours du ${dateCourte(jour)} ; la suite glisse d'un cran.`); return; }
  toast(nouvelle ? 'Étape ajoutée à la fin de la file.' : 'Étape enregistrée.');
};
actions['etape-supprimer'] = (el) => {
  if (!edition) return;
  if (el.dataset.confirme !== '1') { el.dataset.confirme = '1'; el.textContent = 'Supprimer partout ?'; return; }
  const eid = edition.eid;
  for (const [code, cl] of Object.entries(calc().v.classes)) {
    if ((cl.file || []).some((it) => it.eid === eid)) modifierDoc(`classes/${code}`, (x) => { x.file = x.file.filter((it) => it.eid !== eid); });
  }
  supprimerDoc(`etapes/${eid}`);
  fermerFeuille();
  toast('Étape supprimée de toutes les files.');
};

const deplacerEtape = (code, i, sens) => modifierDoc(`classes/${code}`, (cl) => {
  const j = i + sens;
  if (j < 0 || j >= cl.file.length) return;
  [cl.file[i], cl.file[j]] = [cl.file[j], cl.file[i]];
});
actions['etape-monter'] = (el) => deplacerEtape(el.dataset.code, Number(el.dataset.i), -1);
actions['etape-descendre'] = (el) => deplacerEtape(el.dataset.code, Number(el.dataset.i), 1);
actions['etape-retirer'] = (el) => {
  if (el.dataset.confirme !== '1') { el.dataset.confirme = '1'; el.innerHTML = 'Retirer ?'; setTimeout(() => { if (el.isConnected) { el.dataset.confirme = ''; el.innerHTML = String(icone('croix')); } }, 3000); return; }
  const { code, u } = el.dataset;
  modifierDoc(`classes/${code}`, (cl) => { cl.file = cl.file.filter((it) => it.u !== u); });
  toast('Étape retirée de la file (elle reste disponible pour le niveau).');
};
changements['etape-reprendre'] = (el) => {
  if (!el.value) return;
  const eid = el.value, code = el.dataset.code;
  modifierDoc(`classes/${code}`, (cl) => { cl.file = [...(cl.file || []), { u: nouvelId('u'), eid }]; });
  toast('Étape ajoutée à la fin de la file.');
};

// Même file pour une autre classe du niveau : on garde ce qu'elle a déjà, on ajoute ce qui manque, dans l'ordre.
actions['file-copier'] = (el) => {
  const code = el.dataset.code, c = calc();
  const autres = Object.keys(c.v.classes).filter((k) => k !== code && c.v.classes[k].niveau === c.v.classes[code].niveau);
  ouvrirFeuille(() => ({
    titre: `La file de la ${nomClasse(code)} pour…`,
    corps: html`<p class="aide">Les étapes absentes sont ajoutées dans le même ordre. Les validations déjà faites ne bougent pas.</p>
      ${autres.map((k) => html`<label class="coche"><input type="checkbox" name="cible" value="${k}" checked><span>${nomClasse(k)}</span></label>`)}`,
    pied: html`<button class="btn" data-action="fermer-feuille">Annuler</button><button class="btn plein" data-action="file-copier-ok" data-code="${code}">Appliquer</button>`,
  }));
};
actions['file-copier-ok'] = (el) => {
  const c = calc(), source = c.v.classes[el.dataset.code].file || [];
  const cibles = [...document.querySelectorAll('dialog.feuille input[name="cible"]:checked')].map((x) => x.value);
  for (const k of cibles) {
    modifierDoc(`classes/${k}`, (cl) => {
      const existants = new Map((cl.file || []).map((it) => [it.eid, it]));
      cl.file = source.map((it) => existants.get(it.eid) || { u: nouvelId('u'), eid: it.eid });
      for (const it of cl.file) existants.delete(it.eid);
      cl.file.push(...existants.values());
    });
  }
  fermerFeuille();
  toast(`File appliquée à ${cibles.length} classe${cibles.length > 1 ? 's' : ''}.`);
};

// Point de départ : où en était la classe quand le suivi a commencé.
actions['classe-depart'] = (el) => {
  const code = el.dataset.code;
  ouvrirFeuille(() => {
    const c = calc(), cl = c.v.classes[code], file = (cl.file || []).filter((it) => c.v.etapes[it.eid]);
    const actuel = cl.depart ? file.findIndex((it) => it.u === cl.depart.u) : 0;
    return {
      titre: `Point de départ · ${nomClasse(code)}`,
      corps: html`<p class="aide">Pour une classe reprise en cours d'année : la première étape PAS encore faite au début du suivi. Les validations de cours, elles, priment toujours.</p>
        <div class="liste">${file.map((it, i) => html`<label class="coche"><input type="radio" name="depart" value="${i}"${i === Math.max(0, actuel) ? ' checked' : ''}><span>${c.v.etapes[it.eid].titre}</span></label>`)}
        <label class="coche"><input type="radio" name="depart" value="${file.length}"${actuel >= file.length ? ' checked' : ''}><span>Toute la file était déjà faite</span></label></div>`,
      pied: html`<button class="btn" data-action="fermer-feuille">Annuler</button><button class="btn plein" data-action="classe-depart-ok" data-code="${code}">Enregistrer</button>`,
    };
  });
};
actions['classe-depart-ok'] = (el) => {
  const code = el.dataset.code, c = calc();
  const file = (c.v.classes[code].file || []).filter((it) => c.v.etapes[it.eid]);
  const i = Number(document.querySelector('dialog.feuille input[name="depart"]:checked')?.value || 0);
  modifierDoc(`classes/${code}`, (cl) => { cl.depart = arretDe({ i, f: 0 }, file); });
  fermerFeuille();
  toast('Point de départ enregistré.');
};

// Fiche de la classe : nom, niveau, effectif, masquer.
actions['classe-modifier'] = (el) => {
  const code = el.dataset.code;
  ouvrirFeuille(() => {
    const cl = calc().v.classes[code];
    return {
      titre: `Classe ${code}`,
      corps: html`<form class="section-feuille" data-envoi="classe-enregistrer" data-code="${code}" id="form-classe">
        <div class="grille-champs">
          <label class="champ"><span>Nom affiché</span><input type="text" name="nom" value="${cl.nom || code}" required></label>
          <label class="champ"><span>Niveau</span><select name="niveau">${['6e', '5e', '4e', '3e', '2nde', '1re', 'Tle', 'Autre'].map((n) => html`<option${n === cl.niveau ? ' selected' : ''}>${n}</option>`)}</select></label>
          <label class="champ"><span>Effectif (pour les photocopies)</span><input type="number" name="effectif" min="0" max="60" value="${cl.effectif || ''}"></label>
        </div></form>`,
      pied: html`<button class="btn danger" data-action="classe-masquer" data-code="${code}">Ne plus suivre</button><button class="btn" data-action="fermer-feuille">Annuler</button><button class="btn plein" type="submit" form="form-classe">Enregistrer</button>`,
    };
  });
};
envois['classe-enregistrer'] = (f) => {
  const code = f.dataset.code;
  modifierDoc(`classes/${code}`, (cl) => { cl.nom = f.nom.value.trim() || code; cl.niveau = f.niveau.value; cl.effectif = Math.max(0, Number(f.effectif.value) || 0); });
  fermerFeuille();
  toast('Classe enregistrée.');
};
actions['classe-masquer'] = (el) => { modifierDoc(`classes/${el.dataset.code}`, (cl) => { cl.masquee = true; }); fermerFeuille(); toast('Classe masquée. Elle reste récupérable en bas de la page.'); };
actions['classe-afficher'] = (el) => modifierDoc(`classes/${el.dataset.code}`, (cl) => { cl.masquee = false; });
actions['classe-ajouter'] = () => {
  const c = calc();
  const libres = c.inconnus;
  ouvrirFeuille(() => ({
    titre: 'Ajouter une classe',
    corps: html`${libres.length ? html`<p>Pronote montre ces classes, pas encore suivies :</p><div class="outils">${libres.map((k) => html`<button class="btn" data-action="suivre-classe" data-code="${k}">${icone('plus')} ${k}</button>`)}</div>` : html`<p class="aide">Toutes les classes de l'emploi du temps sont déjà suivies.</p>`}
      <p class="aide">Une classe n'apparaît ici que si elle a des cours dans l'emploi du temps lu.</p>`,
  }));
};
// Suivre les classes que Pronote montre, ou ne plus les proposer.
export function suivre(codes) {
  const detectees = classesDetectees();
  for (const code of codes) {
    if (calc().v.classes[code]) { modifierDoc(`classes/${code}`, (cl) => { cl.masquee = false; }); continue; }
    const d = detectees.find((x) => x.code === code) || { nom: code, niveau: niveauDe(code) };
    ecrireDoc(`classes/${code}`, { code, nom: d.nom, niveau: d.niveau, effectif: 0, file: [], annonces: {} });
  }
}
actions['suivre-classe'] = (el) => { suivre([el.dataset.code]); fermerFeuille(); toast(`${el.dataset.code} est suivie : ajoutez-lui des étapes.`); };
actions['suivre-toutes'] = () => { const l = calc().inconnus; suivre(l); toast(`${l.length} classe(s) suivie(s).`); };
actions['ignorer-inconnues'] = () => {
  const l = calc().inconnus;
  modifierReglages((r) => { r.exclus = [...new Set([...(r.exclus || []), ...l])]; });
  toast('Ces cours ne seront plus proposés (réversible dans les réglages).');
};
export { redessinerFeuille };
