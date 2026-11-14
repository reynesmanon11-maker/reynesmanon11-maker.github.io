# Skills de Manon

Ce dossier ne fait pas partie du site des élèves : il range des *skills* pour Claude, à transmettre
à des collègues. Il vit sur une branche de travail et n'est relié à aucune page.

## `diaporama-interactif/`

Fait produire à Claude des présentations interactives « façon Genially » en un seul fichier HTML :
pages cliquables, fenêtres « + info », infobulles, animations, quiz, cartes à retourner,
glisser-déposer, et tout l'attirail de l'escape game (cadenas, digicode, minuteur).

- `SKILL.md` : la notice que lit Claude ; `references/` : le vocabulaire, les styles, la
  correspondance avec Genially ; `assets/` : le moteur ; `scripts/` : assemblage, contrôle, lecture
  d'un export Genially ; `exemples/vitrine.html` : la source de la démonstration.
- `livrables/diaporama-interactif.skill` : le skill empaqueté, à envoyer à une collègue (elle
  l'ajoute dans Claude : Paramètres, puis Capacités, puis Skills).
- `livrables/vitrine.html` : la démonstration assemblée, à ouvrir dans un navigateur.

Après toute modification du skill, depuis la racine du dépôt :

```bash
python3 skills/diaporama-interactif/scripts/assembler.py skills/diaporama-interactif/exemples/vitrine.html -o skills/livrables/vitrine.html
```

```bash
NODE_PATH=/opt/node22/lib/node_modules node skills/essais/parcours-vitrine.js skills/livrables/vitrine.html
```

Le premier reconstruit la démonstration, le second vérifie que chaque brique réagit (29 essais).
Refaire ensuite le fichier `.skill` avec l'outil d'empaquetage du skill « skill-creator ».

Le moteur est un travail original : il ne reprend ni le code, ni le logo, ni les illustrations de
Genially. Les exports Genially de Manon et de ses collègues ne sont pas rangés ici.
