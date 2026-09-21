# Site SVT de Mme Reynes

Site statique publié par GitHub Pages depuis la branche `main`, à l'adresse
<https://reynesmanon11-maker.github.io>. Aucune étape de construction : les
fichiers HTML du dépôt sont servis tels quels.

## Publication

**Toute nouveauté doit être publiée sur `main`.** Le site est diffusé par lien
aux élèves et aux collègues : une modification qui reste sur une branche n'est
visible de personne. On travaille donc sur une branche, on vérifie dans un
navigateur, puis on fusionne dans `main` et on pousse. Compter une à deux
minutes avant que GitHub Pages ne reconstruise le site.

### Manon modifie en direct

Manon corrige elle-même ses textes depuis l'éditeur de GitHub, sur `main`, et
elle a raison de le faire : c'est son site. **Ses modifications passent avant
les nôtres.** En pratique :

- Toujours `git fetch origin main` puis `git rebase origin/main` avant de
  pousser. **Jamais** de `push --force` sur `main`, jamais de `revert` d'un de
  ses commits : on se replace derrière son travail, on ne le remplace pas.
- Après un rebase, relire le fichier concerné pour vérifier que sa
  modification est toujours là (elle peut être minuscule : un mot, un
  attribut).
- Une longue série de commits sur `main` pendant qu'elle a un éditeur ouvert
  lui fait refuser sa validation (« … a effectué des modifications depuis que
  vous avez commencé à les modifier »). Regrouper les publications plutôt que
  de pousser vingt fois, et le lui signaler quand on va travailler longuement
  sur un fichier qu'elle édite.
- Si elle dit qu'elle est en train de modifier : ne pas pousser, attendre.

### Mode retouche (les deux labos)

Les labos pèsent 250 à 390 Ko : l'éditeur web de GitHub les refuse
(« File could not be edited »). Chaque labo embarque donc un **mode retouche**,
ouvert par `?retouche` dans l'adresse ou par `Ctrl + Alt + E` — invisible pour
les élèves. La page relit son propre fichier, y remplace le texte corrigé, et
rend le fichier complet à redéposer (*Add file → Upload files*).

Garde-fous à conserver si on touche à ce bloc : refus des chevrons, refus d'un
texte vide, refus d'un texte présent plusieurs fois dans le fichier, et
recompilation de tous les blocs `<script>` avant d'accepter une correction.
Seuls les textes d'un seul tenant, sans balise à l'intérieur, sont proposés.

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | accueil |
| `2nde.html`, `1ere.html`, `terminale.html` | pages de niveau |
| `outils/labo_vegetal.html` | laboratoire virtuel de biologie végétale (d'après R. Pratt) |
| `outils/labo_geologie.html` | laboratoire virtuel de géologie (TP classiques du lycée) |
| `outils/` | autres outils interactifs autonomes |
| `TODO.md` | file d'idées, pilotée par les tâches automatiques |

## Conventions

- Chaque outil de `outils/` est **autonome** : un seul fichier HTML, sans
  bibliothèque externe ni dépendance réseau, pour rester utilisable hors ligne
  et ne jamais casser à cause d'un CDN.
- La navigation est répétée dans les quatre pages principales (menu de bureau
  `nav.primary` **et** menu mobile, le tableau `NAV` en JavaScript) : ajouter un
  lien suppose de modifier les deux, dans les quatre fichiers.
- Palette terracotta pour le site : `--accent:#b15f2c`, fond `#f5f2ed`, encre
  `#23201c`. Police Onest.
- **Chaque labo a sa propre teinte**, pour qu'on les distingue d'un coup d'œil :
  biologie en vert (`--accent:#2f7150`, fond `#f1f5f0`), géologie en ambre
  (`--accent:#a8660f`, fond `#f7f2e8`). Les couleurs par module restent variées
  mais toutes dans la famille de leur labo — froide et végétale d'un côté,
  minérale et chaude de l'autre. Le lien vers l'autre labo, dans la barre du
  haut, porte la couleur de sa destination ; les pastilles des pages de niveau
  aussi. Les couleurs de courbes (CO₂ en terracotta, O₂ en bleu) ne suivent pas
  l'accent : elles doivent rester lisibles et distinctes entre elles.
- **Ne pas reproduire la structure de l'ouvrage de R. Pratt** : pas de
  pagination, pas de numérotation de parties ni de paragraphes (« Partie I —
  4.1 »), pas de sommaire calqué. Le catalogue liste des manipulations par
  thème, avec leur intitulé scientifique usuel. Les champs `ref` et `n` des
  données restent en place — ils servent de clés internes pour accrocher les
  fiches de matériel — mais ne s'affichent nulle part. L'attribution, elle,
  reste visible et assumée : « inspiré du Pratt ».
- **La démarche de l'ECE structure les deux côtés.** Côté professeur, le
  bouton « Fiches de correction » produit une fiche par paillasse : objectif,
  les quatre étapes évaluées, puis la grille A-B-C-D sur vingt points
  (9 + 5 + 3 + 3). Côté élève, le carnet de manipulation reprend les mêmes
  temps — présenter les résultats, puis j'observe que / je sais que / j'en
  déduis que, puis la poursuite de la stratégie — et la fiche imprimée les
  restitue dans cet ordre. Garder cette trame et le total de points.
- **Le sigle « ECE » ne s'affiche que là où il explique la trame**, c'est-à-dire
  dans le document du professeur. Pas sur les boutons, pas dans le carnet de
  l'élève, pas dans les titres : c'est la démarche qui doit être partout, pas
  l'étiquette. Le document rappelle en tête que ce ne sont pas des sujets
  officiels et que les valeurs sont simulées.
- **Une photographie de roche l'emporte toujours sur le dessin.** Le module
  d'identification cherche `images/roches/<id>-1.jpg` (œil nu) et
  `<id>-micro-1.jpg` (microscope) ; dès qu'une série existe, le canvas est
  masqué et la photo occupe sa place. Le dessin ne revient que pour les roches
  sans photo, et en mode « roche mystère » tant que la loupe n'a pas servi.
  Quand les deux séries existent, une bascule « À l'œil nu / Au microscope »
  apparaît. Le nommage est documenté dans `images/roches/LISEZ-MOI.md`, et
  `gestion.html` dépose les photos selon la vue choisie : ne pas changer la
  convention sans mettre à jour ces deux endroits.
- **Les deux labos portent une pancarte « Work in progress =) »** dans la barre
  du haut : ils s'étoffent encore, et qui arrive dessus doit le savoir. La
  retirer quand Manon le dira, pas avant.
- Interface et commentaires de code en français.
- Les données que saisit un élève (carnet de manip, panier de matériel,
  placard) restent dans son navigateur via `localStorage` : rien n'est envoyé
  sur un serveur.

## Vérification avant publication

Playwright et Chromium sont disponibles (`/opt/pw-browsers`). Ouvrir la page
modifiée, vérifier l'absence d'erreur JavaScript en console, le rendu à 390 px
de large, et — pour toute page qui dessine dans un `<canvas>` — la stabilité de
la hauteur de page avec `deviceScaleFactor: 2`.
