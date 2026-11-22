# L'architecture du cabinet : sol, murs, lambris à panneaux, moulures, fenêtres, porte de la serre,
# cheminée de marbre, plafond à corniche. Mêmes dimensions que la pièce dessinée par le code
# (js/procedural/decor.js) : x de −6 (cheminée) à 6 (serre), z de −4,5 (bibliothèques) à 4,5
# (fenêtres), plafond à 4,2 m. Les curiosités gardent donc leur place.
import math
from geo import pave, tour, balayer, extruder, arc, PI

H = 4.2                      # hauteur sous plafond
X0, X1, Z0, Z1 = -6.0, 6.0, -4.5, 4.5
EP = 0.3                     # épaisseur des murs
FENETRES = [(-5.2, -1.3), (-0.2, 3.7)]         # deux grandes verrières dans le mur sud (x)
F_BAS, F_HAUT = 0.9, 3.6
PORTE = (-1.1, 1.1, 2.7)                        # baie du mur est (z0, z1, hauteur)
CHEMINEE = 1.08                                 # demi-largeur du manteau (z)


def rectangles(s0, s1, y0, y1, trous):
    """Découpe un pan de mur en rectangles autour des baies (repris de decor.js)."""
    xs = [s0, s1]
    for t in trous:
        xs += [max(s0, min(s1, t[0])), max(s0, min(s1, t[1]))]
    xs.sort()
    res = []
    for k in range(len(xs) - 1):
        a, b = xs[k], xs[k + 1]
        if b - a < 1e-6:
            continue
        mid = (a + b) / 2
        ys = [(y0, y1)]
        for t in trous:
            if t[0] < mid < t[1]:
                nv = []
                for (c, d) in ys:
                    if t[3] <= c or t[2] >= d:
                        nv.append((c, d)); continue
                    if t[2] > c: nv.append((c, t[2]))
                    if t[3] < d: nv.append((t[3], d))
                ys = nv
        for (c, d) in ys:
            if d - c > 1e-6:
                res.append((a, c, b, d))
    return res


def pan(nom, axe, plan, epaisseur, s0, s1, y0, y1, trous, mat, groupe, **kw):
    """Un pan (mur, enduit…) perpendiculaire à z (axe 'z', s = x) ou à x (axe 'x', s = z)."""
    for i, (a, c, b, d) in enumerate(rectangles(s0, s1, y0, y1, trous)):
        if axe == 'z':
            pave(f'{nom}{i}', a, c, plan, b, d, plan + epaisseur, mat, chanfrein=0, groupe=groupe, **kw)
        else:
            pave(f'{nom}{i}', plan, c, a, plan + epaisseur, d, b, mat, chanfrein=0, groupe=groupe, **kw)


# --- profils de moulures (avancée, hauteur), en mètres ---
def doucine(a0, h0, a1, h1, n=8):
    """Une doucine (cyma) : courbe en S, tangente aux deux bouts."""
    return [(a0 + (a1 - a0) * (t - math.sin(2 * PI * t) / (2 * PI)), h0 + (h1 - h0) * t) for t in (k / n for k in range(n + 1))]


PLINTHE = [(0, 0), (0.026, 0), (0.026, 0.15)] + arc(0.026, 0.162, 0.012, -90, 90, 6)[1:] + \
          [(0.026 - 0.016 * math.sin(math.radians(t)), 0.2 - 0.026 * math.cos(math.radians(t))) for t in range(15, 91, 15)] + [(0, 0.2)]

CIMAISE = [(0, 0.0)] + [(0.032 - 0.016 * math.cos(math.radians(t)), 0.016 * math.sin(math.radians(t))) for t in range(0, 91, 15)] + \
          [(0.036, 0.016)] + arc(0.036, 0.042, 0.026, -90, 90, 8)[1:] + [(0.03, 0.07)] + doucine(0.03, 0.07, 0.008, 0.092, 6)[1:] + [(0.008, 0.096), (0, 0.096)]

CORNICHE = [(0, 0), (0.015, 0)] + arc(0.015, 0.02, 0.02, -90, 90, 6)[1:] + [(0.03, 0.045)] + doucine(0.03, 0.045, 0.11, 0.12, 8)[1:] + \
           [(0.13, 0.125), (0.14, 0.13), (0.14, 0.195), (0.15, 0.2), (0.15, 0.212)] + \
           [(0.30 - 0.15 * math.cos(math.radians(a)), 0.212 + 0.088 * math.sin(math.radians(a))) for a in range(0, 91, 10)][1:]

CHAMBRANLE = [(0, 0), (0, 0.022), (0.006, 0.027), (0.03, 0.027), (0.034, 0.031), (0.07, 0.031)] + arc(0.085, 0.031, 0.015, 180, 0, 6)[1:] + \
             [(0.104, 0.028), (0.12, 0.012), (0.12, 0)]

