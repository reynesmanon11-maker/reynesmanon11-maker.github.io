# Épisode 2 — L'histoire géologique de la France (bilan du chapitre 4, activité 2).
# Les temps sont ceux de la voix (secondes dans l'audio).
from commun import *
from geo import *
def bandeau(items, y=905):
    "légendes successives sous un document : [(t, texte, fin)]"
    return ''.join(f'<div class="abs c" style="left:120px;right:120px;top:{y}px"><span class="p" style="background:rgba(10,10,12,.75);padding:10px 22px;border-radius:12px;color:#fff"{A(t,"up",o=o)}>{txt}</span></div>' for t,txt,o in items)
from docs import Docs
import pathlib
DOC = Docs(pathlib.Path(__file__).parent)
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

# 0.6 – 13.7 : des âges très différents, sur la carte du document 1
scene(0.6, 13.7, titre(0.8,'Document 1 · l’âge des roches des continents','Océans jeunes, continents très vieux') + DOC('d1_carte', 1.0,
  box=(120,250,1680,640), kb=[(1.0,58.5,84,1),(6.6,58.5,84,1),(8.0,37,87.5,1.9),(12.5,37,87.5,1.9)],
  hl=[(8.6,31.8,81.8,42,83.3,'j'),(10.4,31.8,91.6,42,93.2)], legende='Document 1 — Âge des roches (Ma)') +
  bandeau([(3.0,'lithosphère océanique : jamais plus de <b>200 Ma</b>',7.2),(7.4,'roches des continents : jusqu’à plus de <b>4 milliards d’années</b>',None)]))

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

# 102.6 – 124 : la ceinture alpine, sur la carte du document 1
def lonlat(lon, lat): return (61 + .181*lon, 83.5 - .124*lat)
AT, AL, BA, CA, HI = lonlat(-5, 33), lonlat(9, 47), lonlat(22, 43), lonlat(44, 43), lonlat(84, 33)
scene(102.6, 124, titre(102.8,'Document 1 · une même orogenèse, un alignement','La ceinture alpine') + DOC('d1_carte', 102.9,
  kb=[(102.9, 58.5, 84, 1), (106.0, 58.5, 84, 1), (109.0, 66, 79, 2.4), (117.0, 66, 79, 2.4), (121, 66, 80, 2.0)],
  notes=[(111.3, *AL, 'Alpes', '', -40, -74), (112.3, *AT, 'Atlas', '', -110, 20), (112.8, *BA, 'Balkans', '', -40, -74), (113.4, *CA, 'Caucase', '', 10, 18), (114.2, *HI, 'Himalaya', '', -60, -74)],
  chemins=[(115.0, [AT, AL, BA, CA, HI], '#1a1a1a', 2.0)], legende='Document 1 — Âge des roches') +
  f'''<div class="carte" style="left:150px;top:820px;width:560px;background:#f6efe2;color:#1a1208;border:2px solid #b15f2c"{A(117.0,"up")}>
<div class="h3" style="color:#1a1208;font-size:52px">Ceinture alpine</div><div class="pm" style="color:#333">ère tertiaire (depuis –65 Ma)</div>
<div class="pm" style="color:#b15f2c;font-weight:700"{A(120.6,"fade")}>fermeture de la Téthys</div></div>''')

# 124 – 153.4 : retrouver les ceintures anciennes (document 11)
indices = [(138.0,'roches métamorphiques','issues de déformations en compression'),(143.0,'roches magmatiques','mises en place en profondeur, exhumées par l’érosion'),(150.6,'failles inverses','et chevauchements')]
scene(124, 153.4, titre(124.2,'Ceintures récentes, ceintures anciennes','Lire une montagne disparue') +
  DOC('d11_jeune', 124.6, box=(100,250,1000,390), o=131.6, legende='récente : relief très marqué',
      hl=[(150.6,53,57.2,64,59.8)]) +
  DOC('d11_agee', 132.0, box=(100,250,1000,390), legende='ancienne : relief érodé…',
      hl=[(143.0,45,71.8,61.2,74.4),(143.4,39.5,79.3,48.5,82,'j')], o=150.4) +
  DOC('d11_jeune', 150.4, box=(100,250,1000,390), legende='failles inverses, chevauchements',
      kb=[(150.4,52,58,1),(151,56,58,1.6)], hl=[(150.8,53,57.2,64,59.8)]) +
  ''.join(f'''<div class="carte" style="left:1150px;top:{330+i*190}px;width:660px;padding:24px 32px"{A(t,"left")}><div class="h3" style="color:var(--soleil)">{n}</div><div class="pm">{d}</div></div>''' for i,(t,n,d) in enumerate(indices)) +
  f'<div class="abs pm" style="left:1150px;top:270px"{A(135.0,"fade")}>… mais il reste des <b style="color:#fff">indices</b> :</div>')

