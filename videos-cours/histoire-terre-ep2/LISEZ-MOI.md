# Histoire de la Terre · Épisode 2 — « Naissance et mort des montagnes »

Cours de Terminale spécialité (Thème 1, chapitre 4 : *L'histoire géologique de
la France*, bilan de l'activité 2), animé sur l'enregistrement du cours.
Même fabrique que `../vie-fixee-ep1` (voir son LISEZ-MOI) : une fonction
`seek(t)`, un rendu image par image.

| Fichier | Rôle |
|---|---|
| `gen.py` | les scènes et leurs temps d'apparition, calés sur la voix |
| `geo.py` | les coupes de géologie réutilisables : rift et blocs basculés, carte de France, étapes océan → subduction → collision, ophiolite, diagramme P-T, Hjulström, vieillissement de la lithosphère, chaîne qui s'aplanit, cycle de Wilson |
| `commun.py` | briques partagées (temps, scènes, caméra, titres) |

Le générique dure 6 s : le temps vidéo vaut le temps de la voix + 6
(`OFF=6 node ../vie-fixee-ep1/rendu/render.mjs …`).

Schémas redessinés d'après les documents du cours, pas copiés des manuels.
