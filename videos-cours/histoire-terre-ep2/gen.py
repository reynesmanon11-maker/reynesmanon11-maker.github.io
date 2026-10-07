# Épisode 2 — L'histoire géologique de la France (bilan du chapitre 4, activité 2).
# Les temps sont ceux de la voix (secondes dans l'audio).
from commun import *
from geo import *
META = {'serie': 'HISTOIRE DE LA TERRE', 'episode': 'Épisode 2', 'titre': 'Naissance et mort des montagnes', 'offset': 6}
CHAPITRES = []

def carton(t0, t1, sur, l1, l2, c2='var(--soleil)', t_l1=None, t_l2=None, t2=90):
    t_l1 = t_l1 or t0+.4; t_l2 = t_l2 or t_l1+1
    scene(t0, t1, f'''<div class="abs" style="left:150px;top:330px">
  <div class="k" style="font-size:120px;color:var(--rouge)"{A(t0+.2,"left",.8)}>{sur}</div>
  <div class="k" style="font-size:140px;margin-top:10px"{A(t_l1,"up",.9)}>{l1}</div>
  <div class="k" style="font-size:{t2}px;color:{c2}"{A(t_l2,"up",.9)}>{l2}</div></div>
<div class="abs" style="right:0;top:0;bottom:0;width:10px;background:var(--rouge)"{A(t0+.1,"wipedown",1.2)}></div>''', cam=f'{t0} 0 0 1; {t1} -40 0 1.05')

def axe_temps(x0, x1, y, ga_max, t, pas=1):
    X = lambda ga: x0 + (x1-x0)*ga/ga_max
    g = f'<g{A(t,"fade")}><path d="M{x0} {y} L {x1+40} {y}" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"/><text x="{x1+40}" y="{y-20}" text-anchor="end" class="lab-s">âge</text>' + \
        ''.join(f'<line x1="{X(v)}" x2="{X(v)}" y1="{y-8}" y2="{y+8}" stroke="#f1ede6" stroke-width="3"/><text x="{X(v)}" y="{y+44}" text-anchor="middle" class="lab-s">{str(v).replace(".",",")} Ga</text>' for v in [i*pas for i in range(int(ga_max/pas)+1)]) + '</g>'
    return g, X

# ======================================================================
# générique muet
scene(-6, 0.6, f'''
<div class="abs" style="left:150px;top:300px">
  <div class="sur"{A(-5.6,"fade",1)}>Une série de SVT · Terminale spécialité</div>
  <div class="k" style="font-size:96px;margin-top:26px;color:var(--rouge)"{A(-5.0,"left",1)}>Histoire de la Terre</div>
  <div class="k" style="font-size:200px;margin-top:6px;color:#fff"{A(-4.2,"zoom",1.4)}>Naissance et mort</div>
  <div class="k" style="font-size:200px;color:var(--soleil)"{A(-3.6,"zoom",1.4)}>des montagnes</div>
  <div class="p" style="margin-top:24px"{A(-2.4,"up")}>Chapitre 4 · L’histoire géologique de la France — Épisode 2</div>
</div>''', cam='-6 0 0 1.05; 0.6 -30 0 1')

# 0.6 – 13.7 : des âges très différents
ax, X = axe_temps(260, 1660, 760, 4.5, 0.8, .5)
scene(0.6, 13.7, titre(0.8,'Une question d’âge','Océans jeunes, continents très vieux') + svg(f'''
{ax}
<rect x="{X(0)}" y="560" width="{X(.2)-X(0):.0f}" height="70" fill="var(--eau)"{A(3.0,"growx",.8)}/>
<text x="{X(.25)}" y="608" class="lab" fill="var(--eau)"{A(3.2,"right")}>lithosphère océanique : ≤ 200 Ma</text>
<rect x="{X(0)}" y="660" width="{X(4.1)-X(0):.0f}" height="70" fill="#d9b48a"{A(7.4,"growx",2.2)}/>
<text x="{X(.1)}" y="707" class="lab" fill="#1a1208"{A(8.4,"fade")}>roches des continents : jusqu’à plus de 4 Ga</text>
'''))

# 13.7 – 31.4 : les plus vieilles roches
scene(13.7, 31.4, f'''
<div class="abs" style="left:150px;top:180px">
  <div class="sur"{A(9.4,"fade")}>Les plus anciennes, datées par radiochronologie</div>
  <div class="h2" style="margin-top:16px"{A(14.0,"up")}>Ceinture de Nuvvuagittuq · Canada</div>
  <div class="pm" style="margin-top:8px;font-style:italic"{A(15.2,"fade")}>(« aucune idée de comment ça se prononce »)</div>
</div>
<div class="carte" style="left:150px;top:470px;width:760px;text-align:center"{A(19.6,"up")}>
  <div class="sur">ces roches</div><div class="k" style="font-size:220px;color:#d9b48a"><span{A(20.4,"count",1.4)} data-to="4.28" data-dec="2">0</span> Ga</div></div>
<div class="carte" style="left:1010px;top:470px;width:760px;text-align:center"{A(23.4,"up")}>
  <div class="sur">la Terre</div><div class="k" style="font-size:220px;color:#fff"><span{A(24.2,"count",1.4)} data-to="4.55" data-dec="2">0</span> Ga</div>
  <div class="pm"{A(27.4,"up")}>âge déterminé grâce aux météorites</div></div>''')

# 31.4 – 56.7 : deux croûtes, deux destins
scene(31.4, 56.7, titre(31.6,'Pourquoi cette différence ?','Deux croûtes, deux recyclages') + svg(f'''
<g transform="translate(0,0)"><g{A(36.4,"move",3)} data-dy="200">
 <rect x="230" y="430" width="560" height="120" rx="10" fill="{CO}"/><text x="510" y="502" text-anchor="middle" class="lab">croûte océanique · d = 2,9</text></g></g>
<text x="510" y="870" text-anchor="middle" class="lab" fill="var(--eau)"{A(38.0,"up")}>recyclée en quasi-totalité (subduction)</text>
<rect x="1130" y="430" width="560" height="120" rx="10" fill="#d9b48a"{A(39.5,"pop")}/><text x="1410" y="502" text-anchor="middle" class="lab" fill="#1a1208"{A(39.5,"pop")}>croûte continentale · d = 2,7</text>
<text x="1410" y="620" text-anchor="middle" class="lab"{A(43.0,"up")}>reste en surface (moins dense)</text>
<text x="1410" y="700" text-anchor="middle" class="lab-s"{A(46.0,"up")}>seule l’érosion la recycle :</text>
<text x="1410" y="830" text-anchor="middle" style="font-family:Bebas;font-size:120px" fill="var(--soleil)"{A(49.0,"pop")}>≈ 10 %</text>
<text x="1410" y="890" text-anchor="middle" class="lab-s"{A(51.0,"up")}>→ d’où des âges bien plus anciens</text>
'''))

# 56.7 – 74.9 : la question de l'épisode
scene(56.7, 74.9, f'''
<div class="abs" style="left:150px;top:220px;width:1620px">
  <div class="pastille"{A(56.8,"pop")}>La question de l'épisode</div>
  <div class="k" style="font-size:96px;margin-top:36px;line-height:1"{A(57.2,"type",5.5)}>Comment la formation et la disparition des chaînes de montagnes racontent-elles l’histoire mouvementée de la Terre ?</div>
  <div style="display:flex;gap:30px;margin-top:60px">
    <div class="carte" style="position:relative;width:700px"{A(65.0,"up")}><span class="k" style="font-size:60px;color:var(--rouge)">1</span> <span class="h3">La formation des chaînes</span></div>
    <div class="carte" style="position:relative;width:700px"{A(68.6,"up")}><span class="k" style="font-size:60px;color:var(--rouge)">2</span> <span class="h3">Le passé mouvementé de la Terre</span></div>
  </div></div>''')

# 74.9 – 79.6 : carton IV
carton(74.6, 79.6, 'IV · La formation', 'des chaînes de montagnes', '1 · La recherche des ceintures orogéniques', t_l1=75.0, t_l2=76.6)

# 79.6 – 102.6 : l'orogenèse
scene(79.6, 102.6, titre(79.8,'Définition','L’orogenèse') + f'''
<div class="carte" style="left:150px;top:330px;width:1620px"{A(80.0,"up")}><span class="p">= la <b style="color:#fff">formation des chaînes de montagnes</b>, résultant de la <span class="mark"{A(82.6,"hl",.7)}>convergence de plaques lithosphériques</span></span></div>''' + svg(f'''
<g{A(85.6,"up")}><rect x="150" y="520" width="780" height="440" rx="22" fill="rgba(26,26,30,.9)" stroke="var(--rouge)" stroke-width="3"/>
<text x="190" y="580" class="lab" fill="#ff8a8a">LE PLUS SOUVENT</text><text x="190" y="626" class="lab">collision de deux masses continentales</text>
<polygon points="250,860 520,860 560,760 600,860" fill="#d9b48a"/><polygon points="600,860 860,860 860,900 250,900 250,860" fill="#d9b48a"/>
<path d="M280 760 L 440 760" stroke="#f1ede6" stroke-width="6" marker-end="url(#fl)"/><path d="M840 760 L 680 760" stroke="#f1ede6" stroke-width="6" marker-end="url(#fl)"/></g>
<g{A(89.8,"up")}><rect x="990" y="520" width="780" height="440" rx="22" fill="rgba(26,26,30,.9)" stroke="#8d8a86" stroke-width="2"/>
<text x="1030" y="580" class="lab" fill="#aaa">PARFOIS</text><text x="1030" y="626" class="lab">subduction sous un continent</text><text x="1030" y="664" class="lab-s">ex. : la Cordillère des Andes</text>
<polygon points="1030,830 1470,830 1600,900 1030,900" fill="{CO}"/><polygon points="1470,800 1520,740 1560,790 1740,790 1740,900 1600,900 1470,830" fill="#d9b48a"/></g>
<g{A(96.4,"pop")}><text x="540" y="1015" text-anchor="middle" class="lab" fill="var(--soleil)">★ ce chapitre</text></g>
'''))

