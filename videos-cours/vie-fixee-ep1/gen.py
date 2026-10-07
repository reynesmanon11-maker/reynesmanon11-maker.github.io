# Génère src/scenes.html. Les temps sont ceux de la voix (secondes dans l'audio).
import pathlib, math
OUT = pathlib.Path(__file__).parent/'src'/'scenes.html'
S = []
from docs import Docs
import pathlib
DOC = Docs(pathlib.Path(__file__).parent)
def bandeau(items, y=905):
    return ''.join(f'<div class="abs c" style="left:120px;right:120px;top:{y}px"><span class="p" style="background:rgba(10,10,12,.75);padding:10px 22px;border-radius:12px;color:#fff"{A(t,"up",o=o)}>{txt}</span></div>' for t,txt,o in items)

META = {'serie': 'VIE FIXÉE', 'episode': 'Épisode 1', 'titre': 'La vie fixée · Épisode 1'}

def A(t, fx='up', d=None, o=None):
    s = f' data-t="{t}" data-fx="{fx}"'
    if d is not None: s += f' data-d="{d}"'
    if o is not None: s += f' data-o="{o}"'
    return s

def foc(x, y, k):
    "clé de caméra qui amène le point (x, y) au centre de l'écran, au grossissement k"
    return f'{-(x-960)*k:.0f} {-(y-540)*k:.0f} {k}'

def scene(t0, t1, body, cam=''):
    c = f' data-cam="{cam}"' if cam else ''
    S.append(f'<section class="sc" data-in="{t0}" data-out="{t1}"{c}><div class="cam">\n{body}\n</div></section>')

def svg(body, vb='0 0 1920 1080', style='position:absolute;inset:0'):
    return f'<svg viewBox="{vb}" style="{style}" width="1920" height="1080">{body}</svg>'

def titre(t, sur, h, x=120, y=140, taille='h2', o=None):
    return (f'<div class="abs" style="left:{x}px;top:{y}px"><div class="sur"{A(t,"left",o=o)}>{sur}</div>'
            f'<div class="{taille}" style="margin-top:14px"{A(t+.25,"up",o=o)}>{h}</div></div>')

# ---------- dessins réutilisables ----------
def plante(x, y, k=1, t=0, racines=True, poils=None, fleur=True, sol=True, tr=None):
    """Angiosperme schématique ; (x, y) = collet. t = début du dessin.
    tr : dictionnaire facultatif de temps par partie (tige, feuilles, fleur, racines, poils)."""
    tr = tr or {}
    tt = tr.get('tige', t); tf = tr.get('feuilles', t+.8); tfl = tr.get('fleur', t+1.4); tra = tr.get('racines', t+1.0)
    g = [f'<g transform="translate({x},{y}) scale({k})">']
    if sol:
        g.append(f'<rect x="-420" y="0" width="840" height="440" fill="url(#gsol)" rx="0"{A(tt,"fade",1)}/>')
        g.append(f'<line x1="-420" y1="0" x2="420" y2="0" stroke="#8a6a4f" stroke-width="3"{A(tt,"fade",1)}/>')
    g.append(f'<path d="M0 0 C -6 -120, 8 -240, 0 -380" stroke="#4caf74" stroke-width="12" stroke-linecap="round"{A(tt,"draw",1.2)}/>')
    feuilles = [(-1, -110, 0), (1, -170, .15), (-1, -240, .3), (1, -300, .45)]
    for sens, h, dt in feuilles:
        org = '0% 100%' if sens > 0 else '100% 100%'
        g.append(f'<g transform="translate(0,{h})"><g style="transform-origin:{org}"{A(tf+dt,"pop",.7)}>'
                 f'<path d="M0 0 C {sens*40} -60, {sens*150} -70, {sens*190} -30 C {sens*140} 10, {sens*50} 10, 0 0 Z" fill="#3fa36b" stroke="#2a7a4e" stroke-width="3"/>'
                 f'<path d="M0 0 C {sens*60} -40, {sens*120} -45, {sens*180} -31" stroke="#2a7a4e" stroke-width="2.5" fill="none"/></g></g>')
    if fleur:
        g.append(f'<g{A(tfl,"pop",.8)}>' + ''.join(
            f'<ellipse cx="{28*math.cos(a)}" cy="{-392+28*math.sin(a)}" rx="24" ry="15" transform="rotate({a*180/math.pi} {28*math.cos(a)} {-392+28*math.sin(a)})" fill="#ffd166"/>'
            for a in [i*math.pi/3 for i in range(6)]) + '<circle cx="0" cy="-392" r="16" fill="#e89b2d"/></g>')
    if racines:
        g.append(f'<path d="M0 0 C 4 80, -6 180, 2 300" stroke="#e8d3b0" stroke-width="9" stroke-linecap="round"{A(tra,"draw",1.2)}/>')
        lat = [(-1,40,120),(1,70,140),(-1,120,130),(1,150,110),(-1,190,100),(1,215,90),(-1,245,70)]
        for i,(s,h,l) in enumerate(lat):
            g.append(f'<path d="M0 {h} C {s*l*.4} {h+15}, {s*l*.8} {h+40}, {s*l} {h+80}" stroke="#e8d3b0" stroke-width="5" stroke-linecap="round"{A(tra+.6+i*.08,"draw",.9)}/>')
        if poils is not None:
            # zone pilifère : un manchon de poils fins près de l'extrémité de chaque racine
            ph = []
            for i in range(26):
                yy = 228 + i*2.6; s = 1 if i%2 else -1
                ph.append(f'<line x1="{2+s*3}" y1="{yy}" x2="{2+s*(22+ (i%3)*6)}" y2="{yy+10}" stroke="#fff3dc" stroke-width="1.6"/>')
            g.append(f'<g{A(poils,"fade",1)}>' + ''.join(ph) + '</g>')
    g.append('</g>')
    return ''.join(g)

DEFS = '''<svg width="0" height="0" style="position:absolute"><defs>
<linearGradient id="gsol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3d2b"/><stop offset="1" stop-color="#2a1c13"/></linearGradient>
<linearGradient id="gciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16263a"/><stop offset="1" stop-color="#1d2f3f"/></linearGradient>
<radialGradient id="gsoleil"><stop offset="0" stop-color="#fff2b3"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
<marker id="fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#f1ede6"/></marker><marker id="flr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e5333b"/></marker><marker id="flb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5ab8ff"/></marker><marker id="flv" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#62c98d"/></marker><marker id="flo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e88a5a"/></marker><marker id="flj" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffd166"/></marker>
<filter id="flou"><feGaussianBlur stdDeviation="18"/></filter>
</defs></svg>'''

# =====================================================================
# GÉNÉRIQUE (muet, avant la voix)
scene(-4, 0.2, f'''
<div class="abs" style="left:0;right:0;top:330px;text-align:center">
  <div class="sur" style="letter-spacing:.6em"{A(-3.6,"fade",1)}>Une série de SVT · Terminale spécialité</div>
  <div class="k" style="font-size:300px;margin-top:30px;color:#fff"{A(-3.3,"zoom",1.6)}>VIE FIXÉE</div>
  <div style="width:520px;height:6px;background:var(--rouge);margin:26px auto 0"{A(-2.4,"growx",1)}></div>
</div>''')

