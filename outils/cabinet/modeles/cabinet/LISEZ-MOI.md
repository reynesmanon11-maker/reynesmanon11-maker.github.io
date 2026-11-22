# Le nouveau décor du cabinet (prototype)

La pièce du cabinet refaite pour être crédible : une vraie architecture (lambris
à panneaux, corniche, rosace, grandes verrières à châssis de fer, cheminée de
marbre), du mobilier modelé (bibliothèques, vitrine, établi à plateau de pierre
noire, tabourets, médaillier, bureau, coffre, guéridon, globe), 560 livres tous
différents, de vrais spécimens de musée numérisés et une lumière du jour
calculée comme pour une image de synthèse.

C'est le décor par défaut de `outils/cabinet/`. L'aide (bouton ?) permet de
revenir au décor dessiné par le code (« Ancien ») pour comparer ; `?decor=actuel`
ou `?decor=prototype` dans l'adresse force le choix. Le réglage est gardé sous la
clé `cabinet-curiosites-decor`, à part de la progression. La serre n'a pas
changé.

## Les fichiers

| Fichier | Contenu |
|---|---|
| `cabinet.glb` | la pièce, son mobilier et ses objets (glTF, textures WebP, géométrie compressée meshopt) |
| `lumiere-a.webp`, `lumiere-b.webp` | la lumière précalculée : architecture (A), mobilier (B) |
| `cabinet.json` | intensité de chaque carte de lumière, emprises au sol des meubles (collisions) |
| `dehors.webp` | le jardin vu par les verrières : panorama photographique CC0 |

Ils sont **produits** par la chaîne de `outils/cabinet/atelier/` : ne pas les
retoucher à la main. Les crédits (`js/donnees/credits-cabinet.js`) sont écrits
par la même chaîne et s'affichent dans l'aide ; un test vérifie qu'aucun fichier
inconnu n'est déposé ici et que chaque ressource a son crédit (CC0 ou CC BY).

## Comment la lumière est faite

Toute la lumière des surfaces fixes (soleil, ciel, feu, et tous les rebonds) est
calculée une fois pour toutes dans Blender (moteur Cycles), et rangée dans deux
images : les « cartes de lumière ». La page multiplie la couleur de chaque
surface par sa carte. On obtient l'éclairage d'une image de synthèse (ombres
douces, coins assombris, lumière qui rebondit du parquet sur les murs) pour le
prix d'une texture : c'est aussi ce qui rend ce décor **moins coûteux à afficher**
que l'ancien sur un poste faible (en qualité basse, aucune lumière n'est calculée).

Les petits objets et les curiosités, qui peuvent bouger ou être saisis, sont
éclairés par huit « sondes » : des photographies de la pièce prises au démarrage
à des endroits choisis (`js/donnees/prototype.js`). Le soleil de la page, orienté
comme celui de la cuisson, les éclaire quand ils sont dans une tache de soleil.

## Les sources

- **Smithsonian Institution** (Open Access, CC0) : numérisations 3D de spécimens
  du National Museum of Natural History (poisson porc-épic, poisson-coffre,
  bénitier, casque, corail cerveau, étoile de mer, crabe, langouste montée,
  crânes de cerf et de gorille, fossiles de *Diademodon* et de *Thrinaxodon*,
  moulage de l'archéoptéryx de Berlin).
- **Poly Haven** (CC0) : lustre, horloge, fauteuil, tableaux, buste, pendule,
  chandelier, microscope, instruments, plantes, roches ; textures de bois, de
  parquet, d'enduit et de cuir ; panorama du jardin.
- **Dessiné par programme** pour le cabinet : marbre veiné, pierre noire, tapis,
  planche de reliures, carte géologique.

## Budgets mesurés (prototype)

Environ 15 Mo pour le décor (premier chargement, ensuite en cache), 340 000
triangles en tout, une centaine d'appels de dessin dans la pièce. Reste à mesurer
sur un poste de l'établissement (`?perf` dans l'adresse) et à alléger si besoin
(textures des petits objets, livres).
