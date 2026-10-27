// Le cahier de textes, rangé comme celui de Pronote : pour chaque cours, le contenu de la séance
// et le travail à faire pour le cours suivant, prêts à recopier. Le sens est Carnet → Pronote :
// Pronote n'exporte pas son cahier de textes (le lien iCal ne contient que l'emploi du temps), et
// le lire supposerait le mot de passe Pronote, que le Carnet ne demande jamais. Le texte suit donc
// ce qui a vraiment été fait : on dit où la classe s'est arrêtée (« Où en est-on ? »), puis on
// copie ; copier vaut « saisi », avec de quoi annuler.
import { actions } from '../actions.js';
import { html, icone, toast, copier } from '../ui.js';
import { calc, etat, changer, reglerLocal, ecrireDoc, supprimerDoc } from '../etat.js';
import { ajouteJours, dateCourte, dateLongue, jourMois, lundiDe } from '../dates.js';
import { semaineUtile } from '../moteur.js';
import { pastille, styleNiveau, horaires, textePronote, travailCours, etiquetteEtat } from './commun.js';

let lundiAffiche = null;

/** L'adresse de Pronote (réglée dans Mes données, ou devinée dans le lien iCal) : https://…/pronote/ */
export function adressePronote() {
  const r = calc().v.reglages;
  if (r.adressePronote) return r.adressePronote;
  const m = String((etat.local.ics && etat.local.ics.url) || '').match(/^(https:\/\/[^/?#]+\/pronote\/)/i);
  return m ? m[1] : '';
}
export const cleCahier = (cle) => `cdt_${cle}`;
export const estSaisi = (v, cle) => !!(v.coches[cleCahier(cle)] && v.coches[cleCahier(cle)].fait);

/** Les cours passés (ou commencés) dont le cahier de textes reste à saisir, du plus ancien au plus récent. */
export function cahiersNonSaisis() {
  const c = calc();
  const debut = c.v.reglages.debut || '0000-01-01';
  return c.creneaux.filter((cr) => {
    if (cr.annule || cr.debut > c.maintenant || cr.jour < debut || estSaisi(c.v, cr.cle)) return false;
    const pc = c.plan.parCreneau[cr.cle];
    return pc && (pc.etat === 'valide' || pc.etat === 'prevu') && (pc.segments || []).some((s) => !s.recul);
  }).sort((a, b) => a.debut - b.debut);
}

/** Le texte complet d'un cours : contenu, puis le travail à faire. */
export function texteCahier(cr, quoi = 'tout') {
  const contenu = textePronote(cr);
  const t = travailCours(cr);
  const travail = t ? `${t.pour ? `Pour le ${dateLongue(t.pour)} : ` : ''}${t.texte}` : '';
  if (quoi === 'contenu') return contenu;
  if (quoi === 'travail') return travail;
  return [contenu, travail ? `Travail à faire — ${travail}` : ''].filter(Boolean).join('\n\n');
}

export function ligneCahier(cr, { date = true } = {}) {
  const c = calc();
  const pc = c.plan.parCreneau[cr.cle] || {};
  const contenu = textePronote(cr);
  const t = travailCours(cr);
  const saisi = estSaisi(c.v, cr.cle);
  return html`<li class="cdt${saisi ? ' saisi' : ''}${cr.annule ? ' annule' : ''}" style="${styleNiveau(cr.code)}">
    <div class="cours-haut"><span class="heure">${date ? `${dateCourte(cr.jour)} · ` : ''}${horaires(cr)}</span>${pastille(cr.code)}${cr.salle ? html`<span>salle ${cr.salle}</span>` : ''}${etiquetteEtat(cr)}
      ${pc.aValider ? html`<span class="aide">contenu prévu, pas encore validé</span>` : ''}</div>
    ${cr.annule ? html`<p class="vide petit">${cr.statut || 'Cours annulé'}.</p>` : html`
    <div class="cdt-bloc"><h4>Contenu de la séance</h4>
      ${contenu ? html`<pre class="pronote-texte">${contenu}</pre>` : html`<p class="vide petit">Rien de prévu pour ce cours.</p>`}</div>
    ${t ? html`<div class="cdt-bloc"><h4>Travail à faire${t.pour ? html` pour le ${dateCourte(t.pour)}` : ''}</h4><pre class="pronote-texte">${t.texte}</pre></div>` : ''}
    <div class="cours-actions">
      ${pc.aValider ? html`<button class="btn mini plein" data-action="valider" data-cle="${cr.cle}">${icone('valider')} Où en est-on ?</button>` : ''}
      ${contenu ? html`<button class="btn mini${pc.aValider ? '' : ' plein'}" data-action="cdt-copier" data-cle="${cr.cle}" data-quoi="tout" title="Le contenu et le travail à faire, d'un coup">${icone('copier')} Copier pour Pronote</button>` : ''}
      ${contenu && t ? html`<button class="btn mini discret" data-action="cdt-copier" data-cle="${cr.cle}" data-quoi="contenu">Contenu seul</button><button class="btn mini discret" data-action="cdt-copier" data-cle="${cr.cle}" data-quoi="travail">Travail seul</button>` : ''}
      ${adressePronote() ? html`<a class="btn mini discret" href="${adressePronote()}" target="_blank" rel="noopener">${icone('ouvrir')} Ouvrir Pronote</a>` : ''}
      <label class="coche cdt-saisi"><input type="checkbox" data-change="coche" data-id="${cleCahier(cr.cle)}"${saisi ? ' checked' : ''}><span>Saisi dans Pronote</span></label>
    </div>`}
  </li>`;
}

function semaine() {
  const c = calc();
  if (!lundiAffiche) lundiAffiche = semaineUtile(c.tousCreneaux, c.auj);
  return lundiAffiche;
}

export function rendreCahier() {
  const c = calc();
  const vue = etat.local.vueCahier || 'a-saisir';
  const nonSaisis = cahiersNonSaisis();
  let corps;
  if (vue === 'a-saisir') {
    // Le plus récent d'abord : c'est celui qu'on saisit en sortant de cours.
    corps = nonSaisis.length
      ? html`<ul class="liste cdt-liste">${[...nonSaisis].reverse().map((cr) => ligneCahier(cr))}</ul>
        ${nonSaisis.length > 1 ? html`<div class="outils"><button class="btn mini discret" data-action="cdt-tout-saisi">${icone('valider')} Tout marquer comme saisi (${nonSaisis.length})</button></div>` : ''}`
      : html`<p class="vide">${icone('valider')} Tous les cahiers de textes sont saisis. Les prochains apparaîtront ici après chaque cours.</p>`;
  } else {
    const lundi = semaine();
    const jours = [0, 1, 2, 3, 4, 5].map((k) => ajouteJours(lundi, k));
    corps = html`<div class="semaine-outils">
        <button class="btn-rond" data-action="cdt-avant" aria-label="Semaine précédente">${icone('gauche')}</button>
        <h2>Semaine du ${jourMois(lundi)} au ${jourMois(ajouteJours(lundi, 4))}</h2>
        <button class="btn-rond" data-action="cdt-apres" aria-label="Semaine suivante">${icone('droite')}</button>
        ${lundi !== semaineUtile(c.tousCreneaux, c.auj) ? html`<button class="btn mini" data-action="cdt-auj">Revenir à cette semaine</button>` : ''}
      </div>
      ${jours.map((j) => {
        const crs = c.creneaux.filter((x) => x.jour === j).sort((a, b) => a.debut - b.debut);
        if (!crs.length) return '';
        return html`<section class="jour-cdt${j === c.auj ? ' auj' : ''}"><h3>${dateLongue(j)}</h3><ul class="liste cdt-liste">${crs.map((cr) => ligneCahier(cr, { date: false }))}</ul></section>`;
      })}
      ${jours.every((j) => !c.creneaux.some((x) => x.jour === j)) ? html`<p class="vide">Pas de cours suivi cette semaine.</p>` : ''}`;
  }
  return html`
    <div class="titre-page"><div><h1>Cahier de textes</h1><p>Après le cours : <b>Où en est-on ?</b> (le texte suit ce qui a vraiment été fait, même si la séance a débordé ou s'est arrêtée plus tôt), puis <b>Copier pour Pronote</b> et coller dans Pronote. Le texte s'écrit une fois par étape et vaut pour toutes les classes du niveau.</p></div></div>
    <div class="segmente" role="group" aria-label="Affichage">
      <button data-action="cdt-vue" data-vue="a-saisir" aria-pressed="${vue === 'a-saisir'}">Non saisis${nonSaisis.length ? ` (${nonSaisis.length})` : ''}</button>
      <button data-action="cdt-vue" data-vue="semaine" aria-pressed="${vue === 'semaine'}">Par semaine</button>
    </div>
    ${corps}
    <p class="aide">Le texte d'une étape se règle dans Progressions (crayon de l'étape) : « Texte pour le cahier de textes » et « Travail à faire ». Il vaut pour toutes les classes du niveau.</p>`;
}

actions['cdt-vue'] = (el) => reglerLocal({ vueCahier: el.dataset.vue });
// Pour repartir de zéro (ce qui a été saisi dans Pronote avant le Carnet) : un second toucher confirme.
actions['cdt-tout-saisi'] = (el) => {
  if (el.dataset.confirme !== '1') { el.dataset.confirme = '1'; el.textContent = 'Vraiment tout ? Toucher encore pour confirmer'; return; }
  const l = cahiersNonSaisis();
  for (const cr of l) ecrireDoc(`coches/${cleCahier(cr.cle)}`, { fait: true });
  toast(`${l.length} cours marqué${l.length > 1 ? 's' : ''} comme saisi${l.length > 1 ? 's' : ''}.`);
};
actions['cdt-avant'] = () => { lundiAffiche = ajouteJours(semaine(), -7); changer(); };
actions['cdt-apres'] = () => { lundiAffiche = ajouteJours(semaine(), 7); changer(); };
actions['cdt-auj'] = () => { lundiAffiche = null; changer(); };
actions['cdt-copier'] = async (el) => {
  const cr = calc().tousCreneaux.find((x) => x.cle === el.dataset.cle);
  if (!cr) return;
  const ok = await copier(texteCahier(cr, el.dataset.quoi), el.closest('.cdt')?.querySelector('.pronote-texte'));
  if (!ok) { toast('La copie a été refusée : le texte est sélectionné, faites Ctrl+C.'); return; }
  // Copier pour Pronote, c'est le saisir : le cours quitte la liste, « Annuler » l'y remet.
  const cle = cleCahier(cr.cle), deja = estSaisi(calc().v, cr.cle);
  if (el.dataset.quoi === 'tout' && !deja) {
    ecrireDoc(`coches/${cle}`, { fait: true });
    toast('Copié : collez-le dans Pronote. Marqué « saisi ».', { action: { libelle: 'Annuler', faire: () => supprimerDoc(`coches/${cle}`) } });
  } else toast('Copié : collez-le dans le cahier de textes de Pronote.');
};
export { lundiDe };
