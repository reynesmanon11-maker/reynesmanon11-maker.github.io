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

## Les seize identifiants

`granite` · `gabbro` · `basalte` · `rhyolite` · `andesite` · `obsidienne` ·
`ponce` · `calcaire` · `craie` · `gres` · `conglomerat` · `marne` · `sel` ·
`gneiss` · `micaschiste` · `marbre`

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
