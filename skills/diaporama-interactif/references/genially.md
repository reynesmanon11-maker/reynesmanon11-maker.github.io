# Refaire ou adapter une présentation Genially

À lire quand la personne dépose un export Genially ou dit « comme mon Genially ».

## Lire l'export

Depuis Genially, « Télécharger » puis « HTML » donne un `.zip` (option des comptes payants) qui
contient `genially.html`, un dossier `images/` et le lecteur. Tout le contenu de la présentation
est dans `genially.html`, sous forme de données codées. Le script en tire un plan :

```bash
python3 scripts/lire_genially.py export.zip -o plan.md --images images/
```

Le plan donne, page par page : le fond, chaque texte avec sa place `[x,y,largeur,hauteur]`, sa
police et sa taille, les images, ce qui est cliquable et où cela mène, les animations (déjà
traduites dans le vocabulaire du moteur), les contenus intégrés avec leur adresse, les quiz avec
leurs réponses. Les coordonnées sont celles de la même scène de 1200 × 675 : elles se reportent
telles quelles dans `data-pos`.

Si la personne n'a qu'un lien de partage (`view.genially.com/…`) ou un PDF, il n'y a pas de données
à lire : lui demander l'export HTML, ou travailler d'après des captures d'écran et le texte du PDF.

## Ce qu'on reprend, ce qu'on ne reprend pas

On reprend ce qui appartient à l'auteur : ses textes, la structure de son parcours, ses propres
photos et documents, ses liens. On ne copie pas ce qui appartient à l'éditeur : le code du lecteur,
le logo, et les illustrations de sa bibliothèque (personnages, pictogrammes, fonds de modèles) —
les remplacer par un dessin SVG, un émoji, un fond prêt du moteur ou une image de la personne.
`--images` écarte déjà les éléments de marque ; pour le reste, demander à la personne lesquelles
des images sont les siennes en cas de doute.

## Correspondances

| Dans Genially | Ici |
|---|---|
| page | `<section class="page">` |
| page affichée « en fenêtre » (le plan dit FENÊTRE) | `<section class="fenetre">` ; plusieurs pages-fenêtres qui ne contiennent qu'un document deviennent autant de fenêtres courtes |
| interactivité « aller à la page » | `data-aller="#id"`, `suivante`, `precedente` |
| interactivité « fenêtre » | `data-ouvrir` |
| interactivité « infobulle » | `data-info` |
| interactivité « lien » | `data-lien` |
| zone invisible | `<button class="zone">` |
| menu de navigation | `<nav class="barre">` dans le calque permanent |
| minuterie | `.minuteur` |
| question interactive | `.quiz` |
| cartes (séquence, retournement) | `.carte` |
| contenu enrichi (iframe : vidéo, carte, PDF Drive, formulaire, exercice en ligne) | `.integration` avec la même adresse en `data-src` |
| cadenas d'un service externe intégré | `.cadenas` du moteur (plus besoin de service externe) |
| page protégée par mot de passe | `data-verrou` |
| digicode fait de dizaines de pages (une par chiffre tapé, « * », « ** », « Error ») | **un seul** `.digicode` : ne pas recopier ces pages |
| éléments à glisser | `.glisser`, `.jeton`, `.depot` |
| effets d'entrée, continus, de survol | `data-anim`, `data-effet`, `data-survol` (le plan les traduit) |
| durée « vel1 » à « vel4 » | `data-vitesse="1"` à `"4"` |

Genially règle par défaut les entrées sur deux secondes (vitesse 3) ; c'est lent quand tout
s'anime. Sauf demande de fidélité stricte, laisser la vitesse par défaut du moteur (1 s).

## Méthode pour une refonte

1. Lire le plan en entier pour comprendre le parcours : quelles pages sont de vraies étapes,
   lesquelles sont des fenêtres, lesquelles sont de la mécanique (digicode page à page).
2. Dessiner le nouveau parcours : en général deux à trois fois moins de pages, puisque la mécanique
   devient des composants.
3. Reprendre textes et consignes **mot pour mot** : c'est le travail de l'enseignante. Signaler à
   part les coquilles repérées plutôt que de réécrire en silence.
4. Garder l'allure : mêmes polices (elles sont dans le plan, et presque toutes chez Google Fonts),
   mêmes couleurs, même place approximative des blocs.
5. Vérifier les contenus intégrés : un document Drive dont le partage a expiré s'affiche vide ; le
   dire à la personne plutôt que de le masquer.
6. Assembler, capturer, comparer page à page avec l'original si la personne en a fourni des images.
