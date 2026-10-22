// La feuille d'un cours : ce qui est prévu, ce qu'il faut annoncer ou préparer, le texte pour
// le cahier de textes, et surtout « où vous êtes-vous arrêtés ? » — un toucher sur le dernier
// jalon atteint, ou « Comme prévu ». Pensé pour la fin d'une heure, le téléphone à la main.
import { actions, changements, saisies } from '../actions.js';
import { html, icone, ouvrirFeuille, fermerFeuille, redessinerFeuille, toast, copier } from '../ui.js';
import { calc, ecrireDoc, supprimerDoc, modifierDoc, nomClasse } from '../etat.js';
import { pointsArret, positionDe, EPS, seancesLisible } from '../moteur.js';
import { dateLongue, dateCourte } from '../dates.js';
import { horaires, segments, pastille, etiquetteEtat, avertissementsFormat } from './commun.js';

let choix = null; // { cle, pos: { i, f }, prevu: { i, f }, note }

const trouver = (cle) => { const c = calc(); return c.tousCreneaux.find((x) => x.cle === cle) || null; };

/** Position de la classe avant ce créneau, et position prévue à la fin. */
function bornes(cr) {
  const { plan } = calc();
  const pc = plan.parCreneau[cr.cle], pcl = plan.parClasse[cr.code];
  if (!pc || !pcl) return null;
  const idx = (u) => pcl.file.findIndex((it) => it.u === u);
  const segs = (pc.segments || []).filter((s) => !s.recul);
  if (segs.length) {
    const p = segs[0], d = segs[segs.length - 1];
    return { avant: { i: idx(p.u), f: p.de }, prevu: { i: idx(d.u), f: d.a } };
  }
  const fin = pcl.positionFinale;
  return { avant: fin, prevu: fin };
}

/** Ramène un point sur le dernier jalon atteint : on ne propose que des points qu'on peut toucher. */
function aligner(pos, file) {
  if (!pos || pos.i >= file.length) return pos;
  const e = calc().v.etapes[file[pos.i].eid];
  let f = 0;
  for (const p of pointsArret(e)) if (p.f <= pos.f + EPS) f = p.f;
  return { i: pos.i, f };
}

function initChoix(cle) {
  const c = calc(), cr = trouver(cle);
  if (!cr || !c.plan.parClasse[cr.code]) { choix = null; return; }
  const file = c.plan.parClasse[cr.code].file;
  const b = bornes(cr);
  if (b) b.prevu = aligner(b.prevu, file);
  const j = c.v.journal[cle];
  let pos = b ? b.prevu : { i: 0, f: 0 };
  if (j && j.arret) {
    const i = file.findIndex((it) => it.u === j.arret.u);
    pos = aligner(i >= 0 ? { i, f: Number(j.arret.f) || 0 } : (positionDe(j.arret, file) || pos), file);
  }
  choix = { cle, pos, prevu: b ? b.prevu : pos, note: (j && j.note) || '' };
}

export function ouvrirCreneau(cle, { valider = false } = {}) {
  const cr = trouver(cle);
  if (!cr) { toast("Ce cours n'est plus dans l'emploi du temps."); return; }
  choix = null;
  if (valider) initChoix(cle);
  ouvrirFeuille(() => contenu(cle), { surFermeture: () => { choix = null; } });
}

