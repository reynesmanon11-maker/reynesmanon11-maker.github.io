# Les briques : tout le vocabulaire du moteur

Sommaire : [Structure](#structure) · [Placer un bloc](#placer-un-bloc) · [Texte](#texte) ·
[Blocs décoratifs](#blocs-décoratifs) · [Rendre cliquable](#rendre-cliquable) ·
[Animer](#animer) · [Fenêtres](#fenêtres) · [Barre de menu et calque permanent](#barre-de-menu-et-calque-permanent) ·
[Quiz](#quiz) · [Cadenas](#cadenas) · [Digicode](#digicode) · [Page protégée](#page-protégée) ·
[Cartes à retourner](#cartes-à-retourner) · [Glisser-déposer](#glisser-déposer) · [Minuteur](#minuteur) ·
[Points et zones](#points-et-zones) · [Contenu intégré](#contenu-intégré) · [Icônes](#icônes) ·
[Mise en page souple](#mise-en-page-souple) · [Mode retouche](#mode-retouche) · [Pièges connus](#pièges-connus)

`exemples/vitrine.html` montre chacune de ces briques en situation.

## Structure

```html
<main class="diapo" data-theme="atelier" data-nav="libre" data-transition="fondu">
  <section class="page" id="accueil"> … </section>
  <section class="page" id="suite"> … </section>
  <section class="fenetre" id="f-info"> … </section>
</main>
```

- La scène mesure toujours **1200 × 675** ; le moteur l'agrandit ou la réduit pour remplir l'écran.
- Les pages se suivent dans l'ordre du fichier. Chaque page et chaque fenêtre porte un `id` unique,
  court et parlant (`accueil`, `doc-1`, `f-noyau`).
- Réglages de `.diapo` :

| Attribut | Valeurs | Effet |
|---|---|---|
| `data-theme` | `atelier`, `aventure`, `nature`, `nuit` | charte (voir `styles.md`) ; se met aussi sur une page ou une fenêtre |
| `data-nav` | `fleches` (défaut), `libre` | `fleches` : flèches à l'écran et au clavier ; `libre` : seuls les boutons de la page font avancer. Se met aussi sur une page. |
| `data-transition` | `fondu`, `glisse`, `zoom`, `monte`, `aucune` | passage d'une page à l'autre ; se met aussi sur une page (celle qui arrive) |
| `data-compteur` | (sans valeur) | affiche « 3 / 12 » en bas |
| `data-sons` | (sans valeur) | deux petits sons : réussite, erreur |
| `data-reperes="non"` | | retire le bouton « main » qui montre les éléments cliquables |
| `data-polices` | `Nom+De+Police\|Autre` | polices Google supplémentaires à charger |

- Réglages d'une page :

| Attribut | Effet |
|---|---|
| `data-fond` | une image (`images/foret.jpg`), une couleur (`#000f33`), un dégradé CSS, ou un fond prêt : `foret`, `ocean`, `nuit`, `volcan`, `parchemin`, `labo`, `metal`, `prairie`, `degrade` |
| `data-cadrage` | cadrage de la photo de fond (`center top`, `30% 60%`) |
| `data-voile` | assombrit le fond de 0 à 1 (`0.35`) pour que le texte reste lisible |
| `data-decor` | formes fluides du thème dans les coins : `bas-gauche`, `haut-gauche`, `bas-droite`, `haut-droite`, plus `petit`. Un coin gauche et un coin droit au maximum. |
| `data-rubrique` | nom de la rubrique à surligner dans la barre de menu quand la page n'y figure pas elle-même |
| `data-verrou` | mot de passe (voir [Page protégée](#page-protégée)) |

## Placer un bloc

`data-pos="x,y,largeur,hauteur"` place n'importe quel élément en coordonnées de scène ; la
hauteur est facultative (le bloc prend alors la hauteur de son contenu) et la largeur aussi pour
un bouton.

```html
<h2 data-pos="60,60,900">Titre</h2>
<div class="cadre" data-pos="60,140,520,380"> … </div>
<img src="images/coupe.jpg" class="arrondi" data-pos="640,140,500,380" alt="Coupe de feuille">
```

- Un bloc placé à l'intérieur d'un autre bloc placé se repère par rapport à son parent (pratique
  pour poser des points sur une image : on enveloppe l'image et les points dans un même bloc).
- `data-rot="-4"` incline un bloc de quelques degrés.
- `data-superpose` déclare qu'un bloc recouvre volontairement ses voisins (un émoji décoratif sur
  un titre) : le contrôle ne le signale plus.
- `data-deborde` : le bloc sort volontairement de la scène (une illustration coupée par le bord).
- Peu de blocs placés par page (quatre à huit), et du texte qui coule librement à l'intérieur :
  c'est plus sûr que de placer chaque ligne.

## Texte

`h1` (56), `h2` (36), `h3` (25), `p` (20). Classes : `grand` (25), `petit` (16), `tres-petit` (13),
`fin` (maigre), `centre`, `droite`, `majuscules`, `doux` (gris), `accent` (couleur d'accent), `blanc`,
`ombre-texte` (pour un texte blanc sur photo). Une taille précise : `style="font-size:44px"`.

`<span class="mot" data-info="définition">mot</span>` souligne un mot en pointillé et affiche sa
définition au survol.

Listes : `<ul class="liste-fleches">` (puces carrées à flèche), `liste-coches`, `liste-points`.

## Blocs décoratifs

| Classe | Rendu |
|---|---|
| `cadre` | carte blanche à bord fin ; `cadre epais` bord de 5 ; ajouter `ombre` pour une ombre portée |
| `panneau` | carte translucide, pour poser du texte sur une photo ; `panneau sombre` |
| `bandeau` | bloc noir à texte blanc |
| `bulle` | bulle de bande dessinée ; `data-queue="bas-gauche"` (ou `bas-droite`, `haut-gauche`, `haut-droite`) ; `bulle ronde`, `bulle carree` |
| `plaque` | étiquette pastel cliquable ; couleur par `data-teinte="#d4baf7"` |
| `postit` | pense-bête jaune collé sur la page ; `data-etiquette="Généralités"` écrit sur le ruban adhésif, `data-rot="-6"` l'incline, `data-teinte` change sa couleur |
| `eclat` | étoile éclatée (« Énigme ! ») ; donner largeur **et** hauteur ; `data-teinte`, `data-pointes="14"` |
| `tuile` | grande case de sommaire (émoji `<span class="emoji">`, titre, `<small>`) |
| `pastille` | rond numéroté |
| `etiquette` | petite mention en pastille (« Document 1 ») |
| `bouton` | bouton pilule ; variantes `sombre`, `clair`, `contour`, `petit`, `gros`, `rond` (icône seule), `carre` |

Images : `arrondi`, `rond`, `polaroid`, `ombre` ; `entier` montre l'image entière dans sa boîte au lieu de la recadrer (objet détouré, schéma). Toujours un `alt`.

## Rendre cliquable

Ces attributs se posent sur n'importe quel élément (bouton, image, texte, zone) et se combinent.

| Attribut | Effet |
|---|---|
| `data-aller="suivante"` | page suivante ; aussi `precedente`, `debut`, `fin`, `retour` (la page d'où l'on vient), ou `#id` d'une page |
| `data-ouvrir="f-info"` | ouvre la fenêtre de cet `id` |
| `data-fermer` | ferme la fenêtre ouverte |
| `data-info="texte"` | infobulle au survol (au toucher sur tablette) ; texte seul, deux phrases au plus |
| `data-lien="https://…"` | ouvre un site dans un nouvel onglet |
| `data-montrer="#a #b"` | révèle des éléments cachés (ceux qui portent la classe `cache`) |
| `data-cacher="#a"`, `data-basculer="#a"` | cache, ou alterne |

Les composants (quiz, cadenas, digicode, glisser-déposer, minuteur) déclenchent une suite avec
`data-reussite`, `data-echec` ou `data-fin`. La valeur est une liste de cibles : l'`id` d'une
page (on y va), d'une fenêtre (elle s'ouvre), d'un élément caché (il apparaît), ou un mot-clé de
navigation. Exemple : la bonne réponse fait apparaître le bouton « Suite ».

```html
<div class="quiz" data-reussite="#suite"> … </div>
<button class="bouton cache" id="suite" data-aller="suivante" data-anim="pop">Suite</button>
```

## Animer

**Entrée** (rejouée à chaque arrivée sur la page) : `data-anim` =
`fondu`, `fondu-bas`, `fondu-haut`, `fondu-gauche`, `fondu-droite`, `zoom`, `zoom-inverse`,
`glisse-gauche`, `glisse-droite`, `glisse-haut`, `glisse-bas`, `rebond`, `flou`, `bascule`, `tourne`, `pop`.

- `data-delai="0.3"` : secondes d'attente avant l'entrée.
- `data-vitesse` : `1` (0,5 s), `2` (1 s, défaut), `3` (2 s), `4` (3 s).
- `data-cascade="0.15"` sur un bloc : ses enfants entrent l'un après l'autre (pas de 0,15 s) ;
  `data-cascade-anim="zoom"` choisit l'effet, `data-delai` le départ.

**Effet continu** : `data-effet` = `battement`, `flotte`, `balance`, `pulse`, `clignote`, `tourne`.

**Au survol** : `data-survol` = `grossit`, `retrecit`, `flotte`, `penche`, `brille`, `vibre`, `battement`.

Le sens des noms : `fondu-bas` arrive **depuis** le bas ; `fondu-gauche` depuis la gauche.

## Fenêtres

```html
<section class="fenetre" id="f-info" data-taille="petite">
  <h3>Titre</h3>
  <p>Texte, image, vidéo, quiz, cadenas…</p>
</section>
```

Tailles : `petite` (440 de large), moyenne par défaut (640), `grande` (960), `pleine` (1100 × 600).
La croix, le clic à côté et la touche Échap ferment. Le contenu coule normalement ; on peut aussi
y placer des blocs avec `data-pos`. Une fenêtre fait au plus 620 de haut : au-delà, répartir sur deux
fenêtres plutôt que de faire défiler. Une fenêtre peut tout contenir, y compris un cadenas ou un
quiz dont la réussite révèle un bouton vers la suite.

## Barre de menu et calque permanent

Tout élément placé directement dans `.diapo`, hors des pages et des fenêtres, reste affiché
par-dessus toutes les pages. `data-sur="id1 id2"` le limite à certaines pages, `data-sauf="id1"` en
exclut.

```html
<nav class="barre" data-sauf="accueil fin">
  <button data-aller="#sommaire" aria-label="Sommaire"><i data-ico="maison"></i></button>
  <button data-aller="#constat">Constat</button>
  <button data-aller="#analyse">Analyse</button>
</nav>
```

La rubrique de la page affichée est surlignée automatiquement. Six ou sept entrées au maximum, en
un ou deux mots. Sous la barre, le contenu commence à y = 90.

## Quiz

```html
<div class="cadre quiz" data-pos="60,100,520,440" data-melange
     data-bravo="Exact : c'est là que se trouve la chlorophylle."
     data-rate="Relis le document 1." data-reussite="#suite">
  <p class="question">Dans quel organite se déroule la photosynthèse ?</p>
  <button class="choix" data-juste>Le chloroplaste</button>
  <button class="choix">Le noyau</button>
  <button class="choix">La mitochondrie</button>
  <p class="explication">Affichée après la bonne réponse.</p>
</div>
```

- `data-juste` marque la ou les bonnes réponses. `data-melange` change l'ordre à chaque ouverture.
- `data-multiple` : plusieurs réponses à cocher, puis un bouton « Valider » (ajouté par le moteur).
- L'élève peut réessayer jusqu'à trouver ; `.explication` n'apparaît qu'une fois la question réussie.
- Une question par bloc. Pour une série, une question par page, chacune révélant le bouton « Suite ».

## Cadenas

Une réponse à taper. Les variantes acceptées sont séparées par une barre verticale ; la comparaison
ignore majuscules, accents et espaces en trop.

```html
<div class="cadenas" data-reponse="15|quinze" data-indice="regarde la dernière barre du graphique"
     data-reussite="#vers-coffre" data-bravo="Bien vu !">
  Combien de renards restait-il en 2000 ?
</div>
```

`data-indice` s'affiche après deux essais ratés. `data-invite` change le texte gris du champ.

## Digicode

```html
<div class="digicode" data-pos="720,280" data-code="1809" data-reussite="#tresor"></div>
```

Le clavier, l'écran, l'erreur qui secoue et la validation sont fabriqués par le moteur ; le code se
tape aussi au clavier. Largeur fixe de 250, hauteur d'environ 320 : prévoir la place. Écrire le code
en clair dans la source : l'assembleur le remplace par une empreinte.

## Page protégée

```html
<section class="page" id="resultats" data-verrou="code">
```

La page s'ouvre sur un écran « Cette page est protégée par mot de passe » ; `data-verrou-titre`
change la phrase. Utile pour une correction que l'enseignante débloque elle-même.

## Cartes à retourner

```html
<div class="carte" data-pos="85,170,230,330" data-teinte="#2e9e5b" data-anim="bascule">
  <div class="recto"><span class="emoji">🌿</span>Le chloroplaste</div>
  <div class="verso"><b>Il réalise la photosynthèse</b>grâce à la chlorophylle.</div>
</div>
```

Donner largeur et hauteur. Trois à cinq cartes par page ; au verso, vingt mots au plus.

## Glisser-déposer

```html
<div class="glisser" data-pos="60,146,1080,460" data-melange data-reussite="#suite">
  <img src="images/volcan.png" data-pos="150,10,560,420" alt="Coupe d'un volcan">
  <div class="depot" data-pos="0,36,150,48" data-attend="cratere"></div>
  <div class="depot" data-pos="0,192,150,48" data-attend="cheminee"></div>
  <div class="reserve" data-pos="890,20,190">
    <span class="jeton" data-va="cratere">Cratère</span>
    <span class="jeton" data-va="cheminee" data-teinte="#6084ee">Cheminée</span>
  </div>
  <button class="bouton verifier" data-pos="890,250">Vérifier</button>
  <p class="retour" data-pos="890,310,190"></p>
</div>
```

- Un jeton va dans le dépôt dont `data-attend` contient son `data-va`. Un jeton sans `data-va` est
  un intrus, qui doit rester dans la réserve.
- `data-plusieurs` sur un dépôt : il accepte plusieurs jetons (classer dans deux colonnes) ;
  `data-attend="a b c"` liste alors tout ce qu'il accepte.
- La réserve, le bouton « Vérifier » et la ligne de retour sont créés automatiquement s'ils manquent,
  mais mieux vaut les placer soi-même. Fonctionne au doigt.
- Un dépôt doit être au moins aussi large que le plus long jeton.

## Minuteur

```html
<div class="minuteur" data-pos="970,44" data-duree="10:00" data-auto data-fin="#temps-ecoule"></div>
```

`data-auto` le lance à l'arrivée sur sa page (`data-auto="#mission"` : à l'arrivée sur cette page-là,
utile si le minuteur est dans le calque permanent). Sans `data-auto`, l'élève appuie sur lecture.
`data-fin` déclenche une suite à zéro.

## Points et zones

```html
<div data-pos="60,160,588,420">
  <img src="images/cellule.jpg" alt="Cellule végétale" style="width:100%;height:100%">
  <button class="point" data-pos="118,128" data-ouvrir="f-noyau">2</button>
  <button class="point" data-pos="330,205" data-info="Vacuole : une grande réserve d'eau.">3</button>
  <button class="zone" data-pos="400,40,120,90" data-ouvrir="f-chloro" aria-label="Chloroplaste"></button>
</div>
```

`point` : pastille qui pulse (34 de côté ; son `data-pos` est son coin haut-gauche). `zone` : surface
invisible, pour rendre cliquable une partie d'image.

## Contenu intégré

```html
<div class="integration" data-pos="640,140,500,300"
     data-src="https://www.youtube-nocookie.com/embed/IDENTIFIANT" data-titre="Vidéo">Vidéo</div>
```

Vidéo, carte, formulaire, document partagé, exercice en ligne : tout service qui fournit une adresse
d'intégration. Le contenu n'est chargé qu'à l'affichage de la page ou de la fenêtre, et déchargé en
la quittant (la vidéo s'arrête). Il exige une connexion, et ne s'affiche pas dans l'aperçu de
claude.ai. Pour une vidéo, préférer `youtube-nocookie.com/embed/…` ; pour un document Google Drive,
l'adresse en `/preview` d'un fichier partagé « à toute personne disposant du lien ».

## Icônes

`<i data-ico="nom"></i>` dans un bouton ou un texte : `fleche-droite`, `fleche-gauche`, `plus`,
`croix`, `coche`, `cadenas`, `oeil`, `maison`, `lecture`, `pause`, `info`, `loupe`, `main`,
`plein-ecran`, `etoile`, `horloge`, `retour`, `lien`, `effacer`, `recommencer`. Pour tout le reste,
un émoji.

## Mise en page souple

À l'intérieur d'un bloc placé : `colonnes` (côte à côte, largeurs égales), `rangee` (en ligne, avec
retour), `pile` (l'un sous l'autre), `milieu` (centré dans les deux sens). Une grille :
`style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px"`.

## Mode retouche

Chaque fichier assemblé embarque un éditeur à la souris, fermé par défaut : `Ctrl + Alt + E`, ou
`?retouche` au bout de l'adresse. Il n'y a rien à écrire dans la source pour l'obtenir.

- Clic : sélectionner ; glisser : déplacer (aimantation au centre, aux marges et aux blocs voisins,
  `Alt` pour la désactiver) ; flèches : pousser de 1, de 10 avec `Maj` ; poignées : redimensionner.
- Double-clic : corriger un texte d'un seul tenant (gras et italique conservés). `Échap` valide.
- Barre : pages et fenêtres, « ＋ Texte », « ＋ Image », « Changer l'image », « Fond », taille,
  alignement, couleur du texte, « Suivre » (fait ce que ferait le clic : ouvre la fenêtre, change de
  page, retourne la carte), « Cachés » (montre ce qu'une réussite révèle), texte de l'infobulle,
  couleur d'accent, « Supprimer », « Annuler », « Télécharger ».
- Le fichier téléchargé est la source d'origine avec les retouches, sans trace de l'éditeur : il se
  rouvre, se retouche encore, et se redonne à l'assembleur.

Pour que la retouche reste agréable, écrire une source simple : des blocs placés par `data-pos`
(ce sont eux qui se déplacent) et, dedans, des textes d'un seul tenant (ce sont eux qui se
corrigent). Un texte fabriqué par le moteur (clavier du digicode, bouton « Valider ») ne se retouche pas.

## Pièges connus

- **Texte trop long pour sa boîte** : c'est le défaut numéro un. Compter les mots avant de fixer une
  hauteur, ou ne pas en fixer.
- **Bouton « Suite » oublié** en navigation libre : l'élève reste bloqué.
- **Élément révélé jamais caché** : un bouton qu'une réussite doit faire apparaître porte la classe
  `cache` au départ.
- **`data-ouvrir` vers une page** (ou `data-aller` vers une fenêtre) : l'assembleur le refuse pour
  le premier ; pour le second, le moteur ouvre la fenêtre.
- **Trait de SVG rempli de noir** : ajouter `fill="none"`.
- **Apostrophes et guillemets** dans un attribut : écrire `data-info="l’eau"` avec l'apostrophe
  typographique, ou `&quot;` pour un guillemet droit.
- **Trop d'animations** : au-delà de six éléments animés, la page fatigue.
- **Coins occupés** : ne rien placer dans les 40 × 40 des coins haut-droit et bas-droit.
