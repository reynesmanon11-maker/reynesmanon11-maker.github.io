// Les rendez-vous perso, modifiés depuis le Carnet : ajouter, déplacer, supprimer — et c'est fait
// dans Google Agenda, tout de suite. Seulement dans les agendas perso choisis à la mise en route,
// dont on est propriétaire ou rédacteur ; jamais dans l'agenda de Pronote ni dans un rendez-vous
// dont on n'est qu'invité. En mode démo, rien ne part : les rendez-vous fictifs changent sur place.
import { actions, envois, changements } from '../actions.js';
import { html, icone, ouvrirFeuille, fermerFeuille, redessinerFeuille, toast } from '../ui.js';
import { etat, calc, reglages, definirBrut } from '../etat.js';
import { instantDe, ajouteJours, heureDe, dateLongue } from '../dates.js';
import { depuisGoogle } from '../pronote.js';
import * as G from '../google.js';
import { messageErreur } from '../synchro.js';

let edition = null; // { id, agendaId, titre, jour, jourFin, debut, fin, journee, lieu, description, descriptionInitiale, repete, envoi }

/** Les agendas où le Carnet peut écrire un rendez-vous : { id, nom, principal }. */
export function agendasModifiables() {
  const mode = etat.local.mode;
  if (mode !== 'google' && mode !== 'demo') return [];
  const choisis = mode === 'demo' ? Object.keys(etat.brut.agendas || {}) : ((reglages().source || {}).agendasPerso || []);
  return choisis.map((id) => ({ id, ...((etat.brut.agendas || {})[id] || {}) }))
    .filter((a) => a.nom && ['owner', 'writer'].includes(a.role || (mode === 'demo' ? 'owner' : '')))
    .sort((a, b) => Number(!!b.principal) - Number(!!a.principal) || String(a.nom).localeCompare(String(b.nom)));
}

const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Ouvre le formulaire : un rendez-vous existant (id), ou un nouveau, au jour et à l'heure donnés. */
export function ouvrirRendezVous({ id, jour, minutes } = {}) {
  const c = calc();
  const agendas = agendasModifiables();
  if (!agendas.length) { toast('Aucun agenda perso où écrire : choisissez-en un dans Mes données → Changer d’agenda Pronote.'); return; }
  if (id) {
    const e = c.perso.find((x) => x.id === id) || (etat.brut.perso || []).find((x) => x.id === id);
    if (!e || !e.modifiable) { toast('Ce rendez-vous ne se modifie pas d’ici (agenda partagé en lecture, ou invitation).'); return; }
    edition = {
      id, agendaId: e.agendaId, titre: e.titre, journee: !!e.journee, lieu: e.lieu || '', description: e.description || '',
      descriptionInitiale: e.description || '', repete: !!e.repete,
      jour: e.jour0, jourFin: e.jour1 || e.jour0,
      debut: e.debut ? heureDe(e.debut, c.fuseau) : '09:00', fin: e.fin ? heureDe(e.fin, c.fuseau) : '10:00',
    };
  } else {
    const m = Number.isFinite(minutes) ? minutes : 9 * 60;
    edition = {
      id: null, agendaId: agendas[0].id, titre: '', journee: false, lieu: '', description: '', descriptionInitiale: '', repete: false,
      jour: jour || c.auj, jourFin: jour || c.auj, debut: hhmm(m), fin: hhmm(Math.min(23 * 60 + 55, m + 60)),
    };
  }
  ouvrirFeuille(feuille, { surFermeture: () => { edition = null; } });
}

