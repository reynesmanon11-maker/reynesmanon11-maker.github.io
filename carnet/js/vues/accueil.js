// La page d'accueil, rangée comme celle de Pronote : des tuiles (emploi du temps, cahiers de textes
// non saisis, pense-bête, agenda, mes travaux…) que chacun range, agrandit, masque et règle à sa
// façon. La disposition est propre à l'appareil : on ne range pas son téléphone comme son ordinateur.
import { actions, changements, saisies, envois } from '../actions.js';
import { html, icone, ouvrirFeuille, fermerFeuille, redessinerFeuille, toast } from '../ui.js';
import { bandeauInstallation } from './partage.js';
import { calc, etat, changer, reglerLocal, ecrireDoc, supprimerDoc, modifierDoc, nomClasse } from '../etat.js';
import { heureDe, heureLisible, dateCourte, dateLongue, ajouteJours, ecartJours, jourRelatif, dureeLisible, instantDe, lundiDe, jourMois } from '../dates.js';
import { aPreparer, avantCoupure, peloton, plagesLibres, reprise, seancesLisible, EPS, semaineUtile, prochainesEvaluations } from '../moteur.js';
import { nouvelId } from '../donnees.js';
import { carteCours, ligneEvenement, pastille, styleNiveau, horaires } from './commun.js';
import { listeSemaine, grille, lettreDe } from './semaine.js';
import { cahiersNonSaisis, cleCahier } from './cahier.js';

// ---------- Les modules ----------
const STYLE_PREPARER = { cle: 'style', libelle: 'Présentation', defaut: 'liste', choix: [['liste', 'La liste des cours à préparer'], ['date', '« Préparé jusqu’au… », classe par classe'], ['compteur', 'Un compteur, en grand']] };
const DISPOSITION = (defaut) => ({ cle: 'disposition', libelle: 'Disposition', defaut, choix: [['colonne', 'En colonne'], ['ligne', 'En ligne'], ['echeances', 'Par échéance']] });

// Les titres reprennent ceux de Pronote quand la tuile y existe (« Emploi du temps », « Pense-bête »,
// « Cahiers de textes non saisis », « Agenda », « Mes travaux à réaliser »). `lien` : la page
// qu'ouvre « Tout voir » ; `compte` : le nombre affiché après le titre, comme « Agenda (10) ».
export const MODULES = {
  semaine: { titre: 'Emploi du temps', icone: 'semaine', taille: 'L', lien: '#/semaine', options: [
    { cle: 'presentation', libelle: 'Présentation', defaut: 'grille', choix: [['grille', 'Grille horaire, comme Pronote'], ['cartes', 'Une colonne par jour, avec le détail de chaque cours']] }] },
  aujourdhui: { titre: "Aujourd'hui", icone: 'soleil', taille: 'L', lien: '#/semaine', options: [
    { cle: 'perso', libelle: 'Rendez-vous personnels', defaut: 'oui', choix: [['oui', 'Affichés'], ['non', 'Masqués']] },
    { cle: 'libres', libelle: 'Trous de la journée', defaut: 'oui', choix: [['oui', 'Affichés'], ['non', 'Masqués']] },
  ] },
  valider: { titre: 'Cours à valider', icone: 'valider', taille: 'S', compte: () => aValider().length, options: [] },
  preparer: { titre: 'Cours à préparer', icone: 'alerte', taille: 'M', lien: '#/classes', options: [STYLE_PREPARER,
    { cle: 'jours', libelle: 'Regarder jusqu’à', defaut: '14', choix: [['7', 'Une semaine'], ['14', 'Deux semaines'], ['21', 'Trois semaines']] }] },
  cahier: { titre: 'Cahiers de textes non saisis', icone: 'cahier', taille: 'M', lien: '#/cahier', compte: () => cahiersNonSaisis().length, options: [] },
  annonces: { titre: 'Évaluations à venir', icone: 'annonce', taille: 'M', lien: '#/classes/calendrier', compte: () => evaluationsAVenir().length, options: [
    { cle: 'jours', libelle: 'Regarder jusqu’à', defaut: '42', choix: [['14', 'Deux semaines'], ['42', 'Six semaines'], ['365', 'Toute l’année connue']] }] },
  taches: { titre: 'Mes travaux à réaliser', icone: 'taches', taille: 'M', lien: '#/taches', compte: () => Object.values(calc().v.taches).filter((t) => !t.fait).length, options: [DISPOSITION('colonne')] },
  notes: { titre: 'Pense-bête', icone: 'crayon', taille: 'S', options: [] },
  agenda: { titre: 'Agenda', icone: 'agenda', taille: 'S', lien: '#/semaine', compte: () => agendaAVenir().length, options: [] },
  photocopies: { titre: 'Photocopies et matériel', icone: 'imprimante', taille: 'M', options: [
    { cle: 'jours', libelle: 'Pour les', defaut: '7', choix: [['3', '3 prochains jours'], ['7', '7 prochains jours'], ['14', '2 prochaines semaines']] },
    { cle: 'disposition', libelle: 'Disposition', defaut: 'colonne', choix: [['colonne', 'En colonne'], ['ligne', 'En ligne']] }] },
  peloton: { titre: 'Progression des classes', icone: 'livre', taille: 'M', lien: '#/classes', options: [] },
  vacances: { titre: 'Avant les vacances', icone: 'vacances', taille: 'S', options: [] },
  libres: { titre: 'Trous dans la journée', icone: 'cafe', taille: 'S', options: [
    { cle: 'min', libelle: 'Montrer les trous de', defaut: '30', choix: [['30', '30 min et plus'], ['55', 'une heure et plus']] }] },
};
// Sur ordinateur, l'emploi du temps de la semaine d'abord, comme sur l'accueil de Pronote ; sur
// téléphone, où une grille de cinq jours ne tient pas, la journée d'abord. Chaque appareil garde
// ensuite la disposition qu'on lui donne.
const etroit = () => { try { return matchMedia('(max-width: 760px)').matches; } catch { return false; } };
const AUTRES = ['valider', 'preparer', 'cahier', 'annonces', 'taches', 'notes', 'agenda', 'photocopies', 'peloton', 'vacances', 'libres'];
const ordreDefaut = () => (etroit() ? ['aujourdhui', ...AUTRES, 'semaine'] : ['semaine', ...AUTRES, 'aujourdhui']);
const masquesDefaut = () => (etroit() ? ['semaine'] : ['aujourdhui']);

