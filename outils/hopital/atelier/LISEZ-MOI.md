# Atelier de l'hôpital 3D

Scripts qui fabriquent `outils/hopital/modeles/` (bâtiment, mobilier, médecins, lumière cuite).
Ne jamais retoucher ces fichiers produits à la main : relancer la chaîne.

Ils s'appuient sur l'atelier du cabinet (`outils/cabinet/atelier/` : `geo.py`, `matieres.py`,
`mobilier.py`, `accessoires.py`, `cuire.py`, `exporter.py`, `optimiser.mjs`), avec Blender 4.5.

## Étapes

1. `telecharger_hopital.py <dossier>` : textures et objets Poly Haven (CC0).
2. Données MakeHuman (CC0) dans `sources/` (ou la variable `MAKEHUMAN`) :
   `mpfb2/src/mpfb/data` (corps de base, cibles, squelette, poids) et `mh/assets`
   (peaux, yeux, cheveux, vêtements, chaussures du paquet « system assets cc0 »).
3. `python3 textures_hopital.py` : linoléum, faux plafond, murs teintés par service
   (la teinte est dans l'image : l'export glTF ne garde pas les nœuds de teinte de Blender).
4. `blender -b --factory-startup -P hopital.py -- <textures cabinet> <textures hôpital> hopital.blend`
5. `blender -b hopital.blend -P cuire.py -- cuisson 2048 64`, puis `exporter.py`, puis `node optimiser.mjs`.
6. `python3 -I publier_hopital.py cuisson cuisson/hopital.glb hopital_donnees.json outils/hopital`
   (écrit aussi `hopital.json` avec les crédits).

## Les médecins (`humains.py`)

Corps MakeHuman déformé par ses cibles (sexe, âge, origine), vêtements ajustés par leurs fichiers
`.mhclo`, squelette standard. Les vêtements prennent leurs poids d'os par leurs trois points de
référence sur le corps entier, comme MakeHuman : les copier depuis le corps déjà troué mélange les
jambes et les mains. Les tenues à logo sont remplacées par une couleur unie.
Qui est qui : table `HUMAINS` dans `hopital.py` ; dans quelle salle : `SERVICES` dans `personnages.py`.
