# Vie fixée · Épisode 1 — « Se nourrir sans bouger »

Cours de Terminale spécialité (Thème 2, chapitre 1 : *Les Angiospermes et la
vie fixée*, bilan de l'activité 1), mis en animation à la manière d'une série.
La voix est celle de l'enregistrement du cours ; chaque animation est calée sur
le mot prononcé.

## Fabrication

Tout part d'un seul principe : la page n'a qu'une fonction `seek(t)` qui
calcule l'état de chaque élément à l'instant `t` (secondes dans l'audio).
Rien ne s'anime « tout seul » : la même page sert donc

- de **lecteur** (ouvrir `episode.html` avec `voix.m4a` posé à côté) ;
- de **banc de rendu** : Playwright appelle `seek(n / 25)` image par image et
  envoie les captures à ffmpeg.

| Fichier | Rôle |
|---|---|
| `gen.py` | toutes les scènes, avec leurs temps d'apparition (`A(t, effet)`) |
| `src/engine.js` | le moteur : effets (`up`, `pop`, `draw`, `count`, `type`, `hl`…) et caméra |
| `src/player.js` | lecteur, barre de progression, sous-titres |
| `src/style.css` | charte : fond nuit, rouge « série », Bebas Neue + Onest |
| `src/subs.json` | transcription horodatée, corrigée à la main |
| `rendu/` | transcription (faster-whisper), sous-titres, rendu |
| `make.py` | génère `src/scenes.html` puis assemble `episode.html` |
| `rendu/render.mjs` | rendu image par image → MP4 |

Pour retoucher : modifier un temps ou un texte dans `gen.py`, `python3 make.py`,
puis relancer le rendu.

Les schémas sont redessinés (SVG) d'après les documents du cours, pas copiés
des manuels.

## Les vrais documents du cours

Les scènes montrent les documents du PDF (recadrés), avec zooms et annotations
calés sur la voix. `crops.json` donne chaque cadrage en % de la page ;
`rendu/recadre.py` produit les images dans `docs/`, qui **ne sont pas versionnées**
(documents de manuels, dépôt public) :

    pdftoppm -r 220 -png cours.pdf pages/p
    python3 rendu/recadre.py pages crops.json docs

Dans `gen.py`, `DOC(nom, t, kb=…, hl=…, notes=…)` place un document ; positions
en % de la page, lues sur la page quadrillée par `rendu/grille.py`.