# 0 – 6 : titre de l'épisode
scene(0.2, 6, f'''
<div class="abs" style="left:150px;top:300px">
  <div class="sur"{A(.4,"left")}>Thème 2 · Enjeux planétaires contemporains</div>
  <div class="k" style="font-size:190px;margin-top:24px"{A(2.6,"up",.9)}>Les Angiospermes</div>
  <div class="k" style="font-size:190px;color:var(--vert)"{A(3.4,"up",.9)}>et la vie fixée</div>
  <div class="p" style="margin-top:28px"{A(4.4,"up")}>Chapitre 1 · Épisode 1 — <b>Se nourrir sans bouger</b></div>
</div>''', cam='0 0 0 1.04; 6 -30 0 1')

# 6 – 16.6 : les trois fonctions vitales
fn = [(11.5,'Se nourrir','var(--vert)','🌱'),(12.6,'Se reproduire','var(--soleil)','🌼'),(13.9,'Lutter contre les prédateurs','var(--co2)','🛡'),(15.1,'… et les variations du milieu','var(--eau)','🌦')]
cartes = ''.join(f'''<div class="carte" style="left:{150+i*415}px;top:520px;width:380px;height:250px"{A(t,"pop",.6)}>
  <div style="width:56px;height:6px;background:{c};border-radius:3px"></div>
  <div class="h3" style="margin-top:26px;color:{c}">{n}</div></div>''' for i,(t,n,c,_) in enumerate(fn))
scene(6, 16.6, titre(6.3,'Pour survivre et durer','Tout organisme doit…') + cartes)

# 16.6 – 28 : fixé contre mobile (document 1)
scene(16.6, 28, f'<div class="abs sur" style="left:120px;top:140px"{A(17.0,"left")}>Angiospermes = plantes à fleurs</div>'
  f'<div class="abs h2" style="left:120px;top:180px"{A(17.4,"up")}>Une vie fixée</div>' +
  DOC('d1_plante', 17.2, box=(980,170,840,880), kb=[(17.2,75,33,1),(20.4,75,33,1),(21.6,72,40,1.3),(28,72,40,1.3)],
      hl=[(21.0,57,37.5,66,43.5)], notes=[(21.4,74,42,'fixée au sol par ses racines','r',-380,30)], legende='Document 1') + f'''
<div class="carte" style="left:120px;top:420px;width:760px"{A(22.4,"up")}><div class="h3" style="color:#ff8a8a">Elle ne peut pas se déplacer</div><div class="pm">pour se nourrir, se reproduire, se défendre…</div></div>
<div class="carte" style="left:120px;top:660px;width:760px"{A(25.4,"up")}><div class="h3" style="color:var(--co2)">À l’inverse des Mammifères</div><div class="pm">organismes mobiles</div></div>''')

# 28 – 37 : 130 millions d'années
scene(28, 37, f'''
<div class="abs c" style="left:0;right:0;top:250px">
  <div class="sur"{A(28.2,"fade")}>Présentes sur Terre depuis près de</div>
  <div class="k" style="font-size:340px;color:#fff;margin-top:10px"><span{A(30.4,"count",1.4)} data-to="130">0</span><span style="color:var(--vert)"{A(31.2,"fade")}> Ma</span></div>
  <div class="p" style="margin-top:20px"{A(32.2,"up")}>→ elles ont mis en place des <span class="mark v"{A(34.0,"hl",.8)}>stratégies</span> pour faire face à la vie fixée</div>
</div>''', cam='28 0 0 1; 37 0 -20 1.06')

# 37 – 44.9 : la problématique
scene(37, 44.9, f'''
<div class="abs" style="left:150px;top:300px;width:1620px">
  <div class="pastille"{A(37.2,"pop")}>La question de l'épisode</div>
  <div class="k" style="font-size:118px;margin-top:40px;line-height:1"{A(38.9,"type",3.6)}>Comment les Angiospermes ont-ils pu assurer leur survie et la pérennité de leurs espèces ?</div>
</div>''')

# 45 – 58.6 : le plan
etapes = [(51.1,'L’organisation des Angiospermes','var(--craie)'),(55.2,'Se nourrir','var(--vert)'),(56.0,'Se reproduire','var(--soleil)'),(56.9,'Faire face aux contraintes du milieu','var(--eau)')]
plan = ''.join(f'''<div class="abs" style="left:{220+i*50}px;top:{360+i*130}px;display:flex;align-items:center;gap:30px"{A(t,"left")}>
  <div class="k" style="font-size:90px;color:{c};width:70px">{i+1}</div><div class="h3">{n}</div></div>''' for i,(t,n,c) in enumerate(etapes))
scene(45, 58.6, titre(45.2,'Au programme','Le chemin de l’épisode') + plan +
      f'<svg class="abs" style="left:0;top:0" width="1920" height="1080"><path d="M250 470 L 250 860" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-dasharray="6 10"{A(53,"fade")}/></svg>')

# 58.6 – 67.6 : carton de partie
scene(58.6, 67.6, f'''
<div class="abs" style="left:150px;top:330px">
  <div class="k" style="font-size:150px;color:var(--rouge)"{A(59.6,"left",.8)}>Partie I</div>
  <div class="k" style="font-size:132px;margin-top:10px"{A(61.4,"up",.9)}>Se nourrir</div>
  <div class="k" style="font-size:132px;color:var(--vert)"{A(64.0,"up",.9)}>quand on est fixé</div>
</div>
<div class="abs" style="right:0;top:0;bottom:0;width:10px;background:var(--rouge)"{A(59.2,"wipedown",1.2)}></div>''',
      cam='58.6 0 0 1; 67.6 -40 0 1.05')

# 67.6 – 94 : autotrophe / hétérotrophe
scene(67.6, 94, titre(67.9,'1 · Les contraintes pour se nourrir','Autotrophe ou hétérotrophe ?') +
  DOC('d1_plante', 68.4, box=(120,300,560,700), legende='Document 1') + f'''
<div class="carte" style="left:740px;top:300px;width:1060px"{A(74.9,"left")}><div class="h3" style="color:var(--vert)">Photosynthèse <span class="lab-s" style="font-size:24px">(+ respiration, comme tout être vivant)</span></div>
<div class="k" style="font-size:110px;color:var(--vert);margin-top:14px"{A(81.1,"zoom",.7)}>AUTOTROPHE</div><div class="pm"{A(82.4,"up")}>elle ne dépend pas d’autres organismes pour se nourrir</div></div>
<div class="carte" style="left:740px;top:690px;width:1060px"{A(86.6,"left")}><div class="k" style="font-size:90px;color:var(--co2)"{A(88.7,"zoom",.7)}>NOUS : HÉTÉROTROPHES</div>
<div class="pm"{A(89.6,"up")}>nous devons manger d’autres êtres vivants : <b style="color:#fff"{A(92.7,"fade")}>viande</b>, <b style="color:#fff"{A(93.3,"fade")}>plantes</b></div></div>''')

