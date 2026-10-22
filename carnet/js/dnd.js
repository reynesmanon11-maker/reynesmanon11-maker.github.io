// Déplacer les modules du tableau de bord à la souris, au doigt ou au stylet (Pointer Events :
// le glisser-déposer HTML natif ne marche pas au doigt). La poignée porte touch-action: none
// pour que le geste ne fasse pas défiler la page. Les boutons ↑ ↓ restent l'alternative clavier.

export function activerGlisser(racine, { selecteur = '.module', surFin }) {
  let g = null;

  function fin() {
    if (!g) return;
    g.el.style.transform = '';
    g.el.classList.remove('glisse');
    const ordre = [...racine.querySelectorAll(selecteur)].map((m) => m.dataset.module);
    const change = ordre.join('|') !== g.ordreInitial;
    g = null;
    window.removeEventListener('pointermove', bouge);
    window.removeEventListener('pointerup', fin);
    window.removeEventListener('pointercancel', fin);
    if (change) surFin(ordre);
  }

  function place(e) {
    g.el.style.transform = '';
    const r = g.el.getBoundingClientRect();
    g.el.style.transform = `translate(${e.clientX - g.dx - r.left}px, ${e.clientY - g.dy - r.top}px)`;
  }

  function bouge(e) {
    if (!g) return;
    e.preventDefault();
    const autres = [...g.el.parentNode.querySelectorAll(selecteur)].filter((m) => m !== g.el);
    const cible = autres.find((m) => {
      const r = m.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (cible) {
      const r = cible.getBoundingClientRect();
      const memeLigne = Math.abs((r.top + r.bottom) / 2 - e.clientY) < r.height / 2 && r.width < g.el.parentNode.clientWidth * 0.9;
      const avant = memeLigne ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2;
      // Hystérésis : on ne rebouge que si la cible ou le côté change.
      if (cible !== g.derniere || avant !== g.avant) {
        cible.parentNode.insertBefore(g.el, avant ? cible : cible.nextSibling);
        g.derniere = cible; g.avant = avant;
      }
    }
    place(e);
    const marge = 70;
    if (e.clientY < marge) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - marge) window.scrollBy(0, 12);
  }

  racine.addEventListener('pointerdown', (e) => {
    const poignee = e.target.closest('[data-poignee]');
    // Le mode « Personnaliser » est porté par la grille des modules, pas par la page.
    if (!poignee || !poignee.closest('.organiser') || e.button > 0) return;
    const el = poignee.closest(selecteur);
    if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    g = {
      el, dx: e.clientX - r.left, dy: e.clientY - r.top, derniere: null, avant: null,
      ordreInitial: [...racine.querySelectorAll(selecteur)].map((m) => m.dataset.module).join('|'),
    };
    el.classList.add('glisse');
    window.addEventListener('pointermove', bouge, { passive: false });
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
  });
}
