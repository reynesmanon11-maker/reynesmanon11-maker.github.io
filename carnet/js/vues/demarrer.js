// Mise en route, pas à pas : se connecter, trouver l'agenda Pronote, choisir ses classes, régler
// ce qui s'écrit dans Google Agenda, puis démarrer. Chaque écran dit ce qu'il fait et ce qu'il
// ne fait pas : c'est un collègue qui découvre l'outil qui le lit, pas son auteur.
import { actions, changements, envois } from '../actions.js';
import { html, icone, toast, ouvrirFeuille, fermerFeuille } from '../ui.js';
import { etat, calc, reglerLocal, remplacerDocs, fusionnerDocs, importerDocs, ecrireDoc, modifierReglages, reglages, definirBrut, classesDetectees, definirSynchro } from '../etat.js';
import { evenementsDemo, donneesDemo, validationsDemo } from '../demo.js';
import { importer } from '../donnees.js';
import { estLienIcal, estQrConnexionPronote } from '../pronote.js';
import { CONFIG } from '../../config.js';
import { FUSEAU_APPAREIL, aujourdhui, lundiDe } from '../dates.js';
import * as G from '../google.js';
import { lireAgendas, agendasPronote, lireLienIcal, lireTexteIcal, bilanLecture, synchroniser, messageErreur, recupererDrive } from '../synchro.js';
import { COULEURS_NIVEAUX, COULEURS_EVENEMENT, DESCRIPTION_AGENDA } from '../agenda.js';
import { installation } from '../installation.js';
import { ouvrirImportProgression } from './programmation.js';

let etape = 'accueil';
let voie = null; // 'google' | 'local'
let attente = false; // false, 'fenetre' (Google est ouvert) ou 'lecture' (le Carnet lit les agendas)
const NUANCIER = ['#4fae7a', '#7aa32f', '#3faea6', '#2f7150', '#4f93d4', '#8f76cf', '#d56a97', '#a8660f', '#b15f2c', '#8a8f87'];

const PARCOURS = {
  google: ['Connexion', 'Agenda Pronote', 'Classes', 'Google Agenda', 'Vie perso', 'Progression'],
  local: ['Emploi du temps', 'Classes', 'Progression'],
};
const ETAPES = {
  google: ['connexion', 'pronote', 'classes', 'agenda', 'perso', 'progression'],
  local: ['source', 'classes', 'progression'],
};

function fil() {
  if (!voie) return '';
  const k = ETAPES[voie].indexOf(etape);
  return html`<p class="etapes-demarrage">${PARCOURS[voie].map((n, i) => html`<span${i === k ? ' aria-current="step"' : ''}>${i + 1}. ${n}</span>${i < PARCOURS[voie].length - 1 ? ' ›' : ''}`)}</p>`;
}

function ecranAccueil() {
  const google = G.googleConfigure();
  return html`<div class="titre-page"><div><h1>Carnet de bord</h1>
      <p>Votre emploi du temps Pronote, votre agenda perso et la progression de chaque classe, au même endroit — sur le téléphone comme sur l'ordinateur.</p></div></div>
    <div class="choix">
      <button data-action="demarrer-google" ${google ? '' : 'disabled'}>${icone('google')}<strong>Avec mon compte Google</strong>
        <span>${google ? "Le Carnet lit l'agenda Pronote que vous avez ajouté à Google Agenda, et y écrit chaque cours avec ce qui est prévu. Vos données vous suivent d'un appareil à l'autre." : 'Pas encore activé sur cette adresse.'}</span></button>
      <button data-action="demarrer-demo">${icone('organiser')}<strong>Essayer avec un exemple</strong>
        <span>Six classes fictives, des demi-groupes, une semaine de cours. Tout se touche, rien n'est envoyé nulle part.</span></button>
      <button data-action="demarrer-local">${icone('lien')}<strong>Sans compte Google</strong>
        <span>À partir du lien iCal de Pronote ou d'un fichier .ics. Les données restent sur cet appareil.</span></button>
    </div>
    ${google ? '' : html`<p class="aide">La connexion Google s'active une seule fois, par la personne qui publie le Carnet : <a href="brancher-google.html">comment l'activer</a>.</p>`}
    <p class="aide">Le Carnet ne demande jamais votre mot de passe Pronote et ne lit ni notes ni élèves : seulement l'emploi du temps que Pronote exporte. <a href="confidentialite.html">Confidentialité : ce que le Carnet fait de vos données</a>.</p>
    <p class="outils">${installation() ? html`<button class="btn" data-action="installer">${icone('telecharger')} Installer l'appli sur cet appareil</button>` : ''}
      <button class="btn" data-action="partager">${icone('partager')} L'ouvrir sur un téléphone, ou la partager</button></p>`;
}