# 102.6 – 124 : la ceinture alpine
chaines = [(112.3,'Atlas',320,700),(111.3,'Alpes',620,560),(112.8,'Balkans',900,600),(113.4,'Caucase',1200,520),(114.2,'Himalaya',1560,600)]
monts = ''.join(f'<g{A(t,"pop",.6)}><polygon points="{x-70},{y+40} {x},{y-60} {x+70},{y+40}" fill="#d9b48a"/><polygon points="{x-22},{y-28} {x},{y-60} {x+22},{y-28}" fill="#fff"/>'
                f'<text x="{x}" y="{y+90}" text-anchor="middle" class="lab">{n}</text></g>' for t,n,x,y in chaines)
scene(102.6, 124, titre(102.8,'Une même orogenèse, un alignement','La ceinture alpine') + svg(f'''
<path d="M260 760 C 500 600, 800 640, 1000 620 C 1200 580, 1400 560, 1700 640" stroke="var(--rouge)" stroke-width="40" stroke-opacity=".25" fill="none" stroke-linecap="round"{A(106.3,"draw",1.6)}/>
{monts}
<text x="960" y="880" text-anchor="middle" class="lab" fill="var(--soleil)"{A(117.0,"up")}>formée depuis –65 Ma (ère tertiaire)…</text>
<text x="960" y="940" text-anchor="middle" class="lab"{A(120.6,"up")}>… par la fermeture d’un vaste océan disparu : <tspan fill="var(--eau)" font-weight="800">la Téthys</tspan></text>
'''))

# 124 – 153.4 : retrouver les ceintures anciennes
indices = [(138.0,'roches métamorphiques','issues de déformations en compression'),(143.0,'roches magmatiques','mises en place en profondeur, exhumées par l’érosion'),(150.6,'failles inverses','et chevauchements')]
scene(124, 153.4, titre(124.2,'Ceintures récentes, ceintures anciennes','Lire une montagne disparue') + svg(f'''
{chaine_vieillit(128.3, 134.5, x=150, y=560, w=760)}
<text x="530" y="300" text-anchor="middle" class="lab"{A(126.0,"up",o=131.5)}>récente : relief très marqué</text>
<text x="530" y="300" text-anchor="middle" class="lab" fill="var(--soleil)"{A(132.0,"up")}>ancienne : le relief est érodé…</text>
''') + ''.join(f'''<div class="carte" style="left:1010px;top:{330+i*190}px;width:760px;padding:24px 32px"{A(t,"left")}><div class="h3" style="color:var(--soleil)">{n}</div><div class="pm">{d}</div></div>''' for i,(t,n,d) in enumerate(indices)) +
  f'<div class="abs pm" style="left:1010px;top:270px"{A(135.0,"fade")}>… mais il reste des <b style="color:#fff">indices</b> :</div>')

# 153.4 – 171 : cycles orogéniques
bosses = ''.join(f'<path d="M{260+i*300} 760 C {300+i*300} 760, {330+i*300} 520, {380+i*300} 520 C {430+i*300} 520, {470+i*300} 760, {560+i*300} 760" stroke="#d9b48a" stroke-width="6" fill="none"{A(158.0+i*.6,"draw",1)}/>' for i in range(5))
scene(153.4, 171, titre(153.6,'Document 1 · à l’échelle du globe','Une chronologie des cycles orogéniques') + svg(f'''
{bosses}
<path d="M240 800 L 1720 800" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"{A(155,"draw",1)}/>
<text x="240" y="850" class="lab-s"{A(155,"fade")}>il y a plusieurs milliards d’années</text><text x="1720" y="850" text-anchor="end" class="lab-s"{A(155,"fade")}>aujourd’hui</text>
<g{A(164.2,"up")}><rect x="380" y="900" width="1160" height="80" rx="40" fill="rgba(26,26,30,.9)" stroke="var(--rouge)" stroke-width="2"/>
<text x="960" y="952" text-anchor="middle" class="lab">cycle orogénique = formation <tspan fill="var(--soleil)">puis disparition</tspan> (érosion) d’une chaîne</text></g>
'''))

# 171 – 189.9 : en France
coul = {'armoricain':'#7d9cc4','central':'#7d9cc4','vosges':'#7d9cc4','alpes':'#e88a5a','pyrenees':'#e88a5a'}
scene(171, 189.9, titre(171.2,'Sur la carte géologique de la France','Deux grandes orogenèses') + svg(
  carte_france(700, 610, 72, 171.4, {'alpes':176.4,'pyrenees':176.9,'central':181.7,'armoricain':182.7,'vosges':183.8}, coul)) + f'''
<div class="carte" style="left:1150px;top:330px;width:640px"{A(173.4,"left")}><div class="h3" style="color:#e88a5a">Alpine</div><div class="pm">ère tertiaire · Alpes, Pyrénées</div></div>
<div class="carte" style="left:1150px;top:560px;width:640px"{A(178.1,"left")}><div class="h3" style="color:#7d9cc4">Hercynienne</div><div class="pm">fin de l’ère primaire · Massif central, Massif armoricain, Vosges</div></div>
<div class="abs pm" style="left:1150px;top:830px;width:640px"{A(186.0,"up")}>+ des traces d’orogenèses encore plus anciennes dans les massifs anciens</div>''')

# 189.9 – 208.9 : le modèle
scene(189.9, 208.9, titre(190.0,'Le modèle','Ouverture, fermeture, collision') + svg(f'''
<g transform="translate(96,170) scale(.9)"><g{A(192.0,"fade",.6,o=194.6)}>{etape_ocean()}</g><g{A(195.0,"fade",.6,o=196.6)}>{etape_subduction()}</g><g{A(197.0,"fade",.6)}>{etape_collision()}</g></g>
<g{A(192.0,"pop")}><rect x="160" y="300" width="300" height="60" rx="30" fill="#2e6f9e"/><text x="310" y="340" text-anchor="middle" class="lab">1 · ouverture</text></g>
<g{A(195.0,"pop")}><rect x="490" y="300" width="300" height="60" rx="30" fill="{CO}"/><text x="640" y="340" text-anchor="middle" class="lab">2 · subduction</text></g>
<g{A(197.0,"pop")}><rect x="820" y="300" width="300" height="60" rx="30" fill="#b4572b"/><text x="970" y="340" text-anchor="middle" class="lab">3 · collision</text></g>
<text x="960" y="1040" text-anchor="middle" class="lab"{A(198.4,"up")}>→ des indices à retrouver sur le terrain, et à dater</text>
'''))

# 208.9 – 226.8 : fragmentation, l'Afrique de l'Est
r0, _ = rift(1e6, 1e6, 1e6, 1e6, None, y_top=560, y_bot=860)   # croûte intacte
scene(208.9, 226.8, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(209.0,"left")}>2 · Les traces d’une fragmentation des continents</div>'
      f'<div class="h2" style="margin-top:14px"{A(213.0,"up")}>Aujourd’hui : l’Afrique de l’Est</div></div>' + svg(f'''
<g{A(214.0,"fade")}>{r0}</g>
<text x="960" y="500" text-anchor="middle" class="lab"{A(219.4,"up")}>une déchirure de la lithosphère continentale : un <tspan fill="var(--soleil)" font-weight="800">rift continental</tspan></text>
<path d="M800 420 L 420 420" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(224.4,"draw",.8)}/>
<path d="M1120 420 L 1500 420" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(224.4,"draw",.8)}/>
<g{A(225.6,"pop")}><rect x="880" y="390" width="160" height="60" rx="30" fill="#2a2a2f" stroke="var(--soleil)" stroke-width="2"/><text x="960" y="430" text-anchor="middle" class="lab">GPS</text></g>
'''))