# 94 – 123 : l'équation de la photosynthèse (cours)
reac = [(116.0,'dioxyde de carbone','var(--co2)'),(117.3,'lumière','var(--soleil)'),(118.1,'eau','var(--eau)'),(118.6,'sels minéraux','#d7c4ff')]
reac_h = ''.join(f'<div class="pastille" style="background:none;border:2px solid {c};color:{c};margin-right:18px"{A(t,"pop")}>{n}</div>' for t,n,c in reac)
scene(94, 123, titre(94.3,'La photosynthèse, dans les chloroplastes','L’équation bilan') +
  DOC('equation', 96.4, box=(160,300,1600,450),
      hl=[(100.0,30.3,65,36.2,66.9,'',113),(102.1,37.4,65,43.6,66.9,'b',113),(104.7,45.4,63.3,52,64.7,'j',113),(105.5,45.2,66.8,52.6,69.4,'',113),(108.6,53.3,65,61,66.9,'v',113),(111.0,61.6,65,67,66.9,'b',113)],
      legende='Le cours — équation bilan') +
  f'''<div class="abs" style="left:150px;top:800px"><div class="pm" style="margin-bottom:22px"{A(113.2,"up")}>La plante a donc besoin de… <b style="color:#fff"{A(120.8,"fade")}>ses réactifs</b></div>{reac_h}</div>''')

# 123 – 160 : où sont les réactifs ?
co2 = ''.join(f'<g transform="translate({x},{y})"><circle r="9" fill="#333"/><circle cx="-16" r="7" fill="var(--co2)"/><circle cx="16" r="7" fill="var(--co2)"/></g>' for x,y in [(240,420),(1100,300),(1500,470),(820,520)])
gouttes = ''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="var(--eau)" opacity=".85"/>' for x,y in [(200,720),(330,800),(460,690),(870,760),(990,860),(1180,720),(1300,820),(560,900),(1450,700),(1620,860),(260,950),(1080,980)])
sels = ''.join(f'<rect x="{x}" y="{y}" width="9" height="9" fill="#d7c4ff" transform="rotate(45 {x} {y})"/>' for x,y in [(420,760),(1240,900),(700,980)])
scene(123, 160, svg(f'''
<rect x="0" y="0" width="1920" height="620" fill="url(#gciel)"{A(123.1,"fade")}/>
<rect x="0" y="620" width="1920" height="460" fill="url(#gsol)"{A(123.1,"fade")}/>
<circle cx="1660" cy="190" r="190" fill="url(#gsoleil)"{A(123.5,"pop",1)}/>
{''.join(f'<line x1="{1660-math.cos(a)*120}" y1="{190+math.sin(a)*120}" x2="{1660-math.cos(a)*300}" y2="{190+math.sin(a)*300}" stroke="var(--soleil)" stroke-width="4" stroke-dasharray="12 14"{A(124.6+i*.1,"draw",.8)}/>' for i,a in enumerate([.2,.55,.9,1.25]))}
{plante(760, 620, .78, 123.2, sol=False)}
<g{A(131.6,"fade",1)}>{gouttes}</g><g{A(132.2,"fade",1)}>{sels}</g>
<g{A(150.5,"fade",1)}>{co2}</g>
''') + f'''
<div class="carte" style="left:1010px;top:120px;width:420px;padding:24px 30px"{A(125.0,"left")}>
  <div class="pm" style="color:var(--soleil)">Lumière</div>
  <div class="k" style="font-size:96px"><span{A(129.0,"count",1)} data-to="342">0</span> <span style="font-size:52px">W/m²</span></div>
  <div class="lab-s" style="color:rgba(241,237,230,.8)"{A(125.3,"fade")}>quasi infinie le jour (sans ombre ni nuage)</div></div>
<div class="carte" style="left:1150px;top:660px;width:640px;padding:24px 30px"{A(135.3,"left")}>
  <div class="pm" style="color:var(--eau)">Eau : <b>quantité illimitée</b> <span style="font-size:22px;opacity:.8"{A(136.9,"fade")}>(sauf milieu sec)</span></div>
  <div style="height:1px;background:rgba(255,255,255,.12);margin:16px 0"{A(139.6,"fade")}></div>
  <div class="pm" style="color:#d7c4ff"{A(139.8,"fade")}>Sels minéraux : <b>faiblement concentrés</b></div>
  <div class="lab-s" style="margin-top:10px"{A(143.8,"up")}>de 0,1 mol/mL (phosphate)</div>
  <div class="lab-s"{A(146.8,"up")}>à 1,4 mol/mL (nitrate)</div></div>
<div class="carte" style="left:120px;top:150px;width:470px;padding:24px 30px"{A(151.0,"right")}>
  <div class="pm" style="color:var(--co2)">CO<sub>2</sub> de l'air : <b>faible concentration</b></div>
  <div class="k" style="font-size:96px">0,0<span{A(155.2,"count",1.2)} data-to="38">0</span> <span style="font-size:52px">%</span></div>
  <div class="lab-s"{A(158.2,"fade")}>de l'atmosphère</div></div>
''', cam='123 0 0 1.06; 130 -40 30 1.06; 140 -40 -60 1.06; 152 60 40 1.06; 160 0 0 1.06')

# 160 – 175 : deux milieux, de faibles concentrations
scene(160, 175, svg(f'''
<rect x="0" y="0" width="1920" height="540" fill="url(#gciel)" opacity=".7"/>
<rect x="0" y="540" width="1920" height="540" fill="url(#gsol)" opacity=".8"/>
<text x="960" y="490" text-anchor="middle" style="font-family:Bebas;font-size:220px" fill="#9cc7ee"{A(165.6,"zoom",.6)}>L'AIR</text>
<text x="960" y="850" text-anchor="middle" style="font-family:Bebas;font-size:220px" fill="#d2a679"{A(166.0,"zoom",.6)}>LE SOL</text>
''') + f'''<div class="abs c" style="left:0;right:0;top:140px"><div class="sur"{A(160.0,"fade")}>Ce qu'il faut retenir</div>
<div class="h3" style="margin-top:14px"{A(160.5,"up")}>Des nutriments <span class="mark"{A(163.4,"hl",.6)}>peu concentrés</span>, dans <span class="mark b"{A(164.4,"hl",.6)}>deux milieux différents</span></div></div>
<div class="abs c" style="left:0;right:0;top:930px"><div class="carte" style="position:relative;display:inline-block;padding:20px 40px"{A(167.0,"up")}><span class="pm">→ La plante a dû mettre en place des <b style="color:#fff">stratégies</b> pour <span class="mark v"{A(169.7,"hl",.6)}>optimiser la capture</span> des réactifs</span></div></div>''')

# 175 – 180.6 : stratégie 1
scene(175, 180.6, f'''
<div class="abs" style="left:150px;top:350px">
  <div class="pastille v"{A(175.4,"pop")}>2 · Stratégie n°1</div>
  <div class="k" style="font-size:170px;margin-top:30px"{A(177.0,"up",.8)}>De vastes</div>
  <div class="k" style="font-size:170px;color:var(--vert)"{A(178.2,"up",.8)}>surfaces d’échange</div>
</div>''', cam='175 0 0 1; 180.6 -30 0 1.05')

