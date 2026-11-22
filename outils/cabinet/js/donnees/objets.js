// Où se trouve chaque curiosité dans la pièce. Repris tel quel de la version légère.

/* Où se trouve chaque objet : p = [x, y, z] en mètres, ry = rotation (radians).
   Repères : x va de l'ouest (−6, cheminée) à l'est (+6, porte de la serre) ;
   la serre s'étend de x = 6 à x = 14. z va du nord (−4,5 : bibliothèques et
   vitrine) au sud (+4,5 : les fenêtres). Le sol est à y = 0. */
export const PLACES = {
  pinsons:     {p:[4.25, 0.955, -2.25], ry:-1.08},
  phalene:     {p:[-0.75, 1.75, 4.44], ry:Math.PI},
  tortue:      {p:[4.65, 0.68, 3.38], ry:-Math.PI/2 - 0.35},
  nautile:     {p:[1.0, 2.09, -4.22], ry:0.25},
  ammonite:    {p:[1.95, 1.59, -4.22], ry:-0.15},
  corail:      {p:[2.7, 1.1, -4.22], ry:0},
  serpent:     {p:[0.85, 1.08, -4.22], ry:0.25},
  crocodile:   {p:[2.4, 3.25, 0.9], ry:0.12},
  microscope:  {p:[-0.55, 0.985, -0.05], ry:0.55},
  planche:     {p:[-5.955, 2.3, 0], ry:Math.PI/2},
  glossopetres:{p:[-3.0, 0.885, 4.12], ry:Math.PI},
  cacao:       {p:[12.785, 1.12, -3.15], ry:0},
  banane:      {p:[12.55, 1.42, 2.95], ry:0},
  victoria:    {p:[10.9, 0.39, 0.72], ry:0}
};