# 153.4 – 171 : cycles orogéniques (document 1)
scene(153.4, 171, titre(153.6,'Document 1 · à l’échelle du globe','Une chronologie des cycles orogéniques') + DOC('d1_carte', 153.8,
  box=(120,250,1680,620), kb=[(153.8,58.5,84,1),(157,58.5,84,1),(158.5,37,87.5,1.9),(171,37,87.5,1.9)],
  hl=[(158.4,31.8,81.8,42,93.2,'j')], legende='Document 1 — chaque couleur, un âge') +
  bandeau([(164.2,'cycle orogénique = formation <b>puis disparition</b> (érosion) d’une chaîne de montagnes',None)], y=900))

# 171 – 189.9 : en France
coul = {'armoricain':'#7d9cc4','central':'#7d9cc4','vosges':'#7d9cc4','alpes':'#e88a5a','pyrenees':'#e88a5a'}
scene(171, 189.9, titre(171.2,'Sur la carte géologique de la France','Deux grandes orogenèses') + svg(
  carte_france(700, 610, 72, 171.4, {'alpes':176.4,'pyrenees':176.9,'central':181.7,'armoricain':182.7,'vosges':183.8}, coul)) + f'''
<div class="carte" style="left:1150px;top:330px;width:640px"{A(173.4,"left")}><div class="h3" style="color:#e88a5a">Alpine</div><div class="pm">ère tertiaire · Alpes, Pyrénées</div></div>
<div class="carte" style="left:1150px;top:560px;width:640px"{A(178.1,"left")}><div class="h3" style="color:#7d9cc4">Hercynienne</div><div class="pm">fin de l’ère primaire · Massif central, Massif armoricain, Vosges</div></div>
<div class="abs pm" style="left:1150px;top:830px;width:640px"{A(186.0,"up")}>+ des traces d’orogenèses encore plus anciennes dans les massifs anciens</div>''')

# 189.9 – 208.9 : le modèle, sur le document 5
scene(189.9, 208.9, titre(190.0,'Le modèle · document 5','Ouverture, fermeture, collision') +
  DOC('d5_150', 192.0, box=(120,360,1680,520), o=195.0, legende='150 Ma — un océan') +
  DOC('d5_70', 195.0, box=(120,360,1680,520), o=197.0, legende='70-60 Ma — subduction') +
  DOC('d5_4', 197.0, box=(120,360,1680,520), legende='4 Ma — collision') +
  f'''<div class="abs" style="left:150px;top:280px;display:flex;gap:16px"><div class="pastille b"{A(192.0,"pop")}>1 · ouverture</div><div class="pastille" style="background:#5a4a8a"{A(195.0,"pop")}>2 · fermeture par subduction</div><div class="pastille o"{A(197.0,"pop")}>3 · collision</div></div>''' +
  bandeau([(198.4,'→ des indices à retrouver sur le terrain, et à dater',None)], y=930))

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
scene(316, 354, titre(316.2,'Document 2 · vue par sismique-réflexion','Anatomie d’une marge passive') + DOC('d2_marge', 316.4,
  box=(120,250,1680,620), kb=[(316.4,33,65,1),(318.6,33,65,1),(320,30,67,1.2),(326,30,67,1.2),(327.6,23,63,1.3),(335,23,63,1.3),(336,38,63,1.3),(347,38,63,1.3),(349,15,63,1.2),(354,15,63,1.2)],
  hl=[(318.6,12,64.5,45,70.5,'',327.4),(327.6,19.3,57.5,26.3,60.3,'j',335.8),(336.0,29.8,57.5,47,60.3,'',348.8),(349.0,9.8,57.5,17,60.3,'v')],
  legende='Document 2 — Marge continentale passive') +
  bandeau([(318.8,'des <b>blocs basculés</b> le long de failles normales courbes',327.4),(327.8,'sédiments <b>anté-rift</b> : recoupés par les failles, déposés <b>avant</b> le rift',335.8),
           (336.2,'sédiments <b>syn-rift</b> (évaporites) en éventail : déposés <b>pendant</b> le basculement',348.8),(349.2,'sédiments <b>post-rift</b> (argilites), discordants : déposés <b>après</b>',None)], y=900))

