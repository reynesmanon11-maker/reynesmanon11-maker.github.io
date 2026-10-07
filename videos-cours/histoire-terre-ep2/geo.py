# Dessins de géologie réutilisables (coupes schématiques en SVG).
import math
from commun import A

CROUTE = '#d9b48a'; ANTE = '#6e4a3a'; SYN = '#f2d48a'; POST = '#9fcf86'; MER = '#2e6f9e'
MANTEAU = '#7a8f4e'; ASTHENO = '#c4703a'; OCEANIQUE = '#3d4d63'

def _rot(px, py, ox, oy, a):
    c, s = math.cos(a), math.sin(a)
    return ox + (px-ox)*c - (py-oy)*s, oy + (px-ox)*s + (py-oy)*c

def rift(t_failles, t_bascule, t_mer, t_syn, t_post, n=5, x0=260, x1=1660, y_top=470, y_bot=800,
         angle=-9, d=2.5, etiquettes=None):
    """Coupe d'une croûte continentale qui s'étire : failles normales, blocs qui basculent,
    éventails syn-rift puis couverture post-rift.  Retourne le SVG (coordonnées de l'écran)."""
    w = (x1 - x0) / (n + 1)
    pente = 120                              # décalage horizontal d'une faille entre le haut et le bas
    g = [f'<polygon points="{x0-200},{y_top+40} {x1-pente+40},{y_top+120} {x1-pente+40},{y_bot+300} {x0-200},{y_bot+300}" fill="#b9946c"/>']
    # bloc fixe (continent, à gauche)
    g.append(f'<polygon points="{x0-200},{y_top} {x0+w},{y_top} {x0+w-pente},{y_bot} {x0-200},{y_bot}" fill="{CROUTE}"/>')
    g.append(f'<rect x="{x0-200}" y="{y_top}" width="{w+200}" height="16" fill="{ANTE}"/>')
    blocs, coins = [], []
    a = math.radians(angle)
    for i in range(n):
        xa, xb = x0 + w*(i+1), x0 + w*(i+2)
        poly = [(xa, y_top), (xb, y_top), (xb-pente, y_bot), (xa-pente, y_bot)]
        # chaque bloc pivote autour de son coin inférieur droit et s'enfonce un peu plus que le précédent
        ox, oy = xb - pente, y_bot
        dy = 40 + 35*i
        fin = [(_rot(px, py, ox, oy, a)[0], _rot(px, py, ox, oy, a)[1] + dy) for px, py in poly]
        coins.append(fin)
        pts = ' '.join(f'{x:.0f},{y:.0f}' for x, y in poly)
        ante = f'<polygon points="{xa},{y_top} {xb},{y_top} {xb-2.4},{y_top+16} {xa-2.4},{y_top+16}" fill="{ANTE}"/>'
        g.append(f'<g style="transform-box:view-box;transform-origin:0 0"{A(t_bascule, "move", d)} data-dy="{dy}">'
                 f'<g style="transform-box:view-box;transform-origin:{ox:.0f}px {oy:.0f}px"{A(t_bascule, "rot", d)} data-to="{angle}">'
                 f'<polygon points="{pts}" fill="{CROUTE}" stroke="#b08a63" stroke-width="2"/>{ante}'
                 f'<path d="M{xa} {y_top-2} C {xa-25} {y_top+110}, {xa-pente+10} {y_bot-90}, {xa-pente} {y_bot}" stroke="#2b1d14" stroke-width="5" fill="none"{A(t_failles+i*.25, "draw", 1)}/></g></g>')
        blocs.append((xa, xb))
    # eau (apparaît quand le fossé s'est creusé)
    g.insert(1, f'<rect x="{x0+w-10}" y="{y_top-10}" width="{x1-x0}" height="{y_bot-y_top}" fill="{MER}" opacity=".55"{A(t_mer, "fade", 1.5)}/>')
    # éventails syn-rift : dans chaque demi-graben, entre le sommet basculé du bloc et le bord du bloc précédent
    for i in range(n):
        tl, tr = coins[i][0], coins[i][1]          # sommet basculé du bloc i
        # le bord gauche haut du bloc i est plus bas que son bord droit : on comble jusqu'à l'horizontale du bord droit
        haut = tr[1]
        poly = f'{tl[0]:.0f},{tl[1]:.0f} {tr[0]:.0f},{tr[1]:.0f} {tl[0]:.0f},{haut:.0f}'
        lignes = ''.join(f'<line x1="{tl[0]:.0f}" y1="{tl[1]-(tl[1]-haut)*k/4:.0f}" x2="{tl[0]+(tr[0]-tl[0])*(1-k/4):.0f}" y2="{tl[1]-(tl[1]-tr[1])*(1-k/4)-(tl[1]-haut)*k/4*0:.0f}" stroke="#c9a54a" stroke-width="1.5"/>' for k in range(1,4))
        g.append(f'<g{A(t_syn+i*.2, "wipedown", 1.4)}><polygon points="{poly}" fill="{SYN}"/></g>')
    # couverture post-rift : comble les demi-grabens jusqu'à une surface presque plane
    if t_post is not None:
        bas = ' '.join(f'{c[1][0]:.0f},{c[1][1]:.0f} {c[0][0]:.0f},{c[0][1]:.0f}' for c in reversed(coins))
        g.append(f'<polygon points="{x0+w:.0f},{y_top+16} {x1+80},{y_top+70} {x1+80},{coins[-1][1][1]:.0f} {bas}" fill="{POST}" opacity=".92"{A(t_post, "wipe", 2)}/>')
    return ''.join(g), coins

