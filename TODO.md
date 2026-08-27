# TODO — idées pour le site

Ce fichier pilote deux tâches automatiques :
- **la tâche Cowork** (toutes les 3 h) : elle AJOUTE des idées à la liste et me propose du code à coller ;
- **la tâche « une idée toutes les 2 h »** : elle PREND la première idée non cochée, la réalise,
  la vérifie dans un navigateur, la publie sur `main` et coche la case toute seule.
  Si une vérification échoue, elle ne touche pas à `main` : elle ouvre une pull request.

## Comment ça marche
- Une idée par ligne, format :  - [ ] description claire
- La tâche prend la PREMIÈRE idée non cochée et m'envoie le code à coller.
- Quand j'ai collé le code sur GitHub, je coche l'idée :  - [x]
- La fois d'après, la tâche passe à l'idée suivante. Tout coché = elle s'arrête.
- L'ordre des lignes = l'ordre de priorité (je peux les réorganiser quand je veux).

## À faire
- [x] Page 2nde.html : améliorer la mise en forme du texte (titres, tailles de police, espacements, lisibilité) et appliquer une palette PASTEL MULTICOLORE (plusieurs teintes douces : vert, bleu, rose…). Ne pas toucher au contenu pédagogique, seulement la présentation.
- [x] Créer une page « Première — Enseignement scientifique » sur le modèle de 2nde.html (même design), avec une structure thèmes/chapitres à compléter, et l'ajouter à la navigation du site.
- [x] Créer une page « Terminale — Enseignement scientifique » sur le même modèle, et l'ajouter à la navigation du site.
- [x] Rendre le formulaire de contact fonctionnel via un lien « mailto » : à l'envoi, ouvrir le logiciel de messagerie avec un e-mail pré-rempli vers reynesmanon11@gmail.com (objet + corps reprenant les champs). Aucun service externe.
- [x] Section « Les grands thèmes » de l'accueil : les quatre cartes venaient du gabarit d'origine et menaient toutes à #services. Les remplacer par les six vrais chapitres de Seconde, chacun pointant sur sa section dans 2nde.html.

- [x] Ajouter un favicon (icône d'onglet) reprenant le logo, sur toutes les pages.
- [ ] Ajouter un bouton flottant « Haut de page » qui apparaît au défilement, sur les pages longues (2nde, 1ere, terminale).
- [ ] Ajouter une fine barre de progression de lecture en haut des pages de cours.
- [ ] Ajouter une image de partage (og:image) pour un bel aperçu quand on envoie le lien du site.
- [ ] Ajouter un mode sombre / clair avec un petit bouton discret, en conservant la palette terracotta.
- [ ] Ajouter une barre de recherche pour filtrer en direct les chapitres et ressources d'une page.
- [ ] Créer une vraie page « Méthodes » (le lien existe déjà mais pointe dans le vide) : analyser un document, rédiger une réponse, réviser efficacement.
- [ ] Ajouter à la page Seconde une section « À télécharger » listant les PDF déjà présents dans le dossier cours.
- [ ] Ajouter un mini-quiz d'auto-évaluation (QCM auto-corrigé) en bas de chaque chapitre, piloté par un petit tableau JS.
- [ ] Ajouter un glossaire / lexique SVT interactif (termes clés dépliables) accessible depuis le menu.
- [ ] Compléter les chapitres 2 à 6 de Seconde.
- [ ] Ajouter une feuille de style « impression » propre + un bouton « Imprimer / PDF » sur les pages de cours.
- [ ] Passe d'accessibilité : vérifier les contrastes, les contours de focus au clavier et les textes alternatifs des images.