# 354 – 383.9 : les ophiolites (schéma bilan)
scene(354, 383.9, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(354.2,"left")}>3 · Les traces d’un ancien domaine océanique</div>'
      f'<div class="h2" style="margin-top:14px"{A(361.0,"up")}>Les ophiolites</div>'
      f'<div class="pm" style="margin-top:14px;width:700px"{A(362.0,"up")}>des lambeaux de lithosphère océanique, au cœur des chaînes : <b style="color:#fff">les vestiges d’un océan disparu</b></div>'
      f'<div class="pm" style="margin-top:40px;width:700px"{A(381.6,"up")}>+ au-dessus : des sédiments d’océan profond, les <b style="color:#ff8a8a">radiolarites</b></div></div>' +
  DOC('bilan_ophiolite', 363.0, box=(950,250,850,790), legende='Schéma bilan — ophiolites',
      hl=[(370.3,67,88.3,74,91),(374.2,74,88.3,79.5,91,'b'),(376.3,80.5,87.5,88,90.5,'j')]))

# 383.9 – 418.4 : métamorphisme hydrothermal, puis suture
scene(383.9, 418.4, titre(384.0,'Un métamorphisme lié à l’hydrothermalisme','Des roches transformées par l’eau') + f'''
<div class="carte" style="left:150px;top:330px;width:520px"{A(388.6,"up")}><div class="h3" style="color:#7fb08a">Péridotites</div><div class="pm">→ serpentinisées</div></div>
<div class="carte" style="left:700px;top:330px;width:520px"{A(392.6,"up")}><div class="h3" style="color:#c9a36a">Gabbros</div><div class="pm">faciès amphibolite<br><span class="lab-s">(hornblende)</span></div></div>
<div class="carte" style="left:1250px;top:330px;width:520px"{A(397.4,"up")}><div class="h3" style="color:#62c98d">… ou schiste vert</div><div class="pm">chlorite, actinote</div></div>''' +
  DOC('bilan_suture', 401.4, box=(150,560,900,480), legende='Schéma bilan — collision', hl=[(411.4,39.5,78,58,81.2)]) + f'''
<div class="abs" style="left:1120px;top:640px;width:680px"><div class="pm" style="color:#5fd0c3"{A(404.0,"up")}>fragments d’un océan refermé, coincés entre deux continents</div>
<div class="k" style="font-size:80px;color:var(--rouge);margin-top:20px"{A(411.4,"pop")}>ZONE DE SUTURE</div></div>''')

# 418.4 – 454.2 : les traces d'une subduction (document 3)
bande = ''.join(f'<rect x="{1340+i*150}" y="560" width="150" height="80" fill="{c}"{A(444.4+i*1.2,"growx",.6)}/><text x="{1415+i*150}" y="680" text-anchor="middle" class="lab-s"{A(444.6+i*1.2,"fade")}>{n}</text>' for i,(c,n) in enumerate([('#4e9a5a','sch. verts'),('#3f6fb0','sch. bleus'),('#a8453c','éclogites')]))
scene(418.4, 454.2, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(418.6,"left")}>4 · Les traces d’une subduction</div><div class="h2" style="margin-top:14px"{A(419.2,"up")}>Document 3 · le chemin d’un gabbro</div></div>' +
  DOC('d3_pt', 420.0, box=(100,270,1140,770), kb=[(420,33,29,1),(428.5,33,29,1),(430,16,27,1.35),(435,16,27,1.35),(436.5,33,29,1)],
      hl=[(429.0,13.4,21.7,15.9,23.7,'v'),(429.8,11.5,25.7,13.7,27.7,'b'),(430.8,19.7,30.7,22.4,32.6)],
      chemins=[(436.0,[(29.6,19.9),(9.8,21.3),(9.4,22.5),(12,26.5),(15,30.5),(18,34.8)],'#d40000',4)], legende='Document 3 — Chemin P-T d’un gabbro') + svg(f'''
<g{A(431.8,"pop")}><rect x="1300" y="320" width="500" height="80" rx="40" fill="var(--rouge)"/><text x="1550" y="372" text-anchor="middle" class="lab">haute pression · basse température</text></g>
<text x="1550" y="450" text-anchor="middle" class="lab"{A(435.4,"up")}>⇒ une subduction de croûte océanique</text>
{bande}
<text x="1340" y="540" class="lab-s"{A(444.0,"fade")}>Ouest</text><text x="1790" y="540" text-anchor="end" class="lab-s"{A(444.0,"fade")}>Est</text>
<path d="M1360 730 L 1780 730" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(450.4,"draw",.8)}/>
<text x="1570" y="790" text-anchor="middle" class="lab" fill="var(--soleil)"{A(450.8,"up")}>subduction vers l’Est</text>'''))