function ecranConnexion() {
  return html`${fil()}<section class="carte section-feuille"><h2>Se connecter à Google</h2>
    <p>Le Carnet demandera à Google l'autorisation de :</p>
    <ul>
      <li><b>lire</b> vos agendas (dont celui de Pronote), et <b>modifier vos rendez-vous perso</b> quand vous les ajoutez, déplacez ou supprimez vous-même dans le Carnet — jamais tout seul, jamais l'agenda de Pronote ;</li>
      <li><b>créer ses propres agendas</b> « Carnet », leur donner une couleur et y écrire vos cours ;</li>
      <li>garder ses données dans un <b>dossier caché de votre Google Drive</b>, propre à l'appli.</li>
    </ul>
    <p class="aide">Tant que l'appli n'est pas vérifiée par Google, Google affiche l'adresse du site (${location.hostname}) au lieu de « Carnet de bord », puis prévient qu'il ne l'a pas validée : touchez « Paramètres avancés », puis « Accéder à ${location.hostname} (non sécurisé) ». Cochez ensuite toutes les autorisations.</p>
    ${CONFIG.phaseEssai !== false ? html`<p class="aide">Pendant la phase d'essai, la connexion est réservée aux adresses inscrites. Si Google affiche « Accès bloqué », envoyez votre adresse Gmail à ${CONFIG.responsable || 'la personne qui vous a donné le lien'}.</p>` : ''}
    <div>${attente === 'lecture'
      ? html`<button class="btn google" disabled>${icone('google')} Lecture de vos agendas…</button>`
      : html`<button class="btn google" data-action="google-connecter">${icone('google')} ${attente ? 'Recommencer la connexion' : 'Se connecter avec Google'}</button>`}</div>
    ${attente === 'fenetre' ? html`<p class="aide">La page de Google est ouverte : terminez-y la connexion. Fermée par erreur ? Recommencez.</p>` : ''}
    <p class="aide">${G.methodeConnexion() === 'redirection' ? 'Le Carnet va passer par la page de Google, puis revenir ici.' : "Une fenêtre Google va s'ouvrir par-dessus le Carnet."}
      Ça coince ? <button class="lien" data-action="connexion-autre-methode">Essayer l'autre façon</button></p>
  </section>`;
}

function noticeLienPronote() {
  return html`<ol class="notice">
    <li><span>Dans Pronote (espace professeur, sur ordinateur), ouvrez votre <b>emploi du temps</b>.</span></li>
    <li><span>Cliquez sur l'icône <b>iCal</b> (en haut à droite de la réglette des semaines), puis copiez le lien proposé. Sur l'application mobile, l'icône iCal est en bas à droite.</span></li>
    <li><span>Collez-le ci-dessous — ou scannez-le s'il s'affiche en QR code sur un autre écran.</span></li>
  </ol>
  <form class="ajout-tache" data-envoi="lien-pronote"><input type="url" name="lien" id="lien-pronote" placeholder="https://…index-education.net/pronote/ical/…" aria-label="Lien iCal de Pronote" autocomplete="off"><button class="btn plein" type="submit">OK</button></form>
  <div class="outils"><button class="btn" data-action="scanner-qr">${icone('qr')} Scanner un QR code</button></div>
  <p class="aide">Le QR code de connexion de l'application Pronote, lui, ouvre votre compte entier (notes, élèves) : le Carnet n'en a pas besoin et le refusera.</p>`;
}

function ecranPronote() {
  const agendas = Object.entries(etat.brut.agendas || {}).map(([id, a]) => ({ id, ...a }));
  const probables = agendasPronote(agendas);
  const choisi = (reglages().source || {}).agendaPronote || (probables[0] && probables[0].id) || '';
  return html`${fil()}<section class="carte section-feuille"><h2>Votre agenda Pronote</h2>
    ${probables.length ? html`<p>Le Carnet a trouvé ${probables.length > 1 ? 'ces agendas qui ressemblent' : 'cet agenda qui ressemble'} à un export Pronote :</p>
      <div class="liste">${probables.map((a) => html`<label class="coche"><input type="radio" name="agenda-pronote" value="${a.id}" data-change="choisir-pronote"${a.id === choisi ? ' checked' : ''}><span><b>${a.nom}</b><br><span class="aide">${a.description || a.id}</span></span></label>`)}</div>`
    : html`<div class="bandeau"><span><strong>Aucun agenda Pronote dans votre Google Agenda.</strong> Ajoutons-le : Google ira le relire tout seul plusieurs fois par jour.</span></div>${noticeLienPronote()}`}
    <details><summary class="aide">Choisir un autre agenda</summary>
      <select data-change="choisir-pronote" aria-label="Agenda Pronote" style="margin-top:8px"><option value="">—</option>${agendas.map((a) => html`<option value="${a.id}"${a.id === choisi ? ' selected' : ''}>${a.nom}</option>`)}</select></details>
    ${probables.length ? html`<details><summary class="aide">Mon agenda Pronote n'est pas dans la liste</summary>${noticeLienPronote()}</details>` : ''}
    <div class="outils"><button class="btn" data-action="google-relire" ${attente ? 'disabled' : ''}>${icone('synchro')} Chercher à nouveau</button>
      <button class="btn plein" data-action="pronote-ok" ${choisi ? '' : 'disabled'}>Continuer</button></div>
  </section>`;
}

function ecranSource() {
  return html`${fil()}<section class="carte section-feuille"><h2>Votre emploi du temps</h2>
    ${noticeLienPronote()}
    <p class="aide">Pronote n'autorise pas un site à lire ce lien directement : sans relais, seul l'import d'un fichier marche. Le fichier est une photo à l'instant T — il faudra le réimporter quand l'emploi du temps change. Avec un compte Google, la mise à jour est automatique.</p>
    <label class="btn">${icone('fichier')} Importer un fichier .ics<input type="file" accept=".ics,text/calendar" data-change="fichier-ics" class="visuellement-cache"></label>
  </section>`;
}

function ecranClasses() {
  const d = classesDetectees();
  const existantes = calc().v.classes;
  if (!d.length) {
    return html`${fil()}<section class="carte section-feuille"><h2>Vos classes</h2><p class="vide">Aucun cours trouvé dans cet emploi du temps pour l'instant.</p>
      <p class="aide">Un agenda tout juste ajouté à Google peut mettre quelques minutes à se remplir.</p>
      <div class="outils"><button class="btn" data-action="google-relire">${icone('synchro')} Relire</button><button class="btn plein" data-action="classes-ok">Continuer quand même</button></div></section>`;
  }
  return html`${fil()}<section class="carte section-feuille"><h2>Vos classes</h2>
    <p>Trouvées dans Pronote. Le nom affiché peut être changé ; l'effectif sert à compter les photocopies.</p>
    <form data-envoi="classes-ok" id="form-classes"><div class="defile-x"><table class="tableau-classes"><thead><tr><th>Suivre</th><th>Pronote</th><th>Nom affiché</th><th>Niveau</th><th>Effectif</th><th></th></tr></thead><tbody>
      ${d.map((x) => {
        const ex = existantes[x.code];
        return html`<tr><td><input type="checkbox" name="suivre" value="${x.code}" ${!ex || !ex.masquee ? 'checked' : ''} aria-label="Suivre ${x.code}"></td>
          <td>${x.code}</td>
          <td><input type="text" name="nom-${x.code}" value="${ex ? ex.nom : x.nom}" aria-label="Nom de ${x.code}"></td>
          <td><select name="niveau-${x.code}" aria-label="Niveau de ${x.code}">${['6e', '5e', '4e', '3e', '2nde', '1re', 'Tle', 'Autre'].map((n) => html`<option${n === (ex ? ex.niveau : x.niveau) ? ' selected' : ''}>${n}</option>`)}</select></td>
          <td><input type="number" name="effectif-${x.code}" min="0" max="60" value="${ex && ex.effectif ? ex.effectif : ''}" style="width:5.5em" aria-label="Effectif de ${x.code}"></td>
          <td class="aide">${x.parSemaine} h/sem.${x.demi ? ' · ½ groupes' : ''}${x.inclusions.length ? ' · ULIS' : ''}</td></tr>`;
      })}</tbody></table></div>
    <div class="outils" style="margin-top:12px"><button class="btn plein" type="submit">Continuer</button></div></form>
    <p class="aide">Décochez ce qui n'est pas à suivre (heure de vie de classe, accompagnement personnalisé…).</p></section>`;
}