# ---------- carte schématique de la France ----------
CONTOUR_FR = [(2.4,51.05),(3.2,50.8),(4.2,50.1),(4.9,49.8),(5.8,49.5),(6.4,49.45),(7.0,49.15),(8.2,49.0),(7.6,47.6),
  (6.9,47.4),(6.0,46.2),(7.0,45.9),(6.6,45.1),(7.0,44.2),(7.5,43.8),(6.2,43.1),(4.8,43.4),(3.2,43.0),(3.1,42.4),
  (1.7,42.5),(-0.7,42.8),(-1.8,43.4),(-1.2,44.6),(-1.2,46.2),(-2.2,47.2),(-4.5,47.8),(-4.8,48.4),(-3.0,48.8),
  (-1.6,48.6),(-1.9,49.7),(-1.2,49.4),(0.2,49.5),(1.4,50.1),(1.6,50.9)]
MASSIFS = {
 'armoricain': [(-4.6,47.9),(-4.7,48.4),(-3.0,48.75),(-1.6,48.55),(-1.9,49.6),(-1.0,49.2),(-0.3,48.4),(-0.2,47.5),(-0.8,46.6),(-1.3,46.3),(-2.2,47.2)],
 'central':    [(1.4,46.3),(2.6,46.6),(3.8,46.4),(4.4,45.6),(4.3,44.6),(3.6,43.9),(2.4,43.8),(1.7,44.6),(1.2,45.5)],
 'vosges':     [(6.6,48.6),(7.3,48.6),(7.3,47.8),(6.7,47.75),(6.5,48.1)],
 'alpes':      [(6.0,46.25),(7.0,45.95),(6.6,45.1),(7.0,44.2),(7.5,43.8),(6.6,43.7),(5.6,44.4),(5.5,45.3)],
 'pyrenees':   [(-1.8,43.35),(-0.7,42.8),(1.7,42.5),(3.1,42.4),(3.0,42.9),(1.0,43.05),(-0.5,43.2)],
}
def fr_xy(lon, lat, cx, cy, k):
    # projection simple centrée sur la France (cos 46°)
    return cx + (lon-2.5)*k*0.695, cy - (lat-46.6)*k

def carte_france(cx, cy, k, t, massifs_t=None, couleurs=None, noms=True):
    pts = ' '.join(f'{fr_xy(a,b,cx,cy,k)[0]:.0f},{fr_xy(a,b,cx,cy,k)[1]:.0f}' for a,b in CONTOUR_FR)
    g = [f'<polygon points="{pts}" fill="#2a2a2f" stroke="#8d8a86" stroke-width="3"{A(t,"fade",1)}/>']
    couleurs = couleurs or {}
    for nom,(tm) in (massifs_t or {}).items():
        p = ' '.join(f'{fr_xy(a,b,cx,cy,k)[0]:.0f},{fr_xy(a,b,cx,cy,k)[1]:.0f}' for a,b in MASSIFS[nom])
        g.append(f'<polygon points="{p}" fill="{couleurs.get(nom,"#e5333b")}" fill-opacity=".85"{A(tm,"pop",.7)}/>')
    return ''.join(g)

# ---------- étapes de la formation d'une chaîne (coupes, y croissant vers le bas) ----------
CC = '#d9b48a'; CO = '#3d4d63'; ML = '#5f7d45'; AS = '#b5652f'; SED = '#e6cf8f'; OPH = '#2f9b8f'
def _p(pts): return ' '.join(f'{x:.0f},{y:.0f}' for x,y in pts)

