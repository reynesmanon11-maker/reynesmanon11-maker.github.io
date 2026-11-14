# Styles : thèmes, fonds, chartes sur mesure

## Les quatre thèmes

Un thème se choisit sur `.diapo` (`data-theme="…"`) et peut être changé pour une page ou une
fenêtre : un support de cours en `atelier` peut contenir une partie escape game en `aventure`.

| Thème | Pour quoi | Polices | Couleurs | Signes distinctifs |
|---|---|---|---|---|
| `atelier` | présentation, support de cours, réunion | Raleway (titres et texte) | fond blanc, encre `#121212`, accent rose `#f74395`, second accent bleu `#6084ee` | formes fluides en dégradé violet-rose dans les coins (`data-decor`), barre de menu noire, cadres à bord noir, boutons pilules |
| `aventure` | escape game, enquête, récit | Bangers (titres, façon bande dessinée), Yusei Magic (texte) | photo ou fond sombre plein cadre, titres blancs ombrés, accent rouge `#e83030`, étiquettes pastel | bulles de BD, plaques pastel, éclats « Énigme », digicode, minuteur |
| `nature` | SVT, sorties, herbier, bilan de chapitre | Fraunces (titres à empattements), Nunito (texte) | fond crème `#f3f6f1`, encre vert sombre, accent vert `#2f7150`, second accent ocre | décor en dégradé de verts, cadres très arrondis |
| `nuit` | astronomie, numérique, annonce, page de code | Space Grotesk (titres), Inter (texte) | fond bleu nuit `#000f33`, texte blanc, accent cyan `#30dfe6`, second accent violet | cartes translucides à filet blanc |

Les polices viennent de Google Fonts ; l'assembleur ajoute le lien voulu. Hors connexion, une
police voisine du système prend le relais : la mise en page tient, l'allure est un peu moins fidèle.

## Fonds de page

- **Photographie** : `data-fond="images/foret.jpg"`, de préférence 1600 px de large, paysage.
  Ajouter `data-voile="0.3"` dès qu'un texte est posé dessus, ou poser le texte dans un `panneau`.
- **Fonds prêts** (dégradés, sans image) : `foret`, `ocean`, `nuit`, `volcan`, `parchemin`, `labo`,
  `metal`, `prairie`, et `degrade` (le dégradé du thème).
- **Couleur ou dégradé libre** : `data-fond="#fdf6e3"`, `data-fond="linear-gradient(160deg,#fde2e4,#e2ece9)"`.
- **Décor du thème** : `data-decor="bas-gauche"` et consorts. Alterner les coins d'une page à
  l'autre donne du rythme ; `petit` les rend discrets sur une page chargée.

## Deux allures de référence

Elles viennent de présentations réelles d'enseignantes de SVT, et donnent le ton attendu.

**La présentation claire** (thème `atelier`). Page de titre : le titre aligné à droite sur la
moitié gauche, en deux graisses (une ligne maigre, une ligne grasse), une illustration ronde à
droite, un bouton rose « Start », la forme fluide dans un coin. Pages de contenu : barre de menu
noire en haut, rubrique en cours cerclée de rose ; un grand cadre à bord noir épais partagé en deux
colonnes aux titres en italique gras ; des émojis en tête de ligne ; de petits boutons roses
« + info » qui ouvrent des fenêtres blanches à croix noire ; un bouton noir à icône pour la
question clé. Dernière page : « MERCI ! » en rose.

**L'escape game en bande dessinée** (thème `aventure`). Photo plein cadre par lieu (forêt,
banquise, récif) ; titre en capitales blanches ombrées ; un personnage dans un coin avec une bulle
qui donne la mission ; les documents rangés derrière des plaques pastel d'une même teinte par lieu ;
un éclat « Énigme » qui ouvre la question ; une carte du monde aux destinations cliquables comme
sommaire ; un coffre à digicode en dernière étape, dont le code se construit avec les réponses.

## Créer une charte sur mesure

Quand la personne donne ses couleurs, celles de son établissement, ou veut « le même style que
mon ancienne présentation », redéfinir les variables dans le `<style>` de la source :

```html
<style>
  .diapo {
    --fond: #fffaf3; --encre: #2b2118; --encre-douce: #6b5b4d;
    --accent: #d1495b; --sur-accent: #ffffff; --accent2: #edae49;
    --degrade: linear-gradient(200deg, #edae49 0%, #d1495b 100%);
    --police-titre: "Baloo 2", system-ui, sans-serif;
    --police-texte: "Nunito", system-ui, sans-serif;
    --rayon: 18px; --trait: 2px;
  }
</style>
<main class="diapo" data-theme="atelier" data-polices="Baloo+2:wght@600;800|Nunito:wght@400;700">
```

| Variable | Rôle |
|---|---|
| `--fond`, `--encre`, `--encre-douce` | fond des pages, texte, texte secondaire |
| `--accent`, `--sur-accent` | couleur de ce qui se clique, et couleur du texte posé dessus |
| `--accent2` | seconde couleur (minuteur, encadrés d'explication, repères) |
| `--degrade` | dégradé des formes de décor |
| `--carte`, `--trait`, `--rayon` | fond, épaisseur du bord et arrondi des cadres |
| `--police-titre`, `--police-texte`, `--graisse-titre`, `--ombre-titre` | typographie |
| `--teinte` | couleur d'une plaque, d'un éclat, d'une carte ou d'un jeton (se règle par `data-teinte`) |

Règles de choix :

- **Deux polices au plus**, une pour les titres, une pour le texte. Des polices rondes et lisibles
  pour le collège (Nunito, Baloo 2, Quicksand, Fredoka) ; plus sobres pour le lycée et les adultes
  (Raleway, Inter, Source Sans 3) ; une police de caractère pour les titres de jeu seulement
  (Bangers, Luckiest Guy, Permanent Marker).
- **Une couleur d'accent**, vive, réservée à l'interactif ; une seconde, plus calme, pour le reste.
  Vérifier que le texte posé sur l'accent se lit (`--sur-accent`).
- **Des teintes pastel de la même famille** pour les plaques et les cartes d'une même page :
  `#e3db7a` (paille), `#d4baf7` (lilas), `#d8f0c1` (tilleul), `#b8e0f6` (ciel), `#f9c9c0` (corail).
- Garder la même charte sur toute la présentation ; changer de thème seulement pour marquer un
  changement de nature (du cours vers le jeu).
