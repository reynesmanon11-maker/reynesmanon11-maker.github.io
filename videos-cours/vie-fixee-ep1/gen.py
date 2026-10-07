# Génère src/scenes.html. Les temps sont ceux de la voix (secondes dans l'audio).
import pathlib, math
OUT = pathlib.Path(__file__).parent/'src'/'scenes.html'
S = []
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

# 16.6 – 28 : fixé contre mobile
renard = '''<path d="M0 0 C 30 -40, 120 -50, 190 -30 L 230 -60 L 238 -30 C 260 -25, 270 -10, 262 0 L 225 4 L 220 40 L 205 40 L 200 8 C 150 14, 90 14, 50 8 L 40 40 L 25 40 L 22 6 C -20 0, -60 -20, -90 -10 C -60 -30, -20 -20, 0 0 Z" fill="#e88a5a"/>'''
scene(16.6, 28, svg(f'''
<line x1="960" y1="200" x2="960" y2="900" stroke="rgba(255,255,255,.12)" stroke-width="2"{A(16.8,"fade")}/>
{plante(480, 700, .95, 18.2, tr={'racines':20.6})}
<text x="480" y="1010" text-anchor="middle" class="lab"{A(20.8,"up")}>fixée au sol par ses racines</text>
<g{A(22.4,"fade",.6)}><text x="480" y="240" text-anchor="middle" class="h3" style="font-family:Bebas;font-size:64px" fill="#ff8a8a">ne se déplace pas</text></g>
<line x1="1060" y1="740" x2="1840" y2="740" stroke="#4a3a2c" stroke-width="4"{A(25.2,"fade")}/>
<g transform="translate(1180,700)"><g{A(25.5,"right",1.4)}>{renard}</g></g>
<path d="M1100 790 L 1800 790" stroke="var(--co2)" stroke-width="4" marker-end="url(#flo)"{A(26.2,"draw",1)}/>
<text x="1450" y="860" text-anchor="middle" class="lab"{A(26.4,"up")}>Mammifère : organisme mobile</text>
''') + f'<div class="abs sur" style="left:120px;top:140px"{A(17.0,"left")}>Angiospermes = plantes à fleurs</div>')

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
humain = '''<circle cx="0" cy="-250" r="44" fill="#c9b8a6"/><path d="M-70 -180 Q 0 -205 70 -180 L 60 -20 L 30 -20 L 22 120 L -22 120 L -30 -20 L -60 -20 Z" fill="#c9b8a6"/>'''
scene(67.6, 94, titre(67.9,'1 · Les contraintes pour se nourrir','Autotrophe ou hétérotrophe ?') + svg(f'''
{plante(520, 840, .62, 68.5, racines=False, sol=False)}
<g{A(74.9,"pop")}><rect x="330" y="880" width="380" height="64" rx="32" fill="var(--vert-f)"/><text x="520" y="922" text-anchor="middle" class="lab">photosynthèse</text></g>
<text x="520" y="985" text-anchor="middle" class="lab-s"{A(76.6,"up")}>(+ respiration, comme tout être vivant)</text>
<g{A(81.1,"zoom",.7)}><text x="520" y="430" text-anchor="middle" style="font-family:Bebas;font-size:110px" fill="var(--vert)">AUTOTROPHE</text></g>
<text x="520" y="480" text-anchor="middle" class="lab-s"{A(82.4,"up")}>ne dépend pas d'autres organismes pour se nourrir</text>
<line x1="960" y1="300" x2="960" y2="980" stroke="rgba(255,255,255,.12)" stroke-width="2"{A(85.9,"fade")}/>
<g transform="translate(1400,860)"><g{A(86.6,"up")}>{humain}</g></g>
<g{A(88.7,"zoom",.7)}><text x="1400" y="430" text-anchor="middle" style="font-family:Bebas;font-size:110px" fill="var(--co2)">HÉTÉROTROPHES</text></g>
<text x="1400" y="480" text-anchor="middle" class="lab-s"{A(89.6,"up")}>nous devons manger d'autres êtres vivants</text>
<g{A(92.7,"pop")}><rect x="1160" y="900" width="200" height="60" rx="30" fill="#7a2f2f"/><text x="1260" y="940" text-anchor="middle" class="lab">viande</text></g>
<g{A(93.3,"pop")}><rect x="1440" y="900" width="200" height="60" rx="30" fill="var(--vert-f)"/><text x="1540" y="940" text-anchor="middle" class="lab">plantes</text></g>
'''))

# 94 – 123 : l'équation de la photosynthèse
eq = f'''
<div class="abs" style="left:0;right:0;top:470px;display:flex;justify-content:center;align-items:center;gap:34px;font:700 92px/1 'Onest'">
  <span id="r-co2" style="color:var(--co2)"{A(100.0,"pop")}>6 CO<sub>2</sub></span>
  <span{A(101.9,"fade",.3)}>+</span>
  <span id="r-h2o" style="color:var(--eau)"{A(102.1,"pop")}>6 H<sub>2</sub>O</span>
  <svg width="300" height="60" style="overflow:visible"><path d="M10 30 L 280 30" stroke="#f1ede6" stroke-width="6" marker-end="url(#fl)"{A(103.2,"draw",.8)}/></svg>
  <span{A(108.6,"pop")}>C<sub>6</sub>H<sub>12</sub>O<sub>6</sub></span>
  <span{A(110.7,"fade",.3)}>+</span>
  <span style="color:var(--o2)"{A(111.0,"pop")}>6 O<sub>2</sub></span>
</div>
<div class="abs c" style="left:836px;width:340px;top:370px;font:700 40px 'Onest';color:var(--soleil)"{A(104.7,"up")}>☀ Lumière</div>
<div class="abs c" style="left:806px;width:400px;top:590px;font:600 34px/1.2 'Onest';color:#d7c4ff"{A(105.5,"up")}>sels minéraux<br><span style="font-size:28px;opacity:.85"{A(107.0,"fade")}>(N, P, K)</span></div>
<div class="abs c" style="left:1180px;width:330px;top:590px" class="lab-s"><span class="pm"{A(108.8,"up")}>glucose</span></div>
<div class="abs c" style="left:1530px;width:220px;top:590px"><span class="pm"{A(111.6,"up")}>dioxygène</span></div>
'''
reac = [(116.0,'dioxyde de carbone','var(--co2)'),(117.3,'lumière','var(--soleil)'),(118.1,'eau','var(--eau)'),(118.6,'sels minéraux','#d7c4ff')]
reac_h = ''.join(f'<div class="pastille" style="background:none;border:2px solid {c};color:{c};margin-right:18px"{A(t,"pop")}>{n}</div>' for t,n,c in reac)
scene(94, 123, titre(94.3,'La photosynthèse, dans les chloroplastes','L’équation bilan') + eq +
      f'''<div class="abs" style="left:150px;top:790px"><div class="pm" style="margin-bottom:22px"{A(113.2,"up")}>La plante a donc besoin de… <b style="color:#fff"{A(120.8,"fade")}>ses réactifs</b></div>{reac_h}</div>''',
      cam='94 0 0 1; 99 0 0 1; 112 0 0 1.03; 114 0 -40 1')

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