const aValider = () => { const c = calc(); return c.creneaux.filter((x) => (c.plan.parCreneau[x.cle] || {}).aValider); };
function evaluationsAVenir() {
  const c = calc();
  const limite = ajouteJours(c.auj, Number(option('annonces', 'jours')) || 42);
  return prochainesEvaluations(c.v, c.plan, c.creneaux, { maintenant: c.maintenant }).filter((e) => e.jour <= limite);
}
function agendaAVenir() {
  const c = calc();
  const limite = ajouteJours(c.auj, 31);
  return c.etablissement.filter((e) => e.jour1 >= c.auj && e.jour0 <= limite).sort((a, b) => String(a.jour0).localeCompare(String(b.jour0)) || (a.debut || 0) - (b.debut || 0));
}
export const enOrganisation = () => organiser;

export function disposition() {
  const d = etat.local.disposition || {};
  const defaut = ordreDefaut();
  const ordre = (d.ordre || defaut).filter((id) => MODULES[id]);
  for (const id of defaut) if (!ordre.includes(id)) ordre.push(id);
  return { ordre, tailles: d.tailles || {}, masques: d.masques || masquesDefaut(), options: d.options || {} };
}
const option = (id, cle) => {
  const o = (disposition().options[id] || {})[cle];
  return o ?? (MODULES[id].options.find((x) => x.cle === cle) || {}).defaut;
};
const regler = (patch) => reglerLocal({ disposition: { ...disposition(), ...patch } });
let organiser = false;

// ---------- Rendu des modules ----------

/** Tous les cours passés sans point d'arrêt, ce matin compris : le même compte que le résumé en tête. */
function bandeauAValider() {
  const d = disposition();
  if (d.ordre.includes('valider') && !d.masques.includes('valider')) return '';
  const l = aValider();
  return l.length ? html`<div class="bandeau"><span><strong>${l.length} cours à valider</strong> — dites où vous vous êtes arrêtés, la suite se recale.</span>
      <span class="outils">${l.slice(-4).map((cr) => html`<button class="btn mini" data-action="valider" data-cle="${cr.cle}">${nomClasse(cr.code)} · ${dateCourte(cr.jour)}</button>`)}</span></div>` : '';
}

/** Comme « Appels non faits » dans Pronote : les cours passés dont on n'a pas dit où l'on s'est arrêté. */
function modValider() {
  const l = aValider();
  if (!l.length) return html`<p class="vide">${icone('valider')} Tous les cours passés sont validés.</p>`;
  return html`<p class="aide">Dites où chaque classe s'est arrêtée : la suite se recale sur les cours suivants.</p>
    <div class="outils">${l.slice(-12).reverse().map((cr) => html`<button class="btn mini" data-action="valider" data-cle="${cr.cle}">${nomClasse(cr.code)} · ${dateCourte(cr.jour)}</button>`)}</div>
    ${l.length > 12 ? html`<p class="aide">… et ${l.length - 12} plus anciens.</p>` : ''}`;
}