# 226.8 – 276.4 : le rift se creuse
rf, coins = rift(230.8, 246.0, 1e6, 259.0, None, y_top=620, y_bot=920, d=5)
scene(226.8, 276.4, titre(227.0,'Une tectonique en distension','Failles normales et blocs basculés') + svg(f'''
{rf}
<path d="M330 540 L 150 540" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(237.0,"draw",.6)}/>
<path d="M1590 540 L 1770 540" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(237.0,"draw",.6)}/>
<text x="960" y="550" text-anchor="middle" class="lab" fill="var(--soleil)"{A(238.6,"up")}>étirement et amincissement</text>
<text x="960" y="430" text-anchor="middle" class="lab"{A(231.2,"up",o=242.4)}>failles normales parallèles → un fossé d’effondrement « en marches d’escalier »</text>
<text x="960" y="430" text-anchor="middle" class="lab"{A(243.0,"up",o=255.2)}>des failles légèrement courbes : les blocs <tspan fill="var(--soleil)">basculent</tspan></text>
<text x="960" y="430" text-anchor="middle" class="lab"{A(255.6,"up")}>dans le fossé : des roches sédimentaires continentales</text>
''') + f'''<div class="abs" style="left:150px;top:290px;display:flex;gap:14px">
<div class="pastille o"{A(259.0,"pop")}>détritiques : conglomérats</div><div class="pastille" style="background:#7a6aa8"{A(263.0,"pop")}>évaporites : gypse, sel</div></div>''',
  cam='226.8 0 0 1; 276.4 0 0 1.04')

# 276.4 – 292 : rupture, le manteau remonte, une dorsale naît
scene(276.4, 292, titre(276.6,'Si l’étirement se poursuit…','La croûte rompt : un océan naît') + svg(f'''
<g transform="translate(0,60)">{etape_ocean()}</g>
<path d="M960 980 L 960 640" stroke="var(--rouge)" stroke-width="10" marker-end="url(#flr)"{A(279.8,"draw",1.2)}/>
<text x="1000" y="900" class="lab"{A(280.6,"up")}>le manteau remonte, hydraté…</text>
<text x="1000" y="945" class="lab-s"{A(284.6,"up")}>… fusion partielle → une croûte océanique</text>
<g{A(289.4,"pop")}><text x="960" y="520" text-anchor="middle" style="font-family:Bebas;font-size:84px" fill="var(--soleil)">DORSALE</text></g>
<text x="960" y="570" text-anchor="middle" class="lab"{A(290.4,"up")}>c’est l’accrétion océanique</text>
''') )

# 292 – 316 : deux marges passives
r1, _ = rift(1, 1, 1, 1, 1, n=3, x0=120, x1=760, y_top=600, y_bot=820, d=.01)
scene(292, 316, titre(292.2,'Le plancher océanique s’étend','Deux marges passives') + svg(f'''
<rect x="0" y="760" width="1920" height="320" fill="{AS}"/>
<g transform="translate(-60,0)"><g{A(293.0,"move",5)} data-dx="-140">{r1}</g></g>
<g transform="translate(1980,0) scale(-1,1)"><g{A(293.0,"move",5)} data-dx="-140">{r1}</g></g>
<rect x="700" y="610" width="520" height="140" fill="{CO}"{A(293.4,"growx",5)} style="transform-origin:center"/>
<path d="M960 600 L 960 760" stroke="var(--soleil)" stroke-width="4" stroke-dasharray="10 8"{A(294,"fade")}/>
<text x="960" y="570" text-anchor="middle" class="lab" fill="var(--soleil)"{A(294,"up")}>dorsale</text>
<g{A(311.2,"pop")}><text x="330" y="440" text-anchor="middle" style="font-family:Bebas;font-size:70px" fill="#fff">MARGE PASSIVE</text></g>
<g{A(311.6,"pop")}><text x="1590" y="440" text-anchor="middle" style="font-family:Bebas;font-size:70px" fill="#fff">MARGE PASSIVE</text></g>
<text x="960" y="980" text-anchor="middle" class="lab"{A(298.7,"up")}>transition océan / continent dans une même plaque · <tspan fill="var(--soleil)"{A(306.6,"fade")}>presque inactive</tspan></text>
'''))

# 316 – 354 : document 2, l'organisation d'une marge passive
rm, cm = rift(316.4, 316.4, 316.6, 317.0, 349.0, y_top=600, y_bot=900, d=2.2)
scene(316, 354, titre(316.2,'Document 2 · vue par sismique-réflexion','Anatomie d’une marge passive') + svg(f'''
{rm}
<path d="M{cm[1][0][0]+90:.0f} {cm[1][0][1]+120:.0f} L 760 1000" stroke="#fff" stroke-width="3"{A(318.6,"draw",.5)}/>
<text x="760" y="1035" text-anchor="middle" class="lab"{A(318.8,"up")}>blocs basculés le long de failles courbes</text>
<path d="M{(cm[2][1][0]+cm[2][0][0])/2:.0f} {cm[2][1][1]+8:.0f} L 900 400" stroke="#c8a48c" stroke-width="3"{A(327.6,"draw",.5)}/>
<text x="900" y="385" text-anchor="middle" class="lab" fill="#c8a48c"{A(327.8,"up")}>sédiments anté-rift</text>
<text x="900" y="420" text-anchor="middle" class="lab-s"{A(331.2,"fade")}>recoupés par les failles · déposés avant le rift</text>
<path d="M{cm[3][0][0]+25:.0f} {cm[3][0][1]-8:.0f} L 1330 460" stroke="{SYN}" stroke-width="3"{A(336.0,"draw",.5)}/>
<text x="1330" y="445" text-anchor="middle" class="lab" fill="{SYN}"{A(336.0,"up")}>syn-rift : évaporites en éventail</text>
<text x="1330" y="480" text-anchor="middle" class="lab-s"{A(341.2,"fade")}>déposés pendant le basculement</text>
<path d="M1500 {cm[4][1][1]-30:.0f} L 1640 330" stroke="{POST}" stroke-width="3"{A(349.0,"draw",.5)}/>
<text x="1640" y="315" text-anchor="middle" class="lab" fill="{POST}"{A(349.2,"up")}>post-rift : argilites</text>
<text x="1640" y="350" text-anchor="middle" class="lab-s"{A(350.6,"fade")}>discordantes · après le rifting</text>
'''))

# 354 – 383.9 : les ophiolites
scene(354, 383.9, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(354.2,"left")}>3 · Les traces d’un ancien domaine océanique</div>'
      f'<div class="h2" style="margin-top:14px"{A(361.0,"up")}>Les ophiolites</div>'
      f'<div class="pm" style="margin-top:14px;width:760px"{A(362.0,"up")}>des lambeaux de lithosphère océanique, au cœur des chaînes : <b style="color:#fff">les vestiges d’un océan disparu</b></div></div>'
      + svg(ophiolite(1000, 960, [370.3, 374.2, 376.3, 382.0], w=340)))

# 383.9 – 418.4 : métamorphisme hydrothermal, puis suture
scene(383.9, 418.4, titre(384.0,'Un métamorphisme lié à l’hydrothermalisme','Des roches transformées par l’eau') + f'''
<div class="carte" style="left:150px;top:330px;width:520px"{A(388.6,"up")}><div class="h3" style="color:#7fb08a">Péridotites</div><div class="pm">→ serpentinisées</div></div>
<div class="carte" style="left:700px;top:330px;width:520px"{A(392.6,"up")}><div class="h3" style="color:#c9a36a">Gabbros</div><div class="pm">faciès amphibolite<br><span class="lab-s">(hornblende)</span></div></div>
<div class="carte" style="left:1250px;top:330px;width:520px"{A(397.4,"up")}><div class="h3" style="color:#62c98d">… ou schiste vert</div><div class="pm">chlorite, actinote</div></div>''' + svg(f'''
<g transform="translate(240,450) scale(.75)"><g{A(401.4,"fade",.8)}>{etape_collision()}</g></g>
<g{A(408.4,"pop")}><circle cx="{240+.75*1010:.0f}" cy="{450+.75*(520-180):.0f}" r="70" fill="none" stroke="var(--rouge)" stroke-width="6"/></g>
<text x="1500" y="760" class="lab" fill="#5fd0c3"{A(404.0,"up")}>fragments d’un océan refermé,</text>
<text x="1500" y="800" class="lab"{A(408.0,"up")}>coincés entre deux continents</text>
<text x="1500" y="880" style="font-family:Bebas;font-size:70px" fill="var(--rouge)"{A(411.4,"pop")}>ZONE DE SUTURE</text>
'''))

