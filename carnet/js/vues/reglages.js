// Réglages : apparence (propre à l'appareil), compte et synchronisation, Google Agenda,
// progression, données (sauvegarde, import, effacement), et ce que l'appli fait de vos données.
import { actions, changements } from '../actions.js';
import { html, icone, toast, telecharger, ouvrirFeuille, fermerFeuille } from '../ui.js';
import { etat, calc, reglerLocal, reglages, modifierReglages, importerDocs, remplacerDocs, definirBrut, definirSynchro } from '../etat.js';
import { exporter, importer } from '../donnees.js';
import { effacerTout } from '../stockage.js';
import { dateCourte, heureDe, heureLisible, jourDe } from '../dates.js';
import { CONFIG } from '../../config.js';
import * as G from '../google.js';
import { synchroniser, toutRetirer, messageErreur, lireLienIcal, lireTexteIcal, bilanLecture } from '../synchro.js';
import { allerDemarrage } from './demarrer.js';
import { COULEURS_EVENEMENT } from '../agenda.js';
import { installation, installee } from '../installation.js';

const ACCENTS = [['vert', 'Vert', '#2f7150'], ['ambre', 'Ambre', '#9a5c0c'], ['terracotta', 'Terracotta', '#a9592a'], ['bleu', 'Bleu', '#2f5d9e'], ['violet', 'Violet', '#66499c']];

function quand(ms) {
  if (!ms) return 'jamais';
  const c = calc(), d = new Date(ms);
  return `${jourDe(d, c.fuseau) === c.auj ? "aujourd'hui" : dateCourte(jourDe(d, c.fuseau))} à ${heureLisible(heureDe(d, c.fuseau))}`;
}