# 454.2 – 470.9 : l'obduction (schéma bilan)
scene(454.2, 470.9, titre(454.4,'Remarque','Parfois, pas de subduction : l’obduction') +
  DOC('bilan_obduction', 455.0, box=(120,250,1680,620), kb=[(455,78,68,1),(461.8,78,68,1),(463,76,69,1.5),(470.9,76,69,1.5)],
      hl=[(461.8,73,68.5,86,72)], legende='Schéma bilan — subduction avec obduction') +
  bandeau([(458.9,'métamorphisme hydrothermal seulement…',461.6),(461.8,'la lithosphère océanique est <b>charriée sur</b> le continent avant la collision : <b>obduction</b>',None)], y=900))

# 470.9 – 510.7 : les traces d'une collision
scene(470.9, 510.7, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(471.0,"left")}>5 · Les traces d’une collision</div><div class="h2" style="margin-top:14px"{A(471.6,"up")}>Une croûte continentale enfouie</div></div>' + f'''
<div class="carte" style="left:150px;top:330px;width:560px"{A(475.4,"up")}><div class="h3" style="color:#d9b48a">Gneiss</div><div class="pm">un granite soumis à haute pression, basse température</div></div>
<div class="carte" style="left:150px;top:560px;width:560px"{A(480.0,"up")}><div class="h3" style="color:#ff9a7a">Migmatites</div><div class="pm">début de fusion partielle du gneiss : <b style="color:#fff">l’anatexie</b></div></div>
<div class="carte" style="left:150px;top:790px;width:560px"{A(496.6,"up")}><div class="pm">plis, failles inverses, <b style="color:#fff">nappes de charriage</b> : raccourcissement et épaississement de la croûte</div></div>''' +
  DOC('d11_jeune', 473.0, box=(760,330,1060,640), kb=[(473,50,55,1),(477,50,55,1),(479,51,62,1.7),(495,51,62,1.7),(497,50,55,1.05)],
      hl=[(477.6,47,62.2,56.5,64.8),(498.8,53,57.2,64,59.8,'j')], legende='Document 11 — chaîne récente'))

# 510.7 – 548.3 : imagerie sismique : la racine crustale
scene(510.7, 548.3, titre(510.9,'Sous les chaînes · profil ECORS, tomographie','Une racine sous la chaîne') +
  DOC('d11_jeune', 511.0, box=(120,250,1680,620), kb=[(511,50,55,1),(524,50,55,1),(527,42,61,1.6),(540,42,61,1.6),(546,50,55,1)],
      notes=[(527.6,44,65.3,'racine crustale : plus de 40 km sous les Alpes','r',30,20)], legende='Document 11 — chaîne récente') +
  bandeau([(516.7,'le profil sismique suit les grandes failles et le <b>Moho</b> en profondeur',527.4),(534.8,'tomographie : des roches « froides » épaissies sous la chaîne',None)], y=900))

# 548.3 – 579.7 : la coésite, croûte continentale subduite
scene(548.3, 579.7, titre(548.5,'Document 4 · le domaine de stabilité du quartz','La coésite, une preuve de pression') +
  DOC('d4_quartz', 549.0, box=(100,250,1000,790), kb=[(549,77,82,1),(566,77,82,1),(568,80,82,1.4),(579,80,82,1.4)],
      hl=[(553.4,79.5,80.8,85,84.5),(568.9,76,74.5,82,79,'j')], legende='Document 4 — Quartz et coésite') + f'''<div class="abs" style="left:1180px;top:330px;width:600px">
