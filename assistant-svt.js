/* =============================================================================
   ASSISTANT SVT — la bulle d'aide en bas à droite du site
   =============================================================================

   Il fonctionne ENTIÈREMENT dans le navigateur de l'élève : aucune clé d'API,
   aucun appel à un service extérieur, aucun coût, aucune donnée qui sort.
   Ce qu'il sait est écrit un peu plus bas, dans BASE. C'est tout ce qu'il sait :
   il ne devine pas, il ne prétend pas savoir. Quand il ne trouve pas, il le dit.

   ---------------------------------------------------------------------------
   AJOUTER UN CHAPITRE — le seul endroit à modifier est BASE ci-dessous.
   ---------------------------------------------------------------------------
   Copiez ce modèle dans le niveau voulu :

     'ma-cle': {
       titre: 'Le titre affiché',
       notions: {
         'nom de la notion': 'La définition, telle que vous la diriez en cours.',
         'autre notion':     'Etc.',
       },
       questions: [
         { q:'Question posée à l\'élève ?', r:'nom de la notion', type:'def' },
         { q:'Vrai ou faux : ...', r:'faux', type:'tf', expl:'Pourquoi.' },
         { q:'Complétez : le ___ fait ___.', r:'mot1 mot2', type:'fill' },
       ]
     },

   Les types de question : 'def' (définition), 'tf' (vrai/faux), 'fill'
   (compléter), 'list' (citer), 'open' (expliquer), 'compare' (comparer),
   'bac' (question longue). Les trois premiers sont posés en début de série,
   les autres arrivent quand l'élève enchaîne les bonnes réponses.

   Le champ `r` d'une question de type autre que 'tf' et 'fill' doit être le
   NOM D'UNE NOTION : l'assistant affiche sa définition en correction.
   ============================================================================= */