function modCahier() {
  const l = cahiersNonSaisis();
  if (!l.length) return html`<p class="vide">${icone('valider')} Tout est saisi.</p>`;
  const c = calc();
  return html`<ul class="liste">${l.slice(-6).reverse().map((cr) => html`<li class="tache-ligne">
      <span><span class="heure">${dateCourte(cr.jour)}</span> ${pastille(cr.code)} ${(c.plan.parCreneau[cr.cle] || {}).aValider ? html`<span class="aide">à valider</span>` : ''}</span>
      <span class="outils"><button class="btn mini" data-action="cdt-copier" data-cle="${cr.cle}" data-quoi="tout" title="Copier le contenu et le travail à faire">${icone('copier')} Copier</button>
        <label class="coche"><input type="checkbox" data-change="coche" data-id="${cleCahier(cr.cle)}"><span>Saisi</span></label></span></li>`)}</ul>
    ${l.length > 6 ? html`<p class="aide">… et ${l.length - 6} autres.</p>` : ''}`;
}

/** Les évaluations des semaines à venir, toutes classes confondues : annoncées ou non. */
function modAnnonces() {
  const c = calc();
  const evals = evaluationsAVenir();
  const alertes = Object.values(c.plan.alertesEval).flat();
  const annonces = {};
  for (const cr of c.creneaux) for (const a of c.plan.annonces[cr.cle] || []) if (cr.jour >= c.auj) annonces[`${a.code}|${a.u}`] = { cr, a };
  if (!evals.length && !alertes.length) return html`<p class="vide">Aucune évaluation prévue dans l'emploi du temps connu.</p>`;
  return html`<ul class="liste">${evals.map((e) => {
    const x = annonces[`${e.code}|${e.u}`];
    const alerte = alertes.find((a) => a.code === e.code && a.u === e.u);
    return html`<li class="annonce${x && x.a.tard ? ' tard' : ''}${e.annoncee ? ' faite' : ''}"><span><span class="heure">${dateCourte(e.jour)}</span> ${pastille(e.code)} ${e.titre}<br>
        <span class="aide">${e.annoncee ? 'annoncée' : x ? `${x.a.tard ? 'à dire dès' : 'à annoncer'} ${jourRelatif(x.cr.jour, c.auj)}` : alerte ? (alerte.occasion ? `annonce non cochée (prévue le ${dateCourte(alerte.occasion)})` : "pas de cours avant pour l'annoncer") : 'à annoncer'}</span></span>
      ${e.annoncee ? '' : html`<button class="btn mini" data-action="annonce-faite" data-code="${e.code}" data-u="${e.u}">Annoncée</button>`}</li>`;
  })}</ul>`;
}

/** L'agenda de l'établissement, comme la tuile « Agenda » de Pronote : réunions, conseils, sorties. */
function modAgenda() {
  const c = calc();
  const l = agendaAVenir();
  if (!l.length) return html`<p class="vide">Rien à l'agenda de l'établissement ce mois-ci.</p>`;
  return html`<ul class="liste agenda-liste">${l.slice(0, 8).map((e) => {
    const j = String(e.jour0).slice(8, 10);
    return html`<li><span class="date-badge"><b>${Number(j)}</b><span>${jourMois(e.jour0).replace(/^\d+\s*/, '')}</span></span>
      <button class="lien-evt" data-action="ouvrir-evenement" data-genre="etab" data-id="${e.id}"><b>${e.titre}</b><span class="aide">${e.debut ? `${dateCourte(e.jour0)} · ${heureLisible(heureDe(e.debut, c.fuseau))}–${heureLisible(heureDe(e.fin, c.fuseau))}` : e.jour1 > e.jour0 ? `du ${jourMois(e.jour0)} au ${jourMois(e.jour1)}` : dateCourte(e.jour0)}</span></button></li>`;
  })}</ul>${l.length > 8 ? html`<p class="aide">… et ${l.length - 8} autres.</p>` : ''}`;
}