<div class="pm"{A(553.4,"up")}><b style="color:#fff">coésite</b> = forme du quartz qui n’existe qu’à très haute pression</div>
<div class="pm" style="margin-top:26px"{A(561.0,"up")}>le quartz est un minéral du <b style="color:#fff">grès</b> et du <b style="color:#fff">granite</b> : des roches de la croûte continentale</div>
<div class="carte" style="position:relative;margin-top:36px"{A(572.4,"up")}><span class="pm" style="color:#fff">⇒ une partie de la croûte continentale est entrée en <b style="color:var(--soleil)">subduction</b> lors de la collision</span></div></div>''')

# 579.7 – 618.2 : scénario de formation (document 5)
scene(579.7, 618.2, titre(579.9,'6 · Un scénario · document 5','La naissance d’une chaîne de montagnes') +
  DOC('d5_150', 589.2, box=(120,300,1680,560), o=592.4, legende='150 Ma') + DOC('d5_70', 592.4, box=(120,300,1680,560), o=599.4, legende='70-60 Ma') +
  DOC('d5_45a', 599.4, box=(120,300,1680,560), o=604.0, legende='45-40 Ma') + DOC('d5_25', 604.0, box=(120,300,1680,560), o=609.6, legende='25 Ma') +
  DOC('d5_4', 609.6, box=(120,300,1680,560), legende='4 Ma') +
  bandeau([(589.2,'convergence de deux plaques lithosphériques',592.2),(592.4,'1 · subduction océanique → fermeture de l’océan',599.2),
           (599.4,'2 · suture : un peu de croûte continentale subduite, puis collision',609.4),(609.6,'3 · la croûte s’épaissit par empilement de nappes de charriage',None)], y=920))

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

# 681.3 – 717 : le cycle de Wilson (document 6)
scene(681.3, 717, f'<div class="abs" style="left:150px;top:140px"><div class="sur"{A(681.4,"left")}>2 · Des cycles de supercontinents ?</div><div class="h2" style="margin-top:14px"{A(687.0,"up")}>Le cycle de Wilson</div></div>'
  f'<div class="abs pm" style="left:150px;top:300px;width:520px"{A(687.4,"up")}>proposé par le géologue <b style="color:#fff">John Tuzo Wilson</b></div>'
  f'<div class="carte" style="left:150px;top:420px;width:520px"{A(702.6,"up")}><span class="pm">moteur supposé : la <b style="color:#fff">convection du manteau</b></span></div>'
  f'<div class="abs pm" style="left:150px;top:600px;width:520px;font-style:italic"{A(707.8,"up")}>données très partielles : mécanisme et périodicité encore étudiés</div>' +
  DOC('d6_wilson', 682.0, box=(720,250,1100,790), legende='Document 6 — Cycle de Wilson',
      hl=[(693.2,75.5,70.3,95,78.9,'',697.0),(695.6,44.5,78.5,62.5,84.7,'b',699.0),(698.9,9,63,93,91.5,'j')]))

# 717 – 783.5 : les sutures se rouvrent
scene(717, 783.5, titre(717.2,'Document 6 · où le continent se fracture-t-il ?','Là où il s’était soudé') +
  DOC('d6_wilson', 717.4, box=(100,250,1020,620), kb=[(717.4,50,77,1),(730,50,77,1),(732,38,76,1.8),(755,38,76,1.8),(757,82,87,1.8),(770,82,87,1.8),(772,50,77,1)],
      hl=[(733.0,33,74.2,43.6,77.7,'j'),(757.0,76,88.4,87,91.4)], legende='Document 6') + f'''
