// La semaine : une colonne par jour avec les cartes de cours, comme l'emploi du temps de l'ancien
// carnet (vue « Cartes », par défaut), ou une grille horaire où cours, vie de l'établissement et
// vie perso se placent à leur heure, comme un agenda papier.
import { actions } from '../actions.js';
import { html, icone } from '../ui.js';
import { calc, etat, changer, reglerLocal, nomClasse, niveauClasse, couleurNiveau } from '../etat.js';
import { lundiDe, ajouteJours, dateCourte, dateLongue, minutesDe, heureDe, heureLisible, jourMois } from '../dates.js';
import { semaineUtile } from '../moteur.js';
import { carteCours, ligneEvenement, styleNiveau } from './commun.js';
import { ouvrirFeuille } from '../ui.js';

let lundiAffiche = null;
const PX = 1.05; // pixels par minute

function semaine() {
  const c = calc();
  if (!lundiAffiche) lundiAffiche = semaineUtile(c.tousCreneaux, c.auj);
  return lundiAffiche;
}

const vueChoisie = () => etat.local.vueSemaine || 'liste';

function evenementsDuJour(jour) {
  const c = calc();
  const cours = [];
  for (const cr of c.tousCreneaux) {
    if (cr.jour !== jour) continue;
    for (const p of cr.parties) cours.push({ genre: 'cours', cr, p, debut: p.debut, fin: p.fin });
  }
  const etab = c.etablissement.filter((e) => !e.journee && e.debut && e.jour0 <= jour && e.jour1 >= jour).map((e) => ({ genre: 'etab', e, debut: e.debut, fin: e.fin }));
  const perso = c.perso.filter((e) => !e.journee && e.debut && e.jour0 <= jour && e.jour1 >= jour).map((e) => ({ genre: 'perso', e, debut: e.debut, fin: e.fin }));
  const journees = [
    ...c.coupures.filter((k) => k.debut <= jour && k.fin >= jour).map((k) => ({ genre: 'vac', titre: k.titre })),
    ...c.etablissement.filter((e) => e.journee && e.jour0 <= jour && e.jour1 >= jour).map((e) => ({ genre: 'etab', titre: e.titre })),
    ...c.perso.filter((e) => e.journee && e.jour0 <= jour && e.jour1 >= jour).map((e) => ({ genre: 'perso', titre: e.titre })),
  ];
  return { minutes: [...cours, ...etab, ...perso], journees };
}

/** Colonnes côte à côte pour les événements qui se chevauchent. */
function disposer(evts, fuseau) {
  const l = evts.map((e) => ({ ...e, a: minutesDe(e.debut, fuseau), b: Math.max(minutesDe(e.debut, fuseau) + 15, minutesDe(e.fin, fuseau) || 24 * 60) }))
    .sort((x, y) => x.a - y.a || y.b - x.b);
  let groupe = [], finGroupe = -1;
  const fermer = () => { const n = Math.max(...groupe.map((x) => x.col)) + 1; groupe.forEach((x) => { x.n = n; }); groupe = []; };
  for (const e of l) {
    if (groupe.length && e.a >= finGroupe) fermer();
    const prises = new Set(groupe.filter((x) => x.b > e.a).map((x) => x.col));
    let col = 0; while (prises.has(col)) col++;
    e.col = col; groupe.push(e); finGroupe = Math.max(finGroupe, e.b);
  }
  if (groupe.length) fermer();
  return l;
}

