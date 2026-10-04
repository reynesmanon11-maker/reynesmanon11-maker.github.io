/* ATTENTION — après toute modification de ce fichier, changer le jeton ?v= des
   balises <script> qui l'appellent, dans les pages HTML. Sans cela le
   navigateur des élèves garde l'ancienne version pendant des heures. */

/* ============================================================================
   Les séries d'entraînement.

   Chaque question porte sa correction : ce n'est pas un contrôle, c'est un
   outil de révision. Ce que l'élève retient, ce n'est pas d'avoir eu juste,
   c'est l'explication qui suit — d'où le soin mis à ce qu'elle redise la
   notion plutôt que de se contenter d'un « oui » ou d'un « non ».

   Trois formes de question :
     qcm  une seule bonne réponse, index dans `o`
     vf   vrai ou faux, `r` vaut true ou false
     num  un nombre à saisir, `r` est ce nombre

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
];
