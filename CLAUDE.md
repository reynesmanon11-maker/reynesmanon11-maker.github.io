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
| `carnet/` | **Carnet de bord** : l'appli d'organisation de l'enseignante (voir plus bas) |
| `TODO.md` | file d'idées, pilotée par les tâches automatiques |
| `google39246ecb7544994e.html` | preuve de propriété du site pour Google (Search Console, vérification du Carnet) : **ne jamais le supprimer ni le modifier** |

## Ce site est réservé aux élèves

Rien de commercial ici : ni vente, ni prix, ni lien vers la future boutique.
Les outils payants auront leur propre site, séparé, avec sa propre charte.

## Le Carnet de bord (`carnet/`)

Une appli à part entière — emploi du temps Pronote, vie perso, point d'arrêt de chaque classe —
rangée dans le site pour avoir une adresse stable : <https://reynesmanon11-maker.github.io/carnet/>.
C'est l'exception assumée à « réservé aux élèves » : un outil d'enseignante, gratuit, **sans
aucun lien depuis les pages des élèves**. Seul `raccourci-gestion.js` l'affiche (« Carnet », à côté
de « Gestion », sur le navigateur où le jeton est enregistré), et `gestion.html` dans sa barre.

- **Exception à « un outil = un seul fichier »** : plusieurs modules (`carnet/js/`), toujours
  sans bibliothèque ni CDN, un service worker limité à `/carnet/`, sa propre charte (vert
  `#2f7150`, fond `#f3f6f1`). Sa documentation est dans `carnet/README.md` et `carnet/docs/`.
- **Tests avant toute publication qui touche `carnet/`**, depuis ce dossier : `npm test` (Node),
  puis `NODE_PATH=/opt/node22/lib/node_modules CHROMIUM=/opt/pw-browsers/chromium npm run
  test:navigateur` (parcours dans Chromium, dont un faux Google).
- À chaque publication qui change un fichier de `carnet/`, changer `VERSION` dans `carnet/sw.js` :
  sinon les appareils où le Carnet est installé gardent l'ancienne version.
- **`carnet/carnet-complet.html`** est le Carnet en un seul fichier (à envoyer à une collègue, ou à donner
  à Claude Code) : il se régénère avec `node assembler.mjs` depuis `carnet/`, après **toute** modification
  du Carnet. Un test échoue tant qu'il est en retard. Ne jamais le modifier à la main.
- `carnet/config.js` porte l'identifiant Google (pas secret), l'adresse publique et le nom de la
  responsable. Jamais de secret dans ce dépôt public ; les données des utilisateurs n'y passent
  jamais (elles restent sur leur appareil et dans leur propre Google Drive).
- `carnet/brancher-google.html` doit lister exactement les autorisations de `carnet/js/google.js`
  (un test le vérifie).
- Le site passe par Jekyll, qui lit **tous** les `.md` du dépôt (ce fichier compris) comme des
  modèles : une double accolade ouvrante, ou une accolade suivie d'un pourcentage, y fait échouer
  la publication du site entier. Ne jamais en écrire, même entre accents graves.
- **Rangé comme l'espace professeur de Pronote**, pour que les collègues retrouvent leurs repères :
  rubriques Page d'accueil, Emploi du temps, Cahier de textes, Progressions, Mes travaux, Mes données
  (barre sombre `nav.nav-haut`, et `nav.nav-bas` sur téléphone : les deux se modifient ensemble,
  avec `TITRES` dans `carnet/js/app.js`), tuiles d'accueil avec « Tout voir » et une croix, noms de
  tuiles de Pronote quand elles y existent. On reprend la structure et le vocabulaire, **jamais la
  marque ni le logo** de Pronote.
- **Programmation importée d'un tableur** : `carnet/js/tableur.js` lit (.xlsx, .ods, .csv, collage)
  et écrit (.xlsx) sans bibliothèque ; `carnet/js/programmation.js` devine colonnes, durées,
  semaines, chapitres et évaluations. Une heure de cours = une séance (« 1h30 » = 1,5). Les
  fichiers de `carnet/tests/tableurs/` sont de vrais fichiers d'Excel et de LibreOffice : ne pas
  les réécrire à la main.
