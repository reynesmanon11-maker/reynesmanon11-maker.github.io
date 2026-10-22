// Faire connaître le Carnet et l'installer : un QR code à viser avec un téléphone (le sien, pour y
// retrouver le Carnet, ou celui d'un collègue en salle des profs), le lien, le partage du téléphone,
// et un message tout prêt qui dit en trois lignes comment commencer.
import { actions } from '../actions.js';
import { html, brut, icone, toast, ouvrirFeuille, copier } from '../ui.js';
import { qrSvg } from '../qr.js';
import { installation, installer, installee, surIphone, surAndroid, adresseAppli } from '../installation.js';
import { googleConfigure } from '../google.js';
import { reglerLocal } from '../etat.js';
import { CONFIG } from '../../config.js';

const sansProtocole = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** Le message à envoyer à un collègue (tutoiement : c'est vous qui l'envoyez). */
export function messageCollegue() {
  const lignes = [
    "Je te conseille le Carnet de bord : l'emploi du temps Pronote, l'agenda perso et l'endroit où chaque classe s'est arrêtée, au même endroit, sur le téléphone comme sur l'ordinateur. C'est gratuit, sans publicité, et il ne demande jamais le mot de passe Pronote.",
    '',
    `1. Ouvre ${adresseAppli()}`,
    "2. Installe-le : bouton « Installer » (sur iPhone : Partager, puis « Sur l'écran d'accueil »).",
    "3. Essaie-le avec l'exemple, puis branche ton emploi du temps.",
  ];
  if (googleConfigure() && CONFIG.phaseEssai !== false) {
    lignes.push('', CONFIG.responsable
      ? `Pour la connexion Google, pendant la phase d'essai, envoie ton adresse Gmail à ${CONFIG.responsable}, qui t'ajoutera à la liste.`
      : "Pour la connexion Google, pendant la phase d'essai, il faut être inscrit : demande-le à la personne qui t'envoie ce lien.");
  }
  return lignes.join('\n');
}

export function ouvrirPartage() {
  ouvrirFeuille(() => {
    const url = adresseAppli();
    return {
      titre: 'Partager le Carnet',
      corps: html`<div class="partage">
        <figure class="partage-qr">${brut(qrSvg(url, { titre: `QR code : ${sansProtocole(url)}` }))}
          <figcaption>Visez ce code avec l'appareil photo d'un téléphone : le Carnet s'ouvre. Pour le retrouver sur votre téléphone, ou le montrer à un collègue.</figcaption></figure>
        <div class="partage-lien">
          <p class="adresse" id="adresse-appli">${sansProtocole(url)}</p>
          <div class="outils">
            <button class="btn" data-action="copier-adresse">${icone('copier')} Copier le lien</button>
            ${typeof navigator.share === 'function' ? html`<button class="btn" data-action="partager-natif">${icone('partager')} Envoyer…</button>` : ''}
          </div>
          <details class="partage-message"><summary>Un message tout prêt pour un collègue</summary>
            <pre id="message-collegue">${messageCollegue()}</pre>
            <button class="btn" data-action="copier-message">${icone('copier')} Copier le message</button>
          </details>
        </div>
      </div>`,
    };
  }, { classe: 'feuille-partage' });
}

function ouvrirMarcheASuivre() {
  ouvrirFeuille(() => ({
    titre: 'Installer le Carnet',
    corps: surIphone()
      ? html`<ol class="pas">
          <li>Ouvrez le Carnet dans <b>Safari</b>.</li>
          <li>Touchez le bouton <b>Partager</b> ${icone('partager')}, en bas de l'écran (en haut sur iPad).</li>
          <li>Choisissez <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li>
        </ol>
        <p class="aide">Le Carnet s'ouvrira depuis son icône, en plein écran, même sans réseau.</p>`
      : html`<ul class="pas">
          <li><b>Chrome</b>, sur ordinateur : l'icône d'installation à droite de la barre d'adresse ; sur Android : menu ⋮ → <b>Installer l'application</b>.</li>
          <li><b>Edge</b> : menu … → <b>Applications</b> → <b>Installer ce site en tant qu'application</b>.</li>
          <li><b>Firefox</b> et <b>Safari sur Mac</b> installent mal les applications web : ouvrez plutôt le Carnet dans Chrome ou Edge.</li>
        </ul>
        <p class="aide">Installé, le Carnet s'ouvre depuis son icône, dans sa propre fenêtre, même sans réseau.</p>`,
  }));
}

actions['partager'] = () => ouvrirPartage();
actions['installer'] = async () => {
  if (installation() === 'invitation') {
    if (await installer()) toast(surAndroid() ? "Carnet installé : son icône est sur l'écran d'accueil." : 'Carnet installé : il a maintenant sa propre fenêtre.');
    return;
  }
  ouvrirMarcheASuivre();
};
actions['installer-plus-tard'] = () => { reglerLocal({ installPlusTard: Date.now() }); };
actions['copier-adresse'] = async () => {
  toast(await copier(adresseAppli(), document.getElementById('adresse-appli')) ? 'Lien copié.' : 'Lien sélectionné : copiez-le.');
};
actions['copier-message'] = async () => {
  const el = document.getElementById('message-collegue');
  toast(await copier(el.textContent, el) ? 'Message copié : collez-le dans un mail ou un SMS.' : 'Message sélectionné : copiez-le.');
};
actions['partager-natif'] = async () => {
  try { await navigator.share({ title: 'Carnet de bord', text: messageCollegue() }); } catch (e) {
    if (e && e.name !== 'AbortError') toast("Le partage n'a pas abouti : copiez plutôt le lien.");
  }
};

/** Le bandeau « Installer » du tableau de bord : seulement si c'est possible, et pas refusé il y a moins d'un mois. */
export function bandeauInstallation(plusTard) {
  const mode = installation();
  if (!mode || Date.now() - (plusTard || 0) < 30 * 864e5) return '';
  return html`<div class="bandeau installer"><span><strong>Installer le Carnet</strong> sur cet appareil : il s'ouvrira depuis son icône, comme une application, même sans réseau.</span>
    <span class="outils"><button class="btn mini plein" data-action="installer">${icone('telecharger')} ${mode === 'iphone' ? 'Comment faire' : 'Installer'}</button>
    <button class="btn mini" data-action="installer-plus-tard">Plus tard</button></span></div>`;
}