<div class="carte" style="left:1170px;top:250px;width:650px"{A(724.0,"left")}><span class="pm">✂ « Un peu comme quand vous vous coupez : on se recoupe plus facilement là où on a déjà cicatrisé. »</span></div>
<div class="carte" style="left:1170px;top:450px;width:650px;border-color:rgba(229,51,59,.5)"{A(738.2,"up")}><div class="h3" style="color:#ff8a8a">Suture fragilisée</div>
<div class="pm">manteau <b style="color:#fff">appauvri</b> en minéraux fusibles par le magmatisme de subduction → cassant → <span class="mark"{A(752.0,"hl",.7)}>la suture se rouvre</span></div></div>
<div class="carte" style="left:1170px;top:700px;width:650px"{A(756.8,"up")}><div class="h3" style="color:#a8dcff">Petit océan (Alpes)</div>
<div class="pm">pas de magmatisme : manteau non appauvri → <b style="color:#fff">fracture ailleurs</b></div></div>''' +
  bandeau([(771.8,'⇒ à chaque suture, les continents <b>grandissent</b>',None)], y=930))

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
scene(829, 907, titre(829.2,'1 · Le recyclage de la lithosphère océanique','Document 7 · elle vieillit, s’épaissit… et plonge') +
  DOC('d7_haut', 829.4, box=(120,250,1680,640), kb=[(829.4,50,58,1),(831,50,58,1),(832.5,36,54,1.5),(839,36,54,1.5),(841,50,55,1),(858,50,55,1),(859.4,52,61,1.4),(866,52,62,1.4),(873,65,63,1.4),(882,80,62,1.4),(888,50,58,1)],
      hl=[(832.7,30.5,49.6,36,51.8,'j',840),(840.8,40.5,45.4,66.5,50.6,'b',858),(859.4,47,59.6,56,62.5,'',867),(867.9,47,65.2,59.5,68.8,'',875),(875.6,64,65.2,79.5,69.8,'',884),(883.9,84,59.8,94,64.4)],
      legende='Document 7 — la lithosphère océanique vieillit') +
  bandeau([(832.7,'à la dorsale : mince, chaude, elle « flotte » sur l’asthénosphère',840.6),(840.8,'elle s’éloigne, refroidit : le <b>manteau lithosphérique s’épaissit</b> (d = 3,3 > 2,9)',859.2),
           (859.4,'sa densité dépasse celle de l’asthénosphère (3,25)',867.7),(867.9,'<b>40 Ma</b> : l’équilibre isostatique est rompu',875.4),
           (875.6,'<b>80 Ma</b> : entrée en subduction, avec retard',883.8),(883.9,'… puis tout s’accélère : la plaque est tractée',890.0),(890.2,'⇒ aucun plancher océanique de plus de 200 Ma aujourd’hui',None)], y=920))

# 907 – 925.9 : chaînes jeunes et chaînes âgées (document 8)
scene(907, 925.9, titre(907.2,'2 · Le recyclage de la lithosphère continentale','Document 8 · une chaîne jeune, une chaîne âgée') +
  DOC('d8_tableau', 907.4, box=(120,250,1680,600),
      hl=[(914.6,5,12.5,93,14.6,'j',916),(916.0,5,14.6,93,16.4,'j',918.6),(918.8,5,16.4,93,20,'j',920.4),(920.6,5,20,93,21.9,'j')], legende='Document 8') +
  bandeau([(922.6,'⇒ aplanissement et effondrement : <b>les chaînes disparaissent peu à peu</b>',None)], y=920))

# 925.9 – 950.9 : quatre familles de processus, puis érosion → transport → dépôt
scene(925.9, 950.9, titre(926.0,'Orogenèse après orogenèse','La croûte continentale se transforme') + f'''
<div class="abs pm" style="left:150px;top:270px"{A(926.4,"up",o=937.4)}>recyclée dans les zones de <b style="color:#fff">subduction</b> et de <b style="color:#fff">collision</b>, cycle après cycle…</div>
<div class="abs" style="left:150px;top:270px;display:flex;gap:18px">
<div class="pastille o"{A(937.8,"pop")}>tectoniques</div><div class="pastille" style="background:#a8453c"{A(938.5,"pop")}>magmatiques</div>
<div class="pastille b"{A(939.2,"pop")}>métamorphiques</div><div class="pastille v"{A(939.8,"pop")}>sédimentaires</div></div>''' +
  DOC('d12_bloc', 940.6, box=(120,340,1680,700), hl=[(941.2,10.5,24.5,21,27.2),(944.4,30,30.5,45,34),(948.8,62,39.5,86,43)], legende='Document 12 — érosion, transport, sédimentation'))

# 950.9 – 982 : altération et érosion
scene(950.9, 982, titre(951.0,'a · Altération et érosion','Le climat et le vivant attaquent les roches') + f'''
<div class="carte" style="left:150px;top:330px;width:780px;height:330px"{A(958.2,"left")}><div class="h3" style="color:#a8dcff">Désagrégation mécanique</div>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px"><div class="pastille b"{A(958.4,"pop")}>gel</div><div class="pastille b"{A(959.2,"pop")}>glace</div><div class="pastille o"{A(959.8,"pop")}>variations de température</div><div class="pastille v"{A(961.2,"pop")}>végétaux</div></div></div>
<div class="carte" style="left:990px;top:330px;width:780px;height:330px"{A(964.8,"right")}><div class="h3" style="color:var(--eau)">Altération chimique : l’eau</div>
<div class="pm" style="margin-top:20px">feldspaths, micas… subissent une <b style="color:#fff">hydrolyse</b> : ils incorporent de l’eau et forment de nouveaux minéraux, <span class="mark b"{A(979.0,"hl",.6)}>les argiles</span></div></div>
<div class="carte" style="left:150px;top:720px;width:1620px;text-align:center"{A(974.0,"up")}><span class="p" style="color:#fff">minéral d’origine + eau ⇄ minéral nouveau (argiles) + solution de lessivage</span></div>''')

# 982 – 1032.9 : la solubilité des ions (document 9, diagramme de Goldschmidt)
scene(982, 1032.9, titre(982.2,'Document 9 · diagramme de Goldschmidt','Tous les ions ne se dissolvent pas') +
  DOC('d9_goldschmidt', 982.6, box=(120,250,1680,790), kb=[(982.6,49,72,1),(989,49,72,1),(990,40,62,1.3),(999,40,62,1.3),(1000,60,68,1.3),(1016,60,68,1.3),(1017.4,62,78,1.3),(1031,62,78,1.3)],
      hl=[(989.8,23.5,61.5,37,64.3,'b'),(990.6,48.5,54,93,59.8,'b'),(999.9,48,69.2,62.5,71.6),(1000.6,62,62,93,69.8),(1017.4,58.5,79.4,66.8,82.6,'j'),(1018,66,73.2,93,86.2,'j')],
      legende='Document 9 — la solubilité des ions'))

# 1032.9 – 1047.2 : b · transport (diagramme de Hjulström)
scene(1032.9, 1047.2, titre(1033.0,'b · Transport et dépôt · document 10','L’eau, principal agent de transport') +
  DOC('d10_hjulstrom', 1033.4, box=(120,250,1680,790), hl=[(1041.9,57,12,70,16.5),(1044.0,71,22,85,28.5,'j'),(1045.9,47,19.5,61,23.5,'b')], legende='Document 10'))

# 1047.2 – 1074 : bassin, roches sédimentaires, flux
scene(1047.2, 1074, titre(1047.4,'Dans un bassin continental ou océanique','Les sédiments deviennent des roches') + svg(f'''
<rect x="150" y="380" width="1620" height="520" rx="20" fill="#183049"{A(1047.6,"fade")}/>
<g{A(1052.6,"wipedown",1.2)}><rect x="150" y="760" width="1620" height="140" fill="#e6cf8f"/>
{''.join(f'<circle cx="{180+i*53}" cy="{790+(i*37)%90}" r="{6+(i*7)%10}" fill="#b89a5a"/>' for i in range(30))}</g>
''') + f'''<div class="abs" style="left:200px;top:420px;display:flex;gap:30px">
<div class="carte" style="position:relative;width:760px"{A(1054.4,"up")}><div class="h3" style="color:#e6cf8f">Débris solides</div><div class="pm">→ roches sédimentaires <b style="color:#fff">détritiques</b></div></div>
<div class="carte" style="position:relative;width:760px"{A(1058.4,"up")}><div class="h3" style="color:#fff">Ions dissous</div><div class="pm">→ roches sédimentaires de type <b style="color:#fff">calcaire</b></div></div></div>
<div class="abs c" style="left:0;right:0;top:960px"><span class="pm"{A(1061.1,"up")}>flux sédimentaires des grands fleuves ⇒ une estimation du <b style="color:#fff">volume de roches enlevé chaque année aux continents</b></span></div>''')

# 1074 – 1097 : c · la remontée isostatique (document 12)
scene(1074, 1097, titre(1074.2,'c · Des phénomènes tectoniques · document 12','L’érosion allège, la croûte remonte') +
  DOC('d12_isostasie', 1074.6, box=(100,250,1000,790), kb=[(1074.6,27,79,1),(1079,27,79,1),(1080.5,12,70,1.7),(1086,12,70,1.7),(1087.5,25,80,1.7),(1092,25,80,1.7),(1093.5,37,90,1.7),(1097,37,90,1.7)],
      legende='Document 12 — réajustement isostatique') + f'''<div class="abs" style="left:1160px;top:330px;width:640px">
