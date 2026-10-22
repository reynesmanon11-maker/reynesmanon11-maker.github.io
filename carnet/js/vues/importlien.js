// Importer une progression par un simple lien : …/carnet/#importer=<données>. Les données voyagent
// dans la partie de l'adresse après « # », que le navigateur n'envoie à aucun serveur. Rien n'est
// importé sans confirmation : on montre d'abord ce que le lien contient.
import { actions } from '../actions.js';
import { html, icone, toast, ouvrirFeuille, fermerFeuille } from '../ui.js';
import { etat, calc, importerDocs } from '../etat.js';
import { importer, vue } from '../donnees.js';

let enAttente = null;

/** Le texte d'un lien d'import (base64url d'un JSON, en UTF-8). */
export function decoderLien(code) {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const octets = Uint8Array.from(atob(b64 + '==='.slice((b64.length + 3) % 4)), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(octets);
}

/** L'inverse : de quoi fabriquer un lien d'import à partir d'un export. */
export function coderLien(texte) {
  let bin = '';
  for (const o of new TextEncoder().encode(texte)) bin += String.fromCharCode(o);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function proposerImportLien(code) {
  let docs, origine;
  try {
    ({ docs, origine } = importer(decoderLien(code)));
  } catch {
    toast("Ce lien d'import est abîmé ou incomplet : demandez-le à nouveau.");
    return;
  }
  const v = vue(docs);
  const classes = Object.values(v.classes);
  const etapes = Object.keys(v.etapes).length;
  const validations = Object.keys(v.journal).length;
  const ici = calc().v.classes;
  enAttente = docs;
  ouvrirFeuille(() => ({
    titre: 'Importer une progression',
    corps: etat.local.mode === 'demo'
      ? html`<p>Vous êtes en mode démo : l'import mélangerait ces données aux classes fictives.</p><p><a class="btn plein" href="#/demarrer">Commencer pour de vrai</a>, puis rouvrez le lien.</p>`
      : html`<p>${origine === 'carnet-claude' ? 'Ce lien vient du « Carnet de bord SVT » de claude.ai.' : 'Ce lien contient une progression du Carnet.'} Il apporte :</p>
        <ul>
          <li><b>${classes.length} classe${classes.length > 1 ? 's' : ''}</b> : ${classes.map((c) => c.nom || c.code).join(', ')}${classes.some((c) => !ici[c.code]) ? ' (celles qui manquent ici seront ajoutées)' : ''} ;</li>
          <li><b>${etapes} étape${etapes > 1 ? 's' : ''}</b>, avec l'endroit où chaque classe en est${validations ? html` et <b>${validations} point${validations > 1 ? 's' : ''} d'arrêt</b>` : ''}.</li>
        </ul>
        <p class="aide">Les étapes de ces classes remplacent celles d'ici, avec les points d'arrêt qui portaient sur les anciennes étapes. Vos réglages, et le nom et l'effectif de vos classes, restent. La suite se calcule aussitôt sur vos prochains cours${etat.local.mode === 'google' ? ', et part dans Google Agenda' : ''}.</p>`,
    pied: etat.local.mode === 'demo' ? '' : html`<button class="btn" data-action="fermer-feuille">Annuler</button><button class="btn plein" data-action="importer-lien">${icone('televerser')} Importer</button>`,
  }), { surFermeture: () => { enAttente = null; } });
}

actions['importer-lien'] = () => {
  if (!enAttente) return;
  importerDocs(enAttente);
  enAttente = null;
  fermerFeuille();
  location.hash = '#/accueil';
  toast('Progression importée : la suite est prévue sur vos prochains cours.');
};