# 418.4 – 454.2 : les traces d'une subduction (document 3)
pt, PX, PY = diagramme_pt(320, 370, 900, 600, 421.0, chemin_t=436.0, zones_t={'schistes verts':429.0,'schistes bleus':429.8,'éclogites':430.8,'amphibolites':421.4})
bande = ''.join(f'<rect x="{1340+i*150}" y="560" width="150" height="80" fill="{c}"{A(444.4+i*1.2,"growx",.6)}/><text x="{1415+i*150}" y="680" text-anchor="middle" class="lab-s"{A(444.6+i*1.2,"fade")}>{n}</text>' for i,(c,n) in enumerate([('#4e9a5a','sch. verts'),('#3f6fb0','sch. bleus'),('#a8453c','éclogites')]))
scene(418.4, 454.2, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(418.6,"left")}>4 · Les traces d’une subduction</div><div class="h2" style="margin-top:14px"{A(419.2,"up")}>Document 3 · le chemin d’un gabbro</div></div>' + svg(f'''
{pt}
<g{A(431.8,"pop")}><rect x="1300" y="320" width="500" height="80" rx="40" fill="var(--rouge)"/><text x="1550" y="372" text-anchor="middle" class="lab">haute pression · basse température</text></g>
<text x="1550" y="450" text-anchor="middle" class="lab"{A(435.4,"up")}>⇒ une subduction de croûte océanique</text>
{bande}
<text x="1340" y="540" class="lab-s"{A(444.0,"fade")}>Ouest</text><text x="1790" y="540" text-anchor="end" class="lab-s"{A(444.0,"fade")}>Est</text>
<path d="M1360 730 L 1780 730" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(450.4,"draw",.8)}/>
<text x="1570" y="790" text-anchor="middle" class="lab" fill="var(--soleil)"{A(450.8,"up")}>subduction vers l’Est</text>
'''))

# 454.2 – 470.9 : l'obduction
scene(454.2, 470.9, titre(454.4,'Remarque','Parfois, pas de subduction : l’obduction') + svg(f'''
<rect x="200" y="640" width="1520" height="300" fill="{AS}"/>
<rect x="200" y="560" width="900" height="120" fill="#d9b48a"/>
<rect x="200" y="680" width="900" height="120" fill="{ML}"/>
<g{A(461.8,"move",4)} data-dx="-520" data-dy="-40"><polygon points="1140,600 1720,600 1720,660 1140,660" fill="{CO}"/><polygon points="1140,660 1720,660 1720,720 1140,720" fill="{ML}" fill-opacity=".9"/></g>
<text x="960" y="1010" text-anchor="middle" class="lab"{A(461.8,"up")}>la lithosphère océanique est <tspan fill="var(--soleil)">charriée sur</tspan> la lithosphère continentale avant la collision</text>
<text x="960" y="470" text-anchor="middle" style="font-family:Bebas;font-size:110px" fill="#fff"{A(468.6,"zoom",.6)}>OBDUCTION</text>
<text x="960" y="520" text-anchor="middle" class="lab-s"{A(458.9,"up")}>métamorphisme hydrothermal seulement</text>
'''))

# 470.9 – 510.7 : les traces d'une collision
scene(470.9, 510.7, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(471.0,"left")}>5 · Les traces d’une collision</div><div class="h2" style="margin-top:14px"{A(471.6,"up")}>Une croûte continentale enfouie</div></div>' + f'''
<div class="carte" style="left:150px;top:330px;width:780px"{A(475.4,"up")}><div class="h3" style="color:#d9b48a">Gneiss</div><div class="pm">un granite soumis à haute pression, basse température</div></div>
<div class="carte" style="left:990px;top:330px;width:780px"{A(480.0,"up")}><div class="h3" style="color:#ff9a7a">Migmatites</div><div class="pm">début de fusion partielle du gneiss : <b style="color:#fff">l’anatexie</b></div></div>
<div class="abs c" style="left:0;right:0;top:560px"><span class="pm"{A(489.0,"up")}>⇒ une collision, après la fermeture d’un océan</span></div>''' + svg(f'''
<g{A(496.6,"up")}><path d="M260 860 C 330 740, 400 740, 470 860 C 540 980, 610 980, 680 860" stroke="#d9b48a" stroke-width="10" fill="none"/>
<path d="M260 920 C 330 800, 400 800, 470 920 C 540 1040, 610 1040, 680 920" stroke="#a8825a" stroke-width="10" fill="none"/><text x="470" y="700" text-anchor="middle" class="lab">plis</text></g>
<g{A(497.8,"up")}><rect x="780" y="760" width="160" height="80" fill="#d9b48a"/><rect x="940" y="800" width="160" height="80" fill="#d9b48a"/><rect x="780" y="840" width="160" height="80" fill="#a8825a"/><rect x="940" y="880" width="160" height="80" fill="#a8825a"/>
<path d="M960 740 L 920 980" stroke="#111" stroke-width="5"/><text x="940" y="700" text-anchor="middle" class="lab">failles inverses</text></g>
<g{A(499.4,"up")}><polygon points="1220,900 1700,900 1700,960 1220,960" fill="#a8825a"/><polygon points="1240,840 1660,820 1720,880 1300,900" fill="#d9b48a"/><polygon points="1300,780 1600,760 1660,820 1240,840" fill="#c9a36a"/>
<text x="1470" y="700" text-anchor="middle" class="lab">nappes de charriage</text></g>
<text x="960" y="1040" text-anchor="middle" class="lab" fill="var(--soleil)"{A(502.0,"up")}>raccourcissement + épaississement de la croûte, sous une contrainte convergente</text>
'''))

# 510.7 – 548.3 : imagerie sismique : la racine crustale
scene(510.7, 548.3, titre(510.9,'Imagerie sismique · profil ECORS','Une racine sous la chaîne') + svg(f'''
<rect x="200" y="420" width="1520" height="600" fill="{AS}" fill-opacity=".9"{A(511.4,"fade")}/>
<g{A(511.4,"fade")}>{chaine(200, 420, 1520, 180, 0)}</g>
<g{A(524.6,"fade",2)}>{chaine(200, 420, 1520, 180, 260)}</g>
<path d="M200 660 C 700 660, 760 660, 960 660 C 1160 660, 1220 660, 1720 660" stroke="#fff" stroke-width="4" stroke-dasharray="14 10"{A(522.8,"fade",.6,o=524.6)}/>
<text x="1700" y="640" text-anchor="end" class="lab"{A(522.6,"up")}>Moho</text>
<path d="M960 690 L 960 900" stroke="var(--soleil)" stroke-width="6" marker-end="url(#flj)"{A(527.6,"draw",1)}/>
<text x="1000" y="860" class="lab" fill="var(--soleil)"{A(530.6,"up")}>racine crustale : plus de 40 km sous les Alpes</text>
<g{A(535.0,"fade",.8)}><ellipse cx="960" cy="1000" rx="360" ry="80" fill="#5ab8ff" fill-opacity=".35"/></g>
<text x="400" y="1000" class="lab" fill="#a8dcff"{A(535.2,"up")}>tomographie : roches « froides » épaissies</text>
<text x="400" y="1040" class="lab-s"{A(538.4,"up")}>(ondes plus rapides = roche plus froide)</text>
'''))

# 548.3 – 579.7 : la coésite, croûte continentale subduite
cx0, cy0, cw, ch = 320, 330, 760, 640
scene(548.3, 579.7, titre(548.5,'Document 4 · le domaine de stabilité du quartz','La coésite, une preuve de pression') + svg(f'''
<g{A(553.4,"fade")}><rect x="{cx0}" y="{cy0}" width="{cw}" height="{ch}" fill="#1c1c20" stroke="#8d8a86" stroke-width="2"/>
<text x="{cx0}" y="{cy0-16}" class="lab-s">température (°C) →</text><text x="{cx0-16}" y="{cy0+ch}" text-anchor="end" class="lab-s">pression ↓</text>
<polygon points="{cx0},{cy0} {cx0+cw},{cy0} {cx0+cw},{cy0+ch*.5} {cx0},{cy0+ch*.62}" fill="#d9b48a" fill-opacity=".35"/>
<polygon points="{cx0},{cy0+ch*.62} {cx0+cw},{cy0+ch*.5} {cx0+cw},{cy0+ch} {cx0},{cy0+ch}" fill="#e5333b" fill-opacity=".3"/>
<text x="{cx0+cw/2}" y="{cy0+ch*.28}" text-anchor="middle" style="font-family:Bebas;font-size:64px" fill="#d9b48a" dx="-120">QUARTZ</text>
<text x="{cx0+cw/2}" y="{cy0+ch*.82}" text-anchor="middle" style="font-family:Bebas;font-size:64px" fill="#ff8a8a" dx="-120">COÉSITE</text></g>
<path d="M{cx0+cw*.78} {cy0+ch*.12} L {cx0+cw*.82} {cy0+ch*.9}" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(568.9,"draw",2)}/>
<text x="{cx0+cw*.76}" y="{cy0+ch*.5}" text-anchor="end" class="lab" fill="var(--soleil)"{A(569.4,"up")}>enfouissement</text>
''') + f'''<div class="abs" style="left:1180px;top:330px;width:600px">
<div class="pm"{A(553.4,"up")}><b style="color:#fff">coésite</b> = forme du quartz qui n’existe qu’à très haute pression</div>
<div class="pm" style="margin-top:26px"{A(561.0,"up")}>le quartz est un minéral du <b style="color:#fff">grès</b> et du <b style="color:#fff">granite</b> : des roches de la croûte continentale</div>
<div class="carte" style="position:relative;margin-top:36px"{A(572.4,"up")}><span class="pm" style="color:#fff">⇒ une partie de la croûte continentale est entrée en <b style="color:var(--soleil)">subduction</b> lors de la collision</span></div></div>''')

# 579.7 – 618.2 : scénario de formation (document 5)
scene(579.7, 618.2, titre(579.9,'6 · Un scénario','La naissance d’une chaîne de montagnes') + svg(f'''
<g transform="translate(96,170) scale(.9)"><g{A(589.2,"fade",.6,o=599.2)}>{etape_ocean()}</g><g{A(592.4,"fade",.6,o=599.2)}>{etape_subduction()}</g><g{A(599.4,"fade",1)}>{etape_collision()}</g></g>
<text x="960" y="1040" text-anchor="middle" class="lab"{A(589.2,"up",o=592.2)}>convergence de deux plaques lithosphériques</text>
<text x="960" y="1040" text-anchor="middle" class="lab"{A(592.4,"up",o=599.2)}>1 · subduction océanique → fermeture de l’océan</text>
<text x="960" y="1040" text-anchor="middle" class="lab"{A(599.4,"up",o=609.4)}>2 · suture : un peu de croûte continentale subduite, puis collision</text>
<text x="960" y="1040" text-anchor="middle" class="lab" fill="var(--soleil)"{A(609.6,"up")}>3 · la croûte s’épaissit par empilement de nappes de charriage</text>
'''))

# 618.2 – 681.3 : V · paléogéographie
carton(618.2, 621.9, 'V · Les cycles', 'orogéniques', '1 · Paléogéographie et déplacement des continents', t_l1=618.6, t_l2=621.0)
def continents(t, positions, couleur='#d9b48a'):
    return ''.join(f'<g{A(t,"move",3)} data-dx="{dx}" data-dy="{dy}"><ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{couleur}"/></g>' for x,y,rx,ry,dx,dy in positions)
blocs_reunion = [(400,420,140,90,320,90),(1500,450,160,100,-300,60),(560,820,120,80,260,-200),(1400,800,150,90,-270,-180)]
scene(621.9, 681.3, titre(622.1,'Reconstituer la géographie passée','La paléogéographie') + svg(f'''
<rect x="200" y="300" width="1520" height="720" rx="30" fill="#183049"{A(624.6,"fade")}/>
{continents(647.6, blocs_reunion)}
<g{A(657.8,"pop")}><text x="960" y="680" text-anchor="middle" style="font-family:Bebas;font-size:90px" fill="#1a1208">PANGÉE</text></g>
<text x="960" y="740" text-anchor="middle" class="lab" fill="#1a1208"{A(663.0,"up")}>il y a 300 Ma</text>
<g{A(637.9,"pop")}><rect x="240" y="330" width="560" height="64" rx="32" fill="var(--rouge)"/><text x="520" y="373" text-anchor="middle" class="lab">réunion : subduction puis collision</text></g>
<g{A(665.2,"pop")}><rect x="1120" y="330" width="560" height="64" rx="32" fill="#2a6fa8"/><text x="1400" y="373" text-anchor="middle" class="lab">fragmentation : rifts, océans</text></g>
<text x="960" y="980" text-anchor="middle" class="lab-s"{A(668.2,"fade")}>ex. : l’ère secondaire, une phase de dislocation</text>
<text x="960" y="1060" text-anchor="middle" class="lab" fill="var(--soleil)"{A(676.0,"up")}>⇒ les continents bougent avec les plaques lithosphériques</text>
'''))

# 681.3 – 717 : le cycle de Wilson
scene(681.3, 717, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(681.4,"left")}>2 · Des cycles de supercontinents ?</div><div class="h2" style="margin-top:14px"{A(687.0,"up")}>Le cycle de Wilson</div>'
      f'<div class="pm" style="margin-top:12px;width:560px"{A(687.4,"up")}>proposé par le géologue <b style="color:#fff">John Tuzo Wilson</b></div>'
      f'<div class="carte" style="position:relative;margin-top:40px;width:560px"{A(702.6,"up")}><span class="pm">moteur supposé : la <b style="color:#fff">convection du manteau</b></span></div>'
      f'<div class="pm" style="margin-top:20px;width:560px;font-style:italic"{A(707.8,"up")}>données très partielles : mécanisme et périodicité encore étudiés</div></div>'
      + svg(cycle_wilson(1330, 610, 230, [691.6, 693.0, 694.4, 695.4, 696.6, 698.4])) ,)

# 717 – 783.5 : les sutures se rouvrent
scene(717, 783.5, titre(717.2,'Document 6 · où le continent se fracture-t-il ?','Là où il s’était soudé') + f'''
<div class="carte" style="left:150px;top:330px;width:760px"{A(724.0,"left")}><span class="pm">✂ « Un peu comme quand vous vous coupez : on se recoupe plus facilement là où on a déjà cicatrisé. »</span></div>
<div class="carte" style="left:150px;top:560px;width:760px;border-color:rgba(229,51,59,.5)"{A(738.2,"up")}><div class="h3" style="color:#ff8a8a">Suture fragilisée</div>
<div class="pm">le magmatisme de subduction a <b style="color:#fff">appauvri le manteau</b> en minéraux fusibles → il devient cassant → <span class="mark"{A(752.0,"hl",.7)}>la suture se rouvre</span></div></div>
<div class="carte" style="left:1010px;top:560px;width:760px"{A(756.8,"up")}><div class="h3" style="color:#a8dcff">Petit océan (Alpes)</div>
<div class="pm">collision sans magmatisme : manteau non appauvri, moins cassant → <b style="color:#fff">fracture ailleurs</b></div></div>
<div class="abs c" style="left:0;right:0;top:880px"><span class="p"{A(771.8,"up")}>⇒ à chaque suture, les continents <b style="color:#fff">grandissent</b> <span class="lab-s"{A(777.7,"fade")}>(matériaux venus des dorsales et des subductions)</span></span></div>''' + svg(f'''
<g{A(730.5,"fade")}><rect x="1010" y="330" width="760" height="190" rx="22" fill="rgba(26,26,30,.88)"/>
<rect x="1050" y="420" width="680" height="70" rx="8" fill="#d9b48a"/>
<path d="M1390 410 L 1390 500" stroke="#5fd0c3" stroke-width="12"/>
<text x="1390" y="530" text-anchor="middle" class="lab-s">ancienne suture</text></g>
<path d="M1340 380 L 1180 380 M1440 380 L 1600 380" stroke="var(--soleil)" stroke-width="7" marker-end="url(#flj)"{A(734.4,"draw",.8)}/>
'''))

# 783.5 – 790.5 : la périodicité
scene(783.5, 790.5, f'''<div class="abs c" style="left:0;right:0;top:330px"><div class="sur"{A(783.6,"fade")}>Périodicité d’un cycle</div>
<div class="k" style="font-size:300px;color:#fff">≈ <span{A(786.9,"count",1.4)} data-to="500">0</span> Ma</div></div>''')

# 790.5 – 829 : VI · le recyclage
carton(790.5, 795.4, 'VI · Le recyclage', 'des lithosphères', 'océanique et continentale', t_l1=792.3, t_l2=794.2)
scene(795.4, 829, titre(795.6,'Recycler = le devenir des matériaux','Transformés, ou rendus au manteau') + f'''
<div class="carte" style="left:150px;top:340px;width:760px;height:520px"{A(804.8,"left")}><div class="h3" style="color:#d9b48a">Lithosphère continentale</div>
<div class="pm" style="margin-top:20px">transformée sur place par des processus <b style="color:#fff">tectoniques, magmatiques, sédimentaires</b>, orogenèse après orogenèse</div>
<div class="k" style="font-size:120px;color:#d9b48a;margin-top:30px"{A(820.6,"fade")}>des roches très anciennes</div></div>
<div class="carte" style="left:1010px;top:340px;width:760px;height:520px"{A(813.4,"right")}><div class="h3" style="color:#8fb3ff">Lithosphère océanique</div>
<div class="pm" style="margin-top:20px">disparaît presque totalement dans le manteau asthénosphérique</div>
<div class="k" style="font-size:120px;color:#8fb3ff;margin-top:30px">en ≈ <span{A(815.6,"count",1)} data-to="200">0</span> Ma</div></div>''')

# 829 – 907 : vieillissement de la lithosphère océanique (document 7)
la, xs, base, fond = litho_age(831.8, 851.9, 844.2, y=470)
scene(829, 907, titre(829.2,'1 · Le recyclage de la lithosphère océanique','Document 7 · elle vieillit, s’épaissit… et plonge') + svg(f'''
{la}
<text x="230" y="400" class="lab" fill="var(--soleil)"{A(832.7,"up")}>dorsale : mince, chaude, elle « flotte »</text>
<path d="M300 430 L 1500 430" stroke="#f1ede6" stroke-width="4" marker-end="url(#fl)"{A(840.8,"draw",2)}/>
<text x="1500" y="415" text-anchor="end" class="lab-s"{A(841.0,"fade")}>elle s’éloigne et se refroidit</text>
<text x="860" y="{(base[20]+fond[20])/2+10:.0f}" text-anchor="middle" class="lab"{A(853.6,"up")}>le manteau lithosphérique s’épaissit</text>
<g{A(859.4,"pop")}><rect x="1612" y="470" width="296" height="110" rx="16" fill="rgba(26,26,30,.92)" stroke="var(--rouge)" stroke-width="2"/>
<text x="1760" y="515" text-anchor="middle" class="lab-s">d manteau litho. = 3,3</text><text x="1760" y="555" text-anchor="middle" class="lab-s">d croûte océ. = 2,9</text></g>
<g{A(867.9,"pop")}><text x="{xs[13]:.0f}" y="1010" text-anchor="middle" style="font-family:Bebas;font-size:56px" fill="var(--soleil)">40 Ma</text><text x="{xs[13]:.0f}" y="1050" text-anchor="middle" class="lab-s">équilibre isostatique rompu</text></g>
<g{A(875.6,"pop")}><text x="{xs[30]:.0f}" y="1010" text-anchor="middle" style="font-family:Bebas;font-size:56px" fill="var(--rouge)">80 Ma</text><text x="{xs[30]:.0f}" y="1050" text-anchor="middle" class="lab-s">entrée en subduction</text></g>
<path d="M1480 640 C 1540 700, 1560 800, 1570 980" stroke="var(--rouge)" stroke-width="12" marker-end="url(#flr)"{A(875.6,"draw",1.2)}/>
<text x="960" y="370" text-anchor="middle" class="lab"{A(878.3,"up",o=885.4)}>retard : résistance mécanique de l’asthénosphère…</text>
<text x="960" y="370" text-anchor="middle" class="lab" fill="var(--soleil)"{A(885.5,"up",o=890.0)}>… puis tout s’accélère : la lithosphère redevient du manteau</text>
<text x="960" y="370" text-anchor="middle" class="lab"{A(890.2,"up")}>⇒ aucun plancher océanique de plus de 200 Ma aujourd’hui</text>
'''))

# 907 – 925.9 : chaînes jeunes et chaînes âgées (document 8)
lignes = [(914.6,'Début de la collision','quelques dizaines de Ma','quelques centaines de Ma'),(916.0,'Relief','élevé','absent à modéré'),
          (918.8,'Racine crustale (Moho)','profonde (jusqu’à 70 km)','absente ou peu profonde (40 km)'),(920.6,'Roches à l’affleurement','sédimentaires','granite, gneiss')]
tab = ''.join(f'''<div style="display:grid;grid-template-columns:460px 560px 560px;border-top:1px solid rgba(255,255,255,.12)"{A(t,"up")}>
<div class="pm" style="padding:22px 10px;color:#aaa">{a}</div><div class="pm" style="padding:22px 10px;color:#fff">{b}</div><div class="pm" style="padding:22px 10px;color:#fff">{c}</div></div>''' for t,a,b,c in lignes)
scene(907, 925.9, titre(907.2,'2 · Le recyclage de la lithosphère continentale','Document 8 · une chaîne jeune, une chaîne âgée') + f'''
<div class="abs" style="left:150px;top:330px">
<div style="display:grid;grid-template-columns:460px 560px 560px"{A(911.0,"fade")}><div></div><div class="h3" style="color:#e88a5a;padding:10px">Jeune · Alpes, Pyrénées</div><div class="h3" style="color:#7d9cc4;padding:10px">Âgée · Armoricain, Central</div></div>
{tab}</div>
<div class="abs c" style="left:0;right:0;top:960px"><span class="p"{A(922.6,"up")}>⇒ aplanissement et effondrement : <b style="color:#fff">les chaînes disparaissent peu à peu</b></span></div>''')

# 925.9 – 950.9 : quatre familles de processus, puis érosion → transport → dépôt
scene(925.9, 950.9, titre(926.0,'Orogenèse après orogenèse','La croûte continentale se transforme') + f'''
<div class="abs pm" style="left:150px;top:390px"{A(926.4,"up",o=937.4)}>recyclée dans les zones de <b style="color:#fff">subduction</b> et de <b style="color:#fff">collision</b>, cycle après cycle…</div>
<div class="abs" style="left:150px;top:320px;display:flex;gap:18px">
<div class="pastille o"{A(937.8,"pop")}>tectoniques</div><div class="pastille" style="background:#a8453c"{A(938.5,"pop")}>magmatiques</div>
<div class="pastille b"{A(939.2,"pop")}>métamorphiques</div><div class="pastille v"{A(939.8,"pop")}>sédimentaires</div></div>''' + svg(f'''
<polygon points="150,900 380,520 520,640 640,560 820,900" fill="#d9b48a"{A(941.0,"fade")}/>
<path d="M600 720 C 760 800, 900 760, 1080 850 C 1260 930, 1400 880, 1560 920" stroke="var(--eau)" stroke-width="22" fill="none" stroke-linecap="round"{A(944.0,"draw",2)}/>
<polygon points="1480,960 1800,880 1800,1000 1480,1000" fill="#e6cf8f"{A(948.6,"wipe",1.4)}/>
<text x="480" y="480" text-anchor="middle" class="h3" style="font-family:Bebas;font-size:62px" fill="#ffb08a"{A(941.2,"up")}>1 · ÉROSION</text>
<text x="490" y="530" text-anchor="middle" class="lab-s"{A(942.0,"up")}>eau, vent</text>
<text x="1080" y="720" text-anchor="middle" class="h3" style="font-family:Bebas;font-size:62px" fill="#a8dcff"{A(944.4,"up")}>2 · TRANSPORT</text>
<text x="1080" y="770" text-anchor="middle" class="lab-s"{A(945.6,"up")}>par l’eau, selon la taille et la vitesse</text>
<text x="1640" y="840" text-anchor="middle" class="h3" style="font-family:Bebas;font-size:62px" fill="#ffe08a"{A(948.8,"up")}>3 · DÉPÔT</text>
'''))

# 950.9 – 982 : altération et érosion
scene(950.9, 982, titre(951.0,'a · Altération et érosion','Le climat et le vivant attaquent les roches') + f'''
<div class="carte" style="left:150px;top:330px;width:780px;height:330px"{A(958.2,"left")}><div class="h3" style="color:#a8dcff">Désagrégation mécanique</div>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px"><div class="pastille b"{A(958.4,"pop")}>gel</div><div class="pastille b"{A(959.2,"pop")}>glace</div><div class="pastille o"{A(959.8,"pop")}>variations de température</div><div class="pastille v"{A(961.2,"pop")}>végétaux</div></div></div>
<div class="carte" style="left:990px;top:330px;width:780px;height:330px"{A(964.8,"right")}><div class="h3" style="color:var(--eau)">Altération chimique : l’eau</div>
<div class="pm" style="margin-top:20px">feldspaths, micas… subissent une <b style="color:#fff">hydrolyse</b> : ils incorporent de l’eau et forment de nouveaux minéraux, <span class="mark b"{A(979.0,"hl",.6)}>les argiles</span></div></div>
<div class="carte" style="left:150px;top:720px;width:1620px;text-align:center"{A(974.0,"up")}><span class="p" style="color:#fff">minéral d’origine + eau ⇄ minéral nouveau (argiles) + solution de lessivage</span></div>''')

# 982 – 1032.9 : la solubilité des ions (document 9, diagramme de Goldschmidt)
gx, gy, gw, gh = 300, 300, 900, 680
ZX = lambda z: gx + z/6*gw
RY = lambda r: gy + gh - r/.17*gh
ions = [('K',1,.133,'s'),('Na',1,.098,'s'),('Ca',2,.100,'s'),('Mg',2,.072,'s'),('Fe²⁺',2,.078,'s'),('Fe³⁺',3,.064,'p'),('Al',3,.050,'p'),('Ti',4,.068,'p'),('Mn',4,.060,'p'),
        ('Si',4,.040,'p'),('B',3,.023,'o'),('C',4,.016,'o'),('P',5,.035,'o'),('N',5,.015,'o'),('S',6,.030,'o')]
tz = {'s':990.0,'p':1000.0,'o':1018.0}; cz = {'s':'#a8dcff','p':'#ffb08a','o':'#ffe08a'}
pts_ions = ''.join(f'<g{A(tz[c],"pop",.5)}><circle cx="{ZX(z):.0f}" cy="{RY(r):.0f}" r="9" fill="{cz[c]}"/><text x="{ZX(z)+14:.0f}" y="{RY(r)+8:.0f}" class="lab-s" fill="{cz[c]}">{n}</text></g>' for n,z,r,c in ions)
scene(982, 1032.9, titre(982.2,'Document 9 · diagramme de Goldschmidt','Tous les ions ne se dissolvent pas') + svg(f'''
<g{A(983.0,"fade")}><rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" fill="#1c1c20" stroke="#8d8a86" stroke-width="2"/>
{''.join(f'<text x="{ZX(z):.0f}" y="{gy+gh+36}" text-anchor="middle" class="lab-s">{z}</text>' for z in range(7))}
<text x="{gx+gw}" y="{gy+gh+74}" text-anchor="end" class="lab-s">charge Z</text><text x="{gx}" y="{gy-16}" class="lab-s">rayon ionique R</text></g>
<polygon points="{ZX(0)},{RY(0)} {ZX(0)},{RY(.17)} {ZX(5.1)},{RY(.17)}" fill="#a8dcff" fill-opacity=".12"{A(989.8,"fade")}/>
<polygon points="{ZX(0)},{RY(0)} {ZX(5.1)},{RY(.17)} {ZX(6)},{RY(.17)} {ZX(6)},{RY(.06)}" fill="#ffb08a" fill-opacity=".12"{A(999.9,"fade")}/>
<polygon points="{ZX(0)},{RY(0)} {ZX(6)},{RY(.06)} {ZX(6)},{RY(0)}" fill="#ffe08a" fill-opacity=".14"{A(1017.4,"fade")}/>
<path d="M{ZX(0)} {RY(0)} L {ZX(5.1)} {RY(.17)}" stroke="var(--rouge)" stroke-width="4"{A(999.9,"draw",.8)}/>
<text x="{ZX(3.6)}" y="{RY(.13)}" class="lab-s" fill="#ff8a8a"{A(1000.4,"fade")}>Z/R = 3</text>
<path d="M{ZX(0)} {RY(0)} L {ZX(6)} {RY(.06)}" stroke="var(--soleil)" stroke-width="4"{A(1017.4,"draw",.8)}/>
<text x="{ZX(5.0)}" y="{RY(.058)}" class="lab-s" fill="var(--soleil)"{A(1017.8,"fade")}>Z/R = 10</text>
{pts_ions}
''') + f'''<div class="abs" style="left:1280px;top:300px;width:520px">
<div class="carte" style="position:relative;padding:20px 26px"{A(989.8,"left")}><div class="h3" style="color:#a8dcff;font-size:44px">Cations solubles</div><div class="lab-s" style="font-size:22px">charge faible, attirés par l’eau → évacués vers l’océan → <b>calcaires</b></div></div>
<div class="carte" style="position:relative;margin-top:16px;padding:20px 26px"{A(999.9,"left")}><div class="h3" style="color:#ffb08a;font-size:44px">Cations précipitants</div><div class="lab-s" style="font-size:22px">insolubles → hydroxydes → <b>gisements</b> (bauxite)</div></div>
<div class="carte" style="position:relative;margin-top:16px;padding:20px 26px"{A(1017.4,"left")}><div class="h3" style="color:#ffe08a;font-size:44px">Oxyanions solubles</div><div class="lab-s" style="font-size:22px">petits, très chargés → océan : <b>carbonates, sulfates, phosphates</b></div></div></div>''')

# 1032.9 – 1047.2 : b · transport (diagramme de Hjulström)
scene(1032.9, 1047.2, titre(1033.0,'b · Transport et dépôt','L’eau, principal agent de transport') + svg(hjulstrom(380, 320, 1160, 600, 1038.6, (1041.9, 1045.9, 1044.0))))

# 1047.2 – 1074 : bassin, roches sédimentaires, flux
scene(1047.2, 1074, titre(1047.4,'Dans un bassin continental ou océanique','Les sédiments deviennent des roches') + svg(f'''
<rect x="150" y="380" width="1620" height="520" rx="20" fill="#183049"{A(1047.6,"fade")}/>
<g{A(1052.6,"wipedown",1.2)}><rect x="150" y="760" width="1620" height="140" fill="#e6cf8f"/>
{''.join(f'<circle cx="{180+i*53}" cy="{790+(i*37)%90}" r="{6+(i*7)%10}" fill="#b89a5a"/>' for i in range(30))}</g>
''') + f'''<div class="abs" style="left:200px;top:420px;display:flex;gap:30px">
<div class="carte" style="position:relative;width:760px"{A(1054.4,"up")}><div class="h3" style="color:#e6cf8f">Débris solides</div><div class="pm">→ roches sédimentaires <b style="color:#fff">détritiques</b></div></div>
<div class="carte" style="position:relative;width:760px"{A(1058.4,"up")}><div class="h3" style="color:#fff">Ions dissous</div><div class="pm">→ roches sédimentaires de type <b style="color:#fff">calcaire</b></div></div></div>
<div class="abs c" style="left:0;right:0;top:960px"><span class="pm"{A(1061.1,"up")}>flux sédimentaires des grands fleuves ⇒ une estimation du <b style="color:#fff">volume de roches enlevé chaque année aux continents</b></span></div>''')

# 1074 – 1097 : c · la remontée isostatique
scene(1074, 1097, titre(1074.2,'c · Des phénomènes tectoniques','L’érosion allège, la croûte remonte') + svg(f'''
{chaine_vieillit(1083.6, 1095.0, x=260, y=660, w=1400)}
<path d="M1300 330 L 1150 420" stroke="#ffb08a" stroke-width="10" marker-end="url(#flo)"{A(1083.8,"draw",.8)}/>
<text x="1320" y="330" class="lab" fill="#ffb08a"{A(1084.0,"up")}>érosion</text>
<path d="M960 1060 L 960 920" stroke="var(--eau)" stroke-width="10" marker-end="url(#flb)"{A(1088.6,"draw",.8)}/>
<text x="150" y="420" class="lab" fill="#a8dcff"{A(1088.8,"up")}>réajustement isostatique :</text><text x="150" y="458" class="lab" fill="#a8dcff"{A(1089.0,"up")}>la croûte profonde remonte</text>
<text x="150" y="500" class="lab-s"{A(1093.4,"up")}>la baisse d’altitude est en grande partie compensée</text>
'''))

# 1097 – 1125 : effondrement et pénéplanation
scene(1097, 1125, titre(1097.2,'En fin de convergence','La chaîne s’effondre en son centre') + svg(f'''
<rect x="260" y="760" width="1400" height="300" fill="{AS}"/>
<g>{chaine(260, 560, 1400, 200, 160)}</g>
{''.join(f'<path d="M{880+i*60} {420+abs(i-1.5)*30:.0f} L {850+i*60} 700" stroke="#2b1d14" stroke-width="6"{A(1104.6+i*.25,"draw",.6)}/>' for i in range(4))}
<text x="960" y="380" text-anchor="middle" class="lab"{A(1104.6,"up")}>des failles normales</text>
{''.join(f'<g{A(1106.4+i*.3,"pop",.4)}><circle cx="{x}" cy="{y}" r="14" fill="var(--rouge)"/></g>' for i,(x,y) in enumerate([(900,520),(1010,600),(950,640),(1060,500)]))}
<text x="1280" y="560" class="lab-s" fill="#ff8a8a"{A(1107.0,"up")}>● séismes : extension</text>
<path d="M880 820 L 640 820" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(1110.6,"draw",.7)}/>
<path d="M1040 820 L 1280 820" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(1110.6,"draw",.7)}/>
<g{A(1110.8,"pop")}><rect x="900" y="790" width="120" height="60" rx="30" fill="#2a2a2f" stroke="var(--soleil)" stroke-width="2"/><text x="960" y="830" text-anchor="middle" class="lab">GPS</text></g>
<text x="960" y="900" text-anchor="middle" class="lab-s"{A(1116.3,"up")}>des sens de déplacement différents</text>
<text x="960" y="1010" text-anchor="middle" style="font-family:Bebas;font-size:100px" fill="var(--soleil)"{A(1122.2,"zoom",.6)}>PÉNÉPLANATION</text>
'''))

# 1125 – 1147.5 : document 13, quantités recyclées
scene(1125, 1147.5, titre(1125.2,'3 · Document 13 · quantités recyclées','Ce que le manteau avale') + f'''
<div class="carte" style="left:150px;top:330px;width:780px;text-align:center"{A(1128.0,"left")}><div class="h3" style="color:#d9b48a">Lithosphère continentale</div>
<div class="k" style="font-size:200px;color:#d9b48a">≈ <span{A(1131.9,"count",1)} data-to="10">0</span> %</div><div class="pm">disparaît dans le manteau</div></div>
<div class="carte" style="left:990px;top:330px;width:780px;text-align:center"{A(1134.0,"right")}><div class="h3" style="color:#8fb3ff">Lithosphère océanique</div>
<div class="k" style="font-size:200px;color:#8fb3ff">≈ 100 %</div><div class="pm">quasi-totalité recyclée</div></div>
<div class="abs c" style="left:0;right:0;top:820px"><div class="pm"{A(1139.4,"up")}>⇒ seuls les continents gardent les plus vieilles roches, comme le</div>
<div class="k" style="font-size:90px;margin-top:10px"{A(1143.2,"up")}>gneiss d’Acasta · <span style="color:var(--soleil)">3,8 Ga</span></div></div>''')

# 1147.5 – 1163.5 : une nouvelle question
scene(1147.5, 1163.5, f'''
<div class="abs" style="left:150px;top:260px;width:1620px">
  <div class="pm"{A(1148.0,"up")}>Une chaîne = fermeture d’un océan par subduction, puis collision de deux continents.</div>
  <div class="pastille" style="margin-top:50px"{A(1156.8,"pop")}>Mais alors…</div>
  <div class="k" style="font-size:120px;margin-top:30px;line-height:1"{A(1157.4,"type",3.6)}>Pourquoi est-ce la lithosphère océanique qui plonge, et pas la continentale ?</div>