function bloc(x, debutGrille) {
  const c = calc();
  const top = (x.a - debutGrille) * PX, h = Math.max(18, (x.b - x.a) * PX - 2);
  const pos = `top:${top}px;height:${h}px;left:calc(${(x.col / x.n) * 100}% + 2px);width:calc(${100 / x.n}% - 4px)`;
  const heures = `${heureLisible(heureDe(x.debut, c.fuseau))}–${heureLisible(heureDe(x.fin, c.fuseau))}`;
  if (x.genre === 'cours') {
    const pc = c.plan.parCreneau[x.cr.cle];
    const suivie = !!c.v.classes[x.cr.code];
    const seg = pc && pc.segments && pc.segments.find((s) => !s.recul);
    const titre = seg ? (c.v.etapes[seg.eid] || {}).titre : (pc && pc.etat === 'prevu' && pc.libre > 0.01 ? 'À préparer' : '');
    return html`<button class="bloc${x.p.annule ? ' annule' : ''}${pc && pc.etat === 'prevu' && pc.libre > 0.99 ? ' libre-prevu' : ''}" style="${pos};${styleNiveau(x.cr.code)}" data-action="ouvrir-creneau" data-cle="${x.cr.cle}"
      title="${nomClasse(x.cr.code)} ${x.p.groupe || ''} · ${heures}${titre ? ` · ${titre}` : ''}">
      <b>${nomClasse(x.cr.code)}${x.p.groupe ? ` ${x.p.groupe}` : ''}${x.p.annule ? ' · annulé' : ''}</b>
      ${suivie ? (titre ? html`<span>${titre}</span>` : '') : html`<span class="sous">non suivie</span>`}
      <span class="sous"> · ${heures}${x.p.salle ? ` · ${x.p.salle}` : ''}</span></button>`;
  }
  return html`<button class="bloc ${x.genre}" style="${pos}" data-action="ouvrir-evenement" data-genre="${x.genre}" data-id="${x.e.id}" title="${x.e.titre} · ${heures}">
    <b>${x.e.titre}</b><span class="sous">${heures}</span></button>`;
}

function grille() {
  const c = calc();
  const lundi = semaine();
  let jours = [0, 1, 2, 3, 4].map((k) => ajouteJours(lundi, k));
  const we = [5, 6].map((k) => ajouteJours(lundi, k)).filter((j) => evenementsDuJour(j).minutes.some((e) => e.genre !== 'perso'));
  jours = [...jours, ...we];
  const tous = jours.map((j) => ({ jour: j, ...evenementsDuJour(j) }));
  const mins = tous.flatMap((d) => d.minutes.map((e) => minutesDe(e.debut, c.fuseau)));
  const maxs = tous.flatMap((d) => d.minutes.map((e) => minutesDe(e.fin, c.fuseau) || 24 * 60));
  const debut = Math.max(6 * 60, Math.min(8 * 60, ...mins.map((m) => Math.floor(m / 60) * 60)));
  const fin = Math.min(22 * 60, Math.max(17 * 60, ...maxs.map((m) => Math.ceil(m / 60) * 60)));
  const hauteur = (fin - debut) * PX;
  const heures = [];
  for (let m = debut; m <= fin; m += 60) heures.push(m);
  const maintenant = minutesDe(c.maintenant, c.fuseau);
  return html`<div class="grille" style="--h:${hauteur}px">
    <div class="grille-heures" style="margin-top:50px;height:${hauteur}px">${heures.map((m) => html`<span style="top:${(m - debut) * PX}px">${m / 60}h</span>`)}</div>
    <div class="grille-jours">${tous.map((d) => html`<div class="colonne-jour${d.jour === c.auj ? ' auj' : ''}">
      <div class="tete-jour">${dateCourte(d.jour)}${d.journees.length ? html`<div class="bandeau-journee${d.journees.some((x) => x.genre === 'vac') ? ' vac' : ''}" title="${d.journees.map((x) => x.titre).join(' · ')}">${d.journees[0].titre}${d.journees.length > 1 ? ` +${d.journees.length - 1}` : ''}</div>` : ''}</div>
      <div class="corps-jour" style="height:${hauteur}px">
        ${heures.map((m) => html`<div class="ligne-heure" style="top:${(m - debut) * PX}px"></div><div class="ligne-heure demi" style="top:${(m + 30 - debut) * PX}px"></div>`)}
        ${d.jour === c.auj && maintenant >= debut && maintenant <= fin ? html`<div class="maintenant" style="top:${(maintenant - debut) * PX}px"></div>` : ''}
        ${disposer(d.minutes, c.fuseau).map((x) => bloc(x, debut))}
      </div></div>`)}</div>
  </div>`;
}

/**
 * La semaine en colonnes, une par jour, avec la carte complète de chaque cours et, à leur heure,
 * la vie de l'établissement et la vie perso (aussi le module « Ma semaine » de l'accueil).
 */