function modAujourdhui() {
  const c = calc();
  let jour = c.auj;
  const duJour = (j) => c.tousCreneaux.filter((x) => x.jour === j);
  if (!duJour(jour).length) {
    const prochain = c.tousCreneaux.find((x) => x.jour > c.auj && !x.annule);
    if (prochain) jour = prochain.jour;
  }
  const voirPerso = option('aujourdhui', 'perso') === 'oui';
  const voirLibres = option('aujourdhui', 'libres') === 'oui';
  const items = [];
  for (const cr of duJour(jour)) items.push({ t: cr.debut, h: c.v.classes[cr.code] ? carteCours(cr) : carteInconnue(cr) });
  for (const e of c.etablissement) if (e.jour0 <= jour && e.jour1 >= jour) items.push({ t: e.debut || new Date(0), h: ligneEvenement(e, '') });
  if (voirPerso) for (const e of c.perso) if (e.jour0 <= jour && e.jour1 >= jour) items.push({ t: e.debut || new Date(0), h: ligneEvenement(e, 'perso') });
  if (voirLibres) {
    const evts = [...duJour(jour).flatMap((cr) => cr.parties.map((p) => ({ ...p, pro: true }))), ...c.etablissement.map((e) => ({ ...e, pro: true })), ...c.perso];
    for (const [a, b] of plagesLibres(evts, jour, { fuseau: c.fuseau, min: 30 })) {
      items.push({ t: instantDe(jour, hhmm(a), c.fuseau), h: html`<li class="evt libre"><span class="heure">${hm(a)}–${hm(b)}</span><span>Libre · ${dureeLisible(b - a)}</span></li>` });
    }
  }
  items.sort((a, b) => a.t - b.t);
  const vac = c.coupures.find((k) => k.debut <= c.auj && k.fin >= c.auj);
  return html`
    ${bandeauAValider()}
    ${vac ? html`<p class="aide">${icone('vacances')} ${vac.titre} jusqu'au ${dateLongue(vac.fin)}.</p>` : ''}
    <h3>${jour === c.auj ? dateLongue(jour) : html`Prochain jour de cours : ${dateLongue(jour)}`}</h3>
    ${items.length ? html`<ul class="liste">${items.map((x) => x.h)}</ul>` : html`<p class="vide">Rien à l'emploi du temps.</p>`}`;
}

const hm = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function carteInconnue(cr) {
  return html`<li class="cours" style="${styleNiveau(cr.code)}"><div class="cours-haut"><span class="heure">${horaires(cr)}</span>${pastille(cr.code)}<span class="aide">classe non suivie</span></div>
    <div class="cours-actions"><button class="btn mini" data-action="suivre-classe" data-code="${cr.code}">${icone('plus')} Suivre cette classe</button></div></li>`;
}

function modPreparer() {
  const c = calc();
  const jours = Number(option('preparer', 'jours'));
  const limite = ajouteJours(c.auj, jours);
  const style = option('preparer', 'style');
  const vides = c.creneaux.filter((cr) => cr.fin > c.maintenant && cr.jour <= limite && ((c.plan.parCreneau[cr.cle] || {}).libre || 0) > 0.01);
  const codes = Object.keys(c.plan.parClasse).filter((k) => c.plan.parClasse[k].prochains.length)
    .sort((a, b) => String(c.plan.parClasse[a].couvertJusqua || '').localeCompare(String(c.plan.parClasse[b].couvertJusqua || '')));
  if (!codes.length) return html`<p class="vide">Aucun cours à venir dans l'emploi du temps lu.</p>`;
  if (style === 'date') {
    return html`<ul class="liste">${codes.map((code) => {
      const pc = c.plan.parClasse[code], d = pc.couvertJusqua;
      const urgent = !d || ecartJours(c.auj, d) < 7;
      const tout = !pc.premierLibre;
      return html`<li class="tache-ligne"><span>${pastille(code)} ${tout ? html`prête jusqu'au dernier cours connu` : d ? html`préparée jusqu'au <b class="${urgent ? 'retard' : ''}">${dateCourte(d)}</b>` : html`<b class="retard">rien de prévu</b>`}</span>
        ${tout ? '' : html`<a class="btn mini" href="#/classes/${code}">Préparer</a>`}</li>`;
    })}</ul>`;
  }
  if (style === 'compteur') {
    const classes = [...new Set(vides.map((x) => x.code))];
    return html`<div class="outils"><span class="compteur${vides.length ? '' : ' ok'}">${vides.length}</span>
      <span>${vides.length ? html`cours à préparer d'ici le ${dateCourte(limite)}` : html`tout est prêt d'ici le ${dateCourte(limite)}`}</span></div>
      ${classes.length ? html`<div class="outils">${classes.map((k) => html`<a class="btn mini" href="#/classes/${k}">${nomClasse(k)}</a>`)}</div>` : ''}`;
  }
  if (!vides.length) return html`<p>${icone('valider')} Tout est prêt d'ici le <b>${dateLongue(limite)}</b>.</p>`;
  return html`<ul class="liste">${vides.slice(0, 8).map((cr) => {
    const pc = c.plan.parCreneau[cr.cle];
    return html`<li class="tache-ligne"><span><span class="heure">${dateCourte(cr.jour)}</span> ${pastille(cr.code)} ${pc.libre >= 0.99 ? 'rien de prévu' : `reste ${seancesLisible(pc.libre)}`}</span>
      <a class="btn mini" href="#/classes/${cr.code}">Préparer</a></li>`;
  })}</ul>${vides.length > 8 ? html`<p class="aide">… et ${vides.length - 8} autres.</p>` : ''}`;
}