# 180.6 – 200.4 : appareil végétatif, deux systèmes
scene(180.6, 200.4, svg(f'''
<rect x="0" y="0" width="1920" height="640" fill="url(#gciel)" opacity=".55"{A(180.8,"fade")}/><rect x="0" y="640" width="1920" height="440" fill="url(#gsol)"{A(180.8,"fade")}/>
{plante(820, 640, 1, 180.9, tr={'racines':181.6})}
<text x="160" y="300" class="lab" style="font-size:44px" fill="#9cc7ee"{A(183.6,"up")}>air</text>
<text x="160" y="760" class="lab" style="font-size:44px" fill="#d2a679"{A(184.1,"up")}>sol</text>
<path d="M1120 220 L 1150 220 L 1150 620 L 1120 620" stroke="var(--vert)" stroke-width="5"{A(191.2,"draw",.8)}/>
<text x="1180" y="410" class="lab" fill="var(--vert)" style="font-size:38px"{A(191.4,"up")}>système caulinaire</text>
<text x="1180" y="455" class="lab-s"{A(191.8,"up")}>tiges, feuilles, fleurs</text>
<path d="M1120 660 L 1150 660 L 1150 960 L 1120 960" stroke="#e8d3b0" stroke-width="5"{A(190.0,"draw",.8)}/>
<text x="1180" y="815" class="lab" fill="#e8d3b0" style="font-size:38px"{A(190.2,"up")}>système racinaire</text>
<path d="M1560 220 L 1590 220 L 1590 960 L 1560 960" stroke="rgba(241,237,230,.6)" stroke-width="4"{A(185.2,"draw",.8)}/>
<text x="1620" y="580" class="lab" style="font-size:34px"{A(185.4,"up")}>appareil</text><text x="1620" y="622" class="lab" style="font-size:34px"{A(185.6,"up")}>végétatif</text>
<text x="1620" y="664" class="lab-s"{A(187.0,"up")}>(hors reproduction)</text>
<g{A(196.8,"pop")}><circle cx="822" cy="900" r="56" fill="none" stroke="var(--rouge)" stroke-width="5"/></g>
'''), cam='180.6 0 0 1; 192.5 0 0 1; 196.5 '+foc(822,880,1.8)+'; 200.4 '+foc(822,880,1.85))

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

# 200.4 – 221 : racine pivotante, latérales, poils absorbants
scene(200.4, 221, titre(200.6,'a · Le système racinaire','Racines et poils absorbants') + svg(f'''
<rect x="0" y="300" width="1920" height="780" fill="url(#gsol)" opacity=".75"/>
{racine(700, 300, 1.55, 201.3, 207.2, 211.7)}
<path d="M760 420 L 1080 420" stroke="#e8d3b0" stroke-width="3"{A(203.7,"draw",.6)}/>
<text x="1100" y="430" class="lab" style="font-size:36px"{A(203.8,"up")}>racine pivotante <tspan class="lab-s"{A(204.9,"fade")}>(= principale)</tspan></text>
<path d="M1000 610 L 1100 560" stroke="#e8d3b0" stroke-width="3"{A(208.6,"draw",.5)}/>
<text x="1110" y="560" class="lab" style="font-size:36px"{A(208.8,"up")}>racines latérales <tspan class="lab-s">(secondaires)</tspan></text>
<path d="M730 900 L 1100 760" stroke="var(--rouge)" stroke-width="3"{A(211.8,"draw",.6)}/>
<text x="1110" y="760" class="lab" style="font-size:40px" fill="#ff8a8a"{A(211.9,"up")}>poils absorbants</text>
<text x="1110" y="802" class="lab-s"{A(212.6,"up")}>c'est par eux que la plante puise l'eau et les sels minéraux</text>
''') + f'''<div class="carte" style="left:1110px;top:860px;width:660px;padding:20px 30px"{A(214.7,"up")}>
<div class="pm">Surface d'échange : <b style="color:#fff">plusieurs <span class="mark"{A(218.7,"hl",.8)}>centaines de m²</span></b></div></div>''',
      cam='200.4 0 0 1; 209 0 0 1; 212.5 '+foc(1000,700,1.12)+'; 215.5 0 0 1')

