# Cabinet des curiosités — passage à Three.js

Ce dossier contient la nouvelle version du cabinet, dessinée par Three.js :
<https://reynesmanon11-maker.github.io/outils/cabinet/> (reliée nulle part pour
l'instant). La migration se fait par étapes, et **la version légère
(`outils/cabinet_curiosites.html`) reste en ligne pour toujours** : un seul
fichier, sans bibliothèque, qui s'ouvre aussi par double-clic hors connexion.
C'est elle que voient les élèves tant que la nouvelle n'est pas prête.

Ajouter `?perf` à l'adresse affiche un compteur (images par seconde, appels de
dessin, triangles, qualité) : c'est lui qui servira à mesurer sur un poste de
l'établissement.

## Qualité de l'image

Trois profils, choisis dans l'aide (bouton ?) ou automatiquement :

- **basse** : le rendu de l'étape 1, matières simples et textures dessinées ;
  rien de plus à télécharger. Choisie d'office quand la 3D est calculée sans
  carte graphique, ou sur un appareil modeste ;
- **moyenne** : matières réalistes (PBR), textures photographiées, reflets de
  la pièce, captés au démarrage par deux « sondes » (cabinet et serre) ;
- **haute** : la même chose, avec plus de pixels, des ombres plus fines et le
  reflet du velours.

Le choix est gardé dans le navigateur (clé `cabinet-curiosites-qualite`, à part
de la progression). `?qualite=basse`, `moyenne` ou `haute` dans l'adresse
force un profil, pour comparer. En automatique, si l'image tombe sous 18 images
par seconde, un message propose la qualité basse.

## Où corriger les textes

**Dans `js/donnees/curiosites.js`, et nulle part ailleurs.** C'est un petit
fichier, modifiable directement dans l'éditeur de GitHub. Les textes s'écrivent
entre guillemets droits ; apostrophes et guillemets « » se tapent librement.
La bonne réponse de chaque question est toujours la première de sa liste
(l'ordre est mélangé à l'affichage).

La version légère relit ce fichier quand elle est ouverte en ligne : une
correction y apparaît tout de suite. Elle en garde aussi une copie pour
fonctionner hors connexion ; cette copie se remet à jour avec
`node synchroniser.mjs`, et un test signale quand elle est en retard. Avant de
synchroniser, vérifier que personne n'a corrigé la copie directement : sa
correction serait écrasée.

## Ce que contient le dossier

| Chemin | Rôle |
|---|---|
| `index.html`, `css/cabinet.css` | la page : même interface que la version légère |
| `js/main.js` | démarrage, boucle ; message et lien vers la version légère si quelque chose manque |
| `js/donnees/curiosites.js` | les textes des 14 curiosités (questions, fiches, indices) |
| `js/donnees/objets.js` | la place de chaque curiosité dans la pièce |
| `js/jeu/` | état et mémoire, marche et collisions, visée, saisie, clavier, souris, tactile |
| `js/ui/interface.js` | fiche, carnet, bilan, impression |
| `js/procedural/` | le modelage par le code (géométrie, textures, décor, curiosités), repris de la version légère |
| `js/rendu/adaptateur.js` | transforme ce modelage en maillages Three.js |
| `js/rendu/qualite.js` | les trois profils de qualité, et le choix automatique |
| `js/rendu/matieres.js` | matières réalistes : rugosité, métal, textures photographiées |
| `js/rendu/moteur.js` | Three.js : lumières, ombres du soleil, reflets, halos, objet tenu dessiné par-dessus |
| `js/donnees/credits.js` | crédits des textures (et des modèles, à venir) |
| `textures/` | textures photographiées, en WebP : couleur, relief, et « arm » (occlusion, rugosité, métal) |
| `synchroniser.mjs` | recopie les textes dans la version légère |
| `vendor/three-r187/` | Three.js r187 (licence MIT), copié tel quel depuis npm : aucun site externe |
| `tests/` | tests rapides (Node) et parcours complet dans Chromium, sur les deux versions |

