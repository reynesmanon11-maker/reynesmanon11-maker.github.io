---
name: diaporama-interactif
description: Crée des présentations interactives « façon Genially » en un seul fichier HTML — diaporama cliquable, image interactive, parcours, quiz, escape game pédagogique (énigmes, cadenas, digicode, minuteur) — avec fenêtres « + info », infobulles, animations d'entrée, cartes à retourner et glisser-déposer. Utilise ce skill dès que la personne parle de Genially, de présentation ou de diapo interactive, d'escape game ou de serious game numérique, d'image cliquable, de « page avec des boutons », de support de cours animé pour ses élèves, ou qu'elle dépose un export Genially (.zip contenant genially.html) à refaire ou à adapter — même si elle ne prononce pas le mot « diaporama ». Ne pas l'utiliser pour un PowerPoint (.pptx) ni pour un document à imprimer.
---

# Diaporama interactif

Ce skill sert à obtenir, en le demandant avec des phrases de tous les jours, ce qu'une enseignante
met des heures à monter à la main dans un outil comme Genially : des pages de 1200 × 675 où tout
se clique, s'ouvre et s'anime. Le résultat est **un seul fichier HTML**, qui s'ouvre dans n'importe
quel navigateur, se projette en classe et se dépose sur l'ENT.

Le travail se fait en trois temps : écrire une **source** (du HTML simple, une `<section>` par
page), l'**assembler** avec le moteur fourni, **regarder** le résultat et le corriger.

## Ce que contient le skill

