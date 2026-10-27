# Publier le Carnet de bord

Dans l'ordre, du gratuit et rapide au plus long :

| Étape | Coût | Délai | Pour qui |
|---|---|---|---|
| 1. Mettre l'appli en ligne | 0 | 15 min | tout le monde, en démo et sans compte |
| 2. Brancher Google en mode test | 0 | 30 min | jusqu'à 100 comptes ajoutés à la main |
| 3. Microsoft Store | 0 | quelques jours | ordinateurs Windows |
| 4. Play Store | 25 $ une fois | 3 semaines au moins | téléphones Android |
| 5. Vérification Google | 0 | quelques jours à quelques semaines | n'importe quel compte Google |

Sur iPhone, pas de store : Safari → Partager → **Sur l'écran d'accueil**. L'appli s'y comporte
comme une application installée. L'App Store demanderait 99 $ par an et une autre construction :
ce n'est pas prévu.

## 1. En ligne

Le Carnet vit dans le dossier `carnet/` du site, sur la branche `main` (GitHub Pages ne publie
qu'une branche) : <https://reynesmanon11-maker.github.io/carnet/>. Les élèves n'y ont aucun lien ;
sur le navigateur de l'enseignante, le lien « Carnet » apparaît à côté de « Gestion ».

À chaque nouvelle version : changer `VERSION` dans `sw.js` (par exemple `carnet-0.2.1-1`). Les
appareils déjà installés afficheront « Une nouvelle version du Carnet est prête ».

Pour essayer sur son ordinateur avant de publier : `node tests/lancer.mjs` (depuis `carnet/`),
puis <http://127.0.0.1:8080/>.

## 2. Activer la connexion Google

Le pas à pas, avec les liens directs et des boutons « Copier », est dans l'appli :
[`brancher-google.html`](../brancher-google.html). En résumé, sur
<https://console.cloud.google.com>, avec le compte Google qui « possédera » l'appli :

1. un projet « Carnet de bord », où l'on active **Google Calendar API** et **Google Drive API** ;
2. **Google Auth Platform** : nom de l'appli, audience **Externe**, page d'accueil, page de
   confidentialité, domaine `reynesmanon11-maker.github.io` ;
3. **Accès aux données** : les six autorisations listées dans la page (à coller dans
   *Ajouter manuellement*) ;
4. **Audience → Utilisateurs test** : les adresses Gmail de celles et ceux qui essaient (100 au plus) ;
5. **Clients → Créer un client**, type **Application Web** :
   - origine JavaScript autorisée : `https://reynesmanon11-maker.github.io` ;
   - URI de redirection autorisée : `https://reynesmanon11-maker.github.io/carnet/` (la connexion
     passe par là dans l'appli installée sur Android) ;
   - pour essayer sur son ordinateur : `http://127.0.0.1:8080` et `http://127.0.0.1:8080/` ;
6. l'**ID client** (`…apps.googleusercontent.com`) va dans `config.js` → `googleClientId`. Il
   n'est pas secret : c'est la liste des origines autorisées qui protège.

En mode test, Google affiche l'adresse du site au lieu du nom de l'appli, chaque personne voit à
la première connexion que Google ne l'a pas validée (→ **Paramètres avancés** → **Accéder à
reynesmanon11-maker.github.io (non sécurisé)**), et seuls les comptes de la liste peuvent se
connecter. L'écran de connexion et le message de partage disent à qui envoyer
son adresse (`responsable` dans `config.js`).

Les quotas gratuits des API Agenda et Drive sont très au-dessus de ce que l'appli consomme : une
synchronisation sans changement ne fait que des lectures, et une validation réécrit seulement
les cours qui changent.

## 3. Microsoft Store

On peut l'y mettre **dès maintenant et continuer à le modifier** : le paquet du Store ne contient
que l'adresse et les icônes, l'appli elle-même vient du site. Chaque modification publiée sur le
site est donc aussitôt dans l'appli du Store, sans nouvelle soumission (sauf changement d'icône ou
de nom). Mieux vaut attendre que la connexion Google soit activée : c'est elle que la personne
qui installe voudra essayer. Dans l'appli du Store, elle se fait comme sur le site : une fenêtre
Google s'ouvre par-dessus le Carnet.

Le compte développeur est **gratuit pour les particuliers** depuis septembre 2025.

