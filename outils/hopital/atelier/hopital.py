# L'hôpital du « garçon à utérus », en 3D : le plan de l'exercice (ROOMS, en unités du dessin SVG)
# devient un bâtiment de plain-pied. 1 unité du plan = 3,5 cm ; x du plan → x de la page, y du plan → z.
# blender -b --factory-startup -P hopital.py -- <dossier textures cabinet> <dossier textures hôpital> <sortie.blend>
import bpy, sys, os, math, json, importlib
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
sys.path.insert(1, os.environ.get('SCRIPTS_CABINET', os.path.join(ICI, '..', 'blender', 'scripts')))
import geo, matieres, mobilier, accessoires
for m in (geo, matieres, mobilier, accessoires):
    importlib.reload(m)
from geo import V, pave, tour, balayer, objet, PI, TAU, pan_maille
from mathutils import Vector, Matrix
from accessoires import ajouter, PH_C
import personnages, humains
importlib.reload(humains)

args = sys.argv[sys.argv.index('--') + 1:]
TEX_CAB, TEX_HOP, SORTIE = args

U = 0.035
H = 2.9
def X(x): return round((x - 450) * U, 4)
def Z(y): return round((y - 265) * U, 4)

ROOMS = {
  'cyto': dict(x=20, y=20, w=270, h=205, door=155, top=True, c=(236, 230, 246)),
  'bloc': dict(x=300, y=20, w=110, h=205, door=355, top=True, c=(214, 236, 233)),
  'endo': dict(x=490, y=20, w=190, h=205, door=585, top=True, c=(251, 238, 222)),
  'gene': dict(x=690, y=20, w=190, h=205, door=785, top=True, c=(227, 244, 234)),
  'repro': dict(x=20, y=305, w=190, h=195, door=115, top=False, c=(249, 227, 236)),
  'consult': dict(x=220, y=305, w=190, h=195, door=315, top=False, c=(228, 240, 251)),
  'hall': dict(x=490, y=305, w=120, h=195, door=550, top=False, c=(246, 234, 210)),
  'imagerie': dict(x=620, y=305, w=260, h=195, door=750, top=False, c=(225, 238, 247)),
}
CH = (20, 240, 880, 290)      # couloir est-ouest
CV = (425, 20, 475, 500)      # couloir nord-sud
PORTE_L, PORTE_H = 40, 2.1    # largeur (unités du plan), hauteur (m)
F_BAS, F_HAUT = 0.95, 2.35    # allège et linteau des fenêtres
DONNEES = {'salles': {}, 'sondes': [], 'solides': []}


def vider():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def materiaux():
    matieres.charger_reglages(TEX_CAB)
    matieres.creer_toutes()
    T = matieres.TEX
    T['lino'] = {'couleur': f'{TEX_HOP}/lino_couleur.jpg', 'arm': f'{TEX_HOP}/lino_arm.jpg', 'relief': None}
    matieres.texturee('lino', 'lino', 2.0, relief=0)
    T['dalles'] = {'couleur': f'{TEX_HOP}/plafond_couleur.jpg', 'arm': None, 'relief': None}
    matieres.texturee('dalles', 'dalles', 1.2, rugosite=0.9, metal=0.0)
    lin = matieres.lin
    # murs : enduit peint en blanc cassé, et un mur de couleur par service (la couleur du plan de l'exercice)
    for nom in ['blanc'] + list(ROOMS):
        T['mur_' + nom] = {'couleur': f'{TEX_HOP}/mur_{nom}.jpg', 'arm': T['mur']['arm'], 'relief': T['mur']['relief']}
        matieres.texturee('mur_' + nom, 'mur_' + nom, 2.0, relief=0.35, metal=0.0)
    matieres.unie('cadre', lin((214, 216, 214)), rugosite=0.35)
    matieres.unie('plinthe', lin((96, 100, 104)), rugosite=0.5)
    matieres.unie('stratifie', lin((236, 236, 232)), rugosite=0.38)
    matieres.unie('plan_travail', lin((70, 74, 78)), rugosite=0.3)
    matieres.unie('inox', lin((200, 202, 204)), rugosite=0.22, metal=1.0)
    matieres.unie('skai_vert', lin((70, 128, 120)), rugosite=0.5)
    matieres.unie('skai_bleu', lin((60, 96, 140)), rugosite=0.5)
    matieres.unie('drap', lin((236, 238, 240)), rugosite=0.85)
    matieres.unie('ecran', lin((20, 24, 30)), rugosite=0.15, emission=lin((70, 120, 170)), force=1.5)
    matieres.unie('panneau', lin((250, 250, 248)), rugosite=0.5, emission=(1.0, 0.98, 0.94), force=6.0)
    matieres.unie('alu', lin((176, 180, 184)), rugosite=0.35, metal=1.0)
    matieres.unie('caoutchouc', lin((40, 40, 42)), rugosite=0.8)
    matieres.unie('main_courante', lin((168, 124, 84)), rugosite=0.4)


def teinter(m, cible, ref):
    """Multiplie la couleur de la photographie d'enduit (teinte de référence ref) pour viser la couleur cible."""
    nt = m.node_tree
    img = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and 'mur_couleur' in n.image.name][0]
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    mix.inputs[7].default_value = (*[min(4.0, a / b) for a, b in zip(cible, ref)], 1)
    b = nt.nodes['Principled BSDF']
    nt.links.new(img.outputs['Color'], mix.inputs[6])
    nt.links.new(mix.outputs[2], b.inputs['Base Color'])


# ------------------------------------------------------------------ murs, sols, plafonds
def fenetres_cote(a, b, n=None, larg=1.6):
    """Positions (en mètres, le long du mur) de n fenêtres réparties sur [a, b]."""
    L = b - a
    n = n or max(1, int(L / 3.2))
    return [(a + L * (k + 0.5) / n - larg / 2, a + L * (k + 0.5) / n + larg / 2) for k in range(n)]