</div>''')

# 1163.5 – 1191.5 : 4 · le moteur de la subduction, une affaire de densité
dY = lambda d: 940 - (d-2.6)/0.9*560        # échelle des densités 2,6 → 3,5
barres = [(1169.0,'croûte océanique',2.9,CO,330),(1175.3,'manteau lithosphérique',3.3,ML,630)]
bars = ''.join(f'<rect x="{x}" y="{dY(d):.0f}" width="200" height="{940-dY(d):.0f}" fill="{c}"{A(t,"grow",.8)}/><text x="{x+100}" y="{dY(d)-16:.0f}" text-anchor="middle" style="font-family:Bebas;font-size:54px" fill="#fff"{A(t+.4,"fade")}>{str(d).replace(".",",")}</text><text x="{x+100}" y="990" text-anchor="middle" class="lab-s"{A(t,"fade")}>{n}</text>' for t,n,d,c,x in barres)
scene(1163.5, 1191.5, titre(1163.7,'4 · Le moteur de la subduction','Une lithosphère de plus en plus dense') + svg(f'''
<line x1="280" x2="1700" y1="{dY(3.25):.0f}" y2="{dY(3.25):.0f}" stroke="{AS}" stroke-width="6" stroke-dasharray="16 10"{A(1166.0,"fade")}/>
<text x="1700" y="{dY(3.25)-16:.0f}" text-anchor="end" class="lab" fill="#e8955a"{A(1166.0,"fade")}>asthénosphère · 3,25</text>
{bars}
<rect x="1000" y="{dY(3.18):.0f}" width="260" height="{940-dY(3.18):.0f}" fill="#8a7a6a"{A(1181.4,"grow",.8,o=1185.2)}/>
<rect x="1000" y="{dY(3.29):.0f}" width="260" height="{940-dY(3.29):.0f}" fill="var(--rouge)"{A(1183.4,"grow",2.2)}/>
<text x="1130" y="990" text-anchor="middle" class="lab-s"{A(1181.4,"fade")}>lithosphère (moyenne)</text>
<text x="1130" y="{dY(3.4):.0f}" text-anchor="middle" class="lab" fill="#ff8a8a"{A(1185.6,"up")}>dépasse 3,25 : l’équilibre est rompu</text>
'''))

# 1191.5 – 1220.2 : le métamorphisme alourdit la plaque
etapes_m = [(1196.2,'basalte, gabbro','faciès schiste vert','#4e9a5a','2,9'),(1198.6,'métagabbro','schiste bleu (glaucophane)','#3f6fb0','≈ 3,1'),(1200.2,'éclogite','grenat','#a8453c','3,4')]
scene(1191.5, 1220.2, titre(1191.6,'Pourquoi plonge-t-elle ?','En s’enfonçant, elle s’alourdit') + svg(f'''
<path d="M260 380 C 700 380, 1100 420, 1640 960" stroke="{CO}" stroke-width="70" fill="none" stroke-linecap="round"{A(1193.8,"draw",2.5)}/>
''' + ''.join(f'<g{A(t,"pop")}><circle cx="{x}" cy="{y}" r="22" fill="{c}"/></g><text x="{x-40}" y="{y+70}" text-anchor="end" class="lab" fill="{c}"{A(t,"up")}>{n} · d = {d}</text><text x="{x-40}" y="{y+108}" text-anchor="end" class="lab-s"{A(t+.2,"up")}>{f}</text>'
  for (t,n,f,c,d),(x,y) in zip(etapes_m,[(700,390),(1160,520),(1500,800)])) + f'''