- **Une progression par niveau, mais chaque classe garde sa version** : une étape prévue pour une classe est
  proposée aux autres classes du même niveau (case « Prévoir aussi pour »), cochée d'office seulement pour
  celles qui en sont au même endroit (elles ont l'étape voisine), et placée au même endroit de leur file.
  Modifier une étape partagée ne vaut que pour la classe ouverte, sauf cases « Modifier aussi pour » cochées :
  les autres gardent leur copie intacte (`separer` dans `carnet/js/vues/classes.js`). Ce qu'une classe du
  niveau fait après une étape commune est **proposé** aux autres (`suggestionsPour`, bandeau « Reprendre » /
  « Non merci ») dans Progressions et dans la feuille du cours : jamais ajouté sans un geste de Manon.
  Le format (classe entière / demi-groupe) n'est plus demandé : l'emploi du temps le dit déjà. Couleurs
  par niveau (5e violet, 6e vert, 3e jaune) : `--n-*` dans `carnet/css/app.css` et `COULEURS_NIVEAUX`
  dans `carnet/js/agenda.js`, à garder identiques.
- **Rien de ce que Manon écrit ne se perd** : fermer la feuille d'une étape l'enregistre (pas de bouton
  « Annuler »), un redessin de feuille garde les champs touchés (`touches` dans `carnet/js/ui.js`), deux
  fenêtres du Carnet fusionnent leurs écritures (`fusionnerEcrire`, `BroadcastChannel`), et « Retirer »
  n'enlève une étape que de la classe ouverte, avec « Annuler ». Jamais de suppression en cascade.
  Les jalons se saisissent comme « Déroulé de la séance » (une ligne par moment), sans modèle à choisir :
  ne jamais retirer un champ où elle a pu écrire sans montrer ailleurs ce qu'il contient.
- **Agendas Google : renommer avant de créer.** Google limite les créations d'agendas, pas les
  renommages : un agenda du Carnet inutile (doublon vide, niveau disparu) est renommé pour devenir
  celui qui manque ; les restes se suppriment d'un bouton dans Mes données.
- L'ancien « Carnet de bord SVT » (page claude.ai) est **à la retraite** : il n'écrit plus rien dans
  Google Agenda, sa tâche du matin « Mise à jour du carnet SVT » est en pause (ne pas la relancer :
  elle recréerait ses copies), et son bandeau emporte ses données vers le Carnet (`#importer=`) et
  retire, sur confirmation, ses copies marquées « carnetsvt » de l'agenda principal.

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
  convention sans mettre à jour ces deux endroits. Dès qu'une série compte deux
  photos, un bouton « Comparer les deux » superpose les deux premières sous un
  curseur glissant. **Au microscope, dès qu'il y a deux photographies, le
  comparateur s'affiche d'emblée** — pas de bouton à trouver : la comparaison
  est l'exercice. Elles sont étiquetées **LPNA** à gauche et **LPA** à droite,
  et chaque étiquette agrandit sa vue au clic. C'est une convention d'ordre de
  dépôt, rappelée dans `gestion.html` et dans le LISEZ-MOI, pas une
  reconnaissance automatique. À l'œil nu, pas de comparateur ni d'étiquette.
- **Le module de cristallisation ne dessine plus de lame.** Chaque case du
  tableau à double entrée (texture × chimie) renvoie, par `LAMES_CRISTAL`, à une
  lame mince photographiée, avec son comparateur LPNA/LPA et son crédit. Deux
  cases restent vides — microdiorite et verre andésitique n'ont pas de lame à la
  lithothèque — et la page le dit : ne pas y mettre une roche voisine « pour
  remplir ». Cocher les phénocristaux change la lame pour sa variante
  porphyrique quand elle existe. Les identifiants `microgranite`, `dolerite`,
  `tachylite`, `andesite-porphyrique` et `basalte-porphyrique` n'existent que
  pour ce module : ils ne figurent pas dans `ROCHES`, mais suivent la même
  convention de nommage et doivent figurer dans `CREDITS`.
- **Le module de viscosité montre la roche que laisse le magma** : la lave
  figée (basalte, andésite ou rhyolite selon la silice), ou la ponce dès que le
  style devient très explosif — échantillon de main puis lame mince, par
  `ROCHE_DU_MAGMA` et `PONCE_DU_MAGMA`. Même machinerie et mêmes crédits que
  partout ailleurs.
- **Dans la cristallisation, le graphe ne dépend que de la vitesse de
  refroidissement** : déplacer la silice ne bouge pas le point, et la page
  l'explique sous le graphe plutôt que de laisser croire à une panne. La
  vitesse fait la texture, la chimie fait le nom — c'est le tableau à double
  entrée.
- **Les paysages et les éruptions viennent de Wikimedia Commons**, pas de la
  lithothèque : ils vivent dans `images/terrain/` et sont décrits par la table
  `TERRAIN`. Les licences y sont variées (domaine public, CC0, CC BY, CC BY-SA)
  donc on cite l'auteur **et** la licence, avec un lien vers la fiche et vers le
  texte de la licence. **Ne jamais déposer un fichier dans `images/terrain/`
  sans son entrée dans `TERRAIN`.**
- **Pas de vidéo embarquée dans un labo.** Un outil de `outils/` reste un seul
  fichier utilisable hors ligne : pas d'iframe YouTube (mouchards sur une page
  destinée à des mineurs, filtrage possible par le lycée), et pas de fichier
  vidéo hébergé — les éruptions filmées correctes pèsent 20 à 80 Mo. Chaque
  dynamisme éruptif porte à la place un lien vers une vidéo libre de Wikimedia
  Commons, qui se lit dans le navigateur.