function modTaches() {
  const c = calc();
  const disp = option('taches', 'disposition');
  const taches = Object.entries(c.v.taches).map(([id, t]) => ({ id, ...t })).filter((t) => !t.fait)
    .sort((a, b) => String(a.pour || '9999').localeCompare(String(b.pour || '9999')));
  const ligne = (t) => html`<label class="coche"><input type="checkbox" data-change="tache-faite" data-id="${t.id}"><span>${t.texte}${t.pour || t.classe ? html`<br><span class="aide">${t.classe ? nomClasse(t.classe) : ''}${t.classe && t.pour ? ' · ' : ''}${t.pour ? html`<span class="${t.pour < c.auj ? 'retard' : ''}">${jourRelatif(t.pour, c.auj)}</span>` : ''}</span>` : ''}</span></label>`;
  let corps;
  if (!taches.length) corps = html`<p class="vide">Rien en attente.</p>`;
  else if (disp === 'ligne') corps = html`<div class="taches-ligne">${taches.map(ligne)}</div>`;
  else if (disp === 'echeances') {
    const fin = ajouteJours(c.auj, 7);
    const groupes = [['En retard ou aujourd’hui', taches.filter((t) => t.pour && t.pour <= c.auj)], ['Cette semaine', taches.filter((t) => t.pour > c.auj && t.pour <= fin)], ['Plus tard', taches.filter((t) => !t.pour || t.pour > fin)]];
    corps = html`<div class="taches-echeances">${groupes.map(([titre, l]) => html`<div><h3>${titre}</h3>${l.length ? l.map(ligne) : html`<span class="vide petit">—</span>`}</div>`)}</div>`;
  } else corps = html`<div class="liste">${taches.map(ligne)}</div>`;
  return html`<form class="ajout-tache" data-envoi="tache-rapide"><input type="text" name="texte" id="tache-rapide" placeholder="Ajouter : appeler le labo, rendre les copies…" aria-label="Nouvelle tâche" autocomplete="off"><button class="btn plein" type="submit" aria-label="Ajouter">${icone('plus')}</button></form>${corps}
    <a class="aide" href="#/taches">Toutes les tâches</a>`;
}

function modPeloton() {
  const c = calc();
  const niveaux = peloton(c.v, c.plan);
  if (!niveaux.length) return html`<p class="vide">Aucune classe suivie.</p>`;
  return html`<div class="peloton">${niveaux.map((n) => {
    const total = Math.max(1, n.reference.length);
    return html`<div><h3>${n.niveau}</h3><div class="piste">${n.lignes.map((l, k) => {
      const e = l.eid ? c.v.etapes[l.eid] : null;
      const ou = e ? (l.f > EPS ? `reprendre à ${reprise({ de: l.f }, e).texte}` : 'au début') : '';
      const tete = n.lignes[0];
      return html`${pastille(l.code)}<div class="barre" style="${styleNiveau(l.code)}" role="img" aria-label="${nomClasse(l.code)} : étape ${Math.min(total, Math.floor(l.rang) + 1)} sur ${total}">
        <i style="width:${Math.min(100, (l.rang / total) * 100)}%"></i><span class="crans">${Array.from({ length: total }, () => html`<span></span>`)}</span></div>
        <div class="detail">${l.fini ? 'File terminée' : html`${e ? e.titre : ''}${ou ? ` · ${ou}` : ''}`}${k > 0 && l.retard > 0.01 ? html` · <b>${seancesLisible(l.retard)} derrière ${nomClasse(tete.code)}</b>` : ''}</div>`;
    })}</div></div>`;
  })}</div>`;
}

function modPhotocopies() {
  const c = calc();
  const items = aPreparer(c.v, c.plan, c.creneaux, { auj: c.auj, jours: Number(option('photocopies', 'jours')) });
  if (!items.length) return html`<p class="vide">Rien à photocopier ni à sortir.</p>`;
  const ligne = (p) => {
    const e = c.v.etapes[p.eid], fait = !!(c.v.coches[p.id] && c.v.coches[p.id].fait);
    const quoi = [p.pages ? (p.effectif ? `${p.effectif} × ${p.pages} = ${p.effectif * p.pages} copies` : `${p.pages} page(s) par élève`) : '', p.afaire].filter(Boolean).join(' · ');
    return html`<label class="coche${fait ? ' faite' : ''}"><input type="checkbox" data-change="coche" data-id="${p.id}"${fait ? ' checked' : ''}><span><b>${dateCourte(p.jour)}</b> · ${nomClasse(p.code)} — ${e.titre}<br><span class="aide">${quoi}</span></span></label>`;
  };
  return option('photocopies', 'disposition') === 'ligne' ? html`<div class="taches-ligne">${items.map(ligne)}</div>` : html`<div class="liste">${items.map(ligne)}</div>`;
}

