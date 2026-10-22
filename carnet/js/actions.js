// Registre des actions de l'interface. Un élément porte data-action="nom" (clic),
// data-change="nom" (changement de valeur), data-saisie="nom" (frappe) ou data-envoi="nom"
// (formulaire) ; chaque vue enregistre ses gestionnaires ici. Un seul écouteur par type
// d'événement pour toute la page, même après un nouveau rendu.
export const actions = {};
export const changements = {};
export const saisies = {};
export const envois = {};

export function brancher(racine = document) {
  racine.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const f = actions[el.dataset.action];
    if (!f) return;
    if (el.tagName === 'A' && el.getAttribute('href') && !el.getAttribute('href').startsWith('#')) return;
    e.preventDefault();
    f(el, e);
  });
  racine.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && changements[el.dataset.change]) changements[el.dataset.change](el, e);
  });
  racine.addEventListener('input', (e) => {
    const el = e.target.closest('[data-saisie]');
    if (el && saisies[el.dataset.saisie]) saisies[el.dataset.saisie](el, e);
  });
  racine.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-envoi]');
    if (!f || !envois[f.dataset.envoi]) return;
    e.preventDefault();
    envois[f.dataset.envoi](f, e);
  });
}
