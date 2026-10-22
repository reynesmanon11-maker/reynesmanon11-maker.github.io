# Carnet de bord

*(nom de travail)*

**L'emploi du temps Pronote, l'agenda perso et la progression de chaque classe, au même endroit, sur
le téléphone comme sur l'ordinateur.**

Cinq ou six classes, des demi-groupes, les mêmes activités pour plusieurs classes qui n'en sont
pas au même point : d'une semaine à l'autre, on ne sait plus si la 602 s'était arrêtée aux
hypothèses ou au bilan. Le Carnet de bord le retient pour vous. Après chaque cours, un toucher :
« on s'est arrêtés après les hypothèses ». La suite glisse toute seule sur les cours suivants, tels
que Pronote les connaît, cours annulés compris.

## Ce que fait l'appli

- **Lit l'emploi du temps de Pronote** (le lien iCal officiel, via Google Agenda) : classes,
  demi-groupes, salles, accompagnants (AESH), élèves en inclusion (ULIS), cours annulés, vacances.
- **Une file d'étapes par classe**, partagée par niveau : une activité écrite pour la 601 sert à la 602.
  Chaque étape a une durée et des **jalons** (situation déclenchante, problème, hypothèses,
  protocole…), là où l'on peut s'arrêter.
- **Le point d'arrêt** : après le cours, on touche le dernier jalon terminé (ou « Comme prévu »).
  Le dernier point validé fait foi : une validation oubliée ne fausse rien.
- **Où en sont mes classes** : les classes d'un même niveau sur la même suite d'étapes —
  « la 601 a une séance et demie de retard sur la 602 ».
- **Écrit dans Google Agenda** chaque cours avec ce qui est prévu (« 503 P2 · Activité 5 ·
  reprendre à Protocole »), dans ses propres agendas, un par niveau, aux couleurs choisies. Dans
  Google Agenda, le lien du cours ouvre directement « Où en est-on ? ».
- **Vie pro et vie perso** dans une même semaine, comme un agenda papier ; les trous de la journée.
- **Rappels déduits** : évaluations à annoncer une semaine avant, photocopies (effectif × pages),
  matériel, cours sans contenu, étape prévue en demi-groupe qui tombe sur un cours en classe entière.
- **Avant les vacances** : la file tient-elle d'ici la coupure, classe par classe ?
- **Tableau de bord modulable** : modules déplaçables au doigt, largeur S/M/L, masquables,
  réglables (« À préparer » en liste, en date « préparé jusqu'au », ou en compteur ; « À faire » en
  colonne, en ligne ou par échéance). Thème clair ou sombre, cinq couleurs, densité.
- **Hors connexion** : l'appli s'ouvre et se valide sans réseau, et rattrape ensuite.
- **Cahier de textes** : le texte de la séance, prêt à coller dans Pronote.
- **Import** du « Carnet de bord SVT » de claude.ai : files, validations et tâches reprises.
- **Installer et partager** : bouton « Installer » quand le navigateur le permet (marche à suivre
  sur iPhone), QR code à viser avec un téléphone, message tout prêt pour un collègue.

## Ce qu'elle ne fait pas, volontairement

- Elle ne demande **jamais le mot de passe Pronote**, ni le QR code de connexion de l'application
  Pronote (qui ouvre tout le compte : notes, élèves). Le lien iCal suffit.
- **Aucune donnée d'élève**, aucun serveur, aucun traceur. Les données restent dans l'appareil et,
  avec Google, dans un dossier caché du Drive de l'enseignant.
- Elle **n'écrit que dans ses propres agendas** Google : l'autorisation demandée ne lui permet pas
  de modifier les rendez-vous personnels ni l'agenda de Pronote.

Les raisons, et les limites, sont dans [docs/CHOIX.md](docs/CHOIX.md).

**En ligne : <https://reynesmanon11-maker.github.io/carnet/>** — installable depuis cette adresse
sur Android, iPhone et ordinateur.

## Documentation

| Pour | Document |
|---|---|
| Un ou une collègue qui commence | [docs/MISE-EN-ROUTE.md](docs/MISE-EN-ROUTE.md) |
| Activer la connexion Google (une fois) | [brancher-google.html](brancher-google.html) |
| Publier l'appli (Google, Play Store, Microsoft Store) | [docs/PUBLIER.md](docs/PUBLIER.md) |
| Comprendre les choix et les limites | [docs/CHOIX.md](docs/CHOIX.md) |
| Ce que l'appli fait des données | [confidentialite.html](confidentialite.html) |

## Technique

Une application web installable (PWA) : HTML, CSS et JavaScript sans bibliothèque ni étape de
construction, servie telle quelle (GitHub Pages convient). Les modules JavaScript :

| Fichier | Rôle |
|---|---|
| `js/ics.js` | lecture d'un fichier iCalendar (lignes repliées, fuseaux, échappements) |
| `js/pronote.js` | ce que raconte un événement Pronote (classe, demi-groupe, AESH, ULIS, annulation) |
| `js/moteur.js` | créneaux, file d'étapes, points d'arrêt, annonces, vacances, photocopies, trous |
| `js/donnees.js` | documents synchronisés, fusion entre appareils, import et sauvegarde |
| `js/agenda.js` | ce qui s'écrit dans Google Agenda, et le calcul des différences |
| `js/google.js` | connexion Google (jeton en mémoire), Agenda v3, Drive (dossier caché) |
| `js/synchro.js` | lecture, fusion Drive, écriture — une synchronisation à la fois |
| `js/qr.js` | QR code (norme ISO/IEC 18004, niveau M), sans bibliothèque |
| `js/installation.js` | installation de l'appli, adresse publique |
| `js/vues/*.js` | les écrans |
| `sw.js` | fonctionnement hors connexion |
| `relais/worker.js` | relais iCal facultatif (Cloudflare Workers) |

Le moteur ne dépend pas du navigateur : il tourne sous Node pour les tests, et pourra tourner
ailleurs (une synchronisation automatique sans ouvrir l'appli, par exemple).

### Essayer sur son ordinateur

```
node tests/lancer.mjs        # puis ouvrir http://127.0.0.1:8080/
```

### Tests

```
npm test                     # 48 tests : moteur, Pronote, iCal, données, agenda, QR code, guide Google
npm run test:navigateur      # parcours complets dans Chromium (Playwright), dont un faux Google
```

Le faux Google (`tests/faux-google.mjs`) reproduit l'API Agenda v3 et Drive v3 telles que l'appli
les appelle, et refuse toute écriture hors des agendas créés par l'appli : les tests vérifient
qu'aucun appel n'en écrit ailleurs, qu'une resynchronisation sans changement ne fait aucun appel
d'écriture, et qu'un deuxième appareil retrouve tout.
