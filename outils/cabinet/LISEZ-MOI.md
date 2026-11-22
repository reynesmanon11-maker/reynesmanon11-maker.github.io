# Cabinet des curiosités — passage à Three.js

Ce dossier prépare la nouvelle version du cabinet, dessinée par Three.js, avec
de vrais modèles 3D. La migration se fait par étapes, et **la version légère
(`outils/cabinet_curiosites.html`) reste en ligne pour toujours** : un seul
fichier, sans bibliothèque, qui s'ouvre aussi par double-clic hors connexion.
C'est elle que voient les élèves tant que la nouvelle n'est pas prête.

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
| `js/donnees/curiosites.js` | les textes des 14 curiosités (questions, fiches, indices) |
| `synchroniser.mjs` | recopie ces textes dans la version légère |
| `vendor/three-r187/` | Three.js r187 (licence MIT), copié tel quel depuis npm : aucun site externe |
| `tests/` | tests rapides (Node) et parcours complet dans Chromium |

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

Le parcours rejoue tout ce que fait un élève : marche et collisions, visée,
saisie à la souris et au doigt, réponses, carnet, bilan, impression, mémoire
après rechargement, ouverture par double-clic, téléphone à 390 px. Chaque étape
de la migration devra le faire passer aussi sur la nouvelle page.

## Étapes

0. Préparation : textes extraits, Three.js dans le dépôt, tests de référence. **Faite.**
1. Le même cabinet, dessiné par Three.js.
2. Matériaux et lumière réalistes, profils de qualité.
3. Chaîne de préparation des modèles GLB, premiers vrais objets, crédits.
4. Décor modelé, avec éclairage précalculé.
5. Nouveaux objets et interactions, serre réaliste.
6. Liens depuis les pages de niveau ; l'ancienne page devient la version légère.
