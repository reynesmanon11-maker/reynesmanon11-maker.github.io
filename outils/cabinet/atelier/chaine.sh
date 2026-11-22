#!/bin/bash
# Toute la chaîne de fabrication du nouveau cabinet, de bout en bout :
#   textures → scène Blender → cuisson de la lumière → export glTF → allègement → publication
# Usage : ATELIER=~/atelier-cabinet BLENDER=/chemin/vers/blender ./chaine.sh [taille des cartes] [échantillons]
#   (2048 128 pour la version publiée, environ 35 min sur 4 cœurs ; 1024 16 pour un essai, 2 min)
# L'atelier (hors dépôt) contient : ph/ (Poly Haven, voir telecharger.py), modeles/si2/ (Smithsonian),
# blender/tex/ (textures préparées), blender/canvas/ (textures dessinées par le jeu, exporter_canvas.mjs),
# outillage/ (npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp).
set -e
ICI=$(cd "$(dirname "$0")" && pwd)
ATELIER=${ATELIER:-$HOME/atelier-cabinet}; export ATELIER
B=${BLENDER:-blender}
TAILLE=${1:-1024}; ECH=${2:-16}; CUI=$ATELIER/blender/cuisson_$TAILLE
python3 -I "$ICI/preparer_textures.py" "$ATELIER/ph" "$ATELIER/blender/tex" > /dev/null
"$B" -b --factory-startup -P "$ICI/construire.py" -- "$ATELIER/blender/tex" "$ATELIER/blender/piece.blend" 2>&1 | grep -E "SCÈNE|Error" || true
"$B" -b "$ATELIER/blender/piece.blend" -P "$ICI/cuire.py" -- "$CUI" "$TAILLE" "$ECH" 2>&1 | grep -E "ATLAS|RANGÉ|CUISSON|CODÉ|FINI|Error" || true
"$B" -b "$CUI/piece_cuite.blend" -P "$ICI/exporter.py" -- "$CUI/cabinet_brut.glb" 2>&1 | grep -E "EXPORTÉ" || true
cp "$ICI/optimiser.mjs" "$ATELIER/outillage/"
(cd "$ATELIER/outillage" && node optimiser.mjs "$CUI/cabinet_brut.glb" "$CUI/cabinet.glb" 2>&1 | grep OPTIMISÉ)
python3 -I "$ICI/publier.py" "$CUI" "$CUI/cabinet.glb" "$(dirname "$ICI")" | head -1
