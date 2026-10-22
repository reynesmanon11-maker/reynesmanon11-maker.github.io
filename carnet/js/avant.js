// Appliqué avant le premier affichage, pour ne pas voir la page changer de thème en arrivant.
// Simple copie du réglage : la vraie préférence vit dans la mémoire de l'appli (IndexedDB).
(function () {
  try {
    var t = localStorage.getItem('carnet-apparence');
    if (!t) return;
    var a = JSON.parse(t), r = document.documentElement;
    if (a.theme === 'auto') r.removeAttribute('data-theme'); else if (a.theme) r.setAttribute('data-theme', a.theme);
    if (a.accent) r.setAttribute('data-accent', a.accent);
    if (a.densite) r.setAttribute('data-densite', a.densite);
  } catch (e) { /* stockage indisponible : thème clair par défaut */ }
})();