function feuille() {
  const e = edition, agendas = agendasModifiables();
  const demo = etat.local.mode === 'demo';
  return {
    titre: e.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous',
    corps: html`<form class="section-feuille" id="form-rdv" data-envoi="rdv-enregistrer">
      <label class="champ"><span>Intitulé</span><input type="text" id="rdv-titre" name="titre" value="${e.titre}" required autofocus placeholder="Inspection, rendez-vous parents, dentiste…"></label>
      <label class="coche"><input type="checkbox" id="rdv-journee" name="journee" data-change="rdv-journee"${e.journee ? ' checked' : ''}><span>Toute la journée</span></label>
      <div class="grille-champs">
        <label class="champ"><span>${e.journee ? 'Du' : 'Le'}</span><input type="date" id="rdv-jour" name="jour" value="${e.jour}" required></label>
        ${e.journee
          ? html`<label class="champ"><span>Au</span><input type="date" id="rdv-jourfin" name="jourFin" value="${e.jourFin}" required></label>`
          : html`<label class="champ"><span>De</span><input type="time" id="rdv-debut" name="debut" value="${e.debut}" step="300" required></label>
            <label class="champ"><span>À</span><input type="time" id="rdv-fin" name="fin" value="${e.fin}" step="300" required></label>`}
      </div>
      <label class="champ"><span>Lieu</span><input type="text" id="rdv-lieu" name="lieu" value="${e.lieu}"></label>
      <label class="champ"><span>Notes</span><textarea id="rdv-description" name="description" rows="3">${e.description}</textarea></label>
      ${agendas.length > 1 && !e.id ? html`<label class="champ"><span>Agenda</span><select id="rdv-agenda" name="agenda">${agendas.map((a) => html`<option value="${a.id}"${a.id === e.agendaId ? ' selected' : ''}>${a.nom}</option>`)}</select></label>`
        : html`<p class="aide">Agenda : ${(agendas.find((a) => a.id === e.agendaId) || {}).nom || ''}</p>`}
      ${e.repete ? html`<p class="aide">Rendez-vous répété : seule cette date est modifiée.</p>` : ''}
      <p class="aide">${demo ? 'Mode démo : le rendez-vous change ici seulement.' : 'Enregistré tout de suite dans votre Google Agenda.'}</p>
    </form>`,
    pied: html`${e.id ? html`<button class="btn danger" data-action="rdv-supprimer" data-id="${e.id}">${icone('corbeille')} Supprimer</button>` : ''}
      <button class="btn" data-action="fermer-feuille">Annuler</button>
      <button class="btn plein" type="submit" form="form-rdv" ${e.envoi ? 'disabled' : ''}>${icone('valider')} ${e.envoi ? 'Enregistrement…' : 'Enregistrer'}</button>`,
  };
}

/** Garde la saisie avant de redessiner la feuille (la case « toute la journée » change les champs). */
function relire(f) {
  if (!edition || !f) return;
  for (const k of ['titre', 'jour', 'jourFin', 'debut', 'fin', 'lieu', 'description']) if (f[k]) edition[k] = f[k].value;
  if (f.agenda) edition.agendaId = f.agenda.value;
  if (f.journee) edition.journee = f.journee.checked;
}
changements['rdv-journee'] = (el) => { relire(el.form); if (edition && edition.jourFin < edition.jour) edition.jourFin = edition.jour; redessinerFeuille(true); };

/** Le rendez-vous tel que Google l'attend. */
export function corpsGoogle(e, fuseau) {
  const corps = { summary: e.titre.trim(), location: e.lieu.trim() };
  if (e.journee) {
    corps.start = { date: e.jour };
    corps.end = { date: ajouteJours(e.jourFin < e.jour ? e.jour : e.jourFin, 1) };
  } else {
    corps.start = { dateTime: instantDe(e.jour, e.debut, fuseau).toISOString(), timeZone: fuseau };
    corps.end = { dateTime: instantDe(e.jour, e.fin, fuseau).toISOString(), timeZone: fuseau };
  }
  // Les notes ne repartent que si on les a changées : une description riche (liens, mise en forme)
  // écrite dans Google n'est pas aplatie en texte simple pour rien.
  if (e.description !== e.descriptionInitiale || !e.id) corps.description = e.description.trim();
  return corps;
}

/** Remplace (ou retire, si `nouveau` est nul) un rendez-vous dans ce que le Carnet a lu. */
function remplacerLocal(id, nouveau) {
  const l = (etat.brut.perso || []).filter((x) => x.id !== id);
  if (nouveau) l.push(nouveau);
  definirBrut({ perso: l });
}

