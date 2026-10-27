# Mise en route

Une vingtaine de minutes la première fois, dont la moitié pour écrire ses premières étapes.
L'appli guide chaque écran ; cette notice sert à savoir où l'on va.

## 1. Récupérer le lien iCal de Pronote

Le Carnet ne demande ni identifiant ni mot de passe Pronote : il lit l'**export iCal** de
l'emploi du temps, que Pronote propose à chaque enseignant.

1. Dans Pronote, sur ordinateur, ouvrez votre **emploi du temps**.
2. Cliquez sur l'icône **iCal**, en haut à droite de la réglette des semaines, et copiez le lien.
   Sur l'application mobile Pronote, l'icône iCal est en bas à droite de l'écran.

Le lien ressemble à `https://xxxxxxxx.index-education.net/pronote/ical/…`. Il contient une clé :
ne le publiez pas. Si l'icône n'apparaît pas, l'établissement a désactivé l'export : il faut le
demander à l'administrateur de Pronote.

> **Et le QR code de Pronote ?** Celui qui sert à connecter l'application mobile Pronote ouvre
> tout le compte (notes, élèves, messagerie). Le Carnet n'en a pas besoin et le refuse si on le
> lui montre. Il ne lit que l'emploi du temps.

## 2. L'ajouter à Google Agenda

Google Agenda ira relire Pronote tout seul, plusieurs fois par jour.

- Le plus simple : dans le Carnet, à l'étape « Agenda Pronote », collez le lien puis touchez
  **Ouvrir Google Agenda** ; acceptez l'ajout.
