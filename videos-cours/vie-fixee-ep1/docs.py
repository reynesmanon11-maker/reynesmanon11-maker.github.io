# Documents réels du cours : image recadrée dans une carte, zooms lents et annotations calées sur la voix.
# Toutes les positions s'écrivent en pourcentage de la PAGE du PDF (lues sur la page quadrillée),
# la fonction les convertit dans le repère de l'image recadrée.
import json, pathlib
from PIL import Image
from commun import A

class Docs:
    def __init__(self, dossier):
        self.d = pathlib.Path(dossier)
        self.crops = json.load(open(self.d/'crops.json'))

    def __call__(self, nom, t, box=(120, 250, 1680, 790), kb=(), notes=(), hl=(), chemins=(), voiles=(),
                 legende=None, fx='fade', d=.8, o=None, fond='#fff'):
        p, x0, y0, x1, y1 = self.crops[nom]
        iw, ih = Image.open(self.d/'docs'/f'{nom}.jpg').size
        bx, by, bw, bh = box
        s = min(bw/iw, bh/ih); W, H = iw*s, ih*s
        X, Y = bx + (bw-W)/2, by + (bh-H)/2
        P = lambda px, py: ((px-x0)/(x1-x0)*W, (py-y0)/(y1-y0)*H)
        F = lambda px, py: ((px-x0)/(x1-x0), (py-y0)/(y1-y0))
        cam = '; '.join(f'{tk} {F(px,py)[0]:.4f} {F(px,py)[1]:.4f} {k}' for tk, px, py, k in kb) if kb else f'{t} .5 .5 1'
        g = [f'<div class="docbox" style="left:{X:.0f}px;top:{Y:.0f}px;width:{W:.0f}px;height:{H:.0f}px;background:{fond}"{A(t, fx, d, o=o)}>',
             f'<div class="kb" data-kb="{cam}" data-w="{W:.0f}" data-h="{H:.0f}" style="width:{W:.0f}px;height:{H:.0f}px">',
             f'<img src="docs/{nom}.jpg" width="{W:.0f}" height="{H:.0f}">']
        for v in voiles:          # assombrit tout sauf une zone : (t, px0, py0, px1, py1[, fin])
            tv, a0, b0, a1, b1 = v[:5]; ov = v[5] if len(v) > 5 else None
            (u0, v0), (u1, v1) = P(a0, b0), P(a1, b1)
            for (l, tp, w, h) in [(0, 0, W, v0), (0, v1, W, H-v1), (0, v0, u0, v1-v0), (u1, v0, W-u1, v1-v0)]:
                if w > 0 and h > 0:
                    g.append(f'<div class="voile" style="left:{l:.0f}px;top:{tp:.0f}px;width:{w:.0f}px;height:{h:.0f}px"{A(tv, "fade", .6, o=ov)}></div>')
        for h_ in hl:             # (t, px0, py0, px1, py1[, couleur[, fin]])
            th, a0, b0, a1, b1 = h_[:5]; c = h_[5] if len(h_) > 5 else ''; oh = h_[6] if len(h_) > 6 else None
            (u0, v0), (u1, v1) = P(a0, b0), P(a1, b1)
            g.append(f'<div class="hl {c}" style="left:{u0:.0f}px;top:{v0:.0f}px;width:{u1-u0:.0f}px;height:{v1-v0:.0f}px"{A(th, "pop", .5, o=oh)}></div>')
        if chemins:
            sv = [f'<svg style="position:absolute;left:0;top:0;overflow:visible" width="{W:.0f}" height="{H:.0f}">']
            for c in chemins:     # (t, [(px,py),…][, couleur[, durée]])
                tc, pts = c[0], c[1]; col = c[2] if len(c) > 2 else '#1a1a1a'; dc = c[3] if len(c) > 3 else 1.6
                dd = 'M' + ' L '.join(f'{P(a,b)[0]:.0f} {P(a,b)[1]:.0f}' for a, b in pts)
                sv.append(f'<path d="{dd}" stroke="{col}" stroke-width="5" stroke-dasharray="14 10" fill="none" stroke-linecap="round"{A(tc, "wipe", dc)}/>')
            g.append(''.join(sv) + '</svg>')
        for n in notes:           # (t, px, py, texte[, style[, dx, dy[, fin]]])
            tn, a, b, txt = n[:4]; st = n[4] if len(n) > 4 else ''; dx = n[5] if len(n) > 5 else 16; dy = n[6] if len(n) > 6 else -64
            on = n[7] if len(n) > 7 else None
            u, v = P(a, b)
            g.append(f'<div class="pin" style="left:{u:.0f}px;top:{v:.0f}px"><div class="cs"{A(tn, "pop", .5, o=on)}>'
                     + ('' if st == 'nopt' else '<div class="pt"></div>')
                     + f'<div class="pill {st}" style="left:{dx}px;top:{dy}px">{txt}</div></div></div>')
        g.append('</div>')
        if legende:
            g.append(f'<div class="doclab" style="right:12px;top:12px">{legende}</div>')
        g.append('</div>')
        return ''.join(g)
