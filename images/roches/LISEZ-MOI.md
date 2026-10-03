# Photographies des roches

Déposez vos photos dans ce dossier : **le laboratoire les trouve tout seul**,
il n'y a aucune ligne de code à écrire. Dès qu'une photographie existe pour une
roche, elle remplace le dessin à l'écran — le dessin n'est là que faute de
mieux.

## Comment nommer les fichiers

Deux séries par roche, l'une à l'œil nu, l'autre au microscope :

| Vue | Nom du fichier |
|---|---|
| à l'œil nu | `granite-1.jpg`, `granite-2.jpg`, `granite-3.jpg`… |
| au microscope | `granite-micro-1.jpg`, `granite-micro-2.jpg`… |

Les numéros commencent à **1** et se suivent **sans trou** : la recherche
s'arrête au premier numéro manquant. Si vous déposez `granite-1.jpg` et
`granite-3.jpg`, la troisième ne s'affichera pas.

Quand les deux séries existent, une bascule **« À l'œil nu / Au microscope »**
apparaît au-dessus de la photo. Avec une seule série, la bascule ne s'affiche
pas et la photo disponible est montrée directement.

La première photo de chaque série s'affiche en grand ; les suivantes deviennent
des vignettes sous elle. Un clic agrandit n'importe laquelle en plein écran.

## Le comparateur

Dès qu'une série **au microscope** compte deux photos ou plus, les deux
premières se superposent d'emblée sous un curseur que l'on glisse à la souris,
au doigt ou aux flèches du clavier — pas de bouton à trouver : la comparaison
est l'exercice. La photo **1** occupe la gauche, la **2** la droite. À l'œil nu,
un bouton « Comparer les deux » reste nécessaire.

Dans la série **au microscope**, les deux premières photos sont étiquetées
**LPNA** et **LPA** : le laboratoire part du principe que vous avez déposé
d'abord la vue sans analyseur, puis celle du **même champ** entre nicols
croisés. C'est une convention d'ordre, pas une reconnaissance automatique — si
vous déposez dans l'autre sens, les étiquettes seront fausses.

Le comparateur ne dit rien d'intéressant si les deux vues ne montrent pas la
même zone au même grossissement : c'est tout l'intérêt de voir le même cristal
passer du gris au multicolore.

Dans la série **à l'œil nu**, les étiquettes restent « 1 » et « 2 » : il n'y a
rien de particulier à y nommer.

## Les identifiants

Les vingt-trois roches de la paillasse d'identification :

`granite` · `gabbro` · `basalte` · `rhyolite` · `andesite` · `obsidienne` ·
`ponce` · `peridotite` · `diorite` · `calcaire` · `craie` · `gres` ·
`conglomerat` · `marne` · `sel` · `gneiss` · `micaschiste` · `marbre` ·
`serpentinite` · `metagabbro` · `schiste-bleu` · `eclogite` · `migmatite`

Cinq autres n'existent que pour le module de **cristallisation**, où ils
remplissent des cases du tableau à double entrée que la paillasse ne traite
pas :

`microgranite` · `dolerite` · `tachylite` · `andesite-porphyrique` ·
`basalte-porphyrique`

Pas d'accent, pas de majuscule, pas d'espace : `andesite` et non `andésite`.

## Comment les déposer

Sur GitHub, ouvrez ce dossier, bouton **Add file → Upload files**, puis
**glissez-déposez jusqu'à cent fichiers d'un coup**. Bouton *Commit changes*.
Deux minutes plus tard, elles sont en ligne.

## Trois pièges

- **Les iPhone enregistrent en HEIC**, qu'aucun navigateur n'affiche. Réglez
  *Appareil photo → Formats → Le plus compatible* avant la séance photo, ou
  convertissez en JPEG.
- **Le poids.** Visez moins de 500 Ko par photo. Une photo de 5 Mo fait ramer
  la page sur les tablettes du lycée.
- **Le cadrage.** Fond uni, une règle ou une pièce pour l'échelle, lumière
  rasante pour faire ressortir les grains. Pour le microscope, précisez dans un
  coin s'il s'agit de LPNA ou de LPA.

## Une chose normale, à ne pas prendre pour un bug

La console du navigateur signale deux requêtes en échec par roche ouverte :
celles des numéros qui n'existent pas. C'est le seul moyen, sans programme sur
le serveur, de savoir qu'un fichier n'est pas là. Rien n'est cassé.

## Mode retouche

Ouvrez le laboratoire avec `?retouche` dans l'adresse (ou `Ctrl + Alt + E`) :
les roches sans photographie l'indiquent alors à l'écran, avec le nom de
fichier attendu. Les élèves, eux, ne voient jamais ce rappel.

## Et les photographies de paysage ?

Elles ne sont pas ici. Les roches viennent de la lithothèque de l'ENS de Lyon ;
les paysages et les éruptions viennent de **Wikimedia Commons**, et vivent dans
`images/terrain/`. Les licences n'y sont pas toutes les mêmes — domaine public,
CC0, CC BY, CC BY-SA — alors on cite l'auteur **et** la licence, avec un lien
vers la fiche d'origine. La table `TERRAIN`, dans `outils/labo_geologie.html`,
porte tout cela : ne jamais déposer un fichier dans `images/terrain/` sans son
entrée.

Les vidéos, elles, ne sont pas hébergées : un laboratoire doit rester un seul
fichier utilisable hors ligne, et une vidéo d'éruption correcte pèse vingt à
quatre-vingts mégaoctets. Chaque dynamisme éruptif porte donc un lien vers une
vidéo libre sur Commons, qui se lit dans le navigateur sans publicité.
