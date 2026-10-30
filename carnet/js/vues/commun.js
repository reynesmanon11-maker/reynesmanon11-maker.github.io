// Morceaux d'affichage partagés : pastille de classe, horaires, contenu prévu d'un créneau,
// carte de cours (utilisée par l'accueil et la semaine).
import { html, icone, toast, copier } from '../ui.js';
import { actions } from '../actions.js';
import { calc, nomClasse, niveauClasse, couleurNiveau } from '../etat.js';
import { heureDe, heureLisible, dateCourte } from '../dates.js';
import { reprise, jusqua, seancesLisible, jalonsDe, EPS } from '../moteur.js';

export function pastille(code, extra = '') {
  const { v } = calc();
  return html`<span class="classe-pastille" style="--niv:${couleurNiveau(niveauClasse(code, v), v)}">${nomClasse(code, v)}${extra ? ` ${extra}` : ''}</span>`;
}

export const styleNiveau = (code) => { const { v } = calc(); return `--niv:${couleurNiveau(niveauClasse(code, v), v)}`; };

/** « 9h20–10h15 », ou pour des demi-groupes « 9h20 P2 · 10h35 P1 ». */
export function horaires(cr) {
  const { fuseau } = calc();
  const h = (d) => heureLisible(heureDe(d, fuseau));
  if (cr.demi && cr.parties.length > 1) return cr.parties.map((p) => `${h(p.debut)} ${p.groupe}`).join(' · ');
  const g = cr.demi && cr.groupes.length ? ` ${cr.groupes.join('')}` : '';
  return `${h(cr.debut)}–${h(cr.fin)}${g}`;
}

/** Ce qui est prévu, ou ce qui a été fait, dans un créneau. */
export function segments(cr, { court = false, modifiable = false } = {}) {
  const { v, plan } = calc();
  const pc = plan.parCreneau[cr.cle] || null;
  if (!pc) return html`<p class="vide petit">Classe non suivie</p>`;
  if (pc.etat === 'annule') return html`<p class="vide petit">${cr.statut || 'Cours annulé'} : la suite glisse au cours suivant.</p>`;
  if (pc.etat === 'couvert') return html`<p class="vide petit">Non validé — couvert par un point d'arrêt plus récent.</p>`;
  const lignes = [];
  if (pc.segments.some((s) => s.recul)) lignes.push(html`<div class="segment"><span class="quoi">Retour en arrière dans la file</span></div>`);
  for (const s of pc.segments.filter((x) => !x.recul)) {
    const e = v.etapes[s.eid] || { titre: '(étape supprimée)' };
    const r = reprise(s, e), j = jusqua(s, e);
    let ou = '';
    if (pc.etat === 'valide') ou = j.fin ? (r.debut ? '' : `depuis ${r.texte}`) : `jusqu'à ${j.texte}`;
    else if (!r.debut) ou = `reprendre à ${r.texte}${j.fin ? '' : ` → ${j.texte}`}`;
    else if (!j.fin) ou = `jusqu'à ${j.texte}`;
    // Dans la feuille d'un cours, l'étape se touche pour la modifier (intitulé, texte du cahier de textes…).
    const titre = modifiable && v.etapes[s.eid]
      ? html`<button class="segment-modifier" data-action="etape-editer" data-code="${cr.code}" data-u="${s.u}" title="Modifier cette étape">${e.eval ? '✎ ' : ''}${e.titre} ${icone('crayon')}</button>`
      : `${e.eval ? '✎ ' : ''}${e.titre}`;
    lignes.push(html`<div class="segment${e.eval ? ' eval' : ''}">
      <span class="quoi">${titre}${ou && !court ? html` <span class="ou">· ${ou}</span>` : ''}</span>
      <span class="part">${pc.etat === 'valide' ? 'fait' : seancesLisible(s.h)}</span></div>`);
    if (court && ou) lignes.push(html`<div class="segment"><span class="ou">${ou}</span></div>`);
    // Dans la feuille du cours : le déroulé écrit dans l'étape, en entier.
    const J = modifiable ? jalonsDe(e) : [];
    if (J.length) lignes.push(html`<ul class="deroule">${J.map((j) => html`<li>${j}</li>`)}</ul>`);
  }
  if (pc.etat === 'valide' && !pc.segments.length) lignes.push(html`<div class="segment libre"><span class="quoi">Rien d'avancé dans la file</span></div>`);
  if (pc.etat === 'prevu' && pc.libre > 0.01) {
    lignes.push(html`<div class="segment libre"><span class="quoi">${pc.libre >= 0.99 ? 'Rien de prévu : séance à préparer' : 'Temps restant à préparer'}</span><span class="part">${seancesLisible(pc.libre)}</span></div>`);
  }
  return html`<div class="cours-plan">${lignes}</div>`;
}