# 221 – 236.4 : sol normal / sol carencé
scene(221, 236.4, titre(221.2,'Document 2 · effet d’une carence','Plus de poils quand le sol est pauvre') + svg(f'''
<rect x="140" y="330" width="760" height="680" rx="20" fill="url(#gsol)" opacity=".8"{A(221.5,"fade")}/>
<rect x="1020" y="330" width="760" height="680" rx="20" fill="url(#gsol)" opacity=".8"{A(221.5,"fade")}/>
<text x="520" y="390" text-anchor="middle" class="lab"{A(222.0,"up")}>sol non carencé</text>
<text x="1400" y="390" text-anchor="middle" class="lab" fill="#ff8a8a"{A(224.1,"up")}>sol carencé en sels minéraux</text>
{racine(520, 420, 1.0, 221.6, 222.0, 222.6, dens=.7)}
{racine(1400, 420, 1.0, 224.3, 224.6, 226.1, dens=2.6)}
<path d="M1700 820 L 1700 640" stroke="var(--rouge)" stroke-width="6" marker-end="url(#flr)"{A(226.7,"draw",.6)}/>
<text x="1690" y="880" text-anchor="end" class="lab-s"{A(226.9,"up")}>+ de poils absorbants</text>
''') + f'''<div class="abs c" style="left:0;right:0;top:1015px"><span class="pm"{A(230.3,"up")}>⇒ Ce sont les <b style="color:#fff">poils absorbants</b> qui absorbent l'eau et les sels minéraux… <span class="mark"{A(235.0,"hl",.6)}>et non les racines</span></span></div>''')

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
scene(248.4, 277.0, titre(248.6,'Document 3 · Rosène','Où la plantule absorbe-t-elle l’eau ?') + svg(f'''
{tube(420,'A',254.6,'M0 580 L 0 870',((0,720),(0,830)),legende='poils dans l’eau')}
{tube(960,'B',255.3,'M0 580 L 0 670',((0,598),(0,668)),fletrit=266.2,legende='poils dans l’huile')}
{tube(1500,'C',256.1,'M0 580 L 0 760 C 0 800, 40 800, 70 640',((0,700),(0,790)),legende='poils dans l’eau')}
<g{A(260.4,"pop")}><rect x="1690" y="630" width="30" height="30" fill="{HUILE}"/><text x="1735" y="654" class="lab-s">huile</text>
<rect x="1690" y="760" width="30" height="30" fill="{EAU}"/><text x="1735" y="784" class="lab-s">eau</text></g>
<g{A(266.2,"pop")}><text x="960" y="340" text-anchor="middle" style="font-family:Bebas;font-size:64px" fill="#ff8a8a">FLÉTRIT</text></g>
<g{A(266.6,"pop")}><text x="420" y="340" text-anchor="middle" style="font-family:Bebas;font-size:54px" fill="var(--vert)">✓ VIT</text><text x="1500" y="340" text-anchor="middle" style="font-family:Bebas;font-size:54px" fill="var(--vert)">✓ VIT</text></g>
''') + f'''<div class="abs c" style="left:0;right:0;top:1018px"><span class="pm"{A(269.9,"up")}>Cas B : le rhizoderme (zone pilifère) n'est pas au contact de l'eau ⇒ ce tissu superficiel est <span class="mark"{A(274.7,"hl",.7)}>indispensable à l’absorption</span></span></div>''')

# 276.6 – 288.6 : complément au colorant
scene(277.0, 288.6, titre(276.8,'Complément · eau colorée','Seuls les poils absorbants se colorent') + svg(f'''
<g transform="translate(560,620)">
  <circle r="230" fill="#2a2420" stroke="rgba(241,237,230,.5)" stroke-width="4"{A(279.3,"pop")}/>
  <circle r="120" fill="#e8d3b0" opacity=".9"{A(280.5,"fade")}/>
  {''.join(f'<path d="M{120*math.cos(a):.0f} {120*math.sin(a):.0f} L {215*math.cos(a+.1):.0f} {215*math.sin(a+.1):.0f}" stroke="#fff3dc" stroke-width="7" stroke-linecap="round"{A(281.0,"draw",.6)}/>' for a in [i*math.pi/7 for i in range(14)])}
  {''.join(f'<path d="M{120*math.cos(a):.0f} {120*math.sin(a):.0f} L {215*math.cos(a+.1):.0f} {215*math.sin(a+.1):.0f}" stroke="#7a4bd8" stroke-width="7" stroke-linecap="round"{A(282.9,"fade",1.4)}/>' for a in [i*math.pi/7 for i in range(14)])}
  <text y="300" text-anchor="middle" class="lab-s"{A(280.7,"up")}>coupe transversale de racine</text>
</g>
<text x="980" y="560" class="lab" style="font-size:40px"{A(277.6,"up")}>eau + colorant</text>
<path d="M800 560 L 960 560" stroke="#7a4bd8" stroke-width="5" marker-start="url(#fl)"{A(277.6,"draw",.6)}/>
<text x="980" y="640" class="lab" style="font-size:40px" fill="#b48cff"{A(283.0,"up")}>poils absorbants colorés</text>
<text x="980" y="690" class="lab-s"{A(283.4,"up")}>le reste de la racine ne l’est pas</text>
''') + f'''<div class="carte" style="left:980px;top:760px;width:800px;padding:22px 30px"{A(284.3,"up")}><span class="pm">⇒ Ce sont bien <b style="color:#fff">ces structures</b> qui absorbent l'eau et les sels minéraux.</span></div>''')

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

# 288.6 – 307 : les mycorhizes
scene(288.6, 307, titre(288.8,'Autre acteur de l’absorption','Les mycorhizes') + svg(f'''
<rect x="0" y="640" width="1920" height="440" fill="url(#gsol)" opacity=".85"{A(289,"fade")}/>
<g transform="translate(560,640) scale(.72)"><g{A(291.0,"up",.8)}>{arbre}</g></g>
{racine(560, 640, .9, 291.4, 291.8, 297.6, dens=.6)}
<text x="1180" y="300" class="lab" fill="#ff8a8a"{A(298.4,"up")}>Chez les grandes plantes, les poils</text><text x="1180" y="338" class="lab" fill="#ff8a8a"{A(298.6,"up")}>absorbants ne suffisent pas</text>
{mycelium(560, 900, 304.4, n=18, r=520, graine=3, d=2)}
<g{A(303.4,"right")}><text x="1180" y="420" class="h3" style="font-family:Bebas;font-size:84px" fill="#fff">SYMBIOSE</text>
<text x="1180" y="470" class="lab">plante  +  champignon</text></g>
<g{A(305.2,"pop")}><rect x="1180" y="510" width="420" height="80" rx="40" fill="#8b6d3c"/><text x="1390" y="563" text-anchor="middle" class="lab" style="font-size:38px">= mycorhizes</text></g>
'''), cam='288.6 0 0 1; 307 -20 0 1.03')

# 307 – 331 : le document 4, les échanges
cell = []
import random as _r; _R=_r.Random(7)
for i in range(7):
    for j in range(5):
        cx, cy = 980+i*92+(j%2)*46, 330+j*92
        cell.append(f'<rect x="{cx}" y="{cy}" width="82" height="82" rx="18" fill="#f2ead9" stroke="#62c98d" stroke-width="7"/>')
