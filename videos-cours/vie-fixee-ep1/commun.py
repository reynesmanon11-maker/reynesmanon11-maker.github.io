# Briques communes aux épisodes : temps d'apparition, scènes, caméra, titres.
import math
S = []

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

DEFS = '''<svg width="0" height="0" style="position:absolute"><defs>
<linearGradient id="gsol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3d2b"/><stop offset="1" stop-color="#2a1c13"/></linearGradient>
<linearGradient id="gciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16263a"/><stop offset="1" stop-color="#1d2f3f"/></linearGradient>
<radialGradient id="gsoleil"><stop offset="0" stop-color="#fff2b3"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
<marker id="fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#f1ede6"/></marker><marker id="flr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e5333b"/></marker><marker id="flb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5ab8ff"/></marker><marker id="flv" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#62c98d"/></marker><marker id="flo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e88a5a"/></marker><marker id="flj" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffd166"/></marker>
<filter id="flou"><feGaussianBlur stdDeviation="18"/></filter>
</defs></svg>'''