def fenetre(nom, axe, plan, sens, s0, s1, y0=F_BAS, y1=F_HAUT, ep=0.25):
    """Baie dans un mur extérieur : tableaux enduits, appui, châssis d'aluminium, vitrage.
    plan : nu intérieur du mur ; sens : +1 si l'extérieur est du côté des coordonnées croissantes."""
    def bx(nm, a, b, ya, yb, e0, e1, mat, **kw):
        p0, p1 = plan + sens * e0, plan + sens * e1
        if axe == 'z':
            return pave(nm, a, ya, p0, b, yb, p1, mat, **kw)
        return pave(nm, p0, ya, a, p1, yb, b, mat, **kw)
    g = 'menuiseries'
    bx(nom + '_tg', s0 - 0.02, s0, y0, y1, 0, ep, 'mur_blanc', groupe='murs', chanfrein=0.002)
    bx(nom + '_td', s1, s1 + 0.02, y0, y1, 0, ep, 'mur_blanc', groupe='murs', chanfrein=0.002)
    bx(nom + '_th', s0, s1, y1, y1 + 0.02, 0, ep, 'mur_blanc', groupe='murs', chanfrein=0.002)
    bx(nom + '_appui', s0 - 0.06, s1 + 0.06, y0 - 0.03, y0, -0.05, ep, 'stratifie', groupe=g, chanfrein=0.006, segments=2)
    e = ep * 0.6
    for a, b, ya, yb in ((s0, s0 + 0.05, y0, y1), (s1 - 0.05, s1, y0, y1), (s0, s1, y0, y0 + 0.05), (s0, s1, y1 - 0.05, y1),
                         ((s0 + s1) / 2 - 0.025, (s0 + s1) / 2 + 0.025, y0, y1)):
        bx(nom + f'_ch{a:.2f}{ya:.2f}', a, b, ya, yb, e - 0.03, e + 0.03, 'alu', groupe='chassis', chanfrein=0.004)
    bx(nom + '_vitre', s0 + 0.05, s1 - 0.05, y0 + 0.05, y1 - 0.05, e - 0.002, e + 0.002, 'verre', groupe='verre', chanfrein=0, cuire=0)


def murs():
    trous = {}   # (axe, plan arrondi) → liste de trous
    # 1. les pièces : quatre faces intérieures, une porte côté couloir, des fenêtres sur les murs extérieurs
    for nom, r in ROOMS.items():
        x0, x1, z0, z1 = X(r['x']), X(r['x'] + r['w']), Z(r['y']), Z(r['y'] + r['h'])
        dx0, dx1 = X(r['door'] - PORTE_L / 2), X(r['door'] + PORTE_L / 2)
        porte = [(dx0, dx1, 0.0, PORTE_H)]
        f_n = f_s = f_o = f_e = []
        if r['top']:
            f_n = fenetres_cote(x0 + 0.4, x1 - 0.4)
        else:
            f_s = fenetres_cote(x0 + 0.4, x1 - 0.4)
        if r['x'] == 20:
            f_o = fenetres_cote(z0 + 0.6, z1 - 0.6, n=1, larg=1.8)
        if r['x'] + r['w'] == 880:
            f_e = fenetres_cote(z0 + 0.6, z1 - 0.6, n=1, larg=1.8)
        if nom == 'hall':
            f_s = [((x0 + x1) / 2 - 0.9, (x0 + x1) / 2 + 0.9)]   # porte d'entrée vitrée
        couleur = 'mur_' + nom
        fond_n = couleur if r['top'] else 'mur_blanc'          # le mur face à la porte prend la couleur du service
        fond_s = couleur if not r['top'] else 'mur_blanc'
        tn = [(a, b, F_BAS, F_HAUT) for a, b in f_n] + ([] if r['top'] else porte)
        ts = [(a, b, F_BAS if nom != 'hall' else 0.0, F_HAUT if nom != 'hall' else 2.4) for a, b in f_s] + (porte if r['top'] else [])
        pan_maille(nom + '_n', 'z', z0, +1, x0, x1, 0, H, tn, fond_n, 'murs')
        pan_maille(nom + '_s', 'z', z1, -1, x0, x1, 0, H, ts, fond_s, 'murs')
        pan_maille(nom + '_o', 'x', x0, +1, z0, z1, 0, H, [(a, b, F_BAS, F_HAUT) for a, b in f_o], 'mur_blanc', 'murs')
        pan_maille(nom + '_e', 'x', x1, -1, z0, z1, 0, H, [(a, b, F_BAS, F_HAUT) for a, b in f_e], 'mur_blanc', 'murs')
        for k, (a, b) in enumerate(f_n):
            fenetre(f'{nom}_fn{k}', 'z', z0, -1, a, b)
        for k, (a, b) in enumerate(f_s):
            if nom == 'hall':
                fenetre(f'{nom}_entree', 'z', z1, +1, a, b, y0=0.0, y1=2.4)
            else:
                fenetre(f'{nom}_fs{k}', 'z', z1, +1, a, b)
        for k, (a, b) in enumerate(f_o):
            fenetre(f'{nom}_fo{k}', 'x', x0, -1, a, b)
        for k, (a, b) in enumerate(f_e):
            fenetre(f'{nom}_fe{k}', 'x', x1, +1, a, b)
        # embrasure de la porte (le mur entre la pièce et le couloir) et chambranle
        zr, zc = (z1, Z(CH[1])) if r['top'] else (Z(CH[3]), z0)
        pave(nom + '_emb_g', dx0 - 0.03, 0, zr, dx0, PORTE_H, zc, 'cadre', groupe='cadres', chanfrein=0.004) if r['top'] else \
            pave(nom + '_emb_g', dx0 - 0.03, 0, zr, dx0, PORTE_H, zc, 'cadre', groupe='cadres', chanfrein=0.004)
        pave(nom + '_emb_d', dx1, 0, zr, dx1 + 0.03, PORTE_H, zc, 'cadre', groupe='cadres', chanfrein=0.004)
        pave(nom + '_emb_h', dx0, PORTE_H, zr, dx1, PORTE_H + 0.03, zc, 'cadre', groupe='cadres', chanfrein=0.004)
        DONNEES['salles'][nom] = {'x0': x0, 'x1': x1, 'z0': z0, 'z1': z1, 'porte': [dx0, dx1], 'cote': 'sud' if r['top'] else 'nord',
                                  'z_porte': zr if r['top'] else zc, 'z_couloir': zc if r['top'] else zr}
        DONNEES['sondes'].append([round((x0 + x1) / 2, 2), 1.4, round((z0 + z1) / 2, 2)])
    # 2. les couloirs : faces le long des pièces, percées des portes ; fenêtres au bout
    portes_n = [(X(r['door'] - PORTE_L / 2), X(r['door'] + PORTE_L / 2), 0, PORTE_H) for r in ROOMS.values() if r['top']]
    portes_s = [(X(r['door'] - PORTE_L / 2), X(r['door'] + PORTE_L / 2), 0, PORTE_H) for r in ROOMS.values() if not r['top']]
    croisement = (X(CV[0]), X(CV[2]), 0, H)
    pan_maille('couloir_n', 'z', Z(CH[1]), +1, X(CH[0]), X(CH[2]), 0, H, portes_n + [croisement], 'mur_blanc', 'murs')
    pan_maille('couloir_s', 'z', Z(CH[3]), -1, X(CH[0]), X(CH[2]), 0, H, portes_s + [croisement], 'mur_blanc', 'murs')
    fo = [(Z(CH[1]) + 0.25, Z(CH[3]) - 0.25)]
    pan_maille('couloir_o', 'x', X(CH[0]), +1, Z(CH[1]), Z(CH[3]), 0, H, [(a, b, F_BAS, F_HAUT) for a, b in fo], 'mur_blanc', 'murs')
    pan_maille('couloir_e', 'x', X(CH[2]), -1, Z(CH[1]), Z(CH[3]), 0, H, [(a, b, F_BAS, F_HAUT) for a, b in fo], 'mur_blanc', 'murs')
    fenetre('couloir_fo', 'x', X(CH[0]), -1, *fo[0])
    fenetre('couloir_fe', 'x', X(CH[2]), +1, *fo[0])
    croise = (Z(CH[1]), Z(CH[3]), 0, H)
    pan_maille('couloir_vo', 'x', X(CV[0]), +1, Z(CV[1]), Z(CV[3]), 0, H, [croise], 'mur_blanc', 'murs')
    pan_maille('couloir_ve', 'x', X(CV[2]), -1, Z(CV[1]), Z(CV[3]), 0, H, [croise], 'mur_blanc', 'murs')
    fv = [(X(CV[0]) + 0.25, X(CV[2]) - 0.25)]
    pan_maille('couloir_vn', 'z', Z(CV[1]), +1, X(CV[0]), X(CV[2]), 0, H, [(a, b, F_BAS, F_HAUT) for a, b in fv], 'mur_blanc', 'murs')
    pan_maille('couloir_vs', 'z', Z(CV[3]), -1, X(CV[0]), X(CV[2]), 0, H, [(a, b, F_BAS, F_HAUT) for a, b in fv], 'mur_blanc', 'murs')
    fenetre('couloir_fvn', 'z', Z(CV[1]), -1, *fv[0])
    fenetre('couloir_fvs', 'z', Z(CV[3]), +1, *fv[0])
    # mains courantes et plinthes du couloir (sans les portes)
    for nom, plan, sens, portes in (('n', Z(CH[1]), +1, portes_n), ('s', Z(CH[3]), -1, portes_s)):
        bornes = sorted([X(CH[0]), X(CH[2])] + [v for (a, b, _, _) in portes + [croisement] for v in (a - 0.1, b + 0.1)])
        for k in range(0, len(bornes) - 1, 2):
            a, b = bornes[k], bornes[k + 1]
            if b - a < 0.3:
                continue
            pave(f'mc_{nom}{k}', a, 0.88, plan + sens * 0.04, b, 0.95, plan + sens * 0.09, 'main_courante', groupe='main_courante', chanfrein=0.012, segments=3)
            pave(f'pl_{nom}{k}', a, 0.0, plan, b, 0.1, plan + sens * 0.012, 'plinthe', groupe='plinthes', chanfrein=0.002)
    # sol et plafond
    pave('sol', X(5), -0.05, Z(5), X(895), 0, Z(515), 'lino', chanfrein=0, groupe='sol', densite=1.0)
    pave('plafond', X(5), H, Z(5), X(895), H + 0.05, Z(515), 'dalles', chanfrein=0, groupe='plafond', densite=0.5)


