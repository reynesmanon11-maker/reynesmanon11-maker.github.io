/* ATTENTION — après toute modification de ce fichier, changer le jeton ?v= des
   balises <script> qui l'appellent, dans les pages HTML. Sans cela le
   navigateur des élèves garde l'ancienne version pendant des heures. */

/* ============================================================================
   Les séries d'entraînement.

   Chaque question porte sa correction : ce n'est pas un contrôle, c'est un
   outil de révision. Ce que l'élève retient, ce n'est pas d'avoir eu juste,
   c'est l'explication qui suit — d'où le soin mis à ce qu'elle redise la
   notion plutôt que de se contenter d'un « oui » ou d'un « non ».

   Six formes de question :
     qcm        une seule bonne réponse, index dans `o`
     vf         vrai ou faux, `r` vaut true ou false
     num        un nombre à saisir, `r` est ce nombre
     croisement un échiquier de croisement à remplir, case par case
     ordre      des étapes à remettre dans l'ordre
     trous      un texte lacunaire, complété depuis une banque de mots
     paires     des chromosomes à apparier deux à deux

   L'échiquier compare les génotypes après les avoir normalisés : « vg // vg+ »,
   « (vg+//vg) » et « vg+/vg » sont acceptés comme une seule et même réponse.
   On corrige une méthode, pas une façon d'écrire.

   Pièges volontairement tendus, parce que ce sont ceux que les élèves
   rencontrent vraiment : confondre chromosome et chromatide, croire qu'une
   cellule redevient diploïde après la méiose I, croire que des chromosomes
   homologues sont identiques.
   ========================================================================== */

