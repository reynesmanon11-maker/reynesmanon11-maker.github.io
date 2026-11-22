// ============================================================
// Cabinet des curiosités — LES TEXTES (questions, fiches, indices)
// ============================================================
// C'est le seul endroit où l'on corrige les textes du cabinet.
// La version légère (outils/cabinet_curiosites.html) relit ce fichier
// quand elle est ouverte en ligne ; elle en garde aussi une copie pour
// fonctionner hors connexion, remise à jour par « node synchroniser.mjs »
// (dans outils/cabinet/). Un test signale quand cette copie est en retard.
//
// Une entrée = un objet que l'on peut saisir.
//   id      identifiant unique : il relie l'entrée à son modèle 3D et à sa
//           place dans la pièce. Ne pas le changer.
//   nom, latin, emoji, regne : ce qu'affiche la fiche.
//   ou      l'indice donné dans le carnet tant que l'objet n'est pas trouvé.
//   desc    ce que l'élève lit en prenant l'objet en main.
//   savais  le « Le savais-tu ? ».
//   mots    les mots-clés à retenir.
//   college / lycee : la question de chaque niveau.
//     q       la question
//     choix   les réponses proposées ; LA BONNE EST TOUJOURS LA PREMIÈRE
//             (l'ordre est mélangé à l'affichage).
//     expl    l'explication, montrée après la réponse, juste ou non.
//     prog    le lien au programme.
//
// Pour corriger : modifier le texte entre les guillemets droits "…".
// Apostrophes et guillemets « » se tapent librement ; seul le guillemet
// droit " est interdit à l'intérieur d'un texte.
// Ajouter un objet demande aussi un modèle 3D et une place : à faire avec
// Claude Code, pas seulement ici.

