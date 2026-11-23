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
import personnages, humains, equipement
importlib.reload(humains); importlib.reload(equipement)
from equipement import Rep, boite, cyl, tube, plaque, texte
equipement.IMG = os.path.join(ICI, 'tex_img')

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
    for nom in ('vinyle', 'vinyle_bloc', 'carrelage'):
        T[nom] = {'couleur': f'{TEX_HOP}/{nom}_couleur.jpg', 'arm': f'{TEX_HOP}/{nom}_arm.jpg', 'relief': None}
        matieres.texturee(nom, nom, 1.2 if nom == 'carrelage' else 2.0, relief=0)
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
    equipement.matieres_equipement()


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
            f_s = [(x0, x1)]                                       # façade vitrée toute largeur (mur-rideau)
        couleur = 'mur_' + nom
        fond_n = couleur if r['top'] else 'mur_blanc'          # le mur face à la porte prend la couleur du service
        fond_s = couleur if not r['top'] else 'mur_blanc'
        tn = [(a, b, F_BAS, F_HAUT) for a, b in f_n] + ([] if r['top'] else porte)
        ts = [(a, b, F_BAS if nom != 'hall' else 0.0, F_HAUT if nom != 'hall' else 2.75) for a, b in f_s] + (porte if r['top'] else [])
        pan_maille(nom + '_n', 'z', z0, +1, x0, x1, 0, H, tn, fond_n, 'murs')
        pan_maille(nom + '_s', 'z', z1, -1, x0, x1, 0, H, ts, fond_s, 'murs')
        pan_maille(nom + '_o', 'x', x0, +1, z0, z1, 0, H, [(a, b, F_BAS, F_HAUT) for a, b in f_o], 'mur_blanc', 'murs')
        pan_maille(nom + '_e', 'x', x1, -1, z0, z1, 0, H, [(a, b, F_BAS, F_HAUT) for a, b in f_e], 'mur_blanc', 'murs')
        for k, (a, b) in enumerate(f_n):
            fenetre(f'{nom}_fn{k}', 'z', z0, -1, a, b)
        for k, (a, b) in enumerate(f_s):
            if nom == 'hall':
                equipement.mur_rideau('facade', x0, x1, z1, y1=2.75, porte=((x0 + x1) / 2 - 1.0, (x0 + x1) / 2 + 1.0))
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
            equipement.lisse(f'lisse_{nom}{k}', [(a, plan + sens * 0.002), (b, plan + sens * 0.002)], (0, 0, sens), y=0.92)
            pave(f'pl_{nom}{k}', a, 0.0, plan, b, 0.1, plan + sens * 0.012, 'plinthe', groupe='plinthes', chanfrein=0.002)
    # sol et plafond
    pave('sol', X(5), -0.05, Z(5), X(895), 0, Z(515), 'vinyle', chanfrein=0, groupe='sol', densite=1.0)
    for nom, mat in (('hall', 'carrelage'), ('bloc', 'vinyle_bloc')):
        r = ROOMS[nom]
        pave('sol_' + nom, X(r['x']), 0, Z(r['y']), X(r['x'] + r['w']), 0.003, Z(r['y'] + r['h']), mat, chanfrein=0, groupe='sol')
    pave('plafond', X(5), H, Z(5), X(895), H + 0.05, Z(515), 'dalles', chanfrein=0, groupe='plafond', densite=0.5)


def luminaires():
    """Dalles lumineuses encastrées (60 × 60 cm) : une lampe de surface dans chacune, pour la cuisson."""
    pos = []
    for nom, r in ROOMS.items():
        if nom == 'hall':
            continue
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


def lampe(nom, type_, x, y, z, energie, couleur=(1.0, 0.86, 0.72), vers=(0, -1, 0), cone=1.9, flou=0.8, taille=0.05):
    """Une lampe pour la cuisson (collection « contexte », jamais exportée)."""
    ctx = geo.collection('contexte')
    l = bpy.data.lights.new(nom, type_); l.energy = energie; l.color = couleur
    if type_ == 'SPOT':
        l.spot_size = cone; l.spot_blend = flou; l.shadow_soft_size = taille
    elif type_ == 'AREA':
        l.shape = 'RECTANGLE'; l.size, l.size_y = taille
    o = bpy.data.objects.new(nom, l); ctx.objects.link(o)
    o.location = V(x, y, z)
    o.rotation_euler = V(*vers).to_track_quat('-Z', 'Y').to_euler()
    geo.collection('piece')