scene(307, 331, titre(307.2,'Document 4 · la mycorhize en coupe','Un échange à bénéfices réciproques') + svg(f'''
<g{A(308,"fade",1)}>
  <rect x="940" y="290" width="720" height="520" rx="30" fill="#2d6e4b" opacity=".45"/>
  {''.join(cell)}
</g>
<text x="1690" y="330" class="lab" fill="var(--vert)"{A(308.6,"up")}>manteau</text>
<text x="1690" y="520" class="lab" fill="var(--vert)"{A(309.0,"up")}>réseau de Hartig</text>
<text x="1690" y="560" class="lab-s"{A(309.0,"up")}>(entre les cellules)</text>
{mycelium(940, 560, 315.2, n=8, r=470, graine=5, d=1.4, ang=(math.pi*.8, math.pi*1.2), ep=1.5)}
<text x="330" y="880" text-anchor="middle" class="lab" fill="#f3e7cf"{A(315.7,"up")}>filaments mycéliens</text>
<path d="M420 470 C 600 420, 760 430, 960 470" stroke="var(--eau)" stroke-width="10" marker-end="url(#flb)"{A(316.7,"draw",1.2)}/>
<text x="430" y="420" class="lab" fill="var(--eau)"{A(316.9,"up")}>eau + sels minéraux (N, P, K)</text>
<text x="1000" y="880" class="lab-s"{A(319.4,"up")}>→ acheminés jusqu’au <tspan font-weight="800">xylème</tspan> de la plante</text>
<path d="M960 640 C 760 690, 600 690, 420 640" stroke="var(--sucre)" stroke-width="10" marker-end="url(#flr)"{A(325.8,"draw",1.2)}/>
<text x="430" y="740" class="lab" fill="var(--sucre)"{A(326.2,"up")}>matière organique (sucres)</text>
<text x="430" y="780" class="lab-s"{A(327.6,"up")}>issue de la photosynthèse</text><text x="430" y="818" class="lab-s"{A(329.0,"up")}>→ permet au champignon de croître</text>
<g{A(321.9,"pop")}><rect x="120" y="960" width="760" height="70" rx="35" fill="rgba(255,255,255,.08)"/><text x="500" y="1006" text-anchor="middle" class="lab">symbiose = échange à bénéfices réciproques</text></g>
'''))

# 331 – 340.8 : surface d'absorption → croissance (graphique du document 4)
def courbe(pts, sx, sy, ox, oy):
    return ' '.join(f'{"M" if i==0 else "L"}{ox+x*sx:.0f} {oy-y*sy:.0f}' for i,(x,y) in enumerate(pts))
ox, oy, sx, sy = 260, 900, 22, 38
avec = [(5,1.5),(20,6),(35,10.5),(55,13.8)]; sans = [(5,1.5),(20,5),(35,6.5),(55,8.5)]
graduations = ''.join(f'<text x="{ox-16}" y="{oy-v*sy+8}" text-anchor="end" class="lab-s">{v}</text><line x1="{ox}" x2="{ox+1250}" y1="{oy-v*sy}" y2="{oy-v*sy}" stroke="rgba(255,255,255,.07)"/>' for v in range(0,15,2)) + \
              ''.join(f'<text x="{ox+v*sx}" y="{oy+36}" text-anchor="middle" class="lab-s">{v}</text>' for v in range(0,56,10))
scene(331, 340.8, titre(331.2,'Des filaments très fins, très étendus','Plus de surface, plus de croissance') + svg(f'''
<g{A(331.4,"fade")}>{graduations}
<path d="M{ox} {oy} L {ox+1270} {oy}" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"/><path d="M{ox} {oy} L {ox} {oy-590}" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"/>
<text x="{ox}" y="{oy-610}" class="lab-s">taille (cm)</text><text x="{ox+1270}" y="{oy+70}" text-anchor="end" class="lab-s">temps (jours)</text></g>
<path d="{courbe(sans,sx,sy,ox,oy)}" stroke="var(--co2)" stroke-width="6"{A(332.3,"draw",2.2)}/>
<path d="{courbe(avec,sx,sy,ox,oy)}" stroke="var(--eau)" stroke-width="6"{A(333.1,"draw",2.4)}/>
<text x="{ox+56*sx}" y="{oy-13.8*sy+10}" class="lab" fill="var(--eau)"{A(335.4,"up")}>avec mycorhizes</text>
<text x="{ox+56*sx}" y="{oy-8.5*sy+10}" class="lab" fill="var(--co2)"{A(334.5,"up")}>sans mycorhizes</text>
''') + f'''<div class="carte" style="left:1010px;top:700px;width:660px;padding:20px 28px"{A(336.6,"up")}><span class="pm">Grande surface d'échange : <b style="color:#fff">finesse</b> + <b style="color:#fff">grande surface d’exploitation du sol</b></span></div>''')

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

# 458.2 – 470.4 : le système caulinaire
scene(458.2, 470.4, titre(458.4,'b · Le système caulinaire','Le rôle des feuilles : capter la lumière') + svg(f'''
{plante(960, 1000, 1.25, 458.8, racines=False, sol=False)}
<circle cx="1440" cy="380" r="140" fill="url(#gsoleil)"{A(462.5,"pop")}/>
<g{A(467.3,"right")}><path d="M980 800 L 1180 800" stroke="#62c98d" stroke-width="3"/><text x="1195" y="810" class="lab">tiges</text></g>
<g{A(467.9,"right")}><path d="M1170 660 L 1290 660" stroke="#62c98d" stroke-width="3"/><text x="1305" y="670" class="lab">ramifications, feuilles</text></g>
<g{A(469.7,"left")}><path d="M920 500 L 720 500" stroke="#ffd166" stroke-width="3"/><text x="705" y="510" text-anchor="end" class="lab">fleurs</text></g>
'''))

# 470.4 – 489.8 : de la feuille au thylakoïde
def chloroplaste(cx, cy, rx, ry, t):
    grana = ''.join(f'<g>{"".join(f"<rect x=\'{gx-26}\' y=\'{gy-24+k*10}\' width=\'52\' height=\'7\' rx=\'3\' fill=\'#1f6b43\'/>" for k in range(5))}</g>'
                    for gx, gy in [(cx-rx*.55,cy-10),(cx-rx*.18,cy+ry*.35),(cx+rx*.2,cy-ry*.3),(cx+rx*.55,cy+12),(cx-rx*.15,cy-ry*.45)])
    return f'<g{A(t,"pop",.8)}><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#9ad08a" stroke="#2f7d55" stroke-width="6"/>{grana}' \
           f'<path d="M{cx-rx*.8} {cy} C {cx-rx*.3} {cy-30}, {cx+rx*.3} {cy+30}, {cx+rx*.8} {cy}" stroke="#2f7d55" stroke-width="3" fill="none"/></g>'
