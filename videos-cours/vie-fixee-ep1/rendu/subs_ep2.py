import json, re, sys
segs = json.load(open(sys.argv[1]))
R = [('nitosphère','lithosphère'),('radiocronologie','radiochronologie'),("ceinture dont je n'ai aucune idée","ceinture de Nuvvuagittuq, dont je n'ai aucune idée"),
 ("qui s'est situé au Canada. L'orache est","située au Canada. Leur âge est"),('de plus faible densité de 7 à 8','de plus faible densité (2,7 contre 2,9)'),
 ('ses deux croûtes','ces deux croûtes'),('de ses dernières','de cette dernière'),("nous permet alors du coup d'où comprendre","nous permet-elle alors de comprendre"),
 ('mouvements casse-subilataires au cours','mouvements qu\'a subis la Terre au cours'),('passé mouvement\net de la Terre','passé mouvementé de la Terre'),
 ('orogénèse','orogenèse'),('Orogénèse','Orogenèse'),('cordillard des hondres','cordillère des Andes'),('ce résultant','ceux résultant'),
 ('les alpes','les Alpes'),('la classe, les balconnes, le cococase et l\'imalaya','l\'Atlas, les Balkans, le Caucase et l\'Himalaya'),
 ("l'air tertiaire","l'ère tertiaire"),("l'atétice","la Téthys"),('relief très marquée','relief très marqué'),('présentes en surface','présence en surface'),
 ('issus de\n','issues de\n'),('présentes de failles inverses de chauffagements','présence de failles inverses, de chevauchements'),('subies par','subis par'),
 ('orogénées','orogenèses'),('pyrénées','Pyrénées'),('hercinienne','hercynienne'),('massif central','Massif central'),('massif harmonique','Massif armoricain'),('les voges','les Vosges'),
 ('détectables','décelables'),('se sont formules','se sont formées'),('riffs de continentaux','rifts continentaux'),('Cette expansion','Cette extension'),
 ('riffs de continentale','rift continental'),("marge d'excalier","marches d'escalier"),("l'inmancissement","l'amincissement"),
 ('particulières qu\'elles','particulières car elles'),('en bloc qui est en tendance','en blocs qui ont tendance'),('détrétiques','détritiques'),
 ('congolmérins','conglomérats'),('des réseaux de ruissellement','des eaux de ruissellement'),('gyps','gypse'),('la croix\n','la croûte\n'),
 ('rompre en menant','rompre en amenant'),('Ce tannier','Ce dernier'),('léthosphérique','lithosphérique'),('Devenue presque','Devenues presque'),
 ('qualifiés de marges','qualifiées de marges'),('Par sismique réflexion','Par sismique-réflexion'),('décédiment par','des sédiments par'),
 ('la marche. On','la marge. On'),('ainsi décédiments interriffes','ainsi des sédiments anté-rift'),('décédiment sain rift','des sédiments syn-rift'),
 ('évaporite disposé','évaporites disposés'),('bascumon','basculement'),('décédiment post rift','des sédiments post-rift'),('argélite, discordant sur les décédents émis','argilites, discordants sur les précédents et mis'),
 ('ophiolithes','ophiolites'),('gabros','gabbros'),("d'écédiments","de sédiments"),('hydrotermalisme','hydrothermalisme'),('serpentinisés','serpentinisées'),
 ('hors-blent','hornblende'),('interprétés comme','interprétées comme'),('à fleurs des roches','affleurent des roches'),('crotte','croûte'),
 ('ces différences assièses','ces différents faciès'),("d'ouest en aise","d'ouest en est"),("vers l'est","vers l'Est"),('hydrotermal','hydrothermal'),
 ('chariée','charriée'),("d'opduction","d'obduction"),('Gness','gneiss'),('migmatiques','migmatites'),('fusion par celle du','fusion partielle du'),('anatexy','anatexie'),
 ('De nombreuses indices','De nombreux indices'),('nables de chariage','nappes de charriage'),('épicissement','épaississement'),('croute','croûte'),
 ('profil écorce','profil ECORS'),('grandes failles, maux','grandes failles, Moho,'),('du mot à','du Moho à'),('croustale','crustale'),('des apes','des Alpes'),
 ('des sons de sismique','des ondes sismiques'),("qu'elle traverse","qu'elles traversent"),('cohésite','coésite'),('un fascisme du quartz','un faciès du quartz'),
 ('dans le gré','dans le grès'),('Le quartz étant minéral présente','Le quartz étant un minéral présent'),('par entraînement, mais par ciel et collision','par entraînement partiel, et collision'),
 ('Paléogégraphie','Paléogéographie'),('paléogégraphie','paléogéographie'),('a pour étude\nl\'objet de','a pour objet d\'étude\n'),('orogenique','orogénique'),
 ('du nouvel orogenèse','d\'une nouvelle orogenèse'),('la Panger','la Pangée'),("l'air secondaire sont effaces","l'ère secondaire, sont des phases"),
 ('lithosuriques','lithosphériques'),('John Twos Wilson','John Tuzo Wilson'),('sera recherchée','serait à rechercher'),('convictifs','convectifs'),('nos manteaux','le manteau'),
 ('periodisité','périodicité'),('periodicité','périodicité'),('une belle distension','une nouvelle distension'),('la liste soeur continental','la lithosphère continentale'),
 ('appouvrit le matériau en minéraudie fusible','appauvrit le manteau en minéraux dits fusibles'),('qui fonde','qui fondent'),('ce qui la rend cassant','ce qui le rend cassant'),
 ('préférenciellement','préférentiellement'),('les apes actuels','les Alpes actuelles'),('Et les mentaux listosuriques n\'est pas appauvris','Et le manteau lithosphérique n\'est pas appauvri'),
 ('Ils font facilement','Il fond facilement'),('le mentaux','le manteau'),('dans le mentaux','dans le manteau'),('500 milieux','500 millions'),('de devenir des','au devenir des'),
 ('subsistes','subsistent'),('mentaux asténocephérique','manteau asthénosphérique'),('eurogénètes','orogenèses'),('continental\n','continentale\n'),
 ('flotte\nsur la lithosphère','flotte\nsur l\'asthénosphère'),('Élysotherme','L\'isotherme'),('asténocephère','asthénosphère'),('thermique et cpc','thermique) et s\'épaissit'),
 ('c\'est le mentaux\nde la lithosphérie qui s\'épaisse','c\'est le manteau\nlithosphérique qui s\'épaissit'),('épaissement','épaississement'),('docité','densité'),
 ('la lettre austère','la lithosphère'),('sténosphère','asthénosphère'),('n\'excent','n\'excèdent'),('intéresse-nous','intéressons-nous'),('implantissement','aplanissement'),
 ('et enfin des peaux','et enfin dépôts'),('alteration','altération'),('Erosion','Érosion'),('erosion','érosion'),('felspat','feldspaths'),('les mica','les micas'),
 ('la charge de l\'eau','la charge de l\'ion'),('attirées','attirés'),('évacués par les océans','évacués vers les océans'),('constitués par','constituer par'),
 ('hydroxides','hydroxydes'),('oxygens','oxyanions'),('carbonate\n','carbonates\n'),('de sulfate ou de phosphate','de sulfates ou de phosphates'),
 ('principal transport','principal agent de transport'),('érodés','érodées'),('déposés et sédimentés','déposées et sédimentées'),('transportés.','transportées.'),
 ('flujaux','fluviaux'),('enlevés','enlevé'),("d'attitude","d'altitude"),('reprérables','repérables'),('mesure la vitesse','mesurent la vitesse'),('montre également','montrent également'),
 ('pénée planation','pénéplanation'),('dix pour cent viraux','10 % environ'),('Gnaisse d\'Akasta','gneiss d\'Acasta'),('nous a formé','nous a montré'),('dans l\'océan suite','d\'un océan suite'),
 ('lithosphaires','(lithosphères)'),('torsale','dorsale'),("d'incité de","densité de"),('se transformant','se transforment en'),('un densité','la densité'),
 ('du corona','du grenat'),('les orcelles','les dorsales'),('composés de','composées de'),('mentaux lithosphériques','manteau lithosphérique'),('basalt','basalte'),('gabro','gabbro'),
 ("à l'arquin","à l'Archéen"),('fusion parcée','fusion partielle'),('Regardons altération','Regardons l\'altération'),('mentaux','manteau'),('le moteur de la tectonique','le moteur de la tectonique'),
]
subs=[]
for s in segs:
    t=s['text'].strip()
    for a,b in R: t=t.replace(a.replace('\n',' '),b.replace('\n',' ')).replace(a.split('\n')[0] if False else a, b) if '\n' not in a else t.replace(a.replace('\n',' '),b.replace('\n',' '))
    subs.append([round(s['start'],2), round(s['end'],2), t])