def luminaires():
    """Dalles lumineuses encastrées (60 × 60 cm) : une lampe de surface dans chacune, pour la cuisson."""
    pos = []
    for nom, r in ROOMS.items():
        x0, x1, z0, z1 = X(r['x']), X(r['x'] + r['w']), Z(r['y']), Z(r['y'] + r['h'])
        nx, nz = max(1, round((x1 - x0) / 2.6)), max(1, round((z1 - z0) / 2.6))
        pos += [((x0 + (x1 - x0) * (i + 0.5) / nx), (z0 + (z1 - z0) * (j + 0.5) / nz)) for i in range(nx) for j in range(nz)]
    pos += [(x, 0.0) for x in [X(CH[0]) + 1.5 + k * 3.2 for k in range(9)] if abs(x) > 1.0]
    pos += [(0.0, z) for z in (Z(60), Z(150), Z(380), Z(460))] + [(0.0, 0.0)]
    ctx = geo.collection('contexte')
    for k, (x, z) in enumerate(pos):
        pave(f'dalle_lum{k}', x - 0.3, H - 0.01, z - 0.3, x + 0.3, H, z + 0.3, 'panneau', groupe='luminaires', chanfrein=0, atlas='B')
        l = bpy.data.lights.new(f'lum{k}', 'AREA')
        l.shape = 'SQUARE'; l.size = 0.6; l.energy = 28.0; l.color = (1.0, 0.97, 0.92)
        o = bpy.data.objects.new(f'lum{k}', l); ctx.objects.link(o)
        o.location = V(x, H - 0.02, z)   # une lampe de surface éclaire vers son −Z local : vers le bas, par défaut
    geo.collection('piece')
    return len(pos)