- À la main, **sur ordinateur** (l'application mobile Google Agenda ne sait pas le faire) :
  Google Agenda → **Autres agendas** → **+** → **À partir de l'URL** → collez le lien → **Ajouter**.

Google met parfois quelques minutes à remplir le nouvel agenda.

## 3. Ouvrir et installer le Carnet

Ouvrez **<https://reynesmanon11-maker.github.io/carnet/>** — ou visez avec l'appareil photo du
téléphone le QR code qu'un collègue vous montre (Mes données → **Partager**). Puis installez-le
pour l'avoir comme une application :

| Appareil | Installer |
|---|---|
| Android (Chrome), ordinateur (Chrome, Edge) | le bouton **Installer** que le Carnet propose sur l'accueil (ou dans Mes données) |
| iPhone, iPad (Safari) | bouton Partager → **Sur l'écran d'accueil** (le Carnet montre le chemin) |

Pour retrouver sur le téléphone le Carnet ouvert sur l’ordinateur : Mes données → **Partager**, et
visez le QR code avec le téléphone. Une fois sur le Microsoft Store ou le Play Store, il
s'installera aussi depuis le store.

## 4. Se connecter avec Google

Choisissez **Avec mon compte Google**. Google demande trois autorisations ; le Carnet pourra :

- **lire** vos agendas, et **modifier vos rendez-vous perso** quand vous les ajoutez, déplacez ou
  supprimez vous-même dans le Carnet (jamais de lui-même, jamais l'agenda de Pronote) ;
- **créer ses propres agendas** (« Carnet · 6e »…) et y écrire vos cours ;
- garder ses données dans un **dossier caché de votre Google Drive**, propre à l'appli.

Tant que l'appli n'est pas vérifiée par Google, Google affiche l'adresse du site
(`reynesmanon11-maker.github.io`) au lieu du nom « Carnet de bord », puis prévient qu'il ne l'a
pas validée : cliquez sur **Paramètres avancés**, puis **Accéder à reynesmanon11-maker.github.io
(non sécurisé)**. Cochez ensuite **toutes** les autorisations proposées.
Pendant cette phase d'essai, seules les adresses inscrites peuvent se connecter : si Google
affiche « Accès bloqué », envoyez votre adresse Gmail à Manon Reynes.

Sur un téléphone Android, dans l'appli installée, la connexion passe par la page de Google puis
revient au Carnet. Si la connexion coince, l'écran propose « Essayer l'autre façon ».

## 5. Les écrans de la mise en route

1. **Agenda Pronote** — le Carnet le reconnaît tout seul ; vérifiez que c'est le bon.
2. **Classes** — trouvées dans Pronote, avec le nom d'usage deviné (5G3 → 503). Corrigez si
   besoin, indiquez l'effectif (pour compter les photocopies), décochez ce qui ne se suit pas
   (vie de classe, AP…).
3. **Google Agenda** — un agenda par niveau, chacun sa couleur (ou un seul, ou rien). Choisissez
   la couleur des évaluations et, si vous voulez, un rappel avant chaque cours.
   **Masquez ensuite l'agenda Pronote dans Google Agenda** (décochez-le dans la liste de gauche) :
   le Carnet le remplace, en couleurs, et continue de le lire. Sinon chaque cours apparaît deux fois.
4. **Vie perso** — les agendas dont les rendez-vous s'affichent à côté des cours.
5. **Progression** — **votre programmation** (le tableur de l'année, voir ci-dessous), partir de
   zéro, ou une sauvegarde du Carnet (la vôtre, l'export du « Carnet de bord SVT » de claude.ai,
   celle d'un collègue).

## 6. Importer sa programmation

Rubrique **Progressions** → **Importer une programmation**, puis le fichier tel qu'il est : Excel
(.xlsx), LibreOffice (.ods), CSV — depuis Google Sheets, *Fichier → Télécharger → Microsoft
Excel* ; depuis Numbers, *Exporter vers → Excel*. Un ancien .xls s'enregistre d'abord en .xlsx.
On peut aussi copier le tableau dans le tableur, ou dans Word, et le coller dans la case prévue.

Le plus pratique est **une feuille par niveau** (nommée « 6e », « 5e »…) et **une ligne par
séance ou par activité**. Le Carnet :

- trouve la ligne des titres de colonnes et devine le rôle de chacune (intitulé, chapitre,
  durée, type, évaluation, demi-groupe, jalons, matériel, photocopies, texte du cahier de textes,
  travail à faire, semaine visée) — tout se corrige dans **Colonnes reconnues** ;
- comprend les durées comme on les écrit : `1`, `1,5`, `½`, `2 séances`, `1h30` (une heure de cours
  = une séance), `15 min`, `2 semaines` (d'après le nombre de cours par semaine de la classe) ;
- reconnaît une ligne de chapitre (« Séquence 2 — … » seule sur sa ligne, ou une colonne Chapitre
  fusionnée), une évaluation (« Évaluation », « DS », « contrôle », un « x » dans la colonne), une
  semaine visée (`S45`, `semaine 46`, une date) ;
- montre les étapes qu'il en tire, feuille par feuille, avant d'écrire quoi que ce soit.

On choisit ensuite les classes du niveau, et, si elles ont déjà des étapes, **Ajouter à la suite**
ou **Remplacer la file** (une étape au même intitulé garde son suivi). Le fichier est lu dans le
navigateur : il ne part nulle part.

Pas encore de tableur ? **Télécharger le modèle (Excel)**, dans la même fenêtre : les colonnes que
le Carnet reconnaît, avec trois lignes d'exemple. Et pour donner sa progression à un collègue :
**Exporter (Excel)**, une feuille par classe, qui se réimporte telle quelle.

## 7. Écrire ou retoucher ses étapes

Rubrique **Progressions** → **Nouvelle étape** (ou le crayon d'une étape) : un intitulé, le
chapitre, une durée en séances, un format (classe entière, demi-groupe), des **jalons** (un modèle
« démarche d'investigation », « activité documentaire », « TP »… ou les vôtres), le matériel, les
pages à photocopier, le texte du cahier de textes, le travail à faire, la semaine visée.

Une étape appartient au niveau : écrite pour la 601, elle se reprend pour la 602 en un clic
(« Reprendre une étape des 6e »), ou toute la file d'un coup (« Même file pour… »). Une classe
reprise en cours d'année : **Point de départ**.

Une **évaluation** n'est jamais coupée sur deux cours : si elle ne tient pas dans la fin d'une
heure, elle commence au cours suivant. Même chose pour une étape cochée « Ne pas couper ».

## 8. Après chaque cours

Touchez **Où en est-on ?** sur le cours (dans le Carnet, ou depuis l'événement dans Google
Agenda), puis le **dernier jalon terminé** — ou **Comme prévu**. C'est tout : la suite glisse sur
les prochains cours, dans le Carnet comme dans Google Agenda.

Un cours oublié ? Aucune importance : le dernier point d'arrêt validé fait foi. La tuile **Cours à
valider** de la page d'accueil liste ceux qui attendent.

## 9. Le cahier de textes

Rubrique **Cahier de textes** : pour chaque cours, le **contenu de la séance** (les étapes faites,
avec leur texte) et le **travail à faire** pour le cours suivant. Après le cours :

1. **Où en est-on ?** — le texte suit ce qui a vraiment été fait : une séance qui a débordé ou
   qui s'est arrêtée plus tôt change le contenu de ce cours et la suite des suivants ;
2. **Copier pour Pronote**, puis coller dans le cahier de textes de Pronote (**Ouvrir Pronote**
   apparaît quand son adresse est réglée dans Mes données). Copier marque le cours « saisi » ;
   « Annuler » le remet dans la liste.

Le sens est Carnet → Pronote : Pronote n'exporte pas son cahier de textes (le lien iCal ne contient
que l'emploi du temps), et le lire demanderait le mot de passe Pronote, que le Carnet ne demande
jamais. Les textes s'écrivent une fois, dans l'étape, pour toutes les classes du niveau.

## 10. Où tomberont les évaluations

Rubrique **Progressions** → **Calendrier et évaluations** : un tableau par niveau, une ligne par
étape, une colonne par classe, avec le jour où chaque étape tombe d'après l'emploi du temps réel
(cours annulés et vacances compris), l'écart à la semaine visée de la programmation (« +1 sem. »),
et en tête les prochaines évaluations, annoncées ou à annoncer. Les dates bougent dès qu'un cours
saute ou qu'une validation change le rythme.

## 11. Faire connaître le Carnet

Mes données → **Partager** (ou l'icône de partage en haut, sur ordinateur) : un QR code à viser
avec un téléphone, le lien à copier, et un message tout prêt pour un collègue, qui dit en trois
lignes comment commencer.

## 12. L'emploi du temps, comme dans Pronote

Le Carnet est rangé comme l'espace professeur de Pronote : **Page d'accueil**, **Emploi du
temps**, **Cahier de textes**, **Progressions**, **Mes travaux**, **Mes données**. Sur ordinateur,
la page d'accueil s'ouvre sur la tuile **Emploi du temps** : la grille de la semaine, calée sur
les heures de sonnerie de l'établissement, la récréation grisée, le mercredi après-midi hachuré.
Touchez un cours pour dire où la classe en est. La semaine A ou B se règle dans **Mes données**.

La rubrique **Emploi du temps** propose aussi les **Cartes** : une colonne par jour, la carte de
chaque cours — horaires, demi-groupes, salle, ce qui est prévu et pour combien de temps, les
annonces à faire, le matériel **à prévoir** en cases à cocher, le bouton **Texte Pronote**.
Pendant les vacances ou le week-end, c'est la semaine des prochains cours qui s'affiche. Sur
téléphone, l'accueil montre d'abord la journée.

## 13. Ranger sa page d'accueil

Comme dans Pronote, chaque tuile a **Tout voir** et sa **croix** pour la retirer. La roue
dentée à côté de « Page d'accueil » ouvre la mise en page : glissez les tuiles par leur poignée
(ou ↑ ↓), réglez leur largeur (S, M, L), remettez celles qu'on avait retirées, et réglez chacune
avec ⚙ (« Cours à préparer » en liste, en date ou en compteur ; « Mes travaux » en colonne, en
ligne ou par échéance…). La disposition est propre à chaque appareil : on ne range pas son
téléphone comme son ordinateur.

## Questions fréquentes

**Reprendre une progression par un lien.** Un lien de la forme `…/carnet/#importer=…` ouvre le
Carnet sur un résumé de ce qu'il contient (classes, étapes) ; rien n'est importé avant d'avoir
touché **Importer**. Les étapes de ces classes remplacent celles d'ici ; les réglages, le nom et
l'effectif des classes restent. Le contenu du lien ne part vers aucun serveur.

**Un cours annulé dans Pronote apparaît encore.** Google relit les agendas abonnés toutes les
8 à 24 heures environ, sans qu'on puisse le forcer. Le Carnet montre à quelle heure Google a relu
Pronote pour la dernière fois (Mes données).

**Le téléphone et l'ordinateur ne montrent pas la même chose.** Le Carnet se synchronise à
l'ouverture, toutes les 15 minutes quand il est ouvert, et quelques secondes après chaque
modification. Touchez la pastille en haut pour synchroniser tout de suite.

**Pas de réseau en classe.** Validez quand même : c'est gardé sur l'appareil et envoyé au
retour du réseau.

**« Se reconnecter à Google ».** Le navigateur ne garde la connexion qu'une heure : un toucher
sur la pastille suffit.

**Les deux demi-groupes n'en sont pas au même point.** Le Carnet suit la classe, pas chaque
moitié : notez l'écart dans la remarque du point d'arrêt (« P1 : manque la question 4 »).
