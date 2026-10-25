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
| `calendar.events` | lire les cours et les rendez-vous perso ; ajouter, modifier, supprimer un rendez-vous perso quand on le fait dans le Carnet | toucher à l'agenda de Pronote (abonné, en lecture seule chez Google) |
| `calendar.app.created` | créer « Carnet · 6e »… et y écrire les cours | toucher à un agenda que l'appli n'a pas créé |
| `drive.appdata` | la copie des données, pour les autres appareils | voir le moindre fichier du Drive |
| `openid`, `email` | afficher le compte connecté | — |

Jusqu'à la version 0.4, le Carnet ne pouvait que lire les rendez-vous perso
(`calendar.events.readonly`). À la demande de l'utilisatrice, qui veut tout faire depuis le
Carnet, il les modifie désormais dans les deux sens : un rendez-vous ajouté, déplacé ou supprimé
dans le Carnet l'est aussitôt dans Google Agenda, et ce qui change dans Google revient dans le
Carnet à la synchronisation suivante. L'autorisation est plus large, donc les garde-fous sont
dans le code : une écriture dans un agenda perso ne part **que d'un geste de l'utilisatrice**
(enregistrer, supprimer avec confirmation), jamais de la synchronisation ; seulement dans les
agendas perso choisis, dont elle est propriétaire ou rédactrice ; jamais dans un rendez-vous dont
elle n'est qu'invitée ; seuls les champs modifiés repartent (invités, rappels et visio restent).
Les tests vérifient que la synchronisation n'écrit jamais dans l'agenda perso ni dans Pronote.
Un compte connecté avant la version 0.5 se voit redemander l'accord à la première modification.

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

Mieux encore : un agenda du Carnet qui ne sert à rien — le doublon vide d'un agenda gardé, ou
celui d'un niveau qu'on n'a plus — est **renommé** pour devenir celui qui manque. Google limite
les créations d'agendas, pas les renommages : trois « Carnet · 3e » vides laissés par la première
version deviennent les agendas des 5e, des 6e et de l'établissement, sans attendre. Ceux qui
restent inutiles se suppriment d'un bouton dans Mes données.

## Ranger le Carnet comme Pronote

Les enseignants passent leurs journées dans Pronote : changer leurs habitudes est le plus sûr
moyen qu'ils n'adoptent pas un outil. Le Carnet reprend donc l'organisation de l'espace
professeur — les rubriques (Page d'accueil, Emploi du temps, Cahier de textes, Progressions, Mes
travaux, Mes données) dans une barre de menus sombre, la page d'accueil en tuiles avec « Tout
voir » et une croix, et leurs noms quand la tuile existe dans Pronote (« Pense-bête », « Agenda »,
« Cahiers de textes non saisis »). Il en reprend la **structure et le vocabulaire**, pas la marque
ni le logo : le Carnet n'est pas Pronote et ne se fait pas passer pour lui.

Le pendant de « Appels non faits » est « Cours à valider », celui de « Cahiers de textes non
saisis » se coche à la main : le Carnet ne peut pas lire Pronote au-delà de l'emploi du temps.

## Importer une programmation : lire le tableur tel qu'il est

Chacun a sa programmation dans un tableur, et personne n'a envie de la recopier. Plutôt
qu'imposer un modèle, le Carnet lit le fichier tel qu'il est et **devine** : la ligne des titres
(celle dont les cellules ressemblent le plus à des titres connus), le rôle de chaque colonne (par
son titre, puis par ses valeurs : une colonne « Séance » remplie de 1, 2, 3… est une
numérotation, pas une durée), les lignes de chapitre, les évaluations, les durées et les semaines.
Tout ce qui est deviné se montre et se corrige avant d'écrire quoi que ce soit.

- **Sans bibliothèque** : un .xlsx et un .ods sont des dossiers zippés de XML. Le navigateur sait
  décompresser (`DecompressionStream`), le reste est un petit lecteur de zip et de XML maison,
  testé sur de vrais fichiers d'Excel et de LibreOffice. Pas de CDN qui casse, rien qui part sur
  un serveur : le fichier ne quitte pas l'appareil.
- **Pas l'ancien .xls** (format binaire de 1997) : il s'enregistre en .xlsx en deux clics, et le
  Carnet le dit quand on lui en donne un. Pas de PDF ni de Word non plus, mais un tableau copié
  depuis Word se colle.
- **Une heure de cours est une séance** : « 1h30 » dans une programmation veut dire une séance et
  demie, pas 90 minutes à diviser par 55. Les minutes, elles, se divisent par la durée d'une
  séance (« 15 min » : un quart).
- L'export se fait en **.xlsx** (une feuille par classe), écrit lui aussi sans bibliothèque, et se
  réimporte tel quel : c'est ainsi qu'une progression passe d'un collègue à l'autre.

## Le calendrier des étapes

La programmation dit « semaine 45 » ; l'emploi du temps réel, avec ses cours annulés, ses
sorties et ses demi-groupes, dit autre chose. Le calendrier des étapes montre les deux : le jour
où chaque étape tombe pour chaque classe, calculé par le même moteur que le reste, et l'écart à
la semaine visée. Pour qu'il porte sur l'année, le Carnet lit l'agenda Pronote **jusqu'à la fin
de l'année scolaire** (et non plus douze semaines).

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
- **Partager une progression** avec un ou une collègue : l'export Excel et le lien d'import
  existent ; une bibliothèque de progressions partagées par niveau serait l'étape suivante.
- **Deux files par classe** pour les demi-groupes, si le besoin se confirme.
- **Pas propre aux SVT** : rien dans l'appli ne l'est (les modèles de jalons se réécrivent).
  Des collègues d'autres disciplines sont de bons testeurs.
- **iPhone** dans l'App Store plus tard, par un emballage natif, si la demande existe.