| Fichier | Rôle |
|---|---|
| `assets/moteur.css`, `assets/moteur.js` | le moteur : mise à l'échelle, navigation, animations, composants. Ne pas le réécrire dans la source : l'assembleur l'insère. |
| `assets/retouche.js` | le mode retouche à la souris, embarqué dans chaque fichier produit |
| `assets/gabarit.html` | squelette d'une source, à copier pour démarrer |
| `scripts/assembler.py` | source → fichier unique ; incorpore les images, masque les réponses, vérifie les liens |
| `scripts/capturer.js` | prend une image de chaque page et signale les défauts de mise en page (s'il y a un navigateur) |
| `scripts/lire_genially.py` | tire un plan lisible d'un export Genially, pour le refaire |
| `references/briques.md` | **tout le vocabulaire** : attributs, composants, exemples. À lire avant d'écrire la première source. |
| `references/styles.md` | les quatre thèmes, les fonds, les décors, comment créer une charte sur mesure |
| `references/genially.md` | correspondance Genially → ce moteur ; à lire quand on refait une présentation existante |
| `exemples/vitrine.html` | une source complète qui emploie chaque brique : le meilleur modèle à imiter |

## Marche à suivre

### 1. Comprendre la demande, sans interroger longuement

Il faut savoir : le **sujet**, le **niveau** des élèves, la **forme** (voir le tableau plus bas) et
ce que la personne **fournit** (texte du cours, documents, photos, export Genially).

Les enseignants viennent ici pour gagner du temps. Si la demande suffit pour produire quelque
chose de juste, produire une première version et la montrer : on corrige plus vite en voyant.
Ne poser de question (une ou deux, pas plus) que si la réponse change vraiment le résultat —
typiquement le niveau de classe, ou les notions exactes à faire trouver dans un escape game.
Dire en une phrase les choix faits à la place de la personne (« j'ai supposé une classe de 5e »).

### 2. Choisir la forme

| La personne veut… | Construire |
|---|---|
| un support de cours projeté | pages avec barre de menu, une idée par page, détails en fenêtres « + info » |
| une image ou un schéma à explorer | une page, l'image, des points interactifs (`.point`) ouvrant infobulles et fenêtres |
| un parcours en autonomie | sommaire en tuiles, `data-nav="libre"`, quiz dont la réussite révèle la suite |
| un escape game | thème `aventure`, une page de mission, des documents en fenêtres, une énigme par étape (cadenas), un digicode final dont le code vient des réponses, un minuteur |
| une révision | cartes à retourner, quiz, glisser-déposer |
| refaire un Genially existant | lire `references/genially.md`, lancer `scripts/lire_genially.py` |

### 3. Écrire la source

Lire `references/briques.md` (et `references/styles.md` pour choisir le thème), puis partir de
`assets/gabarit.html`. La source s'écrit dans le dossier de travail, avec les images de la personne
dans un sous-dossier `images/`.

L'essentiel du vocabulaire tient en quelques lignes :

```html
<main class="diapo" data-theme="atelier" data-nav="libre">
  <section class="page" id="accueil" data-decor="bas-gauche">
    <h1 data-pos="80,180,620" data-anim="fondu-bas">Titre</h1>
    <button class="bouton" data-pos="80,450" data-aller="suivante">Commencer</button>
    <button class="bouton petit" data-pos="300,450" data-ouvrir="f-info">+ info</button>
  </section>
  <section class="fenetre" id="f-info"><p>Le détail.</p></section>
</main>
```

- `data-pos="x,y,largeur,hauteur"` place un bloc sur la scène de 1200 × 675 (hauteur facultative).
- `data-anim`, `data-delai`, `data-vitesse` règlent l'entrée ; `data-effet` et `data-survol` le mouvement.
- `data-aller`, `data-ouvrir`, `data-info`, `data-lien`, `data-montrer` rendent n'importe quel élément cliquable.
- Les composants (`.quiz`, `.digicode`, `.cadenas`, `.carte`, `.minuteur`, `.glisser`, `.integration`) s'écrivent en quelques lignes : le moteur fabrique le reste.

### 4. Assembler

```bash
python3 scripts/assembler.py ma-source.html -o ma-presentation.html
```

L'assembleur refuse de produire le fichier s'il trouve un bouton qui ne mène nulle part, deux
identifiants identiques ou une image absente : corriger la source, relancer. Ne jamais remettre le
fichier assemblé à la personne sans que cette étape soit passée sans erreur.

### 5. Regarder le résultat avant de le livrer

Une mise en page écrite à l'aveugle a presque toujours un texte qui déborde ou deux blocs qui se
chevauchent. Si Node et Playwright sont disponibles :

```bash
node scripts/capturer.js ma-presentation.html captures/
```

Le script écrit une image par page et par fenêtre et liste les défauts qu'il mesure (bloc hors de
la scène, contenu trop grand pour son cadre, chevauchements). **Ouvrir les images et les regarder** :
l'équilibre d'une page, un titre trop petit, un vide disgracieux ne se mesurent pas. Corriger la
source, réassembler, recapturer, jusqu'à ce que chaque page soit propre.

Sans navigateur, relire chaque `data-pos` en calculant la place prise par le texte (compter
environ 0,55 × taille de police par caractère, et 1,36 × taille par ligne), puis prévenir la
personne que l'aperçu n'a pas pu être contrôlé et qu'elle peut ajouter `?controle` au bout de
l'adresse du fichier pour voir les défauts entourés en rouge.

### 6. Livrer et expliquer en deux phrases

Remettre le fichier HTML assemblé (et garder la source pour les retouches). Dire comment s'en
servir : l'ouvrir dans un navigateur, bouton plein écran en bas à droite, la main en haut à droite
montre ce qui est cliquable ; pour les élèves, le déposer sur l'ENT ou le partager comme un fichier.

**Toujours signaler le mode retouche**, c'est ce qui rend la personne autonome : `Ctrl + Alt + E`
(ou `?retouche` au bout de l'adresse) ouvre une barre d'outils. Un clic sélectionne et déplace un
bloc, les poignées le redimensionnent, un double-clic corrige un texte ; on change taille, couleur,
image, fond de page, infobulle, on ajoute un texte ou une image, on annule avec `Ctrl + Z`. Le
bouton « Télécharger » rend le fichier modifié : c'est lui, ensuite, la bonne version.
Sur claude.ai, on peut aussi le publier en artefact pour obtenir un lien — en prévenant que les
contenus intégrés (vidéos, cartes) et les images appelées par une adresse web ne s'affichent pas
dans l'aperçu de claude.ai, seulement dans le fichier ouvert normalement.

### 7. Retoucher à la demande

« Mets le titre en plus gros », « ajoute une question », « change la couleur » : modifier la
**source**, réassembler, recontrôler la page touchée. Ne pas repartir de zéro et ne pas toucher à
ce qui n'a pas été demandé : la personne a déjà validé le reste.

Si la personne revient avec un fichier qu'elle a retouché à la souris, **ce fichier devient la
source** : repartir de l'ancienne effacerait son travail. L'assembleur l'accepte tel quel (il en
retire le moteur et le remet à neuf) ; ses images y sont déjà incorporées et ses réponses déjà
masquées. Modifier ce fichier-là, puis `python3 scripts/assembler.py fichier-retouche.html -o …`.

Pour un escape game distribué aux élèves, proposer une seconde version assemblée avec
`--sans-retouche` : le mode retouche permet de voir les éléments cachés, donc de sauter des étapes.

## Ce qui fait une bonne présentation interactive

Ces principes viennent de l'observation de présentations faites à la main par des enseignantes ;
ils expliquent pourquoi le résultat « fait pro » ou non.

- **Une idée par page, peu de texte visible.** Une cinquantaine de mots au plus ; le reste se
  découvre en cliquant. C'est tout l'intérêt du format : la révélation progressive garde l'attention.
- **Le clic doit se deviner.** Réserver la couleur d'accent à ce qui est cliquable, donner aux
  boutons un effet au survol, et garder les mêmes formes pour les mêmes gestes d'un bout à l'autre
  (le même « + info », la même flèche).
- **Toujours une sortie.** Avec `data-nav="libre"` il n'y a pas de flèches : chaque page doit porter
  un bouton pour avancer ou revenir, sinon l'élève est coincé.
- **Des entrées en cascade, jamais un feu d'artifice.** Le titre d'abord, le contenu ensuite, les
  boutons en dernier (délais de 0, 0,2, 0,4 s…). Cinq ou six éléments animés par page suffisent.
  Un effet continu (`battement`) seulement sur le bouton qu'on veut voir cliqué.
- **Lisible du fond de la classe.** Texte courant à 20–24, jamais moins de 16 ; titres à 36 et plus ;
  fort contraste ; voile sombre (`data-voile`) sous un texte posé sur une photographie.
- **Des marges.** 60 de chaque côté ; sous la barre de menu, commencer à y = 90 ; laisser libres les
  coins haut-droit et bas-droit (40 × 40), où se trouvent les boutons du lecteur.
- **Un retour qui explique.** Dans un quiz, la bonne réponse s'accompagne d'une phrase
  d'explication ; dans un escape game, chaque énigme repose sur un document à lire, pas sur le hasard.
- **Exact avant d'être joli.** Les contenus sont destinés à des élèves : vérifier les notions, les
  valeurs, le vocabulaire du programme. Ne pas inventer de données chiffrées sans le dire ; si une
  valeur est simulée ou simplifiée, le signaler à l'enseignante.

## Images et illustrations

Ce moteur n'a pas de banque d'images. Par ordre de préférence :

1. **Les images de la personne** (photos, schémas, captures) : les ranger dans `images/`, les
   appeler par leur chemin (`<img src="images/coupe.jpg">`, `data-fond="images/foret.jpg"`) ;
   l'assembleur les incorpore au fichier.
2. **Un dessin en SVG** écrit directement dans la source : parfait pour un schéma scientifique
   simple (cellule, volcan, appareil digestif stylisé), net à toutes les tailles et cliquable.
   Mettre `fill="none"` sur les traits, sinon ils se remplissent de noir.
3. **Des émojis en grand** pour les icônes et les personnages : aucun poids, toujours lisibles.
4. **Les fonds prêts à l'emploi** (`data-fond="foret"`, `ocean`, `nuit`, `volcan`, `parchemin`,
   `labo`, `metal`, `prairie`) quand il n'y a pas de photographie.

Ne pas reprendre les illustrations de la bibliothèque d'un éditeur (Genially, Canva…) ni son logo :
elles ne sont pas libres. Pour une photographie trouvée ailleurs, citer l'auteur et la licence dans
un petit texte `class="credit"`.

## Limites à dire honnêtement

- Les réponses (codes, mots de passe) sont masquées dans le fichier, pas chiffrées : un élève
  curieux et patient peut les retrouver. Suffisant pour un jeu de classe, pas pour une évaluation.
- Rien n'est enregistré : pas de suivi des réponses des élèves, pas de tableau de bord. Si
  l'enseignante en a besoin, lui proposer d'intégrer un formulaire (voir `.integration`).
- Le mode retouche déplace, redimensionne, corrige et remplace ce qui existe, et ajoute textes et
  images. Il ne crée ni page, ni fenêtre, ni interaction (quiz, bouton, lien) : cela se demande.