/** Étiquette d'état d'un créneau. */
export function etiquetteEtat(cr) {
  const { plan, maintenant } = calc();
  const pc = plan.parCreneau[cr.cle];
  if (!pc) return '';
  if (pc.etat === 'annule') return html`<span class="etiquette rouge">${cr.statut || 'annulé'}</span>`;
  if (pc.etat === 'valide') return html`<span class="etiquette ok">${icone('valider')} fait</span>`;
  if (pc.aValider) return html`<span class="etiquette attente">à valider</span>`;
  if (cr.debut <= maintenant && cr.fin > maintenant) return html`<span class="etiquette ok">en cours</span>`;
  return '';
}

/** Le texte du cahier de textes d'un cours : les étapes prévues, et ce qu'elles disent pour Pronote. */
export function textePronote(cr) {
  const { plan, v } = calc();
  const pc = plan.parCreneau[cr.cle];
  if (!pc) return '';
  return pc.segments.filter((s) => !s.recul).map((s) => {
    const e = v.etapes[s.eid] || { titre: '' };
    const suite = s.de > EPS, inacheve = s.a < 1 - EPS;
    const suf = suite && inacheve ? ' (suite)' : suite ? ' (fin)' : inacheve ? ' (début)' : '';
    return `${e.titre}${suf}${e.pronote ? `\n${e.pronote}` : ''}`;
  }).join('\n\n');
}

/**
 * Le travail à faire donné dans un cours : celui des étapes qui s'y terminent (« Apprendre le
 * bilan » se donne à la fin du bilan), pour le cours suivant de la classe.
 */
export function travailCours(cr) {
  const { plan, v, creneaux } = calc();
  const pc = plan.parCreneau[cr.cle];
  if (!pc || !pc.segments) return null;
  const textes = pc.segments.filter((s) => !s.recul && s.a >= 1 - EPS).map((s) => String((v.etapes[s.eid] || {}).devoirs || '').trim()).filter(Boolean);
  if (!textes.length) return null;
  let suivant = null;
  for (const x of creneaux) if (x.code === cr.code && !x.annule && x.debut > cr.debut && (!suivant || x.debut < suivant.debut)) suivant = x;
  return { texte: [...new Set(textes)].join('\n'), pour: suivant ? suivant.jour : null };
}

/** Ce qu'il faut préparer pour un cours à venir : une case à cocher par étape qui y commence. */
export function aPrevoirCours(cr) {
  const { plan, v } = calc();
  const pc = plan.parCreneau[cr.cle];
  if (!pc || pc.etat !== 'prevu') return [];
  const cl = v.classes[cr.code] || {};
  return pc.segments.filter((s) => !s.recul && s.de < EPS).map((s) => ({ s, e: v.etapes[s.eid] }))
    .filter(({ e }) => e && (e.afaire || e.photocopies > 0))
    .map(({ s, e }) => {
      const id = `prep_${cr.cle}_${s.u}`;
      const copies = e.photocopies > 0 ? `Photocopies : ${cl.effectif ? `${cl.effectif} × ${e.photocopies} p. = ${cl.effectif * e.photocopies}` : `${e.photocopies} p. par élève`}` : '';
      return { id, fait: !!(v.coches[id] && v.coches[id].fait), quoi: [e.afaire, copies].filter(Boolean).join(' · '), etape: e.titre };
    });
}