window.EXERCICES = [
  {
    id: 'tale-genetique-bases',
    niveau: 'Terminale',
    matiere: 'Spécialité SVT',
    titre: 'Génétique : les bases',
    sous: 'Haploïdie, diploïdie, chromosomes homologues, méiose et brassages.',
    questions: [

      { t: 'qcm',
        q: 'Une cellule diploïde est une cellule qui contient :',
        o: ['un seul exemplaire de chaque chromosome',
            'deux exemplaires de chaque chromosome, réunis en paires d’homologues',
            'deux chromatides par chromosome',
            'exactement 46 chromosomes'],
        r: 1,
        e: '« Diploïde » décrit le nombre de <b>lots</b> de chromosomes, et non le nombre de chromatides : une cellule diploïde possède deux exemplaires de chaque chromosome, qui forment les paires d’homologues. Le nombre 2n dépend de l’espèce — 46 chez l’Homme, 38 chez le chat, 8 chez la drosophile.' },

      { t: 'vf',
        q: 'Un chromosome à deux chromatides compte pour deux chromosomes.',
        r: false,
        e: 'On compte <b>un chromosome par centromère</b>. Après la réplication, le chromosome porte deux chromatides sœurs identiques, mais il reste un seul chromosome. Une cellule humaine en fin de phase S contient donc toujours 46 chromosomes — et 92 chromatides.' },

      { t: 'qcm',
        q: 'Deux chromosomes homologues portent :',
        o: ['des gènes différents',
            'les mêmes gènes aux mêmes locus, et obligatoirement les mêmes allèles',
            'les mêmes gènes aux mêmes locus, avec des allèles identiques ou différents',
            'exactement la même séquence d’ADN'],
        r: 2,
        e: 'Homologues veut dire : <b>mêmes gènes, aux mêmes emplacements</b> (les locus). Pour un gène donné, les deux allèles peuvent être identiques — l’individu est homozygote — ou différents — il est hétérozygote. L’un des deux chromosomes vient du père, l’autre de la mère.' },

      { t: 'num',
        q: 'Chez le chat, 2n = 38. Combien de chromosomes un spermatozoïde de chat contient-il ?',
        r: 19, unite: 'chromosomes',
        e: 'Un gamète est <b>haploïde</b> : il ne reçoit qu’un exemplaire de chaque paire, soit n = 19. C’est la méiose qui opère cette réduction.' },

      { t: 'qcm',
        q: 'À la fin de la méiose I, chaque cellule fille est :',
        o: ['diploïde, avec des chromosomes à une chromatide',
            'diploïde, avec des chromosomes à deux chromatides',
            'haploïde, avec des chromosomes à deux chromatides',
            'haploïde, avec des chromosomes à une chromatide'],
        r: 2,
        e: 'C’est le point le plus souvent raté. La méiose I sépare les <b>chromosomes homologues</b> : chaque cellule n’en reçoit qu’un par paire, elle est donc <b>déjà haploïde</b> — d’où le nom de division réductionnelle. Les chromatides sœurs, elles, ne se sépareront qu’en anaphase II : les chromosomes en ont donc encore deux.' },

      { t: 'vf',
        q: 'La mitose produit toujours deux cellules diploïdes.',
        r: false,
        e: 'La mitose <b>conserve</b> la ploïdie, elle ne l’impose pas. Une cellule diploïde donne deux cellules diploïdes ; une cellule haploïde donne deux cellules haploïdes. C’est le cas chez les mousses et les champignons, dont une partie du cycle de vie est haploïde.' },

      { t: 'qcm',
        q: 'Le brassage interchromosomique a lieu :',
        o: ['en prophase I, par échange de portions entre chromatides',
            'en anaphase I, par la répartition au hasard des paires d’homologues',
            'en anaphase II, lors de la séparation des chromatides sœurs',
            'au moment de la fécondation'],
        r: 1,
        e: 'En anaphase I, chaque paire d’homologues se sépare <b>indépendamment des autres</b>. Chaque cellule fille hérite donc d’un mélange aléatoire de chromosomes d’origine paternelle et maternelle. Le brassage de la fécondation existe aussi, mais il réunit deux gamètes : ce n’est pas celui-là.' },

      { t: 'qcm',
        q: 'Le brassage intrachromosomique :',
        o: ['mélange des chromosomes entiers',
            'échange des portions de chromatides entre chromosomes homologues, en prophase I',
            'a lieu au cours de la mitose',
            'ne concerne que les chromosomes sexuels'],
        r: 1,
        e: 'C’est le <b>crossing-over</b>. En prophase I, les homologues s’apparient et échangent des segments de chromatides. Les chromatides deviennent alors recombinées : une même chromatide porte des allèles venus des deux parents.' },

      { t: 'num',
        q: 'Chez l’Homme (2n = 46), combien de combinaisons chromosomiques différentes le seul brassage interchromosomique peut-il produire dans un gamète ?',
        r: 8388608, unite: 'combinaisons',
        e: '23 paires, chacune se répartissant indépendamment : 2<sup>23</sup> = 8 388 608 combinaisons. Et ce nombre ne compte <b>pas</b> le crossing-over, qui s’y ajoute et multiplie encore la diversité.' },

      { t: 'vf',
        q: 'Un individu hétérozygote pour un gène possède deux allèles différents de ce gène.',
        r: true,
        e: 'C’est la définition même. Hétérozygote : deux allèles différents aux deux locus homologues. Homozygote : deux fois le même allèle.' },

      { t: 'num',
        q: 'Une cellule d’une espèce à 2n = 8 vient d’achever la réplication de son ADN. Combien de molécules d’ADN contient-elle ?',
        r: 16, unite: 'molécules d’ADN',
        e: 'Une chromatide = une molécule d’ADN. Les 8 chromosomes portent chacun deux chromatides après réplication, soit 16 molécules. Attention : le nombre de <b>chromosomes</b>, lui, n’a pas bougé — il reste 8.' },

      { t: 'qcm',
        q: 'Où est l’erreur dans cette phrase ? « Les chromosomes homologues sont identiques, puisqu’ils portent les mêmes gènes. »',
        o: ['il n’y a pas d’erreur',
            'ils ne portent pas les mêmes gènes',
            'ils portent les mêmes gènes, mais pas forcément les mêmes allèles',
            'les chromosomes homologues n’existent que chez les animaux'],
        r: 2,
        e: 'Porter les mêmes gènes ne veut pas dire être identiques. À un locus donné, l’un peut porter l’allèle A et l’autre l’allèle a. C’est précisément cette différence qui rend le brassage génétique possible — sans elle, mélanger des chromosomes ne produirait aucune diversité.' },

      { t: 'qcm',
        q: 'La fécondation :',
        o: ['réunit deux cellules haploïdes et rétablit la diploïdie',
            'réunit deux cellules diploïdes',
            'produit une cellule haploïde',
            'divise par deux le nombre de chromosomes'],
        r: 0,
        e: 'Chaque gamète apporte n chromosomes : la cellule-œuf en possède donc 2n. Méiose et fécondation se compensent exactement, et c’est ce qui maintient constant le nombre de chromosomes d’une génération à l’autre.' },

      { t: 'num',
        q: 'Chez une espèce à 2n = 24, combien de chromatides une cellule contient-elle en métaphase de mitose ?',
        r: 48, unite: 'chromatides',
        e: 'En métaphase de mitose, les 24 chromosomes sont encore à deux chromatides, alignés sur la plaque équatoriale : 24 × 2 = 48 chromatides. Les chromatides ne se sépareront qu’en anaphase.' },

      { t: 'qcm',
        q: 'La méiose II :',
        o: ['sépare les chromosomes homologues',
            'sépare les chromatides sœurs',
            'est précédée d’une réplication de l’ADN',
            'produit des cellules diploïdes'],
        r: 1,
        e: 'La méiose II se déroule comme une mitose : elle sépare les <b>chromatides sœurs</b>. Elle ne réduit pas la ploïdie, puisque les cellules étaient déjà haploïdes à la fin de la méiose I — on l’appelle pour cela division équationnelle.' },

      { t: 'vf',
        q: 'L’ADN est répliqué une seconde fois entre la méiose I et la méiose II.',
        r: false,
        e: 'Une <b>seule</b> réplication, avant la méiose I. C’est exactement ce qui permet de passer de 2n à n : deux divisions successives pour une seule réplication. S’il y en avait une seconde, les gamètes resteraient diploïdes.' },
    ]
  },
  {
    id: 'tale-drosophile-croisements',
    niveau: 'Terminale',
    matiere: 'Spécialité SVT',
    titre: 'Drosophile : croisements et échiquiers',
    sous: 'Remplir un échiquier, lire un croisement-test, reconnaître les recombinés.',
    questions: [

      { t: 'croisement',
        q: 'Chez la drosophile, l’allèle <b>vg<sup>+</sup></b> (ailes longues) domine l’allèle <b>vg</b> (ailes vestigiales). On croise entre elles deux drosophiles de génotype <b>vg<sup>+</sup>//vg</b>. Complétez l’échiquier.',
        aide: 'Écrivez chaque génotype sous la forme <b>vg+//vg</b>. L’ordre des deux allèles est sans importance.',
        lignes: ['vg+', 'vg'],
        colonnes: ['vg+', 'vg'],
        cases: [['vg+//vg+', 'vg+//vg'],
                ['vg+//vg', 'vg//vg']],
        e: 'Chaque parent hétérozygote produit deux types de gamètes en proportions égales : (vg<sup>+</sup>) et (vg). L’échiquier donne 1 <b>vg<sup>+</sup>//vg<sup>+</sup></b>, 2 <b>vg<sup>+</sup>//vg</b>, 1 <b>vg//vg</b>, soit les proportions génotypiques 1/4, 2/4, 1/4. Comme vg<sup>+</sup> domine, les <b>phénotypes</b> se répartissent en 3/4 [ailes longues] et 1/4 [ailes vestigiales] : c’est le fameux rapport 3:1.' },

      { t: 'croisement',
        q: 'Croisement-test : on croise une femelle F1 de génotype <b>vg<sup>+</sup>//vg</b> avec un mâle <b>vg//vg</b>. Complétez l’échiquier.',
        aide: 'Le mâle double récessif ne produit qu’un seul type de gamète.',
        lignes: ['vg+', 'vg'],
        colonnes: ['vg'],
        cases: [['vg+//vg'],
                ['vg//vg']],
        e: 'C’est tout l’intérêt du croisement-test : le parent récessif n’apporte que l’allèle <b>vg</b>, donc <b>le phénotype des descendants révèle directement le gamète venu de la F1</b>. Ici, 1/2 [ailes longues] et 1/2 [ailes vestigiales] : la F1 a bien produit les deux gamètes en proportions égales.' },

      { t: 'croisement',
        q: 'Deux gènes portés par le <b>même</b> chromosome : couleur du corps (b<sup>+</sup> gris, b noir) et taille des ailes (vg<sup>+</sup> longues, vg vestigiales). Une F1 <b>(b<sup>+</sup> vg<sup>+</sup> // b vg)</b> est croisée avec un double récessif <b>(b vg // b vg)</b>. La F1 produit quatre types de gamètes : deux parentaux, deux recombinés. Complétez l’échiquier.',
        aide: 'Chaque case est un génotype à deux gènes, par exemple <b>b+ vg+ // b vg</b>.',
        lignes: ['b+ vg+', 'b vg', 'b+ vg', 'b vg+'],
        colonnes: ['b vg'],
        cases: [['b+ vg+ // b vg'],
                ['b vg // b vg'],
                ['b+ vg // b vg'],
                ['b vg+ // b vg']],
        e: 'Les deux premiers gamètes, <b>(b<sup>+</sup> vg<sup>+</sup>)</b> et <b>(b vg)</b>, reproduisent les associations d’allèles des grands-parents : ce sont les <b>parentaux</b>, les plus nombreux. Les deux autres, <b>(b<sup>+</sup> vg)</b> et <b>(b vg<sup>+</sup>)</b>, n’apparaissent que si un <b>crossing-over</b> a eu lieu entre les deux locus en prophase I : ce sont les <b>recombinés</b>, toujours minoritaires. Plus les deux gènes sont éloignés sur le chromosome, plus les recombinés sont nombreux.' },

      { t: 'qcm',
        q: 'Dans un croisement-test portant sur deux gènes liés, on obtient quatre phénotypes dans les proportions 41 % – 41 % – 9 % – 9 %. Que peut-on en conclure ?',
        o: ['les deux gènes sont indépendants',
            'les deux gènes sont liés, et 18 % des gamètes sont recombinés',
            'les deux gènes sont liés, et 82 % des gamètes sont recombinés',
            'il y a eu une anomalie de méiose'],
        r: 1,
        e: 'Deux gènes <b>indépendants</b> donneraient quatre phénotypes équiprobables (25 % chacun). Ici deux classes dominent nettement : les gènes sont <b>liés</b>. Les classes minoritaires sont les recombinés : 9 % + 9 % = <b>18 %</b>. Cette proportion mesure la distance entre les deux locus — ici 18 centimorgans.' },

      { t: 'ordre',
        q: 'Remettez les étapes de la méiose dans l’ordre.',
        items: ['Prophase I — les homologues s’apparient, des crossing-over ont lieu',
                'Métaphase I — les paires d’homologues s’alignent sur la plaque équatoriale',
                'Anaphase I — les chromosomes homologues se séparent',
                'Métaphase II — les chromosomes s’alignent en un seul rang',
                'Anaphase II — les chromatides sœurs se séparent',
                'Télophase II — quatre cellules haploïdes à une chromatide'],
        e: 'Deux divisions pour une seule réplication. La <b>première</b> sépare les homologues : c’est elle qui fait passer de 2n à n, d’où son nom de division réductionnelle. Entre les deux, en télophase I, les cellules sont <b>déjà haploïdes</b> mais leurs chromosomes ont encore deux chromatides. La <b>seconde</b> sépare les chromatides sœurs, comme une mitose.' },

      { t: 'trous',
        q: 'Une cellule {1} possède deux exemplaires de chaque chromosome. Ces deux exemplaires portent les mêmes gènes aux mêmes {2} : ce sont des chromosomes {3}. Lorsque les deux allèles d’un gène diffèrent, l’individu est {4} pour ce gène.',
        banque: ['diploïde', 'haploïde', 'locus', 'centromères', 'homologues', 'identiques', 'hétérozygote', 'homozygote'],
        r: ['diploïde', 'locus', 'homologues', 'hétérozygote'],
        e: 'Attention au piège de « identiques » : des chromosomes homologues portent les mêmes gènes, mais pas forcément les mêmes allèles. C’est précisément cette différence qui rend le brassage utile.' },

      { t: 'trous',
        q: 'Le brassage {1} résulte de la répartition au hasard des paires d’homologues en {2}. Le brassage {3}, lui, résulte des {4} qui se produisent en prophase I.',
        banque: ['interchromosomique', 'intrachromosomique', 'anaphase I', 'anaphase II', 'crossing-over', 'mitoses'],
        r: ['interchromosomique', 'anaphase I', 'intrachromosomique', 'crossing-over'],
        e: '<b>Inter</b> = entre les chromosomes : les paires se répartissent indépendamment les unes des autres, en anaphase I. <b>Intra</b> = à l’intérieur d’un chromosome : des portions de chromatides s’échangent entre homologues, en prophase I. Les deux brassages s’ajoutent, puis la fécondation en ajoute un troisième.' },

      { t: 'paires',
        q: 'Voici les huit chromosomes d’une cellule, dessinés après la réplication. Reconstituez les <b>quatre paires d’homologues</b>.',
        aide: 'Cliquez un chromosome, puis celui que vous pensez être son homologue. Cliquez une paire déjà formée pour la défaire. Les lettres indiquent les allèles portés par le chromosome.',
        chromosomes: [
          { id: 1, paire: 'I',   taille: 1.00, centro: 0.30, alleles: ['A', 'B'] },
          { id: 2, paire: 'III', taille: 1.00, centro: 0.62, alleles: ['E', 'F'] },
          { id: 3, paire: 'II',  taille: 0.78, centro: 0.50, alleles: ['C', 'd'] },
          { id: 4, paire: 'IV',  taille: 0.55, centro: 0.26, alleles: ['g'] },
          { id: 5, paire: 'I',   taille: 1.00, centro: 0.30, alleles: ['a', 'B'] },
          { id: 6, paire: 'II',  taille: 0.78, centro: 0.50, alleles: ['c', 'd'] },
          { id: 7, paire: 'IV',  taille: 0.55, centro: 0.26, alleles: ['G'] },
          { id: 8, paire: 'III', taille: 1.00, centro: 0.62, alleles: ['e', 'f'] },
        ],
        e: 'Trois critères, et il faut les <b>trois</b> : même taille, centromère au même endroit, et surtout <b>mêmes gènes aux mêmes locus</b>. Les allèles, eux, peuvent différer — c’est même tout l’intérêt : le chromosome 1 porte <b>A</b> là où le 5 porte <b>a</b>.<br><br>Le piège est entre les paires I et III : <b>même longueur</b>, mais leur centromère n’est pas placé pareil et ils ne portent pas les mêmes gènes. Deux chromosomes de même taille ne sont donc pas forcément homologues. À l’inverse, les deux <b>chromatides</b> d’un même chromosome, elles, sont identiques et tiennent ensemble par le centromère : ce ne sont pas des homologues, c’est un seul chromosome.' },

      { t: 'num',
        q: 'Dans un croisement-test, on compte 1 000 descendants dont 120 présentent un phénotype recombiné. Quel est le pourcentage de recombinaison entre les deux gènes ?',
        r: 12, unite: '%',
        e: '120 / 1 000 = <b>12 %</b>. Ce pourcentage est aussi la distance entre les deux locus : 12 centimorgans. Il ne dépasse jamais 50 % — au-delà, les gènes se comportent comme s’ils étaient indépendants.' },
    ]
  },
];
