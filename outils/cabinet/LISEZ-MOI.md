# Cabinet des curiosités — passage à Three.js

Ce dossier contient la nouvelle version du cabinet, dessinée par Three.js :
<https://reynesmanon11-maker.github.io/outils/cabinet/> (reliée nulle part pour
l'instant). La migration se fait par étapes, et **la version légère
(`outils/cabinet_curiosites.html`) reste en ligne pour toujours** : un seul
fichier, sans bibliothèque, qui s'ouvre aussi par double-clic hors connexion.
C'est elle que voient les élèves tant que la nouvelle n'est pas prête.

Ajouter `?perf` à l'adresse affiche un compteur (images par seconde, appels de
dessin, triangles) : c'est lui qui servira à mesurer sur un poste de
l'établissement.

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
| `js/rendu/moteur.js` | Three.js : lumières, ombres du soleil, objet tenu dessiné par-dessus |
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

## Modèles 3D (à partir de l'étape 3)

- Licences acceptées : **CC0** et **CC BY** (avec crédit). Rien d'autre.
- Chaque modèle a son crédit (auteur, licence, lien), affiché dans la fiche.
  Aucun modèle publié sans crédit.
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
2. Matériaux et lumière réalistes, profils de qualité.
3. Chaîne de préparation des modèles GLB, premiers vrais objets, crédits.
4. Décor modelé, avec éclairage précalculé.
5. Nouveaux objets et interactions, serre réaliste.
6. Liens depuis les pages de niveau ; l'ancienne page devient la version légère.