function modVacances() {
  const c = calc();
  const prochaine = c.coupures.find((k) => k.debut > c.auj);
  if (!prochaine) return html`<p class="vide">Pas de vacances en vue dans l'emploi du temps lu.</p>`;
  const lignes = Object.keys(c.plan.parClasse).map((code) => ({ code, r: avantCoupure(c.plan, c.creneaux, c.coupures, code, { auj: c.auj, maintenant: c.maintenant }) })).filter((x) => x.r);
  return html`<p><b>${prochaine.titre}</b> le ${dateLongue(prochaine.debut)} <span class="aide">(dans ${ecartJours(c.auj, prochaine.debut)} jours)</span></p>
    <ul class="liste">${lignes.map(({ code, r }) => html`<li class="tache-ligne"><span>${pastille(code)} ${r.seances} cours ·
      ${r.marge >= 0 ? (r.finFile ? html`file finie le ${dateCourte(r.finFile.jour)}` : html`<span>${seancesLisible(r.marge)} de marge</span>`) : html`<b class="retard">il manque ${seancesLisible(-r.marge)}</b>`}</span></li>`)}</ul>`;
}

function modLibres() {
  const c = calc();
  const min = Number(option('libres', 'min'));
  const jours = [...new Set(c.tousCreneaux.filter((x) => x.jour >= c.auj).map((x) => x.jour))].slice(0, 5);
  const lignes = [];
  for (const j of jours) {
    const evts = [...c.tousCreneaux.filter((x) => x.jour === j).flatMap((cr) => cr.parties.map((p) => ({ ...p, pro: true }))), ...c.etablissement.map((e) => ({ ...e, pro: true })), ...c.perso];
    for (const [a, b] of plagesLibres(evts, j, { fuseau: c.fuseau, min })) lignes.push(html`<li class="evt libre"><span class="heure">${dateCourte(j)}</span><span>${hm(a)}–${hm(b)} · ${dureeLisible(b - a)}</span></li>`);
  }
  return lignes.length ? html`<ul class="liste">${lignes}</ul>` : html`<p class="vide">Pas de trou dans les prochains jours.</p>`;
}

function modNotes() {
  return html`<textarea id="bloc-notes" data-saisie="notes" aria-label="Pense-bête" placeholder="Idées, choses à ne pas oublier…">${calc().v.notes}</textarea><p class="aide">Enregistré au fil de la frappe.</p>`;
}

function modSemaine() {
  const c = calc();
  const lundi = semaineUtile(c.tousCreneaux, c.auj);
  return html`<p class="aide">${lundi === lundiDe(c.auj) ? 'Cette semaine' : 'Semaine'} du ${jourMois(lundi)} au ${jourMois(ajouteJours(lundi, 4))} · touchez un cours pour dire où la classe en est</p>
    ${option('semaine', 'presentation') === 'cartes' ? listeSemaine({ compacte: true }) : grille(lundi)}`;
}

const RENDUS = { aujourdhui: modAujourdhui, valider: modValider, preparer: modPreparer, cahier: modCahier, taches: modTaches, peloton: modPeloton, photocopies: modPhotocopies, annonces: modAnnonces, agenda: modAgenda, vacances: modVacances, libres: modLibres, notes: modNotes, semaine: modSemaine };

/** « Emploi du temps (semaine B) » : le titre de la tuile peut dépendre de l'état. */
function titreModule(id) {
  if (id !== 'semaine') return MODULES[id].titre;
  const c = calc(), l = lettreDe(semaineUtile(c.tousCreneaux, c.auj));
  return l ? `Emploi du temps (semaine ${l})` : MODULES.semaine.titre;
}

// ---------- La page ----------