function textePronote(cr) {
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

const memePoint = (a, b) => a && b && a.i === b.i && Math.abs(a.f - b.f) < 0.01;

function choixArret(cr) {
  const { plan, v } = calc();
  const pcl = plan.parClasse[cr.code];
  if (!pcl || !pcl.file.length) {
    return html`<p class="vide">La file de cette classe est vide.</p><a class="btn" href="#/classes/${cr.code}">Ajouter des étapes</a>`;
  }
  const b = bornes(cr) || { avant: { i: 0, f: 0 } };
  const premiere = Math.min(b.avant.i, choix.pos.i);
  const de = Math.max(0, choix.precedente ? premiere - 1 : premiere);
  const a = Math.min(pcl.file.length - 1, Math.max(b.avant.i, choix.pos.i, choix.prevu.i) + 2);
  const etapes = [];
  for (let i = de; i <= a; i++) {
    const it = pcl.file[i], e = v.etapes[it.eid];
    if (!e) continue;
    const pts = pointsArret(e);
    const estPrevue = choix.prevu.i === i || (choix.prevu.i === i + 1 && choix.prevu.f < EPS);
    etapes.push(html`<div class="arret-etape${estPrevue ? ' prevue' : ''}">
      <div class="titre"><span>${e.eval ? '✎ ' : ''}${e.titre}</span><span class="aide">${seancesLisible(Number(e.duree) || 1)}</span></div>
      <div class="puces" role="group" aria-label="Point d'arrêt dans ${e.titre}">
        ${pts.map((p, k) => {
          const point = { i, f: p.f };
          const fin = k === pts.length - 1;
          const libelle = k === 0 ? p.libelle : fin ? (p.libelle === 'Terminée' ? 'Terminée ✓' : `${p.libelle} ✓ terminée`) : `${p.libelle} ✓`;
          return html`<button class="puce${memePoint(point, choix.prevu) ? ' prevue' : ''}" aria-pressed="${memePoint(point, choix.pos)}" data-action="arret-choisir" data-i="${i}" data-f="${p.f}">${libelle}</button>`;
        })}
      </div>
    </div>`);
  }
  return html`<div class="arret">
    <p class="aide">Touchez le dernier jalon <b>terminé</b>. La suite glisse toute seule sur les prochains cours. En pointillés : ce qui était prévu.</p>
    ${de > 0 && !choix.precedente ? html`<div><button class="lien petit" data-action="arret-precedente">Afficher l'étape précédente</button></div>` : ''}
    ${etapes}
    <label class="champ"><span>Remarque (facultatif)</span>
      <input type="text" id="arret-note" data-saisie="arret-note" value="${choix.note}" placeholder="ex. P1 plus lente, manque la question 4" autocomplete="off"></label>
  </div>`;
}

function contenu(cle) {
  const c = calc();
  const cr = trouver(cle);
  if (!cr) return { titre: 'Cours introuvable', corps: html`<p class="vide">Ce cours n'est plus dans l'emploi du temps.</p>` };
  const suivie = !!c.v.classes[cr.code];
  const pc = c.plan.parCreneau[cle];
  const commence = cr.debut <= c.maintenant;
  const annonces = c.plan.annonces[cle] || [];
  const txt = textePronote(cr);
  const cl = c.v.classes[cr.code] || {};
  const aPrevoir = pc && pc.etat === 'prevu'
    ? pc.segments.filter((s) => s.de < EPS).map((s) => ({ s, e: c.v.etapes[s.eid] })).filter((x) => x.e && (x.e.afaire || x.e.photocopies > 0))
    : [];
  const corps = html`
    <div class="cours-haut">${pastille(cr.code)}<span class="heure">${horaires(cr)}</span>${cr.salle ? html`<span>salle ${cr.salle}</span>` : ''}${etiquetteEtat(cr)}</div>
    ${cr.accompagnants.length ? html`<p class="aide">${icone('personne')} Avec ${cr.accompagnants.join(', ')}</p>` : ''}
    ${cr.inclusions.length ? html`<p class="aide">Élèves en inclusion : ${cr.inclusions.join(', ')}</p>` : ''}
    ${cr.statut ? html`<p class="aide">Pronote : ${cr.statut}</p>` : ''}
    ${!suivie ? html`<div class="bandeau"><span>Cette classe n'est pas encore suivie dans le Carnet.</span><button class="btn mini plein" data-action="suivre-classe" data-code="${cr.code}">La suivre</button></div>` : html`
    ${choix && choix.cle === cle && !cr.annule && commence ? html`<section class="section-feuille"><h3>Où vous êtes-vous arrêtés ?</h3>${choixArret(cr)}</section>` : ''}
    <section class="section-feuille"><h3>${pc && pc.etat === 'valide' ? 'Fait' : 'Prévu'}</h3>${segments(cr)}${avertissementsFormat(cr).map((t) => html`<p class="avert">${icone('alerte')} ${t}</p>`)}</section>
    ${annonces.length ? html`<section class="section-feuille"><h3>À annoncer</h3>${annonces.map((a) => html`<div class="annonce${a.tard ? ' tard' : ''}"><span>${icone('annonce')} ${a.titre}, ${dateLongue(a.jourEval)}</span><button class="btn mini" data-action="annonce-faite" data-code="${a.code}" data-u="${a.u}">C'est fait</button></div>`)}</section>` : ''}
    ${aPrevoir.length ? html`<section class="section-feuille"><h3>À préparer</h3>${aPrevoir.map(({ s, e }) => {
      const id = `prep_${cle}_${s.u}`, fait = !!(c.v.coches[id] && c.v.coches[id].fait);
      const quoi = [e.photocopies > 0 ? `Photocopies : ${cl.effectif ? `${cl.effectif} élèves × ${e.photocopies} page${e.photocopies > 1 ? 's' : ''} = ${cl.effectif * e.photocopies}` : `${e.photocopies} page(s) par élève`}` : '', e.afaire].filter(Boolean).join(' · ');
      return html`<label class="coche${fait ? ' faite' : ''}"><input type="checkbox" data-change="coche" data-id="${id}"${fait ? ' checked' : ''}><span>${quoi}<br><span class="aide">${e.titre}</span></span></label>`;
    })}</section>` : ''}
    ${txt ? html`<section class="section-feuille"><h3>Cahier de textes</h3><pre class="pronote-texte" id="texte-pronote">${txt}</pre><div><button class="btn mini" data-action="copier-pronote">${icone('copier')} Copier pour Pronote</button></div></section>` : ''}
    ${!cr.annule && commence && !(choix && choix.cle === cle) ? html`<div><button class="btn plein" data-action="valider" data-cle="${cle}">${icone('valider')} ${pc && pc.etat === 'valide' ? 'Modifier le point d’arrêt' : 'Où en est-on ?'}</button></div>` : ''}
    ${!commence && !cr.annule ? html`<p class="aide">Le point d'arrêt se note une fois le cours commencé.</p>` : ''}
  `}`;
  const pied = choix && choix.cle === cle ? html`
    ${c.v.journal[cle] ? html`<button class="btn danger" data-action="arret-effacer">Effacer</button>` : ''}
    <button class="btn" data-action="arret-comme-prevu">Comme prévu</button>
    <button class="btn plein" data-action="arret-enregistrer">${icone('valider')} Enregistrer</button>` : null;
  return { titre: `${nomClasse(cr.code, c.v)} · ${dateLongue(cr.jour)}`, corps, pied };
}

// ---------- Actions ----------
actions['ouvrir-creneau'] = (el) => ouvrirCreneau(el.dataset.cle);
actions['valider'] = (el) => {
  const cle = el.dataset.cle;
  initChoix(cle);
  const ouvert = document.querySelector('dialog.feuille[open]');
  if (ouvert) redessinerFeuille(true); else ouvrirCreneau(cle, { valider: true });
};
actions['arret-precedente'] = () => { if (choix) { choix.precedente = true; redessinerFeuille(true); } };
actions['arret-choisir'] = (el) => {
  if (!choix) return;
  choix.pos = { i: Number(el.dataset.i), f: Number(el.dataset.f) };
  redessinerFeuille(true);
};
saisies['arret-note'] = (el) => { if (choix) choix.note = el.value; };

function enregistrer(pos) {
  const c = calc(), cr = trouver(choix.cle);
  const file = c.plan.parClasse[cr.code].file;
  const it = file[Math.min(pos.i, file.length - 1)];
  const arret = pos.i >= file.length ? { u: file[file.length - 1].u, f: 1, rang: file.length } : { u: it.u, f: Math.round(pos.f * 1000) / 1000, rang: pos.i };
  ecrireDoc(`journal/${cr.cle}`, { code: cr.code, jour: cr.jour, arret, note: (choix.note || '').trim(), le: new Date().toISOString() });
  choix = null;
  redessinerFeuille(true);
  toast(`Point d'arrêt enregistré pour la ${nomClasse(cr.code)}. La suite glisse sur les prochains cours.`);
}
actions['arret-enregistrer'] = () => { if (choix) enregistrer(choix.pos); };
actions['arret-comme-prevu'] = () => { if (choix) enregistrer(choix.prevu); };
actions['arret-effacer'] = () => {
  if (!choix) return;
  supprimerDoc(`journal/${choix.cle}`);
  choix = null;
  redessinerFeuille(true);
  toast('Validation effacée : ce cours redevient « comme prévu ».');
};
actions['annonce-faite'] = (el) => {
  const { code, u } = el.dataset;
  modifierDoc(`classes/${code}`, (d) => { d.annonces = { ...(d.annonces || {}), [u]: true }; });
  toast('Annonce notée.');
};
actions['copier-pronote'] = async () => {
  const pre = document.getElementById('texte-pronote');
  if (!pre) return;
  toast(await copier(pre.textContent, pre) ? 'Texte copié : collez-le dans le cahier de textes.' : 'Texte sélectionné : copiez-le avec Ctrl+C.');
};
changements['coche'] = (el) => {
  const id = el.dataset.id;
  if (el.checked) ecrireDoc(`coches/${id}`, { fait: true }); else supprimerDoc(`coches/${id}`);
};

export { dateCourte };