- **Dans la viscosité, le schéma du volcan et la photographie partagent un
  curseur** (`.mo-comp`) : à gauche ce que calcule le programme, à droite ce
  qu'on verrait, sans avoir à défiler. Toute la géométrie du dessin est
  proportionnelle à la boîte (fonction `geo()`), et l'évent sert à la fois au
  cône, à la coulée et aux projections — si les deux divergent, le panache se
  décale du cratère, c'était le cas avant. Les photographies ne suivent pas les
  quatre styles nommés mais `ECHELONS`, **huit** crans d'explosivité : entre une
  coulée tranquille et une colonne plinienne la nature n'a pas quatre marches.
- **Le module d'érosion a le même curseur** (`.mo-comp.plat`, plus large que
  haut car une gouttière l'est) : le schéma à gauche, un paysage réel à droite,
  choisi par `REGIMES` selon la vitesse du courant — vase craquelée, rides de
  courant, rivière en tresses, lit à blocs — ou le delta du Pô en mode bassin.
  Dessous, `ROCHE_DU_DEPOT` montre la roche que ce dépôt deviendra (conglomérat,
  grès ou marne, selon la classe la plus abondante déposée) et un granoclassement
  fossilisé. La géométrie de la gouttière est elle aussi proportionnelle à la
  boîte, et centrée sur elle.
- **La machinerie des photographies est déclarée avant le premier module qui
  s'en sert** (son propre bloc `<script>`, au-dessus de la gouttière) : les
  tables `TERRAIN`, `LICENCES` et les fonctions `chargePhotos`,
  `activeComparateur`, `figureTerrain`, `legendeTerrain` sont lues à
  l'exécution du module, pas au chargement — la déplacer plus bas casse
  l'érosion.
- **Le module d'altération montre la roche avant le bécher** (échantillon de
  main puis lame mince, par `PHOTO_ALT`) et, quand il y en a un, le paysage que
  cette altération finit par faire (`PAYSAGE_ALT` : lapiaz pour les carbonates,
  latérite pour le basalte). Le schéma du bécher reste : il montre la perte de
  masse, ce qu'aucune photographie ne ferait.