def lumieres_hall():
    """Ambiance du hall : spots encastrés blanc chaud, lumière rasante sur les tasseaux, plafond de lames de chêne
    éclairé au-dessus de la banque, auvent éclairé dehors."""
    s = DONNEES['salles']['hall']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    for k, (x, z) in enumerate(((3.85, 2.3), (3.85, 4.3), (3.85, 6.3), (4.95, 3.3), (4.95, 5.4), (3.5, 7.6), (4.95, 7.3))):
        equipement.downlight(f'spot_hall{k}', x, z, H)
        lampe(f'spot_hall{k}', 'SPOT', x, H - 0.03, z, 55.0, cone=1.75, flou=0.85)
    for k in range(5):        # lumière rasante sur le mur de tasseaux
        z = z0 + 0.9 + k * (z1 - z0 - 1.8) / 4
        equipement.downlight(f'rasant_hall{k}', x0 + 0.16, z, H, rayon=0.045)
        lampe(f'rasant_hall{k}', 'SPOT', x0 + 0.16, H - 0.03, z, 22.0, cone=0.9, flou=0.6, vers=(-0.12, -1, 0))
    # plafond de lames de chêne au-dessus de la banque, deux lignes lumineuses dessous
    for k in range(int(3.2 / 0.1)):
        zz = 3.4 + k * 0.1
        pave(f'lame_plafond{k}', x0 + 0.25, 2.62, zz - 0.02, x0 + 2.0, 2.72, zz + 0.02, 'hetre', chanfrein=0.004, groupe='tasseaux', fil='y')
    for dx in (0.65, 1.6):
        pave(f'ligne_led{dx}', x0 + dx - 0.02, 2.605, 3.45, x0 + dx + 0.02, 2.62, 6.55, 'led_chaude', chanfrein=0, groupe='led')
        lampe(f'ligne_led{dx}', 'AREA', x0 + dx, 2.6, 5.0, 60.0, taille=(0.04, 3.0), vers=(0, -1, 0))
    # dehors : auvent et parvis
    pave('parvis', x0 - 3.0, -0.03, z1 + 0.08, x1 + 3.0, -0.01, z1 + 5.0, 'pave_ext', chanfrein=0, groupe='sol')
    pave('auvent', x0 - 0.6, 2.95, z1 + 0.08, x1 + 0.6, 3.15, z1 + 2.8, 'laque', chanfrein=0.01, groupe='meubles')
    for xx in (x0 - 0.3, x1 + 0.3):
        cyl(f'poteau{xx:.1f}', Rep(xx, z1 + 2.5), (0, 0, 0), [(0.07, 0), (0.07, 2.95), (0, 2.95)], 'alu', n=20, groupe='meubles')
    for k, xx in enumerate((x0 + 0.6, (x0 + x1) / 2, x1 - 0.6)):
        equipement.downlight(f'spot_auvent{k}', xx, z1 + 1.4, 2.95)
        lampe(f'spot_auvent{k}', 'SPOT', xx, 2.92, z1 + 1.4, 40.0, cone=1.6)