Le modelage de `js/procedural/` est une copie de celui de la version légère,
découpée en modules. Désormais, chacune vit sa vie : la version légère ne bouge
plus, la nouvelle remplacera peu à peu ses formes par des modèles GLB.

## Three.js

Les fichiers de `vendor/three-r187/` viennent du paquet npm `three@0.187.0`
(dossier `build/`), sans aucune retouche. `SHA256SUMS` garde leurs empreintes,
et un test échoue si l'un d'eux change. Pour passer à une autre version : créer
un nouveau dossier `vendor/three-rXXX/` complet, avec ses empreintes, et ne
jamais modifier un fichier à la main.

Depuis la version r163, Three.js exige WebGL 2. Un poste qui ne l'a pas sera
renvoyé vers la version légère.

## Textures

Quatre jeux CC0 de [Poly Haven](https://polyhaven.com) (parquet en point de
Hongrie, bois sombre, brique, tomettes à cabochons), 817 Ko en tout : couleur
et relief en 1024 px, rugosité en 512 px, convertis en WebP. **Aucun fichier
dans `textures/` sans son entrée dans `js/donnees/credits.js`** : un test le
vérifie, ainsi que la licence (CC0 ou CC BY). Les crédits s'affichent dans
l'aide. Sur une photographie de bois, les nuances du modelage (noyer, acajou,
ébène) sont gardées, rapportées à la teinte de référence (`ref` dans
`matieres.js`), et `teinte` ramène la photographie vers les bruns d'origine
(couleurs moyennes comparées).

## Modèles 3D (à partir de l'étape 3)

- Licences acceptées : **CC0** et **CC BY** (avec crédit). Rien d'autre.
- Chaque modèle a son crédit (auteur, licence, lien), dans `js/donnees/credits.js`,
  affiché dans la fiche. Aucun modèle publié sans crédit.
- Budgets de départ : 30 000 à 80 000 triangles et 1,5 Mo au plus pour un
  objet ; 8 Mo environ pour le décor ; 20 Mo au plus au premier chargement.
- Pas de Git LFS : GitHub Pages ne sert pas ces fichiers. Les modèles sont
  compressés avant d'être déposés, car chaque version reste dans l'historique.

## Tests

Depuis ce dossier :

    npm test
    NODE_PATH=/opt/node22/lib/node_modules CHROMIUM=/opt/pw-browsers/chromium npm run test:navigateur

Le parcours rejoue tout ce que fait un élève, **sur les deux versions** : marche
et collisions, visée, saisie à la souris et au doigt, réponses, carnet, bilan,
impression, mémoire après rechargement, téléphone à 390 px. S'y ajoutent
l'ouverture par double-clic (version légère), le renvoi vers la version légère
sans WebGL 2 ou si les textes sont abîmés, et la progression partagée entre les
deux versions (même clé de mémoire).

## Étapes

0. Préparation : textes extraits, Three.js dans le dépôt, tests de référence. **Faite.**
1. Le même cabinet, dessiné par Three.js. **Faite.** En plus : les ombres du
   soleil (calculées une fois, le décor ne bougeant pas) et le rendu AgX. Coût
   d'une image mesuré à peu près égal à celui de la version légère dans un
   navigateur sans carte graphique, à condition de ne calculer les reflets que
   pour les matières brillantes ; reste à mesurer sur un vrai poste.
2. Matériaux et lumière réalistes, profils de qualité. **Faite.** Textures CC0,
   reflets par sondes, halo des flammes, velours en haute qualité. Dans un
   navigateur sans carte graphique : la basse coûte autant que la version
   légère, la moyenne environ 2,5 fois plus ; reste à mesurer sur un vrai
   poste.
3. Chaîne de préparation des modèles GLB, premiers vrais objets, crédits.
4. Décor modelé, avec éclairage précalculé.
5. Nouveaux objets et interactions, serre réaliste.
6. Liens depuis les pages de niveau ; l'ancienne page devient la version légère.