function resume() {
  const c = calc();
  const coursAuj = c.creneaux.filter((x) => x.jour === c.auj && !x.annule);
  const prochain = coursAuj.find((x) => x.fin > c.maintenant);
  const aValider = c.creneaux.filter((x) => (c.plan.parCreneau[x.cle] || {}).aValider).length;
  // Le premier cours sans contenu, toutes classes confondues : c'est lui qu'il faut préparer d'abord.
  const vide = Object.values(c.plan.parClasse).map((p) => p.premierLibre).filter(Boolean).sort((x, y) => x.debut - y.debut)[0];
  const phrases = [];
  if (coursAuj.length) phrases.push(html`Aujourd'hui, <b>${coursAuj.length} cours</b>${prochain ? html`, le prochain à <b>${heureLisible(heureDe(prochain.debut, c.fuseau))}</b> avec la ${nomClasse(prochain.code)}` : ', tous passés'}.`);
  else phrases.push(html`Pas de cours aujourd'hui.`);
  if (aValider) phrases.push(html` <b>${aValider}</b> à valider.`);
  if (vide) phrases.push(html` Prochain cours à préparer : <b>${nomClasse(vide.code)}</b>, ${jourRelatif(vide.jour, c.auj).replace(/\.$/, '')}.`);
  else if (Object.keys(c.plan.parClasse).length) phrases.push(html` Tout est prévu jusqu'au dernier cours connu.`);
  return html`<p class="resume">${phrases}</p>`;
}

export function rendreAccueil() {
  const c = calc();
  const d = disposition();
  const visibles = d.ordre.filter((id) => !d.masques.includes(id));
  const caches = d.ordre.filter((id) => d.masques.includes(id));
  const modules = visibles.map((id, k) => {
    const m = MODULES[id];
    const taille = d.tailles[id] || m.taille;
    const titre = titreModule(id);
    const n = m.compte ? m.compte() : 0;
    return html`<section class="module carte taille-${taille}" data-module="${id}" aria-label="${titre}">
      <header class="module-tete">
        <button class="poignee" data-poignee aria-label="Déplacer « ${m.titre} »" title="Glisser pour déplacer">${icone('poignee')}</button>
        <h2>${icone(m.icone)}${titre}${n ? html` <span class="compte">(${n})</span>` : ''}</h2>
        <div class="droite">
          ${!organiser && m.lien ? html`<a class="tout-voir" href="${m.lien}">Tout voir ${icone('ouvrir')}</a>` : ''}
          <div class="reglage-module">
            <button class="btn-rond" data-action="module-monter" data-id="${id}" aria-label="Monter" ${k === 0 ? 'disabled' : ''}>${icone('haut')}</button>
            <button class="btn-rond" data-action="module-descendre" data-id="${id}" aria-label="Descendre" ${k === visibles.length - 1 ? 'disabled' : ''}>${icone('bas')}</button>
            <span class="segmente" role="group" aria-label="Largeur">${['S', 'M', 'L'].map((t) => html`<button data-action="module-taille" data-id="${id}" data-taille="${t}" aria-pressed="${t === taille}" title="${{ S: 'Étroit', M: 'Moyen', L: 'Pleine largeur' }[t]}">${t}</button>`)}</span>
            ${m.options.length ? html`<button class="btn-rond" data-action="module-options" data-id="${id}" aria-label="Réglages du module">${icone('reglages')}</button>` : ''}
            <button class="btn-rond" data-action="module-masquer" data-id="${id}" aria-label="Masquer">${icone('oeil-barre')}</button>
          </div>
          ${!organiser && m.options.length ? html`<button class="btn-rond petit" data-action="module-options" data-id="${id}" aria-label="Réglages de « ${m.titre} »" title="Réglages">${icone('reglages')}</button>` : ''}
          ${!organiser ? html`<button class="btn-rond petit" data-action="module-fermer" data-id="${id}" aria-label="Retirer « ${m.titre} » de la page d'accueil" title="Retirer de la page d'accueil">${icone('croix')}</button>` : ''}
        </div>
      </header>
      <div class="module-corps">${RENDUS[id]()}</div>
    </section>`;
  });
  return html`
    ${etat.local.mode === 'demo' ? html`<div class="bandeau"><span><strong>Mode démo</strong> — un emploi du temps et des classes fictifs, pour essayer. Tout se règle et se valide.</span><span class="outils"><a class="btn mini plein" href="#/demarrer">Commencer pour de vrai</a><button class="btn mini" data-action="partager">${icone('partager')} Partager</button></span></div>` : ''}
    ${bandeauInstallation(etat.local.installPlusTard)}
    ${c.inconnus.length ? html`<div class="bandeau info"><span><strong>Pronote montre ${c.inconnus.length} classe${c.inconnus.length > 1 ? 's' : ''} non suivie${c.inconnus.length > 1 ? 's' : ''}</strong> : ${c.inconnus.join(', ')}.</span><span class="outils"><button class="btn mini plein" data-action="suivre-toutes">Les suivre</button><button class="btn mini" data-action="ignorer-inconnues">Ignorer</button></span></div>` : ''}
    <h1 class="visuellement-cache">Page d'accueil</h1>
    ${resume()}
    ${organiser ? html`<div class="bandeau info"><span>Glissez les tuiles par leur poignée ${icone('poignee')}, ou utilisez ↑ ↓. S, M, L règlent la largeur. La disposition est propre à cet appareil.</span>
      <span class="modules-caches">${caches.length ? caches.map((id) => html`<button class="btn mini" data-action="module-afficher" data-id="${id}">${icone('plus')} ${MODULES[id].titre}</button>`) : html`<span class="aide">Toutes les tuiles sont affichées.</span>`}
      <button class="btn mini discret" data-action="disposition-defaut">Disposition d'origine</button>
      <button class="btn mini plein" data-action="organiser">${icone('valider')} Terminé</button></span></div>` : ''}
    <div class="tableau${organiser ? ' organiser' : ''}" id="tableau">${modules}</div>`;
}