def etape_ocean(x0=160, x1=1760, y=520):
    """un océan bordé de deux marges continentales, dorsale au milieu"""
    m = (x0+x1)/2
    return (f'<polygon points="{_p([(x0,y+150),(m-260,y+150),(m,y+30),(m+260,y+150),(x1,y+150),(x1,y+410),(x0,y+410)])}" fill="{AS}"/>'
      f'<polygon points="{_p([(x0,y),(x0+380,y),(x0+520,y+80),(m-30,y+50),(m,y+30),(m+30,y+50),(x1-520,y+80),(x1-380,y),(x1,y),(x1,y+140),(x1-520,y+160),(m+30,y+60),(m-30,y+60),(x0+520,y+160),(x0,y+140)])}" fill="{ML}"/>'
      f'<polygon points="{_p([(x0,y-20),(x0+380,y-20),(x0+520,y+70),(x0+520,y+80),(x0+380,y+40),(x0,y+40)])}" fill="{CC}"/>'
      f'<polygon points="{_p([(x1,y-20),(x1-380,y-20),(x1-520,y+70),(x1-520,y+80),(x1-380,y+40),(x1,y+40)])}" fill="{CC}"/>'
      f'<polygon points="{_p([(x0+520,y+70),(m-30,y+40),(m,y+22),(m+30,y+40),(x1-520,y+70),(x1-520,y+82),(m+30,y+52),(m-30,y+52),(x0+520,y+82)])}" fill="{CO}"/>'
      f'<polygon points="{_p([(x0+380,y-30),(x1-380,y-30),(x1-380,y-20),(x1-520,y+70),(m+30,y+40),(m,y+22),(m-30,y+40),(x0+520,y+70),(x0+380,y-20)])}" fill="#2e6f9e" opacity=".75"/>')

def etape_subduction(x0=160, x1=1760, y=520):
    """la lithosphère océanique plonge sous le continent de droite"""
    return (f'<rect x="{x0}" y="{y+110}" width="{x1-x0}" height="300" fill="{AS}"/>'
      f'<polygon points="{_p([(x0,y),(x0+380,y),(x0+520,y+80),(1250,y+70),(1500,y+260),(1560,y+410),(1460,y+410),(1400,y+290),(1230,y+150),(x0+520,y+170),(x0,y+140)])}" fill="{ML}"/>'
      f'<polygon points="{_p([(x0+520,y+70),(1250,y+60),(1500,y+250),(1560,y+400),(1545,y+405),(1485,y+262),(1240,y+78),(x0+520,y+84)])}" fill="{CO}"/>'
      f'<polygon points="{_p([(x0,y-20),(x0+380,y-20),(x0+520,y+70),(x0+520,y+82),(x0+380,y+40),(x0,y+40)])}" fill="{CC}"/>'
      f'<polygon points="{_p([(x1,y-40),(1300,y-40),(1240,y+50),(1300,y+120),(x1,y+120)])}" fill="{CC}"/>'
      f'<polygon points="{_p([(x1,y+120),(1300,y+120),(1480,y+260),(x1,y+300)])}" fill="{ML}"/>'
      f'<polygon points="{_p([(x0+380,y-30),(1290,y-30),(1250,y+60),(x0+520,y+70),(x0+380,y-20)])}" fill="#2e6f9e" opacity=".75"/>')

def etape_collision(x0=160, x1=1760, y=520):
    """les deux continents se rencontrent : nappes, ophiolites coincées, racine crustale"""
    m = 980
    return (f'<rect x="{x0}" y="{y+110}" width="{x1-x0}" height="300" fill="{AS}"/>'
      f'<polygon points="{_p([(x0,y+40),(x1,y+40),(x1,y+300),(1250,y+300),(1100,y+410),(1000,y+410),(1080,y+260),(x0,y+180)])}" fill="{ML}"/>'
      f'<polygon points="{_p([(x0,y-10),(700,y-30),(820,y-120),(m-60,y-250),(m,y-300),(m+80,y-260),(1180,y-140),(1350,y-50),(x1,y-30),(x1,y+120),(1300,y+150),(1150,y+300),(1060,y+330),(980,y+300),(850,y+180),(x0,y+60)])}" fill="{CC}"/>'
      + ''.join(f'<path d="M{700+i*90} {y-30-i*10} C {800+i*90} {y-90-i*30}, {880+i*90} {y-60-i*20}, {950+i*80} {y+60}" stroke="#8a6a4a" stroke-width="5" fill="none"/>' for i in range(4))
      + f'<polygon points="{_p([(m-10,y-200),(m+50,y-230),(m+90,y-150),(m+30,y-130)])}" fill="{OPH}"/>')