def ciel():
    sc = bpy.context.scene
    w = bpy.data.worlds.new('ciel'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; fond = nt.nodes['Background']
    s = nt.nodes.new('ShaderNodeTexSky'); s.sky_type = 'NISHITA'; s.sun_disc = False
    sol = Vector((0.45, 0.55, 0.7)).normalized()          # soleil du sud-est, en milieu de matinée
    s.sun_elevation = math.asin(sol.y)
    nt.links.new(s.outputs['Color'], fond.inputs['Color']); fond.inputs['Strength'].default_value = 0.4
    ctx = geo.collection('contexte')
    l = bpy.data.lights.new('soleil', 'SUN'); l.energy = 4.0; l.angle = math.radians(1.5); l.color = (1.0, 0.95, 0.88)
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


def logo(r, c, R, nom):
    """Logo de l'hôpital : une croix blanche sur un disque sarcelle, en relief."""
    x, y, z = c
    cyl(nom + '_disque', r, (x, y, z), [(0, 0), (R, 0), (R, 0.012), (0, 0.012)], 'sarcelle', n=48, axe='z', groupe='logo_plaque')
    for (w, h) in ((R * 0.36, R * 1.2), (R * 1.2, R * 0.36)):
        boite(f'{nom}_croix{w:.2f}', r, (x, y, z + 0.016), (w, h, 0.008), 'laque', ch=0.003, groupe='logo_plaque')


def mur_rep(s, cote, t, y=0.0):
    """Repère posé sur la face intérieure d'un mur de la salle s, tourné vers la pièce. cote : n, s, o, e ; t : position le long du mur."""
    if cote == 'n':
        return Rep(t, s['z0'], 0.0, y)
    if cote == 's':
        return Rep(t, s['z1'], PI, y)
    if cote == 'o':
        return Rep(s['x0'], t, PI / 2, y)
    return Rep(s['x1'], t, -PI / 2, y)


def accrocher(nom, s, cote, t, y, w, h, img):
    equipement.cadre_affiche(nom, mur_rep(s, cote, t), (0, y, 0.002), w, h, img)


def ajouter_ph(src, nom, x, y, z, ry=0.0, titre=None, **kw):
    ajouter(src, nom, x, y, z, ry=ry, credit=PH_C(titre or src.replace('_', ' ').title(), '', src), **kw)


def meubler():
    S = DONNEES['salles']
    E = equipement
    # ------------------------------------------------ hall d'accueil
    s = S['hall']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    xb = x0 + 1.2                                     # axe de la banque (façade vers l'est, en x = x0 + 1.65)
    rb = Rep(xb, 5.0, PI / 2)
    E.banque_accueil('banque', rb, L=2.8, P=0.9)
    mobilier.solide(xb - 0.45, 3.55, xb + 0.5, 6.45)
    texte('lettres_accueil', 'Accueil', rb, (0.3, 0.68, 0.48), 0.2, 0.02, 'laque', groupe='lettres')
    logo(rb, (-0.58, 0.68, 0.47), 0.13, 'logo_accueil')
    poste_r = Rep(xb - 0.25, 5.0, -PI / 2)
    E.poste('pc_accueil1', poste_r, -0.5, 0.75, 0.0, img='ecran_dossier')
    E.poste('pc_accueil2', poste_r, 0.65, 0.75, 0.05, img='ecran_dossier')
    boite('telephone_accueil', poste_r, (0.1, 0.785, 0.2), (0.18, 0.06, 0.2), 'anthracite', ch=0.015, seg=2, groupe='petits')
    E.chaise_bureau('chaise_accueil', x0 + 0.42, 4.15, PI / 2)
    # mur de tasseaux de chêne derrière la banque, nom du pôle et logo au-dessus de la secrétaire
    for k in range(int((z1 - z0 - 0.6) / 0.08)):
        zz = z0 + 0.3 + k * 0.08
        pave(f'tasseau_mur{k}', x0, 0.1, zz - 0.022, x0 + 0.035, H - 0.02, zz + 0.022, 'hetre', chanfrein=0.003, groupe='tasseaux', fil='y')
    rmur = mur_rep(s, 'o', 5.0)
    texte('lettres_pole', 'Pôle Femme-Enfant', rmur, (0.2, 2.2, 0.04), 0.17, 0.015, 'laque', groupe='lettres')
    logo(rmur, (-1.35, 2.2, 0.04), 0.2, 'logo_mur')
    # attente à l'est : sièges, table basse, écran d'information, fontaine, plantes
    E.chaises_attente('attente_hall', x1 - 0.42, 3.75, -PI / 2, n=3)
    ajouter_ph('modern_coffee_table_01', 'table_hall', x1 - 1.15, 0, 3.75, ry=PI / 2, taille=0.9)
    mobilier.solide(x1 - 1.45, 3.4, x1 - 0.85, 4.1)
    E.ecran_plat('tv_hall', mur_rep(s, 'n', x1 - 0.75), (0, 1.85, 0.05), 0.98, 0.55, 'ecran_tv', pied=False, epaisseur=0.05)
    E.fontaine('fontaine_hall', x1 - 0.3, 5.6, -PI / 2)
    ajouter_ph('potted_plant_04', 'plante_hall1', x1 - 0.42, 0, 2.05, taille=1.7, tri=9000)
    mobilier.solide(x1 - 0.8, 1.6, x1, 2.5)
    ajouter_ph('potted_plant_01', 'plante_hall2', x0 + 0.45, 0, z1 - 0.55, taille=1.5, tri=9000)
    ajouter_ph('potted_plant_02', 'plante_hall3', x0 + 0.45, 0, 2.0, taille=1.1, tri=8000)
    mobilier.solide(x0, z1 - 1.0, x0 + 0.9, z1); mobilier.solide(x0, 1.4, x0 + 0.8, 2.4)
    # entrée : borne, tapis de propreté, plan « Vous êtes ici » ; ligne de guidage au sol jusqu'au couloir
    E.borne('borne_hall', x1 - 0.45, z1 - 1.0, -PI / 2 - 0.5)
    pave('tapis_entree', 2.6, 0.003, z1 - 1.3, 4.4, 0.008, z1 - 0.05, 'tapis_propre', chanfrein=0.002, groupe='sol')
    pave('ligne_sol', 3.46, 0.003, z0 - 0.6, 3.54, 0.0045, z1 - 1.4, 'sarcelle', chanfrein=0, groupe='sol')
    pave('ligne_couloir', -0.04, 0.003, -0.04, 3.54, 0.0045, 0.04, 'sarcelle', chanfrein=0, groupe='sol')
    accrocher('plan_hall', s, 'e', 6.6, 1.5, 1.05, 0.7, 'plan_hall')
    accrocher('mains_hall', s, 'n', x0 + 0.9, 1.5, 0.42, 0.56, 'affiche_mains')
    E.distributeur('gel_hall', mur_rep(s, 'n', x0 + 1.55), 0, 1.2, 0)
    ajouter_ph('wall_clock', 'horloge_hall', x1 - 0.75, 2.5, z0 + 0.02, ry=0.0, ancre='centre')
    DONNEES['interactifs'] = [
        {'id': 'borne', 'nom': "la borne d'accueil", 'p': [x1 - 0.45, 1.25, z1 - 1.0]},
        {'id': 'plan', 'nom': 'le plan du rez-de-chaussée', 'p': [x1 - 0.02, 1.5, 6.6]},
        {'id': 'tv', 'nom': "l'écran d'information", 'p': [x1 - 0.75, 1.85, z0 + 0.05]},
        {'id': 'gel', 'nom': 'le gel hydro-alcoolique', 'p': [x0 + 1.55, 1.2, z0 + 0.06]},
        {'id': 'fontaine', 'nom': 'la fontaine à eau', 'p': [x1 - 0.3, 0.9, 5.6]},
        {'id': 'sortie', 'nom': "les portes de l'entrée", 'p': [(x0 + x1) / 2, 1.1, z1 - 0.05]},
    ]

    # ------------------------------------------------ consultations (Dr Lefèvre)
    s = S['consult']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    xm = (x0 + x1) / 2
    b = E.bureau('bureau_consult', xm + 0.9, z1 - 1.3, PI)
    E.poste('pc_consult', b, -0.2, 0.75, -0.05, img='ecran_dossier')
    boite('dossiers_consult', b, (0.5, 0.79, 0.1), (0.3, 0.08, 0.24), 'plastique_bleu', ch=0.004, groupe='petits')
    E.chaise_bureau('chaise_dl', xm + 0.9, z1 - 0.55, PI)
    for k, dx in enumerate((0.45, 1.35)):
        E.chaise_bureau(f'chaise_patient{k}', xm + dx, z1 - 2.05, 0.15 - k * 0.3, tissu='tissu_sarcelle')
    E.table_examen('examen_consult', x0 + 0.55, (z0 + z1) / 2 + 0.9, ry=PI / 2)
    accrocher('affiche_appareil', s, 'o', (z0 + z1) / 2 + 0.9, 1.65, 1.5, 1.0, 'affiche_appareil')
    E.paillasse_labo('consult_evier', x1 - 0.6, x1, z0 + 1.6, z0 + 3.0, dos=x1, etagere=False, mat_dessus='stratifie')
    cyl('evier_consult', Rep(x1 - 0.3, z0 + 2.3), (0, 0.885, 0), [(0.0, 0.0), (0.17, 0.0), (0.19, 0.016), (0.2, 0.016), (0.0, 0.017)], 'inox_brosse', n=24, groupe='inox')
    tube('robinet_consult', [Rep(x1 - 0.06, z0 + 2.3).p(0, 0.9, 0), Rep(x1 - 0.06, z0 + 2.3).p(0, 1.15, 0), Rep(x1 - 0.06, z0 + 2.3).p(-0.2, 1.15, 0),
                             Rep(x1 - 0.06, z0 + 2.3).p(-0.22, 1.08, 0)], 0.012, 'chrome', groupe='inox')
    E.distributeur('gel_consult', mur_rep(s, 'e', z0 + 1.6), 0, 1.25, 0)
    accrocher('mains_consult', s, 'e', z0 + 2.9, 1.65, 0.36, 0.48, 'affiche_mains')
    E.armoire_vitree('armoire_consult', x1 - 0.25, z1 - 1.6, -PI / 2, L=1.0, H=1.9, P=0.4)
    mobilier.solide(x1 - 0.5, z1 - 2.15, x1, z1 - 1.05)
    ajouter_ph('potted_plant_02', 'plante_consult', x0 + 0.45, 0, z1 - 0.45, taille=1.0, tri=8000)
    E.potence('tensio_consult', x0 + 1.4, (z0 + z1) / 2 - 0.4)

    # ------------------------------------------------ cytogénétique (Dr Benali)
    s = S['cyto']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    rp = E.paillasse_labo('cyto_mur', x0 + 0.3, x1 - 1.4, z0, z0 + 0.75, dos=z0)
    for k, dx in enumerate((-3.0, -0.6, 1.8)):
        E.microscope(f'microscope_cyto{k}', rp, dx, 0.9, 0.05)
        E.ecran_plat(f'caryo_cyto{k}', rp, (dx + 0.6, 0.9 + 0.31 + 0.15, -0.12), 0.53, 0.3, 'ecran_caryotype')
        E.chaise_bureau(f'tabouret_cyto{k}', x0 + 0.3 + (x1 - 1.4 - x0 - 0.3) / 2 + dx + 0.2, z0 + 1.15, 0.0)
    E.portoir('portoir_cyto0', rp, 3.0, 0.9, 0.1)
    E.pipette('pipette_cyto0', rp, 3.3, 0.9, 0.15)
    rp2 = E.paillasse_labo('cyto_ilot', x0 + 2.0, x1 - 3.4, (z0 + z1) / 2 - 0.45, (z0 + z1) / 2 + 0.45)
    E.centrifugeuse('centri_cyto', rp2, -1.2, 0.9, 0.0)
    for k, dx in enumerate((-0.3, 0.1, 0.5)):
        E.portoir(f'portoir_ilot{k}', rp2, dx, 0.9, -0.15 + k * 0.08, n=10)
    E.pipette('pipette_cyto1', rp2, 0.9, 0.9, 0.1, a=-0.3)
    E.poste('pc_cyto', rp2, 1.5, 0.9, -0.1, img='ecran_caryotype')
    E.poste_securite('psm_cyto', x0 + 0.45, z1 - 1.6, PI / 2, L=1.4)
    E.armoire_vitree('armoire_cyto1', x1 - 0.25, z0 + 1.2, -PI / 2, L=1.0, H=2.0)
    E.armoire_vitree('armoire_cyto2', x1 - 0.25, z0 + 2.25, -PI / 2, L=1.0, H=2.0)
    mobilier.solide(x1 - 0.5, z0 + 0.65, x1, z0 + 2.8)
    accrocher('adn_cyto', s, 's', x0 + 2.2, 1.65, 1.2, 0.9, 'affiche_adn')
    E.distributeur('gel_cyto', mur_rep(s, 's', x0 + 6.6), 0, 1.25, 0)
    ajouter_ph('korean_fire_extinguisher_01', 'extincteur_cyto', x1 - 0.25, 0, z1 - 0.4, ry=-PI / 2)

    # ------------------------------------------------ bloc opératoire (Dr Vasseur)
    s = S['bloc']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    xm = (x0 + x1) / 2
    E.table_operation('table_bloc', xm - 0.1, z0 + 2.9, ry=PI / 2)
    E.scialytique('scialytique', xm - 0.1, z0 + 2.9, H, coupoles=((-0.45, 0.3, 1.85), (0.5, -0.25, 1.95)))
    E.bras_plafonnier('bras_bloc', x1 - 1.5, z0 + 2.25, H)
    E.respirateur('respirateur', x1 - 0.9, z0 + 1.0, ry=-PI / 2 - 0.3)
    E.chariot_instruments('instruments1', x0 + 0.65, z0 + 3.4, ry=PI / 2)
    E.chariot_instruments('instruments2', xm + 0.9, z0 + 4.4, ry=0.2)
    mobilier.solide(x0 + 0.35, z0 + 2.95, x0 + 0.95, z0 + 3.85); mobilier.solide(xm + 0.45, z0 + 4.1, xm + 1.35, z0 + 4.7)
    E.potence('perfusion_bloc', xm - 0.75, z0 + 1.6)
    E.armoire_vitree('armoire_bloc1', x0 + 0.25, z0 + 0.9, PI / 2, L=1.0, H=2.1)
    E.armoire_vitree('armoire_bloc2', x0 + 0.25, z0 + 1.95, PI / 2, L=1.0, H=2.1)
    mobilier.solide(x0, z0 + 0.35, x0 + 0.5, z0 + 2.5)
    ajouter_ph('metal_trash_can', 'poubelle_bloc', x1 - 0.3, 0, z1 - 1.0, taille=0.55)
    accrocher('consigne_bloc', s, 's', x0 + 0.75, 1.6, 0.6, 0.4, 'affiche_bloc')
    E.distributeur('gel_bloc', mur_rep(s, 's', x1 - 0.4), 0, 1.25, 0)

    # ------------------------------------------------ endocrinologie (Dr Roche)
    s = S['endo']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    rp = E.paillasse_labo('endo_mur', x0 + 0.3, x1 - 0.3, z0, z0 + 0.7, dos=z0)
    E.centrifugeuse('centri_endo', rp, -1.9, 0.9, 0.0)
    for k in range(3):
        E.portoir(f'portoir_endo{k}', rp, -0.9 + k * 0.35, 0.9, 0.05 + (k % 2) * 0.1)
    E.poste('pc_endo', rp, 1.5, 0.9, -0.05, img='ecran_dossier')
    E.chaise_bureau('chaise_endo', x0 + 0.3 + (x1 - x0 - 0.6) / 2 + 1.5, z0 + 1.15, 0.0)
    b = E.bureau('bureau_endo', x1 - 1.2, (z0 + z1) / 2 + 0.5, -PI / 2, L=1.5)
    E.poste('pc_endo2', b, 0.0, 0.75, -0.05)
    E.chaise_bureau('chaise_endo2', x1 - 0.5, (z0 + z1) / 2 + 0.5, -PI / 2)
    E.chaise_bureau('fauteuil_prelevement', x0 + 1.2, z1 - 2.2, 0.6, tissu='tissu_sarcelle')
    accrocher('glandes_endo', s, 'o', (z0 + z1) / 2, 1.6, 0.75, 1.0, 'affiche_hormones')
    E.armoire_vitree('armoire_endo', x0 + 0.25, z0 + 2.0, PI / 2, L=0.9, H=1.9)
    mobilier.solide(x0, z0 + 1.5, x0 + 0.5, z0 + 2.5)
    E.distributeur('gel_endo', mur_rep(s, 's', x0 + 0.5), 0, 1.25, 0)

    # ------------------------------------------------ génétique (Dr Nguyen)
    s = S['gene']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    rp = E.paillasse_labo('gene_mur', x0 + 0.3, x1 - 0.3, z0, z0 + 0.7, dos=z0)
    boite('sequenceur', rp, (-2.0, 0.9 + 0.3, -0.02), (0.9, 0.6, 0.6), 'laque', ch=0.04, seg=3, groupe='meubles')
    boite('sequenceur_porte', rp, (-2.15, 1.2, 0.282), (0.5, 0.45, 0.02), 'anthracite', ch=0.01, seg=2, groupe='meubles')
    boite('sequenceur_vitre', rp, (-2.15, 1.25, 0.293), (0.4, 0.3, 0.004), 'verre_appareil', ch=0, groupe='verre')
    boite('sequenceur_led', rp, (-1.7, 1.42, 0.282), (0.16, 0.02, 0.01), 'led_sarcelle', ch=0, groupe='led')
    E.ecran_plat('ecran_seq', rp, (-1.75, 1.22, 0.29), 0.2, 0.13, 'ecran_dossier', pied=False)
    E.poste('pc_gene1', rp, 0.0, 0.9, -0.05, img='ecran_electro')
    E.poste('pc_gene2', rp, 1.6, 0.9, -0.05, img='ecran_caryotype')
    for k, dx in enumerate((0.0, 1.6)):
        E.chaise_bureau(f'chaise_gene{k}', x0 + 0.3 + (x1 - x0 - 0.6) / 2 + dx, z0 + 1.15, 0.0)
    E.portoir('portoir_gene', rp, 0.8, 0.9, 0.1)
    E.poste_securite('psm_gene', x1 - 0.45, z1 - 1.25, -PI / 2, L=1.3)
    accrocher('adn_gene', s, 'o', (z0 + z1) / 2, 1.65, 1.2, 0.9, 'affiche_adn')
    E.armoire_vitree('armoire_gene', x0 + 0.25, z1 - 1.4, PI / 2, L=1.0, H=2.0)
    mobilier.solide(x0, z1 - 1.95, x0 + 0.5, z1 - 0.85)

    # ------------------------------------------------ imagerie (Dr Petit) : salle d'échographie, et derrière sa vitre, le scanner
    s = S['imagerie']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    xp = x1 - 3.2                                     # cloison vitrée du scanner
    zo = z0 + 1.6                                     # passage vers le scanner (au nord de la cloison)
    pave('cloison_bas', xp - 0.06, 0, zo + 1.1, xp + 0.06, 0.95, z1, 'mur_imagerie', groupe='murs', chanfrein=0.003)
    pave('cloison_haut', xp - 0.06, 2.25, zo + 1.1, xp + 0.06, H, z1, 'mur_blanc', groupe='murs', chanfrein=0.003)
    pave('cloison_tete', xp - 0.06, 0, zo, xp + 0.06, H, zo + 0.08, 'cadre', groupe='cadres', chanfrein=0.003)
    pave('cloison_linteau', xp - 0.06, 2.2, zo, xp + 0.06, H, zo + 1.1, 'mur_blanc', groupe='murs', chanfrein=0.003)
    for zz in (zo + 1.1, zo + 2.8, zo + 4.5, z1 - 0.03):
        pave(f'cloison_montant{zz:.1f}', xp - 0.05, 0.95, zz - 0.03, xp + 0.05, 2.25, zz + 0.03, 'alu', groupe='chassis', chanfrein=0.003)
    for yy in (0.95, 2.25):
        pave(f'cloison_traverse{yy}', xp - 0.05, yy - 0.025, zo + 1.1, xp + 0.05, yy + 0.025, z1, 'alu', groupe='chassis', chanfrein=0.003)
    pave('cloison_vitre', xp - 0.004, 0.97, zo + 1.12, xp + 0.004, 2.23, z1 - 0.05, 'verre', groupe='verre', chanfrein=0, cuire=0)
    mobilier.solide(xp - 0.08, zo + 1.1, xp + 0.08, z1)
    E.scanner('scanner', x1 - 1.6, z0 + 2.3, ry=-PI / 2)
    E.ecran_plat('ecran_scanner_mur', mur_rep(s, 'e', z0 + 6.1), (0, 1.6, 0.05), 0.9, 0.5, 'ecran_scanner', pied=False, epaisseur=0.04)
    # console de commande, côté échographie, face à la vitre
    b = E.bureau('console_scanner', xp - 0.5, (zo + 1.1 + z1) / 2 + 0.4, -PI / 2, L=2.2, P=0.75)
    for k, dz in enumerate((-0.65, 0.0, 0.65)):
        E.poste(f'pc_scanner{k}', b, dz, 0.75, -0.1, img='ecran_scanner' if k != 1 else 'ecran_dossier', clavier=(k == 1))
    E.chaise_bureau('chaise_scanner', xp - 1.3, (zo + 1.1 + z1) / 2 + 0.4, PI / 2)
    # échographie : divan, échographe, écran de la patiente, bureau
    E.table_examen('examen_echo', x0 + 1.9, z1 - 1.25, ry=0.0, skai='nuit_skai')
    E.echographe('echographe', x0 + 3.4, z1 - 1.2, ry=-PI / 2 - 0.35)
    E.ecran_plat('ecran_patiente', mur_rep(s, 's', x0 + 1.9), (0, 1.75, 0.05), 0.9, 0.5, 'ecran_echo', pied=False, epaisseur=0.04)
    E.chaise_bureau('tabouret_echo', x0 + 3.3, z1 - 2.0, -PI / 2 - 0.4)
    b = E.bureau('bureau_imagerie', x0 + 1.0, z0 + 1.7, PI / 2, L=1.4)
    E.poste('pc_imagerie', b, 0.0, 0.75, -0.05, img='ecran_echo')
    E.chaise_bureau('chaise_imagerie', x0 + 1.75, z0 + 1.7, PI / 2)
    E.distributeur('gel_imagerie', mur_rep(s, 'n', x0 + 2.6), 0, 1.25, 0)
    ajouter_ph('wheelchair_01', 'fauteuil_roulant', xp - 0.6, z0 + 0.9, ry=-2.2, tri=9000) if False else None
    ajouter_ph('potted_plant_02', 'plante_imagerie', x0 + 0.45, 0, z1 - 0.4, taille=0.9, tri=8000)

    # ------------------------------------------------ médecine de la reproduction (Dr Morel)
    s = S['repro']
    x0, x1, z0, z1 = s['x0'], s['x1'], s['z0'], s['z1']
    xm = (x0 + x1) / 2
    b = E.bureau('bureau_repro', xm + 0.9, z1 - 1.3, PI)
    E.poste('pc_repro', b, -0.2, 0.75, -0.05)
    E.microscope('microscope_repro', b, 0.45, 0.75, 0.05)
    E.chaise_bureau('chaise_dm', xm + 0.9, z1 - 0.55, PI)
    for k, dx in enumerate((0.45, 1.35)):
        E.chaise_bureau(f'chaise_couple{k}', xm + dx, z1 - 2.05, 0.15 - k * 0.3, tissu='tissu_sarcelle')
    ajouter_ph('sofa_02', 'canape_repro', x0 + 0.5, 0, (z0 + z1) / 2, ry=PI / 2, taille=1.9)
    mobilier.solide(x0, (z0 + z1) / 2 - 1.0, x0 + 0.95, (z0 + z1) / 2 + 1.0)
    ajouter_ph('modern_coffee_table_01', 'table_basse_repro', x0 + 1.5, 0, (z0 + z1) / 2, ry=0.0, taille=0.9)
    mobilier.solide(x0 + 1.15, (z0 + z1) / 2 - 0.45, x0 + 1.85, (z0 + z1) / 2 + 0.45)
    ajouter_ph('potted_plant_01', 'plante_repro', x1 - 0.5, 0, z0 + 1.4, taille=1.3, tri=9000)
    accrocher('appareil_repro', s, 'e', z0 + 2.4, 1.65, 1.2, 0.8, 'affiche_appareil')
    E.armoire_vitree('armoire_repro', x1 - 0.25, z1 - 1.6, -PI / 2, L=1.0, H=1.9, P=0.4)
    mobilier.solide(x1 - 0.5, z1 - 2.15, x1, z1 - 1.05)

    # ------------------------------------------------ couloirs : signalétique, sièges, chariot, extincteurs, distributeurs
    yh = 2.5
    E.panneau_suspendu('signal_croisement', 2.2, 0.0, 0.0, 1.5, 0.39, 'signal_croisement', yh, H, deux_faces=False)
    E.panneau_suspendu('signal_ouest', X(CH[0]) + 4.0, 0.0, -PI / 2, 1.4, 0.14, 'signal_ouest', yh, H, deux_faces=False)
    E.panneau_suspendu('signal_est', X(CH[2]) - 4.0, 0.0, PI / 2, 1.4, 0.14, 'signal_est', yh, H, deux_faces=False)
    E.chaises_attente('attente_couloir', X(640), Z(CH[1]) + 0.36, PI, n=3)
    E.chaises_attente('attente_couloir2', X(200), Z(CH[3]) - 0.36, 0.0, n=3)
    ajouter_ph('korean_fire_extinguisher_01', 'extincteur_couloir', X(CV[0]) + 0.2, 0, Z(120), ry=PI / 2)
    ajouter_ph('potted_plant_02', 'plante_couloir', X(CH[2]) - 0.5, 0, Z(CH[3]) - 0.45, taille=0.9, tri=8000)
    for k, xx in enumerate((X(250), X(700))):
        E.distributeur(f'gel_couloir{k}', Rep(xx, Z(CH[1]), 0.0), 0, 1.25, 0)
    E.potence('potence_couloir', X(860), Z(CH[1]) + 0.3)
    DONNEES['sondes'] += [[x, 1.4, 0.0] for x in (X(100), X(300), X(600), X(800))] + [[0.0, 1.4, z] for z in (Z(80), Z(450))]


def portes():
    """Battants des portes de service, modelés autour de leur charnière (la page les fait pivoter)."""
    for nom, s in DONNEES['salles'].items():
        if nom == 'hall':
            continue
        equipement.porte_battant(nom, s['porte'][0], s['porte'][1], s['z_porte'], s['cote'])


BLOUSE = (0.86, 0.87, 0.88)
HUMAINS = {
    'AC': dict(sexe='female', age=0.2, origine='african', peau='young_african_female', cheveux='braid01', tenue='female_elegantsuit01', couleur_tenue=(0.05, 0.36, 0.42), chaussures='shoes05', taille=1.66, yeux='brown'),
    'DL': dict(sexe='female', age=0.35, origine='caucasian', peau='young_caucasian_female', cheveux='ponytail01', tenue='female_casualsuit01', couleur_tenue=BLOUSE, chaussures='shoes05', taille=1.68, yeux='bluegreen'),
    'DB': dict(sexe='male', age=0.4, origine='african', peau='middleage_african_male', cheveux='short04', tenue='male_casualsuit06', couleur_tenue=BLOUSE, chaussures='shoes02', taille=1.80, yeux='brown'),
    'DR': dict(sexe='male', age=0.62, origine='caucasian', peau='old_caucasian_male', cheveux='short01', tenue='male_elegantsuit01', couleur_tenue=BLOUSE, chaussures='shoes02', taille=1.74, yeux='blue'),
    'DN': dict(sexe='female', age=0.3, origine='asian', peau='young_asian_female', cheveux='long01', tenue='female_casualsuit01', couleur_tenue=BLOUSE, chaussures='shoes05', taille=1.62, yeux='brown'),
    'DP': dict(sexe='male', age=0.25, origine='caucasian', peau='young_caucasian_male', cheveux='short02', tenue='male_casualsuit01', couleur_tenue=BLOUSE, chaussures='shoes02', taille=1.78, yeux='bluegreen'),
    'DM': dict(sexe='female', age=0.45, origine='african', peau='middleage_african_female', cheveux='afro01', tenue='female_casualsuit01', couleur_tenue=BLOUSE, chaussures='shoes05', taille=1.70, yeux='brown'),
    'CS': dict(sexe='female', age=0.45, origine='caucasian', peau='middleage_caucasian_female', cheveux='bob01', tenue='female_casualsuit01', couleur_tenue=(0.32, 0.6, 0.55), chaussures='shoes05', taille=1.70, yeux='blue'),
}


def personnes():
    """Les médecins, debout dans leur service, tournés vers la porte ; la secrétaire derrière la banque d'accueil."""
    S = DONNEES['salles']
    place = {}
    for code, (salle, etape) in personnages.SERVICES.items():
        s = S[salle]
        xm = (s['porte'][0] + s['porte'][1]) / 2
        if salle == 'hall':
            x, z, ry = s['x0'] + 0.42, 5.0, PI / 2
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
lumieres_hall()
meubler()
portes()
personnes()
geo.collection('piece')
geo.reunir()
DONNEES['soleil'] = ciel()
DONNEES['solides'] = mobilier.SOLIDES
DONNEES['couloirs'] = [[X(CH[0]), Z(CH[1]), X(CH[2]), Z(CH[3])], [X(CV[0]), Z(CV[1]), X(CV[2]), Z(CV[3])]]   # où l'on marche, hors des salles
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
sc['atlas_A'] = ['murs', 'sol', 'plafond', 'cadres', 'menuiseries', 'chassis', 'lisses', 'plinthes']
SONDE = ('luminaires', 'petits', 'chaises', 'inox', 'verre', 'led', 'signaletique', 'clavier', 'lettres', 'logo_plaque')
for ob in bpy.data.collections['piece'].objects:
    if ob.name in SONDE or ob.name.startswith(('ecran_', 'battant_', 'medecin_')) or ob.get('lumiere') == 'sonde':
        ob['lumiere'] = 'sonde'        # dalles lumineuses et écrans : la page les dessine d'elles-mêmes ; petits objets : sondes
bpy.ops.wm.save_as_mainfile(filepath=SORTIE)
json.dump(DONNEES, open(os.path.join(os.path.dirname(SORTIE), 'hopital_donnees.json'), 'w'), ensure_ascii=False, indent=0)
nb = sum(len(o.data.polygons) for o in bpy.data.collections['piece'].objects if o.type == 'MESH')
print('HÔPITAL ENREGISTRÉ', len(bpy.data.collections['piece'].objects), 'objets,', nb, 'faces,', n_lum, 'luminaires')