export const CURIOSITES = [
  {
    id: "pinsons",
    nom: "Pinsons de Darwin",
    latin: "Geospiza magnirostris, G. fortis, Certhidea olivacea",
    emoji: "🐦",
    regne: "Animal · Oiseaux",
    ou: "Sous une cloche de verre, sur le guéridon près de la vitrine",
    desc: "Trois oiseaux rapportés des îles Galápagos en 1835. Même taille, même plumage terne… mais des becs très différents : massif pour broyer les graines dures, moyen, ou fin comme une pince pour attraper les insectes.",
    savais: "Darwin les avait pris pour des oiseaux de familles différentes. C’est l’ornithologue John Gould qui lui montra, en 1837, qu’ils étaient tous proches parents. Ce ne sont d’ailleurs pas de vrais pinsons, mais des tangaras.",
    mots: ["variation héréditaire", "sélection naturelle", "adaptation", "pression de sélection"],
    college: {
      q: "Pourquoi ces oiseaux, proches parents, ont-ils des becs si différents ?",
      choix: [
        "Chaque forme de bec convient à une nourriture : sur chaque île, les oiseaux au bec le mieux adapté ont survécu et eu plus de petits.",   // ← la bonne réponse
        "Chaque oiseau a modelé son bec au cours de sa vie, à force de s’en servir.",
        "Ils n’ont aucun lien de parenté : la ressemblance du plumage est un hasard.",
        "Le bec pousse plus ou moins selon la quantité de nourriture mangée."
      ],
      expl: "Dans une population, la forme du bec varie d’un individu à l’autre, et ce caractère est héréditaire. Là où il n’y a que des graines dures, les oiseaux à gros bec se nourrissent mieux, survivent davantage et transmettent ce caractère : c’est la sélection naturelle. Un caractère acquis pendant la vie, lui, ne se transmet pas.",
      prog: "Cycle 4 — Le vivant et son évolution : diversité, parenté et sélection naturelle"
    },
    lycee: {
      q: "En 1977, une sécheresse sur l’île Daphné Majeure ne laisse que des graines grosses et dures. L’année suivante, le bec moyen de la population de Geospiza fortis est plus épais. Quelle explication retenir ?",
      choix: [
        "Les individus à bec épais, déjà présents, ont mieux survécu et se sont davantage reproduits : la fréquence du caractère a augmenté.",   // ← la bonne réponse
        "La sécheresse a provoqué chez les oiseaux des mutations qui épaississent le bec.",
        "Chaque oiseau a épaissi son bec en forçant sur les graines dures, puis l’a transmis.",
        "C’est un effet de la dérive génétique : le hasard seul explique ce changement."
      ],
      expl: "La variation existait avant la sécheresse : les mutations surviennent au hasard, elles ne sont pas provoquées par le besoin. Le milieu a trié les individus (pression de sélection) et, l’épaisseur du bec étant héréditaire, la génération suivante en a hérité. Un changement aussi net, dans le sens prévisible, en une génération, n’est pas l’œuvre du seul hasard.",
      prog: "2nde — Biodiversité, résultat et étape de l’évolution : la sélection naturelle"
    }
  },
  {
    id: "phalene",
    nom: "Phalène du bouleau",
    latin: "Biston betularia",
    emoji: "🦋",
    regne: "Animal · Insectes (papillon de nuit)",
    ou: "Dans un cadre accroché entre les deux fenêtres",
    desc: "Une boîte d’entomologiste : la même espèce de papillon de nuit sous deux formes, claire (typica) et sombre (carbonaria), posées sur deux écorces. L’une est couverte de lichens clairs, l’autre noircie par la suie des usines.",
    savais: "La forme sombre est due à une seule mutation d’un gène, apparue vers 1819 en Angleterre. Elle était rarissime avant que la suie ne noircisse les troncs.",
    mots: ["camouflage", "prédation", "sélection naturelle", "fréquence d’un caractère"],
    college: {
      q: "Au XIXᵉ siècle, près de Manchester, les troncs sont noircis par la suie. Quelle forme devient la plus fréquente ?",
      choix: [
        "La forme sombre : sur un tronc noirci, elle est moins repérée par les oiseaux qui chassent à vue.",   // ← la bonne réponse
        "La forme claire : elle se voit mieux et attire davantage de partenaires.",
        "Aucune : la suie tue toutes les phalènes de la même façon.",
        "La forme sombre, parce que la suie colore les ailes des papillons."
      ],
      expl: "Les deux formes existent déjà dans la population. Sur un fond sombre, les papillons sombres sont moins mangés : ils survivent mieux et laissent plus de descendants. En quelques dizaines d’années, la forme sombre est devenue majoritaire autour des villes industrielles. La suie ne colore pas les ailes : la couleur est héréditaire.",
      prog: "Cycle 4 — Le vivant et son évolution : la sélection naturelle"
    },
    lycee: {
      q: "Depuis les lois contre la pollution de l’air (à partir de 1956), la forme sombre est redevenue rare. Qu’est-ce que cela montre ?",
      choix: [
        "L’avantage d’un caractère dépend du milieu : quand le milieu change, la pression de sélection s’inverse.",   // ← la bonne réponse
        "Les phalènes sombres ont appris à s’éclaircir pour rester camouflées.",
        "La pollution provoquait directement la mutation sombre ; sans pollution, elle n’apparaît plus.",
        "La forme sombre était une maladie, guérie par l’air pur."
      ],
      expl: "Un caractère n’est pas « meilleur » dans l’absolu : il l’est dans un environnement donné. Les troncs redevenus clairs avantagent à nouveau la forme claire. La mutation sombre peut toujours apparaître au hasard, mais les oiseaux repèrent et mangent davantage les papillons qui la portent.",
      prog: "2nde — Biodiversité : sélection naturelle et pression du milieu"
    }
  },
  {
    id: "tortue",
    nom: "Carapace de tortue géante",
    latin: "Chelonoidis sp. — îles Galápagos",
    emoji: "🐢",
    regne: "Animal · Reptiles (tortues)",
    ou: "Sur le coffre, près de la porte de la serre",
    desc: "Le vice-gouverneur des Galápagos affirmait à Darwin qu’il savait dire de quelle île venait une tortue rien qu’à sa carapace. Sur les îles humides, elle est bombée en dôme ; sur les îles sèches, comme celle-ci, elle est relevée à l’avant, « en selle ».",
    savais: "« George le Solitaire », dernier représentant connu de l’île de Pinta, est mort en 2012 : son espèce a disparu avec lui.",
    mots: ["adaptation", "isolement géographique", "spéciation", "dérive génétique"],
    college: {
      q: "Sur les îles sèches, la nourriture principale est un cactus dont les raquettes poussent en hauteur. Quel avantage donne la carapace relevée « en selle » ?",
      choix: [
        "Elle permet de tendre le cou vers le haut pour atteindre les raquettes de cactus.",   // ← la bonne réponse
        "Elle protège mieux de la chaleur du soleil.",
        "Elle rend la tortue plus légère pour nager d’une île à l’autre.",
        "Aucun : la forme de la carapace est sans rapport avec le mode de vie."
      ],
      expl: "Une carapace échancrée à l’avant libère le cou : la tortue peut se dresser et brouter haut. Sur ces îles, les tortues qui atteignaient la nourriture ont mieux survécu et se sont davantage reproduites : c’est une adaptation au milieu, produite par la sélection naturelle.",
      prog: "Cycle 4 — Le vivant et son évolution : adaptation au milieu"
    },
    lycee: {
      q: "Les tortues de chaque île vivent séparées par la mer et ne se reproduisent plus entre elles. Que se passe-t-il au fil des générations ?",
      choix: [
        "Chaque population évolue de son côté (mutations, sélection, dérive) : elles divergent jusqu’à pouvoir former des espèces distinctes.",   // ← la bonne réponse
        "Elles restent identiques, puisqu’elles descendent des mêmes ancêtres.",
        "Elles finissent par se ressembler, puisqu’elles vivent sous le même climat.",
        "Elles deviennent toutes stériles, faute de partenaires."
      ],
      expl: "L’isolement géographique empêche les échanges de gènes. Les mutations, la sélection naturelle et la dérive génétique agissent alors indépendamment dans chaque population : les différences s’accumulent. Quand les populations ne peuvent plus se reproduire entre elles, on parle de nouvelles espèces : c’est la spéciation.",
      prog: "Lycée — Biodiversité et évolution : isolement, dérive génétique, spéciation"
    }
  },
  {
    id: "nautile",
    nom: "Nautile",
    latin: "Nautilus pompilius",
    emoji: "🐚",
    regne: "Animal · Mollusques (céphalopodes)",
    ou: "Dans la vitrine, sur l’étagère du haut",
    desc: "Une coquille enroulée en spirale, cloisonnée à l’intérieur en une trentaine de chambres. L’animal vit dans la dernière, la plus grande ; il règle la quantité de gaz et de liquide des autres pour monter ou descendre dans l’eau.",
    savais: "Le nautile porte jusqu’à 90 tentacules, mais aucune ventouse. Il vit le plus souvent entre 150 et 300 m de profondeur, dans l’océan Indien et le Pacifique.",
    mots: ["mollusque", "céphalopode", "attributs partagés", "ancêtre commun"],
    college: {
      q: "À quel groupe appartient le nautile ?",
      choix: [
        "Aux mollusques, comme l’escargot, la moule et la pieuvre.",   // ← la bonne réponse
        "Aux crustacés, comme le crabe, puisqu’il a une coquille dure.",
        "Aux poissons, puisqu’il vit dans la mer.",
        "À aucun groupe vivant : c’est une pierre en forme de spirale."
      ],
      expl: "On classe un être vivant d’après les attributs qu’il partage avec d’autres, pas d’après son milieu de vie. Le nautile a un corps mou, un manteau qui fabrique la coquille et des tentacules autour de la tête : c’est un mollusque, dans le même groupe que la pieuvre et le calmar (les céphalopodes). Le crabe, lui, a un squelette externe articulé.",
      prog: "Cycle 4 — Classer les êtres vivants d’après les attributs partagés"
    },
    lycee: {
      q: "La coquille cloisonnée du nautile ressemble à celle des ammonites fossiles. Comment interpréter cette ressemblance ?",
      choix: [
        "Nautiles et ammonites ont hérité ce caractère d’un ancêtre commun, un céphalopode à coquille cloisonnée.",   // ← la bonne réponse
        "Le nautile descend des ammonites, qui se sont transformées en nautiles.",
        "C’est une simple coïncidence de forme, sans lien de parenté.",
        "Les ammonites descendent du nautile actuel."
      ],
      expl: "Une espèce actuelle ne descend ni d’une autre espèce actuelle, ni d’un fossile précis : on cherche l’ancêtre commun. Les premiers céphalopodes à coquille cloisonnée datent d’environ 500 millions d’années, bien avant les ammonites ; nautiles et ammonites en sont deux branches.",
      prog: "Lycée — Parentés et évolution : la notion d’ancêtre commun"
    }
  },
  {
    id: "ammonite",
    nom: "Ammonite",
    latin: "Céphalopode fossile du Jurassique",
    emoji: "🪨",
    regne: "Fossile · Mollusques disparus",
    ou: "Dans la vitrine, sur l’étagère du milieu",
    desc: "Une coquille spiralée devenue pierre. Les ammonites ont peuplé les mers pendant plus de 300 millions d’années, avant de disparaître il y a 66 millions d’années, en même temps que les grands dinosaures.",
    savais: "Leur nom vient du dieu égyptien Amon, représenté avec des cornes de bélier enroulées. En Angleterre, on les appelait autrefois « pierres de serpent ».",
    mots: ["fossile", "fossile stratigraphique", "datation relative", "extinction"],
    college: {
      q: "Qu’est-ce qu’une ammonite ?",
      choix: [
        "Le reste d’un animal marin disparu, conservé dans une roche : un fossile.",   // ← la bonne réponse
        "Une roche qui a pris par hasard la forme d’une coquille.",
        "Un serpent enroulé changé en pierre.",
        "Une coquille d’escargot de jardin récente."
      ],
      expl: "Après la mort de l’animal, sa coquille est enfouie dans les sédiments du fond de la mer ; au fil des millions d’années, elle est moulée ou remplacée par des minéraux. Trouver une ammonite dans une roche, c’est savoir que la mer recouvrait autrefois cet endroit.",
      prog: "Cycle 4 — La Terre et le vivant : les fossiles, témoins des mondes passés"
    },
    lycee: {
      q: "Pourquoi les ammonites sont-elles d’excellents fossiles stratigraphiques ?",
      choix: [
        "Chaque espèce a existé peu de temps, mais était abondante et répandue sur de vastes régions.",   // ← la bonne réponse
        "Elles ont vécu sans changer pendant des centaines de millions d’années.",
        "On peut mesurer leur âge exact grâce au carbone 14.",
        "Elles ne se trouvent que dans une seule région du monde."
      ],
      expl: "Un bon fossile stratigraphique appartient à une espèce de courte durée, nombreuse et répandue sur une grande étendue. Deux couches éloignées qui contiennent la même espèce d’ammonite ont donc le même âge : c’est le principe d’identité paléontologique, base de la datation relative. Le carbone 14, lui, ne date que les derniers ~50 000 ans.",
      prog: "Lycée — Datation relative : les fossiles stratigraphiques"
    }
  },
  {
    id: "corail",
    nom: "Corail « corne de cerf »",
    latin: "Acropora cervicornis",
    emoji: "🪸",
    regne: "Animal · Cnidaires",
    ou: "Dans la vitrine, sur l’étagère du bas",
    desc: "On l’a cru plante, puis pierre. C’est en réalité le squelette calcaire d’une colonie de minuscules animaux, les polypes, cousins des méduses. Celui-ci vient de la mer des Caraïbes.",
    savais: "Dans les années 1720, le médecin marseillais Jean-André Peyssonnel montra que le corail est un animal. Les savants de l’Académie mirent des années à le croire.",
    mots: ["polype", "symbiose", "photosynthèse", "blanchissement"],
    college: {
      q: "Le corail est-il un minéral, un végétal ou un animal ?",
      choix: [
        "Un animal : une colonie de polypes qui fabrique un squelette calcaire.",   // ← la bonne réponse
        "Un végétal, puisqu’il pousse fixé au fond comme une plante.",
        "Un minéral, puisqu’il est dur comme la pierre.",
        "Un champignon marin."
      ],
      expl: "Chaque polype a une bouche entourée de tentacules qui capturent du plancton : c’est un animal. La colonie construit un squelette de calcaire, d’où sa dureté. Dans ses tissus vivent des algues microscopiques, ce qui a longtemps entretenu la confusion avec les plantes.",
      prog: "Cycle 4 — Classer les êtres vivants ; relations entre êtres vivants"
    },
    lycee: {
      q: "Lors des vagues de chaleur marines, les coraux blanchissent. Que se passe-t-il ?",
      choix: [
        "Les polypes expulsent les algues symbiotiques qui leur donnent leur couleur et une grande part de leur nourriture.",   // ← la bonne réponse
        "Le calcaire du squelette fond sous l’effet de la chaleur.",
        "Les polypes changent de couleur pour renvoyer la lumière et se protéger.",
        "Les coraux meurent dès que l’eau dépasse 20 °C."
      ],
      expl: "Le corail vit en symbiose avec des algues unicellulaires, les zooxanthelles : elles lui cèdent une partie des produits de leur photosynthèse, il leur offre abri et CO₂. Une eau trop chaude rompt l’association : le corail les expulse et laisse voir son squelette blanc. Si la chaleur dure, il meurt de faim. Ces épisodes se multiplient avec le réchauffement climatique.",
      prog: "Lycée — Écosystèmes et changement climatique : la symbiose"
    }
  },
  {
    id: "serpent",
    nom: "Python en bocal",
    latin: "Python regius",
    emoji: "🐍",
    regne: "Animal · Reptiles (serpents)",
    ou: "Dans la vitrine, en bas à gauche, dans un bocal",
    desc: "Conservé dans l’alcool. Pas de pattes, un corps fait de plus de deux cents vertèbres… mais, de part et d’autre du cloaque, deux petits ergots griffus, que l’on retrouve chez les pythons et les boas.",
    savais: "Sous chaque ergot se cachent de petits os du bassin et de la cuisse. Le mâle s’en sert pour gratter et stimuler la femelle pendant l’accouplement.",
    mots: ["vertébré", "organe vestigial", "homologie", "tétrapode"],
    college: {
      q: "Le python n’a pas de pattes. Est-ce pour autant un invertébré ?",
      choix: [
        "Non : il a un squelette interne avec une colonne vertébrale, c’est un vertébré.",   // ← la bonne réponse
        "Oui, puisqu’il n’a pas de pattes.",
        "Oui, puisqu’il rampe comme un ver de terre.",
        "Non, c’est un mammifère, puisqu’il a des écailles."
      ],
      expl: "« Vertébré » veut dire « qui possède des vertèbres » : le python en a plusieurs centaines. Il partage aussi avec le lézard la peau couverte d’écailles et la ponte d’œufs à coquille. Pour classer, on regarde ce que l’animal possède, pas seulement ce qui lui manque.",
      prog: "Cycle 4 — Classer les êtres vivants d’après les attributs partagés"
    },
    lycee: {
      q: "À quoi correspondent les petits os du bassin et les ergots du python ?",
      choix: [
        "À des restes de membres postérieurs, hérités d’ancêtres à quatre pattes.",   // ← la bonne réponse
        "À des organes en formation : les pythons de demain auront des pattes.",
        "À des griffes apparues pour grimper aux arbres, sans lien avec des pattes.",
        "À une malformation propre à cet individu."
      ],
      expl: "Ces os sont homologues du bassin et du fémur des autres tétrapodes : ce sont des organes vestigiaux, témoins de la parenté des serpents avec des ancêtres à pattes. L’évolution ne prépare pas l’avenir : elle modifie ce qui existe déjà.",
      prog: "Lycée — Parentés et évolution : organes homologues et vestigiaux"
    }
  },
  {
    id: "crocodile",
    nom: "Crocodile naturalisé",
    latin: "Crocodylus niloticus",
    emoji: "🐊",
    regne: "Animal · Crocodiliens",
    ou: "Lève les yeux : il est suspendu aux poutres",
    desc: "Le trophée de tout cabinet qui se respecte : un crocodile du Nil empaillé, pendu au plafond pour impressionner les visiteurs. Mâchoires puissantes, dos cuirassé de plaques osseuses.",
    savais: "Chez le crocodile, c’est la température à laquelle les œufs sont couvés qui décide du sexe des petits.",
    mots: ["attributs partagés", "groupes emboîtés", "archosaures", "parenté"],
    college: {
      q: "Pour classer le crocodile, un naturaliste note : colonne vertébrale, quatre membres, peau à écailles, œufs à coquille. Que fait-il de ces observations ?",
      choix: [
        "Il cherche les attributs qu’il partage avec d’autres animaux, pour le placer dans des groupes emboîtés.",   // ← la bonne réponse
        "Rien : il le classe d’après son milieu de vie, avec les poissons, puisqu’il nage.",
        "Il le classe d’après sa taille, avec les grands animaux.",
        "Il le classe d’après ce qu’il mange, avec les carnivores : cela suffit."
      ],
      expl: "La classification repose sur les attributs partagés : des vertèbres → vertébrés ; quatre membres → tétrapodes ; un œuf à coquille → avec les oiseaux, les tortues, les lézards… Les groupes s’emboîtent les uns dans les autres. Le milieu de vie ou le régime alimentaire ne disent rien de la parenté.",
      prog: "Cycle 4 — Classer les êtres vivants en groupes emboîtés"
    },
    lycee: {
      q: "Parmi ces animaux actuels, lequel est le plus proche parent du crocodile ?",
      choix: [
        "L’oiseau.",   // ← la bonne réponse
        "Le lézard.",
        "La tortue.",
        "Le serpent."
      ],
      expl: "Crocodiles et oiseaux partagent des caractères hérités d’un ancêtre commun exclusif, par exemple un cœur à quatre cavités et un estomac musculeux en gésier ; ils construisent des nids et s’occupent de leurs petits. Avec les dinosaures disparus, ils forment le groupe des archosaures. La ressemblance avec le lézard est trompeuse : elle tient à des caractères anciens, partagés par beaucoup de groupes.",
      prog: "Lycée — Parentés et évolution : lire une phylogénie"
    }
  },
  {
    id: "microscope",
    nom: "Microscope en laiton",
    latin: "Microscope composé, vers 1840",
    emoji: "🔬",
    regne: "Instrument d’observation",
    ou: "Sur la grande table, au centre",
    desc: "Deux jeux de lentilles, un miroir pour envoyer la lumière à travers la lame, une vis pour la mise au point. Grâce à lui, les naturalistes du XIXᵉ siècle découvrent que plantes et animaux sont faits de cellules.",
    savais: "En 1665, Robert Hooke observe une fine tranche de liège et y voit de petites loges qu’il nomme « cells », comme les chambres des moines.",
    mots: ["cellule", "théorie cellulaire", "paroi", "microscope"],
    college: {
      q: "Qu’ont révélé les microscopes sur tous les êtres vivants ?",
      choix: [
        "Qu’ils sont tous constitués d’une ou de plusieurs cellules.",   // ← la bonne réponse
        "Que seuls les animaux sont faits de cellules, pas les plantes.",
        "Que les cellules se forment toutes seules dans la boue.",
        "Que les êtres vivants sont faits de petits cristaux."
      ],
      expl: "En 1838 et 1839, Schleiden pour les plantes et Schwann pour les animaux le généralisent : la cellule est l’unité de base de tout être vivant. Virchow ajoute en 1855 que toute cellule provient d’une autre cellule.",
      prog: "Cycle 4 — La cellule, unité du vivant"
    },
    lycee: {
      q: "Hooke observe des « cellules » dans le liège en 1665. Que voyait-il en réalité ?",
      choix: [
        "Les parois de cellules végétales mortes et vides.",   // ← la bonne réponse
        "Les noyaux de cellules vivantes.",
        "Des bactéries qui avaient envahi le liège.",
        "Des chloroplastes."
      ],
      expl: "Le liège est un tissu mort : il n’en reste que les parois, rigides, qui délimitent des loges vides. Les instruments de l’époque, sans colorants, ne montraient pas l’intérieur des cellules vivantes. Le noyau ne sera décrit qu’en 1831, par Robert Brown.",
      prog: "2nde — La cellule, unité structurale et fonctionnelle du vivant"
    }
  },
  {
    id: "planche",
    nom: "Planche des membres antérieurs",
    latin: "Homme, chauve-souris, baleine, cheval",
    emoji: "🦴",
    regne: "Document · Anatomie comparée",
    ou: "Encadrée au-dessus de la cheminée",
    desc: "Quatre membres faits pour saisir, voler, nager ou courir. Chaque os est peint de la même couleur et porte le même numéro d’un animal à l’autre : un os (l’humérus), puis deux (radius et ulna), puis les petits os du poignet, puis les doigts.",
    savais: "Le naturaliste Richard Owen appelait ces correspondances des « homologies » dès 1843. Darwin y vit la marque d’une ascendance commune.",
    mots: ["homologie", "analogie", "ancêtre commun", "plan d’organisation"],
    college: {
      q: "Ces membres servent à des choses très différentes, mais ont la même organisation. Qu’est-ce que cela suggère ?",
      choix: [
        "Que ces animaux sont apparentés : ils ont hérité ce plan d’organisation d’un ancêtre commun.",   // ← la bonne réponse
        "Que ces animaux vivent dans le même milieu.",
        "Que la forme d’un membre ne dépend que de son usage.",
        "Rien : c’est une coïncidence."
      ],
      expl: "Si chaque membre avait été conçu seulement pour son usage, rien n’obligerait une nageoire et une aile à avoir les mêmes os, dans le même ordre. Ce plan commun est un héritage : homme, chauve-souris, baleine et cheval descendent d’un ancêtre commun à quatre membres. Les différences (longueur des doigts, nombre d’os) se sont mises en place au cours de l’évolution.",
      prog: "Cycle 4 — Parenté entre les êtres vivants"
    },
    lycee: {
      q: "L’aile d’une chauve-souris et celle d’un papillon servent toutes deux à voler. Ces organes sont…",
      choix: [
        "Analogues : même fonction, mais ni la même organisation ni la même origine.",   // ← la bonne réponse
        "Homologues, puisqu’ils ont la même fonction.",
        "Homologues, puisque ce sont deux ailes.",
        "Vestigiaux."
      ],
      expl: "Deux organes sont homologues s’ils occupent la même position et ont la même organisation, hérités d’un ancêtre commun, quelle que soit leur fonction : l’aile de la chauve-souris et le bras humain. L’aile du papillon, sans aucun os, a la même fonction mais une tout autre origine : c’est une analogie, née d’une convergence évolutive.",
      prog: "Lycée — Parentés et évolution : homologie et convergence"
    }
  },
  {
    id: "glossopetres",
    nom: "Glossopètres",
    latin: "Dents fossiles de requin",
    emoji: "🦈",
    regne: "Fossile · Poissons cartilagineux",
    ou: "Dans le plateau posé sur le médaillier, sous la fenêtre de gauche",
    desc: "Des « langues de pierre » triangulaires, ramassées à Malte. On les croyait tombées du ciel ou poussées dans la roche, et on les portait en amulette contre les poisons.",
    savais: "En 1667, Nicolas Sténon dissèque la tête d’un grand requin et reconnaît ses dents dans les glossopètres. Il en tire aussi une idée qui fonde la géologie : les couches de roche se déposent les unes sur les autres.",
    mots: ["fossile", "actualisme", "superposition", "datation relative"],
    college: {
      q: "Que sont réellement les glossopètres ?",
      choix: [
        "Des dents de requin fossilisées.",   // ← la bonne réponse
        "Des langues de serpent changées en pierre.",
        "Des cristaux qui poussent dans la roche.",
        "Des pointes de flèche taillées par les humains préhistoriques."
      ],
      expl: "Sténon a comparé leur forme, leurs bords dentelés et leur structure aux dents d’un requin actuel : elles sont identiques. Comparer un fossile à un être vivant actuel pour le comprendre, c’est raisonner par actualisme. Le squelette d’un requin est fait de cartilage, qui se conserve mal : ce sont surtout ses dents, très dures, qui se fossilisent.",
      prog: "Cycle 4 — Les fossiles, témoins des êtres vivants passés"
    },
    lycee: {
      q: "Sténon énonce aussi le principe de superposition. Que dit-il ?",
      choix: [
        "Dans une série de couches non déformées, chaque couche est plus récente que celle qu’elle recouvre.",   // ← la bonne réponse
        "Les couches les plus épaisses sont toujours les plus anciennes.",
        "Les fossiles les plus gros se trouvent dans les couches les plus profondes.",
        "Toutes les couches d’une falaise ont le même âge."
      ],
      expl: "Les sédiments se déposent les uns après les autres, à l’horizontale : ce qui est dessous est donc plus ancien que ce qui est dessus, sauf si les couches ont été plissées ou renversées ensuite. C’est l’un des principes de la datation relative, avec la continuité, le recoupement et l’identité paléontologique.",
      prog: "Lycée — Datation relative : principes de stratigraphie"
    }
  },
  {
    id: "cacao",
    nom: "Cabosse de cacaoyer",
    latin: "Theobroma cacao",
    emoji: "🍫",
    regne: "Végétal · Plantes à fleurs",
    ou: "Dans la serre, accrochée au tronc du cacaoyer",
    desc: "Le cacaoyer, originaire de la forêt amazonienne, porte ses fleurs et ses fruits directement sur le tronc. Chaque cabosse renferme de 20 à 50 graines, les fèves de cacao, entourées d’une pulpe sucrée.",
    savais: "Ses fleurs, minuscules, sont pollinisées presque uniquement par de petits moucherons. « Theobroma » signifie « nourriture des dieux ».",
    mots: ["fleur", "fécondation", "fruit", "pollinisation"],
    college: {
      q: "La cabosse est un fruit. D’où vient-elle ?",
      choix: [
        "De la transformation d’une fleur après la fécondation : le fruit protège les graines.",   // ← la bonne réponse
        "D’une feuille qui s’est enroulée et a durci.",
        "D’une racine sortie du sol.",
        "Elle pousse sur le tronc sans qu’il y ait jamais eu de fleur."
      ],
      expl: "Après la pollinisation, la fécondation a lieu dans le pistil de la fleur : la partie qui renfermait les ovules (l’ovaire) grossit et devient le fruit, les ovules deviennent les graines. Chez le cacaoyer, les fleurs poussent sur le tronc : les fruits y poussent donc aussi.",
      prog: "Cycle 4 — Reproduction sexuée des plantes à fleurs : de la fleur au fruit"
    },
    lycee: {
      q: "Dans certaines plantations, les moucherons pollinisateurs ont presque disparu. Quelle conséquence pour la récolte ?",
      choix: [
        "Moins de pollen transporté, donc moins de fécondations : moins de cabosses et de fèves.",   // ← la bonne réponse
        "Aucune : le cacaoyer peut former des fruits par sa seule photosynthèse.",
        "Le vent prend le relais, sans aucune perte.",
        "Les cabosses deviennent plus grosses, puisqu’elles sont moins nombreuses."
      ],
      expl: "Le cacaoyer, fixé au sol, dépend d’un animal pour transporter le pollen d’une fleur à l’autre. Sans pollinisateur, pas de fécondation, donc pas de fruit. Seule une petite fraction des fleurs donne une cabosse ; laisser au sol la litière où se développent les moucherons améliore les récoltes.",
      prog: "Terminale spé — Reproduction de la plante : la pollinisation par les animaux"
    }
  },
  {
    id: "banane",
    nom: "Régime de bananes",
    latin: "Musa (groupe Cavendish)",
    emoji: "🍌",
    regne: "Végétal · Plantes à fleurs",
    ou: "Dans la serre, sous les grandes feuilles du bananier",
    desc: "Le bananier n’est pas un arbre : son « tronc » est fait des gaines de ses feuilles, serrées les unes contre les autres. Les bananes du commerce n’ont pas de vraies graines, seulement de petits points noirs : des ovules qui ne se sont pas développés.",
    savais: "Jusqu’aux années 1950, la banane la plus vendue était la ‘Gros Michel’. Un champignon du sol, la maladie de Panama, l’a presque fait disparaître des plantations.",
    mots: ["reproduction asexuée", "clone", "diversité génétique", "agrosystème"],
    college: {
      q: "Sans graines, comment produit-on de nouveaux bananiers ?",
      choix: [
        "On replante les rejets qui poussent au pied de la plante : c’est une reproduction asexuée.",   // ← la bonne réponse
        "On sème les petits points noirs de la banane.",
        "On greffe une banane sur un palmier.",
        "On ne peut pas : chaque bananier vit éternellement."
      ],
      expl: "Le pied du bananier produit des rejets, que l’on sépare et que l’on replante. Chaque nouveau bananier est un clone : il a les mêmes caractères que la plante d’origine. C’est une reproduction asexuée, sans fleur ni fécondation.",
      prog: "Cycle 4 — La reproduction asexuée des végétaux"
    },
    lycee: {
      q: "Presque toutes les bananes exportées sont des clones d’une même variété. Quel risque cela fait-il courir ?",
      choix: [
        "Sans diversité génétique, une maladie qui touche un plant peut toucher tous les autres.",   // ← la bonne réponse
        "Aucun : des clones résistent mieux que des plantes issues de graines.",
        "Les bananes risquent de redevenir sauvages.",
        "Les clones vieillissent plus vite et donnent des bananes plus petites."
      ],
      expl: "La diversité génétique d’une population est son assurance : face à un nouveau parasite, quelques individus portent souvent des allèles de résistance. Dans une plantation de clones, tous ont les mêmes allèles. Une nouvelle souche du champignon de la maladie de Panama (TR4) menace aujourd’hui la Cavendish.",
      prog: "2nde — Biodiversité génétique et agrosystèmes"
    }
  },
  {
    id: "victoria",
    nom: "Fleur du nénuphar géant",
    latin: "Victoria amazonica",
    emoji: "🪷",
    regne: "Végétal · Plantes à fleurs",
    ou: "Dans la serre, sur le bassin",
    desc: "Dans les eaux calmes de l’Amazone, ses feuilles flottantes dépassent deux mètres de diamètre (celles du bassin sont encore jeunes). Sa fleur ne s’ouvre que deux nuits : blanche et parfumée la première, rose la seconde.",
    savais: "Les grosses nervures du dessous de la feuille auraient inspiré au jardinier Joseph Paxton la charpente du Crystal Palace de Londres, en 1851.",
    mots: ["stomate", "pollinisation croisée", "coévolution", "adaptation"],
    college: {
      q: "La feuille flotte à la surface de l’eau. Où se trouvent ses stomates, les petits orifices qui laissent passer les gaz ?",
      choix: [
        "Sur la face supérieure, au contact de l’air.",   // ← la bonne réponse
        "Sur la face inférieure, comme chez la plupart des plantes terrestres.",
        "Nulle part : elle n’en a pas, puisqu’elle vit dans l’eau.",
        "Dans les racines."
      ],
      expl: "Les stomates permettent les échanges de gaz avec l’air, en particulier l’entrée du dioxyde de carbone utilisé par la photosynthèse. Sous une feuille flottante, il n’y a que de l’eau : chez les nénuphars, les stomates sont donc sur la face supérieure. L’organisation de la feuille est adaptée à son milieu.",
      prog: "Cycle 4 — Nutrition des végétaux : les échanges avec le milieu"
    },
    lycee: {
      q: "La 1re nuit, la fleur blanche, chaude et parfumée attire des scarabées et se referme sur eux. La 2e nuit, devenue rose, elle les relâche couverts de pollen. Quel intérêt pour la plante ?",
      choix: [
        "Les scarabées portent ce pollen vers une autre fleur qui vient de s’ouvrir : la pollinisation est croisée.",   // ← la bonne réponse
        "Les scarabées servent de nourriture à la plante.",
        "Les scarabées protègent la fleur contre les poissons.",
        "Aucun : la fleur s’autoféconde, les scarabées sont des parasites."
      ],
      expl: "La première nuit, la fleur est en phase femelle : les scarabées y déposent le pollen d’une autre fleur. Le lendemain, en phase mâle, elle libère son propre pollen sur eux avant de les relâcher. Ce décalage favorise la fécondation croisée, donc le brassage génétique. Plante et insecte ont évolué ensemble : c’est une coévolution.",
      prog: "Terminale spé — Reproduction de la plante : pollinisation et coévolution"
    }
  }
];