# ---------- colonne d'ophiolite ----------
def ophiolite(x, y, ts, w=300):
    """ts = temps d'apparition [péridotites, gabbros, basaltes, radiolarites] ; empilement de bas en haut"""
    couches = [('péridotites serpentinisées','#3f6b4f',190,'motif'),('gabbros','#4f5a66',150,''),('basaltes en coussins','#2f3a48',120,'coussins'),('radiolarites','#b2433a',50,'')]
    g=[]; yy=y
    for (nom,c,h,mot),t in zip(couches,ts):
        yy -= h
        extra=''
        if mot=='coussins':
            extra=''.join(f'<ellipse cx="{x+30+k*55+(j%2)*27}" cy="{yy+22+j*36}" rx="26" ry="15" fill="none" stroke="#6d7c8f" stroke-width="3"/>' for j in range(3) for k in range(5))
        if mot=='motif':
            extra=''.join(f'<path d="M{x+10+k*48} {yy+20+j*44} q 12 -10 24 0" stroke="#7fb08a" stroke-width="3" fill="none"/>' for j in range(4) for k in range(6))
        g.append(f'<g{A(t,"wipedown",.8)}><rect x="{x}" y="{yy}" width="{w}" height="{h}" fill="{c}" stroke="#111" stroke-width="2"/>{extra}</g>')
        g.append(f'<text x="{x+w+30}" y="{yy+h/2+9}" class="lab"{A(t+.2,"left")}>{nom}</text>')
    return ''.join(g)

# ---------- diagramme pression-température (profondeur vers le bas) ----------
def diagramme_pt(x, y, w, h, t, chemin_t=None, zones_t=None):
    """axes T (0-1000 °C) en haut, profondeur (0-70 km) vers le bas ; zones schiste vert, schiste bleu, éclogite"""
    X = lambda T: x + T/1000*w
    Y = lambda km: y + km/70*h
    g=[f'<g{A(t,"fade")}><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#1c1c20" stroke="#8d8a86" stroke-width="2"/>'
       + ''.join(f'<text x="{X(T)}" y="{y-14}" text-anchor="middle" class="lab-s">{T}</text>' for T in (0,200,400,600,800,1000))
       + ''.join(f'<text x="{x-14}" y="{Y(k)+7}" text-anchor="end" class="lab-s">{k}</text>' for k in (0,15,30,45,60))
       + f'<text x="{x+w}" y="{y-46}" text-anchor="end" class="lab-s">température (°C)</text><text x="{x-14}" y="{y+h+40}" text-anchor="end" class="lab-s">profondeur (km)</text></g>']
    zones = [('schistes verts','#4e9a5a',[(200,0),(450,0),(500,20),(300,28),(200,15)]),
             ('schistes bleus','#3f6fb0',[(200,15),(300,28),(380,45),(300,55),(150,40)]),
             ('éclogites','#a8453c',[(300,55),(380,45),(500,20),(700,40),(800,70),(350,70)]),
             ('amphibolites','#8a6a3a',[(450,0),(750,0),(700,40),(500,20)])]
    for i,(nom,c,pts) in enumerate(zones):
        tz = (zones_t or {}).get(nom, t+.3+i*.2)
        p=' '.join(f'{X(a):.0f},{Y(b):.0f}' for a,b in pts)
        cx=sum(X(a) for a,_ in pts)/len(pts); cy=sum(Y(b) for _,b in pts)/len(pts)
        g.append(f'<g{A(tz,"fade",.6)}><polygon points="{p}" fill="{c}" fill-opacity=".55" stroke="{c}" stroke-width="2"/>'
                 f'<text x="{cx:.0f}" y="{cy:.0f}" text-anchor="middle" class="lab-s" style="font-weight:700">{nom}</text></g>')
    if chemin_t is not None:
        # chemin d'un gabbro : formé chaud près de la dorsale, refroidi (schiste vert) puis enfoui (bleu, éclogite)
        d = f'M{X(1000)-10:.0f} {Y(5):.0f} C {X(700):.0f} {Y(4):.0f}, {X(380):.0f} {Y(6):.0f}, {X(300):.0f} {Y(12):.0f} C {X(270):.0f} {Y(28):.0f}, {X(300):.0f} {Y(42):.0f}, {X(450):.0f} {Y(62):.0f}'
        g.append(f'<path d="{d}" stroke="#ffd166" stroke-width="7" stroke-dasharray="1 0" marker-end="url(#flj)"{A(chemin_t,"draw",4)}/>')
    return ''.join(g), X, Y