# 180.6 – 200.4 : appareil végétatif, deux systèmes (document 9)
scene(180.6, 200.4, titre(180.8,'Document 9 · une plante, deux milieux','L’appareil végétatif') +
  DOC('d9_surfaces', 181.0, box=(120,250,1680,790), kb=[(181,50,27,1),(192.5,50,27,1),(196.4,43,44,2.0),(200.4,43,44,2.1)],
      hl=[(183.6,6,34.8,15,36.6,'b',190),(184.1,7,38.3,12.5,40,'j',190),(190.0,6,37,82,49.5,'j',192),(191.2,6,4,92,36.8,'v',192.6)],
      notes=[(197.0,43.5,44.6,'poils absorbants','r',40,30)], legende='Document 9 — les surfaces d’échange') +
  bandeau([(185.2,'appareil végétatif (hors reproduction) = <b>système caulinaire</b> + <b>système racinaire</b>',196.0)], y=930))

# ---------- système racinaire en grand ----------
def poils_sur(path_pts, t, n=30, long=26, couleur='#fff3dc', dens=1.0, d=1.2):
    """poils absorbants le long d'un segment [(x1,y1),(x2,y2)] ; dens > 1 = plus de poils"""
    (x1,y1),(x2,y2) = path_pts; L = math.hypot(x2-x1,y2-y1); ux,uy = (x2-x1)/L,(y2-y1)/L; nx,ny = -uy,ux
    out=[]; m=int(n*dens)
    for i in range(m):
        f = i/m; px,py = x1+(x2-x1)*f, y1+(y2-y1)*f; s = 1 if i%2 else -1
        l = long*(.6+.4*((i*37)%11)/10)*(dens**.3)
        out.append(f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{px+s*nx*l+ux*l*.25:.1f}" y2="{py+s*ny*l+uy*l*.25:.1f}" stroke="{couleur}" stroke-width="1.8" stroke-linecap="round"/>')
    return f'<g{A(t,"fade",d)}>' + ''.join(out) + '</g>'

def racine(x, y, k, t_piv, t_lat, t_poils=None, dens=1.0, couleur='#e8d3b0'):
    g=[f'<g transform="translate({x},{y}) scale({k})">']
    g.append(f'<path d="M0 0 C 6 120, -8 260, 4 420" stroke="{couleur}" stroke-width="14" stroke-linecap="round"{A(t_piv,"draw",1.2)}/>')
    lat=[(-1,60,190),(1,100,210),(-1,170,200),(1,215,170),(-1,275,150),(1,310,120)]
    ends=[]
    for i,(s,h,l) in enumerate(lat):
        g.append(f'<path d="M0 {h} C {s*l*.4} {h+20}, {s*l*.8} {h+55}, {s*l} {h+120}" stroke="{couleur}" stroke-width="7" stroke-linecap="round"{A(t_lat+i*.12,"draw",1)}/>')
        ends.append(((s*l*.82, h+80),(s*l, h+120)))
    if t_poils is not None:
        g.append(poils_sur(((3,330),(4,410)), t_poils, 34, 30, dens=dens))
        for j,e in enumerate(ends): g.append(poils_sur(e, t_poils+.15*j, 14, 20, dens=dens))
    g.append('</g>'); return ''.join(g)

# 200.4 – 221 : racine pivotante, latérales, poils absorbants (document 2)
scene(200.4, 221, titre(200.6,'a · Le système racinaire · document 2','Racines et poils absorbants') +
  DOC('d2_poils', 200.8, box=(100,250,1060,790), kb=[(200.8,31,20,1),(211.2,31,20,1),(212.4,17,24,1.8),(221,17,24,1.8)],
      notes=[(203.6,23.6,14,'racine pivotante (principale)','',20,-30),(208.6,21.2,15.8,'racines latérales','',-300,10),(211.8,12,23.8,'poils absorbants','r',40,40)],
      legende='Document 2') + f'''
<div class="carte" style="left:1220px;top:330px;width:580px"{A(210.6,"left")}><div class="pm">c’est par les <b style="color:#fff">poils absorbants</b> que la plante puise l’eau et les sels minéraux</div></div>
<div class="carte" style="left:1220px;top:600px;width:580px"{A(214.7,"up")}><div class="pm">surface d’échange : <b style="color:#fff">plusieurs <span class="mark"{A(218.7,"hl",.8)}>centaines de m²</span></b></div></div>''')

# 221 – 236.4 : sol normal / sol carencé (document 2)
scene(221, 236.4, titre(221.2,'Document 2 · effet d’une carence','Plus de poils quand le sol est pauvre') +
  DOC('d2_poils', 221.4, box=(120,250,1680,640), kb=[(221.4,31,20,1),(225.6,31,20,1),(226.6,48,25,1.6),(230,48,25,1.6),(231.5,31,20,1)],
      hl=[(222.0,8,6,30,29.6,'v',224.6),(224.1,30,6,56,30,'')], legende='Document 2') +
  bandeau([(226.7,'sol carencé en sels minéraux : <b>plus de poils absorbants</b>',230.2),(230.3,'⇒ ce sont les <b>poils absorbants</b> qui absorbent l’eau et les sels minéraux… <b>et non les racines</b>',None)], y=930))

# 236.4 – 248.4 : point expérience
scene(236.4, 248.4, f'''
<div class="abs" style="left:150px;top:310px">
  <div class="xp" style="position:relative;display:inline-block;font-size:30px;padding:16px 26px"{A(240.6,"pop")}>Point expérience</div>
  <div class="k" style="font-size:180px;margin-top:40px"{A(238.9,"up",.8)}>L’expérience de <span style="color:var(--soleil)">Rosène</span></div>
  <div class="carte" style="position:relative;margin-top:50px;width:1200px;padding:24px 34px"{A(242.4,"up")}>
    <span class="p">✎ Indispensable pour <b style="color:#fff">les sujets de synthèse</b> : elle permet d’<span class="mark"{A(245.8,"hl",.7)}>étayer vos arguments</span>.</span></div>
</div>''', cam='236.4 0 0 1; 248.4 -40 -10 1.04')

# ---------- l'expérience de Rosène ----------
def tube(x, cas, t, racine_d, poils, fletrit=None, legende=''):
    """bécher : huile en haut (elle flotte), eau en dessous.
    racine_d : tracé de la racine ; poils : segment portant les poils absorbants."""
    g = [f'<g transform="translate({x},0)">']
    g.append(f'<rect x="-126" y="600" width="252" height="90" fill="{HUILE}" opacity=".55"{A(t+.3,"wipedown",.6)}/>')
    g.append(f'<rect x="-126" y="690" width="252" height="210" fill="{EAU}" opacity=".55"{A(t+.5,"wipedown",.6)}/>')
    g.append(f'<rect x="-130" y="520" width="260" height="380" rx="10" fill="none" stroke="rgba(241,237,230,.7)" stroke-width="4"{A(t,"fade")}/>')
    droite = '<path d="M0 580 C 0 520, 0 470, 0 420" stroke="#62c98d" stroke-width="7" fill="none"/><ellipse cx="-34" cy="410" rx="36" ry="16" fill="#3fa36b"/><ellipse cx="34" cy="410" rx="36" ry="16" fill="#3fa36b"/>'
    if fletrit is None:
        g.append(f'<g{A(t+.5,"up")}>{droite}</g>')
    else:
        g.append(f'<g{A(t+.5,"up",o=fletrit)}>{droite}</g>')
        g.append(f'<g{A(fletrit,"fade",.6)}><path d="M0 580 C 0 500, 10 450, 60 440" stroke="#a7a36a" stroke-width="7" fill="none"/>'
                 '<ellipse cx="78" cy="452" rx="34" ry="13" fill="#8c8a4a" transform="rotate(60 78 452)"/><ellipse cx="62" cy="470" rx="34" ry="13" fill="#8c8a4a" transform="rotate(100 62 470)"/></g>')
    g.append(f'<path d="{racine_d}" stroke="#e8d3b0" stroke-width="6" fill="none"{A(t+.6,"draw",.8)}/>')
    g.append(poils_sur(poils, t+1.0, 22, 26))
    g.append(f'<text x="0" y="955" text-anchor="middle" style="font-family:Bebas;font-size:64px" fill="#f1ede6"{A(t,"up")}>{cas}</text>')
    g.append(f'<text x="0" y="992" text-anchor="middle" class="lab-s"{A(t+1.2,"fade")}>{legende}</text>')
    g.append('</g>'); return ''.join(g)

HUILE='#d9b84a'; EAU='#3a8fd6'
EAU='#3a8fd6'; HUILE='#d9b84a'
# 248.4 – 277 : Rosène (document 3)
scene(248.4, 277.0, titre(248.6,'Document 3 · l’expérience de Rosène','Où la plantule absorbe-t-elle l’eau ?') +
  DOC('d3_schema', 249.0, box=(120,250,1680,640),
      hl=[(254.6,11,39.5,20.5,49.2,'v',266),(255.3,29.5,40.5,39,49.2,'b',266),(256.1,44.5,39.5,54,49.2,'v',266),(260.4,49.5,43.6,57.5,48,'j',265),(266.2,29.5,40.5,39,49.2)],
      notes=[(266.2,34,41,'FLÉTRIT','r',40,-40),(266.6,17,40.5,'vit','v',40,-40),(266.8,49,40.5,'vit','v',40,-40)], legende='Document 3') +
  bandeau([(254.6,'on place une ou plusieurs régions de la racine hors de l’eau, dans l’huile',266.0),
           (266.2,'B : la zone pilifère (le rhizoderme) est dans l’huile ⇒ la plantule flétrit',273.4),(273.5,'⇒ ce tissu superficiel est <b>indispensable à l’absorption</b>',None)], y=930))

# 276.6 – 288.6 : complément au colorant
scene(277.0, 288.6, titre(277.2,'Complément · eau colorée','Seuls les poils absorbants se colorent') +
  DOC('d3_photos', 277.4, box=(120,250,1680,640), kb=[(277.4,78,45,1),(279.3,78,45,1),(280.3,69,45,1.5),(282.4,69,45,1.5),(283.4,86,45,1.5),(288.6,86,45,1.5)],
      notes=[(283.4,88,43,'poils absorbants colorés','r',30,-30)], legende='Document 3 — 5 min, puis 20 min') +
  bandeau([(284.3,'⇒ ce sont bien <b>ces structures</b> qui absorbent l’eau et les sels minéraux',None)], y=930))

# ---------- mycélium : réseau ramifié pseudo-aléatoire, déterministe ----------
def mycelium(x, y, t, n=14, r=260, graine=1, d=1.6, couleur='#f3e7cf', ang=(0, 2*math.pi), ep=2):
    import random; R = random.Random(graine); out=[]
    def br(px,py,a,l,depth,t0):
        if depth==0 or l<14: return
        qx,qy = px+math.cos(a)*l, py+math.sin(a)*l
        out.append(f'<path d="M{px:.0f} {py:.0f} Q {(px+qx)/2+R.uniform(-10,10):.0f} {(py+qy)/2+R.uniform(-10,10):.0f} {qx:.0f} {qy:.0f}" stroke="{couleur}" stroke-width="{ep*depth/3+.6:.1f}" stroke-linecap="round"{A(round(t0,2),"draw",.5)}/>')
        for k in range(2): br(qx,qy,a+R.uniform(-.7,.7),l*R.uniform(.55,.75),depth-1,t0+.25)
    for i in range(n):
        a = ang[0]+(ang[1]-ang[0])*(i+.5)/n + R.uniform(-.15,.15)
        br(x,y,a,r*R.uniform(.35,.5),4,t+i*d/n)
    return '<g>'+''.join(out)+'</g>'

arbre = '''<path d="M-30 0 L -22 -260 L 22 -260 L 30 0 Z" fill="#6b4a33"/><circle cx="0" cy="-380" r="170" fill="#2f7d55"/><circle cx="-120" cy="-300" r="110" fill="#3fa36b"/><circle cx="120" cy="-310" r="120" fill="#3fa36b"/>'''

# 288.6 – 307 : les mycorhizes (document 4)
scene(288.6, 307, titre(288.8,'Autre acteur de l’absorption','Les mycorhizes') +
  DOC('d4_pin', 289.0, box=(100,250,760,790), kb=[(289,26,22,1),(303,26,22,1),(304.6,22,27,1.4),(307,22,27,1.4)],
      notes=[(304.6,28,24,'filaments du champignon','j',20,-40)], legende='Document 4 — jeune pin') + f'''
<div class="carte" style="left:940px;top:300px;width:860px"{A(295.6,"left")}><div class="pm" style="color:#ff8a8a">Chez les grandes plantes, les poils absorbants ne suffisent pas</div></div>
<div class="carte" style="left:940px;top:500px;width:860px"{A(303.4,"left")}><div class="k" style="font-size:90px;color:#fff">SYMBIOSE</div><div class="pm">plante + champignon <b style="color:var(--soleil)"{A(305.2,"fade")}>= mycorhizes</b></div></div>''')

# 307 – 331 : le document 4, les échanges
scene(307, 331, titre(307.2,'Document 4 · la mycorhize en coupe','Un échange à bénéfices réciproques') +
  DOC('d4_coupe', 307.4, box=(100,250,820,790), kb=[(307.4,62,18,1),(331,62,18,1)],
      hl=[(308.6,47,15.4,55,17.4,'v',315),(309.2,47,22.2,54.5,25.3,'v',315),(315.7,47,7.4,59,10.4,'j',325),(316.7,74.8,17.6,82,18.8,'b',325),(325.8,74.8,15.6,82,16.8)], legende='Document 4') + f'''
<div class="abs" style="left:1000px;top:300px;width:820px">
<div class="pm"{A(308.6,"up")}>le champignon forme un <b style="color:#62c98d">manteau</b> et un <b style="color:#62c98d">réseau de Hartig</b> entre les cellules de la racine</div>
<div class="carte" style="position:relative;margin-top:30px;border-color:#2a6fa8"{A(316.7,"up")}><div class="pm"><b style="color:var(--eau)">eau + sels minéraux (N, P, K)</b> : captés par les filaments, acheminés jusqu’au <b style="color:#fff">xylème</b></div></div>
<div class="carte" style="position:relative;margin-top:24px;border-color:#e5333b"{A(325.8,"up")}><div class="pm"><b style="color:#ff8a8a">matière organique (sucres)</b> de la photosynthèse → croissance du champignon</div></div>
<div class="pastille" style="margin-top:30px"{A(321.9,"pop")}>symbiose = échange à bénéfices réciproques</div></div>''')

# 331 – 340.8 : surface d'absorption → croissance (graphique du document 4)
scene(331, 340.8, titre(331.2,'Document 4 · des filaments très fins, très étendus','Plus de surface, plus de croissance') +
  DOC('d4_courbe', 331.4, box=(120,250,1680,620), hl=[(334.5,67.5,42.9,82,45.4),(335.4,51.8,37.7,63.5,40.3,'b')], legende='Document 4 — croissance d’un plant') +
  bandeau([(336.6,'grande surface d’échange : <b>finesse</b> + <b>grande surface d’exploitation du sol</b>',None)], y=930))

# 340.8 – 351.3 : 90 %
scene(340.8, 351.3, f'''
<div class="abs c" style="left:0;right:0;top:230px">
  <div class="sur"{A(341,"fade")}>Pour info</div>
  <div class="k" style="font-size:330px;color:#f3e7cf"><span{A(344.3,"count",1.2)} data-to="90">0</span> %</div>
  <div class="p"{A(344.9,"up")}>des plantes vivent en association avec des mycorhizes</div>
  <div class="p" style="margin-top:14px;color:#fff"{A(346.6,"up")}>quasi <span class="mark"{A(347.1,"hl",.6)}>obligatoires</span> chez les grandes plantes, comme les arbres</div>
</div>''', cam='340.8 0 0 1.05; 351.3 0 0 1')

# 351.3 – 364 : modèle des manuels
scene(351.3, 364, titre(351.5,'Pourquoi étudie-t-on les poils absorbants ?','Le modèle et la réalité') + f'''
<div class="carte" style="left:150px;top:380px;width:760px;height:460px"{A(352.0,"left")}>
  <div class="pastille o">Dans la nature</div>
  <div class="h3" style="margin-top:34px">La <span style="color:#f3e7cf">majeure partie</span> de l’eau et des sels minéraux passe par les <span style="color:#f3e7cf">mycorhizes</span></div></div>
<div class="carte" style="left:1010px;top:380px;width:760px;height:460px"{A(357.2,"right")}>
  <div class="pastille v">En classe</div>
  <div class="h3" style="margin-top:34px">On étudie les <span style="color:var(--vert)">poils absorbants</span></div>
  <div class="pm" style="margin-top:24px"{A(359.4,"up")}>plus faciles à étudier : on travaille sur de <b style="color:#fff">jeunes plantes</b></div></div>''')

# 364 – 396.6 : réseau mycorhizien partagé
P = [(420,640),(960,640),(1500,640)]
plantes3 = ''.join(plante(x, y, .6, 364.4+i*.3, racines=True, sol=False) for i,(x,y) in enumerate(P))
reseau = f'<path d="M420 780 C 600 900, 800 900, 960 790 C 1120 900, 1320 900, 1500 780" stroke="#f3e7cf" stroke-width="5" fill="none"{A(371.0,"draw",1.6)}/>'
pulse = ''.join(f'<circle cx="0" cy="0" r="13" fill="var(--soleil)"{A(377.6+k*.3,"fade",.3,o=383.0)}><animateMotion dur="1s" path="M420 780 C 600 900, 800 900, 960 790" fill="freeze"/></circle>' for k in range(0))
# impulsion « nutriment » : un point qui suit le mycélium de la plante 1 à la plante 2, calé à la main
pts = [(420,780),(520,850),(640,880),(760,875),(870,845),(960,790)]
pulse = ''.join(f'<circle cx="{x}" cy="{y}" r="14" fill="var(--soleil)"{A(378.0+i*.45,"pop",.3,o=378.45+i*.45)}/>' for i,(x,y) in enumerate(pts[:-1])) + \
        f'<circle cx="960" cy="790" r="16" fill="var(--soleil)"{A(380.6,"pop",.4)}/>'
scene(364, 396.6, titre(364.2,'Un champignon, plusieurs plantes','Le réseau mycorhizien') + svg(f'''
<rect x="0" y="640" width="1920" height="440" fill="url(#gsol)" opacity=".85"/>
{plantes3}
{mycelium(420, 800, 365.6, n=8, r=260, graine=11, d=.8)}
{reseau}
{mycelium(960, 800, 371.4, n=8, r=260, graine=12, d=.8)}{mycelium(1500, 800, 371.8, n=8, r=260, graine=13, d=.8)}
{pulse}
<text x="620" y="1000" text-anchor="middle" class="lab" fill="var(--soleil)"{A(378.2,"up")}>nutriment prélevé à une plante…</text>
<text x="1040" y="1000" class="lab" fill="var(--soleil)"{A(380.6,"up")}>… donné à une autre</text>
''') + f'''<div class="abs" style="left:150px;top:300px;display:flex;gap:20px">
<div class="pastille" style="background:#555"{A(371.3,"pop")}>plusieurs individus, même espèce ou non</div><div class="pastille o"{A(385.0,"pop")}>espèces fongiques spécialistes : 1 espèce de plante</div>
<div class="pastille v"{A(391.6,"pop")}>généralistes : une multitude d'espèces</div></div>''')

# 396.6 – 433.4 : les nodosités
nod = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e7a0a0" stroke="#b86464" stroke-width="3"{A(404.3+i*.08,"pop",.5)}/>' for i,(x,y,r) in enumerate([(-62,73,15),(70,100,16),(-60,148,14),(56,172,15),(-2,205,14),(-45,216,12),(36,128,13),(-100,110,12)]))
scene(396.6, 433.4, titre(396.8,'Une autre symbiose, avec des bactéries','Les nodosités') + svg(f'''
<rect x="0" y="680" width="960" height="400" fill="url(#gsol)" opacity=".85"/>
{plante(480, 680, .75, 397.6, sol=False)}
<g transform="translate(480,680) scale(.75)">{nod}</g>
<path d="M560 760 L 700 700" stroke="#e7a0a0" stroke-width="3"{A(404.6,"draw",.5)}/>
<text x="710" y="700" class="lab" fill="#e7a0a0"{A(404.6,"up")}>nodosités</text>
<text x="710" y="740" class="lab-s"{A(407.5,"up")}>bactéries du genre <tspan font-style="italic">Rhizobium</tspan></text>
''') + f'''
<div class="abs" style="left:1060px;top:300px;width:740px">
  <div class="pm"{A(410.5,"up")}>chez les <b style="color:#fff">Fabacées</b> :</div>
  <div style="display:flex;gap:14px;margin-top:16px;flex-wrap:wrap">
   <div class="pastille v"{A(414.1,"pop")}>trèfle</div><div class="pastille v"{A(414.7,"pop")}>haricot</div><div class="pastille v"{A(415.3,"pop")}>pois</div><div class="pastille v"{A(415.9,"pop")}>soja</div></div>
  <div class="carte" style="position:relative;margin-top:40px;padding:26px 30px"{A(417.0,"up")}>
    <div style="display:flex;align-items:center;gap:18px;font:700 44px 'Onest'">
      <span style="color:#9cc7ee"{A(418.9,"pop")}>N<sub>2</sub></span><span class="lab-s"{A(419.5,"fade")}>de l’air</span>
      <span{A(420.3,"left")}>→</span><span style="color:#e7a0a0"{A(421.1,"pop")}>NH<sub>4</sub><sup>+</sup></span>
      <span{A(423.3,"left")}>→</span><span class="lab" style="font-size:30px"{A(424.3,"pop")}>acides aminés</span></div>
    <div class="lab-s" style="margin-top:8px"{A(422.0,"fade")}>diazote → ammonium</div>
  </div>
  <div class="carte" style="position:relative;margin-top:24px;padding:22px 30px;border-color:rgba(232,138,90,.4)"{A(425.7,"up")}>
    <div class="pm">Sans nodosités : la plante absorbe surtout le <b style="color:#fff">NO<sub>3</sub><sup>−</sup></b> du sol <span{A(430.0,"fade")}>et le transforme en NH<sub>4</sub><sup>+</sup></span></div></div>
</div>''')

# 433.4 – 458.2 : bilan côté sol
cartes = [(435.5,'Poils absorbants','#fff3dc'),(438.2,'Mycorhizes','#f3e7cf'),(438.9,'Nodosités','#e7a0a0')]
scene(433.4, 458.2, titre(433.6,'Bilan · côté sol','Une surface d’échange optimisée') + ''.join(
  f'<div class="carte" style="left:{150+i*560}px;top:330px;width:500px;height:150px;display:flex;align-items:center"{A(t,"pop")}><div class="h3" style="color:{c}">{n}</div></div>' for i,(t,n,c) in enumerate(cartes)) + f'''
<div class="abs" style="left:150px;top:560px;display:flex;gap:60px">
  <div style="width:780px"{A(441.9,"up")}><div class="k" style="font-size:150px;color:#fff">&lt; 1 mm</div><div class="p">des structures <b>très fines</b></div></div>
  <div style="width:780px"{A(447.2,"up")}><div class="k" style="font-size:150px;color:var(--vert)">↗ surface</div><div class="p">une très, très grande <b>surface d’exploration</b></div></div>
</div>
<div class="abs c" style="left:0;right:0;top:930px"><span class="p"{A(451.9,"up")}>⇒ absorption optimisée de <span class="mark b"{A(456.4,"hl",.6)}>l’eau et des sels minéraux</span></span></div>''')

# 458.2 – 470.4 : le système caulinaire (document 9)
scene(458.2, 470.4, titre(458.4,'b · Le système caulinaire','Le rôle des feuilles : capter la lumière') +
  DOC('d9_surfaces', 458.6, box=(120,250,1680,790), kb=[(458.6,50,27,1),(462,50,27,1),(464,28,20,1.6),(470.4,28,20,1.6)],
      hl=[(467.3,14,18,23,19.5,'v'),(467.9,13,12.5,20.5,16.5,'v'),(463.0,20,4.5,30,10,'j')], legende='Document 9'))

# 470.4 – 489.8 : de la feuille au thylakoïde (document 6)
scene(470.4, 489.8, titre(470.6,'Document 6 · où se fait la capture de la lumière ?','Du chloroplaste aux thylakoïdes') +
  DOC('d6_chloro', 476.4, box=(100,260,860,620), notes=[(478.2,29.8,16.2,'thylakoïdes','j',20,-40)], legende='chloroplaste (microscope)') +
  DOC('d6_thylako', 479.4, box=(1000,260,820,620), hl=[(480.3,27,32,40,36.5,'j')], legende='replis des thylakoïdes') +
  bandeau([(471.4,'les feuilles : principaux organes de la photosynthèse',476.2),(478.6,'les <b>pigments chlorophylliens</b> sont dans la membrane des thylakoïdes',481.4),
           (481.6,'surface d’échange ≈ <b>1 000 m²</b> grâce aux nombreux replis des thylakoïdes',None)], y=920))

# 489.8 – 513 : le spectre d'absorption (document 6)
scene(489.8, 513, titre(490.0,'Document 6 · toutes les couleurs ne sont pas absorbées','Le spectre d’absorption') +
  DOC('d6_graphe', 490.4, box=(100,250,1100,790), hl=[(496.6,54,27.2,63.5,28.4,'',501),(497.6,54,28.4,63.5,29.6,'j',501),(501.6,54,29.6,63.5,30.8,'j',504),(507.4,56,29.6,67,46.6,'v')], legende='Document 6') + f'''
<div class="abs" style="left:1260px;top:300px;width:560px">
<div class="pm"{A(496.6,"up")}>chlorophylles <b style="color:#fff">a</b> et <b style="color:#fff">b</b> : surtout le <b style="color:#ff7a6a">rouge</b> et le <b style="color:#7fa2ff">bleu</b></div>
<div class="pm" style="margin-top:22px"{A(501.6,"up")}>caroténoïdes : surtout le <b style="color:#7fa2ff">bleu</b></div>
<div class="carte" style="position:relative;margin-top:36px"{A(507.4,"up")}><div class="h3" style="color:#6be07a">le vert n’est pas absorbé</div><div class="pm"{A(508.9,"fade")}>⇒ les feuilles nous apparaissent vertes</div></div></div>''')

# 513 – 536 : Mesurim (document 5)
scene(513, 536, f'<div class="xp" style="left:150px;top:140px"{A(513.4,"pop")}>Point expérience</div>' +
  f'<div class="abs h2" style="left:150px;top:210px"{A(514.4,"up")}>Mesurer une surface de feuille</div>' +
  DOC('d5_mesurim', 516.0, box=(100,340,1000,680), legende='Document 5 — Mesurim') + f'''
<div class="abs" style="left:1180px;top:390px;width:620px">
 <div class="pm"{A(520.2,"left")}>① logiciel <b style="color:#fff">Mesurim</b></div>
 <div class="pm" style="margin-top:22px"{A(522.6,"left")}>② photo de la feuille</div>
 <div class="pm" style="margin-top:22px"{A(525.4,"left")}>③ pointage du contour</div>
 <div class="pm" style="margin-top:22px"{A(529.8,"left")}>④ la surface apparaît <span style="background:#e8ff2a;color:#111;padding:0 8px">en fluo</span></div>
 <div class="carte" style="position:relative;margin-top:34px;padding:18px 26px"{A(532.6,"up")}><span class="pm">→ une estimation en <b style="color:#fff">cm²</b> ou en <b style="color:#fff">m²</b></span></div></div>''')

# 536 – 565.2 : extraction et spectroscope (document 6)
scene(536, 565.2, f'<div class="xp" style="left:150px;top:140px"{A(536.4,"pop")}>Point expérience</div>' +
  f'<div class="abs h2" style="left:150px;top:210px"{A(537.0,"up")}>Les pigments absorbent une partie de la lumière</div>' +
  DOC('d6_spectre_barre', 544.4, box=(120,330,1680,560), kb=[(544.4,69,13,1)],
      notes=[(555.3,52,18,'bleu absorbé','b',-60,40),(556.6,64,18,'vert : non absorbé','v',-40,-90),(555.1,85,18,'rouge absorbé','r',-60,40)], legende='Document 6 — vu au spectroscope') +
  bandeau([(545.3,'extrait brut de chlorophylle, observé à travers un <b>spectroscope</b>',555.0),(560.6,'⇒ les feuilles apparaissent <b>vertes</b>',None)], y=930))

# 565.2 – 590 : les stomates (document 8)
scene(565.2, 590.2, titre(565.4,'Sur la face inférieure des feuilles','Les stomates') +
  DOC('d8_empreintes', 573.6, box=(100,250,1040,790), kb=[(573.6,68,90.5,1.3),(590,68,90.5,1.6)],
      notes=[(576.7,67.5,88,'2 cellules stomatiques','v',-40,-80),(583.0,70,90.5,'ostiole','j',40,40)], legende='Document 8 — empreinte au vernis') + f'''
<div class="carte" style="left:1220px;top:330px;width:580px"{A(573.8,"left")}><div class="pm">de toutes petites ouvertures…</div></div>
<div class="carte" style="left:1220px;top:520px;width:580px"{A(583.6,"left")}><div class="pm"><b style="color:var(--soleil)">l’ostiole</b> : l’ouverture par où entre le CO<sub>2</sub></div></div>
<div class="carte" style="left:1220px;top:720px;width:580px"{A(586.9,"up")}><div class="pm">nécessaire à la <b style="color:#fff">photosynthèse</b></div></div>''')

# 590.2 – 608.8 : document 7, l'ouverture au fil de la journée
scene(590.2, 608.8, titre(590.4,'Document 7 · ouverture des stomates','Pas n’importe quand') +
  DOC('d7_stomates', 590.6, box=(100,250,1240,790), hl=[(598.1,59.5,59,66.5,75.6)], notes=[(598.3,63,59,'12h – 14h','r',-60,-70)], legende='Document 7') + f'''
<div class="abs" style="left:1400px;top:300px;width:420px">
<div class="pm"{A(593.7,"up")}>surtout le <b style="color:#fff">matin</b> et en <b style="color:#fff">fin de journée</b></div>
<div class="carte" style="position:relative;margin-top:30px"{A(602.4,"pop")}><div class="pm" style="color:var(--eau)">💧 à midi, les stomates se ferment : <b style="color:#fff">éviter de perdre l’eau</b>, <span{A(604.2,"fade")}>essentielle à la photosynthèse</span></div></div></div>''')

# 608.8 – 620.8 : surface des stomates
scene(608.8, 620.8, f'''
<div class="abs c" style="left:0;right:0;top:250px">
 <div class="sur"{A(609.0,"fade")}>Les stomates, une surface d’échange</div>
 <div class="k" style="font-size:250px;margin-top:20px;color:#fff"{A(611.0,"zoom",.8)}>des milliers de m²</div>
 <div style="display:flex;justify-content:center;gap:30px;margin-top:40px">
  <div class="pastille v" style="font-size:24px"{A(616.6,"pop")}>très fine</div>
  <div class="pastille b" style="font-size:24px"{A(619.1,"pop")}>en très grande quantité</div></div>
</div>''', cam='608.8 0 0 1.05; 620.8 0 0 1')

# 620.8 – 656.5 : document 8, empreinte au vernis
scene(620.8, 656.5, titre(621.0,'Document 8 · mettre les stomates en évidence','Riche ou pauvre en CO₂ ?') +
  DOC('d8_empreintes', 628.8, box=(120,250,1680,680), hl=[(641.4,61.2,85,77.6,96.3,'v'),(638.3,78,85,94,96.3)],
      notes=[(641.6,69,85,'riche en CO₂ : OUVERTS','v',-140,-70),(638.5,86,85,'pauvre en CO₂ : FERMÉS','r',-120,-70)], legende='Document 8') +
  bandeau([(643.4,'technique : <b>empreinte au vernis</b> de la face inférieure → observation au microscope',None)], y=950))

# 656.5 – 677.8 : bilan côté air
cartes = [(660.8,'Feuilles fines et allongées','#62c98d'),(665.0,'Nombreux replis des thylakoïdes','#7fd39a'),(670.4,'De nombreux stomates','#5ab8ff')]
scene(656.5, 677.8, titre(657.0,'Bilan · côté air','Une surface d’échange optimisée') + ''.join(
  f'<div class="carte" style="left:{150+i*560}px;top:360px;width:500px;height:220px"{A(t,"pop")}><div style="width:60px;height:6px;background:{c};border-radius:3px"></div><div class="h3" style="margin-top:26px;color:{c}">{n}</div></div>' for i,(t,n,c) in enumerate(cartes)) + f'''
<div class="abs c" style="left:0;right:0;top:700px"><div class="p"{A(671.7,"up")}>⇒ on optimise</div>
<div class="h2" style="margin-top:16px"><span style="color:var(--co2)"{A(673.4,"up")}>l’absorption du CO₂</span> <span{A(675.9,"fade")}>et</span> <span style="color:var(--soleil)"{A(676.1,"up")}>la captation de la lumière</span></div></div>''')

# 677.8 – 696 : le bilan général : le schéma de l'essentiel
scene(677.8, 696, titre(678.0,'L’essentiel de l’activité en un schéma','Des surfaces d’échange partout') +
  DOC('essentiel', 678.4, box=(120,250,1680,790), kb=[(678.4,40,50,1),(680,40,50,1),(684,62,82,1.9),(689,62,82,1.9),(691,70,30,1.9),(696,70,30,1.9)], legende='Schéma bilan du cours') +
  bandeau([(680.9,'des structures très fines : appareil racinaire…',689.4),(689.6,'… et appareil caulinaire ⇒ eau, sels minéraux, lumière, CO₂ pour la <b>photosynthèse</b>',None)], y=930))

# 696 – 716 : générique de fin
voc = 'Stomate · ostiole · cuticule · poils absorbants · zone pilifère · chambre sous-stomatique · chloroplaste · thylakoïdes · pigments chlorophylliens · spectre d’absorption · spectre d’action · plante herbacée · plante ligneuse · photosynthèse · symbiose · mycorhize · nodosité'
scene(696, 716, f'''
<div class="abs" style="left:150px;top:200px;width:860px">
 <div class="sur"{A(696.4,"fade")}>Fin de l’épisode 1</div>
 <div class="k" style="font-size:100px;margin-top:20px"{A(696.8,"up")}>Je retiens en me posant des questions</div>
 <div class="pm" style="margin-top:36px"{A(698.0,"up")}>1. Décrire les différentes structures constituant une plante de votre choix.</div>
 <div class="pm" style="margin-top:16px"{A(699.0,"up")}>2. Nommer les parties de la plante permettant le prélèvement des nutriments du milieu et montrer que leur morphologie est adaptée à leur fonction.</div>
 <div class="pm" style="margin-top:16px"{A(700.0,"up")}>3. Citer les différentes surfaces d’échanges chez les Angiospermes et préciser leurs rôles respectifs.</div>
</div>
<div class="carte" style="left:1120px;top:220px;width:660px"{A(701.0,"right")}>
 <div class="pastille">Vocabulaire</div>
 <div class="pm" style="margin-top:24px;line-height:1.6">{voc}</div></div>
<div class="abs" style="left:1120px;top:900px;display:flex;align-items:center;gap:22px"{A(703.5,"up")}>
 <div class="k" style="font-size:64px;color:var(--rouge)">À suivre</div><div class="pm">Épisode 2</div></div>''')
