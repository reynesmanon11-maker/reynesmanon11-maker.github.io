// Page « Activer la connexion Google » : les boutons Copier, et des adresses ajustées à l'endroit où
// le Carnet est publié (celles écrites dans la page valent pour le site de Mme Reynes).
import { CONFIG } from '../config.js';

const appli = new URL(CONFIG.urlPublique || './', location.href);
const valeurs = {
  'v-accueil': appli.href,
  'v-confidentialite': new URL('confidentialite.html', appli).href,
  'v-domaine': appli.hostname,
  'v-origine': appli.origin,
  'v-retour': appli.href,
};
for (const [id, v] of Object.entries(valeurs)) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copier]');
  if (!b) return;
  const el = document.getElementById(b.dataset.copier);
  if (!el) return;
  const avant = b.dataset.libelle || (b.dataset.libelle = b.textContent);
  try {
    await navigator.clipboard.writeText(el.textContent.trim());
    b.textContent = 'Copié ✓';
  } catch {
    // Presse-papiers refusé : on sélectionne le texte, il reste à faire Ctrl+C.
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    b.textContent = 'Sélectionné : Ctrl+C';
  }
  setTimeout(() => { b.textContent = avant; }, 1800);
});