json.dump(subs, open(sys.argv[2],'w'), ensure_ascii=False, indent=0)
for i,(a,b,t) in enumerate(subs): print(i,t)
# --- seconde passe : doublons de remplacement, accords, retouches par ligne ---
P = [('gypsee','gypse'),('basalteees','basaltes'),('basaltee','basalte'),('fondentnt','fondent'),('micass','micas'),('crote','croûte'),
     ('lithosphère continental ','lithosphère continentale '),('lithosphère continental.','lithosphère continentale.'),('croûte continental.','croûte continentale.'),
     ('croûte continental\n','croûte continentale\n'),('domaine continentale','domaine continental'),('bassin continentale','bassin continental'),('rift continentale','rift continental'),
     ('rift continentaux','rifts continentaux'),('plus dense que la croûte continental','plus dense que la croûte continentale')]
for s in subs:
    for a,b in P: s[2]=s[2].replace(a,b)
    if s[2].endswith('croûte continental'): s[2]+='e'
F = {9:"de plus faible densité (2,7 contre 2,9), se trouve, elle, principalement en surface et n'est",10:"soumise qu'à l'érosion, qui ne recycle que 10 % en moyenne de cette dernière, d'où",
 15:"nous verrons en quoi ces dernières permettent de mettre en évidence le passé mouvementé",16:"de la Terre. Alors, la formation des chaînes de montagne,",
 32:"indices géologiques : présence en surface de roches métamorphiques issues de",35:"l'érosion, présence de failles inverses, de chevauchements.",
 67:"eaux de ruissellement et d'infiltration comme le gypse ou le",68:"sel. Si l'étirement et l'amincissement de la croûte",
 126:"qui n'est possible que si de la croûte continentale a été enfouie.",165:"entre les deux lithosphères continentales jadis séparées par l'océan.",
 167:"par empilement de nappes de charriage",171:"La paléogéographie a pour objet d'étude",172:"la reconstitution de la géographie passée de la Terre",
 205:"le manteau terrestre.",209:"ainsi que leur périodicité,",262:"dans le manteau asthénosphérique.",274:"sur l'asthénosphère car elle est moins dense.",
 279:"On parle de subsidence",280:"thermique, et elle s'épaissit.",282:"gardant toujours la même épaisseur, c'est le manteau",283:"lithosphérique qui s'épaissit.",
 285:"elle a une densité qui devient supérieure",453:"métagabbros à faciès schiste bleu, puis éclogites,",463:"Ainsi, les lithosphères océanique et continentale",
 469:"globalement plus jeune que la croûte continentale.",256:"Alors que les matériaux de la lithosphère continentale",265:"de la lithosphère continentale.",420:"seule une petite fraction de la lithosphère continentale"}
for k,v in F.items(): subs[k][2]=v
json.dump(subs, open(sys.argv[2],'w'), ensure_ascii=False, indent=0)
off=float(sys.argv[3]); fmt=lambda x: f'{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{int(round(x*1000))%1000:03d}'
with open(sys.argv[4],'w') as f:
    for i,(a,b,t) in enumerate(subs,1): f.write(f'{i}\n{fmt(a+off)} --> {fmt(b+off)}\n{t}\n\n')