BAGUETTE = [(0, 0.013)] + [(0.013 * math.sin(math.radians(a)), 0.013 * math.cos(math.radians(a))) for a in range(15, 91, 15)]


def ligne(points, normale_vers, haut=(0, 1, 0)):
    """Normales de segments pour un chemin horizontal longeant les murs (vers l'intérieur de la pièce)."""
    ns = []
    for i in range(len(points) - 1):
        (x0, _, z0), (x1, _, z1) = points[i], points[i + 1]
        dx, dz = x1 - x0, z1 - z0
        L = math.hypot(dx, dz)
        n = (-dz / L, 0, dx / L)
        # choisir le sens qui pointe vers le centre de la pièce
        mx, mz = (x0 + x1) / 2, (z0 + z1) / 2
        if (n[0] * (0 - mx) + n[2] * (0 - mz)) < 0:
            n = (-n[0], 0, -n[2])
        ns.append(n)
    return ns


def moulure_murale(nom, chaines, y, profil, mat, groupe):
    for i, ch in enumerate(chaines):
        pts = [(x, y, z) for (x, z) in ch]
        import geo
        geo.orienter(balayer(f'{nom}{i}', pts, ligne(pts, None), (0, 1, 0), profil, mat, groupe=groupe), (0, 2.0, 0))


def lambris(nom, axe, plan, sens, s0, s1, mat='lambris', groupe='lambris'):
    """Lambris d'appui à panneaux en relief : fond, montants et traverses, panneaux à plate-bande,
    baguette autour de chaque panneau. sens = +1 si la pièce est du côté des coordonnées croissantes."""
    L = s1 - s0
    n = max(1, round(L / 0.72))
    pas = L / n
    y_bas, y_haut = 0.2, 0.86
    e0 = 0.012                      # épaisseur du fond
    e1 = 0.034                      # nu des montants et traverses

    def boite(nm, sa, ya, sb, yb, ea, eb, m=mat, **kw):
        pa, pb = plan + sens * ea, plan + sens * eb
        if axe == 'z':
            return pave(nm, sa, ya, pa, sb, yb, pb, m, groupe=groupe, **kw)
        return pave(nm, pa, ya, sa, pb, yb, sb, m, groupe=groupe, **kw)
    boite(f'{nom}_fond', s0, 0.0, s1, 0.9, 0, e0, chanfrein=0)
    larg = 0.085
    boite(f'{nom}_trav_b', s0, y_bas, s1, y_bas + 0.09, e0, e1, chanfrein=0.003, fil='x')
    boite(f'{nom}_trav_h', s0, y_haut - 0.075, s1, y_haut, e0, e1, chanfrein=0.003, fil='x')
    for k in range(n + 1):
        sc = s0 + k * pas
        a = max(s0, sc - larg / 2) if 0 < k < n else (s0 if k == 0 else s1 - larg)
        b = a + larg
        boite(f'{nom}_mont{k}', a, y_bas + 0.09, b, y_haut - 0.075, e0, e1, chanfrein=0.003, fil='y')
    for k in range(n):
        sa = s0 + k * pas + (larg / 2 if k > 0 else larg) + 0.004
        sb = s0 + (k + 1) * pas - (larg / 2 if k < n - 1 else larg) - 0.004
        ya, yb = y_bas + 0.09 + 0.004, y_haut - 0.075 - 0.004
        panneau(f'{nom}_pan{k}', axe, plan, sens, sa, sb, ya, yb, e0, mat, groupe)