# ---------- diagramme de Hjulström (axes log) ----------
def hjulstrom(x, y, w, h, t, t_zones):
    """taille des particules 0,001-1000 mm (abscisse log), vitesse 0,1-1000 cm/s (ordonnée log)
    t_zones = (érosion, transport, dépôt)"""
    X = lambda mm: x + (math.log10(mm)+3)/6*w
    Y = lambda v: y + h - (math.log10(v)+1)/4*h
    ero = [(.001,1000)]+[(d, v) for d,v in [(.001,200),(.01,60),(.05,30),(.2,25),(1,40),(10,110),(100,350),(1000,1000)]]
    sed = [(.001,.1),(.001,.1)]+[(d,v) for d,v in [(.01,.12),(.1,.6),(1,7),(10,70),(100,300),(1000,1000)]]
    def path(pts): return ' '.join(f'{X(a):.0f},{Y(b):.0f}' for a,b in pts)
    g=[f'<g{A(t,"fade")}><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#1c1c20" stroke="#8d8a86" stroke-width="2"/>'
       + ''.join(f'<text x="{X(m)}" y="{y+h+34}" text-anchor="middle" class="lab-s">{lab}</text>' for m,lab in [(.001,'0,001'),(.01,'0,01'),(.1,'0,1'),(1,'1'),(10,'10'),(100,'100'),(1000,'1000')])
       + ''.join(f'<text x="{x-14}" y="{Y(v)+7}" text-anchor="end" class="lab-s">{lab}</text>' for v,lab in [(.1,'0,1'),(1,'1'),(10,'10'),(100,'100'),(1000,'1000')])
       + f'<text x="{x+w}" y="{y+h+74}" text-anchor="end" class="lab-s">taille des particules (mm)</text><text x="{x}" y="{y-16}" class="lab-s">vitesse du courant (cm/s)</text></g>']
    curve_e = [(d,v) for d,v in ero[1:]]
    g.append(f'<polygon points="{path([(.001,1000)]+curve_e)}" fill="#e88a5a" fill-opacity=".55"{A(t_zones[0],"fade",.8)}/>')
    g.append(f'<polygon points="{path(curve_e[::-1]+[(.001,200)])} {path([(.001,.1)]+[p for p in sed[2:]])}" fill="#5ab8ff" fill-opacity=".45"{A(t_zones[1],"fade",.8)}/>')
    g.append(f'<polygon points="{path([(.001,.1)]+sed[2:]+[(1000,.1)])}" fill="#ffd166" fill-opacity=".5"{A(t_zones[2],"fade",.8)}/>')
    g.append(f'<text x="{X(.05)}" y="{Y(300)}" class="h3" style="font-family:Bebas;font-size:58px" fill="#ffb08a"{A(t_zones[0],"up")}>ÉROSION</text>')
    g.append(f'<text x="{X(.003)}" y="{Y(5)}" class="h3" style="font-family:Bebas;font-size:58px" fill="#a8dcff"{A(t_zones[1],"up")}>TRANSPORT</text>')
    g.append(f'<text x="{X(2)}" y="{Y(.6)}" class="h3" style="font-family:Bebas;font-size:58px" fill="#ffe08a"{A(t_zones[2],"up")}>DÉPÔT</text>')
    return ''.join(g)