<div class="h3" style="color:#ffb08a"{A(1083.8,"up")}>L’érosion allège la chaîne…</div>
<div class="h3" style="color:#a8dcff;margin-top:30px"{A(1088.8,"up")}>… la croûte profonde remonte : réajustement isostatique</div>
<div class="pm" style="margin-top:30px"{A(1093.4,"up")}>la baisse d’altitude est en grande partie compensée : des roches formées en profondeur finissent par affleurer</div></div>''')

# 1097 – 1125 : effondrement et pénéplanation
scene(1097, 1125, titre(1097.2,'En fin de convergence','La chaîne s’effondre en son centre') +
  DOC('d12_gps', 1097.6, box=(100,250,1000,790), kb=[(1097.6,75,82,1),(1104,75,82,1),(1106,73,83,1.5),(1118,73,83,1.5),(1120,75,82,1)], legende='Document 12 — failles et GPS') + f'''<div class="abs" style="left:1160px;top:330px;width:640px">
<div class="pm"{A(1104.6,"up")}>le jeu de nombreuses <b style="color:#fff">failles normales</b> au centre de la chaîne</div>
<div class="pm" style="margin-top:24px"{A(1106.4,"up")}>repérées par l’<b style="color:#ff8a8a">activité sismique</b> : extension</div>
<div class="pm" style="margin-top:24px"{A(1110.6,"up")}>et par le <b style="color:var(--soleil)">GPS</b> : des sens de déplacement différents</div>
<div class="k" style="font-size:96px;color:var(--soleil);margin-top:50px"{A(1122.2,"zoom",.6)}>PÉNÉPLANATION</div></div>''')

# 1125 – 1147.5 : document 13, quantités recyclées
scene(1125, 1147.5, titre(1125.2,'3 · Document 13 · quantités recyclées','Ce que le manteau avale') +
  DOC('d13_recyclage', 1125.4, box=(100,250,1060,790), hl=[(1128.0,32,73.5,53,81.5,'j'),(1134.0,69,65.5,91,74),(1139.4,4,66.5,29,74.5,'v')], legende='Document 13') + f'''