def panneau(nom, axe, plan, sens, sa, sb, ya, yb, e0, mat, groupe, b=0.055, h1=0.006, h2=0.014, baguette=True, atlas='A'):
    """Panneau à plate-bande (une pyramide tronquée, le champ en relief au centre), entouré d'un quart-de-rond.
    axe 'z' : panneau dans un plan z = cte (s = x) ; axe 'x' : plan x = cte (s = z). e0 : nu du fond."""
    import bmesh
    from geo import V, objet, uv_boite
    b = min(b, (sb - sa) * 0.3, (yb - ya) * 0.3)
    bm = bmesh.new()
    def pt(s, y, e):
        p = plan + sens * e
        return V(s, y, p) if axe == 'z' else V(p, y, s)
    ext = [pt(sa, ya, e0 + 0.002), pt(sb, ya, e0 + 0.002), pt(sb, yb, e0 + 0.002), pt(sa, yb, e0 + 0.002)]
    mil = [pt(sa + b * 0.25, ya + b * 0.25, e0 + h1), pt(sb - b * 0.25, ya + b * 0.25, e0 + h1),
           pt(sb - b * 0.25, yb - b * 0.25, e0 + h1), pt(sa + b * 0.25, yb - b * 0.25, e0 + h1)]
    intr = [pt(sa + b, ya + b, e0 + h2), pt(sb - b, ya + b, e0 + h2), pt(sb - b, yb - b, e0 + h2), pt(sa + b, yb - b, e0 + h2)]
    vs = [[bm.verts.new(p) for p in anneau] for anneau in (ext, mil, intr)]
    for r in range(2):
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new([vs[r][i], vs[r][j], vs[r + 1][j], vs[r + 1][i]])
    bm.faces.new(vs[2])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        nrm = f.normal
        d = (nrm.y * -sens) if axe == 'z' else (nrm.x * sens)   # Blender : z page → −y
        if d < 0:
            f.normal_flip()
    uv_boite(bm, fil='y')
    objet(nom, bm, [mat], groupe=groupe, uv=False, lisse=20, atlas=atlas)
    if baguette:
        cadre = [(sa, ya), (sb, ya), (sb, yb), (sa, yb)]
        pts = [(s, y, plan + sens * e0) if axe == 'z' else (plan + sens * e0, y, s) for (s, y) in cadre]
        normales = [(0, 1, 0), (-1, 0, 0) if axe == 'z' else (0, 0, -1), (0, -1, 0), (1, 0, 0) if axe == 'z' else (0, 0, 1)]
        haut = (0, 0, sens) if axe == 'z' else (sens, 0, 0)
        balayer(nom + '_bag', pts, normales, haut, BAGUETTE, mat, ferme=True, groupe=groupe, atlas=atlas)


def vantail(nom, axe, plan, sens, sa, sb, ya, yb, mat, groupe, ep=0.022, montant=0.06, atlas='A', bouton=True):
    """Porte de placard : cadre (montants, traverses) et panneau à plate-bande. plan = face avant du meuble."""
    def boite(nm, a, c, b, d, e_a, e_b, fil):
        pa, pb = plan + sens * e_a, plan + sens * e_b
        if axe == 'z':
            return pave(nm, a, c, pa, b, d, pb, mat, groupe=groupe, chanfrein=0.003, fil=fil, atlas=atlas)
        return pave(nm, pa, c, a, pb, d, b, mat, groupe=groupe, chanfrein=0.003, fil=fil, atlas=atlas)
    boite(nom + '_mg', sa, ya, sa + montant, yb, 0, ep, 'y')
    boite(nom + '_md', sb - montant, ya, sb, yb, 0, ep, 'y')
    boite(nom + '_th', sa + montant, yb - montant, sb - montant, yb, 0, ep, 'x')
    boite(nom + '_tb', sa + montant, ya, sb - montant, ya + montant * 1.2, 0, ep, 'x')
    boite(nom + '_fd', sa + montant, ya + montant * 1.2, sb - montant, yb - montant, 0, 0.006, 'y')
    panneau(nom + '_pan', axe, plan, sens, sa + montant + 0.003, sb - montant - 0.003, ya + montant * 1.2 + 0.003, yb - montant - 0.003,
            0.006, mat, groupe, b=0.045, h1=0.005, h2=0.011, atlas=atlas)
    if bouton:
        sm = sb - montant / 2 if bouton == 'droite' else sa + montant / 2
        from mathutils import Matrix
        rot = Matrix.Rotation(PI / 2, 3, 'X') if axe == 'z' else Matrix.Rotation(-PI / 2, 3, 'Z')
        if axe == 'z' and sens < 0 or axe == 'x' and sens < 0:
            rot = Matrix.Rotation(-PI / 2, 3, 'X') if axe == 'z' else Matrix.Rotation(PI / 2, 3, 'Z')
        c = (sm, (ya + yb) / 2, plan + sens * ep) if axe == 'z' else (plan + sens * ep, (ya + yb) / 2, sm)
        tour(nom + '_bouton', [(0.006, 0), (0.008, 0.008), (0.005, 0.014), (0.012, 0.022), (0.011, 0.03), (0.0, 0.032)], 'laiton',
             centre=c, n=12, groupe='laiton', axe=rot, atlas=atlas)


