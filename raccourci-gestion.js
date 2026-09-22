/* ATTENTION — après toute modification de ce fichier, changer le jeton ?v= des
   balises <script> qui l'appellent, dans les pages HTML. Sans cela le
   navigateur des élèves garde l'ancienne version pendant des heures : GitHub
   Pages demande de la conserver dix minutes, et le disque la garde plus
   longtemps encore. Un simple rechargement ne suffit pas toujours. */
/* =============================================================================
   RACCOURCI VERS L'ESPACE DE GESTION

   L'espace de gestion est une page publique, mais elle ne sert à rien sans le
   jeton GitHub : c'est lui qui protège, pas un mot de passe — un mot de passe
   vérifié dans une page publique se lirait dans le code source.

   Ce raccourci n'apparaît donc QUE sur un navigateur où le jeton est déjà
   enregistré, c'est-à-dire celui de Mme Reynes. Pour un élève, rien ne change :
   il ne voit ni le lien, ni même qu'il existe.

   La première fois, sur un navigateur neuf, il faut taper l'adresse
   /gestion.html à la main : le raccourci apparaît ensuite tout seul.
   ============================================================================= */
(function () {
  'use strict';

  const CLE = 'svtJetonDepot';   // la même que gestion.html
  let connectee = false;
  try { connectee = !!localStorage.getItem(CLE); } catch (e) { /* stockage refusé */ }
  if (!connectee) return;

  const LIEN = '/gestion.html';
  const TEXTE = 'Gestion';

  /* Un point discret plutôt qu'une icône : la barre est déjà chargée, et ce
     lien ne s'adresse qu'à une seule personne. */
  const style = document.createElement('style');
  style.textContent = `
    #hdr nav.primary a.gestion-lien > span{ opacity:1 !important; color:#2f6b45; font-weight:600 }
    #hdr nav.primary a.gestion-lien > span::before{ content:''; width:.375rem; height:.375rem;
      border-radius:9999px; background:#2f6b45; display:inline-block; margin-right:.125rem }
    #navlist li.gestion-item a{ color:#2f6b45 }
  `;
  document.head.appendChild(style);

  function poser() {
    /* barre du haut */
    const barre = document.querySelector('#hdr nav.primary ul');
    if (barre && !barre.querySelector('.gestion-lien')) {
      const li = document.createElement('li');
      li.innerHTML = `<a class="gestion-lien" href="${LIEN}"><span>${TEXTE}</span></a>`;
      barre.appendChild(li);
    }
    /* menu plein écran : sa liste est construite en JavaScript par la page,
       on attend donc qu'elle existe avant d'y ajouter la ligne. */
    const liste = document.getElementById('navlist');
    if (liste && liste.children.length && !liste.querySelector('.gestion-item')) {
      const modele = liste.querySelector('li');
      const li = document.createElement('li');
      li.className = (modele ? modele.className + ' ' : '') + 'gestion-item';
      const a = liste.querySelector('li a');
      li.innerHTML = a
        ? a.outerHTML.replace(/href="[^"]*"/, `href="${LIEN}"`).replace(/>[^<]*</, `>${TEXTE}<`)
        : `<a href="${LIEN}">${TEXTE}</a>`;
      const lien = li.querySelector('a');
      if (lien) {
        lien.setAttribute('href', LIEN);
        /* On remplace le libellé en laissant la structure interne intacte :
           la page décore ses liens de menu avec des éléments supplémentaires. */
        const cible = [...lien.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim());
        if (cible) cible.textContent = TEXTE;
        else lien.textContent = TEXTE;
      }
      liste.appendChild(li);
    }
  }

  poser();
  /* Le menu plein écran peut être rempli après nous : on réessaie quelques fois
     plutôt que de parier sur l'ordre d'exécution des scripts de la page. */
  let essais = 0;
  const minuteur = setInterval(() => {
    poser();
    const fini = document.querySelector('#navlist .gestion-item');
    if (fini || ++essais > 20) clearInterval(minuteur);
  }, 250);
})();