export function rendreReglages() {
  const l = etat.local, r = reglages(), e = r.ecriture || {};
  const mode = l.mode;
  return html`<div class="titre-page"><div><h1>Réglages</h1><p>Version ${CONFIG.version}</p></div></div>
  <div class="classes">
    <section class="carte section-feuille"><h2>Apparence <span class="aide">· cet appareil</span></h2>
      <div class="outils"><span>Thème</span><span class="segmente" role="group" aria-label="Thème">
        ${[['light', 'Clair'], ['dark', 'Sombre'], ['auto', 'Comme l’appareil']].map(([k, v]) => html`<button data-action="regler-theme" data-valeur="${k}" aria-pressed="${l.theme === k}">${v}</button>`)}</span></div>
      <div class="outils"><span>Couleur</span><span class="nuancier">${ACCENTS.map(([k, v, c]) => html`<button style="--c:${c}" aria-label="${v}" title="${v}" aria-pressed="${l.accent === k}" data-action="regler-accent" data-valeur="${k}"></button>`)}</span></div>
      <div class="outils"><span>Densité</span><span class="segmente" role="group" aria-label="Densité">
        ${[['confort', 'Aérée'], ['compacte', 'Compacte']].map(([k, v]) => html`<button data-action="regler-densite" data-valeur="${k}" aria-pressed="${l.densite === k}">${v}</button>`)}</span></div>
      <p class="aide">Le tableau de bord se range depuis l'accueil, bouton « Personnaliser ».</p>
    </section>

    <section class="carte section-feuille"><h2>Installer et partager</h2>
      <p>${installee() ? 'Le Carnet est installé sur cet appareil : il s’ouvre depuis son icône, même sans réseau.' : 'Installé, le Carnet s’ouvre depuis son icône, comme une application, même sans réseau.'}</p>
      <div class="outils">
        ${installation() ? html`<button class="btn plein" data-action="installer">${icone('telecharger')} Installer sur cet appareil</button>` : ''}
        <button class="btn" data-action="partager">${icone('partager')} Partager, ou ouvrir sur un téléphone</button>
      </div>
      <p class="aide">Le partage montre un QR code à viser avec un téléphone, le lien, et un message tout prêt pour un collègue.</p>
    </section>

    <section class="carte section-feuille"><h2>Compte et synchronisation</h2>
      ${mode === 'google' ? html`<p>${icone('google')} Connecté avec <b>${(l.compte && l.compte.email) || 'votre compte Google'}</b>.</p>
        <p class="aide">Dernière synchronisation : ${quand(l.derniereSynchro)}. ${etat.brut.pronoteMaj ? html`Google a relu Pronote ${quand(Date.parse(etat.brut.pronoteMaj))}.` : ''}</p>
        <div class="outils"><button class="btn plein" data-action="synchro-forcee">${icone('synchro')} Synchroniser</button>
          <button class="btn" data-action="changer-source">Changer d'agenda Pronote</button>
          <button class="btn danger" data-action="google-deconnecter">Se déconnecter</button></div>`
      : mode === 'local' ? html`<p>Sans compte : les données restent sur cet appareil.</p>
        <p class="aide">Emploi du temps lu ${quand(etat.brut.lu)}${etat.brut.nomIcal ? ` (${etat.brut.nomIcal})` : ''}.</p>
        <div class="outils">${l.ics && l.ics.url ? html`<button class="btn" data-action="relire-ical">${icone('synchro')} Relire le lien</button>` : ''}
          <label class="btn">${icone('fichier')} Réimporter un fichier .ics<input type="file" accept=".ics,text/calendar" data-change="reimporter-ics" class="visuellement-cache"></label>
          ${G.googleConfigure() ? html`<button class="btn" data-action="passer-google">${icone('google')} Passer à Google</button>` : ''}</div>`
      : html`<p>Mode démo : rien n'est envoyé nulle part.</p><div class="outils"><a class="btn plein" href="#/demarrer">Commencer pour de vrai</a></div>`}
      ${G.googleConfigure() ? '' : html`<p class="aide">La connexion Google n'est pas encore activée sur cette adresse : <a href="brancher-google.html">comment l'activer</a> (une fois, par la personne qui publie le Carnet).</p>`}
    </section>

    ${mode === 'google' ? html`<section class="carte section-feuille"><h2>Google Agenda</h2>
      <label class="coche"><input type="checkbox" data-change="ecriture-actif"${e.actif ? ' checked' : ''}><span>Écrire mes cours dans Google Agenda</span></label>
      ${e.actif ? html`<div class="grille-champs">
        <label class="champ"><span>Agendas</span><select data-change="ecriture-mode"><option value="niveau"${e.parNiveau !== false ? ' selected' : ''}>Un par niveau</option><option value="unique"${e.parNiveau === false ? ' selected' : ''}>Un seul</option></select></label>
        <label class="champ"><span>Évaluations en</span><select data-change="ecriture-eval">${Object.entries(COULEURS_EVENEMENT).map(([k, v]) => html`<option value="${k}"${String(e.couleurEval ?? '10') === k ? ' selected' : ''}>${v}</option>`)}</select></label>
        <label class="champ"><span>Rappel</span><select data-change="ecriture-rappel">${[[0, 'Aucun'], [5, '5 min avant'], [10, '10 min avant'], [15, '15 min avant']].map(([k, v]) => html`<option value="${k}"${Number(e.rappel || 0) === k ? ' selected' : ''}>${v}</option>`)}</select></label>
        <label class="champ"><span>À l'avance</span><select data-change="ecriture-semaines">${[2, 4, 6, 8].map((k) => html`<option value="${k}"${Number(e.semaines || 6) === k ? ' selected' : ''}>${k} semaines</option>`)}</select></label>
      </div>
      <label class="coche"><input type="checkbox" data-change="ecriture-etab"${e.etablissement !== false ? ' checked' : ''}><span>Recopier aussi les réunions et les vacances de Pronote</span></label>
      <p class="aide">Dernière écriture : ${quand(l.derniereEcriture)}. Les couleurs par niveau se règlent dans la mise en route (« Changer d'agenda Pronote » y ramène).</p>
      <button class="btn danger" data-action="tout-retirer">Retirer du Google Agenda tout ce que le Carnet a écrit</button>` : ''}
    </section>` : ''}

    <section class="carte section-feuille"><h2>Progression</h2>
      <div class="grille-champs">
        <label class="champ"><span>Suivi depuis le</span><input type="date" value="${r.debut || ''}" data-change="regler-debut"></label>
        <label class="champ"><span>Durée d'une séance</span><select data-change="regler-duree"><option value="">Automatique (${calc().dureeSeance} min)</option>${[45, 50, 55, 60].map((m) => html`<option value="${m}"${Number(r.dureeSeance) === m ? ' selected' : ''}>${m} min</option>`)}</select></label>
        <label class="champ"><span>Annoncer les évaluations</span><select data-change="regler-annonce">${[3, 5, 7, 10, 14].map((j) => html`<option value="${j}"${Number(r.annonceJours || 7) === j ? ' selected' : ''}>${j} jours avant</option>`)}</select></label>
      </div>
      ${(r.exclus || []).length ? html`<p class="aide">Cours ignorés : ${r.exclus.join(', ')} <button class="lien" data-action="reprendre-exclus">les reproposer</button></p>` : ''}
    </section>

    <section class="carte section-feuille"><h2>Mes données</h2>
      <div class="outils">
        <button class="btn" data-action="exporter">${icone('telecharger')} Sauvegarder (fichier)</button>
        <label class="btn">${icone('televerser')} Importer<input type="file" accept=".json,application/json" data-change="importer" class="visuellement-cache"></label>
        <button class="btn danger" data-action="tout-effacer">Tout effacer sur cet appareil</button>
      </div>
      <p class="aide">« Importer » accepte une sauvegarde du Carnet, l'export du « Carnet de bord SVT » de claude.ai, ou la progression d'un collègue. Les étapes et les validations importées remplacent celles d'ici ; vos réglages, et le nom et l'effectif de vos classes, restent.</p>
    </section>

    <section class="carte section-feuille"><h2>Ce que le Carnet fait de vos données</h2>
      <ul class="petit">
        <li>Il lit l'<b>emploi du temps</b> exporté par Pronote — jamais votre mot de passe, ni notes, ni élèves.</li>
        <li>Vos classes, étapes et validations restent <b>sur cet appareil</b>${mode === 'google' ? html` et dans un <b>dossier caché de votre Google Drive</b>, que seule l'appli peut lire` : ''}. Aucun serveur du Carnet ne les reçoit.</li>
        ${mode === 'google' ? html`<li>Dans Google Agenda, il <b>lit</b> les agendas choisis et <b>n'écrit que dans les siens</b> (« Carnet · … »).</li>` : ''}
        <li>Aucune donnée d'élève n'est demandée ni stockée.</li>
      </ul>
    </section>
  </div>`;
}

const apparence = (patch) => {
  reglerLocal(patch);
  try { localStorage.setItem('carnet-apparence', JSON.stringify({ theme: etat.local.theme, accent: etat.local.accent, densite: etat.local.densite })); } catch { /* sans stockage */ }
};
actions['regler-theme'] = (el) => apparence({ theme: el.dataset.valeur });
actions['regler-accent'] = (el) => apparence({ accent: el.dataset.valeur });
actions['regler-densite'] = (el) => apparence({ densite: el.dataset.valeur });
export { apparence };

actions['synchro-forcee'] = async () => {
  if (!G.connecte()) { try { await G.connecter(); } catch (e) { toast(messageErreur(e)); return; } }
  await synchroniser();
};
actions['changer-source'] = () => { allerDemarrage('pronote', 'google'); location.hash = '#/demarrer'; };
actions['passer-google'] = () => { allerDemarrage('connexion', 'google'); location.hash = '#/demarrer'; };
actions['google-deconnecter'] = () => {
  G.deconnecter();
  reglerLocal({ mode: 'local', compte: null });
  definirSynchro('repos', '');
  toast('Déconnecté. Vos données restent sur cet appareil et dans votre Google Drive.');
};
actions['relire-ical'] = async () => {
  try { toast(`Emploi du temps relu : ${bilanLecture(await lireLienIcal(etat.local.ics.url))}`); } catch (e) { toast(e.message); }
};
changements['reimporter-ics'] = async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  try { toast(bilanLecture(lireTexteIcal(await f.text()))); } catch (e) { toast(e.message); }
};

const ecriture = (patch) => { modifierReglages((r) => { r.ecriture = { ...(r.ecriture || {}), ...patch }; }); };
changements['ecriture-actif'] = (el) => ecriture({ actif: el.checked, parNiveau: (reglages().ecriture || {}).parNiveau !== false });
changements['ecriture-mode'] = (el) => ecriture({ parNiveau: el.value === 'niveau' });
changements['ecriture-eval'] = (el) => ecriture({ couleurEval: el.value });
changements['ecriture-rappel'] = (el) => ecriture({ rappel: Number(el.value) });
changements['ecriture-semaines'] = (el) => ecriture({ semaines: Number(el.value) });
changements['ecriture-etab'] = (el) => ecriture({ etablissement: el.checked });
actions['tout-retirer'] = (el) => {
  if (el.dataset.confirme !== '1') { el.dataset.confirme = '1'; el.textContent = 'Sûr ? Les agendas « Carnet » seront supprimés.'; return; }
  (async () => {
    if (!G.connecte()) { try { await G.connecter(); } catch (e) { toast(messageErreur(e)); return; } }
    try { await toutRetirer(); toast('Agendas du Carnet supprimés de Google Agenda.'); } catch (e) { toast(messageErreur(e)); }
  })();
};

changements['regler-debut'] = (el) => { if (el.value) modifierReglages((r) => { r.debut = el.value; }); };
changements['regler-duree'] = (el) => modifierReglages((r) => { r.dureeSeance = el.value ? Number(el.value) : null; });
changements['regler-annonce'] = (el) => modifierReglages((r) => { r.annonceJours = Number(el.value); });
actions['reprendre-exclus'] = () => modifierReglages((r) => { r.exclus = []; });

actions['exporter'] = () => {
  telecharger(`carnet-de-bord-${calc().auj}.json`, exporter(etat.docs));
  toast('Sauvegarde téléchargée.');
};
changements['importer'] = async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  try {
    const { docs, origine } = importer(await f.text());
    importerDocs(docs);
    toast(origine === 'carnet-claude' ? 'Carnet SVT importé.' : 'Sauvegarde importée.');
  } catch (e) { toast(e.message); }
  el.value = '';
};
actions['tout-effacer'] = () => {
  ouvrirFeuille(() => ({
    titre: 'Tout effacer sur cet appareil ?',
    corps: html`<p>Classes, étapes, validations, tâches et réglages disparaîtront de <b>cet appareil</b>.</p>
      ${etat.local.mode === 'google' ? html`<p class="aide">La copie de votre Google Drive n'est pas touchée : en vous reconnectant, tout revient. Ni les agendas « Carnet » de Google.</p>` : html`<p class="aide">Pensez à « Sauvegarder (fichier) » d'abord si vous voulez les garder.</p>`}`,
    pied: html`<button class="btn" data-action="fermer-feuille">Annuler</button><button class="btn plein" data-action="tout-effacer-ok">Tout effacer</button>`,
  }));
};
actions['tout-effacer-ok'] = async () => {
  G.deconnecter();
  await effacerTout();
  try { localStorage.removeItem('carnet-apparence'); } catch { /* sans stockage */ }
  remplacerDocs({});
  definirBrut({ pronote: [], perso: [], agendas: {}, lu: null });
  reglerLocal({ mode: null, compte: null, ics: { url: '' }, disposition: null });
  fermerFeuille();
  location.hash = '#/demarrer';
};
