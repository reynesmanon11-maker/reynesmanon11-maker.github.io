// À faire : les tâches écrites à la main, et ce que le Carnet déduit tout seul de la progression
// (cours à valider, cours sans contenu, évaluations à annoncer, photocopies).
import { actions, envois } from '../actions.js';
import { html, icone, toast } from '../ui.js';
import { calc, ecrireDoc, supprimerDoc, nomClasse } from '../etat.js';
import { dateCourte, jourRelatif, ajouteJours } from '../dates.js';
import { aPreparer, seancesLisible } from '../moteur.js';
import { nouvelId } from '../donnees.js';
import { pastille } from './commun.js';

export function rendreTaches() {
  const c = calc();
  const toutes = Object.entries(c.v.taches).map(([id, t]) => ({ id, ...t }));
  const tri = (a, b) => String(a.pour || '9999').localeCompare(String(b.pour || '9999')) || String(a.cree || '').localeCompare(String(b.cree || ''));
  const aFaire = toutes.filter((t) => !t.fait).sort(tri), faites = toutes.filter((t) => t.fait).sort(tri);
  const ligne = (t) => html`<li class="tache-ligne">
    <label class="coche${t.fait ? ' faite' : ''}"><input type="checkbox" data-change="tache-faite" data-id="${t.id}"${t.fait ? ' checked' : ''}><span>${t.texte}
      ${t.classe || t.pour ? html`<br><span class="aide">${t.classe ? nomClasse(t.classe) : ''}${t.classe && t.pour ? ' · ' : ''}${t.pour ? html`<span class="${!t.fait && t.pour < c.auj ? 'retard' : ''}">pour ${jourRelatif(t.pour, c.auj)}</span>` : ''}</span>` : ''}</span></label>
    <span class="mini-outils"><button data-action="tache-supprimer" data-id="${t.id}" aria-label="Supprimer « ${t.texte} »">${icone('corbeille')}</button></span></li>`;

  const aValider = c.creneaux.filter((x) => (c.plan.parCreneau[x.cle] || {}).aValider);
  const limite = ajouteJours(c.auj, 14);
  const vides = c.creneaux.filter((x) => x.fin > c.maintenant && x.jour <= limite && ((c.plan.parCreneau[x.cle] || {}).libre || 0) > 0.01);
  const annonces = c.creneaux.filter((x) => x.jour >= c.auj).flatMap((x) => (c.plan.annonces[x.cle] || []).map((a) => ({ x, a })));
  const prep = aPreparer(c.v, c.plan, c.creneaux, { auj: c.auj, jours: 7 }).filter((p) => !(c.v.coches[p.id] && c.v.coches[p.id].fait));

  return html`
    <div class="titre-page"><div><h1>À faire</h1><p>Vos tâches, et ce que le Carnet déduit de votre progression.</p></div></div>
    <div class="classes">
      <section class="carte"><h2>Mes tâches</h2>
        <form class="section-feuille" data-envoi="tache-ajouter" style="margin-top:10px">
          <input type="text" name="texte" id="tache-texte" placeholder="ex. demander les clés du labo" aria-label="Nouvelle tâche" autocomplete="off" required>
          <div class="grille-champs">
            <label class="champ"><span>Classe</span><select name="classe"><option value="">Toutes</option>${Object.keys(c.v.classes).sort().map((k) => html`<option value="${k}">${nomClasse(k)}</option>`)}</select></label>
            <label class="champ"><span>Pour le</span><input type="date" name="pour"></label>
          </div>
          <div><button class="btn plein" type="submit">${icone('plus')} Ajouter</button></div>
        </form>
        ${aFaire.length ? html`<ul class="liste" style="margin-top:12px">${aFaire.map(ligne)}</ul>` : html`<p class="vide" style="margin-top:12px">Rien en attente.</p>`}
        ${faites.length ? html`<details style="margin-top:12px"><summary class="aide">${faites.length} tâche${faites.length > 1 ? 's' : ''} faite${faites.length > 1 ? 's' : ''}</summary>
          <ul class="liste" style="margin-top:8px">${faites.map(ligne)}</ul><button class="btn mini" data-action="taches-effacer-faites" style="margin-top:8px">Effacer les tâches faites</button></details>` : ''}
      </section>
      <section class="carte"><h2>Déduit de la progression</h2>
        <div class="section-feuille" style="margin-top:10px">
          <h3 class="aide">Cours à valider (${aValider.length})</h3>
          ${aValider.length ? html`<div class="outils">${aValider.map((x) => html`<button class="btn mini" data-action="valider" data-cle="${x.cle}">${nomClasse(x.code)} · ${dateCourte(x.jour)}</button>`)}</div>` : html`<p class="vide petit">Tout est validé.</p>`}
          <h3 class="aide">Cours sans contenu d'ici deux semaines (${vides.length})</h3>
          ${vides.length ? html`<ul class="liste">${vides.map((x) => html`<li class="tache-ligne"><span>${dateCourte(x.jour)} ${pastille(x.code)} ${(c.plan.parCreneau[x.cle].libre >= 0.99) ? 'rien de prévu' : `reste ${seancesLisible(c.plan.parCreneau[x.cle].libre)}`}</span><a class="btn mini" href="#/classes/${x.code}">Préparer</a></li>`)}</ul>` : html`<p class="vide petit">Tout est prévu.</p>`}
          <h3 class="aide">Évaluations à annoncer (${annonces.length})</h3>
          ${annonces.length ? html`<ul class="liste">${annonces.map(({ x, a }) => html`<li class="annonce${a.tard ? ' tard' : ''}"><span>${pastille(a.code)} ${a.titre} (${dateCourte(a.jourEval)}) — ${a.tard ? 'dès' : ''} ${jourRelatif(x.jour, c.auj)}</span><button class="btn mini" data-action="annonce-faite" data-code="${a.code}" data-u="${a.u}">Fait</button></li>`)}</ul>` : html`<p class="vide petit">Rien à annoncer.</p>`}
          <h3 class="aide">À photocopier ou sortir cette semaine (${prep.length})</h3>
          ${prep.length ? html`<ul class="liste">${prep.map((p) => html`<li><label class="coche"><input type="checkbox" data-change="coche" data-id="${p.id}"><span>${dateCourte(p.jour)} · ${nomClasse(p.code)} — ${c.v.etapes[p.eid].titre}<br><span class="aide">${[p.pages ? (p.effectif ? `${p.effectif * p.pages} copies` : `${p.pages} p./élève`) : '', p.afaire].filter(Boolean).join(' · ')}</span></span></label></li>`)}</ul>` : html`<p class="vide petit">Rien.</p>`}
        </div>
      </section>
    </div>`;
}

envois['tache-ajouter'] = (f) => {
  const texte = f.texte.value.trim();
  if (!texte) return;
  ecrireDoc(`taches/${nouvelId('t')}`, { texte, classe: f.classe.value, pour: f.pour.value, fait: false, cree: new Date().toISOString() });
  f.reset();
  toast('Tâche ajoutée.');
};
actions['tache-supprimer'] = (el) => { supprimerDoc(`taches/${el.dataset.id}`); toast('Tâche supprimée.'); };
actions['taches-effacer-faites'] = () => {
  const faites = Object.entries(calc().v.taches).filter(([, t]) => t.fait);
  for (const [id] of faites) supprimerDoc(`taches/${id}`);
  toast(`${faites.length} tâche(s) effacée(s).`);
};