(function () {
  'use strict';

  /* ===========================================================================
     BASE DE CONNAISSANCE
     =========================================================================== */
  const BASE = {

    terminale: {
      nom: 'Terminale · spécialité',
      chapitres: {

        angio: {
          titre: 'Angiospermes et vie fixée',
          notions: {
            'photosynthèse': "Réaction dans les chloroplastes : 6CO2 + 6H2O → C6H12O6 + 6O2 (nécessite lumière et sels minéraux). Les plantes puisent le CO2 dans l'air (0,038 %) et l'eau + les sels minéraux dans le sol.",
            'poils absorbants': "Extensions des cellules racinaires qui absorbent l'eau et les sels minéraux du sol. Surface d'échange pouvant atteindre plusieurs centaines de m². En milieu carencé, leur nombre augmente pour optimiser l'absorption.",
            'xylème': "Vaisseaux constitués de cellules mortes lignifiées (lignine). Colorés en vert au carmin-vert d'iode. Transportent la sève brute (eau + sels minéraux) des racines vers les feuilles.",
            'phloème': "Tubes criblés à parois de cellulose. Colorés en rose au carmin-vert d'iode. Transportent la sève élaborée (eau + sels minéraux + saccharose + acides aminés + vitamines) dans toute la plante.",
            'sève brute': "Solution d'eau et de sels minéraux. Circule dans le xylème, des racines vers les feuilles (sens ascendant).",
            'sève élaborée': "Solution contenant eau, sels minéraux, saccharose, acides aminés et vitamines — les produits de la photosynthèse. Circule dans le phloème vers tous les organes.",
            'stomates': "Petits orifices (ostioles) de l'épiderme des feuilles. Permettent l'entrée du CO2 et la sortie de l'O2 et de l'H2O. Fermés entre 12 h et 14 h pour limiter les pertes d'eau lors des fortes chaleurs. Surface d'échange pour le CO2 : des milliers de m², contre 100 m² pour les poumons des mammifères.",
            'thylakoïdes': "Membranes empilées en grana dans les chloroplastes, où se trouvent les pigments chlorophylliens. Surface d'environ 1000 m² grâce aux nombreux replis.",
            'pigments chlorophylliens': "Molécules qui absorbent la lumière. Les chlorophylles a et b absorbent surtout le rouge et le bleu, les caroténoïdes le bleu. Le vert n'est pas absorbé : c'est pourquoi les feuilles paraissent vertes.",
            'gènes ABC': "Gènes du développement floral, étudiés chez Arabidopsis thaliana. A seul → sépales. A+B → pétales. B+C → étamines. C seul → carpelles. Sans A : uniquement carpelles et étamines. Sans C : uniquement sépales et pétales.",
            'verticilles': "Couronnes concentriques des pièces florales : V1 sépales (calice), V2 pétales (corolle), V3 étamines (organes mâles), V4 pistil et carpelles (organes femelles).",
            'anémophilie': "Pollinisation par le vent. Fleurs petites, inodores, à longs stigmates ; pollen petit (10-25 µm) et non adhérent.",
            'entomophilie': "Pollinisation par les insectes. Fleurs colorées produisant du nectar. Jusqu'à 100 000 grains de pollen transportés, de façon ciblée vers la même espèce.",
            'ornithophilie': "Pollinisation par les oiseaux, notamment les colibris. Fleurs rouges ou orangées, tubulaires, inodores, très riches en nectar.",
            'cheiroptérophilie': "Pollinisation par les chauves-souris. Fleurs larges, pâles, odorantes, ouvertes la nuit.",
            'tube pollinique': "Structure qui se développe depuis le grain de pollen déposé sur le stigmate jusqu'à l'ovule. Il transporte le gamète mâle et permet la fécondation.",
            'dissémination': "Dispersion des graines. Autochorie (par la plante elle-même), anémochorie (vent, graines légères), hydrochorie (eau), épizoochorie passive (crochets accrochés au pelage), épizoochorie active (transport volontaire, myrmécochorie), endozoochorie (graine avalée puis rejetée dans les excréments).",
            'coévolution': "Évolution conjointe et interdépendante de deux espèces, par exemple l'orchidée de Darwin et le papillon sphinx. Se repère à des arbres phylogénétiques en miroir. Elle peut être mutualiste ou antagoniste (course à l'armement).",
            'dormance': "État de vie ralentie contrôlé par l'ABA. En automne, l'ABA augmente : déshydratation des bourgeons et des graines, mise en réserve dans les tubercules, rhizomes et bulbes, arrêt de la circulation des sèves. Au printemps, la luminosité et la température augmentent, l'ABA diminue : levée de dormance, débourrement, germination.",
            'ABA': "Acide abscissique. Hormone végétale qui déclenche la dormance. Sa concentration augmente en automne et diminue au printemps.",
            'éliciteurs': "Molécules signaux qui déclenchent la synthèse de défenses chimiques à la suite d'une agression : blessure, attaque d'un pathogène.",
            'tanins': "Molécules toxiques qui rendent la digestion difficile. L'acacia en synthétise en réponse aux herbivores, les koudous par exemple, et émet en plus de l'éthylène pour alerter les plantes voisines.",
            'crypte pilifère': "Structure qui protège les stomates chez les plantes des régions sèches. Elle crée un milieu humide à l'abri du vent sur la face inférieure des feuilles, en général avec une cuticule épaisse, pour limiter l'évapotranspiration.",
          },
          questions: [
            { q: "Qu'est-ce qu'un poil absorbant et quel est son rôle ?", r: 'poils absorbants', type: 'def' },
            { q: 'Vrai ou faux : le xylème transporte la sève élaborée.', r: 'faux', type: 'tf', expl: "Le xylème transporte la sève BRUTE (eau + sels minéraux). C'est le phloème qui transporte la sève élaborée." },
            { q: 'Quels pigments absorbent surtout le rouge et le bleu ?', r: 'pigments chlorophylliens', type: 'def' },
            { q: 'Complétez : le ___ transporte la sève brute, le ___ transporte la sève élaborée.', r: 'xylème phloème', type: 'fill' },
            { q: 'Citez trois modes de pollinisation par les animaux.', r: 'entomophilie', type: 'list' },
            { q: 'Quelle hormone végétale contrôle la dormance ?', r: 'ABA', type: 'def' },
            { q: 'Vrai ou faux : les stomates sont ouverts en permanence.', r: 'faux', type: 'tf', expl: 'Ils se ferment lors des fortes chaleurs, entre 12 h et 14 h, pour limiter les pertes d\'eau.' },
            { q: "Qu'est-ce que la coévolution ? Donnez un exemple.", r: 'coévolution', type: 'def' },
            { q: 'Dans le modèle ABC, quels gènes contrôlent la formation des étamines ?', r: 'gènes ABC', type: 'def' },
            { q: 'Vrai ou faux : en milieu carencé en sels minéraux, la plante produit moins de poils absorbants.', r: 'faux', type: 'tf', expl: "C'est l'inverse : en milieu carencé, la quantité de poils absorbants AUGMENTE pour optimiser l'absorption." },
            { q: "Qu'est-ce que l'endozoochorie ?", r: 'dissémination', type: 'def' },
            { q: 'Expliquez pourquoi les feuilles nous paraissent vertes.', r: 'pigments chlorophylliens', type: 'open' },
            { q: 'Quel est le rôle des stomates dans la nutrition des Angiospermes ?', r: 'stomates', type: 'open' },
            { q: 'Comparez xylème et phloème sur trois critères.', r: 'xylème', type: 'compare' },
            { q: 'Montrez que les Angiospermes ont mis en place des stratégies variées pour se reproduire malgré leur vie fixée.', r: 'dissémination', type: 'bac' },
          ]
        },

        climat: {
          titre: 'Climat passé, actuel et futur',
          notions: {
            'effet de serre': "L'atmosphère est transparente au rayonnement solaire visible mais opaque aux infrarouges émis par la surface : elle retient donc la chaleur. Sans gaz à effet de serre naturels, la température de surface serait de -18 °C ; avec eux, elle est de +15 °C. La vapeur d'eau assure 60 % de l'effet de serre naturel.",
            'albédo': "Rapport entre l'énergie solaire réfléchie et l'énergie solaire reçue. Glace : 90 %. Végétaux : 35 %. Océans : 10 %. Plus d'albédo, donc plus de glace, refroidit la planète : c'est une rétroaction qui amplifie les refroidissements.",
            'forçage radiatif': "Déséquilibre du bilan radiatif terrestre causé par les activités humaines. Le CO2 est passé de 208 ppm en 1850 à 405 ppm. L'agriculture produit deux fois plus de CH4 que les sources naturelles. Résultat : un effet de serre additionnel, et +1 °C depuis 1850 à l'échelle mondiale.",
            'rétroaction': "Mécanisme d'amplification. Une rétroaction positive fait qu'un changement amplifie lui-même sa cause : réchauffement → la glace fond → l'albédo diminue → moins de réflexion → encore plus chaud. Autre exemple : la température monte → le CO2 est moins soluble dans l'océan → il est dégazé vers l'atmosphère → l'effet de serre augmente → la température monte encore.",
            'δ18O': "Rapport isotopique entre 18O et 16O. Dans les glaces : un δ18O faible signifie une température basse, car les précipitations froides contiennent peu de 18O lourd. ATTENTION, c'est l'inverse dans les carbonates de foraminifères : un δ18O faible y signifie une eau chaude.",
            'cycles de Milankovitch': "Variations périodiques des paramètres orbitaux de la Terre. Excentricité, la forme de l'orbite : environ 100 000 ans. Obliquité, l'inclinaison de l'axe : environ 41 000 ans. Précession des équinoxes : environ 23 000 ans. Elles font varier l'insolation et rythment les cycles glaciaires et interglaciaires.",
            'BIF': "Banded Iron Formation. Roches sédimentaires marines rubanées, fer et silice, datées de -3,2 à -2 Ga. Elles témoignent de la présence d'O2 libre dans l'océan, produit localement par les cyanobactéries photosynthétiques dès 3,5 Ga.",
            'cyanobactéries': "Premières bactéries photosynthétiques, présentes dès 3,5 Ga sous forme de stromatolithes. Elles libèrent de l'O2 dans l'océan, d'où la formation des BIF. Dès 2,2 Ga, l'océan saturé laisse l'O2 diffuser dans l'atmosphère, qui devient oxydante.",
            'paléosols rouges': "Sols riches en hématite (Fe2O3) apparus dès 2,2 Ga en domaine continental. Ils montrent que les ions Fe2+ issus de l'altération des continents étaient oxydés avant d'atteindre l'océan : c'est une preuve de la présence d'O2 atmosphérique.",
            'indice stomatique': "IS = S × 100 / (CNC + S), calculé sur les feuilles fossiles de Ginkgo biloba. Un IS élevé indique un CO2 atmosphérique bas, un IS bas un CO2 élevé. Il permet de reconstituer les teneurs en CO2 passées.",
            'foraminifères': "Organismes unicellulaires aquatiques à test calcaire. Après leur mort, les tests s'accumulent dans les sédiments. Deux usages : le δ18O de leurs carbonates donne la paléotempérature de l'eau de mer, et l'étude statistique des espèces renseigne sur leurs exigences climatiques.",
            'spectre pollinique': "Pourcentage de chaque type de pollen dans un échantillon sédimentaire — l'exine du pollen est très résistante. Il permet de reconstituer la végétation d'une époque, donc le biome, donc le climat. La superposition des spectres dans le temps donne le diagramme pollinique.",
            'altération chimique': "Réaction des roches avec l'eau et le CO2, qui consomme du CO2 atmosphérique. Pour le feldspath : 2KAlSi3O8 + 11H2O + 2CO2 → argile + 2K+ + 2HCO3- + 4H4SiO4. Plus rapide avec des reliefs élevés et un climat chaud et humide. C'est le mécanisme du refroidissement au Permo-Carbonifère, avec la chaîne hercynienne.",
            'LIP': "Large Igneous Province, province volcanique géante, comme les trapps du Deccan au Crétacé. Elles produisent d'énormes quantités de CO2, donc un effet de serre accru et un réchauffement : c'est ce qui explique la chaleur du Crétacé.",
            'minimum de Maunder': "Période de très faible activité solaire entre 1645 et 1715, au cœur du Petit Âge Glaciaire, corrélée à un refroidissement net. Autre facteur de cette période : l'éruption méga-colossale du Samalas, en Indonésie, en 1257.",
            'Gulf Stream': "Courant océanique chaud de surface de l'Atlantique Nord. Il apporte la chaleur de l'équateur vers l'Europe du Nord et dépend de la plongée des eaux de surface près du Groenland. Si cette plongée ralentit, le Gulf Stream ralentit et l'Europe de l'Ouest se refroidit : c'est l'hypothèse retenue pour le Dryas récent.",
          },
          questions: [
            { q: "Qu'est-ce que l'albédo ?", r: 'albédo', type: 'def' },
            { q: "Vrai ou faux : sans l'effet de serre naturel, la température à la surface de la Terre serait de +15 °C.", r: 'faux', type: 'tf', expl: "Sans effet de serre elle serait de -18 °C. C'est AVEC l'effet de serre naturel qu'elle est de +15 °C." },
            { q: 'Que sont les BIF et que nous apprennent-ils ?', r: 'BIF', type: 'def' },
            { q: 'Complétez : dans la glace, le δ18O est faible quand la température est ___.', r: 'basse', type: 'fill' },
            { q: 'Citez les trois paramètres de Milankovitch et leur période.', r: 'cycles de Milankovitch', type: 'list' },
            { q: 'Vrai ou faux : dans les carbonates de foraminifères, un δ18O faible indique une eau froide.', r: 'faux', type: 'tf', expl: "C'est l'inverse des glaces : chez les foraminifères, un δ18O faible signifie une eau CHAUDE." },
            { q: "Qu'est-ce qu'une rétroaction positive ? Donnez un exemple climatique.", r: 'rétroaction', type: 'def' },
            { q: 'Pourquoi le Crétacé était-il une période chaude ?', r: 'LIP', type: 'open' },
            { q: "Expliquez le rôle de l'altération chimique des roches dans le refroidissement du Permo-Carbonifère.", r: 'altération chimique', type: 'open' },
            { q: "Qu'est-ce que le spectre pollinique et comment permet-il de reconstituer les paléoclimats ?", r: 'spectre pollinique', type: 'open' },
            { q: "Comparez l'utilisation du δ18O dans les glaces et dans les carbonates de foraminifères.", r: 'δ18O', type: 'compare' },
            { q: 'Expliquez les causes des cycles glaciaires et interglaciaires des 800 000 dernières années.', r: 'cycles de Milankovitch', type: 'bac' },
          ]
        },

      }
    },

    /* --------------------------------------------------------------------
       Seconde et Première : à remplir. Tant qu'un niveau n'a aucune notion,
       l'assistant ne le propose pas et le dit franchement à l'élève, plutôt
       que d'inventer une réponse.
       -------------------------------------------------------------------- */
    seconde: { nom: 'Seconde', chapitres: {} },
    premiere: { nom: 'Première · ens. scientifique', chapitres: {} },
  };

  /* Quelques formulations d'élèves qui ne reprennent pas le mot du cours. */
  const SYNONYMES = {
    'xylème': ['seve brute', 'vaisseau bois', 'montee de seve'],
    'phloème': ['seve elaboree', 'tube crible', 'liber'],
    'stomates': ['ostiole', 'trou feuille', 'echange gazeux', 'transpiration'],
    'photosynthèse': ['fabrique glucose', 'produit oxygene', 'equation bilan'],
    'poils absorbants': ['racine absorbe', 'absorption eau'],
    'effet de serre': ['gaz a effet de serre', 'ges', 'rechauffement', 'co2 atmosphere'],
    'albédo': ['reflexion lumiere', 'surface reflechit'],
    'δ18O': ['delta 18 o', 'isotope oxygene', 'thermometre isotopique', 'd18o'],
    'cycles de Milankovitch': ['parametres orbitaux', 'excentricite', 'obliquite', 'precession'],
    'dormance': ['hiver plante', 'bourgeon ferme', 'graine dort'],
    'coévolution': ['evoluent ensemble', 'orchidee darwin'],
    'gènes ABC': ['modele abc', 'arabidopsis', 'developpement floral'],
    'dissémination': ['zoochorie', 'anemochorie', 'hydrochorie', 'graine transportee'],
    'foraminifères': ['test calcaire', 'microfossile'],
    'spectre pollinique': ['diagramme pollinique', 'pollen fossile'],
    'rétroaction': ['boucle amplification', 'effet amplifie'],
  };

  const BADGES = {
    def: 'Définition', tf: 'Vrai ou faux', fill: 'Compléter', list: 'Citer',
    open: 'Expliquer', compare: 'Comparer', bac: 'Question type bac'
  };

  /* ===========================================================================
     MOTEUR DE RECHERCHE
     Comparaison sur du texte normalisé : sans accents, sans ponctuation. Sinon
     « rétroaction » et « retroaction » seraient deux mots différents, ce qui
     est exactement ce qu'un élève tape.
     =========================================================================== */
  const normaliser = (s) => (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

  const mots = (s) => normaliser(s).split(' ').filter(Boolean);

  /* ===========================================================================
     LES DOCUMENTS DE COURS

     Le fichier cours-index.json contient le texte des PDF déposés sur le site,
     découpé en passages. Il est fabriqué depuis la page de gestion et ne
     contient que les documents visibles des élèves : un document masqué n'y
     figure pas, sans quoi son contenu se lirait ici.

     L'assistant ne reformule rien : il retrouve le passage et le cite tel quel,
     avec le lien du document. C'est ce qui garantit qu'il ne peut pas inventer.
     =========================================================================== */
  let DOCS = null, chargementDocs = null;

  function chargerDocs() {
    if (chargementDocs) return chargementDocs;
    chargementDocs = fetch('/cours-index.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { DOCS = (j && Array.isArray(j.docs)) ? j.docs : []; return DOCS; })
      .catch(() => { DOCS = []; return DOCS; });
    return chargementDocs;
  }

  /* Les mots que toutes les questions contiennent n'aident pas à trouver. */
  const VIDES = new Set(('le la les un une des du de et ou est sont a au aux ce cet cette ces ' +
    'que qui quoi quel quelle quels quelles comment pourquoi quand dans sur pour par avec sans ' +
    'son sa ses mon ma mes ton ta tes il elle ils elles on nous vous je tu me te se en y ne pas ' +
    'plus moins tres bien alors donc mais car si tout tous toute toutes meme aussi peut peux ' +
    'dire explique expliquer definition signifie veut').split(' '));

  /* Le niveau de la page, pour préférer les documents de la classe de l'élève. */
  const NIVEAU_PAGE = (function () {
    const f = (location.pathname.split('/').pop() || '').toLowerCase();
    return { '6eme.html': '6e', '5eme.html': '5e', '4eme.html': '4e', '3eme.html': '3e',
             '2nde.html': '2de', '1ere.html': '1re', 'terminale.html': 'Tale' }[f] || '';
  })();

  function chercherDocs(requete) {
    if (!DOCS || !DOCS.length) return [];
    const qm = [...new Set(mots(requete))].filter((w) => w.length > 3 && !VIDES.has(w));
    if (!qm.length) return [];
    const out = [];
    for (const d of DOCS) {
      const titreN = normaliser((d.t || '') + ' ' + (d.c || ''));
      for (const passage of d.p) {
        const pn = normaliser(passage);
        let score = 0, couverts = 0;
        for (const w of qm) {
          let n = 0, i = pn.indexOf(w);
          while (i >= 0 && n < 3) { n++; i = pn.indexOf(w, i + w.length); }
          if (n) { couverts++; score += 6 + (n - 1) * 2; }
          if (titreN.includes(w)) score += 8;
        }
        if (!couverts) continue;
        /* Un passage qui répond à toute la question vaut mieux que deux qui
           n'en couvrent chacun qu'un morceau. */
        score *= couverts / qm.length;
        if (NIVEAU_PAGE && d.n === NIVEAU_PAGE) score += 3;
        out.push({ d, passage, score });
      }
    }
    out.sort((a, b) => b.score - a.score);
    /* Un seul passage par document : deux extraits du même PDF n'apprennent
       pas grand-chose de plus. */
    const vus = new Set(), garde = [];
    for (const r of out) {
      if (vus.has(r.d.h)) continue;
      vus.add(r.d.h); garde.push(r);
      if (garde.length >= 4) break;
    }
    return garde;
  }

  const lienDoc = (d) =>
    `<a class="docsrc" href="/${esc(d.h)}" target="_blank" rel="noopener">`
    + `${esc(d.t)}<span class="ou"> — ${esc(d.c)} · ${esc(d.n)} &#8599;</span></a>`;

  function blocDocs(res, titre) {
    if (!res.length) return '';
    let h = `<p class="titre">${titre}</p>`;
    h += `<p class="extrait">${esc(res[0].passage)}</p>`;
    h += `<div class="docs">${lienDoc(res[0].d)}`;
    for (const r of res.slice(1, 3)) h += lienDoc(r.d);
    h += '</div>';
    return h;
  }

  function chapitresActifs(etat) {
    const out = [];
    for (const [idN, niv] of Object.entries(BASE)) {
      for (const [idC, ch] of Object.entries(niv.chapitres)) {
        if (!Object.keys(ch.notions).length) continue;
        if (etat.actifs[idN + '.' + idC]) out.push({ idN, idC, niv, ch });
      }
    }
    return out;
  }

  function chercher(requete, etat) {
    const q = normaliser(requete), qm = mots(requete);
    const scores = [];
    for (const { ch, idC } of chapitresActifs(etat)) {
      for (const [cle, def] of Object.entries(ch.notions)) {
        const cleN = normaliser(cle);
        const alias = (SYNONYMES[cle] || []).map(normaliser);
        let s = 0;
        if (q === cleN) s += 200;
        else if (q.includes(cleN) && cleN.length > 2) s += 100;
        /* Mots entiers, et non morceaux de mots : l'alias « GES » — gaz à effet
           de serre — se reconnaissait à l'intérieur de « gestes », si bien que
           « les gestes d'hygiène sont-ils efficaces ? » répondait sur le climat
           avec 70 points d'avance. */
        for (const a of alias) {
          if (!a) continue;
          const motif = new RegExp('(^| )' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( |$)');
          if (motif.test(q)) s += 70;
        }
        for (const m of mots(cle)) if (m.length > 2 && qm.includes(m)) s += 14;
        /* Tolérance aux terminaisons. Un élève tape « stomate », le cours dit
           « stomates » : si l'un est le préfixe de l'autre à trois lettres
           près, c'est le même mot et cela doit compter autant qu'un mot exact. */
        for (const m of mots(cle)) {
          for (const w of qm) {
            if (m === w || m.length < 4 || w.length < 4) continue;
            const court = m.length < w.length ? m : w;
            const long = m.length < w.length ? w : m;
            if (long.startsWith(court) && long.length - court.length <= 3) s += 16;
            else if (court.length > 4 && long.startsWith(court.slice(0, 5))) s += 5;
          }
        }
        const defN = normaliser(def);
        let d = 0;
        for (const w of qm) if (w.length > 4 && defN.includes(w)) d++;
        s += Math.min(d, 4) * 2;
        if (s > 0) scores.push({ cle, def, chap: ch.titre, idC, score: s });
      }
    }
    scores.sort((a, b) => b.score - a.score);
    return scores;
  }

  /* ===========================================================================
     RÉPONSES
     =========================================================================== */
  function repondreCours(texte, etat) {
    const actifs = chapitresActifs(etat);
    if (!actifs.length) {
      return { html: "Aucun chapitre n'est encore rempli pour ce niveau. Choisissez un autre chapitre en haut de la fenêtre, ou demandez à Mme Reynes d'ajouter le vôtre." };
    }
    const t = normaliser(texte);

    if (/^(bonjour|salut|coucou|bonsoir|hello|hey)\b/.test(t)) {
      return { html: 'Bonjour ! Posez-moi une question sur le cours : une définition, un mécanisme, une comparaison.' };
    }
    if (/\b(vocabulaire|lexique|liste|tous les mots|sommaire|plan)\b/.test(t)) {
      let h = '<b>Ce que je connais</b>';
      for (const { ch } of actifs) {
        h += `<p class="ch">${esc(ch.titre)}</p><p class="vocab">` +
          Object.keys(ch.notions).map(esc).join(' · ') + '</p>';
      }
      h += '<div class="note">Demandez la définition de n\'importe lequel de ces termes.</div>';
      return { html: h };
    }
    if (/\b(merci|super|parfait|ok merci)\b/.test(t) && t.length < 25) {
      return { html: 'Avec plaisir. Une autre question ?' };
    }

    const res = chercher(texte, etat);
    const docs = chercherDocs(texte);

    /* Ce que Mme Reynes a écrit elle-même passe avant le reste, mais pas à
       n'importe quel prix : « les gestes d'hygiène sont-ils efficaces ? »
       effleurait une notion sans rapport, tout juste au-dessus du seuil, alors
       que l'activité correspondante était trouvée avec un score trois fois
       supérieur. Une notion franche (40 et plus) garde la main ; une notion
       incertaine cède devant un document net. */
    const docNet = docs.length && docs[0].score >= 20;
    if (res.length && res[0].score >= 13 && !(docNet && res[0].score < 40)) {
      const n = res[0];
      let h = `<p class="titre">${esc(maj(n.cle))}</p><p>${esc(n.def)}</p>`;
      const autres = res.slice(1, 4).filter(r => r.score >= 12);
      if (autres.length) {
        h += `<div class="aussi">Voir aussi : ` +
          autres.map(r => `<button class="lien" data-q="${esc(r.cle)}">${esc(r.cle)}</button>`).join(' · ') + '</div>';
      }
      const bons = docs.filter(d => d.score >= 10);
      if (bons.length) {
        h += `<div class="docs">Dans tes documents : ` + bons.slice(0, 3).map(r => lienDoc(r.d)).join('') + '</div>';
      }
      return { html: h };
    }

    /* Rien dans la base écrite, mais un passage net dans les cours : on le cite
       mot pour mot, sans le reformuler, et on donne le document. */
    if (docs.length && docs[0].score >= 9) {
      let h = blocDocs(docs, 'Trouvé dans tes cours');
      h += `<div class="note gris">Ce passage est recopié tel quel du document. `
        + `Ouvre-le pour lire la suite, avec les schémas.</div>`;
      return { html: h };
    }

    /* Rien de sûr : on le dit, et on propose les pistes les plus proches
       plutôt qu'une réponse inventée. */
    let h = `<p>Je ne trouve pas cette notion, ni dans ce que je connais ni dans tes cours.</p>`;
    const proches = res.slice(0, 3).filter(r => r.score > 4);
    if (proches.length) {
      h += `<div class="aussi">Vouliez-vous dire : ` +
        proches.map(r => `<button class="lien" data-q="${esc(r.cle)}">${esc(r.cle)}</button>`).join(' · ') + ' ?</div>';
    } else {
      h += `<div class="note">Tapez <b>vocabulaire</b> pour voir tout ce que je connais.</div>`;
    }
    h += `<div class="note gris">Je ne sais que ce que Mme Reynes a écrit et ce qui se trouve dans les documents du site. Pour le reste, le cours et le manuel font foi.</div>`;
    return { html: h };
  }

  function questionsActives(etat) {
    let qs = [];
    for (const { ch } of chapitresActifs(etat)) {
      qs = qs.concat((ch.questions || []).map(q => ({ ...q, _ch: ch })));
    }
    return qs;
  }

  function poser(etat) {
    const qs = questionsActives(etat);
    if (!qs.length) return { html: "Aucune question disponible pour ce chapitre." };
    let pool = etat.serie < 3 ? qs.filter(q => ['def', 'tf', 'fill'].includes(q.type))
      : etat.serie < 6 ? qs.filter(q => q.type !== 'bac') : qs;
    if (!pool.length) pool = qs;
    /* On mélange une fois par série pour ne pas reposer toujours le même ordre. */
    if (!etat.ordre || etat.ordre.length !== pool.length) {
      etat.ordre = pool.map((_, i) => i).sort(() => Math.random() - 0.5);
      etat.curseur = 0;
    }
    const q = pool[etat.ordre[etat.curseur % etat.ordre.length]];
    etat.curseur++;
    etat.question = q;
    etat.attente = true;
    return { html: `<p class="badge">${BADGES[q.type] || 'Question'}</p><p class="q">${esc(q.q)}</p>` };
  }

  function corriger(reponse, etat) {
    const q = etat.question;
    etat.attente = false;
    const a = normaliser(reponse);
    let juste = false, h = '';

    if (q.type === 'tf') {
      const attendu = normaliser(q.r);
      juste = (attendu === 'vrai' && /\b(vrai|oui|exact)\b/.test(a)) ||
              (attendu === 'faux' && /\b(faux|non|incorrect)\b/.test(a));
      h = juste ? `<p class="ok">Correct.</p>` : `<p class="ko">Non.</p>`;
      if (q.expl) h += `<p>${esc(q.expl)}</p>`;
    } else if (q.type === 'fill') {
      const cles = mots(q.r);
      const trouves = cles.filter(k => a.includes(k));
      juste = trouves.length >= Math.ceil(cles.length / 2);
      h = juste ? `<p class="ok">Bien.</p>`
                : `<p class="ko">Incomplet.</p><p>Attendu : <b>${esc(q.r)}</b></p>`;
    } else {
      const def = trouverDef(q.r, etat);
      const cles = mots(q.r).filter(w => w.length > 3);
      const defMots = [...new Set(mots(def))].filter(w => w.length > 5).slice(0, 14);
      const tous = [...new Set([...cles, ...defMots])];
      const trouves = tous.filter(k => a.includes(k));
      const part = trouves.length / Math.max(tous.length * 0.30, 1);
      if (a.length < 8) { h = `<p class="ko">Réponse trop courte pour être évaluée.</p>`; }
      else if (part >= 1) { juste = true; h = `<p class="ok">Bonne réponse.</p>`; }
      else if (part >= 0.45) { h = `<p class="partiel">Réponse partielle — il manque des termes.</p>`; }
      else { h = `<p class="ko">Incomplet.</p>`; }
      if (def) h += `<p class="titre">${esc(maj(q.r))}</p><p>${esc(def)}</p>`;
      h += `<div class="note gris">Correction automatique par mots-clés : elle repère le vocabulaire, pas la qualité du raisonnement. Votre professeure reste le juge.</div>`;
    }

    etat.serie = juste ? etat.serie + 1 : 0;
    h += `<p class="serie">Série : ${etat.serie}${etat.serie >= 6 ? ' · niveau 3' : etat.serie >= 3 ? ' · niveau 2' : ''}</p>`;
    return { html: h, suite: true };
  }

  function trouverDef(cle, etat) {
    for (const { ch } of chapitresActifs(etat)) if (ch.notions[cle]) return ch.notions[cle];
    for (const niv of Object.values(BASE))
      for (const ch of Object.values(niv.chapitres)) if (ch.notions[cle]) return ch.notions[cle];
    return '';
  }

  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const maj = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  /* ===========================================================================
     INTERFACE
     Tout vit dans un Shadow DOM : les styles du site ne peuvent pas déteindre
     sur la bulle, et la bulle ne peut rien casser dans les pages.
     =========================================================================== */
  const CSS = `
:host{ all:initial }
*{ box-sizing:border-box; margin:0; padding:0; font-family:'Onest',system-ui,-apple-system,'Segoe UI',sans-serif }
button{ font:inherit; cursor:pointer; border:none; background:none; color:inherit }

.bulle{ position:fixed; right:1.25rem; bottom:1.25rem; z-index:2147483000;
  width:3.5rem; height:3.5rem; border-radius:999px; background:#0a0a0a; color:#fff;
  display:grid; place-items:center; box-shadow:0 6px 24px rgba(0,0,0,.28);
  transition:transform .2s cubic-bezier(.2,.8,.2,1), background .2s }
.bulle:hover{ transform:translateY(-2px); background:#252525 }
.bulle:focus-visible{ outline:3px solid #cf8047; outline-offset:3px }
.bulle svg{ width:1.6rem; height:1.6rem }
.bulle .pastille{ position:absolute; top:-.15rem; right:-.15rem; width:1rem; height:1rem;
  border-radius:999px; background:#cf8047; border:2px solid #fff }

.vol{ position:fixed; right:1.25rem; bottom:1.25rem; z-index:2147483000;
  width:min(24rem,calc(100vw - 2.5rem)); height:min(34rem,calc(100vh - 2.5rem));
  background:#fbfaf8; border-radius:1.25rem; overflow:hidden; display:flex; flex-direction:column;
  box-shadow:0 18px 50px rgba(0,0,0,.24), 0 0 0 1px rgba(0,0,0,.07);
  transform-origin:bottom right; animation:ouvre .22s cubic-bezier(.2,.8,.2,1) }
@keyframes ouvre{ from{ opacity:0; transform:translateY(12px) scale(.97) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .vol,.bulle{ animation:none; transition:none } }
/* Format agrandi : utile pour une question longue, une correction detaillee
   ou simplement pour lire confortablement une definition. */
.vol.grand{ width:min(52rem,calc(100vw - 2.5rem)); height:min(46rem,calc(100vh - 2.5rem)) }
.vol.grand .b{ max-width:min(46rem,72%); font-size:.9rem }
.vol.grand .fil{ padding:1.15rem 1.4rem }
@media (max-width:480px){
  .vol, .vol.grand{ right:.5rem; bottom:.5rem; width:calc(100vw - 1rem); height:calc(100vh - 1rem) }
  .vol.grand .b{ max-width:84% }
}

header{ background:#0a0a0a; color:#fff; padding:.85rem 1rem; display:flex; align-items:center; gap:.7rem; flex:none }
header .ic{ width:1.9rem; height:1.9rem; border-radius:999px; background:#1d1d1d; display:grid; place-items:center; flex:none }
header .ic svg{ width:1.05rem; height:1.05rem; color:#cf8047 }
header .t{ flex:1; min-width:0 }
header .t b{ display:block; font-size:.88rem; font-weight:600; letter-spacing:-.01em }
header .t span{ display:block; font-size:.68rem; color:rgba(255,255,255,.62); margin-top:.1rem }
header button{ width:1.9rem; height:1.9rem; border-radius:999px; display:grid; place-items:center;
  color:rgba(255,255,255,.75) }
header button:hover{ background:rgba(255,255,255,.13); color:#fff }
header button:focus-visible{ outline:2px solid #cf8047; outline-offset:2px }
header button svg{ width:1rem; height:1rem }

.onglets{ display:flex; background:#fff; border-bottom:1px solid #e6e2da; flex:none }
.onglets button{ flex:1; padding:.6rem .5rem; font-size:.78rem; font-weight:500; color:#6b6459;
  border-bottom:2px solid transparent }
.onglets button[aria-selected="true"]{ color:#111; border-bottom-color:#cf8047 }
.onglets button:focus-visible{ outline:2px solid #cf8047; outline-offset:-2px }

.chapitres{ display:flex; flex-wrap:wrap; gap:.3rem; padding:.55rem .75rem; background:#fff;
  border-bottom:1px solid #e6e2da; flex:none }
.chapitres button{ font-size:.68rem; padding:.22rem .6rem; border-radius:999px;
  border:1px solid #ddd8ce; color:#6b6459; background:#fff }
.chapitres button[aria-pressed="true"]{ background:#1d2b20; border-color:#1d2b20; color:#fff }
.chapitres button:focus-visible{ outline:2px solid #cf8047; outline-offset:1px }

.fil{ flex:1; overflow-y:auto; padding:.9rem; display:flex; flex-direction:column; gap:.7rem }
.fil::-webkit-scrollbar{ width:6px }
.fil::-webkit-scrollbar-thumb{ background:#d8d3c9; border-radius:9px }
.m{ display:flex; gap:.5rem; align-items:flex-start }
.m.moi{ flex-direction:row-reverse }
.av{ width:1.55rem; height:1.55rem; border-radius:999px; flex:none; display:grid; place-items:center;
  font-size:.58rem; font-weight:600; margin-top:.1rem }
.av.bot{ background:#1d2b20; color:#8fd6a4 }
.av.moi{ background:#e8e4dc; color:#5c574f }
.b{ max-width:84%; padding:.6rem .8rem; border-radius:.85rem; font-size:.82rem; line-height:1.6; color:#221f1b }
.m.bot .b{ background:#fff; border:1px solid #e6e2da; border-top-left-radius:.2rem }
.m.moi .b{ background:#1d2b20; color:#eaf3e2; border-top-right-radius:.2rem }
.b p+p{ margin-top:.5rem }
.b .titre{ font-weight:600; color:#8a4519 }
.b .q{ font-size:.88rem; line-height:1.55 }
.b .badge{ font-size:.62rem; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#8a7e6d }
.b .ch{ font-weight:600; margin-top:.6rem; font-size:.78rem }
.b .vocab{ font-size:.76rem; color:#4a453d; line-height:1.75 }
.b .ok{ color:#2f6b45; font-weight:600 }
.b .ko{ color:#a32c2c; font-weight:600 }
.b .partiel{ color:#8a5a12; font-weight:600 }
.b .serie{ margin-top:.5rem; font-size:.7rem; color:#8a7e6d }
.b .note{ margin-top:.55rem; padding:.45rem .6rem; background:#f3efe7; border-left:2px solid #cf8047;
  border-radius:0 .4rem .4rem 0; font-size:.74rem; line-height:1.5; color:#4a453d }
.b .note.gris{ border-left-color:#c9c2b5; color:#6b6459 }
.b .aussi{ margin-top:.55rem; font-size:.75rem; color:#6b6459 }
.b .extrait{ margin-top:.35rem; padding:.5rem .7rem; border-left:2px solid #cf8047;
  background:#fbf8f3; font-size:.8rem; line-height:1.6; color:#3a352e }
.b .docs{ margin-top:.55rem; font-size:.75rem; color:#6b6459; display:flex;
  flex-direction:column; gap:.3rem }
.b .docs .docsrc{ display:block; color:#8a4519; font-weight:500; text-decoration:none;
  line-height:1.4 }
.b .docs .docsrc:hover{ text-decoration:underline }
.b .docs .docsrc .ou{ color:#8a8378; font-weight:400 }
.b .lien{ color:#8a4519; text-decoration:underline; text-underline-offset:2px; font-size:.75rem }
.b .lien:hover{ color:#111 }
.points span{ display:inline-block; width:.35rem; height:.35rem; border-radius:999px; background:#8fb99a;
  margin-right:.2rem; animation:saut 1.1s infinite }
.points span:nth-child(2){ animation-delay:.16s } .points span:nth-child(3){ animation-delay:.32s }
@keyframes saut{ 0%,60%,100%{ transform:none; opacity:.4 } 30%{ transform:translateY(-4px); opacity:1 } }

.puces{ display:flex; gap:.3rem; flex-wrap:wrap; padding:0 .9rem .5rem; flex:none }
.puces button{ font-size:.7rem; padding:.28rem .65rem; border-radius:999px; border:1px solid #ddd8ce;
  color:#5c574f; background:#fff }
.puces button:hover{ border-color:#cf8047; color:#8a4519 }
.puces button:focus-visible{ outline:2px solid #cf8047; outline-offset:1px }

.saisie{ display:flex; gap:.4rem; padding:.6rem .75rem .75rem; border-top:1px solid #e6e2da;
  background:#fff; flex:none; align-items:flex-end }
.saisie textarea{ flex:1; resize:none; font-size:.82rem; line-height:1.5; padding:.55rem .7rem;
  border:1px solid #ddd8ce; border-radius:.7rem; background:#fbfaf8; color:#111;
  min-height:2.4rem; max-height:6rem; outline:none }
.saisie textarea:focus{ border-color:#cf8047 }
.saisie button{ width:2.4rem; height:2.4rem; border-radius:.7rem; background:#0a0a0a; color:#fff;
  display:grid; place-items:center; flex:none }
.saisie button:hover{ background:#2a2a2a }
.saisie button:focus-visible{ outline:2px solid #cf8047; outline-offset:2px }
.saisie button svg{ width:1rem; height:1rem }

.pied{ font-size:.63rem; color:#8a7e6d; text-align:center; padding:0 .75rem .55rem; background:#fff; flex:none }
`;

  const ICONE_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>';
  const ICONE_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICONE_GRAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5M4 4l6 6M15 20h5v-5M20 20l-6-6"/></svg>';
  const ICONE_PETIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h5V4M9 9 3 3M20 15h-5v5M15 15l6 6"/></svg>';
  const ICONE_ENV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';

  const ACCUEIL = {
    cours: {
      msg: "<p>Bonjour, je m'appelle Terra. Je réponds à vos questions sur le cours : une définition, un mécanisme, une comparaison.</p><div class='note'>Je ne connais que ce que Mme Reynes a écrit et les documents déposés sur le site — je ne cherche pas sur internet et je n'invente rien.</div>",
      puces: ["Qu'est-ce que l'albédo ?", 'Xylème ou phloème ?', 'Explique la dormance', 'Vocabulaire']
    },
    revisions: {
      msg: "<p>Je vous interroge comme en classe. Les questions deviennent plus longues à mesure que vous enchaînez les bonnes réponses.</p><div class='note'>Tapez <b>go</b> pour commencer.</div>",
      puces: ['Go', 'Vocabulaire']
    }
  };

  function demarrer() {
    if (document.getElementById('assistant-svt')) return;

    const hote = document.createElement('div');
    hote.id = 'assistant-svt';
    const ombre = hote.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    ombre.appendChild(style);
    document.body.appendChild(hote);

    const etat = {
      mode: 'cours', serie: 0, question: null, attente: false,
      ordre: null, curseur: 0, actifs: {}, ouvert: false
    };
    /* Par défaut, tous les chapitres remplis sont actifs. */
    for (const [idN, niv] of Object.entries(BASE))
      for (const [idC, ch] of Object.entries(niv.chapitres))
        if (Object.keys(ch.notions).length) etat.actifs[idN + '.' + idC] = true;

    const rempli = Object.keys(etat.actifs).length;

    const bulle = document.createElement('button');
    bulle.className = 'bulle';
    bulle.setAttribute('aria-label', "Ouvrir l'assistant de révision SVT");
    bulle.innerHTML = ICONE_CHAT + '<span class="pastille"></span>';
    ombre.appendChild(bulle);

    let vol = null;

    bulle.addEventListener('click', ouvrir);

    function ouvrir() {
      if (vol) return;
      bulle.style.display = 'none';
      vol = document.createElement('div');
      vol.className = 'vol';
      vol.setAttribute('role', 'dialog');
      vol.setAttribute('aria-label', 'Terra, assistant de révision SVT');
      vol.innerHTML = `
        <header>
          <span class="ic">${ICONE_CHAT}</span>
          <span class="t"><b>Terra</b><span data-soustitre>Cours et documents — hors ligne</span></span>
          <button class="taille" aria-label="Agrandir la fenêtre" aria-pressed="false">${ICONE_GRAND}</button>
          <button class="fermer" aria-label="Fermer Terra">${ICONE_X}</button>
        </header>
        <div class="onglets" role="tablist">
          <button role="tab" data-mode="cours" aria-selected="true">Cours</button>
          <button role="tab" data-mode="revisions" aria-selected="false">Révisions</button>
        </div>
        <div class="chapitres"></div>
        <div class="fil" aria-live="polite"></div>
        <div class="puces"></div>
        <div class="saisie">
          <textarea rows="1" placeholder="Votre question…" aria-label="Votre question"></textarea>
          <button class="envoyer" aria-label="Envoyer">${ICONE_ENV}</button>
        </div>
        <p class="pied">Réponses issues du cours de Mme Reynes. En cas de doute, le cours fait foi.</p>`;
      /* L'accueil annonce ce que Terra peut vraiment faire ici : sur un niveau
         dont aucun document n'est en ligne, promettre de citer les cours serait
         une promesse en l'air. */
      chargerDocs().then((liste) => {
        const n = (liste || []).filter((d) => !NIVEAU_PAGE || d.n === NIVEAU_PAGE).length;
        const st = vol.querySelector('[data-soustitre]');
        if (st) st.textContent = n
          ? `${n} document${n > 1 ? 's' : ''} de cours — hors ligne`
          : 'Cours — hors ligne';
      });
      ombre.appendChild(vol);

      const fil = vol.querySelector('.fil');
      const zone = vol.querySelector('textarea');
      const puces = vol.querySelector('.puces');

      /* La préférence de taille tient dans le navigateur de l'élève : elle ne
         quitte pas son appareil, et le stockage peut être refusé sans casser
         quoi que ce soit — d'où le try. */
      const CLE_TAILLE = 'assistantSvtGrand';
      let grand = false;
      try { grand = localStorage.getItem(CLE_TAILLE) === '1'; } catch (e) { }
      const btnTaille = vol.querySelector('.taille');
      appliquerTaille();

      function appliquerTaille() {
        vol.classList.toggle('grand', grand);
        btnTaille.innerHTML = grand ? ICONE_PETIT : ICONE_GRAND;
        btnTaille.setAttribute('aria-pressed', String(grand));
        btnTaille.setAttribute('aria-label', grand ? 'Réduire la fenêtre' : 'Agrandir la fenêtre');
        fil.scrollTop = fil.scrollHeight;
      }
      btnTaille.addEventListener('click', () => {
        grand = !grand;
        try { localStorage.setItem(CLE_TAILLE, grand ? '1' : '0'); } catch (e) { }
        appliquerTaille();
      });

      vol.querySelector('.fermer').addEventListener('click', fermer);
      vol.querySelectorAll('[data-mode]').forEach(b =>
        b.addEventListener('click', () => changerMode(b.dataset.mode)));
      vol.querySelector('.envoyer').addEventListener('click', envoyer);
      zone.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); }
      });
      zone.addEventListener('input', () => {
        zone.style.height = 'auto';
        zone.style.height = Math.min(zone.scrollHeight, 96) + 'px';
      });
      document.addEventListener('keydown', echap);

      dessinerChapitres();
      changerMode('cours');
      setTimeout(() => zone.focus(), 60);

      function echap(e) { if (e.key === 'Escape' && vol) fermer(); }

      function fermer() {
        document.removeEventListener('keydown', echap);
        vol.remove(); vol = null;
        bulle.style.display = '';
        bulle.focus();
      }

      function dessinerChapitres() {
        const c = vol.querySelector('.chapitres');
        c.innerHTML = '';
        if (!rempli) { c.style.display = 'none'; return; }
        for (const [idN, niv] of Object.entries(BASE)) {
          for (const [idC, ch] of Object.entries(niv.chapitres)) {
            if (!Object.keys(ch.notions).length) continue;
            const id = idN + '.' + idC;
            const b = document.createElement('button');
            b.textContent = ch.titre.length > 26 ? ch.titre.slice(0, 24) + '…' : ch.titre;
            b.title = niv.nom + ' — ' + ch.titre;
            b.setAttribute('aria-pressed', String(!!etat.actifs[id]));
            b.addEventListener('click', () => {
              const restants = Object.values(etat.actifs).filter(Boolean).length;
              if (etat.actifs[id] && restants <= 1) return;  // au moins un chapitre actif
              etat.actifs[id] = !etat.actifs[id];
              b.setAttribute('aria-pressed', String(etat.actifs[id]));
              etat.ordre = null;
            });
            c.appendChild(b);
          }
        }
      }

      function changerMode(m) {
        etat.mode = m; etat.serie = 0; etat.question = null;
        etat.attente = false; etat.ordre = null; etat.curseur = 0;
        vol.querySelectorAll('[data-mode]').forEach(b =>
          b.setAttribute('aria-selected', String(b.dataset.mode === m)));
        fil.innerHTML = '';
        if (!rempli) {
          bot("<p>La base de révision n'est pas encore remplie pour ce niveau.</p><div class='note'>Les chapitres de Terminale arrivent en premier ; les autres suivront. En attendant, les cours et les documents sont en ligne sur le site.</div>");
          puces.innerHTML = '';
          return;
        }
        bot(ACCUEIL[m].msg);
        dessinerPuces(ACCUEIL[m].puces);
      }

      function dessinerPuces(arr) {
        puces.innerHTML = '';
        (arr || []).forEach(t => {
          const b = document.createElement('button');
          b.textContent = t;
          b.addEventListener('click', () => { zone.value = t; envoyer(); });
          puces.appendChild(b);
        });
      }

      function bot(html) {
        const d = document.createElement('div');
        d.className = 'm bot';
        d.innerHTML = `<span class="av bot">IA</span><div class="b">${html}</div>`;
        d.querySelectorAll('.lien').forEach(l =>
          l.addEventListener('click', () => { zone.value = l.dataset.q; envoyer(); }));
        fil.appendChild(d); fil.scrollTop = fil.scrollHeight;
      }

      function moi(texte) {
        const d = document.createElement('div');
        d.className = 'm moi';
        d.innerHTML = `<span class="av moi">Moi</span><div class="b">${esc(texte)}</div>`;
        fil.appendChild(d); fil.scrollTop = fil.scrollHeight;
      }

      /* Chargé à la première ouverture, pas au chargement de la page : le
         fichier pèse quelques centaines de kilo-octets et la plupart des
         visiteurs n'ouvriront jamais l'assistant. */
      chargerDocs();

      function attendre() {
        const d = document.createElement('div');
        d.className = 'm bot'; d.dataset.attente = '1';
        d.innerHTML = `<span class="av bot">IA</span><div class="b points"><span></span><span></span><span></span></div>`;
        fil.appendChild(d); fil.scrollTop = fil.scrollHeight;
      }
      function finAttente() {
        const d = fil.querySelector('[data-attente]');
        if (d) d.remove();
      }

      function envoyer() {
        const texte = zone.value.trim();
        if (!texte) return;
        zone.value = ''; zone.style.height = '';
        moi(texte);
        puces.innerHTML = '';
        attendre();
        setTimeout(() => {
          finAttente();
          let r;
          if (etat.mode === 'revisions') {
            const t = normaliser(texte);
            if (/^(go|commencer|c est parti|demarrer)\b/.test(t)) r = poser(etat);
            else if (/\b(vocabulaire|lexique|liste)\b/.test(t)) r = repondreCours(texte, etat);
            else if (etat.attente && etat.question) r = corriger(texte, etat);
            else r = poser(etat);
          } else {
            r = repondreCours(texte, etat);
          }
          bot(r.html);
          if (r.suite) setTimeout(() => { if (vol) bot(poser(etat).html); }, 700);
          else if (etat.mode === 'cours') dessinerPuces(['Vocabulaire']);
        }, 280);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