- **L'histologie végétale a le même curseur** : le schéma cliquable à gauche,
  une coupe réelle à droite (`COUPES_REELLES`, un fichier par organe dans
  `images/histologie/`). Ces photographies viennent de la **Berkshire Community
  College Bioscience Image Library**, en CC0 ; on cite quand même l'origine.
  Deux honnêtetés à garder dans l'avertissement : **ce n'est pas la même
  espèce** que celle du schéma (tournesol, maïs, renoncule, tilleul, lilas) et
  **le colorant de la photographie ne suit pas le réglage** de gauche.
  Particularité du comparateur côté biologie : on ne fait glisser que par la
  poignée, jamais en cliquant dans l'image — sinon le clic qui identifie un
  tissu ne passe plus.
- **Chaque roche porte sa composition minéralogique** (champ `mineraux`), listée
  sous les résultats **en mode exploration seulement** : en roche mystère, elle
  donnerait la réponse avant le premier test. Le champ `min`, plus court, reste
  celui que lit le test « Minéraux identifiables » à la loupe.
- **Les deux labos portent une pancarte « Work in progress =) »** dans la barre
  du haut : ils s'étoffent encore, et qui arrive dessus doit le savoir. La
  retirer quand Manon le dira, pas avant.
- **Les photographies de roches viennent de la lithothèque de l'ENS de Lyon**,
  dont les conditions autorisent « l'utilisation de ressources […] par des
  enseignants dans leur cadre professionnel » en échange de la citation de
  l'origine et de l'auteur. D'où la table `CREDITS`, par roche et par série :
  le photographe change d'un cliché à l'autre, et l'adresse de la fiche
  d'origine est affichée sous la photo. **Ne jamais publier une photographie de
  roche sans son entrée dans `CREDITS`.**
- Interface et commentaires de code en français.
- Les données que saisit un élève (carnet de manip, panier de matériel,
  placard) restent dans son navigateur via `localStorage` : rien n'est envoyé
  sur un serveur.

## Vérification avant publication

Playwright et Chromium sont disponibles (`/opt/pw-browsers`). Ouvrir la page
modifiée, vérifier l'absence d'erreur JavaScript en console, le rendu à 390 px
de large, et — pour toute page qui dessine dans un `<canvas>` — la stabilité de
la hauteur de page avec `deviceScaleFactor: 2`.

## Le Cabinet des curiosités (`outils/cabinet_curiosites.html`)

Promenade en 3D dans le cabinet d'un naturaliste vers 1840 et dans sa serre
amazonienne : on saisit 14 spécimens, on les retourne, et chacun pose une
question de niveau collège ou lycée (au choix à l'accueil). Pancarte
« Work in progress =) » comme les labos. Pas encore relié depuis les pages du
site : on y accède par son adresse.

- Un seul fichier, **sans bibliothèque** : un petit moteur WebGL écrit pour lui
  (section 3 du script). Tous les objets sont modelés par le code (section 4) :
  aucune image, aucun modèle 3D téléchargé, rien à créditer.