async function autorisation() {
  if (G.peutModifierRendezVous()) return true;
  // Pas connecté, ou connecté avant que le Carnet sache modifier les rendez-vous : Google demande l'accord.
  await G.connecter({ indice: etat.local.compte && etat.local.compte.email });
  if (!G.peutModifierRendezVous()) throw Object.assign(new Error('Google n’a pas accordé la modification des agendas : reconnectez-vous en cochant toutes les autorisations.'), { code: 'portee' });
  return true;
}

envois['rdv-enregistrer'] = async (f) => {
  if (!edition || edition.envoi) return;
  relire(f);
  const e = edition, c = calc();
  if (!e.titre.trim()) { toast('Donnez un intitulé au rendez-vous.'); return; }
  if (!e.journee && e.fin <= e.debut) { toast('L’heure de fin doit venir après celle du début.'); return; }
  const corps = corpsGoogle(e, c.fuseau);
  const agenda = (etat.brut.agendas || {})[e.agendaId] || {};
  const garde = (ev) => ({ ...depuisGoogle(ev, c.fuseau), agenda: agenda.nom, agendaId: e.agendaId, modifiable: true, repete: e.repete });
  if (etat.local.mode === 'demo') {
    const id = e.id || `demo-rdv-${Date.now().toString(36)}`;
    const avant = (etat.brut.perso || []).find((x) => x.id === id) || {};
    remplacerLocal(id, garde({ id, summary: corps.summary, location: corps.location, description: corps.description ?? avant.description ?? '', start: corps.start, end: corps.end }));
    fermerFeuille();
    toast(e.id ? 'Rendez-vous modifié (démo).' : 'Rendez-vous ajouté (démo).');
    return;
  }
  e.envoi = true; redessinerFeuille(true);
  try {
    await autorisation();
    const ev = e.id ? await G.modifierEvenement(e.agendaId, e.id, corps) : await G.creerEvenement(e.agendaId, corps);
    remplacerLocal(e.id || ev.id, garde(ev));
    fermerFeuille();
    toast(e.id ? 'Rendez-vous modifié dans Google Agenda.' : 'Rendez-vous ajouté à Google Agenda.');
  } catch (err) {
    if (edition) { edition.envoi = false; redessinerFeuille(true); }
    toast(err.code === 'portee' ? err.message : messageErreur(err));
  }
};

actions['rdv-nouveau'] = (el) => ouvrirRendezVous({ jour: el.dataset.jour });
actions['rdv-modifier'] = (el) => ouvrirRendezVous({ id: el.dataset.id });
// Un toucher dans une case vide de la grille : un rendez-vous à cette heure-là.
actions['rdv-creneau'] = (el, ev) => {
  if (!agendasModifiables().length) return;
  const r = el.getBoundingClientRect();
  const minutes = Number(el.dataset.debut) + (ev.clientY - r.top) / Number(el.dataset.px || 1.05);
  ouvrirRendezVous({ jour: el.dataset.jour, minutes: Math.max(0, Math.floor(minutes / 15) * 15) });
};

actions['rdv-supprimer'] = async (el) => {
  const id = el.dataset.id;
  const e = (etat.brut.perso || []).find((x) => x.id === id);
  if (!e) return;
  if (el.dataset.confirme !== '1') {
    el.dataset.confirme = '1';
    el.textContent = e.repete ? 'Supprimer cette date ? Toucher encore' : 'Supprimer de Google Agenda ? Toucher encore';
    return;
  }
  if (etat.local.mode === 'demo') { remplacerLocal(id, null); fermerFeuille(); toast('Rendez-vous supprimé (démo).'); return; }
  el.disabled = true;
  try {
    await autorisation();
    await G.supprimerEvenement(e.agendaId, id);
    remplacerLocal(id, null);
    fermerFeuille();
    toast(`« ${e.titre} » supprimé de Google Agenda${e.jour0 ? `, ${dateLongue(e.jour0)}` : ''}.`);
  } catch (err) {
    el.disabled = false;
    toast(err.code === 'portee' ? err.message : messageErreur(err));
  }
};