<div class="carte" style="left:1200px;top:280px;width:600px;text-align:center"{A(1131.9,"left")}><div class="pm" style="color:#d9b48a">lithosphère continentale</div><div class="k" style="font-size:120px;color:#d9b48a">≈ 10 %</div><div class="lab-s">rendue au manteau</div></div>
<div class="carte" style="left:1200px;top:560px;width:600px;text-align:center"{A(1134.0,"left")}><div class="pm" style="color:#8fb3ff">lithosphère océanique</div><div class="k" style="font-size:120px;color:#8fb3ff">≈ 100 %</div><div class="lab-s">quasi-totalité recyclée</div></div>
<div class="abs" style="left:1200px;top:860px;width:600px"><div class="pm"{A(1139.4,"up")}>⇒ les plus vieilles roches restent sur les continents :</div><div class="h3" style="margin-top:8px"{A(1143.2,"up")}>gneiss d’Acasta · <span style="color:var(--soleil)">3,8 Ga</span></div></div>''')

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

# 1250.4 – 1265 : ouverture, l'Archéen (document 14)
scene(1250.4, 1265, titre(1250.6,'Document 14 · et autrefois ?','À l’Archéen, une autre tectonique') +
  DOC('d14_archeen', 1250.8, box=(120,250,1680,640), kb=[(1250.8,50,65,1),(1255,50,65,1),(1256.5,72,62,1.5),(1265,72,62,1.5)], hl=[(1255.8,65,57,82,66.5)], legende='Document 14') +
  bandeau([(1255.8,'le volcanisme vient de la <b>fusion partielle de la croûte océanique subduite</b> → des roches particulières, les <b>TTG</b>',None)], y=920))

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
