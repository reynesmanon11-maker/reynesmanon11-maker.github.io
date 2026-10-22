# Choix et limites

Ce que cette première version a tranché, pourquoi, et ce qui reste ouvert.

## Lire Pronote : le lien iCal, pas le compte

Il y avait deux façons d'obtenir l'emploi du temps.

**Se connecter au compte Pronote** — identifiants ou QR code de connexion de l'application
mobile — puis parler à Pronote avec une bibliothèque non officielle. C'est ce que fait
SmartPronote, le projet du fichier zip. Écarté, pour quatre raisons :

- ce QR code ouvre **tout le compte** : notes, élèves, absences, messagerie. Un outil qui n'a
  besoin que de l'emploi du temps n'a pas à tenir ces clés ;
- SmartPronote garde le mot de passe Pronote **en clair sur son serveur**, avec les jetons de
  connexion : un serveur qu'il faudrait héberger, protéger, et déclarer (RGPD) ;
- il est pensé pour les **élèves** (leur emploi du temps, leurs devoirs), pas pour l'enseignant ;
- les bibliothèques non officielles cassent à chaque changement du protocole de Pronote ; celle
  du projet date de 2023.

L'idée qu'on en garde : une synchronisation qui tourne seule, sans ouvrir l'appli (voir plus bas).

**L'export iCal**, officiel : un lien fourni par Pronote, en lecture seule, qui ne contient que
l'emploi du temps. C'est le choix retenu. Ce qu'il ne donne pas : le cahier de textes, les
devoirs, les listes d'élèves. Et Pronote n'y décrit le cours qu'en texte libre (« <5G3> »,
« Demi-groupe : P2 », « Accompagnant : … », « Cours annulé ») : l'appli en tire classe,
demi-groupe, AESH, inclusion et annulation par des règles écrites d'après un emploi du temps réel
(anonymisé dans `tests/fixtures.mjs`). **Un établissement qui exporte autrement peut dérouter ces
règles** : l'écran des classes permet de corriger, et chaque nouvel export reçu d'un ou d'une
collègue est une occasion d'ajouter un test.

## Google Agenda sert de relais à Pronote

Un navigateur n'a pas le droit de lire directement le lien iCal (le serveur de Pronote ne
l'autorise pas). Google Agenda, si : on y abonne le lien une fois, et Google va relire Pronote
tout seul. L'appli lit ensuite l'agenda de Pronote dans Google.

- **Pour** : aucun serveur ; Google relit Pronote même quand l'appli est fermée ; beaucoup de
  collègues découvrent au passage qu'on peut voir Pronote dans son agenda.
- **Contre** : Google relit les agendas abonnés toutes les **8 à 24 heures**, sans qu'on puisse
  le forcer. Un cours annulé à 7 h peut n'apparaître qu'en fin de journée. Pour un emploi du temps
  plus frais : le relais facultatif (`relais/`), ou l'import d'un fichier `.ics`.

L'agenda abonné est en lecture seule : on ne peut ni le recolorer cours par cours, ni y écrire.
D'où les agendas propres à l'appli (« Carnet · 6e »…), qui le remplacent à l'écran.

## Pas de serveur

Les données vivent sur l'appareil et, avec Google, dans un **dossier caché du Drive** de
l'enseignant (`appDataFolder`, invisible des autres applis). Rien à héberger que des fichiers
statiques, aucun compte à créer, aucune donnée chez l'éditrice, coût nul.

Le prix à payer :

- **pas de synchronisation quand l'appli est fermée** : elle se fait à l'ouverture, toutes les
  15 minutes quand l'appli est ouverte, et quelques secondes après chaque modification ;
- **pas de notification poussée** : ce sont les rappels de Google Agenda qui en tiennent lieu
  (« Rappel avant chaque cours », dans les réglages) ;
- **la connexion Google ne dure qu'une heure** : le jeton reste en mémoire, jamais enregistré.
  Au-delà, la pastille propose de se reconnecter d'un toucher. Garder la connexion plus longtemps
  supposerait de stocker un jeton de longue durée, donc un serveur à protéger.

## Des autorisations Google aussi étroites que possible

| Autorisation | Pour | Ce qu'elle ne permet pas |
|---|---|---|
| `calendar.calendarlist.readonly` | trouver l'agenda de Pronote et les agendas perso | ni créer, ni modifier, ni supprimer un agenda |
| `calendar.events.readonly` | lire les cours et les rendez-vous perso | modifier ou supprimer un rendez-vous |
| `calendar.app.created` | créer « Carnet · 6e »… et y écrire les cours | toucher à un agenda que l'appli n'a pas créé |
| `drive.appdata` | la copie des données, pour les autres appareils | voir le moindre fichier du Drive |
| `openid`, `email` | afficher le compte connecté | — |

Conséquence voulue : même une erreur de programmation ne pourrait pas effacer un rendez-vous
personnel ni l'agenda de Pronote. Les tests le vérifient avec un faux Google qui refuse toute
écriture ailleurs.

## Le point d'arrêt plutôt que le planning

Le problème de départ : cinq classes, des demi-groupes, des cours annulés, et la question « la
602 s'était arrêtée où ? ». Planifier jour par jour casse au premier cours annulé.
L'appli retient autre chose :

- une **file d'étapes** par classe (partagée par niveau : une activité écrite pour la 601 sert
  à la 602), chaque étape avec une durée en séances et des **jalons** — les endroits où l'on peut
  s'arrêter (problème, hypothèses, protocole, résultats, bilan…) ;
- après le cours, **un point d'arrêt** : le dernier jalon franchi (ou ¼, ½, ¾ d'une étape sans
  jalons). Un toucher, ou « Comme prévu » ;
