import json, re, sys
segs = json.load(open(sys.argv[1]))
R = [
 ('plantafleurs','plantes à fleurs'),('par leur assis','par leurs racines'),('Ils me peuvent','Ils ne peuvent'),('de cet espèce','de leurs espèces'),
 ('acquiescent','acquièrent'),('autotrofi','autotrophie'),('cloroplastes','chloroplastes'),
 ('6 CO2 plus 6 H2O','6 CO₂ + 6 H₂O'),('ces 6 H2O6 plus','C₆H₁₂O₆ +'),('6 molécules','6 molécules'),
 ('celles minéraux','sels minéraux'),('celles miniérons','sels minéraux'),('celles minaires','sels minéraux'),
 ('au don nuage','ou de nuage'),("sauf qu'à particulier","sauf cas particulier"),("l'unitrate","le nitrate"),
 ('dans 2 minutes différents','dans deux milieux différents'),('qui ne participe à la reproduction','qui ne participe pas à la reproduction'),
 ('collinaire','caulinaire'),('culinaire','caulinaire'),("s'intéraîter","s'intéresser"),
 ("Mais ce n'est pas intermédiaire des poils absorbants qu'elles puissent","Mais c'est par l'intermédiaire des poils absorbants qu'elle puise"),
 ('caronces','carences'),('carancé','carencé'),('Rosene','Rosène'),('Rosé,','Rosène,'),('de bras si cassées','de Brassicacées'),('le Colza','le colza'),
 ("l'horizodère","le rhizoderme"),('rhizodère','rhizoderme'),('milieu accueil','milieu aqueux'),('observant microscope','observant au microscope'),
 ('mycorrhizes','mycorhizes'),('simbioses','symbioses'),('simbiose','symbiose'),('de mes mycorhizes','nommées mycorhizes'),
 ('miséliens','mycéliens'),('filaments mycéliens, capte','filaments mycéliens captent'),('xylem ','xylème '),('major partie','majeure partie'),
 ('phogiques','fongiques'),('ou un seul, ou bien établi à des','ou un seul arbre, ou bien établir des'),('nutriments privés','nutriments prélevés'),
 ('rhizobium','Rhizobium'),('phabacées','Fabacées'),('du poids','du pois'),('NH4+','NH₄⁺'),('Et ces nodosités, en fait, la plot doit','Et sans nodosités, en fait, la plante doit'),
 ('haineau-troman présente','NO₃⁻ présent'),('mycoris','mycorhizes'),("Regardons maintenant ce qui se passe au niveau du système\nracinaire","x"),
 ('séramification','ses ramifications'),('tilaquides','thylakoïdes'),('télacouides','thylakoïdes'),("de l'ordre de millimètre carré","de l'ordre de 1 000 mètres carrés"),
 ('préférenciément','préférentiellement'),('mesurime','Mesurim'),('un entour de','un ordre de'),('sont d\'absorber','sont absorbés'),
 ('on se trouvait','on trouve'),("l'hostiole","l'ostiole"),("permettre d'absorption","permettre d'absorber"),('il n\'est pas entre','et non pas entre'),
 ('résation','réalisation'),("L'estomate constitue","Les stomates constituent"),("en évidence\nl'estomate","x"),
 ("l'estomate","les stomates"),("L'estomate","Les stomates"),('estomates','stomates'),('apovri','appauvri'),('impayante','inférieure'),('nombreux tomates','nombreux stomates'),
 ("chlorophyllien ","chlorophylliens "),("chlorophyllien.","chlorophylliens."),('Toutes les longueurs',"Toutes les longueurs"),
 ('qu\'on suppose non toxiques','qu\'on suppose non toxique'),('la major','la majeure'),('6 H2O','6 H₂O'),
]
subs=[]
for s in segs:
    t = s['text'].strip()
    for a,b in R: t = t.replace(a,b)
    t = t.replace('dioxyde de carbone pour pouvoir','dioxyde de carbone pour pouvoir')
    subs.append([round(s['start'],2), round(s['end'],2), t])
# corrections ciblées par segment
fix = {
 "Regardons maintenant ce qui se passe au niveau du système": "Regardons maintenant ce qui se passe au niveau du système",
}
json.dump(subs, open(sys.argv[2],'w'), ensure_ascii=False, indent=0)
for a,b,t in subs: print(f'{a:7.2f} {t}')
# --- retouches à la main, par numéro de ligne ---
F = {32:"Les plantes à fleurs ont donc besoin de dioxyde de carbone, de lumière, d'eau et de sels",
 99:"Bien que la majeure partie des prélèvements d'eau et de sels", 100:"minéraux soient réalisés par des mycorhizes, en fait on vous",
 127:"Donc tout ce qui est poils absorbants, associés aux", 128:"mycorhizes et aux nodosités, constitue une véritable surface",
 136:"caulinaire et on va s'intéresser au rôle des feuilles", 143:"au niveau des chloroplastes grâce à des pigments chlorophylliens",
 194:"une dans un milieu normal de concentration en CO₂ et l'autre", 195:"dans un milieu qui est appauvri en fait en CO₂.",
 196:"Et dans le milieu appauvri en CO₂, les stomates", 197:"vont être fermés alors que dans celui qui est",
 198:"enrichi en CO₂, les stomates vont être ouverts.", 202:"l'ouverture ou la fermeture de vos stomates.",
 212:"de l'eau, des sels minéraux, de la lumière et du dioxyde", 88:"filaments mycéliens captent l'eau et les sels minéraux qui sont acheminés",
 39:"Mais les sels minéraux sont faiblement concentrés dans le sol,"}
for k,v in F.items(): subs[k][2] = v
json.dump(subs, open(sys.argv[2],'w'), ensure_ascii=False, indent=0)
# fichier .srt (temps de la vidéo = temps de la voix + générique)
off = float(sys.argv[3]); fmt = lambda x: f'{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{int(round(x*1000))%1000:03d}'
with open(sys.argv[4],'w') as f:
    for i,(a,b,t) in enumerate(subs,1): f.write(f'{i}\n{fmt(a+off)} --> {fmt(b+off)}\n{t}\n\n')