def cadres_muraux():
    """Cadres moulurés sur l'enduit, au-dessus de la cimaise : ils rythment les grands pans de mur."""
    prof = [(0, 0)] + doucine(0.0, 0.0, 0.018, 0.016, 5)[1:] + [(0.03, 0.018)] + arc(0.036, 0.012, 0.007, 90, -30, 4)[1:] + [(0.045, 0)]
    def cadre(nom, axe, plan, sens, sa, sb, ya=1.22, yb=3.62):
        if sb - sa < 0.5:
            return
        pts = [(sa, ya), (sb, ya), (sb, yb), (sa, yb)]
        P3 = [(s, y, plan) if axe == 'z' else (plan, y, s) for (s, y) in pts]
        normales = [(0, -1, 0), (1, 0, 0) if axe == 'z' else (0, 0, 1), (0, 1, 0), (-1, 0, 0) if axe == 'z' else (0, 0, -1)]
        haut = (0, 0, sens) if axe == 'z' else (sens, 0, 0)
        balayer(nom, P3, normales, haut, prof, 'peinture', ferme=True, groupe='menuiseries')
    (a, b), (c, d) = FENETRES
    cadre('cadre_s1', 'z', Z1, -1, X0 + 0.3, a - 0.45)
    cadre('cadre_s2', 'z', Z1, -1, b + 0.45, c - 0.45)
    cadre('cadre_s3', 'z', Z1, -1, d + 0.45, X1 - 0.3)
    cadre('cadre_o1', 'x', X0, +1, Z0 + 0.75, -CHEMINEE - 0.3)
    cadre('cadre_o2', 'x', X0, +1, CHEMINEE + 0.3, Z1 - 0.3)
    cadre('cadre_e1', 'x', X1, -1, Z0 + 0.75, PORTE[0] - 0.45)
    cadre('cadre_e2', 'x', X1, -1, PORTE[1] + 0.45, Z1 - 0.3)
    cadre('cadre_n', 'z', Z0, +1, -0.85, 0.15)


def murs():
    trous_sud = [(a, b, F_BAS, F_HAUT) for (a, b) in FENETRES]
    trou_est = [(PORTE[0], PORTE[1], 0.0, PORTE[2])]
    # enduit intérieur (peint), du lambris jusqu'à la corniche
    pan('enduit_n', 'z', Z0 - 0.01, 0.01, X0, X1, 0.0, H, [], 'mur', 'murs')
    pan('enduit_s', 'z', Z1, 0.01, X0, X1, 0.0, H, trous_sud, 'mur', 'murs')
    pan('enduit_o', 'x', X0 - 0.01, 0.01, Z0, Z1, 0.0, H, [(-0.68, 0.68, 0.0, 0.95)], 'mur', 'murs')
    pan('enduit_e', 'x', X1, 0.01, Z0, Z1, 0.0, H, trou_est, 'mur', 'murs')
    # parements extérieurs en brique (vus depuis la serre)
    pan('facade_n', 'z', Z0 - EP, 0.02, X0 - EP, X1 + EP, 0, 4.4, [], 'brique', 'facade', densite=0.15)
    pan('facade_s', 'z', Z1 + EP - 0.02, 0.02, X0 - EP, X1 + EP, 0, 4.4, trous_sud, 'brique', 'facade', densite=0.15)
    pan('facade_o', 'x', X0 - EP, 0.02, Z0 - EP, Z1 + EP, 0, 4.4, [], 'brique', 'facade', densite=0.15)
    pan('facade_e', 'x', X1 + EP - 0.02, 0.02, Z0 - EP, Z1 + EP, 0, 4.4, trou_est, 'brique', 'facade_est', densite=0.6)
    # sol et plafond
    pave('sol', X0, -0.05, Z0, X1, 0, Z1, 'parquet', chanfrein=0, groupe='sol', densite=1.3)
    pave('plafond', X0, H, Z0, X1, H + 0.05, Z1, 'plafond', chanfrein=0, groupe='plafond', densite=0.55)


def lambris_tous():
    # nord : seulement entre la bibliothèque de gauche et la vitrine (le reste est caché par les meubles)
    lambris('lb_n', 'z', Z0, +1, -1.0, 0.3)
    # sud : d'un coin à l'autre (sous les fenêtres aussi)
    lambris('lb_s', 'z', Z1, -1, X0, X1)
    # ouest : de part et d'autre de la cheminée
    lambris('lb_o1', 'x', X0, +1, Z0 + 0.45, -CHEMINEE - 0.02)
    lambris('lb_o2', 'x', X0, +1, CHEMINEE + 0.02, Z1)
    # est : de part et d'autre de la porte
    lambris('lb_e1', 'x', X1, -1, Z0 + 0.45, PORTE[0] - 0.16)
    lambris('lb_e2', 'x', X1, -1, PORTE[1] + 0.16, Z1)
    # plinthes et cimaise, en chaînes coupées d'onglet dans les angles
    chaines_plinthe = [
        [(X0, CHEMINEE + 0.02), (X0, Z1), (X1, Z1), (X1, PORTE[1] + 0.16)],
        [(X1, PORTE[0] - 0.16), (X1, Z0 + 0.45)],
        [(-1.0, Z0), (0.3, Z0)],
        [(X0, -CHEMINEE - 0.02), (X0, Z0 + 0.45)],
    ]
    moulure_murale('plinthe', [[(x + (0.0), z) for (x, z) in ch] for ch in chaines_plinthe], 0.0, PLINTHE, 'lambris', 'lambris')
    chaines_cimaise = [
        [(X0, CHEMINEE + 0.02), (X0, Z1), (FENETRES[0][0] - 0.18, Z1)],
        [(FENETRES[0][1] + 0.14, Z1), (FENETRES[1][0] - 0.14, Z1)],
        [(FENETRES[1][1] + 0.14, Z1), (X1, Z1), (X1, PORTE[1] + 0.16)],
        [(X1, PORTE[0] - 0.16), (X1, Z0 + 0.45)],
        [(-1.0, Z0), (0.3, Z0)],
        [(X0, -CHEMINEE - 0.02), (X0, Z0 + 0.45)],
    ]
    moulure_murale('cimaise', chaines_cimaise, 0.86, CIMAISE, 'lambris', 'lambris')


