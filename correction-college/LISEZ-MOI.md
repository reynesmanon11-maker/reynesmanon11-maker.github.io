# Compétences collège — Sciences / SVT (mémoire pour l'outil de correction)

Ce dossier garde les **référentiels de compétences du collège** de Manon Reynes,
pour construire le **mode collège** de l'outil de correction de copies :
au collège on **évalue par compétences** (niveaux de maîtrise), pas par une note
sur 20 comme on l'avait fait pour le lycée.

- Données exploitables par l'appli : `competences_sciences_cycle3.json`,
  `competences_svt_cycle4.json`.
- Source : captures d'écran de la grille de compétences fournies par Manon
  (octobre 2026). « Tous les niveaux » = la compétence s'évalue sur tout le cycle.
- Échelle de maîtrise retenue (celle de l'activité type de sa collègue) :
  **I = insuffisant · F = fragile · S = satisfaisant · E = excellent**.
  Une compétence atteinte à **S ou E au moins une fois = acquise** (l'élève a
  montré qu'il sait la faire).
- Conversion en note (optionnelle) : points par niveau éditables, défaut
  I=1 · F=2 · S=3 · E=4 ; note /20 = (somme ÷ (4 × nb compétences)) × 20.
- Mode d'évaluation par niveau : **6e** compétences seules · **5e** et **4e**
  mixte (compétences + note) · **3e** note affichée avec compétences derrière.
- Trame d'une évaluation (modèle de sa collègue) : un tableau « Compétences
  travaillées » en tête, listant 1 à 3 compétences **reformulées à hauteur
  d'élève** (« j'ai justifié chaque classement avec un indice… »), chacune
  cochée I/F/S/E. Chaque reformulation renvoie à une compétence officielle des
  JSON.
- À relire / corriger librement : si un intitulé est imprécis, le modifier ici
  **et** dans le JSON correspondant.

## Cycle 3 — Sciences et technologie (SVT + physique-chimie + technologie)

1. **Pratiquer des démarches scientifiques et technologiques** (D4)
2. **Concevoir, créer, réaliser** (D4, D5)
3. **S'approprier des outils et des méthodes** (D2)
4. **Pratiquer des langages** (D1.1)
5. **Mobiliser des outils numériques** (D5)
6. **Adopter un comportement éthique et responsable** (D3, D5)
7. **Se situer dans l'espace et dans le temps** (D5)
8. **Faire preuve d'esprit critique** (D2, D4)

## Cycle 4 — SVT

1. **Pratiquer des démarches scientifiques** (D1.3, D2, D4)
2. **Concevoir, créer, réaliser** (D4)
3. **Utiliser des outils et mobiliser des méthodes pour apprendre** (D2)
4. **Pratiquer des langages** (D1.3, D4)
5. **Utiliser des outils numériques** (D1.3, D4)
6. **Adopter un comportement éthique et responsable** (D3, D4, D5)
7. **Se situer dans l'espace et dans le temps** (D4, D5)
8. **Mobiliser les connaissances** (Thème 1 : la planète Terre, l'environnement
   et l'action humaine ; Thème 2 : le corps humain et la santé ; Thème 3 : le
   vivant et son évolution)

> Le détail des items (sous-compétences) de chaque grande compétence est dans
> les fichiers JSON à côté de ce document.