- le **dernier point validé fait foi**. Les cours passés sans validation sont supposés faits
  comme prévu, et signalés « à valider » ; une validation oubliée ne fausse donc rien ;
- les **cours à venir se remplissent** à partir de là, sur les créneaux que donne Pronote. Un
  cours annulé ne décale rien à la main : la suite glisse sur le suivant ;
- une **évaluation n'est jamais coupée** sur deux cours (ni une étape cochée « Ne pas couper ») ;
- les classes d'un même niveau se comparent : « la 601 a une séance et demie de retard ».

**Demi-groupes** : P1 et P2 voient la même chose en décalé ; un créneau en demi-groupe compte
donc pour la durée d'une des deux moitiés, et la classe a **une seule file**. Si les deux moitiés
divergent (P1 a fini, P2 non), on le note dans la remarque du point d'arrêt. Deux files par
classe compliqueraient tout le reste pour un cas qui se rattrape au cours suivant ; c'est une
piste si l'usage le réclame.

## Synchronisation entre appareils

Chaque classe, étape, validation, tâche est un document daté. Deux appareils qui ont modifié
hors connexion se fusionnent **document par document** : le plus récent l'emporte, une
suppression est gardée trois mois pour ne pas ressusciter. Une même étape modifiée sur deux
appareils sans réseau : c'est la dernière modification qui reste. La disposition du tableau de
bord, elle, est propre à chaque appareil.

L'écriture dans Google Agenda est **calculée par différence** : l'appli compare ce qui devrait
y être à ce qui y est, et n'envoie que l'écart. Une resynchronisation sans changement n'écrit
rien ; une nouvelle étape en 501 ne réécrit que les cours de la 501.

## Où vit l'appli, et comment on y arrive

Le Carnet est un dossier du site, `carnet/`, publié avec lui : une adresse stable à donner, rien
à héberger ailleurs, et aucun lien depuis les pages des élèves. Une branche à part n'aurait pas
suffi : GitHub Pages ne publie qu'une branche. Si le Carnet devait un jour avoir son propre site,
la connexion Google ferait suivre les données (elles sont dans le Drive de chacun) ; seule
l'installation serait à refaire.

Pour y arriver sans rien taper : un **QR code** à viser avec l'appareil photo d'un téléphone,
dessiné par l'appli elle-même (pas de bibliothèque, pas de service en ligne : il marche hors
connexion et ne dit à personne qu'on partage) ; un **message tout prêt** pour un collègue ; et le
bouton **Installer** dès que le navigateur le permet. Sur iPhone, Safari ne laisse pas une page
proposer l'installation : l'appli montre le chemin (Partager → Sur l'écran d'accueil).

**La connexion Google** passe par une fenêtre par-dessus le Carnet, sauf dans l'appli installée
sur Android, où une telle fenêtre revient mal : la page part chez Google puis revient (le jeton
arrive dans l'adresse, l'appli le reprend aussitôt et l'efface de l'adresse). Un retour qui ne
porte pas le numéro tiré au départ est refusé. Si l'une des deux façons coince, l'écran de
connexion propose l'autre.

## Agendas Google : ne jamais en créer deux fois

Google freine les créations d'agendas trop rapprochées. La première version créait l'agenda des
3e, se faisait refuser le suivant, et s'arrêtait avant d'avoir noté le premier : à chaque
synchronisation, un nouveau « Carnet · 3e », vide. Désormais chaque agenda est noté dès qu'il
existe, un agenda du Carnet déjà présent (même nom, même description) est repris au lieu d'être
recréé, les doublons vides sont retirés, les créations sont espacées, et si Google demande
d'attendre, les cours des agendas déjà là sont écrits tout de suite et la suite est retentée
deux minutes plus tard. La dernière erreur reste visible dans les réglages.

## Limites de cette première version

- **Jamais essayée avec le vrai Google.** Elle l'a été contre un faux Google qui reproduit les
  appels de l'API, fenêtre et redirection comprises ; le premier essai réel révélera forcément
  des ajustements. Point à surveiller en priorité : la connexion dans l'appli installée sur
  l'écran d'accueil d'un iPhone (Safari y gère mal fenêtres et redirections ; si elle coince,
  ouvrir le Carnet dans Safari même).
- Les **formats d'export Pronote** d'autres établissements (voir plus haut).
- Le **délai de Google** sur Pronote (8 à 24 h).
- **Reconnexion à Google** toutes les heures d'utilisation.
- **P1 et P2** sur une seule file.
- Sans Google (fichier `.ics` ou relais), les **événements répétés** ne sont pas dépliés ; ceux
  qui passent par Google le sont. L'appli le signale quand elle en rencontre.
- L'appli **n'écrit pas dans Pronote** (aucune interface ne le permet) : le texte du cahier de
  textes est prêt à copier.
- **Accessibilité** : tout se fait aussi au clavier (↑ ↓ en plus du glisser), les boutons
  sans texte sont étiquetés, mais rien n'a été audité.
- Le nom « Carnet de bord » est provisoire : beaucoup d'applis le portent déjà dans les stores.

## Pistes pour la suite

- **Synchronisation sans ouvrir l'appli**, toujours sans serveur : un script Google Apps Script
  installé dans le compte de l'enseignant, déclenché toutes les heures, qui fait le même calcul
  (le moteur ne dépend pas du navigateur) et met à jour les agendas « Carnet ».
- **Partager une progression** avec un ou une collègue : l'export existe, un lien serait plus
  simple.
- **Deux files par classe** pour les demi-groupes, si le besoin se confirme.
- **Pas propre aux SVT** : rien dans l'appli ne l'est (les modèles de jalons se réécrivent).
  Des collègues d'autres disciplines sont de bons testeurs.
- **iPhone** dans l'App Store plus tard, par un emballage natif, si la demande existe.