// ---------- Actions ----------
actions['organiser'] = () => { organiser = !organiser; changer(); };
const deplacer = (id, sens) => {
  const d = disposition();
  const vis = d.ordre.filter((x) => !d.masques.includes(x));
  const k = vis.indexOf(id), j = k + sens;
  if (k < 0 || j < 0 || j >= vis.length) return;
  [vis[k], vis[j]] = [vis[j], vis[k]];
  regler({ ordre: [...vis, ...d.ordre.filter((x) => d.masques.includes(x))] });
};
actions['module-monter'] = (el) => deplacer(el.dataset.id, -1);
actions['module-descendre'] = (el) => deplacer(el.dataset.id, 1);
actions['module-taille'] = (el) => regler({ tailles: { ...disposition().tailles, [el.dataset.id]: el.dataset.taille } });
actions['module-masquer'] = (el) => regler({ masques: [...new Set([...disposition().masques, el.dataset.id])] });
// La croix de la tuile, comme dans Pronote : elle la retire, et « Annuler » la remet.
actions['module-fermer'] = (el) => {
  const id = el.dataset.id;
  regler({ masques: [...new Set([...disposition().masques, id])] });
  toast(`« ${MODULES[id].titre} » retirée de la page d'accueil.`, { action: { libelle: 'Annuler', faire: () => regler({ masques: disposition().masques.filter((x) => x !== id) }) } });
};
actions['module-afficher'] = (el) => regler({ masques: disposition().masques.filter((x) => x !== el.dataset.id) });
actions['disposition-defaut'] = () => { reglerLocal({ disposition: null }); toast('Disposition d’origine rétablie.'); };
export function surGlisser(ordre) {
  const d = disposition();
  regler({ ordre: [...ordre, ...d.ordre.filter((x) => !ordre.includes(x))] });
}

actions['module-options'] = (el) => {
  const id = el.dataset.id, m = MODULES[id];
  ouvrirFeuille(() => ({
    titre: `Réglages · ${m.titre}`,
    corps: html`${m.options.map((o) => html`<fieldset class="section-feuille" style="border:0;padding:0;margin:0"><h3>${o.libelle}</h3>
      ${o.choix.map(([val, lib]) => html`<label class="coche"><input type="radio" name="opt-${o.cle}" data-change="module-option" data-id="${id}" data-cle="${o.cle}" value="${val}"${option(id, o.cle) === val ? ' checked' : ''}><span>${lib}</span></label>`)}</fieldset>`)}`,
    pied: html`<button class="btn plein" data-action="fermer-feuille">Terminé</button>`,
  }));
};
changements['module-option'] = (el) => {
  const { id, cle } = el.dataset;
  const d = disposition();
  regler({ options: { ...d.options, [id]: { ...(d.options[id] || {}), [cle]: el.value } } });
  redessinerFeuille(true);
};

envois['tache-rapide'] = (form) => {
  const texte = form.texte.value.trim();
  if (!texte) return;
  ecrireDoc(`taches/${nouvelId('t')}`, { texte, classe: '', pour: '', fait: false, cree: new Date().toISOString() });
  form.texte.value = '';
  toast('Tâche ajoutée.');
};
changements['tache-faite'] = (el) => {
  modifierDoc(`taches/${el.dataset.id}`, (t) => { t.fait = el.checked; });
  if (el.checked) toast('Bravo, une de moins.', { action: { libelle: 'Annuler', faire: () => modifierDoc(`taches/${el.dataset.id}`, (t) => { t.fait = false; }) } });
};
let minuteurNotes;
saisies['notes'] = (el) => {
  clearTimeout(minuteurNotes);
  const texte = el.value;
  minuteurNotes = setTimeout(() => ecrireDoc('notes', { texte }), 500);
};

export { fermerFeuille, supprimerDoc };