1. **Partner Center** (<https://partner.microsoft.com>) : s'inscrire comme développeur
   individuel (vérification d'identité), puis **Applications et jeux → Nouveau produit →
   Application MSIX ou PWA**, et réserver le nom.
2. Dans la page du produit, **Identité du produit** : noter *Package/Identity/Name*,
   *Package/Identity/Publisher* et *Package/Properties/PublisherDisplayName*.
3. **PWABuilder** (<https://www.pwabuilder.com>) : coller l'adresse de l'appli → **Package For
   Stores → Windows**, recopier les trois valeurs → télécharger.
4. Dans Partner Center, créer une soumission : déposer le `.msixbundle`, captures d'écran,
   description, classification par âge, adresse de `confidentialite.html`. Certification :
   quelques jours.

Les captures d'écran sont prêtes dans `captures/` : quatre pour ordinateur en 1366 × 768 (la taille
minimale du Store), deux pour téléphone, et le logo en 300 × 300.

Description courte proposée : « Le carnet de bord de l'enseignant : emploi du temps Pronote,
progression de chaque classe, cahier de textes prêt à copier et rendez-vous perso, au même
endroit. » Catégorie : Éducation. Public : adultes (outil d'enseignant).

## 4. Play Store

1. **Play Console** (<https://play.google.com/console>) : compte personnel, 25 $ une fois,
   pièce d'identité.
2. **PWABuilder → Package For Stores → Android** : identifiant du paquet (par exemple
   `io.github.reynesmanon11.carnet`), nom, couleurs. Le téléchargement contient le fichier
   `.aab` à déposer, la **clé de signature** et un fichier `assetlinks.json`.
   **Garder la clé et son mot de passe** en lieu sûr : sans eux, plus de mise à jour.
3. **Le fichier `assetlinks.json` doit être servi à la racine du domaine** :
   `https://reynesmanon11-maker.github.io/.well-known/assetlinks.json`. Sans lui, l'appli s'ouvre
   avec une barre d'adresse, comme une page web. Le Carnet étant dans le site, il suffit de
   déposer ce fichier dans un dossier `.well-known/` à la racine du dépôt, et d'ajouter un
   `_config.yml` qui contient `include: [".well-known"]` : le site passe par Jekyll, qui ignore
   sinon les dossiers dont le nom commence par un point. Vérifier ensuite avec l'outil de Google
   (<https://developers.google.com/digital-asset-links/tools/generator>).
   Dans l'appli Android, la connexion Google passe par la page de Google, puis revient : c'est
   automatique.
4. **Test fermé obligatoire** pour un compte personnel récent : au moins **12 testeurs** inscrits
   pendant **14 jours d'affilée** avant de pouvoir demander la publication. Des collègues font
   d'excellents testeurs ; il leur faut un compte Google et Android.
5. Fiche : description, captures, **public cible : adultes** (c'est un outil d'enseignant, pas
   d'élève), formulaire **Sécurité des données** (les agendas sont lus sur l'appareil, une copie
   va dans le Drive de l'utilisateur, rien chez l'éditrice), adresse de `confidentialite.html`.

## 5. Vérification Google

Indispensable pour ouvrir l'appli à n'importe quel compte Google sans avertissement : les
autorisations d'Agenda sont « sensibles ». Pas d'audit de sécurité (réservé aux autorisations
« restreintes », comme tout le Drive) ; gratuit ; quelques jours à quelques semaines. Avec le
compte Google propriétaire du projet :

1. **Prouver que le domaine est à soi** : <https://search.google.com/search-console> → Ajouter une
   propriété → **Préfixe de l'URL** `https://reynesmanon11-maker.github.io/` → méthode **Fichier
   HTML** : télécharger le fichier `google….html`, le déposer **à la racine du dépôt** (pas dans
   `carnet/`), attendre la publication, puis **Valider**. Ne jamais supprimer ce fichier.
2. **Google Auth Platform → Branding** : nom « Carnet de bord » ; logo `captures/logo-120.png` ;
   e-mail d'assistance ; page d'accueil `https://reynesmanon11-maker.github.io/carnet/` ;
   confidentialité `https://reynesmanon11-maker.github.io/carnet/confidentialite.html` ; domaine
   autorisé `reynesmanon11-maker.github.io` ; e-mail du développeur.
3. **Accès aux données** : vérifier les autorisations (celles de `brancher-google.html`), et
   écrire pour chaque autorisation sensible pourquoi elle sert :
   - `calendar.calendarlist.readonly` : « Lister les agendas de l'utilisateur pour trouver celui
     que Pronote (logiciel de vie scolaire) y a abonné, et ceux qu'il choisit d'afficher. »
   - `calendar.events` : « Lire l'emploi du temps exporté par Pronote et les rendez-vous
     personnels choisis, pour les afficher à côté des cours ; créer, modifier ou supprimer un
     rendez-vous personnel uniquement quand l'utilisateur le fait lui-même dans l'application. »
   - `calendar.app.created` : « Créer les agendas propres à l'application (un par niveau de
     classe) et y écrire les cours avec ce qui est prévu. »
   - `drive.appdata` : « Garder une copie des données de l'utilisateur dans le dossier caché de
     l'application, pour les retrouver sur ses autres appareils. »
4. **La vidéo** (YouTube, « non répertoriée », 2 à 3 minutes, en anglais ou sous-titrée) : la
   page d'accueil du Carnet ; « Se connecter avec Google » ; l'écran d'accord de Google où se
   lisent le nom de l'appli **et l'adresse avec l'identifiant client** (`client_id=…`) ; puis, pour
   chaque autorisation, ce qu'elle fait dans l'appli : l'agenda Pronote trouvé, les cours écrits
   dans « Carnet · 5e », un rendez-vous ajouté puis supprimé, la synchronisation sur un deuxième
   appareil.
5. **Audience → Publier l'application** (« En production »), puis **Vérification → Préparer la
   vérification** : tout relire et **Envoyer**. Google répond par e-mail, souvent avec des
   questions : répondre dans le même fil.

Tant que la vérification n'est pas acquise, l'appli en production reste limitée à 100 comptes et
affiche l'avertissement : on peut donc la publier tout de suite, rien ne casse pour celles et
ceux qui l'utilisent déjà.