function ecranAgenda() {
  const e = reglages().ecriture || { actif: true, parNiveau: true };
  const mode = e.actif === false ? 'aucun' : e.parNiveau === false ? 'unique' : 'niveau';
  const niveaux = [...new Set(Object.values(calc().v.classes).filter((c) => !c.masquee).map((c) => c.niveau))].sort();
  const couleurs = { ...COULEURS_NIVEAUX, ...(e.couleurs || {}) };
  return html`${fil()}<section class="carte section-feuille"><h2>Ce que le Carnet écrit dans Google Agenda</h2>
    <p>Chaque cours, avec ce qui est prévu (« 503 · Activité 5 · reprendre à Protocole »). Touchez-le dans Google Agenda : un lien ouvre le Carnet sur ce cours.</p>
    <div class="liste">
      <label class="coche"><input type="radio" name="mode-ecriture" value="niveau" data-change="mode-ecriture"${mode === 'niveau' ? ' checked' : ''}><span><b>Un agenda par niveau</b>, chacun sa couleur<br><span class="aide">« Carnet · 6e », « Carnet · 5e »… et « Carnet · Établissement » pour les réunions.</span></span></label>
      <label class="coche"><input type="radio" name="mode-ecriture" value="unique" data-change="mode-ecriture"${mode === 'unique' ? ' checked' : ''}><span><b>Un seul agenda</b> « Carnet de bord »</span></label>
      <label class="coche"><input type="radio" name="mode-ecriture" value="aucun" data-change="mode-ecriture"${mode === 'aucun' ? ' checked' : ''}><span><b>Ne rien écrire</b> — le Carnet seulement</span></label>
    </div>
    ${mode === 'niveau' ? html`<h3>Couleurs</h3><div class="liste">${niveaux.map((n) => html`<div class="outils"><span style="min-width:3.5em"><b>${n}</b></span>
      <span class="nuancier">${NUANCIER.map((c) => html`<button type="button" style="--c:${c}" aria-label="${c}" aria-pressed="${couleurs[n] === c}" data-action="couleur-niveau" data-niveau="${n}" data-couleur="${c}"></button>`)}</span>
      <input type="color" value="${couleurs[n]}" data-change="couleur-niveau-libre" data-niveau="${n}" aria-label="Autre couleur pour ${n}"></div>`)}</div>` : ''}
    ${mode !== 'aucun' ? html`<div class="grille-champs">
      <label class="champ"><span>Évaluations en</span><select data-change="couleur-eval">${Object.entries(COULEURS_EVENEMENT).map(([k, v]) => html`<option value="${k}"${String(e.couleurEval ?? '10') === k ? ' selected' : ''}>${v}</option>`)}</select></label>
      <label class="champ"><span>Rappel sur le téléphone</span><select data-change="rappel">${[[0, 'Aucun'], [5, '5 min avant'], [10, '10 min avant'], [15, '15 min avant']].map(([k, v]) => html`<option value="${k}"${Number(e.rappel || 0) === k ? ' selected' : ''}>${v}</option>`)}</select></label>
      <label class="champ"><span>Combien de semaines à l'avance</span><select data-change="semaines">${[2, 4, 6, 8].map((k) => html`<option value="${k}"${Number(e.semaines || 6) === k ? ' selected' : ''}>${k} semaines</option>`)}</select></label>
    </div>
    <div class="bandeau info"><span><strong>Pensez à masquer l'agenda Pronote</strong> dans Google Agenda (décochez-le) : le Carnet le remplace, en couleurs, et continue de le lire. Sinon chaque cours apparaît deux fois.</span></div>` : ''}
    <div class="outils"><button class="btn plein" data-action="agenda-ok">Continuer</button></div></section>`;
}

function ecranPerso() {
  const r = reglages(), src = r.source || {};
  const ecrits = new Set(Object.values((r.ecriture || {}).calendriers || {}));
  const agendas = Object.entries(etat.brut.agendas || {}).map(([id, a]) => ({ id, ...a }))
    .filter((a) => a.id !== src.agendaPronote && !ecrits.has(a.id) && a.description !== DESCRIPTION_AGENDA && !/numéros de semaine|#weeknum|#holiday/i.test(`${a.id} ${a.nom}`));
  const choisis = new Set(src.agendasPerso || agendas.filter((a) => a.principal).map((a) => a.id));
  return html`${fil()}<section class="carte section-feuille"><h2>Votre vie perso dans le Carnet</h2>
    <p>Les rendez-vous de ces agendas apparaissent dans la semaine du Carnet, à côté des cours, pour voir d'un coup d'œil comment tout s'imbrique. Vous pourrez aussi les ajouter, les modifier ou les supprimer depuis le Carnet : le changement est fait aussitôt dans Google Agenda. Le Carnet n'y touche jamais de lui-même.</p>
    <div class="liste">${agendas.length ? agendas.map((a) => html`<label class="coche"><input type="checkbox" name="perso" value="${a.id}"${choisis.has(a.id) ? ' checked' : ''}><span><span class="classe-pastille" style="--niv:${a.couleur || 'var(--perso)'}">${a.nom}</span></span></label>`) : html`<p class="vide">Aucun autre agenda.</p>`}</div>
    <div class="outils"><button class="btn plein" data-action="perso-ok">Continuer</button></div></section>`;
}

function ecranProgression() {
  const debut = reglages().debut || lundiDe(aujourdhui(FUSEAU_APPAREIL));
  return html`${fil()}<section class="carte section-feuille"><h2>Votre progression</h2>
    <label class="champ"><span>Suivre la progression à partir du</span><input type="date" value="${debut}" data-change="date-debut" style="max-width:14em"></label>
    <p>Pour chaque classe, une file d'étapes (activité, bilan, évaluation…). Vous pouvez :</p>
    <div class="choix">
      <button data-action="progression-tableur"><strong>Ma programmation (Excel…)</strong><span>Le tableur de l'année, tel quel : Excel, LibreOffice, Google Sheets, CSV, ou des cellules collées. Une feuille par niveau, c'est parfait.</span></button>
      <button data-action="progression-vide"><strong>Partir de zéro</strong><span>Les classes sont prêtes ; vous ajoutez les étapes depuis Progressions.</span></button>
      <label class="btn" style="flex-direction:column;align-items:flex-start;white-space:normal;padding:16px;border-radius:16px"><strong>Une sauvegarde du Carnet</strong><span class="aide">Le fichier de sauvegarde (.json), l'export du « Carnet de bord SVT » de claude.ai, ou celui d'un collègue.</span><input type="file" accept=".json,application/json" data-change="fichier-progression" class="visuellement-cache"></label>
    </div></section>`;
}

export function rendreDemarrer() {
  const ecrans = { accueil: ecranAccueil, connexion: ecranConnexion, pronote: ecranPronote, source: ecranSource, classes: ecranClasses, agenda: ecranAgenda, perso: ecranPerso, progression: ecranProgression };
  return html`<div class="demarrer">${(ecrans[etape] || ecranAccueil)()}
    ${etape !== 'accueil' ? html`<p><button class="lien" data-action="demarrer-retour">← Revenir au début</button></p>` : ''}</div>`;
}

// ---------- Actions ----------
const aller = (e) => { etape = e; reglerLocal({}); window.scrollTo(0, 0); };
const suivante = () => { const l = ETAPES[voie]; aller(l[l.indexOf(etape) + 1] || 'fin'); };

actions['demarrer-retour'] = () => { voie = null; aller('accueil'); };
actions['demarrer-demo'] = () => {
  const tz = FUSEAU_APPAREIL;
  remplacerDocs(donneesDemo(tz));
  definirBrut({ ...evenementsDemo(tz), lu: Date.now() });
  fusionnerDocs(validationsDemo(calc()));
  reglerLocal({ mode: 'demo' });
  definirSynchro('demo', 'Mode démo');
  location.hash = '#/accueil';
  toast('Démo chargée : touchez « Où en est-on ? » sur un cours, ou « Personnaliser ».');
};
actions['demarrer-local'] = () => { voie = 'local'; aller('source'); };
actions['demarrer-google'] = () => { voie = 'google'; aller('connexion'); };

actions['google-connecter'] = async () => {
  // Le bouton reste actif tant que Google est ouvert : si la fenêtre a été fermée sans finir,
  // Google ne le signale pas toujours, et l'on doit pouvoir recommencer.
  attente = 'fenetre'; reglerLocal({});
  try {
    const { manquantes } = await G.connecter({ consentement: true, suite: 'demarrer' });
    attente = 'lecture'; reglerLocal({});
    await apresConnexion(manquantes);
  } catch (e) {
    attente = false; reglerLocal({});
    if (/^popup|^fenetre$/.test(e.code || '')) {
      toast(messageErreur(e), { action: { libelle: "Essayer l'autre façon", faire: () => { G.changerMethodeConnexion(); actions['google-connecter'](); } } });
    } else toast(messageErreur(e));
  }
};
actions['connexion-autre-methode'] = () => {
  const m = G.changerMethodeConnexion();
  reglerLocal({});
  toast(m === 'redirection' ? 'Le Carnet passera par la page de Google, puis reviendra.' : "Une fenêtre Google s'ouvrira par-dessus le Carnet.");
};

/** Au retour d'une connexion par redirection : la mise en route reprend où elle en était. */
export async function reprendreConnexion(manquantes) {
  voie = 'google'; etape = 'connexion'; attente = 'lecture'; reglerLocal({});
  try { await apresConnexion(manquantes); } catch (e) { attente = false; reglerLocal({}); toast(messageErreur(e)); }
}

/** Ce qui suit la connexion : le compte, les données déjà dans Drive, les agendas. */
async function apresConnexion(manquantes) {
  const moi = await G.compte();
  if (etat.local.mode === 'demo') { remplacerDocs({}); definirBrut({ pronote: [], perso: [], agendas: {}, lu: null }); }
  reglerLocal({ compte: moi });
  if (manquantes.length) toast("Certaines autorisations n'ont pas été cochées : le Carnet fera ce qu'il peut sans elles.");
  // Un autre appareil a déjà tout réglé ? On reprend ses données au lieu de recommencer.
  const retrouve = await recupererDrive();
  await lireAgendas();
  attente = false;
  if (retrouve && Object.keys(calc().v.classes).length && (reglages().source || {}).agendaPronote) {
    reglerLocal({ mode: 'google' });
    voie = null; etape = 'accueil';
    location.hash = '#/accueil';
    synchroniser();
    toast('Vos classes et votre progression sont revenues de votre Google Drive.');
    return;
  }
  aller('pronote');
}
actions['google-relire'] = async () => {
  if (!G.connecte()) { try { await G.connecter({ suite: 'demarrer' }); } catch (e) { toast(messageErreur(e)); return; } }
  attente = 'lecture'; reglerLocal({});
  try { await lireAgendas(); toast('Agendas relus.'); } catch (e) { toast(messageErreur(e)); }
  attente = false; reglerLocal({});
};
changements['choisir-pronote'] = (el) => {
  if (!el.value) return;
  modifierReglages((r) => { r.source = { ...(r.source || {}), agendaPronote: el.value }; });
};
actions['pronote-ok'] = async () => {
  const choisi = document.querySelector('input[name="agenda-pronote"]:checked');
  if (choisi) modifierReglages((r) => { r.source = { ...(r.source || {}), agendaPronote: choisi.value }; });
  try { await lireAgendas(); } catch (e) { toast(messageErreur(e)); return; }
  modifierReglages((r) => { r.fuseau = r.fuseau || FUSEAU_APPAREIL; });
  suivante();
};

function lienRecu(lien) {
  if (estQrConnexionPronote(lien)) {
    ouvrirFeuille(() => ({ titre: 'QR code refusé', corps: html`<p>C'est le QR code de <b>connexion</b> de l'application Pronote : il ouvre votre compte entier, notes et élèves compris.</p><p>Le Carnet n'en a pas besoin et ne l'a pas gardé. Il lui faut seulement le <b>lien iCal</b> de l'emploi du temps (icône iCal dans Pronote).</p>` }));
    return;
  }
  if (!estLienIcal(lien)) { toast("Ce n'est pas un lien iCal : il doit contenir « ical » ou finir par « .ics »."); return; }
  if (voie === 'google') {
    const cid = lien.trim().replace(/^https?:\/\//i, 'webcal://');
    ouvrirFeuille(() => ({
      titre: 'Ajouter Pronote à Google Agenda',
      corps: html`<p>Google Agenda va s'ouvrir et proposer d'ajouter cet agenda. Acceptez, puis revenez ici et touchez « Chercher à nouveau ».</p>
        <p><a class="btn plein" href="https://calendar.google.com/calendar/render?cid=${encodeURIComponent(cid)}" target="_blank" rel="noopener">${icone('lien')} Ouvrir Google Agenda</a></p>
        <p class="aide">Si rien ne se propose : dans Google Agenda sur ordinateur, « Autres agendas » → « + » → « À partir de l'URL », et collez le lien. Google met parfois quelques minutes à remplir l'agenda.</p>`,
      pied: html`<button class="btn" data-action="fermer-feuille">Fermer</button><button class="btn plein" data-action="google-relire">${icone('synchro')} Chercher à nouveau</button>`,
    }));
    return;
  }
  lireLienIcal(lien).then((lu) => {
    reglerLocal({ ics: { url: lien } });
    toast(bilanLecture(lu));
    suivante();
  }).catch((e) => {
    ouvrirFeuille(() => ({ titre: 'Lien illisible ici', corps: html`<p>${e.message}</p><p class="aide">Dans Pronote, à côté du lien iCal, vous pouvez aussi télécharger le fichier : importez-le avec le bouton « Importer un fichier .ics ».</p>` }));
  });
}
envois['lien-pronote'] = (f) => lienRecu(f.lien.value);