pig = ''.join(f'<circle cx="{1430+i*34}" cy="{y}" r="7" fill="#0f5a2e"/>' for i in range(9) for y in (548, 612, 676))
scene(470.4, 489.8, titre(470.6,'Où se fait la capture de la lumière ?','De la feuille aux thylakoïdes') + svg(f'''
<g transform="translate(330,600)"><g{A(471.3,"pop",.8)}><path d="M-200 0 C -120 -150, 120 -150, 220 0 C 120 150, -120 150, -200 0 Z" fill="#3fa36b" stroke="#2a7a4e" stroke-width="5"/>
<path d="M-200 0 L 220 0" stroke="#2a7a4e" stroke-width="4"/></g></g>
<text x="330" y="820" text-anchor="middle" class="lab"{A(471.6,"up")}>feuille</text>
<rect x="430" y="570" width="30" height="30" fill="none" stroke="#fff" stroke-width="3"{A(476.4,"pop")}/>
<path d="M460 570 L 640 380 M460 600 L 640 820" stroke="rgba(255,255,255,.35)" stroke-width="2"{A(476.6,"draw",.5)}/>
{chloroplaste(940, 600, 290, 175, 476.7)}
<text x="940" y="860" text-anchor="middle" class="lab"{A(477.2,"up")}>chloroplaste</text>
<rect x="1036" y="520" width="70" height="60" fill="none" stroke="#fff" stroke-width="3"{A(479.6,"pop")}/>
<path d="M1106 520 L 1380 470 M1106 580 L 1380 750" stroke="rgba(255,255,255,.35)" stroke-width="2"{A(479.8,"draw",.5)}/>
<g{A(480.3,"fade")}>
<path d="M1390 520 C 1600 520, 1720 520, 1720 560 C 1720 590, 1560 580, 1400 580 C 1560 580, 1720 584, 1720 620 C 1720 650, 1560 644, 1400 644 C 1560 644, 1720 648, 1720 690 C 1720 720, 1600 710, 1390 710" stroke="#7fd39a" stroke-width="10" fill="none"/>
</g>
<g{A(478.4,"fade",.8)}>{pig}</g>
<text x="1560" y="790" text-anchor="middle" class="lab"{A(480.5,"up")}>membrane des thylakoïdes</text>
<text x="1560" y="828" text-anchor="middle" class="lab-s"{A(478.6,"up")}>● pigments chlorophylliens</text>
''') + f'''<div class="carte" style="left:1100px;top:880px;width:720px;padding:18px 28px"{A(481.6,"up")}><span class="pm">Surface d’échange ≈ <b class="k" style="font-size:52px;color:#fff"><span{A(483.1,"count",1)} data-to="1000">0</span> m²</b><br>grâce aux nombreux <span class="mark v"{A(485.0,"hl",.6)}>replis des thylakoïdes</span></span></div>''',
      cam='470.4 0 0 1; 489.8 0 0 1.03')

# 489.8 – 513 : le spectre d'absorption (document 6)
def gauss(l, m, s): return math.exp(-((l-m)/s)**2/2)
def spectre(f, ox=300, oy=880, w=1100, h=470):
    pts = [(l, f(l)) for l in range(400, 701, 4)]
    return ' '.join(f'{"M" if i==0 else "L"}{ox+(l-400)/300*w:.0f} {oy-v*h:.0f}' for i,(l,v) in enumerate(pts))
chla = lambda l: .95*gauss(l,430,14)+.18*gauss(l,410,20)+.75*gauss(l,662,11)+.1*gauss(l,615,15)
chlb = lambda l: 1.0*gauss(l,455,13)+.6*gauss(l,642,10)+.08*gauss(l,595,15)
caro = lambda l: .7*gauss(l,450,13)+.85*gauss(l,478,13)+.4*gauss(l,425,12)
tot  = lambda l: min(1, .95*max(chla(l),chlb(l),caro(l))+.12*(chla(l)+chlb(l)+caro(l)))
arc = ''.join(f'<stop offset="{i/6}" stop-color="{c}"/>' for i,c in enumerate(['#6a2bd1','#2e5bff','#16b8c9','#3ec44c','#f2e13a','#f08a22','#d8261e']))
scene(489.8, 513, titre(490.0,'Document 6 · toutes les couleurs ne sont pas absorbées','Le spectre d’absorption') + svg(f'''
<defs><linearGradient id="arc">{arc}</linearGradient></defs>
<g{A(490.4,"fade")}>
<rect x="300" y="890" width="1100" height="26" fill="url(#arc)"/>
{''.join(f'<text x="{300+(l-400)/300*1100}" y="955" text-anchor="middle" class="lab-s">{l}</text>' for l in (400,500,600,700))}
<text x="1400" y="995" text-anchor="end" class="lab-s">longueur d’onde (nm)</text>
<path d="M300 880 L 300 380" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"/><text x="310" y="360" class="lab-s">absorption</text>
</g>
<rect x="{300+(495-400)/300*1100:.0f}" y="380" width="{(580-495)/300*1100:.0f}" height="500" fill="#3ec44c" opacity=".16"{A(507.4,"fade",.8)}/>
<path d="{spectre(chla)}" stroke="#2ec4a0" stroke-width="5"{A(496.6,"draw",1.4)}/>
<path d="{spectre(chlb)}" stroke="#b6e35a" stroke-width="5"{A(497.6,"draw",1.4)}/>
<path d="{spectre(caro)}" stroke="#f0a43a" stroke-width="5"{A(501.6,"draw",1.4)}/>
<path d="{spectre(tot)}" stroke="#c88cff" stroke-width="7" stroke-dasharray="1 0"{A(504.4,"draw",1.8)}/>
<g{A(496.6,"left")}><rect x="1480" y="400" width="34" height="8" fill="#2ec4a0"/><text x="1530" y="412" class="lab-s">chlorophylle a</text></g>
<g{A(497.6,"left")}><rect x="1480" y="450" width="34" height="8" fill="#b6e35a"/><text x="1530" y="462" class="lab-s">chlorophylle b</text></g>
<g{A(501.6,"left")}><rect x="1480" y="500" width="34" height="8" fill="#f0a43a"/><text x="1530" y="512" class="lab-s">caroténoïdes</text></g>
<g{A(504.4,"left")}><rect x="1480" y="550" width="34" height="8" fill="#c88cff"/><text x="1530" y="562" class="lab-s">spectre final</text></g>
<text x="380" y="340" class="lab" fill="#7fa2ff"{A(500.4,"up")}>bleu</text><text x="1290" y="340" class="lab" fill="#ff7a6a"{A(499.8,"up")}>rouge</text>
<text x="{300+(537-400)/300*1100:.0f}" y="420" text-anchor="middle" class="lab" fill="#6be07a"{A(507.6,"up")}>vert : non absorbé</text>
''') + f'''<div class="carte" style="left:1460px;top:640px;width:400px;padding:22px 26px"{A(508.9,"pop")}><div class="h3" style="color:#6be07a;font-size:46px">⇒ les feuilles nous apparaissent vertes</div></div>''')