def ciel():
    sc = bpy.context.scene
    w = bpy.data.worlds.new('ciel'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; fond = nt.nodes['Background']
    s = nt.nodes.new('ShaderNodeTexSky'); s.sky_type = 'NISHITA'; s.sun_disc = False
    sol = Vector((0.45, 0.55, 0.7)).normalized()          # soleil du sud-est, en milieu de matinée
    s.sun_elevation = math.asin(sol.y)
    nt.links.new(s.outputs['Color'], fond.inputs['Color']); fond.inputs['Strength'].default_value = 0.4
    ctx = geo.collection('contexte')
    l = bpy.data.lights.new('soleil', 'SUN'); l.energy = 3.0; l.angle = math.radians(1.5); l.color = (1.0, 0.95, 0.88)
    o = bpy.data.objects.new('soleil', l); ctx.objects.link(o)
    o.rotation_euler = V(*sol).to_track_quat('Z', 'Y').to_euler()
    import bmesh
    bm = bmesh.new()
    vs = [bm.verts.new(V(x, -0.06, z)) for (x, z) in ((-60, -60), (60, -60), (60, 60), (-60, 60))]
    bm.faces.new(vs)
    for f in bm.faces:
        if f.normal.z < 0: f.normal_flip()
    me = bpy.data.meshes.new('herbe'); bm.to_mesh(me)
    me.materials.append(matieres.unie('herbe', matieres.lin((84, 104, 56)), rugosite=1.0))
    ctx.objects.link(bpy.data.objects.new('herbe', me))
    ctx['exporter'] = 0
    geo.collection('piece')
    return [round(v, 4) for v in sol]


# ------------------------------------------------------------------ mobilier modelé
def paillasse(nom, x0, x1, z0, z1, h=0.9, dos=None):
    """Paillasse de laboratoire : caissons blancs à portes et tiroirs, plan de travail gris, poignées d'inox."""
    pave(nom + '_socle', x0 + 0.05, 0, z0 + 0.05, x1 - 0.05, 0.1, z1 - 0.05, 'plinthe', groupe='meubles', chanfrein=0.002)
    pave(nom + '_caisson', x0 + 0.02, 0.1, z0 + 0.02, x1 - 0.02, h - 0.035, z1 - 0.02, 'stratifie', groupe='meubles', chanfrein=0.004)
    pave(nom + '_plan', x0, h - 0.035, z0, x1, h, z1, 'plan_travail', groupe='meubles', chanfrein=0.006, segments=2)
    larg = 0.6
    long_x = (x1 - x0) >= (z1 - z0)
    L = (x1 - x0) if long_x else (z1 - z0)
    n = max(1, int(L / larg))
    faces = [(z1, +1), (z0, -1)] if long_x else [(x1, +1), (x0, -1)]
    if dos is not None:
        faces = [f for f in faces if f[0] != dos]
    for (p, s) in faces:
        for k in range(n):
            a = (x0 if long_x else z0) + L * k / n + 0.01
            b = (x0 if long_x else z0) + L * (k + 1) / n - 0.01
            for (ya, yb) in ((0.12, h - 0.2), (h - 0.18, h - 0.05)):
                e0, e1 = (p, p + s * 0.012)
                if long_x:
                    pave(f'{nom}_f{p}{k}{ya}', a, ya, min(e0, e1), b, yb, max(e0, e1), 'stratifie', groupe='meubles', chanfrein=0.004)
                    pave(f'{nom}_p{p}{k}{ya}', (a + b) / 2 - 0.07, yb - 0.04, min(e1, e1 + s * 0.02), (a + b) / 2 + 0.07, yb - 0.03, max(e1, e1 + s * 0.02),
                         'inox', groupe='inox', chanfrein=0.003)
                else:
                    pave(f'{nom}_f{p}{k}{ya}', min(e0, e1), ya, a, max(e0, e1), yb, b, 'stratifie', groupe='meubles', chanfrein=0.004)
                    pave(f'{nom}_p{p}{k}{ya}', min(e1, e1 + s * 0.02), yb - 0.04, (a + b) / 2 - 0.07, max(e1, e1 + s * 0.02), yb - 0.03, (a + b) / 2 + 0.07,
                         'inox', groupe='inox', chanfrein=0.003)
    mobilier.solide(x0, z0, x1, z1)


def table_examen(nom, x, z, ry=0.0, couleur='skai_vert'):
    """Table d'examen : piètement d'inox, matelas rembourré à têtière relevée, rouleau de papier."""
    R = Matrix.Rotation(ry, 3, 'Y')
    def P(dx, y, dz):
        v = R @ Vector((dx, y, dz)); return (x + v.x, v.y, z + v.z)
    obs = []
    for sx in (-0.85, 0.85):
        for sz in (-0.25, 0.25):
            obs.append(tour(f'{nom}_pied{sx}{sz}', [(0.022, 0.0), (0.022, 0.6), (0.0, 0.6)], 'inox', centre=P(sx, 0, sz), n=10, groupe='inox'))
    import bmesh
    from geo import uv_boite
    def boite(nm, cx, cy, cz, sx, sy, sz, m, ch=0.03, seg=3, inclin=0.0):
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            loc = Vector((v.co.x * sx, v.co.z * sy, v.co.y * sz))
            loc = Matrix.Rotation(inclin, 3, 'Z') @ loc
            w = R @ (Vector((cx, cy, cz)) + loc)
            v.co = V(x + w.x, w.y, z + w.z)
        # l'échange y/z du gabarit retourne le cube : sans cela les faces regardent vers l'intérieur et cuisent noires
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=ch, segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
        uv_boite(bm)
        return objet(nm, bm, [m], groupe='meubles' if m != 'inox' else 'inox', uv=False, lisse=40)
    boite(nom + '_cadre', 0, 0.62, 0, 1.9, 0.05, 0.6, 'inox', ch=0.01, seg=1)
    boite(nom + '_matelas', -0.18, 0.7, 0, 1.45, 0.1, 0.62, couleur)
    boite(nom + '_tetiere', 0.72, 0.8, 0, 0.55, 0.1, 0.62, couleur, inclin=0.35)
    boite(nom + '_papier', -0.15, 0.757, 0, 1.4, 0.004, 0.5, 'drap', ch=0.001, seg=1)
    tour(nom + '_rouleau', [(0.0, -0.27), (0.05, -0.27), (0.05, 0.27), (0.0, 0.27)], 'drap', centre=P(-0.98, 0.72, 0), n=16, groupe='meubles',
         axe=R @ Matrix.Rotation(PI / 2, 3, 'X'))
    c, s = math.cos(ry), math.sin(ry)
    ex, ez = abs(c) * 1.0 + abs(s) * 0.33, abs(s) * 1.0 + abs(c) * 0.33
    mobilier.solide(x - ex, z - ez, x + ex, z + ez)


def table_operation(x, z):
    tour('bloc_colonne', [(0.0, 0.0), (0.32, 0.0), (0.33, 0.04), (0.12, 0.08), (0.09, 0.12), (0.09, 0.78), (0.0, 0.8)], 'inox', centre=(x, 0, z), n=32, groupe='inox')
    pave('bloc_plateau', x - 1.0, 0.78, z - 0.27, x + 1.0, 0.84, z + 0.27, 'inox', groupe='inox', chanfrein=0.01)
    pave('bloc_matelas', x - 0.98, 0.84, z - 0.25, x + 0.98, 0.92, z + 0.25, 'skai_bleu', groupe='meubles', chanfrein=0.03, segments=3)
    pave('bloc_drap', x - 0.7, 0.92, z - 0.26, x + 0.98, 0.93, z + 0.26, 'drap', groupe='meubles', chanfrein=0.004)
    # scialytique : double coupole suspendue au plafond
    tour('bloc_tige', [(0.03, 0.0), (0.03, 0.9), (0.0, 0.9)], 'inox', centre=(x, H - 0.9, z), n=12, groupe='inox')
    for k, dx in enumerate((-0.45, 0.45)):
        pts = [(x, H - 0.85, z), (x + dx * 0.5, H - 0.95, z), (x + dx, H - 1.0, z + 0.1)]
        balayer(f'bloc_bras{k}', pts, [(0, 0, 1), (0, 0, 1)], (0, 1, 0), [(0.02 * math.cos(t / 8 * TAU), 0.02 * math.sin(t / 8 * TAU)) for t in range(9)],
                'inox', groupe='inox', lisse=60)
        tour(f'bloc_coupole{k}', [(0.0, 0.0), (0.3, 0.0), (0.34, 0.03), (0.33, 0.09), (0.2, 0.16), (0.04, 0.18), (0.0, 0.18)], 'stratifie',
             centre=(x + dx, H - 1.22, z + 0.1), n=40, groupe='meubles')
        tour(f'bloc_verre{k}', [(0.0, -0.002), (0.29, -0.002), (0.29, 0.0), (0.0, 0.001)], 'panneau', centre=(x + dx, H - 1.22, z + 0.1), n=40, groupe='luminaires')
    mobilier.solide(x - 1.0, z - 0.35, x + 1.0, z + 0.35)


def echographe(x, z, ry):
    R = Matrix.Rotation(ry, 3, 'Y')
    def P(dx, y, dz):
        v = R @ Vector((dx, y, dz)); return (x + v.x, v.y, z + v.z)
    pave('echo_base', *[a for a in (P(-0.3, 0.06, -0.3))], *[a for a in P(0.3, 0.16, 0.3)], 'stratifie', groupe='meubles', chanfrein=0.03, segments=2)
    for dx in (-0.25, 0.25):
        for dz in (-0.25, 0.25):
            tour(f'echo_roue{dx}{dz}', [(0.0, 0.0), (0.04, 0.0), (0.045, 0.03), (0.04, 0.06), (0.0, 0.06)], 'caoutchouc', centre=P(dx, 0, dz), n=12, groupe='meubles')
    tour('echo_colonne', [(0.06, 0.0), (0.06, 0.7), (0.0, 0.7)], 'alu', centre=P(0, 0.16, 0), n=16, groupe='inox')
    pave('echo_console', *P(-0.32, 0.86, -0.25), *P(0.32, 0.94, 0.25), 'stratifie', groupe='meubles', chanfrein=0.02, segments=2)
    pave('echo_clavier', *P(-0.25, 0.94, -0.12), *P(0.25, 0.955, 0.15), 'plan_travail', groupe='meubles', chanfrein=0.004)
    pave('echo_ecran_boite', *P(-0.28, 1.0, -0.26), *P(0.28, 1.36, -0.22), 'plan_travail', groupe='meubles', chanfrein=0.01)
    pave('echo_ecran', *P(-0.25, 1.03, -0.22), *P(0.25, 1.33, -0.218), 'ecran', groupe='ecrans', chanfrein=0)
    mobilier.solide(x - 0.4, z - 0.4, x + 0.4, z + 0.4)


def comptoir(x0, x1, z0, z1):
    """Banque d'accueil : façade bois, tablette haute, plan de travail."""
    pave('accueil_facade', x0, 0, z0, x1, 1.05, z0 + 0.06, 'hetre', groupe='meubles', chanfrein=0.006, segments=2)
    pave('accueil_cote', x0, 0, z0, x0 + 0.06, 1.05, z1, 'hetre', groupe='meubles', chanfrein=0.006, segments=2)
    pave('accueil_tablette', x0 - 0.04, 1.05, z0 - 0.1, x1 + 0.02, 1.09, z0 + 0.25, 'stratifie', groupe='meubles', chanfrein=0.01, segments=2)
    pave('accueil_plan', x0 + 0.06, 0.72, z0 + 0.06, x1, 0.75, z1, 'stratifie', groupe='meubles', chanfrein=0.006)
    mobilier.solide(x0, z0 - 0.1, x1, z1)


def sequenceur(x, z):
    pave('seq_corps', x - 0.45, 0.9, z - 0.3, x + 0.45, 1.45, z + 0.3, 'stratifie', groupe='meubles', chanfrein=0.03, segments=2)
    pave('seq_ecran', x - 0.3, 1.18, z + 0.3, x + 0.1, 1.38, z + 0.302, 'ecran', groupe='ecrans', chanfrein=0)
    pave('seq_porte', x + 0.15, 1.0, z + 0.3, x + 0.4, 1.38, z + 0.305, 'plan_travail', groupe='meubles', chanfrein=0.006)


def portoir(x, y, z, couleurs):
    pave(f'portoir_{x}', x - 0.12, y, z - 0.04, x + 0.12, y + 0.07, z + 0.04, 'stratifie', groupe='meubles', chanfrein=0.006)
    for k, c in enumerate(couleurs):
        tx = x - 0.09 + k * 0.045
        tour(f'tube{x}_{k}', [(0.0, 0.0), (0.008, 0.002), (0.008, 0.11), (0.0098, 0.112), (0.0098, 0.115), (0.0, 0.115)], 'verre', centre=(tx, y + 0.015, z), n=10,
             groupe='verre', cuire=0)
        tour(f'tube{x}_{k}_liq', [(0.0, 0.0), (0.007, 0.003), (0.007, 0.06), (0.0, 0.06)], c, centre=(tx, y + 0.015, z), n=10, groupe=c, cuire=0)


def meubler():
    S = DONNEES['salles']
    lin = matieres.lin
    for nom, c in (('sang', (150, 24, 30)), ('serum', (214, 190, 90)), ('bleu', (60, 110, 180))):
        m = matieres.unie(nom, lin(c), rugosite=0.1)
        b = m.node_tree.nodes['Principled BSDF']; b.inputs['Alpha'].default_value = 0.8; m['verre'] = 1
    # --- hall d'accueil
    s = S['hall']
    comptoir(s['x0'] + 0.3, s['x0'] + 2.6, s['z1'] - 2.3, s['z1'] - 0.9)
    for k in range(3):
        ajouter('plastic_monobloc_chair_01', f'chaise_hall{k}', s['x1'] - 0.45, 0, s['z0'] + 2.3 + k * 0.7, ry=-PI / 2, densite=0.5,
                credit=PH_C('Plastic Monobloc Chair 01', '', 'plastic_monobloc_chair_01'))
    mobilier.solide(s['x1'] - 0.8, s['z0'] + 1.9, s['x1'], s['z0'] + 4.0)
    ajouter('potted_plant_01', 'plante_hall', s['x1'] - 0.5, 0, s['z1'] - 0.5, taille=1.3, tri=9000, credit=PH_C('Potted Plant 01', '', 'potted_plant_01'))
    mobilier.solide(s['x1'] - 0.85, s['z1'] - 0.85, s['x1'], s['z1'])
    ajouter('wall_clock', 'horloge_hall', s['x0'] + 0.02, 2.2, (s['z0'] + s['z1']) / 2, ry=PI / 2, ancre='centre', credit=PH_C('Wall Clock', '', 'wall_clock'))
    ajouter('classic_laptop', 'pc_accueil', s['x0'] + 1.4, 0.75, s['z1'] - 1.6, ry=0.0, taille=0.4, credit=PH_C('Classic Laptop', '', 'classic_laptop'))
    ajouter('WetFloorSign_01', 'panneau_sol', s['x1'] - 0.6, 0, s['z0'] + 1.2, ry=0.6, credit=PH_C('Wet Floor Sign 01', '', 'WetFloorSign_01'))
    # --- consultations (Dr Lefèvre)
    s = S['consult']
    ajouter('metal_office_desk', 'bureau_consult', (s['x0'] + s['x1']) / 2 - 0.6, 0, s['z1'] - 1.1, ry=PI, credit=PH_C('Metal Office Desk', '', 'metal_office_desk'))
    mobilier.solide((s['x0'] + s['x1']) / 2 - 1.4, s['z1'] - 1.55, (s['x0'] + s['x1']) / 2 + 0.2, s['z1'] - 0.7)
    ajouter('modern_arm_chair_01', 'fauteuil_consult', (s['x0'] + s['x1']) / 2 - 0.6, 0, s['z1'] - 0.35, ry=PI, taille=0.95, credit=PH_C('Modern Arm Chair 01', '', 'modern_arm_chair_01'))
    for k, dx in enumerate((-1.1, -0.1)):
        ajouter('plastic_monobloc_chair_01', f'chaise_consult{k}', (s['x0'] + s['x1']) / 2 + dx, 0, s['z1'] - 2.1, ry=0.0,
                credit=PH_C('Plastic Monobloc Chair 01', '', 'plastic_monobloc_chair_01'))
    ajouter('classic_laptop', 'pc_consult', (s['x0'] + s['x1']) / 2 - 0.4, 0.79, s['z1'] - 1.1, ry=PI, taille=0.38, credit=PH_C('Classic Laptop', '', 'classic_laptop'))
    table_examen('examen_consult', s['x0'] + 0.6, (s['z0'] + s['z1']) / 2 + 0.6, ry=PI / 2)
    ajouter('steel_frame_shelves_01', 'etagere_consult', s['x1'] - 0.35, 0, (s['z0'] + s['z1']) / 2, ry=-PI / 2, taille=1.9, credit=PH_C('Steel Frame Shelves 01', '', 'steel_frame_shelves_01'))
    mobilier.solide(s['x1'] - 0.7, (s['z0'] + s['z1']) / 2 - 0.5, s['x1'], (s['z0'] + s['z1']) / 2 + 0.5)
    ajouter('medical_box', 'trousse_consult', s['x1'] - 0.35, 1.08, (s['z0'] + s['z1']) / 2, ry=-PI / 2, credit=PH_C('Medical Box', '', 'medical_box'))
    ajouter('potted_plant_02', 'plante_consult', s['x1'] - 0.5, 0, s['z1'] - 0.5, taille=0.9, tri=8000, credit=PH_C('Potted Plant 02', '', 'potted_plant_02'))
    # --- cytogénétique (Dr Benali)
    s = S['cyto']
    paillasse('cyto_mur', s['x0'] + 0.3, s['x1'] - 0.3, s['z0'], s['z0'] + 0.7, dos=s['z0'])
    paillasse('cyto_ilot', s['x0'] + 1.6, s['x1'] - 3.2, (s['z0'] + s['z1']) / 2 - 0.5, (s['z0'] + s['z1']) / 2 + 0.5)
    for k, dx in enumerate((1.4, 4.6)):
        ajouter('industrial_microscope', f'microscope_cyto{k}', s['x0'] + dx, 0.9, s['z0'] + 0.35, ry=0.0, credit=PH_C('Industrial Microscope', '', 'industrial_microscope'))
        ajouter('metal_stool_01', f'tabouret_cyto{k}', s['x0'] + dx, 0, s['z0'] + 1.1, credit=PH_C('Metal Stool 01', '', 'metal_stool_01'))
    ajouter('chemistry_set', 'chimie_cyto', s['x0'] + 3.2, 0.9, (s['z0'] + s['z1']) / 2, ry=0.0, taille=0.9, tri=12000, credit=PH_C('Chemistry Set', '', 'chemistry_set'))
    ajouter('bunsen_burner', 'bunsen_cyto', s['x0'] + 5.0, 0.9, (s['z0'] + s['z1']) / 2 + 0.1, credit=PH_C('Bunsen Burner', '', 'bunsen_burner'))
    ajouter('korean_fire_extinguisher_01', 'extincteur_cyto', s['x0'] + 0.25, 0, s['z1'] - 0.4, ry=PI / 2, credit=PH_C('Korean Fire Extinguisher 01', '', 'korean_fire_extinguisher_01'))
    ajouter('steel_frame_shelves_01', 'etagere_cyto', s['x0'] + 0.35, 0, (s['z0'] + s['z1']) / 2 + 0.6, ry=PI / 2, taille=1.9,
            credit=PH_C('Steel Frame Shelves 01', '', 'steel_frame_shelves_01'))
    mobilier.solide(s['x0'], (s['z0'] + s['z1']) / 2 + 0.1, s['x0'] + 0.7, (s['z0'] + s['z1']) / 2 + 1.1)
    ajouter('binder_notebook', 'classeurs_cyto', s['x0'] + 0.35, 1.3, (s['z0'] + s['z1']) / 2 + 0.6, ry=PI / 2, credit=PH_C('Binder Notebook', '', 'binder_notebook'))
    # --- bloc opératoire (Dr Vasseur)
    s = S['bloc']
    table_operation((s['x0'] + s['x1']) / 2, (s['z0'] + s['z1']) / 2 - 0.6)
    ajouter('industrial_storage_cart', 'chariot_bloc', s['x0'] + 0.6, 0, s['z0'] + 1.0, ry=PI / 2, taille=1.1, credit=PH_C('Industrial Storage Cart', '', 'industrial_storage_cart'))
    mobilier.solide(s['x0'], s['z0'] + 0.45, s['x0'] + 1.0, s['z0'] + 1.55)
    ajouter('medical_box', 'trousse_bloc', s['x1'] - 0.5, 0.0, s['z0'] + 0.5, credit=PH_C('Medical Box', '', 'medical_box'))
    # --- endocrinologie (Dr Roche)
    s = S['endo']
    paillasse('endo_mur', s['x0'] + 0.3, s['x1'] - 0.3, s['z0'], s['z0'] + 0.7, dos=s['z0'])
    portoir(s['x0'] + 1.2, 0.9, s['z0'] + 0.35, ['sang', 'sang', 'serum', 'sang', 'serum'])
    portoir(s['x0'] + 1.6, 0.9, s['z0'] + 0.4, ['serum', 'sang', 'bleu'])
    ajouter('medical_box', 'trousse_endo', s['x0'] + 2.6, 0.9, s['z0'] + 0.35, credit=PH_C('Medical Box', '', 'medical_box'))
    ajouter('clipboard', 'bloc_notes_endo', s['x0'] + 3.4, 0.9, s['z0'] + 0.35, ry=0.3, credit=PH_C('Clipboard', '', 'clipboard'))
    ajouter('metal_office_desk', 'bureau_endo', s['x1'] - 1.2, 0, (s['z0'] + s['z1']) / 2 + 0.4, ry=-PI / 2, credit=PH_C('Metal Office Desk', '', 'metal_office_desk'))
    mobilier.solide(s['x1'] - 1.6, (s['z0'] + s['z1']) / 2 - 0.4, s['x1'] - 0.8, (s['z0'] + s['z1']) / 2 + 1.2)
    ajouter('classic_laptop', 'pc_endo', s['x1'] - 1.2, 0.79, (s['z0'] + s['z1']) / 2 + 0.4, ry=-PI / 2, taille=0.36, credit=PH_C('Classic Laptop', '', 'classic_laptop'))
    ajouter('metal_stool_01', 'tabouret_endo', s['x0'] + 2.0, 0, s['z0'] + 1.1, credit=PH_C('Metal Stool 01', '', 'metal_stool_01'))
    # --- génétique (Dr Nguyen)
    s = S['gene']
    paillasse('gene_mur', s['x0'] + 0.3, s['x1'] - 0.3, s['z0'], s['z0'] + 0.7, dos=s['z0'])
    sequenceur(s['x0'] + 1.3, s['z0'] + 0.35)
    for k, dx in enumerate((3.0, 4.6)):
        ajouter('classic_laptop', f'pc_gene{k}', s['x0'] + dx, 0.9, s['z0'] + 0.35, ry=0.0, taille=0.38, credit=PH_C('Classic Laptop', '', 'classic_laptop'))
        ajouter('metal_stool_01', f'tabouret_gene{k}', s['x0'] + dx, 0, s['z0'] + 1.1, credit=PH_C('Metal Stool 01', '', 'metal_stool_01'))
    ajouter('modern_wooden_cabinet', 'meuble_gene', s['x1'] - 0.3, 0, (s['z0'] + s['z1']) / 2 + 0.5, ry=-PI / 2, taille=2.0, credit=PH_C('Modern Wooden Cabinet', '', 'modern_wooden_cabinet'))
    mobilier.solide(s['x1'] - 0.6, (s['z0'] + s['z1']) / 2 - 0.5, s['x1'], (s['z0'] + s['z1']) / 2 + 1.5)
    ajouter('cardboard_box_01', 'carton_gene', s['x1'] - 0.35, 0.68, (s['z0'] + s['z1']) / 2 + 0.2, ry=0.3, credit=PH_C('Cardboard Box 01', '', 'cardboard_box_01'))
    # --- imagerie (Dr Petit)
    s = S['imagerie']
    table_examen('examen_echo', (s['x0'] + s['x1']) / 2 + 1.0, s['z1'] - 1.3, ry=0.0, couleur='skai_bleu')
    echographe((s['x0'] + s['x1']) / 2 - 0.6, s['z1'] - 1.3, -PI / 2)
    ajouter('wheelchair_01', 'fauteuil_roulant', s['x1'] - 0.7, 0, s['z0'] + 1.0, ry=-2.2, tri=9000, credit=PH_C('Wheelchair 01', '', 'wheelchair_01'))
    mobilier.solide(s['x1'] - 1.2, s['z0'] + 0.5, s['x1'] - 0.2, s['z0'] + 1.5)
    ajouter('metal_office_desk', 'bureau_imagerie', s['x0'] + 1.3, 0, s['z1'] - 0.9, ry=PI, credit=PH_C('Metal Office Desk', '', 'metal_office_desk'))
    mobilier.solide(s['x0'] + 0.5, s['z1'] - 1.3, s['x0'] + 2.1, s['z1'] - 0.5)
    ajouter('classic_laptop', 'pc_imagerie', s['x0'] + 1.3, 0.79, s['z1'] - 0.9, ry=PI, taille=0.36, credit=PH_C('Classic Laptop', '', 'classic_laptop'))
    ajouter('potted_plant_02', 'plante_imagerie', s['x0'] + 0.5, 0, s['z0'] + 1.6, taille=0.9, tri=8000, credit=PH_C('Potted Plant 02', '', 'potted_plant_02'))
    # --- médecine de la reproduction (Dr Morel)
    s = S['repro']
    ajouter('metal_office_desk', 'bureau_repro', (s['x0'] + s['x1']) / 2 + 0.6, 0, s['z1'] - 1.1, ry=PI, credit=PH_C('Metal Office Desk', '', 'metal_office_desk'))
    mobilier.solide((s['x0'] + s['x1']) / 2 - 0.2, s['z1'] - 1.55, (s['x0'] + s['x1']) / 2 + 1.4, s['z1'] - 0.7)
    ajouter('industrial_microscope', 'microscope_repro', (s['x0'] + s['x1']) / 2 + 1.0, 0.79, s['z1'] - 1.2, ry=PI, taille=0.4, credit=PH_C('Industrial Microscope', '', 'industrial_microscope'))
    ajouter('sofa_02', 'canape_repro', s['x0'] + 0.5, 0, (s['z0'] + s['z1']) / 2, ry=PI / 2, taille=1.8, credit=PH_C('Sofa 02', '', 'sofa_02'))
    mobilier.solide(s['x0'], (s['z0'] + s['z1']) / 2 - 0.95, s['x0'] + 0.9, (s['z0'] + s['z1']) / 2 + 0.95)
    ajouter('modern_coffee_table_01', 'table_basse_repro', s['x0'] + 1.5, 0, (s['z0'] + s['z1']) / 2, ry=0.0, credit=PH_C('Modern Coffee Table 01', '', 'modern_coffee_table_01'))
    mobilier.solide(s['x0'] + 1.2, (s['z0'] + s['z1']) / 2 - 0.6, s['x0'] + 1.8, (s['z0'] + s['z1']) / 2 + 0.6)
    ajouter('potted_plant_01', 'plante_repro', s['x1'] - 0.5, 0, s['z0'] + 1.4, taille=1.2, tri=9000, credit=PH_C('Potted Plant 01', '', 'potted_plant_01'))
    # --- couloirs : chaises d'attente, extincteur
    for k in range(4):
        ajouter('plastic_monobloc_chair_01', f'chaise_couloir{k}', X(640) + k * 0.6, 0, Z(CH[1]) + 0.32, ry=PI, densite=0.4,
                credit=PH_C('Plastic Monobloc Chair 01', '', 'plastic_monobloc_chair_01'))
    mobilier.solide(X(640) - 0.35, Z(CH[1]), X(640) + 2.15, Z(CH[1]) + 0.65)
    ajouter('korean_fire_extinguisher_01', 'extincteur_couloir', X(CV[0]) + 0.2, 0, Z(120), ry=PI / 2, credit=PH_C('Korean Fire Extinguisher 01', '', 'korean_fire_extinguisher_01'))
    ajouter('potted_plant_02', 'plante_couloir', X(CH[2]) - 0.5, 0, Z(CH[3]) - 0.45, taille=0.9, tri=8000, credit=PH_C('Potted Plant 02', '', 'potted_plant_02'))
    DONNEES['sondes'] += [[x, 1.4, 0.0] for x in (X(100), X(300), X(600), X(800))] + [[0.0, 1.4, z] for z in (Z(80), Z(450))]


BLOUSE = (0.86, 0.87, 0.88)
HUMAINS = {
    'AC': dict(sexe='female', age=0.2, origine='african', peau='young_african_female', cheveux='braid01', tenue='female_elegantsuit01', couleur_tenue=(0.05, 0.36, 0.42), chaussures='shoes05', taille=1.66, yeux='brown'),
    'DL': dict(sexe='female', age=0.35, origine='caucasian', peau='young_caucasian_female', cheveux='ponytail01', tenue='female_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes05', taille=1.68, yeux='bluegreen'),
    'DB': dict(sexe='male', age=0.4, origine='african', peau='middleage_african_male', cheveux='short04', tenue='male_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes02', taille=1.80, yeux='brown'),
    'DR': dict(sexe='male', age=0.62, origine='caucasian', peau='old_caucasian_male', cheveux='short01', tenue='male_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes02', taille=1.74, yeux='blue'),
    'DN': dict(sexe='female', age=0.3, origine='asian', peau='young_asian_female', cheveux='long01', tenue='female_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes05', taille=1.62, yeux='brown'),
    'DP': dict(sexe='male', age=0.25, origine='caucasian', peau='young_caucasian_male', cheveux='short02', tenue='male_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes02', taille=1.78, yeux='bluegreen'),
    'DM': dict(sexe='female', age=0.45, origine='african', peau='middleage_african_female', cheveux='afro01', tenue='female_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes05', taille=1.70, yeux='brown'),
    'CS': dict(sexe='female', age=0.45, origine='caucasian', peau='middleage_caucasian_female', cheveux='bob01', tenue='female_casualsuit02', couleur_tenue=(0.32, 0.6, 0.55), chaussures='shoes05', taille=1.70, yeux='blue'),
}


def personnes():
    """Les médecins, debout dans leur service, tournés vers la porte ; la secrétaire derrière la banque d'accueil."""
    S = DONNEES['salles']
    place = {}
    for code, (salle, etape) in personnages.SERVICES.items():
        s = S[salle]
        xm = (s['porte'][0] + s['porte'][1]) / 2
        if salle == 'hall':
            x, z, ry = s['x0'] + 1.45, s['z1'] - 1.5, PI * 0.95
        elif salle == 'bloc':
            x, z, ry = (s['x0'] + s['x1']) / 2 + 0.3, s['z1'] - 1.6, 0.15
        elif s['cote'] == 'sud':
            x, z, ry = max(s['x0'] + 0.7, min(s['x1'] - 0.7, xm + 0.4)), s['z1'] - 2.2, -0.12
        else:
            x, z, ry = max(s['x0'] + 0.7, min(s['x1'] - 0.7, xm - 0.3)), s['z0'] + 2.2, PI + 0.12
        humains.personne(code, x, z, ry, **HUMAINS[code])
        place[code] = {'p': [round(x, 3), 0.0, round(z, 3)], 'ry': round(ry, 4), 'salle': salle, 'etape': etape}
        mobilier.solide(x - 0.3, z - 0.3, x + 0.3, z + 0.3)
    DONNEES['personnes'] = place


vider()
geo.collection('piece')
materiaux()
murs()
n_lum = luminaires()
meubler()
personnes()
geo.collection('piece')
geo.reunir()
DONNEES['soleil'] = ciel()
DONNEES['solides'] = mobilier.SOLIDES
DONNEES['credits'] = accessoires.CREDITS
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 32; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = 0.0
sc.render.resolution_x, sc.render.resolution_y = 960, 540
# caméras d'aperçu
ctx = geo.collection('contexte')
for nom, (p, d) in {'couloir': ((-10.5, 1.6, 0.0), (1, -0.05, 0)), 'cyto': ((-8.0, 1.6, -2.4), (-0.6, -0.15, -1)),
                    'hall': ((3.0, 1.6, 2.2), (0.2, -0.1, 1)), 'consult': ((-4.7, 1.6, 2.0), (-0.3, -0.12, 1)),
                    'bloc': ((-3.3, 1.6, -1.8), (0.0, -0.2, -1)), 'imagerie': ((10.0, 1.6, 2.1), (0.3, -0.12, 1))}.items():
    c = bpy.data.cameras.new(nom); c.sensor_fit = 'VERTICAL'; c.angle_y = 1.1; c.clip_start = 0.04
    o = bpy.data.objects.new('cam_' + nom, c); ctx.objects.link(o)
    o.location = V(*p); o.rotation_euler = V(*Vector(d).normalized()).to_track_quat('-Z', 'Y').to_euler()
sc['atlas_A'] = ['murs', 'sol', 'plafond', 'cadres', 'menuiseries', 'chassis', 'main_courante', 'plinthes']
for ob in bpy.data.collections['piece'].objects:
    if ob.name == 'luminaires':
        ob['lumiere'] = 'sonde'        # dalles lumineuses : la page les dessine d'elles-mêmes
bpy.ops.wm.save_as_mainfile(filepath=SORTIE)
json.dump(DONNEES, open(os.path.join(os.path.dirname(SORTIE), 'hopital_donnees.json'), 'w'), ensure_ascii=False, indent=0)
nb = sum(len(o.data.polygons) for o in bpy.data.collections['piece'].objects if o.type == 'MESH')
print('HÔPITAL ENREGISTRÉ', len(bpy.data.collections['piece'].objects), 'objets,', nb, 'faces,', n_lum, 'luminaires')