def corniche_plafond():
    pts = [(X0, H - 0.3, Z0), (X1, H - 0.3, Z0), (X1, H - 0.3, Z1), (X0, H - 0.3, Z1)]
    normales = [(0, 0, 1), (-1, 0, 0), (0, 0, -1), (1, 0, 0)]
    import geo
    geo.orienter(balayer('corniche', pts, normales, (0, 1, 0), CORNICHE, 'plafond', ferme=True, groupe='plafond', densite=0.8), (0, 2.0, 0))
    # rosace au centre, où pend le lustre
    profil = [(0.0, -0.075), (0.05, -0.075), (0.065, -0.068), (0.075, -0.05), (0.1, -0.042), (0.13, -0.05), (0.16, -0.062),
              (0.2, -0.058), (0.23, -0.04), (0.27, -0.034), (0.3, -0.042), (0.34, -0.036), (0.38, -0.022), (0.42, -0.012), (0.46, 0.0)]
    geo.orienter(tour('rosace', profil, 'plafond', centre=(0, H, 0), n=48, groupe='plafond', ferme_haut=False, densite=0.8), (0, 2.0, 0))


def fenetres():
    """Grandes verrières à petits carreaux, dans des châssis de fer peints en noir : ébrasements
    enduits, appui de pierre profond, chambranle mouluré côté pièce."""
    for i, (wa, wb) in enumerate(FENETRES):
        g = 'menuiseries'
        W, Hh = wb - wa, F_HAUT - F_BAS
        # ébrasements et tableau enduits de blanc (ils renvoient la lumière dans la pièce)
        pave(f'f{i}_ebr_g', wa, F_BAS, Z1, wa + 0.015, F_HAUT, 4.64, 'plafond', groupe='ebrasements', chanfrein=0.002)
        pave(f'f{i}_ebr_d', wb - 0.015, F_BAS, Z1, wb, F_HAUT, 4.64, 'plafond', groupe='ebrasements', chanfrein=0.002)
        pave(f'f{i}_ebr_h', wa, F_HAUT - 0.015, Z1, wb, F_HAUT, 4.64, 'plafond', groupe='ebrasements', chanfrein=0.002)
        # appui de pierre, profond, qui déborde sur le lambris
        pave(f'f{i}_appui', wa - 0.12, F_BAS - 0.045, Z1 - 0.1, wb + 0.12, F_BAS, 4.64, 'marbre', groupe='marbre', chanfrein=0.01, segments=3)
        # chambranle mouluré côté pièce
        pts = [(wa - 0.015, F_BAS, Z1), (wa - 0.015, F_HAUT + 0.015, Z1), (wb + 0.015, F_HAUT + 0.015, Z1), (wb + 0.015, F_BAS, Z1)]
        balayer(f'f{i}_chambranle', pts, [(-1, 0, 0), (0, 1, 0), (1, 0, 0)], (0, 0, -1), CHAMBRANLE, 'peinture', groupe=g)
        # châssis de fer : cadre, meneaux et traverses en T, petits carreaux
        zf0, zf1 = 4.62, 4.68
        fer = 'fer_noir'
        pave(f'f{i}_cad_g', wa + 0.015, F_BAS, zf0, wa + 0.065, F_HAUT - 0.015, zf1, fer, groupe='chassis', chanfrein=0.004)
        pave(f'f{i}_cad_d', wb - 0.065, F_BAS, zf0, wb - 0.015, F_HAUT - 0.015, zf1, fer, groupe='chassis', chanfrein=0.004)
        pave(f'f{i}_cad_h', wa + 0.015, F_HAUT - 0.065, zf0, wb - 0.015, F_HAUT - 0.015, zf1, fer, groupe='chassis', chanfrein=0.004)
        pave(f'f{i}_cad_b', wa + 0.015, F_BAS, zf0 - 0.01, wb - 0.015, F_BAS + 0.07, zf1, fer, groupe='chassis', chanfrein=0.004)
        xa, xb, ya, yb = wa + 0.065, wb - 0.065, F_BAS + 0.07, F_HAUT - 0.065
        nc = max(2, round((xb - xa) / 0.46))
        nr = max(2, round((yb - ya) / 0.52))
        for k in range(1, nc):
            x = xa + (xb - xa) * k / nc
            larg = 0.034 if k % 2 == 0 else 0.026          # un meneau sur deux plus fort : la verrière est faite de panneaux
            pave(f'f{i}_men{k}', x - larg / 2, ya, zf0 + 0.008, x + larg / 2, yb, zf1 - 0.004, fer, groupe='chassis', chanfrein=0.003)
            pave(f'f{i}_men{k}_aile', x - 0.006, ya, zf0 - 0.012, x + 0.006, yb, zf0 + 0.01, fer, groupe='chassis', chanfrein=0.002)
        for k in range(1, nr):
            y = ya + (yb - ya) * k / nr
            larg = 0.034 if k == nr // 2 else 0.026
            pave(f'f{i}_tra{k}', xa, y - larg / 2, zf0 + 0.008, xb, y + larg / 2, zf1 - 0.004, fer, groupe='chassis', chanfrein=0.003)
            pave(f'f{i}_tra{k}_aile', xa, y - 0.006, zf0 - 0.012, xb, y + 0.006, zf0 + 0.01, fer, groupe='chassis', chanfrein=0.002)
        # le vitrage : un panneau par carreau (le verre ancien n'est pas parfaitement plan)
        import random
        rv = random.Random(31 + i)
        for kx in range(nc):
            for ky in range(nr):
                x0_, x1_ = xa + (xb - xa) * kx / nc, xa + (xb - xa) * (kx + 1) / nc
                y0_, y1_ = ya + (yb - ya) * ky / nr, ya + (yb - ya) * (ky + 1) / nr
                dz = rv.uniform(-0.0015, 0.0015)
                pave(f'f{i}_vitre{kx}_{ky}', x0_ + 0.005, y0_ + 0.005, 4.659 + dz, x1_ - 0.005, y1_ - 0.005, 4.661 + dz, 'verre', groupe='verre', chanfrein=0, cuire=0)
        # un vantail ouvrant au milieu, en bas, avec sa crémone et sa poignée
        kx = nc // 2
        x0_, x1_ = xa + (xb - xa) * (kx - 1) / nc, xa + (xb - xa) * (kx + 1) / nc
        tour(f'f{i}_poignee', [(0.0, 0.0), (0.012, 0.0), (0.01, 0.02), (0.016, 0.05), (0.0, 0.065)], 'laiton', centre=((x0_ + x1_) / 2, 1.5, zf0 - 0.014),
             n=12, groupe='laiton', axe=__import__('mathutils').Matrix.Rotation(-PI / 2, 3, 'X'))