/** Carte d'un cours, avec le prévu, les annonces, le matériel et les boutons. */
export function carteCours(cr, { date = false } = {}) {
  const { plan, maintenant, v } = calc();
  const pc = plan.parCreneau[cr.cle] || {};
  const commence = cr.debut <= maintenant;
  const annonces = plan.annonces[cr.cle] || [];
  const alertes = plan.alertesEval[cr.cle] || [];
  const aPrevoir = aPrevoirCours(cr);
  const texte = pc.etat === 'prevu' || pc.etat === 'valide' ? textePronote(cr) : '';
  return html`<li class="cours${cr.annule ? ' annule' : ''}${cr.fin <= maintenant ? ' passe' : ''}" style="${styleNiveau(cr.code)}">
    <div class="cours-haut">
      <span class="heure">${date ? `${dateCourte(cr.jour)} · ` : ''}${horaires(cr)}</span>
      ${pastille(cr.code)}
      ${cr.demi && cr.parties.length > 1 ? html`<span>½ groupes</span>` : ''}
      ${cr.salle ? html`<span>salle ${cr.salle}</span>` : ''}
      ${cr.accompagnants.length ? html`<span title="${cr.accompagnants.join(', ')}">${icone('personne')} AESH</span>` : ''}
      ${cr.inclusions.length ? html`<span class="etiquette" title="${cr.inclusions.join(', ')}">ULIS</span>` : ''}
      ${cr.partiel ? html`<span class="etiquette attente" title="Une moitié n'a pas eu cours">½ annulé</span>` : ''}
      ${etiquetteEtat(cr)}
    </div>
    ${segments(cr)}
    ${annonces.map((a) => html`<div class="annonce${a.tard ? ' tard' : ''}"><span>${icone('annonce')} <b>${a.tard ? 'Prévenir dès maintenant' : 'Annoncer'}</b> : ${a.titre}, ${dateCourte(a.jourEval)}</span><button class="btn mini" data-action="annonce-faite" data-code="${a.code}" data-u="${a.u}">C'est fait</button></div>`)}
    ${alertes.map((a) => html`<div class="annonce tard"><span>${icone('alerte')} ${a.occasion ? html`Annonce de l'évaluation non cochée (à faire le ${dateCourte(a.occasion)}) : a-t-elle été faite ?` : "Évaluation sans cours avant pour l'annoncer."}</span><button class="btn mini" data-action="annonce-faite" data-code="${a.code}" data-u="${a.u}">C'est fait</button></div>`)}
    ${aPrevoir.length ? html`<div class="a-prevoir"><b>À prévoir</b>${aPrevoir.map((x) => html`<label class="coche${x.fait ? ' faite' : ''}"><input type="checkbox" data-change="coche" data-id="${x.id}"${x.fait ? ' checked' : ''}><span>${x.quoi}</span></label>`)}</div>` : ''}
    ${pc.note ? html`<p class="aide">« ${pc.note} »</p>` : ''}
    <div class="cours-actions">
      ${!cr.annule && commence ? html`<button class="btn mini${pc.etat === 'valide' ? '' : ' plein'}" data-action="valider" data-cle="${cr.cle}">${icone('valider')} ${pc.etat === 'valide' ? 'Modifier' : 'Où en est-on ?'}</button>` : ''}
      ${texte ? html`<button class="btn mini" data-action="copier-texte-cours" data-cle="${cr.cle}" title="Copier le texte du cahier de textes">${icone('copier')} Texte Pronote</button>` : ''}
      <button class="btn mini discret" data-action="ouvrir-creneau" data-cle="${cr.cle}">Détails</button>
    </div>
  </li>`;
}

actions['copier-texte-cours'] = async (el) => {
  const cr = calc().tousCreneaux.find((x) => x.cle === el.dataset.cle);
  if (!cr) return;
  toast(await copier(textePronote(cr)) ? 'Texte copié : collez-le dans le cahier de textes de Pronote.' : 'La copie a été refusée : ouvrez « Détails » pour sélectionner le texte.');
};

/** Une ligne d'événement non pédagogique (réunion, rendez-vous perso, trou). */
export function ligneEvenement(e, genre) {
  const { fuseau } = calc();
  const h = e.debut ? `${heureLisible(heureDe(e.debut, fuseau))}–${heureLisible(heureDe(e.fin, fuseau))}` : 'journée';
  return html`<li class="evt ${genre}"><span class="heure">${h}</span><span>${e.titre}${genre === 'perso' && e.agenda ? html` <span class="aide">· ${e.agenda}</span>` : ''}</span></li>`;
}