changements['fichier-ics'] = async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  try {
    toast(bilanLecture(lireTexteIcal(await f.text())));
    reglerLocal({ ics: { url: '' } });
    suivante();
  } catch (e) { toast(e.message); }
};

// Lecture d'un QR code par la caméra (BarcodeDetector : Chrome sur Android, notamment).
let flux = null, minuteurQr = null;
function arreterCamera() { clearInterval(minuteurQr); if (flux) flux.getTracks().forEach((t) => t.stop()); flux = null; }
actions['scanner-qr'] = async () => {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices) { toast('Ce navigateur ne sait pas lire les QR codes : collez le lien.'); return; }
  let detecteur;
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    if (!formats.includes('qr_code')) throw new Error('qr');
    detecteur = new window.BarcodeDetector({ formats: ['qr_code'] });
    flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  } catch { arreterCamera(); toast("Caméra indisponible ou refusée : collez le lien."); return; }
  ouvrirFeuille(() => ({ titre: 'Scanner le QR code', corps: html`<video class="video-qr" id="video-qr" autoplay playsinline muted></video><p class="aide">Visez le QR code du lien iCal. Rien n'est enregistré.</p>` }), { surFermeture: arreterCamera });
  const video = document.getElementById('video-qr');
  video.srcObject = flux;
  minuteurQr = setInterval(async () => {
    try {
      const codes = await detecteur.detect(video);
      if (codes.length) { const texte = codes[0].rawValue; arreterCamera(); fermerFeuille(); lienRecu(texte); }
    } catch { /* image pas encore prête */ }
  }, 300);
};