export function listeSemaine({ compacte = false } = {}) {
  const c = calc();
  const lundi = compacte ? semaineUtile(c.tousCreneaux, c.auj) : semaine();
  const jours = [0, 1, 2, 3, 4].map((k) => ajouteJours(lundi, k));
  const samedi = ajouteJours(lundi, 5);
  if (c.creneaux.some((x) => x.jour === samedi)) jours.push(samedi);
  return html`<div class="jours-liste" style="--n:${jours.length}">${jours.map((j) => {
    const { minutes, journees } = evenementsDuJour(j);
    const elements = [
      ...c.creneaux.filter((x) => x.jour === j).map((cr) => ({ t: cr.debut, h: carteCours(cr) })),
      ...minutes.filter((x) => x.genre !== 'cours').map((x) => ({ t: x.debut, h: ligneEvenement(x.e, x.genre === 'perso' ? 'perso' : '') })),
    ].sort((a, b) => a.t - b.t);
    return html`<section class="jour-liste${j === c.auj ? ' auj' : ''}"><h3>${dateLongue(j)}</h3>
      ${journees.map((x) => html`<p class="aide">${x.genre === 'vac' ? icone('vacances') : ''} ${x.titre}</p>`)}
      ${elements.length ? html`<ul class="liste">${elements.map((x) => x.h)}</ul>` : html`<p class="vide petit">Pas de cours</p>`}</section>`;
  })}</div>`;
}

export function rendreSemaine() {
  const c = calc();
  const lundi = semaine();
  const vendredi = ajouteJours(lundi, 4);
  const niveaux = [...new Set(Object.keys(c.v.classes).map((k) => niveauClasse(k, c.v)))];
  const vue = vueChoisie();
  return html`
    <div class="semaine-outils">
      <button class="btn-rond" data-action="semaine-avant" aria-label="Semaine précédente">${icone('gauche')}</button>
      <h2>Semaine du ${jourMois(lundi)} au ${jourMois(vendredi)}</h2>
      <button class="btn-rond" data-action="semaine-apres" aria-label="Semaine suivante">${icone('droite')}</button>
      ${lundi !== semaineUtile(c.tousCreneaux, c.auj) ? html`<button class="btn mini" data-action="semaine-auj">${semaineUtile(c.tousCreneaux, c.auj) === lundiDe(c.auj) ? 'Cette semaine' : 'Prochains cours'}</button>` : ''}
      <span class="segmente" role="group" aria-label="Affichage" style="margin-left:auto">
        <button data-action="semaine-vue" data-vue="liste" aria-pressed="${vue === 'liste'}">Cartes</button>
        <button data-action="semaine-vue" data-vue="grille" aria-pressed="${vue === 'grille'}">Grille horaire</button></span>
      <button class="btn mini${etat.local.persoVisible ? ' plein' : ''}" data-action="semaine-perso" aria-pressed="${etat.local.persoVisible}">${icone('personne')} Vie perso</button>
    </div>
    <div class="legende">${niveaux.map((n) => html`<span><i style="--c:${couleurNiveau(n, c.v)}"></i>${n}</span>`)}
      <span><i style="--c:var(--etab)"></i>Établissement</span><span><i style="--c:var(--perso)"></i>Perso</span>
      <span><i style="--c:var(--alerte)"></i>À préparer</span></div>
    ${vue === 'grille' ? grille() : listeSemaine()}`;
}

actions['semaine-avant'] = () => { lundiAffiche = ajouteJours(semaine(), -7); changer(); };
actions['semaine-apres'] = () => { lundiAffiche = ajouteJours(semaine(), 7); changer(); };
actions['semaine-auj'] = () => { lundiAffiche = null; changer(); };
actions['semaine-vue'] = (el) => reglerLocal({ vueSemaine: el.dataset.vue });
actions['semaine-perso'] = () => reglerLocal({ persoVisible: !etat.local.persoVisible });
actions['ouvrir-evenement'] = (el) => {
  const c = calc();
  const source = el.dataset.genre === 'perso' ? c.perso : c.etablissement;
  const e = source.find((x) => x.id === el.dataset.id);
  if (!e) return;
  ouvrirFeuille(() => ({
    titre: e.titre,
    corps: html`<p>${dateLongue(e.jour0)}${e.debut ? ` · ${heureLisible(heureDe(e.debut, c.fuseau))}–${heureLisible(heureDe(e.fin, c.fuseau))}` : ''}</p>
      ${e.lieu ? html`<p class="aide">${e.lieu}</p>` : ''}
      ${e.description ? html`<pre class="pronote-texte">${e.description}</pre>` : ''}
      <p class="aide">${el.dataset.genre === 'perso' ? `Agenda personnel${e.agenda ? ` « ${e.agenda} »` : ''} — le Carnet le lit sans jamais le modifier.` : 'Événement de l’établissement, lu dans Pronote.'}</p>`,
  }));
};