- **Migration vers Three.js en cours, par étapes, dans `outils/cabinet/`**
  (plan et état d'avancement dans `outils/cabinet/LISEZ-MOI.md`). Choix de
  Manon : licences **CC0 et CC BY seulement** (crédit obligatoire), et
  **`cabinet_curiosites.html` reste en ligne pour toujours** comme version
  légère. Exception assumée à « un outil = un seul fichier » pour le nouveau
  dossier, mais toujours sans CDN : Three.js r187 est copié dans
  `outils/cabinet/vendor/three-r187/`, jamais retouché (empreintes vérifiées
  par un test).
- **Les textes se corrigent dans `outils/cabinet/js/donnees/curiosites.js`**,
  pas dans la version légère. **La bonne réponse est toujours la première du
  tableau `choix`** : l'ordre est mélangé à l'affichage. En ligne, la version
  légère relit ce fichier au démarrage ; elle en garde une copie, entre deux
  repères « COPIE AUTOMATIQUE », pour fonctionner par double-clic. Cette copie
  se régénère avec `node synchroniser.mjs` (dans `outils/cabinet/`), et un test
  échoue tant qu'elle est en retard. Avant de synchroniser, vérifier que Manon
  n'a pas corrigé la copie directement : reporter sa correction dans
  `curiosites.js`, sinon elle serait écrasée.
- Un objet = une entrée de `curiosites.js` + un modèle dans `MODELES` + une
  place dans `PLACES` (version légère), sous le même `id`.
- **La nouvelle version est en ligne à `outils/cabinet/` (étape 1 faite), reliée
  nulle part** : même cabinet, dessiné par Three.js, en modules ES chargés par
  une carte d'import (`index.html`), sans étape de construction. Son modelage
  (`js/procedural/`) est une copie découpée de celui de la version légère :
  désormais chacune vit sa vie, et la version légère ne bouge plus. Dans la
  nouvelle, un objet = `curiosites.js` + `MODELES` (`js/procedural/modeles.js`)
  + `PLACES` (`js/donnees/objets.js`) + son rang dans `ORDRE_ETIQUETTES`
  (`js/procedural/textures.js`). Les deux pages exposent les mêmes noms globaux
  (`etat`, `J`, `saisir`…) pour que le parcours de test tourne sur les deux.
- **Coût d'une image** : ne calculer les reflets (Phong) que pour les matières
  brillantes, et pas d'ombre de lampe ponctuelle (une cube map à chaque pixel) ;
  mesurer avec `?perf` dans l'adresse.
- **Trois qualités (étape 2 faite)** : basse (le rendu de l'étape 1, rien à
  télécharger), moyenne (PBR, textures photographiées, reflets captés au
  démarrage par deux sondes, cabinet et serre), haute (plus de pixels, ombres
  plus fines, velours). Choix dans l'aide, gardé sous la clé
  `cabinet-curiosites-qualite`, à part de la progression ; « automatique »
  prend la basse sans carte graphique (donc dans les tests : le parcours force
  `?qualite=moyenne`). Toute nouvelle matière du modelage reçoit une entrée
  dans `MATS` (`js/procedural/geometrie.js`) **et** dans `PBR`
  (`js/rendu/matieres.js`).
- **Textures téléchargées** : `outils/cabinet/textures/`, WebP, CC0 ou CC BY.
  **Jamais de fichier dans `textures/` sans son entrée dans
  `js/donnees/credits.js`** (un test le vérifie) ; les crédits s'affichent dans
  l'aide.
- **Tests avant toute publication qui touche au cabinet**, depuis
  `outils/cabinet/` : `npm test`, puis `NODE_PATH=/opt/node22/lib/node_modules
  CHROMIUM=/opt/pw-browsers/chromium npm run test:navigateur` (parcours élève
  complet, téléphone, double-clic hors connexion).
- La progression de l'élève reste dans son navigateur (`localStorage`, clé
  `cabinet-curiosites-v1`) : la nouvelle version doit garder la même clé et le
  même format.

## Outil de correction de copies (`correction_copies.html`) — pour Manon, pas pour les élèves

Appli autonome (un seul fichier HTML, clé API Claude saisie par Manon, données
en `localStorage` + sync Supabase optionnelle) qui corrige des copies et génère
des remédiations. C'est un outil d'enseignante, comme le Carnet : aucun lien
depuis les pages des élèves. Le badge de version est affiché à côté du logo (bien
vérifier qu'on teste la dernière version — pièges de cache fréquents).

**Passage au collège (évaluation par compétences) :** Manon enseigne maintenant
au collège, où l'on évalue **par compétences** (niveaux de maîtrise), pas par une
note sur 20. Les référentiels officiels qu'elle utilise sont enregistrés dans
`correction-college/` (`competences_sciences_cycle3.json`,
`competences_svt_cycle4.json`, + `LISEZ-MOI.md`) : c'est la mémoire de référence
pour bâtir un **mode collège** de l'outil. L'échelle de maîtrise reste à caler
avec elle.