# 513 – 536 : Mesurim
contour = [(-260,0),(-200,-90),(-90,-150),(40,-160),(170,-110),(260,0),(170,110),(40,160),(-90,150),(-200,90)]
pts_c = ''.join(f'<circle cx="{x}" cy="{y}" r="9" fill="#ff3d6e"{A(525.0+i*.18,"pop",.3)}/>' for i,(x,y) in enumerate(contour))
poly = ' '.join(f'{x},{y}' for x,y in contour)
scene(513, 536, f'<div class="xp" style="left:150px;top:140px"{A(513.4,"pop")}>Point expérience</div>' +
      f'<div class="abs h2" style="left:150px;top:210px"{A(514.4,"up")}>Mesurer une surface de feuille</div>' + svg(f'''
<g transform="translate(700,640)">
 <rect x="-380" y="-260" width="760" height="520" rx="16" fill="#2a2a2e" stroke="rgba(255,255,255,.2)" stroke-width="3"{A(522.6,"fade")}/>
 <g{A(519.0,"pop",.8)}><path d="M-260 0 C -200 -110, -90 -160, 40 -160 C 170 -150, 240 -60, 260 0 C 240 60, 170 150, 40 160 C -90 160, -200 110, -260 0 Z" fill="#3fa36b" stroke="#2a7a4e" stroke-width="5"/>
 <path d="M-260 0 L 260 0" stroke="#2a7a4e" stroke-width="4"/></g>
 <polygon points="{poly}" fill="#e8ff2a" opacity=".85"{A(529.9,"fade",.8)}/>
 <polyline points="{poly} {contour[0][0]},{contour[0][1]}" stroke="#ff3d6e" stroke-width="3" fill="none"{A(525.6,"draw",2.2)}/>
 {pts_c}
 <text x="-360" y="-220" class="lab-s"{A(522.8,"fade")}>photo</text>
</g>''') + f'''
<div class="abs" style="left:1180px;top:390px;width:620px">
 <div class="pm"{A(520.2,"left")}>① logiciel <b style="color:#fff">Mesurim</b></div>
 <div class="pm" style="margin-top:22px"{A(522.6,"left")}>② photo de la feuille</div>
 <div class="pm" style="margin-top:22px"{A(525.4,"left")}>③ pointage du contour</div>
 <div class="pm" style="margin-top:22px"{A(529.8,"left")}>④ la surface apparaît <span style="background:#e8ff2a;color:#111;padding:0 8px">en fluo</span></div>
 <div class="carte" style="position:relative;margin-top:34px;padding:18px 26px"{A(532.6,"up")}><span class="pm">→ une estimation en <b style="color:#fff">cm²</b> ou en <b style="color:#fff">m²</b></span></div>
</div>''')

# 536 – 565.2 : extraction et spectroscope
spec_bar = f'''<rect x="980" y="560" width="760" height="70" fill="url(#arc2)"/>'''
scene(536, 565.2, f'<div class="xp" style="left:150px;top:140px"{A(536.4,"pop")}>Point expérience</div>' +
      f'<div class="abs h2" style="left:150px;top:210px"{A(537.0,"up")}>Les pigments absorbent une partie de la lumière</div>' + svg(f'''
<defs><linearGradient id="arc2">{arc}</linearGradient>
<linearGradient id="masque" x1="0" x2="1">
 <stop offset="0" stop-color="#000" stop-opacity=".92"/><stop offset=".28" stop-color="#000" stop-opacity=".92"/>
 <stop offset=".34" stop-color="#000" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity="0"/>
 <stop offset=".74" stop-color="#000" stop-opacity="0"/><stop offset=".86" stop-color="#000" stop-opacity=".92"/><stop offset="1" stop-color="#000" stop-opacity=".92"/></linearGradient></defs>
<g{A(545.3,"up")}><path d="M330 420 L 330 760 C 330 800, 410 800, 410 760 L 410 420" stroke="#f1ede6" stroke-width="5" fill="none"/>
<path d="M334 520 L 334 760 C 334 794, 406 794, 406 760 L 406 520 Z" fill="#1f8a3c" opacity=".9"/></g>
<text x="370" y="850" text-anchor="middle" class="lab"{A(546.4,"up")}>extrait brut</text>
<text x="370" y="888" text-anchor="middle" class="lab-s"{A(546.6,"up")}>de chlorophylle</text>
<path d="M150 600 L 320 600" stroke="#fffbe8" stroke-width="16" opacity=".9"{A(552.3,"draw",.6)}/>
<text x="150" y="570" class="lab-s"{A(552.3,"fade")}>lumière blanche</text>
<path d="M420 600 L 600 600" stroke="#9ff0a8" stroke-width="16" opacity=".8"{A(552.9,"draw",.6)}/>
<g{A(553.2,"pop")}><rect x="600" y="550" width="260" height="100" rx="12" fill="#3a3a40" stroke="#888" stroke-width="3"/><text x="730" y="610" text-anchor="middle" class="lab-s">spectroscope</text></g>
<path d="M860 600 L 970 595" stroke="#fff" stroke-width="3" opacity=".4"{A(553.8,"draw",.4)}/>
<g{A(553.9,"wipe",1)}>{spec_bar}</g>
<rect x="980" y="560" width="760" height="70" fill="url(#masque)"{A(554.9,"fade",1)}/>
<text x="1040" y="690" class="lab" fill="#7fa2ff"{A(555.3,"up")}>bleu absorbé</text>
<text x="1690" y="690" text-anchor="end" class="lab" fill="#ff7a6a"{A(555.1,"up")}>rouge absorbé</text>
<text x="1330" y="530" text-anchor="middle" class="lab" fill="#6be07a"{A(556.6,"up")}>vert : non absorbé</text>
''') + f'''<div class="abs c" style="left:980px;width:760px;top:780px"><div class="h3" style="color:#6be07a"{A(560.6,"up")}>⇒ les feuilles apparaissent vertes</div></div>''')

