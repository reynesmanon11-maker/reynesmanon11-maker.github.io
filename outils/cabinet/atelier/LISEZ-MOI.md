# Atelier : la fabrication du nouveau cabinet

Ces scripts fabriquent `modeles/cabinet/` de bout en bout. Rien ici n'est chargé
par la page : c'est l'outillage, gardé dans le dépôt pour pouvoir refaire ou
modifier la pièce.

## Ce qu'il faut

- **Blender 4.5 LTS** (gratuit), utilisé sans fenêtre (`blender -b`) ;
- Python 3 avec numpy et Pillow ;
- Node.js, avec dans `<atelier>/outillage/` :
  `npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp` ;
- un dossier de travail hors du dépôt, l'**atelier** (variable `ATELIER`, par
  défaut `~/atelier-cabinet`), où vont les téléchargements et les fichiers
  intermédiaires (plusieurs centaines de Mo).

## Dans l'ordre

    python3 -I telecharger.py "$ATELIER/ph"                      # Poly Haven : textures, modèles, panorama
    python3 -I telecharger_smithsonian.py "$ATELIER/modeles/si2" # Smithsonian : spécimens numérisés
    NODE_PATH=… node exporter_canvas.mjs "$ATELIER/blender/canvas"  # globe, planches dessinés par le jeu
    BLENDER=/chemin/blender ./chaine.sh 2048 128                 # tout le reste (35 min environ)

`chaine.sh 1024 16` fait un essai rapide (2 minutes) : même scène, lumière plus
grossière.

## Les scripts

| Script | Rôle |
|---|---|
| `preparer_textures.py` | teinte les photographies (couleur moyenne visée), dessine marbre, pierre noire, tapis, reliures, carte géologique |
| `geo.py` | outils de modelage en coordonnées de la page : pavés chanfreinés, pièces tournées, moulures balayées (coupées d'onglet), extrusions |
| `matieres.py` | matières PBR exportables en glTF |
| `piece.py` | l'architecture : murs, lambris à panneaux, plinthes, cimaise, corniche, rosace, verrières, porte, cheminée |
| `mobilier.py` | le mobilier modelé (mêmes emplacements et mêmes hauteurs de plateaux que le décor dessiné) et les emprises pour les collisions |
| `livres.py` | garnit les rayons : séries de volumes, livres penchés, piles couchées |
| `accessoires.py` | place les modèles Poly Haven et Smithsonian (allégés), modèle le terrarium, le livre ouvert, la verrerie |
| `construire.py` | assemble la scène, la lumière (ciel physique, soleil, portails, feu) et des caméras d'aperçu |
| `apercu.py` | rend des vues d'aperçu (Cycles) pour juger avant de cuire |
| `cuire.py` | cartes de coordonnées de lumière, cuisson Cycles, débruitage, codage 8 bits |
| `exporter.py` | export glTF (seconde carte de coordonnées = lumière) |
| `optimiser.mjs` | WebP, compression meshopt, nettoyage |
| `publier.py` | dépose les fichiers dans `modeles/cabinet/`, écrit `js/donnees/credits-cabinet.js` |
| `inventaire.py` | affiche taille et triangles des modèles téléchargés |

## Règles

- Licences **CC0 ou CC BY** seulement ; chaque ressource reçoit son crédit par
  `publier.py` (auteurs réels lus sur les fiches Poly Haven). Un test refuse tout
  fichier inconnu dans `modeles/cabinet/`.
- Les curiosités gardent leurs places (`js/donnees/objets.js`) : un meuble qui
  porte une curiosité garde la hauteur de son plateau, ou bien la nouvelle place
  est écrite dans `js/donnees/prototype.js` (cas du microscope sur l'établi).
- Un objet de plus de 60 cm reçoit de la lumière cuite ; un plus petit est éclairé
  par sonde dans la page (décision dans `accessoires.py`).
- Les coordonnées sont celles de la page : x vers l'est (la serre), y vers le
  haut, z vers le sud (les verrières) ; `geo.V()` convertit pour Blender.
