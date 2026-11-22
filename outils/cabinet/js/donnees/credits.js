// Crédits des ressources téléchargées : textures (et, à l'étape 3, modèles 3D).
// Règle du site : licences CC0 ou CC BY seulement, et AUCUN fichier dans textures/
// (ni plus tard dans modeles/) sans son entrée ici. Un test le vérifie.
// Même en CC0, où rien n'est exigé, on cite l'origine et les auteurs.
//
// Pour chaque jeu de textures :
//   fichiers   les trois cartes, dans textures/ : couleur, relief (normal map, OpenGL)
//              et arm (occlusion, rugosité, métal dans les canaux rouge, vert, bleu)
//   taille     côté réel de l'image, en mètres (donné par la fiche d'origine)
//   sert       où on la voit dans le cabinet
export const LICENCES = {
  CC0: {nom:'CC0 (domaine public)', lien:'https://creativecommons.org/publicdomain/zero/1.0/deed.fr'},
  'CC BY 4.0': {nom:'CC BY 4.0', lien:'https://creativecommons.org/licenses/by/4.0/deed.fr'}
};

export const TEXTURES = {
  parquet: {
    titre:'Herringbone Parquet', sert:'le parquet en point de Hongrie du cabinet', taille:3.4,
    auteurs:'Sergej Majboroda (photographie), Jenelle van Heerden (traitement)',
    licence:'CC0', source:'https://polyhaven.com/a/herringbone_parquet', site:'Poly Haven',
    fichiers:{couleur:'parquet-couleur.webp', relief:'parquet-relief.webp', arm:'parquet-arm.webp'}
  },
  bois: {
    titre:'Dark Wood', sert:'le bois des meubles (noyer, acajou, ébène selon la teinte)', taille:2.0,
    auteurs:'Dimitrios Savva (photographie), Rico Cilliers (raccords), Dario Barresi (calcul des cartes)',
    licence:'CC0', source:'https://polyhaven.com/a/dark_wood', site:'Poly Haven',
    fichiers:{couleur:'bois-couleur.webp', relief:'bois-relief.webp', arm:'bois-arm.webp'}
  },
  brique: {
    titre:'Brick Wall 001', sert:'les briques des murs extérieurs et du muret de la serre', taille:3.0,
    auteurs:'Dimitrios Savva (photographie), Rob Tuytel (traitement)',
    licence:'CC0', source:'https://polyhaven.com/a/brick_wall_001', site:'Poly Haven',
    fichiers:{couleur:'brique-couleur.webp', relief:'brique-relief.webp', arm:'brique-arm.webp'}
  },
  tomettes: {
    titre:'Patterned Terracotta Tiling', sert:'les tomettes à cabochons du sol de la serre', taille:2.15,
    auteurs:'Amal Kumar',
    licence:'CC0', source:'https://polyhaven.com/a/patterned_terracotta_tiling', site:'Poly Haven',
    fichiers:{couleur:'tomettes-couleur.webp', relief:'tomettes-relief.webp', arm:'tomettes-arm.webp'}
  }
};