# 565.2 – 590 : les stomates
def cellule_garde(s, ouvert_t, ferme=False):
    # deux cellules en haricot autour de l'ostiole
    return f'<path d="M0 -150 C {s*130} -150, {s*130} 150, 0 150 C {s*40} 110, {s*40} -110, 0 -150 Z" fill="#7fcf8d" stroke="#2a7a4e" stroke-width="5"/>'
chloros = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="11" ry="7" fill="#2f7d55"/>' for x,y in [(-70,-80),(-80,0),(-70,80),(70,-80),(80,0),(70,80),(-95,-40),(95,40)])
co2s = ''.join(f'<g{A(584.6+i*.35,"up",.8)}><g transform="translate({x},{y})"><circle r="9" fill="#333"/><circle cx="-15" r="7" fill="var(--co2)"/><circle cx="15" r="7" fill="var(--co2)"/></g></g>' for i,(x,y) in enumerate([(-10,-40),(8,30),(-4,100)]))
scene(565.2, 590.2, titre(565.4,'Sur la face inférieure des feuilles','Les stomates') + svg(f'''
<g transform="translate(600,600)">
 <g{A(573.8,"pop",.8)}>
  <g transform="translate(-22,0) scale(-1,1)">{cellule_garde(1,0)}</g>
  <g transform="translate(22,0)">{cellule_garde(1,0)}</g>
  {chloros}
 </g>
 <ellipse cx="0" cy="0" rx="16" ry="110" fill="#1a1410"{A(580.6,"fade",.8)}/>
 {co2s}
</g>
<path d="M880 480 L 760 520" stroke="#f1ede6" stroke-width="3"{A(576.7,"draw",.4)}/>
<text x="900" y="480" class="lab"{A(576.7,"up")}>2 cellules stomatiques</text>
<path d="M880 620 L 640 610" stroke="#f1ede6" stroke-width="3"{A(583.0,"draw",.4)}/>
<text x="900" y="630" class="lab" fill="var(--soleil)"{A(583.0,"up")}>ostiole</text>
<text x="900" y="670" class="lab-s"{A(583.6,"up")}>l’ouverture par où entre le CO₂</text>
''') + f'''<div class="carte" style="left:1180px;top:780px;width:600px;padding:20px 28px"{A(586.9,"up")}><span class="pm">CO<sub>2</sub> → diffuse jusqu’aux chloroplastes : <b style="color:#fff">nécessaire à la photosynthèse</b></span></div>''')

# 590.2 – 608.8 : document 7, l'ouverture au fil de la journée
gx0, gy0, gw, gh = 220, 900, 1100, 520
hx = lambda h: gx0 + (h-6)/15*gw
def crb(f): return ' '.join(f'{"M" if i==0 else "L"}{hx(h):.0f} {gy0-f(h)*gh:.0f}' for i,h in enumerate([6+k*.25 for k in range(61)]))
lum = lambda h: max(0, math.sin((h-6.5)/13.5*math.pi))*.95
stom = lambda h: max(0, min(1, .9*lum(h)*(1-.55*gauss(h,13.2,1.4)) + .02))
scene(590.2, 608.8, titre(590.4,'Document 7 · ouverture des stomates','Pas n’importe quand') + svg(f'''
<g{A(590.6,"fade")}><path d="M{gx0} {gy0} L {gx0+gw+20} {gy0}" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"/>
<path d="M{gx0} {gy0} L {gx0} {gy0-gh-40}" stroke="#f1ede6" stroke-width="3" marker-end="url(#fl)"/>
{''.join(f'<text x="{hx(h):.0f}" y="{gy0+40}" text-anchor="middle" class="lab-s">{h}h</text>' for h in (6,9,12,15,18,21))}
<text x="{gx0+10}" y="{gy0-gh-50}" class="lab-s">ouverture des stomates</text></g>
<rect x="{hx(12):.0f}" y="{gy0-gh}" width="{hx(14)-hx(12):.0f}" height="{gh}" fill="var(--rouge)" opacity=".18"{A(598.1,"fade",.6)}/>
<text x="{hx(13):.0f}" y="{gy0-gh-10}" text-anchor="middle" class="lab" fill="#ff8a8a"{A(598.3,"up")}>12h – 14h</text>
<path d="{crb(lum)}" stroke="var(--soleil)" stroke-width="5" stroke-dasharray="14 10" fill="none"{A(599.6,"fade",1)}/>
<text x="{hx(15.5):.0f}" y="{gy0-gh*1.02:.0f}" class="lab-s" fill="var(--soleil)"{A(600.0,"up")}>intensité lumineuse</text>
<path d="{crb(stom)}" stroke="var(--eau)" stroke-width="7"{A(592.7,"draw",5.2)}/>
<text x="{hx(8):.0f}" y="{gy0-stom(9.5)*gh-30:.0f}" class="lab" fill="var(--eau)"{A(596.0,"up")}>le matin</text>
<text x="{hx(17.4):.0f}" y="{gy0-stom(16.5)*gh-30:.0f}" class="lab" fill="var(--eau)"{A(597.0,"up")}>en fin de journée</text>
''') + f'''<div class="carte" style="left:1420px;top:380px;width:420px;padding:22px 26px"{A(602.4,"pop")}><div class="pm" style="color:var(--eau)">💧 à midi, les stomates se ferment : <b style="color:#fff">éviter de perdre l’eau</b>, <span{A(604.2,"fade")}>essentielle à la photosynthèse</span></div></div>''')

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
def stomate_mini(ouvert):
    o = 12 if ouvert else 1.5
    return (f'<path d="M-{o} -60 C -70 -60, -70 60, -{o} 60 C -{o+18} 30, -{o+18} -30, -{o} -60 Z" fill="#a8d8a0" stroke="#2a7a4e" stroke-width="3"/>'
            f'<path d="M{o} -60 C 70 -60, 70 60, {o} 60 C {o+18} 30, {o+18} -30, {o} -60 Z" fill="#a8d8a0" stroke="#2a7a4e" stroke-width="3"/>'
            + (f'<ellipse rx="{o}" ry="44" fill="#1a1410"/>' if ouvert else ''))