def rideaux(i, wa, wb, y_haut, z0):
    """Deux pans de damas, plissés, qui tombent jusqu'au sol (le pli s'ouvre vers le bas)."""
    import bmesh, random
    from geo import V, objet
    rnd = random.Random(7 + i)
    for cote, (xa, xb) in enumerate([(wa - 0.56, wa - 0.08), (wb + 0.08, wb + 0.56)]):
        bm = bmesh.new()
        uv = bm.loops.layers.uv.new('UVMap')
        nx, ny = 44, 26
        lam = 0.11
        phases = [rnd.uniform(-0.4, 0.4) for _ in range(nx + 1)]
        grille = []
        for j in range(ny + 1):
            t = j / ny                          # 0 en haut, 1 en bas
            y = y_haut - t * (y_haut + 0.01)
            rang = []
            for k in range(nx + 1):
                u = k / nx
                x = xa + (xb - xa) * u
                amp = 0.028 + 0.03 * t
                z = z0 + 0.03 + amp * math.sin(2 * PI * (x - xa) / lam + phases[k] * t)
                if t > 0.97:
                    z -= (t - 0.97) * 1.2       # l'ourlet qui casse sur le parquet
                rang.append(bm.verts.new(V(x, y, z)))
            grille.append(rang)
        for j in range(ny):
            for k in range(nx):
                f = bm.faces.new([grille[j][k], grille[j + 1][k], grille[j + 1][k + 1], grille[j][k + 1]])
                for l, (a, b) in zip(f.loops, [(k, j), (k, j + 1), (k + 1, j + 1), (k + 1, j)]):
                    l[uv].uv = ((xa + (xb - xa) * a / nx) * 1.6, (y_haut - b / ny * y_haut) * 1.0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            if f.normal.y < 0:        # vers la pièce (z page décroissant = y Blender croissant)
                pass
        for f in bm.faces:
            if f.normal.y < 0:
                f.normal_flip()
        objet(f'rideau{i}_{cote}', bm, ['rideau'], groupe='rideaux', uv=False, lisse=80, densite=0.7)


def porte():
    z0, z1, h = PORTE
    g = 'lambris'
    # embrasure doublée de noyer, à panneaux
    for nom, za, zb in (('g', z0 - 0.02, z0), ('d', z1, z1 + 0.02)):
        pave(f'porte_ebr_{nom}', X1, 0, za, X1 + EP, h, zb, 'lambris', groupe=g, chanfrein=0.002, fil='y')
    pave('porte_ebr_h', X1, h, z0, X1 + EP, h + 0.02, z1, 'lambris', groupe=g, chanfrein=0.002)
    pave('porte_seuil', X1 - 0.02, -0.02, z0, X1 + EP, 0.012, z1, 'marbre', groupe='marbre', chanfrein=0.004, segments=2)
    # chambranle large et dessus-de-porte (frise et corniche)
    pts = [(X1, 0, z0 - 0.02), (X1, h + 0.02, z0 - 0.02), (X1, h + 0.02, z1 + 0.02), (X1, 0, z1 + 0.02)]
    prof = [(a * 1.3, e * 1.2) for (a, e) in CHAMBRANLE]
    balayer('porte_chambranle', pts, [(0, 0, -1), (0, 1, 0), (0, 0, 1)], (-1, 0, 0), prof, 'lambris', groupe=g)
    y0 = h + 0.02 + 0.156
    pave('porte_frise', X1 - 0.03, y0, z0 - 0.2, X1, y0 + 0.16, z1 + 0.2, 'lambris', groupe=g, chanfrein=0.003, fil='x')
    pts = [(X1, y0 + 0.16, z1 + 0.2), (X1, y0 + 0.16, z0 - 0.2)]
    corn = [(0, 0), (0.035, 0)] + doucine(0.035, 0.0, 0.07, 0.05, 6)[1:] + [(0.085, 0.055), (0.085, 0.085), (0.0, 0.085)]
    balayer('porte_corniche', [(X1 - 0.03, y0 + 0.16, z1 + 0.2), (X1 - 0.03, y0 + 0.16, z0 - 0.2)], [(-1, 0, 0)], (0, 1, 0), corn, 'lambris', groupe=g)
    # retours de la corniche sur les côtés
    # planchette d'ébène où se pose l'étiquette « Serre »
    pave('porte_enseigne', X1 - 0.05, y0 + 0.3, -0.4, X1, y0 + 0.56, 0.4, 'ebene', groupe='ebene', chanfrein=0.006, segments=2)
    # parement de la baie côté serre
    for nom, za, zb in (('g', z0 - 0.12, z0), ('d', z1, z1 + 0.12)):
        pave(f'porte_ext_{nom}', X1 + EP - 0.02, 0, za, X1 + EP + 0.03, h + 0.12, zb, 'lambris', groupe=g, chanfrein=0.003, densite=0.5)
    pave('porte_ext_h', X1 + EP - 0.02, h, z0 - 0.12, X1 + EP + 0.03, h + 0.12, z1 + 0.12, 'lambris', groupe=g, chanfrein=0.003, densite=0.5)


def cheminee():
    """Cheminée Louis-Philippe en marbre blanc : jambages à consoles, linteau cintré, tablette moulurée."""
    m = 'marbre'
    g = 'marbre'
    W = CHEMINEE
    # âtre
    pave('atre', X0, 0, -1.2, X0 + 0.72, 0.03, 1.2, m, groupe=g, chanfrein=0.01, segments=3)
    # jambages : consoles (profil en S extrudé sur la largeur)
    console = [(0, 0.03), (0.40, 0.03), (0.40, 0.11), (0.375, 0.135), (0.35, 0.17), (0.325, 0.25), (0.305, 0.38), (0.298, 0.52),
               (0.302, 0.66), (0.318, 0.77), (0.345, 0.85), (0.375, 0.91), (0.398, 0.96), (0.40, 1.0), (0.0, 1.0)]
    for nom, za in (('n', -W), ('s', 0.66)):
        extruder(f'jambage_{nom}', console, W - 0.66, (X0, 0, za), (1, 0, 0), (0, 1, 0), (0, 0, 1), m, groupe=g, chanfrein=0.008, lisse=40)
    # linteau cintré
    arc_bas = [(z, 0.9 + 0.045 * math.cos(z / 0.66 * PI / 2)) for z in [0.66 - 1.32 * k / 16 for k in range(17)]]
    contour = [(-0.66, 1.0), (0.66, 1.0)] + arc_bas
    extruder('linteau', [(u, v) for (u, v) in contour], 0.36, (X0, 0, 0), (0, 0, 1), (0, 1, 0), (1, 0, 0), m, groupe=g, chanfrein=0.006, lisse=30)
    # tablette moulurée (bords arrondis) et sa moulure de dessous
    pave('tablette', X0, 1.0, -W - 0.04, X0 + 0.5, 1.06, W + 0.04, m, groupe=g, chanfrein=0.022, segments=4)
    pts = [(X0, 0.975, -W + 0.02), (X0 + 0.42, 0.975, -W + 0.02), (X0 + 0.42, 0.975, W - 0.02), (X0, 0.975, W - 0.02)]
    prof = [(0, 0), (0.008, 0)] + doucine(0.008, 0.0, 0.03, 0.025, 6)[1:] + [(0.03, 0.026), (0.0, 0.026)]
    balayer('tablette_moulure', pts, [(0, 0, -1), (1, 0, 0), (0, 0, 1)], (0, 1, 0), prof, m, groupe=g)
    # foyer : contrecœur de fonte, joues de briques réfractaires, sol, avaloir noirci
    pave('contrecoeur', X0 - 0.24, 0.03, -0.5, X0 - 0.22, 0.86, 0.5, 'fonte', groupe='fonte', chanfrein=0.004)
    cadre = [(X0 - 0.215, 0.1, -0.42), (X0 - 0.215, 0.78, -0.42), (X0 - 0.215, 0.78, 0.42), (X0 - 0.215, 0.1, 0.42)]
    balayer('contrecoeur_cadre', cadre, [(0, 0, -1), (0, 1, 0), (0, 0, 1), (0, -1, 0)], (1, 0, 0), [(0, 0), (0.012, 0.004), (0.02, 0.012), (0.024, 0.0)], 'fonte', ferme=True, groupe='fonte')
    for s in (-1, 1):
        extruder(f'joue{s}', [(X0 - 0.24, s * 0.5), (X0 + 0.0, s * 0.66), (X0 + 0.0, s * 0.68), (X0 - 0.24, s * 0.52)][::(1 if s > 0 else -1)], 0.87,
                 (0, 0.03, 0), (1, 0, 0), (0, 0, 1), (0, 1, 0), 'brique_feu', groupe='foyer')
    pave('foyer_sol', X0 - 0.24, 0.0, -0.66, X0 + 0.02, 0.032, 0.66, 'ardoise', groupe='foyer', chanfrein=0)
    pave('avaloir', X0 - 0.24, 0.86, -0.66, X0 + 0.0, 0.9, 0.66, 'suie', groupe='foyer', chanfrein=0)
    # chenets : fût de fer, pommeau de laiton tourné
    for z in (-0.32, 0.32):
        pave(f'chenet_barre{z}', X0 - 0.18, 0.05, z - 0.012, X0 + 0.31, 0.075, z + 0.012, 'fonte', groupe='fonte', chanfrein=0.004)
        prof = [(0.03, 0), (0.034, 0.01), (0.02, 0.03), (0.016, 0.07), (0.028, 0.1), (0.032, 0.12), (0.02, 0.15), (0.026, 0.19), (0.036, 0.22),
                (0.028, 0.25), (0.012, 0.27), (0.0, 0.28)]
        tour(f'chenet_pommeau{z}', prof, 'laiton', centre=(X0 + 0.32, 0.03, z), n=18, groupe='laiton')
    # bûches et braises
    from mathutils import Matrix
    for k, (x, y, z, ry, rz, r, L) in enumerate([(-5.9, 0.12, -0.31, 0.05, 0.0, 0.055, 0.62), (-6.04, 0.11, -0.28, -0.04, 0.02, 0.05, 0.56),
                                                  (-5.97, 0.2, -0.25, 0.16, 0.06, 0.045, 0.5)]):
        rot = Matrix.Rotation(ry, 3, 'Y') @ Matrix.Rotation(PI / 2 + rz, 3, 'X')
        tour(f'buche{k}', [(0.0, 0), (r * 0.9, 0.0), (r, 0.02), (r * 0.98, L - 0.02), (r * 0.85, L), (0.0, L)], 'buches', centre=(x, y, z), n=14,
             groupe='buches', axe=rot)
    pave('braises', X0 - 0.17, 0.03, -0.36, X0 + 0.26, 0.05, 0.36, 'braises', groupe='braises', chanfrein=0.01, segments=2)


def crochets_crocodile():
    """Cordes et pitons qui tiennent le crocodile au plafond (comme dans la pièce dessinée par le code)."""
    for dx in (-0.75, 0.8):
        x, z = 2.4 + dx, 0.9 + dx * 0.12
        tour(f'corde{dx}', [(0.006, 0), (0.006, H - 3.3)], 'corde', centre=(x, 3.3, z), n=8, groupe='corde')
        tour(f'piton{dx}', [(0.02, -0.01), (0.022, 0.0), (0.0, 0.002)], 'fonte', centre=(x, H - 0.01, z), n=10, groupe='fonte')


def construire():
    murs()
    lambris_tous()
    corniche_plafond()
    cadres_muraux()
    fenetres()
    porte()
    cheminee()
    crochets_crocodile()
