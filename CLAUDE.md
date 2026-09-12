# Site SVT de Mme Reynes

Site statique publié par GitHub Pages depuis la branche `main`, à l'adresse
<https://reynesmanon11-maker.github.io>. Aucune étape de construction : les
fichiers HTML du dépôt sont servis tels quels.

## Publication

**Toute nouveauté doit être publiée sur `main`.** Le site est diffusé par lien
aux élèves et aux collègues : une modification qui reste sur une branche n'est
visible de personne. On travaille donc sur une branche, on vérifie dans un
navigateur, puis on fusionne dans `main` et on pousse. Compter une à deux
minutes avant que GitHub Pages ne reconstruise le site.

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | accueil |
| `2nde.html`, `1ere.html`, `terminale.html` | pages de niveau |
| `outils/labo_vegetal.html` | laboratoire virtuel de biologie végétale (d'après R. Pratt) |
| `outils/` | autres outils interactifs autonomes |
| `TODO.md` | file d'idées, pilotée par les tâches automatiques |

## Conventions

- Chaque outil de `outils/` est **autonome** : un seul fichier HTML, sans
  bibliothèque externe ni dépendance réseau, pour rester utilisable hors ligne
  et ne jamais casser à cause d'un CDN.
- La navigation est répétée dans les quatre pages principales (menu de bureau
  `nav.primary` **et** menu mobile, le tableau `NAV` en JavaScript) : ajouter un
  lien suppose de modifier les deux, dans les quatre fichiers.
- Palette terracotta : `--accent:#b15f2c`, fond `#f5f2ed`, encre `#23201c`.
  Police Onest.
- Interface et commentaires de code en français.
- Les données que saisit un élève (carnet de manip, panier de matériel,
  placard) restent dans son navigateur via `localStorage` : rien n'est envoyé
  sur un serveur.

## Vérification avant publication

Playwright et Chromium sont disponibles (`/opt/pw-browsers`). Ouvrir la page
modifiée, vérifier l'absence d'erreur JavaScript en console, le rendu à 390 px
de large, et — pour toute page qui dessine dans un `<canvas>` — la stabilité de
la hauteur de page avec `deviceScaleFactor: 2`.