champ = lambda ouvert: ''.join(f'<g transform="translate({x},{y}) scale(.9)">{stomate_mini(ouvert)}</g>' for x,y in [(-90,-70),(80,-40),(-30,90),(110,110),(-140,60)])
scene(620.8, 656.5, titre(621.0,'Document 8 · mettre les stomates en évidence','Riche ou pauvre en CO₂ ?') + svg(f'''
<defs><clipPath id="oc1"><circle cx="0" cy="0" r="230"/></clipPath></defs>
<g transform="translate(560,640)">
 <circle r="236" fill="#d9e6c8"{A(629.0,"pop")}/>
 <g clip-path="url(#oc1)"{A(640.6,"fade",.8)}>{champ(True)}</g>
 <circle r="236" fill="none" stroke="#f1ede6" stroke-width="10"{A(629.0,"pop")}/>
</g>
<g transform="translate(1360,640)">
 <circle r="236" fill="#d9e6c8"{A(632.5,"pop")}/>
 <g clip-path="url(#oc1)"{A(638.0,"fade",.8)}>{champ(False)}</g>
 <circle r="236" fill="none" stroke="#f1ede6" stroke-width="10"{A(632.5,"pop")}/>
</g>
<text x="560" y="350" text-anchor="middle" class="lab" fill="var(--co2)"{A(629.3,"up")}>milieu enrichi en CO₂</text>
<text x="1360" y="350" text-anchor="middle" class="lab" fill="#9cc7ee"{A(632.8,"up")}>milieu appauvri en CO₂</text>
<text x="560" y="930" text-anchor="middle" style="font-family:Bebas;font-size:64px" fill="var(--vert)"{A(641.4,"pop")}>STOMATES OUVERTS</text>
<text x="1360" y="930" text-anchor="middle" style="font-family:Bebas;font-size:64px" fill="#ff8a8a"{A(638.3,"pop")}>STOMATES FERMÉS</text>
''') + f'''<div class="carte" style="left:360px;top:985px;width:1200px;padding:14px 26px;text-align:center"{A(643.4,"up")}><span class="pm">Technique : <b style="color:#fff">empreinte au vernis</b> de la face inférieure <span{A(651.0,"fade")}>→ observation au microscope</span></span></div>''')

# 656.5 – 677.8 : bilan côté air
cartes = [(660.8,'Feuilles fines et allongées','#62c98d'),(665.0,'Nombreux replis des thylakoïdes','#7fd39a'),(670.4,'De nombreux stomates','#5ab8ff')]
scene(656.5, 677.8, titre(657.0,'Bilan · côté air','Une surface d’échange optimisée') + ''.join(
  f'<div class="carte" style="left:{150+i*560}px;top:360px;width:500px;height:220px"{A(t,"pop")}><div style="width:60px;height:6px;background:{c};border-radius:3px"></div><div class="h3" style="margin-top:26px;color:{c}">{n}</div></div>' for i,(t,n,c) in enumerate(cartes)) + f'''
<div class="abs c" style="left:0;right:0;top:700px"><div class="p"{A(671.7,"up")}>⇒ on optimise</div>
<div class="h2" style="margin-top:16px"><span style="color:var(--co2)"{A(673.4,"up")}>l’absorption du CO₂</span> <span{A(675.9,"fade")}>et</span> <span style="color:var(--soleil)"{A(676.1,"up")}>la captation de la lumière</span></div></div>''')

# 677.8 – 696 : le bilan général (à la manière du document 9)
scene(677.8, 696, svg(f'''
<rect x="0" y="0" width="1920" height="640" fill="url(#gciel)" opacity=".6"/>
<rect x="0" y="640" width="1920" height="440" fill="url(#gsol)" opacity=".85"/>
{plante(960, 640, .85, 677.9, poils=678.6, sol=False, tr={'racines':678.2})}
{mycelium(962, 880, 679.4, n=12, r=320, graine=21, d=1)}
<circle cx="1650" cy="170" r="150" fill="url(#gsoleil)"{A(689.6,"pop")}/>
<path d="M1540 250 L 1180 360" stroke="var(--soleil)" stroke-width="8" marker-end="url(#flj)"{A(689.7,"draw",.8)}/>
<text x="1400" y="250" class="lab" fill="var(--soleil)"{A(689.8,"up")}>lumière</text>
<path d="M350 300 L 760 380" stroke="var(--co2)" stroke-width="8" marker-end="url(#flo)"{A(690.4,"draw",.8)}/>
<text x="250" y="280" class="lab" fill="var(--co2)"{A(690.4,"up")}>CO₂ (stomates)</text>
<path d="M420 940 L 840 900" stroke="var(--eau)" stroke-width="8" marker-end="url(#flb)"{A(687.6,"draw",.8)}/>
<text x="140" y="960" class="lab" fill="var(--eau)"{A(687.6,"up")}>eau</text>
<path d="M1500 960 L 1090 910" stroke="#d7c4ff" stroke-width="8" marker-end="url(#fl)"{A(688.2,"draw",.8)}/>
<text x="1520" y="975" class="lab" fill="#d7c4ff"{A(688.2,"up")}>sels minéraux</text>
<text x="1240" y="560" class="lab-s"{A(680.9,"up")}>appareil caulinaire : surfaces fines</text>
<text x="1240" y="720" class="lab-s"{A(681.6,"up")}>appareil racinaire : surfaces fines</text>
''') + f'''<div class="abs c" style="left:0;right:0;top:120px"><div class="sur"{A(678.0,"fade")}>L’essentiel</div>
<div class="k" style="font-size:110px;margin-top:12px"{A(692.2,"zoom",.8)}>→ <span style="color:var(--vert)">PHOTOSYNTHÈSE</span></div></div>''')

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
