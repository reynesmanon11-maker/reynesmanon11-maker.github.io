/* ============================================================================
   Regroupement des documents d'un chapitre en activités.

   Un chapitre de SVT n'est pas une pile de fichiers : c'est une suite
   d'activités, et chaque activité porte toujours les mêmes pièces — l'énoncé,
   parfois des documents d'aide, parfois une correction, et le bilan de cours.
   Ce fichier retrouve cette structure à partir des seuls intitulés, pour que
   Mme Reynes n'ait rien à ressaisir : « Bilan cours activité 3 » se range tout
   seul sous l'activité 3.

   Quand l'intitulé ne suffit pas, deux champs facultatifs prennent le dessus,
   posés depuis la page de gestion :
       a : numéro de l'activité   (0 = ressource de chapitre, hors activité)
       r : rôle                   (activite | support | correction | bilan
                                   | evaluation | entrainement | autre)

   Utilisé par 2nde.html, 1ere.html, terminale.html et gestion.html.
   ========================================================================== */
(function (racine) {
  'use strict';

  const sansAccent = (t) => (t || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* --- rôle d'un document -------------------------------------------------
     L'ordre des tests compte. « ACTIVITE 3 : PMA (correction) » commence par
     « Activité 3 » mais c'est une correction, pas l'énoncé : les mots-clés de
     correction et de bilan sont donc examinés avant le préfixe. */
  function role(libelle) {
    const t = sansAccent(libelle);
    if (/\bcorrections?\b|\bcorriges?\b|\bcorrigees?\b/.test(t)) return 'correction';
    if (/\bbilans?\b|\btrace ecrite\b/.test(t)) return 'bilan';
    if (/\bdevoirs?\b|\bds\b|\bevaluation\b|\bcontrole\b|\bgrille\b/.test(t)) return 'evaluation';
    if (/tester ses connaissances|\bquiz\b|\bqcm\b|escape game|\brevisions?\b|\bs.entrainer\b/.test(t))
      return 'entrainement';
    /* « Activité 4 : Tableau à compléter » est un support, pas un second énoncé */
    if (/^(activites?|act)\b/.test(t) && !/\btableaux?\b|\bfiches?\b|\bdocuments?\b/.test(t))
      return 'activite';
    if (/\bdocuments?\b|\bdoc\b|\bfiches?\b|\baide\b|\bsecours\b|\bcourbes?\b|\bsupports?\b|\bdiaporama\b|\btableaux?\b|\bmise en commun\b|\bvideo\b|\banimation\b|\bschemas?\b/.test(t))
      return 'support';
    return 'autre';
  }

  /* --- à quelle activité le document se rattache -------------------------- */
  function numero(libelle) {
    const t = sansAccent(libelle);
    const m = t.match(/\bactivites?\s*n?°?\s*(\d{1,2})\b/)
           || t.match(/\btp\s*n?°?\s*(\d{1,2})\b/)
           || t.match(/^act\s*(\d{1,2})\b/);
    return m ? +m[1] : 0;
  }

  /* --- intitulé allégé ----------------------------------------------------
     Le numéro et le mot « activité » remontent dans le titre de l'étape :
     inutile de les répéter sur chaque ligne. « Document support activité 1 »
     devient « Document support ». */
  const DEFAUT = {
    activite: 'Énoncé de l\'activité',
    support: 'Document d\'aide',
    correction: 'La correction',
    bilan: 'Bilan de cours',
    evaluation: 'Évaluation',
    entrainement: 'S\'entraîner',
    autre: 'Document',
  };

  function alleger(libelle, n, r) {
    let s = String(libelle || '');
    if (n) {
      s = s.replace(/\s*[:–—-]?\s*\b(activit[ée]s?|act|tp)\s*n?°?\s*\d{1,2}\b\s*[:–—-]?\s*/gi, ' ');
    }
    s = s.replace(/\s{2,}/g, ' ').replace(/^[\s:–—-]+|[\s:–—-]+$/g, '').trim();
    if (!s) return DEFAUT[r] || DEFAUT.autre;
    /* « ACTIVITE 1: LA COMMUNICATION » reste lisible en capitales : on ne
       retouche que la première lettre, les sigles (ADN, PMA, EXAO) restent. */
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* --- titre de l'étape ---------------------------------------------------
     À défaut de titre écrit à la main, il est pris sur l'énoncé de l'activité :
     « Activité 1 : Les niveaux d'organisation du vivant » donne « Les niveaux
     d'organisation du vivant ». Sans énoncé — une activité dont seule la fiche
     réponse est en ligne — il ne resterait que « Activité N », d'où la
     possibilité de l'écrire soi-même.

     Les deux sont rendus : `titre` est celui qu'on affiche, `derive` sert à
     repérer la ligne qui ne fait que répéter le titre. */
  function titreEtape(n, docs, titres) {
    const ecrit = (titres && titres[n]) ? String(titres[n]).trim() : '';
    const enonce = docs.find((d) => d.__r === 'activite');
    const t = enonce ? alleger(enonce.l, n, 'activite') : '';
    const derive = (!t || t === DEFAUT.activite) ? 'Activité ' + n : t;
    return { titre: ecrit || derive, derive: derive };
  }

  const RANG = { activite: 0, support: 1, correction: 2, bilan: 3, evaluation: 4, entrainement: 5, autre: 6 };

  /* --- regroupement -------------------------------------------------------
     Rend { etapes:[{n, titre, docs}], chapitre:[docs] }. Un chapitre dont
     aucun document ne mentionne d'activité — c'est le cas des chapitres 5 et 6
     en seconde — ressort avec zéro étape et tout dans « chapitre » : la page
     retombe alors sur une simple liste, sans rien casser. */
  function grouper(docs, titres) {
    const prepares = (docs || []).map((d) => {
      const r = d.r || role(d.l);
      const n = (d.a === undefined || d.a === null) ? numero(d.l) : +d.a;
      return Object.assign({}, d, { __r: r, __n: n, __t: alleger(d.l, n, r) });
    });

    const paquets = new Map();
    const chapitre = [];
    for (const d of prepares) {
      if (!d.__n) { chapitre.push(d); continue; }
      if (!paquets.has(d.__n)) paquets.set(d.__n, []);
      paquets.get(d.__n).push(d);
    }

    /* Une activité annoncée dans `titres` compte même sans document : c'est ce
       qui permet de poser le plan du chapitre avant d'avoir les fichiers. */
    const numeros = new Set(paquets.keys());
    if (titres) for (const k of Object.keys(titres)) {
      const n = parseInt(k, 10);
      if (n > 0) numeros.add(n);
    }

    const etapes = [...numeros].sort((x, y) => x - y).map((n) => {
      const L = (paquets.get(n) || []).slice()
        .sort((p, q) => (RANG[p.__r] ?? 9) - (RANG[q.__r] ?? 9));
      const { titre, derive } = titreEtape(n, L, titres);
      /* La ligne de l'énoncé répète le titre déduit d'elle : inutile de le lire
         deux fois, elle s'annonce simplement « Énoncé de l'activité ». On compare
         au titre déduit et non à celui affiché, pour que ça tienne aussi quand le
         titre a été réécrit à la main. */
      for (const d of L) if (d.__r === 'activite' && d.__t === derive) d.__t = DEFAUT.activite;
      return { n: n, titre: titre, derive: derive, docs: L };
    });

    return { etapes: etapes, chapitre: chapitre };
  }

  /* Étiquette affichée à gauche de chaque ligne. Toujours la même pour un même
     rôle : l'élève apprend le repère une fois et le retrouve partout. */
  const ETIQUETTE = {
    activite: 'Activité',
    support: 'Aide',
    correction: 'Correction',
    bilan: 'Bilan',
    evaluation: 'Évaluation',
    entrainement: 'Entraînement',
    autre: '',
  };

  racine.SVTActivites = {
    role: role,
    numero: numero,
    alleger: alleger,
    grouper: grouper,
    ETIQUETTE: ETIQUETTE,
    ROLES: ['activite', 'support', 'correction', 'bilan', 'evaluation', 'entrainement', 'autre'],
  };
})(window);