envois['classes-ok'] = (f) => {
  const suivies = new Set([...f.querySelectorAll('input[name="suivre"]:checked')].map((x) => x.value));
  for (const x of classesDetectees()) {
    const nom = (f[`nom-${x.code}`] && f[`nom-${x.code}`].value.trim()) || x.code;
    const niveau = f[`niveau-${x.code}`] ? f[`niveau-${x.code}`].value : x.niveau;
    const effectif = Math.max(0, Number(f[`effectif-${x.code}`] && f[`effectif-${x.code}`].value) || 0);
    const ex = calc().v.classes[x.code];
    ecrireDoc(`classes/${x.code}`, { ...(ex || { code: x.code, file: [], annonces: {} }), nom, niveau, effectif, masquee: !suivies.has(x.code) });
  }
  suivante();
};
actions['classes-ok'] = () => suivante();

const ecriture = (patch) => modifierReglages((r) => { r.ecriture = { actif: true, parNiveau: true, semaines: 6, rappel: 0, ...(r.ecriture || {}), ...patch }; });
changements['mode-ecriture'] = (el) => ecriture({ actif: el.value !== 'aucun', parNiveau: el.value === 'niveau' });
actions['couleur-niveau'] = (el) => ecriture({ couleurs: { ...((reglages().ecriture || {}).couleurs || {}), [el.dataset.niveau]: el.dataset.couleur } });
changements['couleur-niveau-libre'] = (el) => { if (/^#[0-9a-f]{6}$/i.test(el.value)) ecriture({ couleurs: { ...((reglages().ecriture || {}).couleurs || {}), [el.dataset.niveau]: el.value } }); };
changements['couleur-eval'] = (el) => ecriture({ couleurEval: el.value });
changements['rappel'] = (el) => ecriture({ rappel: Number(el.value) });
changements['semaines'] = (el) => ecriture({ semaines: Number(el.value) });
actions['agenda-ok'] = () => { if (!reglages().ecriture) ecriture({}); suivante(); };
actions['perso-ok'] = () => {
  const ids = [...document.querySelectorAll('input[name="perso"]:checked')].map((x) => x.value);
  modifierReglages((r) => { r.source = { ...(r.source || {}), agendasPerso: ids }; });
  suivante();
};
changements['date-debut'] = (el) => { if (el.value) modifierReglages((r) => { r.debut = el.value; }); };

function terminer() {
  if (!reglages().debut) modifierReglages((r) => { r.debut = lundiDe(aujourdhui(FUSEAU_APPAREIL)); });
  reglerLocal({ mode: voie });
  etape = 'accueil'; voie = null;
  location.hash = '#/accueil';
  if (etat.local.mode === 'google') synchroniser();
  toast('C’est parti. Ajoutez des étapes à vos classes depuis l’onglet Classes.');
}
actions['progression-vide'] = () => terminer();
actions['progression-tableur'] = () => ouvrirImportProgression({ surFin: (importe) => { if (importe) terminer(); } });
changements['fichier-progression'] = async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  try {
    const { docs, origine } = importer(await f.text());
    importerDocs(docs);
    toast(origine === 'carnet-claude' ? 'Carnet SVT importé : files, validations et tâches.' : 'Progression importée.');
    terminer();
  } catch (e) { toast(e.message); }
};

export function allerDemarrage(e = 'accueil', v = null) { voie = v; etape = e; }
