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
     Pris sur l'énoncé de l'activité : « Activité 1 : Les niveaux
     d'organisation du vivant » donne « Les niveaux d'organisation du vivant ».
     Sans énoncé, l'étape s'appelle simplement « Activité N ». */
  function titreEtape(n, docs) {
    const enonce = docs.find((d) => d.__r === 'activite');
    if (!enonce) return 'Activité ' + n;
    const t = alleger(enonce.l, n, 'activite');
    return t === DEFAUT.activite ? 'Activité ' + n : t;
  }

  const RANG = { activite: 0, support: 1, correction: 2, bilan: 3, evaluation: 4, entrainement: 5, autre: 6 };

  /* --- regroupement -------------------------------------------------------
     Rend { etapes:[{n, titre, docs}], chapitre:[docs] }. Un chapitre dont
     aucun document ne mentionne d'activité — c'est le cas des chapitres 5 et 6
     en seconde — ressort avec zéro étape et tout dans « chapitre » : la page
     retombe alors sur une simple liste, sans rien casser. */
  function grouper(docs) {
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

    const etapes = [...paquets.keys()].sort((x, y) => x - y).map((n) => {
      const L = paquets.get(n).slice()
        .sort((p, q) => (RANG[p.__r] ?? 9) - (RANG[q.__r] ?? 9));
      const titre = titreEtape(n, L);
      /* Le titre de l'étape vient de l'énoncé : inutile de le réécrire mot pour
         mot sur sa propre ligne, elle s'annonce simplement « Énoncé de
         l'activité ». Les autres énoncés d'une même activité, eux, gardent leur
         intitulé puisqu'il apporte quelque chose. */
      for (const d of L) if (d.__r === 'activite' && d.__t === titre) d.__t = DEFAUT.activite;
      return { n: n, titre: titre, docs: L };
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
