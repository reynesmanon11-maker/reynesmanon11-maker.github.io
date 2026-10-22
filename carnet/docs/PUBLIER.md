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

En mode test, chaque personne voit à la première connexion « Google n'a pas validé cette
application » (→ **Paramètres avancés** → **Accéder à Carnet de bord**), et seuls les comptes de
la liste peuvent se connecter. L'écran de connexion et le message de partage disent à qui envoyer
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

Les captures d'écran sont prêtes dans `captures/` (téléphone et ordinateur).

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

Indispensable pour ouvrir l'appli à n'importe quel compte Google : lire les agendas est une
autorisation « sensible ». Ce qu'il faut :

- l'appli et sa page de confidentialité sur un domaine dont la propriété est prouvée dans
  **Google Search Console** : pour un site `github.io`, en déposant à la racine le petit fichier
  HTML que fournit Google (un nom de domaine à soi, une dizaine d'euros par an, simplifie tout) ;
- une justification de chaque autorisation (le tableau du README et de `confidentialite.html`
  sert de base) ;
- une **courte vidéo** (YouTube, non répertoriée) : la connexion, l'écran d'accord, puis ce que
  l'appli fait de chaque autorisation ;
- passer l'appli **En production** (Audience → Publier l'application).

Aucune autorisation « restreinte » n'est demandée (accès complet à Gmail ou à Drive) : pas
d'audit de sécurité payant.

## Relais iCal (facultatif)

Sans compte Google, ou pour avoir un emploi du temps plus frais que les 8 à 24 h de Google,
`relais/worker.js` va lire le lien iCal à la place du navigateur. Offre gratuite de Cloudflare
Workers : **Workers → Créer → coller le fichier → Déployer**, remplacer les origines en tête du
fichier par l'adresse de l'appli, puis mettre l'adresse du relais dans `config.js` →
`relaisIcal`. Il ne relaie que des liens iCal Pronote et ne garde rien ; mais le lien iCal
contient une clé : on ne confie le sien qu'à un relais qu'on a déployé soi-même.

## Avant d'ouvrir l'appli à des collègues

- [ ] Une adresse de contact dans `confidentialite.html` (le texte « à indiquer »).
- [ ] `googleClientId` dans `config.js` (`urlPublique` et `responsable` y sont déjà).
- [ ] Les collègues ajoutés comme **utilisateurs test**.
- [ ] `VERSION` changée dans `sw.js`.
- [ ] Un essai réel : une semaine de Pronote, sur un téléphone Android, un iPhone et un
      ordinateur, avec un vrai compte Google.
- [ ] `npm test` et `npm run test:navigateur` au vert.