# ---------- vieillissement de la lithosphère océanique ----------
def litho_age(t, t_epais, t_iso, x0=200, x1=1500, y=430, prof=330):
    """dorsale à gauche ; la base de la lithosphère (isotherme 1300 °C) s'approfondit en racine carrée de l'âge"""
    n=40
    xs=[x0+(x1-x0)*i/n for i in range(n+1)]
    base=[y+28+prof*math.sqrt(i/n) for i in range(n+1)]
    fond=[y-30+60*math.sqrt(i/n) for i in range(n+1)]     # subsidence thermique : le plancher s'enfonce
    croute=[f+28 for f in fond]
    P=lambda pts: ' '.join(f'{a:.0f},{b:.0f}' for a,b in pts)
    g=[f'<rect x="{x0-60}" y="{y-40}" width="{x1-x0+160}" height="{prof+180}" fill="{AS}"{A(t,"fade")}/>',
       f'<polygon points="{P(list(zip(xs,fond))+[(x1+100,fond[-1]),(x1+100,y-160),(x0-60,y-160),(x0-60,fond[0])])}" fill="#2e6f9e" fill-opacity=".7"{A(t,"fade")}/>',
       f'<polygon points="{P(list(zip(xs,croute))+list(zip(xs,base))[::-1])}" fill="{ML}"{A(t_epais,"wipe",2.5)}/>',
       f'<polygon points="{P(list(zip(xs,fond))+list(zip(xs,croute))[::-1])}" fill="{CO}"{A(t,"wipe",1.5)}/>',
       f'<path d="M{P(list(zip(xs,base)))}" stroke="#ffd166" stroke-width="5" stroke-dasharray="14 10" fill="none"{A(t_iso,"fade",.8)}/>',
       f'<text x="{x1-10}" y="{base[-1]+44}" text-anchor="end" class="lab" fill="#ffd166"{A(t_iso,"up")}>isotherme 1300 °C</text>']
    return ''.join(g), xs, base, fond

# ---------- une chaîne qui s'efface : relief, racine, remontée isostatique ----------
def chaine(x, y, w, relief, racine, couleur=CC):
    """croûte d'épaisseur normale avec un relief (vers le haut) et une racine (vers le bas) proportionnels"""
    m=x+w/2; n=30
    haut=[(x+w*i/n, y-relief*math.exp(-((i/n-.5)/.16)**2)) for i in range(n+1)]
    bas=[(x+w*i/n, y+240+racine*math.exp(-((i/n-.5)/.18)**2)) for i in range(n+1)][::-1]
    return f'<polygon points="{" ".join(f"{a:.0f},{b:.0f}" for a,b in haut+bas)}" fill="{couleur}"/>'

def chaine_vieillit(t0, t1, x=260, y=520, w=1400):
    """morphose en trois temps : jeune (relief + racine), intermédiaire, âgée (aplanie)"""
    etats=[(330,300),(170,150),(30,25)]
    g=[f'<rect x="{x}" y="{y+200}" width="{w}" height="420" fill="{AS}"/>']
    dt=(t1-t0)/2
    for i,(r,ra) in enumerate(etats):
        ti = t0+dt*i
        # chaque état apparaît en 1,2 s ; le précédent ne s'efface qu'une fois le suivant installé
        o = None if i==2 else ti+dt+1.2
        g.append(f'<g{A(ti,"fade",1.2 if i else .6,o=o)}>{chaine(x,y,w,r,ra)}</g>')
    return ''.join(g)

# ---------- cycle de Wilson : six étapes en cercle ----------
WILSON = ['Rift continental','Dorsale (accrétion)','Subduction','Collision','Chaîne de montagnes','Érosion · pénéplanation']
def cycle_wilson(cx, cy, r, ts, etapes=WILSON):
    g=[]
    n=len(etapes)
    for i,(nom,t) in enumerate(zip(etapes,ts)):
        a=-math.pi/2+2*math.pi*i/n; a2=-math.pi/2+2*math.pi*(i+1)/n
        px,py=cx+r*math.cos(a),cy+r*math.sin(a)
        g.append(f'<g{A(t,"pop",.6)}><circle cx="{px:.0f}" cy="{py:.0f}" r="84" fill="#26262b" stroke="#e5333b" stroke-width="4"/>'
                 f'<text x="{px:.0f}" y="{py+12:.0f}" text-anchor="middle" style="font-family:Bebas;font-size:40px" fill="#fff">{i+1}</text></g>')
        lx,ly=cx+(r+110)*math.cos(a),cy+(r+110)*math.sin(a)
        anc='start' if math.cos(a)>.2 else ('end' if math.cos(a)<-.2 else 'middle')
        g.append(f'<text x="{lx:.0f}" y="{ly+8:.0f}" text-anchor="{anc}" class="lab"{A(t+.2,"up")}>{nom}</text>')
        # flèche courbe vers l'étape suivante
        am,ae=a+.32,a2-.32
        d=f'M{cx+r*math.cos(am):.0f} {cy+r*math.sin(am):.0f} A {r} {r} 0 0 1 {cx+r*math.cos(ae):.0f} {cy+r*math.sin(ae):.0f}'
        g.append(f'<path d="{d}" stroke="#8d8a86" stroke-width="5" fill="none" marker-end="url(#fl)"{A(t+.4,"draw",.6)}/>')
    return ''.join(g)