<path d="M1580 930 L 1660 1040" stroke="var(--rouge)" stroke-width="12" marker-end="url(#flr)"{A(1209.4,"draw",.8)}/>
<text x="1520" y="1060" text-anchor="end" class="lab" fill="#ff8a8a"{A(1209.4,"up")}>plus dense que le manteau : la plaque est tractée</text>
''') + f'''<div class="carte" style="left:150px;top:640px;width:760px"{A(1214.3,"up")}><div class="h3" style="color:#fff">La subduction est le moteur de la tectonique des plaques</div><div class="pm"{A(1217.6,"fade")}>… et non les dorsales</div></div>''')

# 1220.2 – 1250.4 : bilan, deux lithosphères
lg = [(1229.3,'Épaisseur de la croûte','faible','importante'),(1231.5,'Âge','jeune (≤ 200 Ma)','jusqu’à 4 Ga'),(1233.5,'Roches','basaltes, gabbros','proches du granite'),(1236.9,'Densité','2,9 (plus dense)','2,7')]
tb = ''.join(f'''<div style="display:grid;grid-template-columns:460px 560px 560px;border-top:1px solid rgba(255,255,255,.12)"{A(t,"up")}><div class="pm" style="padding:20px 10px;color:#aaa">{a}</div><div class="pm" style="padding:20px 10px;color:#fff">{b}</div><div class="pm" style="padding:20px 10px;color:#fff">{c}</div></div>''' for t,a,b,c in lg)
scene(1220.2, 1250.4, titre(1220.4,'Pour résumer','Deux lithosphères, deux croûtes') + f'''
<div class="abs" style="left:150px;top:330px">
<div style="display:grid;grid-template-columns:460px 560px 560px"{A(1222.0,"fade")}><div class="pm" style="padding:10px;color:#aaa">croûte + manteau lithosphérique</div><div class="h3" style="color:#8fb3ff;padding:10px">Océanique</div><div class="h3" style="color:#d9b48a;padding:10px">Continentale</div></div>
{tb}</div>
<div class="abs c" style="left:0;right:0;top:900px"><span class="p"{A(1241.9,"up")}>⇒ la différence d’altitude entre océans et continents · <span class="mark"{A(1248.6,"hl",.6)}>formation et recyclage différents</span></span></div>''')

# 1250.4 – 1265 : ouverture, l'Archéen
scene(1250.4, 1265, titre(1250.6,'Document 14 · et autrefois ?','À l’Archéen, une autre tectonique') + svg(f'''
<path d="M300 380 C 700 380, 1000 520, 1300 960" stroke="{CO}" stroke-width="60" fill="none" stroke-linecap="round"{A(1252.0,"draw",2)}/>
{''.join(f'<g{A(1255.8+i*.3,"pop",.5)}><path d="M{1000+i*60} {640+i*40} q 20 -60 0 -120 q -20 -60 0 -120" stroke="var(--rouge)" stroke-width="10" fill="none"/></g>' for i in range(3))}
<text x="1240" y="420" class="lab" fill="#ff8a8a"{A(1256.0,"up")}>fusion partielle de la croûte océanique subduite</text>
<text x="1240" y="580" style="font-family:Bebas;font-size:90px" fill="#fff"{A(1260.8,"zoom",.6)}>→ LES TTG</text>
<text x="1240" y="630" class="lab-s"{A(1261.0,"up")}>(tonalites…)</text>
'''))

# 1265 – 1272 : pour le Grand Oral
scene(1265, 1272.4, f'''<div class="abs c" style="left:0;right:0;top:330px">
<div class="sur"{A(1265.0,"fade")}>Comment expliquer ces différences ?</div>
<div class="k" style="font-size:150px;margin-top:20px"{A(1265.8,"up")}>À vous de chercher</div>
<div class="k" style="font-size:110px;color:var(--soleil)"{A(1267.2,"up")}>pour votre Grand Oral</div></div>''')

# 1272.4 – 1292 : générique de fin
qs = ['Citez les roches caractéristiques d’une ophiolite.','Expliquez les deux scénarios de mise en place des ophiolites.','Comment expliquer la présence de plusieurs blocs crustaux au cœur des continents ?',
      'Quels domaines métamorphiques un gabbro traverse-t-il jusqu’à la subduction ?','Définissez une serpentine : qu’indique-t-elle ?','Citez les étapes de formation d’une chaîne de montagnes.',
      'Expliquez les étapes de la fracturation continentale.','Schématisez les étapes du cycle de Wilson.','Listez les indices de terrain qui racontent une chaîne.','Où se fait préférentiellement la fracturation continentale ?']
voc = 'métamorphisme · plis · failles inverses · nappe de charriage · migmatites · anatexie · collision · ophiolite · serpentinite · marge passive · érosion · altération · transport · sédimentation · extension · réajustement isostatique · pénéplanation · roche détritique · calcaire · chaînes jeunes / âgées · cycle de Wilson · paléogéographie · obduction · accrétion océanique · bloc basculé · rift continental · orogène · orogenèse'
scene(1272.4, 1292, f'''
<div class="abs" style="left:150px;top:150px;width:960px">
 <div class="sur"{A(1272.6,"fade")}>Fin de l’épisode 2</div>
 <div class="k" style="font-size:84px;margin-top:16px"{A(1273.0,"up")}>Je retiens en me posant des questions</div>
 {''.join(f'<div class="lab-s" style="margin-top:12px;font-size:23px"{A(1274.0+i*.35,"up")}>{i+1}. {q}</div>' for i,q in enumerate(qs))}
</div>
<div class="carte" style="left:1180px;top:170px;width:620px"{A(1277.6,"right")}>
 <div class="pastille">Vocabulaire</div><div class="lab-s" style="margin-top:20px;font-size:23px;line-height:1.6">{voc}</div></div>
<div class="abs" style="left:1180px;top:930px;display:flex;align-items:center;gap:22px"{A(1281.0,"up")}>
 <div class="k" style="font-size:64px;color:var(--rouge)">À suivre</div><div class="pm">Épisode 3</div></div>''')

CHAPITRES = []
