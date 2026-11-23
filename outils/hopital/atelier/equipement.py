# Équipement de l'hôpital, modelé pièce par pièce (aucun modèle médical libre de droits n'existe en CC0) :
# chaque appareil est assemblé de ses vraies parties (piètement, vérin, carénage, articulations, écrans allumés,
# poignées, roulettes…), aux dimensions des appareils réels.
# Repère de la page : x vers l'est, y vers le haut, z vers le sud ; un objet « regarde » son +z local.
import bpy, bmesh, math, os
from mathutils import Vector, Matrix
import geo, matieres, mobilier
from geo import V, P, tour, objet, uv_boite, PI, TAU

IMG = None          # dossier des images (affiches, écrans) : réglé par hopital.py
FONTE = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'


# ------------------------------------------------------------------ repères et primitives
class Rep:
    """Repère local : origine (x, y, z) de la page, tourné de ry autour de la verticale."""
    def __init__(s, x=0.0, z=0.0, ry=0.0, y=0.0, M=None):
        s.o = Vector((x, y, z))
        s.R = M if M is not None else Matrix.Rotation(ry, 3, 'Y')

    def p(s, dx, dy, dz):
        return s.o + s.R @ Vector((dx, dy, dz))

    def d(s, v):
        return s.R @ Vector(v)

    def sous(s, dx, dy, dz, ry=0.0, rx=0.0, rz=0.0):
        r = Rep()
        r.o = s.p(dx, dy, dz)
        r.R = s.R @ Matrix.Rotation(ry, 3, 'Y') @ Matrix.Rotation(rx, 3, 'X') @ Matrix.Rotation(rz, 3, 'Z')
        return r


def boite(nom, r, c, dim, mat, ch=0.004, seg=1, groupe='meubles', lisse=None, **props):
    """Pavé centré en c (repère r), de dimensions dim, aux arêtes adoucies."""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        l = Vector((v.co.x * dim[0], v.co.y * dim[1], v.co.z * dim[2]))
        v.co = V(*r.p(c[0] + l.x, c[1] + l.y, c[2] + l.z))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    m = min(dim)
    if ch > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(ch, m * 0.45), segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
    uv_boite(bm)
    return objet(nom, bm, [mat], groupe=groupe, uv=False, lisse=lisse if lisse is not None else (40 if seg > 1 else None), **props)


def cyl(nom, r, c, profil, mat, n=24, groupe='meubles', axe='y', lisse=50, **props):
    """Pièce tournée (profil [(rayon, hauteur)…]) autour de l'axe local voulu, posée en c."""
    M = {'y': Matrix.Identity(3), 'x': Matrix.Rotation(-PI / 2, 3, 'Z'), 'z': Matrix.Rotation(PI / 2, 3, 'X')}[axe] if isinstance(axe, str) else axe
    return tour(nom, profil, mat, centre=tuple(r.p(*c)), n=n, groupe=groupe, axe=r.R @ M, lisse=lisse, **props)


def tube(nom, pts, rayon, mat, n=10, groupe='inox', ferme=True, lisse=60, **props):
    """Tube le long d'une suite de points de la page (repères transportés : pas de torsion)."""
    bm = bmesh.new()
    pts = [Vector(p) for p in pts]
    T = [(pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(len(pts))]
    a = Vector((0, 1, 0)) if abs(T[0].y) < 0.9 else Vector((1, 0, 0))
    Nv = (a - T[0] * a.dot(T[0])).normalized()
    anneaux = []
    for i, p in enumerate(pts):
        if i:
            Nv = (Nv - T[i] * Nv.dot(T[i])).normalized()
        B = T[i].cross(Nv)
        anneaux.append([bm.verts.new(V(*(p + (Nv * math.cos(k / n * TAU) + B * math.sin(k / n * TAU)) * rayon))) for k in range(n)])
    for i in range(len(anneaux) - 1):
        for k in range(n):
            bm.faces.new([anneaux[i][k], anneaux[i][(k + 1) % n], anneaux[i + 1][(k + 1) % n], anneaux[i + 1][k]])
    if ferme:
        bm.faces.new(anneaux[0]); bm.faces.new(anneaux[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return objet(nom, bm, [mat], groupe=groupe, lisse=lisse, **props)


def courbe(p0, p1, p2, n=12):
    """Points d'une courbe de Bézier quadratique (câbles, tuyaux)."""
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    return [p0 * (1 - t) ** 2 + p1 * 2 * t * (1 - t) + p2 * t * t for t in (k / n for k in range(n + 1))]


def plaque(nom, r, c, w, h, mat, groupe=None, **props):
    """Rectangle w × h, centré en c, tourné vers le +z local, coordonnées de texture de 0 à 1 (image entière)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new(V(*r.p(c[0] + u * w, c[1] + v * h, c[2]))) for (u, v) in ((-.5, -.5), (.5, -.5), (.5, .5), (-.5, .5))]
    f = bm.faces.new(vs)
    for l, t in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        l[uv].uv = t
    f.normal_update()
    if f.normal.dot(V(*r.d((0, 0, 1)))) < 0:
        f.normal_flip()
        for l, t in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            pass
    ob = objet(nom, bm, [mat], groupe=groupe or nom, uv=False, **props)
    # le retournement a pu inverser l'ordre des coins : on recale les coordonnées de texture sur la position
    me = ob.data; uvl = me.uv_layers[0]
    ax, ay = r.d((1, 0, 0)), r.d((0, 1, 0))
    o = r.p(*c)
    for poly in me.polygons:
        for li in poly.loop_indices:
            q = Vector(P(me.vertices[me.loops[li].vertex_index].co)) - o
            uvl.data[li].uv = (q.dot(ax) / w + 0.5, q.dot(ay) / h + 0.5)
    return ob


def texte(nom, chaine, r, c, taille, prof, mat, groupe=None, **props):
    """Lettres en relief (police Inter), centrées en c, face au +z local."""
    cu = bpy.data.curves.new(nom, 'FONT')
    cu.body = chaine; cu.font = bpy.data.fonts.load(FONTE, check_existing=True)
    cu.size = taille; cu.extrude = prof / 2; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.resolution_u = 6
    tmp = bpy.data.objects.new(nom + '_tmp', cu); bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp, do_unlink=True)
    bm = bmesh.new(); bm.from_mesh(me)
    for v in bm.verts:
        v.co = V(*r.p(c[0] + v.co.x, c[1] + v.co.y, c[2] + v.co.z + prof / 2))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return objet(nom, bm, [mat], groupe=groupe or nom, **props)


# ------------------------------------------------------------------ matières
def image(nom, fichier, rugosite=0.5, ecran=False, force=1.0):
    """Matière portant une image entière (affiche, écran). Un écran émet sa propre lumière."""
    if nom in bpy.data.materials:
        return bpy.data.materials[nom]
    m = bpy.data.materials.new(nom); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(os.path.join(IMG, fichier), check_existing=True)
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rugosite
    if ecran:
        nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = force
        b.inputs['Base Color'].default_value = (0, 0, 0, 1)
        nt.links.remove(b.inputs['Base Color'].links[0])
        m['ecran'] = 1
    return m


def matieres_equipement():
    lin = matieres.lin
    u = matieres.unie
    u('laque', lin((242, 243, 241)), rugosite=0.32)            # carrosseries d'appareils, laque blanche
    u('laque_grise', lin((196, 201, 206)), rugosite=0.38)
    u('anthracite', lin((52, 56, 62)), rugosite=0.4)
    u('noir_mat', lin((24, 26, 29)), rugosite=0.55)
    u('noir_brillant', lin((14, 15, 17)), rugosite=0.12)
    u('inox_brosse', lin((190, 194, 198)), rugosite=0.3, metal=1.0)
    u('chrome', lin((222, 225, 228)), rugosite=0.08, metal=1.0)
    u('sarcelle', lin((11, 107, 119)), rugosite=0.45)          # la couleur de l'hôpital (celle de l'exercice)
    u('sarcelle_skai', lin((20, 86, 98)), rugosite=0.42)
    u('nuit', lin((30, 40, 58)), rugosite=0.45)
    u('nuit_skai', lin((34, 52, 78)), rugosite=0.42)
    u('vert_bloc', lin((96, 160, 150)), rugosite=0.6)          # champs opératoires
    u('bleu_champ', lin((70, 130, 178)), rugosite=0.75)
    u('resine', lin((58, 62, 68)), rugosite=0.28)               # plan de travail de laboratoire
    u('caoutchouc', lin((36, 37, 40)), rugosite=0.8)
    u('tissu_gris', lin((92, 100, 110)), rugosite=0.9)
    u('tissu_sarcelle', lin((30, 98, 108)), rugosite=0.9)
    u('papier', lin((244, 244, 240)), rugosite=0.9)
    u('bleu_bouteille', lin((40, 90, 160)), rugosite=0.3)
    u('ambre', lin((150, 80, 20)), rugosite=0.15)
    u('jaune_dechets', lin((236, 190, 30)), rugosite=0.5)
    u('rouge', lin((190, 40, 36)), rugosite=0.4)
    u('vert_dae', lin((30, 140, 80)), rugosite=0.4)
    u('led', lin((255, 255, 255)), emission=(1.0, 0.98, 0.95), force=8.0)
    u('led_sarcelle', lin((90, 200, 210)), emission=lin((90, 200, 210)), force=6.0)
    u('led_chaude', lin((255, 220, 170)), emission=(1.0, 0.82, 0.6), force=5.0)
    u('voyant_vert', lin((60, 220, 90)), emission=lin((60, 220, 90)), force=4.0)
    u('plastique_bleu', lin((60, 120, 190)), rugosite=0.35)
    u('plastique_violet', lin((120, 80, 170)), rugosite=0.35)
    u('plastique_rouge', lin((200, 50, 50)), rugosite=0.35)
    u('plastique_jaune', lin((230, 190, 40)), rugosite=0.35)
    u('plastique_vert', lin((70, 170, 90)), rugosite=0.35)
    for nom in ('verre_appareil',):
        m = matieres.verre(nom)
    for nom, f in (('ecran_caryotype', 'ecran_caryotype.jpg'), ('ecran_echo', 'ecran_echo.jpg'), ('ecran_moniteur', 'ecran_moniteur.jpg'),
                   ('ecran_scanner', 'ecran_scanner.jpg'), ('ecran_dossier', 'ecran_dossier.jpg'), ('ecran_electro', 'ecran_electro.jpg')):
        image(nom, f, rugosite=0.1, ecran=True, force=1.6)
    for nom in ('affiche_appareil', 'affiche_adn', 'affiche_hormones', 'affiche_mains', 'affiche_bloc', 'plan_hall',
                'signal_croisement', 'signal_ouest', 'signal_est', 'logo', 'clavier'):
        image(nom, nom + '.jpg', rugosite=0.6)


# ------------------------------------------------------------------ petits éléments communs
def roulette(nom, r, dx, dz, h=0.1, groupe='petits'):
    """Roulette pivotante : chape, roue, platine."""
    boite(nom + '_platine', r, (dx, h - 0.006, dz), (0.05, 0.012, 0.05), 'chrome', ch=0.003, groupe=groupe)
    boite(nom + '_chape', r, (dx, h * 0.55, dz - 0.012), (0.03, h * 0.6, 0.04), 'chrome', ch=0.004, groupe=groupe)
    cyl(nom + '_roue', r, (dx - 0.012, h * 0.32, dz - 0.02), [(0, 0), (h * 0.28, 0), (h * 0.32, 0.006), (h * 0.32, 0.018), (h * 0.28, 0.024), (0, 0.024)],
        'caoutchouc', n=16, axe='x', groupe=groupe)


def ecran_plat(nom, r, c, w, h, img, pied=True, groupe='petits', epaisseur=0.03):
    """Écran plat à cadre fin, sur pied ou à fixer à un bras ; c = centre de la dalle."""
    x, y, z = c
    boite(nom + '_coque', r, (x, y, z - epaisseur / 2), (w + 0.02, h + 0.02, epaisseur), 'noir_mat', ch=0.006, seg=2, groupe=groupe)
    plaque(nom + '_dalle', r, (x, y, z + 0.0005), w, h, img, groupe=img)
    if pied:
        boite(nom + '_col', r, (x, y - h / 2 - 0.06, z - epaisseur - 0.02), (0.05, 0.16, 0.025), 'anthracite', ch=0.006, groupe=groupe)
        yb = y - h / 2 - 0.135
        boite(nom + '_pied', r, (x, yb, z - 0.06), (0.22, 0.012, 0.16), 'anthracite', ch=0.005, seg=2, groupe=groupe)


def poste(nom, r, dx, y, dz, img='ecran_dossier', clavier=True, groupe='petits'):
    """Poste informatique : écran 24 pouces sur pied, clavier, souris."""
    ecran_plat(nom, r, (dx, y + 0.31, dz), 0.53, 0.3, img, groupe=groupe)
    if clavier:
        boite(nom + '_clavier', r, (dx, y + 0.008, dz + 0.3), (0.44, 0.016, 0.14), 'anthracite', ch=0.004, groupe=groupe)
        plaque(nom + '_touches', r.sous(dx, y + 0.0165, dz + 0.3, rx=-PI / 2), (0, 0, 0), 0.42, 0.125, 'clavier', groupe='clavier')
        boite(nom + '_souris', r, (dx + 0.32, y + 0.012, dz + 0.3), (0.06, 0.024, 0.1), 'anthracite', ch=0.011, seg=3, groupe=groupe)


def chaise_bureau(nom, x, z, ry, tissu='tissu_gris', groupe='chaises'):
    """Fauteuil de bureau : étoile à cinq branches et roulettes, vérin, assise et dossier rembourrés, accoudoirs."""
    r = Rep(x, z, ry)
    for k in range(5):
        a = k / 5 * TAU
        b = r.sous(0, 0, 0, ry=a)
        boite(f'{nom}_branche{k}', b, (0, 0.07, 0.17), (0.04, 0.03, 0.32), 'noir_mat', ch=0.008, seg=2, groupe=groupe)
        cyl(f'{nom}_roue{k}', b, (-0.012, 0.028, 0.32), [(0, 0), (0.028, 0), (0.03, 0.006), (0.03, 0.02), (0.028, 0.026), (0, 0.026)], 'noir_mat', n=12, axe='x', groupe=groupe)
    cyl(nom + '_moyeu', r, (0, 0.05, 0), [(0, 0), (0.05, 0), (0.05, 0.05), (0.03, 0.06), (0, 0.06)], 'noir_mat', n=20, groupe=groupe)
    cyl(nom + '_verin', r, (0, 0.1, 0), [(0.025, 0), (0.025, 0.2), (0.02, 0.2), (0.02, 0.33), (0, 0.33)], 'chrome', n=16, groupe=groupe)
    boite(nom + '_mecanisme', r, (0, 0.44, 0), (0.24, 0.04, 0.24), 'noir_mat', ch=0.01, groupe=groupe)
    boite(nom + '_assise', r, (0, 0.49, 0.02), (0.5, 0.075, 0.48), tissu, ch=0.035, seg=3, groupe=groupe)
    d = r.sous(0, 0.52, -0.24, rx=-0.12)
    boite(nom + '_lame', r, (0, 0.6, -0.25), (0.06, 0.2, 0.03), 'noir_mat', ch=0.008, groupe=groupe)
    boite(nom + '_dossier', d, (0, 0.32, 0), (0.46, 0.5, 0.07), tissu, ch=0.03, seg=3, groupe=groupe)
    for s in (-1, 1):
        boite(f'{nom}_acc_mont{s}', r, (s * 0.25, 0.58, 0.0), (0.025, 0.16, 0.04), 'noir_mat', ch=0.008, groupe=groupe)
        boite(f'{nom}_acc{s}', r, (s * 0.25, 0.665, 0.03), (0.06, 0.025, 0.24), 'noir_mat', ch=0.01, seg=2, groupe=groupe)


def chaises_attente(nom, x, z, ry, n=3, tissu='tissu_sarcelle', groupe='chaises'):
    """Rangée de sièges d'attente sur poutre : coques rembourrées, accoudoirs, pieds en T."""
    r = Rep(x, z, ry)
    L = n * 0.62
    boite(nom + '_poutre', r, (0, 0.36, -0.05), (L, 0.05, 0.07), 'inox_brosse', ch=0.008, groupe=groupe)
    for s in (-1, 1):
        dx = s * (L / 2 - 0.25)
        boite(f'{nom}_pied{s}', r, (dx, 0.18, -0.05), (0.05, 0.36, 0.05), 'inox_brosse', ch=0.008, groupe=groupe)
        boite(f'{nom}_semelle{s}', r, (dx, 0.012, -0.05), (0.06, 0.024, 0.55), 'inox_brosse', ch=0.008, groupe=groupe)
    for k in range(n):
        dx = -L / 2 + 0.31 + k * 0.62
        boite(f'{nom}_assise{k}', r, (dx, 0.44, 0.02), (0.52, 0.07, 0.48), tissu, ch=0.03, seg=3, groupe=groupe)
        s = r.sous(dx, 0.46, -0.2, rx=-0.16)
        boite(f'{nom}_dos{k}', s, (0, 0.24, 0), (0.5, 0.46, 0.06), tissu, ch=0.03, seg=3, groupe=groupe)
        boite(f'{nom}_coque{k}', s, (0, 0.22, -0.035), (0.5, 0.48, 0.015), 'anthracite', ch=0.006, groupe=groupe)
    for k in range(n + 1):
        dx = -L / 2 + k * 0.62
        boite(f'{nom}_acc{k}', r, (dx, 0.62, 0.0), (0.05, 0.03, 0.42), 'inox_brosse', ch=0.012, seg=2, groupe=groupe)
        boite(f'{nom}_accm{k}', r, (dx, 0.5, -0.1), (0.03, 0.22, 0.03), 'inox_brosse', ch=0.008, groupe=groupe)
    c, s_ = abs(math.cos(ry)), abs(math.sin(ry))
    ex, ez = c * L / 2 + s_ * 0.35, s_ * L / 2 + c * 0.35
    mobilier.solide(x - ex, z - ez, x + ex, z + ez)


def potence(nom, x, z, groupe='inox'):
    """Pied à perfusion : étoile à cinq roulettes, mât, crochets, poche de soluté."""
    r = Rep(x, z)
    for k in range(5):
        b = r.sous(0, 0, 0, ry=k / 5 * TAU)
        boite(f'{nom}_b{k}', b, (0, 0.07, 0.15), (0.025, 0.02, 0.3), 'chrome', ch=0.006, groupe=groupe)
        cyl(f'{nom}_r{k}', b, (-0.01, 0.025, 0.3), [(0, 0), (0.025, 0), (0.025, 0.02), (0, 0.02)], 'noir_mat', n=10, axe='x', groupe='petits')
    cyl(nom + '_mat', r, (0, 0.06, 0), [(0.014, 0), (0.014, 1.9), (0, 1.9)], 'chrome', n=12, groupe=groupe)
    for s in (-1, 1):
        tube(f'{nom}_crochet{s}', [r.p(0, 1.9, 0), r.p(s * 0.12, 1.93, 0), r.p(s * 0.15, 1.88, 0)], 0.006, 'chrome', groupe=groupe)
    boite(nom + '_poche', r, (0.15, 1.72, 0), (0.12, 0.2, 0.035), 'verre_appareil', ch=0.015, seg=3, groupe='verre')
    tube(nom + '_tubulure', courbe(r.p(0.15, 1.6, 0), r.p(0.2, 1.0, 0.1), r.p(0.35, 0.95, 0.3)), 0.003, 'verre_appareil', n=6, groupe='verre')


def distributeur(nom, r, dx, y, dz, groupe='petits'):
    """Distributeur mural de solution hydro-alcoolique."""
    boite(nom + '_corps', r, (dx, y, dz + 0.05), (0.11, 0.24, 0.1), 'laque', ch=0.02, seg=3, groupe=groupe)
    boite(nom + '_flacon', r, (dx, y - 0.02, dz + 0.101), (0.07, 0.12, 0.004), 'verre_appareil', ch=0.002, groupe='verre')
    boite(nom + '_poussoir', r, (dx, y - 0.1, dz + 0.1), (0.08, 0.03, 0.05), 'sarcelle', ch=0.008, seg=2, groupe=groupe)


def lisse(nom, pts, normale, mat='sarcelle', y=0.9, groupe='lisses'):
    """Lisse de protection murale (PVC sur support aluminium) le long d'un mur : pts = extrémités (x, z)."""
    n = Vector(normale)
    prof = [(0.0, -0.06), (0.012, -0.06), (0.03, -0.05), (0.04, -0.03), (0.043, 0.0), (0.04, 0.03), (0.03, 0.05), (0.012, 0.06), (0.0, 0.06)]
    chemin = [(x, y, z) for (x, z) in pts]
    return geo.balayer(nom, chemin, [tuple(n)] * (len(chemin) - 1), (0, 1, 0), prof, mat, groupe=groupe, lisse=60, iles=True)


# ------------------------------------------------------------------ mobilier médical
def table_examen(nom, x, z, ry=0.0, skai='sarcelle_skai'):
    """Divan d'examen à hauteur variable : socle à roulettes, vérin sous soufflet, châssis, matelas en deux parties
    (têtière relevée), barres latérales, porte-rouleau et drap d'examen."""
    r = Rep(x, z, ry)
    g = 'meubles'
    boite(nom + '_socle', r, (0, 0.06, 0), (1.3, 0.08, 0.56), 'laque', ch=0.02, seg=3, groupe=g)
    for sx in (-0.6, 0.6):
        for sz in (-0.24, 0.24):
            roulette(f'{nom}_rl{sx}{sz}', r, sx, sz, h=0.06)
    boite(nom + '_vérin', r, (0, 0.3, 0), (0.42, 0.42, 0.3), 'laque_grise', ch=0.03, seg=3, groupe=g)
    for k in range(5):
        boite(f'{nom}_soufflet{k}', r, (0, 0.14 + k * 0.08, 0), (0.46, 0.012, 0.34), 'anthracite', ch=0.004, groupe=g)
    boite(nom + '_chassis', r, (0, 0.54, 0), (1.86, 0.06, 0.6), 'laque', ch=0.015, seg=2, groupe=g)
    boite(nom + '_matelas', r, (-0.22, 0.62, 0), (1.38, 0.1, 0.62), skai, ch=0.04, seg=4, groupe=g)
    t = r.sous(0.48, 0.6, 0, rz=0.32)
    boite(nom + '_tetiere', t, (0.32, 0.03, 0), (0.62, 0.1, 0.62), skai, ch=0.04, seg=4, groupe=g)
    boite(nom + '_drap', r, (-0.18, 0.673, 0), (1.3, 0.004, 0.5), 'papier', ch=0.001, groupe=g)
    cyl(nom + '_rouleau', r, (-0.98, 0.63, -0.28), [(0, 0), (0.06, 0), (0.06, 0.56), (0, 0.56)], 'papier', n=20, axe='z', groupe=g)
    for sz in (-1, 1):
        boite(f'{nom}_support{sz}', r, (-0.98, 0.6, sz * 0.3), (0.04, 0.12, 0.012), 'chrome', ch=0.004, groupe='petits')
        tube(f'{nom}_barre{sz}', [r.p(-0.75, 0.56, sz * 0.33), r.p(-0.75, 0.6, sz * 0.36), r.p(0.3, 0.6, sz * 0.36), r.p(0.3, 0.56, sz * 0.33)], 0.012, 'chrome', groupe='inox')
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c * 1.0 + s * 0.38), z - (s * 1.0 + c * 0.38), x + (c * 1.0 + s * 0.38), z + (s * 1.0 + c * 0.38))


def table_operation(nom, x, z, ry=0.0):
    """Table d'opération : embase trapézoïdale, colonne télescopique, plateau articulé en quatre segments rembourrés,
    rails latéraux, appui-bras, télécommande sur son câble."""
    r = Rep(x, z, ry)
    g = 'meubles'
    boite(nom + '_embase', r, (0.15, 0.06, 0), (0.95, 0.12, 0.6), 'laque', ch=0.03, seg=3, groupe=g)
    boite(nom + '_embase_inox', r, (0.15, 0.125, 0), (0.85, 0.012, 0.5), 'inox_brosse', ch=0.004, groupe=g)
    boite(nom + '_colonne', r, (0.15, 0.42, 0), (0.34, 0.6, 0.26), 'inox_brosse', ch=0.02, seg=2, groupe=g)
    boite(nom + '_colonne_haut', r, (0.15, 0.76, 0), (0.3, 0.1, 0.22), 'laque', ch=0.02, seg=2, groupe=g)
    boite(nom + '_cadre', r, (0, 0.83, 0), (2.0, 0.05, 0.52), 'inox_brosse', ch=0.008, groupe=g)
    for k, (a, b) in enumerate(((-1.0, -0.6), (-0.58, 0.18), (0.2, 0.75), (0.77, 1.0))):
        boite(f'{nom}_seg{k}', r, ((a + b) / 2, 0.9, 0), (b - a - 0.01, 0.08, 0.5), 'noir_mat', ch=0.03, seg=4, groupe=g)
    boite(nom + '_champ', r, (-0.1, 0.945, 0), (1.5, 0.008, 0.6), 'bleu_champ', ch=0.003, groupe=g)
    boite(nom + '_champ_tombant', r, (-0.1, 0.82, 0.3), (1.5, 0.25, 0.006), 'bleu_champ', ch=0.002, groupe=g)
    for sz in (-1, 1):
        boite(f'{nom}_rail{sz}', r, (0, 0.85, sz * 0.27), (1.9, 0.03, 0.012), 'chrome', ch=0.003, groupe='inox')
    a = r.sous(-0.25, 0.86, -0.27, ry=0.6)
    boite(nom + '_appuibras', a, (0, 0.02, -0.33), (0.14, 0.05, 0.6), 'noir_mat', ch=0.02, seg=3, groupe=g)
    boite(nom + '_telecommande', r, (0.6, 0.62, 0.3), (0.08, 0.2, 0.03), 'laque', ch=0.01, seg=2, groupe='petits')
    tube(nom + '_cable', courbe(r.p(0.6, 0.72, 0.3), r.p(0.62, 0.85, 0.3), r.p(0.55, 0.85, 0.27)), 0.005, 'noir_mat', n=6, groupe='petits')
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c * 1.05 + s * 0.42), z - (s * 1.05 + c * 0.42), x + (c * 1.05 + s * 0.42), z + (s * 1.05 + c * 0.42))


def scialytique(nom, x, z, h_plafond, coupoles=((-0.5, 0.25, 1.85), (0.55, -0.2, 1.95))):
    """Éclairage opératoire : platine au plafond, axe, bras articulés, et pour chaque coupole une couronne de LED
    sous un carénage blanc, avec sa poignée stérilisable au centre. coupoles : (dx, dz, hauteur de la coupole)."""
    r = Rep(x, z)
    cyl(nom + '_platine', r, (0, h_plafond - 0.06, 0), [(0, 0), (0.22, 0), (0.24, 0.02), (0.24, 0.06), (0, 0.06)], 'laque', n=32, groupe='meubles')
    cyl(nom + '_axe', r, (0, h_plafond - 0.5, 0), [(0.045, 0), (0.045, 0.44), (0, 0.44)], 'laque', n=20, groupe='meubles')
    for k, (dx, dz, hc) in enumerate(coupoles):
        y0 = h_plafond - 0.45 - k * 0.12
        cyl(f'{nom}_moyeu{k}', r, (0, y0 - 0.06, 0), [(0, 0), (0.07, 0), (0.07, 0.1), (0, 0.1)], 'laque', n=20, groupe='meubles')
        coude = r.p(dx * 0.85, y0 - 0.02, dz * 0.85)
        tube(f'{nom}_bras{k}', [r.p(0, y0 - 0.02, 0), r.p(dx * 0.5, y0 - 0.02, dz * 0.5), coude], 0.035, 'laque', n=14, groupe='meubles')
        bas = r.p(dx, hc + 0.2, dz)
        tube(f'{nom}_fourche{k}', [coude, coude + Vector((0, -0.1, 0)), bas + Vector((0, 0.12, 0)), bas], 0.025, 'laque', n=12, groupe='meubles')
        t = Rep(); t.o = r.p(dx, hc, dz); t.R = Matrix.Rotation(0.25 * (1 if dx > 0 else -1), 3, 'Z') @ Matrix.Rotation(0.15, 3, 'X')
        cyl(f'{nom}_coupole{k}', t, (0, 0, 0), [(0, 0.2), (0.12, 0.19), (0.28, 0.14), (0.34, 0.08), (0.36, 0.03), (0.355, 0.0), (0.33, -0.01), (0.0, -0.01)],
            'laque', n=48, groupe='meubles', lisse=60)
        cyl(f'{nom}_vitre{k}', t, (0, -0.012, 0), [(0, 0), (0.32, 0), (0.32, 0.002), (0, 0.002)], 'laque_grise', n=48, groupe='meubles')
        for anneau, (rr, nb) in enumerate(((0.09, 6), (0.17, 12), (0.25, 18))):
            for j in range(nb):
                a = j / nb * TAU + anneau * 0.3
                cyl(f'{nom}_led{k}_{anneau}_{j}', t, (rr * math.cos(a), -0.016, rr * math.sin(a)), [(0, 0), (0.026, 0), (0.026, 0.004), (0, 0.004)], 'led', n=12,
                    groupe='led')
        cyl(f'{nom}_poignee{k}', t, (0, -0.13, 0), [(0, 0), (0.022, 0), (0.026, 0.02), (0.022, 0.11), (0.03, 0.12), (0, 0.12)], 'laque_grise', n=16, groupe='petits')


def bras_plafonnier(nom, x, z, h_plafond, moniteur='ecran_moniteur'):
    """Bras de distribution des fluides : colonne avec prises de gaz, étagère, moniteur de surveillance orientable."""
    r = Rep(x, z)
    cyl(nom + '_platine', r, (0, h_plafond - 0.05, 0), [(0, 0), (0.2, 0), (0.2, 0.05), (0, 0.05)], 'laque', n=28, groupe='meubles')
    boite(nom + '_bras', r, (0.35, h_plafond - 0.25, 0), (0.8, 0.12, 0.16), 'laque', ch=0.03, seg=3, groupe='meubles')
    boite(nom + '_colonne', r, (0.75, h_plafond - 0.95, 0), (0.3, 1.3, 0.3), 'laque', ch=0.03, seg=3, groupe='meubles')
    for k, mat in enumerate(('plastique_bleu', 'laque', 'plastique_jaune', 'anthracite')):
        cyl(f'{nom}_prise{k}', r, (0.75, h_plafond - 0.6 - k * 0.1, 0.15), [(0, 0), (0.022, 0), (0.022, 0.025), (0, 0.025)], mat, n=12, axe='z', groupe='petits')
    boite(nom + '_etagere', r, (0.75, h_plafond - 1.45, 0.12), (0.55, 0.025, 0.42), 'laque_grise', ch=0.008, groupe='meubles')
    m = r.sous(0.75, h_plafond - 1.2, 0.2, ry=-0.4)
    ecran_plat(nom + '_moniteur', m, (0, 0.05, 0.05), 0.46, 0.31, moniteur, pied=False, groupe='petits', epaisseur=0.06)


def respirateur(nom, x, z, ry=0.0):
    """Station d'anesthésie : chariot à tiroirs sur roulettes, plan de travail, débitmètres, soufflet sous cloche,
    évaporateurs, moniteur, circuit patient et bouteilles de secours."""
    r = Rep(x, z, ry)
    g = 'meubles'
    for sx in (-0.3, 0.3):
        for sz in (-0.25, 0.25):
            roulette(f'{nom}_rl{sx}{sz}', r, sx, sz, h=0.09)
    boite(nom + '_chariot', r, (0, 0.5, 0), (0.75, 0.8, 0.6), 'laque', ch=0.025, seg=3, groupe=g)
    for k in range(3):
        boite(f'{nom}_tiroir{k}', r, (0, 0.27 + k * 0.22, 0.302), (0.68, 0.19, 0.012), 'laque_grise', ch=0.006, groupe=g)
        boite(f'{nom}_poignee{k}', r, (0, 0.33 + k * 0.22, 0.315), (0.3, 0.02, 0.02), 'anthracite', ch=0.006, groupe='petits')
    boite(nom + '_plan', r, (0, 0.92, 0.05), (0.85, 0.035, 0.72), 'anthracite', ch=0.01, seg=2, groupe=g)
    boite(nom + '_tete', r, (0, 1.3, -0.15), (0.75, 0.72, 0.32), 'laque', ch=0.03, seg=3, groupe=g)
    boite(nom + '_facade', r, (0, 1.25, 0.012), (0.66, 0.5, 0.01), 'laque_grise', ch=0.004, groupe=g)
    for k in range(4):        # débitmètres : tubes de verre gradués à flotteur
        cyl(f'{nom}_debit{k}', r, (-0.25 + k * 0.07, 1.12, 0.03), [(0.014, 0), (0.014, 0.24), (0, 0.24)], 'verre_appareil', n=10, groupe='verre')
        cyl(f'{nom}_flotteur{k}', r, (-0.25 + k * 0.07, 1.16 + k * 0.03, 0.03), [(0, 0), (0.01, 0.01), (0, 0.02)], ('plastique_bleu', 'laque', 'plastique_jaune', 'plastique_vert')[k], n=8, groupe='petits')
    for k, mat in enumerate(('plastique_violet', 'plastique_jaune')):   # évaporateurs
        boite(f'{nom}_evap{k}', r, (0.12 + k * 0.15, 1.12, 0.06), (0.12, 0.2, 0.12), mat, ch=0.015, seg=2, groupe='petits')
    cyl(nom + '_cloche', r, (0.48, 0.94, 0.12), [(0.08, 0), (0.08, 0.22), (0.075, 0.24), (0, 0.24)], 'verre_appareil', n=20, groupe='verre')
    cyl(nom + '_soufflet', r, (0.48, 0.94, 0.12), [(0.06 + 0.008 * (k % 2), k * 0.02) for k in range(10)] + [(0, 0.18)], 'plastique_bleu', n=20, groupe='petits')
    ecran_plat(nom + '_ecran', r.sous(0, 1.85, -0.1, rx=-0.15), (0, 0, 0), 0.44, 0.3, 'ecran_moniteur', pied=False, groupe='petits', epaisseur=0.05)
    boite(nom + '_col', r, (0, 1.72, -0.15), (0.06, 0.1, 0.06), 'anthracite', ch=0.01, groupe='petits')
    tube(nom + '_circuit1', courbe(r.p(-0.3, 1.0, 0.1), r.p(-0.6, 1.4, 0.6), r.p(-0.9, 1.0, 0.8)), 0.02, 'plastique_bleu', n=12, groupe='petits')
    tube(nom + '_circuit2', courbe(r.p(-0.32, 0.98, 0.15), r.p(-0.65, 1.2, 0.55), r.p(-0.9, 1.0, 0.8)), 0.02, 'laque_grise', n=12, groupe='petits')
    for k, mat in enumerate(('vert_dae', 'plastique_bleu')):
        cyl(f'{nom}_bouteille{k}', r, (-0.2 + k * 0.4, 0.2, -0.38), [(0.07, 0), (0.07, 0.6), (0.05, 0.66), (0.015, 0.68), (0.015, 0.72), (0, 0.72)], mat, n=16, groupe='petits')
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c * 0.5 + s * 0.5), z - (s * 0.5 + c * 0.5), x + (c * 0.5 + s * 0.5), z + (s * 0.5 + c * 0.5))


def chariot_instruments(nom, x, z, ry=0.0, champ=True):
    """Table d'instrumentation inox à deux plateaux bordés, champ stérile et instruments alignés."""
    r = Rep(x, z, ry)
    for sx in (-0.33, 0.33):
        for sz in (-0.2, 0.2):
            roulette(f'{nom}_rl{sx}{sz}', r, sx, sz, h=0.08)
            cyl(f'{nom}_pied{sx}{sz}', r, (sx, 0.08, sz), [(0.014, 0), (0.014, 0.8), (0, 0.8)], 'inox_brosse', n=12, groupe='inox')
    for y in (0.3, 0.86):
        boite(f'{nom}_plateau{y}', r, (0, y, 0), (0.74, 0.012, 0.46), 'inox_brosse', ch=0.004, groupe='inox')
        for sz in (-1, 1):
            boite(f'{nom}_rebord{y}{sz}', r, (0, y + 0.02, sz * 0.23), (0.74, 0.04, 0.008), 'inox_brosse', ch=0.002, groupe='inox')
    if champ:
        boite(nom + '_champ', r, (0, 0.872, 0), (0.7, 0.006, 0.42), 'bleu_champ', ch=0.002, groupe='petits')
        for k in range(8):
            ang = (k - 3.5) * 0.04
            t = r.sous(-0.28 + k * 0.075, 0.88, 0.0, ry=ang)
            boite(f'{nom}_instr{k}', t, (0, 0.003, 0), (0.012, 0.006, 0.2 + (k % 3) * 0.03), 'chrome', ch=0.002, groupe='petits')
            cyl(f'{nom}_anneau{k}', t, (0, 0.002, 0.12 + (k % 3) * 0.015), [(0.012, 0), (0.016, 0), (0.016, 0.004), (0.012, 0.004)], 'chrome', n=10, groupe='petits')
        cyl(nom + '_cupule', r, (0.24, 0.875, -0.12), [(0, 0), (0.05, 0), (0.07, 0.04), (0.068, 0.042), (0.048, 0.004), (0, 0.004)], 'chrome', n=20, groupe='petits')


def armoire_vitree(nom, x, z, ry, L=1.0, H=2.0, P=0.45, contenu=True):
    """Armoire de rangement : caisson laqué creux (fond, joues, dessus, socle), étagères garnies de boîtes et de flacons,
    deux portes vitrées à cadre d'aluminium et leurs poignées. Adossée au mur côté −z local."""
    r = Rep(x, z, ry)
    g = 'meubles'
    e = 0.02
    boite(nom + '_fond', r, (0, H / 2, -P / 2 + e / 2), (L, H, e), 'laque_grise', ch=0.002, groupe=g)
    for sx in (-1, 1):
        boite(f'{nom}_joue{sx}', r, (sx * (L / 2 - e / 2), H / 2, 0), (e, H, P), 'laque', ch=0.003, groupe=g)
    boite(nom + '_dessus', r, (0, H - e / 2, 0), (L, e, P), 'laque', ch=0.003, groupe=g)
    boite(nom + '_socle', r, (0, 0.05, 0), (L, 0.1, P), 'anthracite', ch=0.003, groupe=g)
    nb = 4
    pi = P - 0.06                                   # profondeur intérieure utile
    for k in range(nb):
        y = 0.1 + k * (H - 0.15) / nb
        boite(f'{nom}_etagere{k}', r, (0, y + 0.01, -0.01), (L - 2 * e, 0.02, pi), 'laque', ch=0.003, groupe=g)
        if contenu:
            x0 = -L / 2 + e + 0.03
            j = 0
            while x0 < L / 2 - e - 0.1:
                w = 0.08 + ((k * 7 + j * 3) % 5) * 0.03
                if x0 + w > L / 2 - e - 0.02:
                    break
                if (k + j) % 3 == 0:
                    for q in range(int(w / 0.05)):
                        cyl(f'{nom}_fl{k}_{j}_{q}', r, (x0 + 0.025 + q * 0.05, y + 0.02, -0.02), [(0.02, 0), (0.02, 0.1), (0.008, 0.12), (0.008, 0.14), (0, 0.14)],
                            ('ambre', 'bleu_bouteille', 'laque')[(q + k) % 3], n=10, groupe='petits')
                else:
                    hb = 0.18 - (j % 2) * 0.05
                    boite(f'{nom}_bt{k}_{j}', r, (x0 + w / 2, y + 0.02 + hb / 2, -0.03), (w - 0.01, hb, pi - 0.12),
                          ('papier', 'laque', 'plastique_bleu', 'papier', 'sarcelle')[(k + j) % 5], ch=0.004, groupe='petits')
                x0 += w + 0.01; j += 1
    zp = P / 2 + 0.01
    for sx in (-1, 1):
        cx = sx * L / 4
        lw = L / 2 - 0.01
        for (dx, dy, w, h) in ((0, H - 0.05, lw, 0.035), (0, 0.13, lw, 0.035), (-lw / 2 + 0.018, (H + 0.1) / 2, 0.035, H - 0.17), (lw / 2 - 0.018, (H + 0.1) / 2, 0.035, H - 0.17)):
            boite(f'{nom}_cadre{sx}{dx:.2f}{dy:.2f}', r, (cx + dx, dy, zp), (w, h, 0.02), 'inox_brosse', ch=0.003, groupe='inox')
        boite(f'{nom}_vitre{sx}', r, (cx, (H + 0.1) / 2, zp), (lw - 0.06, H - 0.24, 0.004), 'verre_appareil', ch=0, groupe='verre')
        boite(f'{nom}_poignee{sx}', r, (sx * 0.05, H / 2, zp + 0.025), (0.015, 0.3, 0.02), 'chrome', ch=0.005, groupe='petits')


def paillasse_labo(nom, x0, x1, z0, z1, dos=None, h=0.9, etagere=True, mat_dessus='resine'):
    """Paillasse : caissons laqués à tiroirs et portes, poignées inox, plan en résine à chant sarcelle ;
    contre le mur, une étagère à réactifs sur montants et une goulotte de prises."""
    long_x = (x1 - x0) >= (z1 - z0)
    L = (x1 - x0) if long_x else (z1 - z0)
    Pp = (z1 - z0) if long_x else (x1 - x0)
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    # repère : x le long de la paillasse, +z vers l'utilisateur (le côté opposé au mur)
    if long_x:
        ry = 0.0 if dos != z1 else PI
    else:
        ry = PI / 2 if dos != x1 else -PI / 2
    r = Rep(cx, cz, ry)
    g = 'meubles'
    boite(nom + '_socle', r, (0, 0.05, -0.02), (L - 0.06, 0.1, Pp - 0.1), 'anthracite', ch=0.003, groupe=g)
    boite(nom + '_caissons', r, (0, h / 2 + 0.04, 0), (L - 0.02, h - 0.12, Pp - 0.04), 'laque', ch=0.004, groupe=g)
    boite(nom + '_plan', r, (0, h - 0.018, 0.0), (L, 0.036, Pp), mat_dessus, ch=0.006, seg=2, groupe=g)
    boite(nom + '_chant', r, (0, h - 0.018, Pp / 2 + 0.003), (L, 0.036, 0.006), 'sarcelle', ch=0.002, groupe=g)
    n = max(1, round(L / 0.6))
    faces = [1] if dos is not None else [1, -1]
    for f in faces:
        for k in range(n):
            a = -L / 2 + L * k / n + 0.008
            b = -L / 2 + L * (k + 1) / n - 0.008
            m = (a + b) / 2
            zf = f * (Pp / 2 - 0.02 + 0.006)
            if k % 3 == 1:
                for j, (ya, yb) in enumerate(((0.12, 0.38), (0.4, 0.6), (0.62, h - 0.06))):
                    boite(f'{nom}_t{f}{k}{j}', r, (m, (ya + yb) / 2, zf), (b - a, yb - ya - 0.01, 0.018), 'laque', ch=0.004, groupe=g)
                    boite(f'{nom}_pt{f}{k}{j}', r, (m, yb - 0.04, zf + f * 0.02), (0.14, 0.012, 0.02), 'inox_brosse', ch=0.004, groupe='petits')
            else:
                boite(f'{nom}_p{f}{k}', r, (m, (0.12 + h - 0.06) / 2, zf), (b - a, h - 0.18, 0.018), 'laque', ch=0.004, groupe=g)
                boite(f'{nom}_pp{f}{k}', r, (b - 0.05 if k % 2 else a + 0.05, h - 0.2, zf + f * 0.02), (0.012, 0.14, 0.02), 'inox_brosse', ch=0.004, groupe='petits')
    if dos is not None and etagere:
        zb = -Pp / 2 + 0.02
        boite(nom + '_goulotte', r, (0, h + 0.12, zb + 0.03), (L - 0.1, 0.08, 0.05), 'laque_grise', ch=0.008, groupe=g)
        for k in range(int(L / 0.5)):
            boite(f'{nom}_prise{k}', r, (-L / 2 + 0.3 + k * 0.5, h + 0.12, zb + 0.057), (0.07, 0.05, 0.006), 'laque', ch=0.003, groupe='petits')
        for k in range(n + 1):
            boite(f'{nom}_montant{k}', r, (-L / 2 + 0.04 + (L - 0.08) * k / n, h + 0.5, zb + 0.02), (0.03, 0.8, 0.03), 'inox_brosse', ch=0.004, groupe='inox')
        for y in (h + 0.42, h + 0.82):
            boite(f'{nom}_tablette{y:.2f}', r, (0, y, zb + 0.15), (L - 0.06, 0.02, 0.26), 'laque', ch=0.004, groupe=g)
            for k in range(int((L - 0.2) / 0.07)):
                if (k * 5 + int(y * 10)) % 7 in (2, 5):
                    continue
                xx = -L / 2 + 0.14 + k * 0.07
                cyl(f'{nom}_reactif{y:.2f}_{k}', r, (xx, y + 0.01, zb + 0.13 + (k % 2) * 0.06),
                    [(0.026, 0), (0.026, 0.11), (0.014, 0.13), (0.014, 0.16), (0, 0.16)] if k % 4 else [(0.03, 0), (0.03, 0.07), (0, 0.07)],
                    ('ambre', 'laque', 'bleu_bouteille', 'verre_appareil', 'laque', 'ambre')[k % 6], n=10, groupe='verre' if k % 6 == 3 else 'petits')
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(cx - (c * L + s * Pp) / 2, cz - (s * L + c * Pp) / 2, cx + (c * L + s * Pp) / 2, cz + (s * L + c * Pp) / 2)
    return r


def microscope(nom, r, dx, y, dz, ry=0.0):
    """Microscope droit de laboratoire : statif, bras, platine à surplatine, tourelle à quatre objectifs,
    tête binoculaire inclinée, oculaires, vis de mise au point, éclairage par LED."""
    m = r.sous(dx, y, dz, ry=ry)
    g = 'petits'
    boite(nom + '_base', m, (0, 0.03, 0.02), (0.22, 0.06, 0.3), 'laque', ch=0.02, seg=3, groupe=g)
    boite(nom + '_bras', m, (0, 0.2, -0.1), (0.1, 0.3, 0.08), 'laque', ch=0.03, seg=3, groupe=g)
    boite(nom + '_col', m, (0, 0.33, -0.04), (0.08, 0.1, 0.14), 'laque', ch=0.025, seg=3, groupe=g)
    boite(nom + '_platine', m, (0, 0.17, 0.04), (0.16, 0.012, 0.14), 'noir_mat', ch=0.003, groupe=g)
    boite(nom + '_surplatine', m, (0.0, 0.18, 0.04), (0.12, 0.008, 0.08), 'anthracite', ch=0.002, groupe=g)
    boite(nom + '_lame', m, (0, 0.186, 0.05), (0.075, 0.002, 0.026), 'verre_appareil', ch=0, groupe='verre')
    cyl(nom + '_tourelle', m, (0, 0.27, 0.03), [(0, 0), (0.04, 0.005), (0.045, 0.025), (0, 0.035)], 'chrome', n=20, groupe=g)
    for k in range(4):
        a = k / 4 * TAU + 0.4
        cyl(f'{nom}_obj{k}', m, (0.025 * math.cos(a), 0.215, 0.03 + 0.025 * math.sin(a)), [(0.006, 0), (0.011, 0.012), (0.012, 0.055), (0, 0.055)],
            'chrome', n=12, groupe=g)
    t = m.sous(0, 0.36, 0.0, rx=0.55)
    boite(nom + '_tete', t, (0, 0.02, 0.02), (0.1, 0.06, 0.1), 'laque', ch=0.02, seg=3, groupe=g)
    for s in (-1, 1):
        cyl(f'{nom}_oculaire{s}', t, (s * 0.032, 0.03, 0.06), [(0.014, 0), (0.014, 0.06), (0.017, 0.065), (0.017, 0.09), (0, 0.09)], 'noir_mat', n=14, axe='z', groupe=g)
        cyl(f'{nom}_vis{s}', m, (s * 0.06, 0.12, -0.1), [(0, 0), (0.035, 0), (0.035, 0.022), (0, 0.022)], 'noir_mat', n=18, axe=Matrix.Rotation(s * PI / 2, 3, 'Z'), groupe=g)
    cyl(nom + '_led', m, (0, 0.06, 0.04), [(0, 0), (0.025, 0), (0.025, 0.012), (0, 0.012)], 'led_chaude', n=14, groupe='led')


def centrifugeuse(nom, r, dx, y, dz, ry=0.0):
    """Centrifugeuse de paillasse : caisson arrondi, couvercle bombé à hublot, afficheur et boutons."""
    c = r.sous(dx, y, dz, ry=ry)
    boite(nom + '_corps', c, (0, 0.13, 0), (0.42, 0.26, 0.5), 'laque', ch=0.05, seg=4, groupe='petits')
    t = c.sous(0, 0.26, -0.02)
    boite(nom + '_couvercle', t, (0, 0.02, 0), (0.38, 0.05, 0.4), 'laque_grise', ch=0.03, seg=4, groupe='petits')
    cyl(nom + '_hublot', t, (0, 0.044, 0), [(0, 0), (0.09, 0), (0.09, 0.004), (0, 0.004)], 'noir_brillant', n=24, groupe='petits')
    boite(nom + '_panneau', c, (0, 0.16, 0.251), (0.32, 0.12, 0.006), 'anthracite', ch=0.003, groupe='petits')
    boite(nom + '_afficheur', c, (-0.06, 0.18, 0.255), (0.12, 0.04, 0.004), 'led_sarcelle', ch=0, groupe='led')
    for k in range(3):
        cyl(f'{nom}_btn{k}', c, (0.06 + k * 0.035, 0.15, 0.254), [(0, 0), (0.012, 0), (0.012, 0.006), (0, 0.006)], 'laque', n=10, axe='z', groupe='petits')


def poste_securite(nom, x, z, ry, L=1.3):
    """Poste de sécurité microbiologique : piètement, enceinte à vitre frontale inclinée, éclairage intérieur."""
    r = Rep(x, z, ry)
    g = 'meubles'
    for sx in (-L / 2 + 0.05, L / 2 - 0.05):
        for sz in (-0.3, 0.3):
            boite(f'{nom}_pied{sx}{sz}', r, (sx, 0.36, sz), (0.05, 0.72, 0.05), 'anthracite', ch=0.006, groupe=g)
    boite(nom + '_cadre', r, (0, 0.7, 0), (L, 0.05, 0.7), 'anthracite', ch=0.006, groupe=g)
    boite(nom + '_caisson', r, (0, 1.15, -0.05), (L, 0.85, 0.65), 'laque', ch=0.02, seg=2, groupe=g)
    boite(nom + '_interieur', r, (0, 1.12, 0.06), (L - 0.12, 0.55, 0.5), 'inox_brosse', ch=0.004, groupe=g)
    boite(nom + '_hotte', r, (0, 1.85, -0.05), (L, 0.5, 0.7), 'laque', ch=0.02, seg=2, groupe=g)
    boite(nom + '_bandeau', r, (0, 1.78, 0.305), (L - 0.04, 0.14, 0.01), 'anthracite', ch=0.004, groupe=g)
    boite(nom + '_ecran', r, (L / 2 - 0.2, 1.78, 0.312), (0.14, 0.06, 0.004), 'led_sarcelle', ch=0, groupe='led')
    v = r.sous(0, 1.32, 0.32, rx=-0.18)
    boite(nom + '_vitre', v, (0, 0, 0), (L - 0.08, 0.42, 0.008), 'verre_appareil', ch=0, groupe='verre')
    boite(nom + '_lampe', r, (0, 1.58, 0.1), (L - 0.2, 0.02, 0.06), 'led', ch=0, groupe='led')
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c * L + s * 0.75) / 2, z - (s * L + c * 0.75) / 2, x + (c * L + s * 0.75) / 2, z + (s * L + c * 0.75) / 2)


def portoir(nom, r, dx, y, dz, n=8, groupe='petits'):
    """Portoir de tubes à bouchons de couleur."""
    p = r.sous(dx, y, dz)
    boite(nom + '_corps', p, (0, 0.03, 0), (n * 0.022 + 0.02, 0.06, 0.05), 'laque', ch=0.004, groupe=groupe)
    for k in range(n):
        xx = -n * 0.011 + 0.011 + k * 0.022
        if (k * 3) % 7 == 5:
            continue
        cyl(f'{nom}_tube{k}', p, (xx, 0.012, 0), [(0, 0), (0.0065, 0.004), (0.0065, 0.09), (0, 0.09)], 'verre_appareil', n=8, groupe='verre')
        cyl(f'{nom}_liq{k}', p, (xx, 0.014, 0), [(0, 0), (0.0055, 0.003), (0.0055, 0.04 + (k % 3) * 0.01), (0, 0.04 + (k % 3) * 0.01)],
            ('rouge', 'plastique_jaune', 'rouge')[k % 3], n=8, groupe=groupe)
        cyl(f'{nom}_bouchon{k}', p, (xx, 0.098, 0), [(0, 0), (0.0075, 0), (0.0075, 0.018), (0, 0.018)],
            ('plastique_violet', 'plastique_rouge', 'plastique_vert', 'plastique_jaune', 'plastique_bleu')[k % 5], n=8, groupe=groupe)


def pipette(nom, r, dx, y, dz, a=0.2):
    p = r.sous(dx, y, dz, rz=a)
    cyl(nom + '_corps', p, (0, 0, 0), [(0, 0), (0.004, 0.0), (0.009, 0.06), (0.012, 0.18), (0.016, 0.2), (0.01, 0.22), (0, 0.22)], 'laque', n=12, groupe='petits')
    cyl(nom + '_bouton', p, (0, 0.22, 0), [(0.005, 0), (0.005, 0.02), (0.009, 0.022), (0, 0.026)], 'plastique_bleu', n=10, groupe='petits')


def echographe(nom, x, z, ry=0.0):
    """Échographe sur chariot : base à quatre roulettes, colonne, console à clavier et pavé tactile, sondes dans leurs
    supports avec leurs câbles, et grand écran sur bras articulé."""
    r = Rep(x, z, ry)
    g = 'meubles'
    boite(nom + '_base', r, (0, 0.12, 0), (0.56, 0.12, 0.66), 'laque', ch=0.04, seg=3, groupe=g)
    for sx in (-0.23, 0.23):
        for sz in (-0.28, 0.28):
            roulette(f'{nom}_rl{sx}{sz}', r, sx, sz, h=0.07)
    boite(nom + '_colonne', r, (0, 0.5, -0.12), (0.28, 0.66, 0.22), 'laque', ch=0.04, seg=3, groupe=g)
    boite(nom + '_ouies', r, (0, 0.45, -0.009), (0.2, 0.3, 0.004), 'anthracite', ch=0.002, groupe=g)
    c = r.sous(0, 0.88, 0.05, rx=0.12)
    boite(nom + '_console', c, (0, 0, 0), (0.62, 0.08, 0.46), 'laque', ch=0.03, seg=3, groupe=g)
    boite(nom + '_clavier_c', c, (0, 0.042, 0.1), (0.42, 0.006, 0.14), 'anthracite', ch=0.003, groupe=g)
    plaque(nom + '_touches', c.sous(0, 0.046, 0.1, rx=-PI / 2), (0, 0, 0), 0.4, 0.12, 'clavier', groupe='clavier')
    ecran_plat(nom + '_tactile', c.sous(0, 0.05, -0.08, rx=-PI / 2 + 0.25), (0, 0, 0), 0.3, 0.2, 'ecran_dossier', pied=False, groupe='petits', epaisseur=0.015)
    cyl(nom + '_boule', c, (0.18, 0.04, 0.08), [(0, 0), (0.025, 0.005), (0.028, 0.02), (0.018, 0.035), (0, 0.04)], 'noir_brillant', n=16, groupe='petits')
    for s in (-1, 1):
        cyl(f'{nom}_sonde{s}', c, (s * 0.27, 0.03, 0.12), [(0, 0), (0.016, 0.0), (0.02, 0.05), (0.028, 0.1), (0.018, 0.12), (0, 0.12)], 'laque_grise', n=12, groupe='petits')
        tube(f'{nom}_cable{s}', courbe(r.p(s * 0.27, 0.92, 0.2), r.p(s * 0.45, 0.4, 0.5), r.p(s * 0.15, 0.6, 0.0)), 0.006, 'anthracite', n=6, groupe='petits')
    cyl(nom + '_mat', r, (0, 0.95, -0.15), [(0.03, 0), (0.03, 0.35), (0, 0.35)], 'laque_grise', n=14, groupe='petits')
    e = r.sous(0, 1.38, -0.12, rx=-0.08)
    ecran_plat(nom + '_ecran', e, (0, 0.1, 0.03), 0.52, 0.36, 'ecran_echo', pied=False, groupe='petits', epaisseur=0.04)
    c2, s2 = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c2 * 0.33 + s2 * 0.4), z - (s2 * 0.33 + c2 * 0.4), x + (c2 * 0.33 + s2 * 0.4), z + (s2 * 0.33 + c2 * 0.4))


def scanner(nom, x, z, ry=0.0):
    """Scanner (tomodensitomètre) : anneau à large tunnel sous carénage blanc, liseré lumineux, petits écrans de
    positionnement, socle ; table patient à berceau coulissant, matelas et têtière."""
    r = Rep(x, z, ry)
    g = 'meubles'
    # l'anneau : un profil tourné autour de l'axe x local (le tunnel), posé sur un socle
    an = r.sous(0, 1.05, 0)
    prof = [(0.36, -0.42), (0.42, -0.45), (0.95, -0.45), (1.05, -0.4), (1.08, -0.3), (1.08, 0.3), (1.05, 0.4), (0.95, 0.45), (0.42, 0.45), (0.36, 0.42)]
    cyl(nom + '_anneau', an, (0, 0, 0), prof, 'laque', n=72, axe='x', groupe=g, lisse=40)
    cyl(nom + '_tunnel', an, (0, 0, 0), [(0.36, -0.42), (0.355, -0.3), (0.355, 0.3), (0.36, 0.42)], 'laque_grise', n=64, axe='x', groupe=g, ferme_haut=False, ferme_bas=False)
    for s in (-1, 1):
        cyl(f'{nom}_liseré{s}', an, (s * 0.452, 0, 0), [(0.5, 0), (0.56, 0), (0.56, 0.004), (0.5, 0.004)], 'led_sarcelle', n=64,
            axe=Matrix.Rotation(-s * PI / 2, 3, 'Z'), groupe='led')
        boite(f'{nom}_afficheur{s}', an, (s * 0.455, 0.62, 0), (0.008, 0.12, 0.2), 'ecran_dossier', ch=0.002, groupe='ecran_dossier')
    boite(nom + '_socle', r, (0, 0.06, 0), (0.95, 0.12, 1.8), 'laque_grise', ch=0.03, seg=2, groupe=g)
    boite(nom + '_jupe', r, (0, 0.3, 0), (0.85, 0.5, 1.7), 'laque', ch=0.05, seg=3, groupe=g)
    # table patient (vers +x local, hors de l'anneau)
    t = r.sous(1.6, 0, 0)
    boite(nom + '_t_socle', t, (0, 0.05, 0), (1.2, 0.1, 0.55), 'laque_grise', ch=0.02, seg=2, groupe=g)
    boite(nom + '_t_corps', t, (0, 0.38, 0), (1.3, 0.56, 0.44), 'laque', ch=0.06, seg=4, groupe=g)
    boite(nom + '_t_berceau', t, (-0.45, 0.72, 0), (2.6, 0.08, 0.46), 'laque', ch=0.03, seg=3, groupe=g)
    boite(nom + '_t_matelas', t, (-0.4, 0.79, 0), (2.2, 0.07, 0.42), 'nuit_skai', ch=0.03, seg=4, groupe=g)
    boite(nom + '_t_drap', t, (-0.4, 0.828, 0), (1.9, 0.004, 0.34), 'papier', ch=0.001, groupe=g)
    cyl(nom + '_t_tetiere', t, (-1.55, 0.79, 0), [(0, 0), (0.12, 0), (0.14, 0.05), (0.14, 0.08), (0, 0.08)], 'nuit_skai', n=24, groupe=g)
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c * 0.55 + s * 1.1), z - (s * 0.55 + c * 1.1), x + (c * 0.55 + s * 1.1), z + (s * 0.55 + c * 1.1))
    tx, tz = Vector(r.p(1.6, 0, 0)).x, Vector(r.p(1.6, 0, 0)).z
    mobilier.solide(tx - (c * 0.7 + s * 0.3), tz - (s * 0.7 + c * 0.3), tx + (c * 0.7 + s * 0.3), tz + (s * 0.7 + c * 0.3))


def bureau(nom, x, z, ry, L=1.6, P=0.8, groupe='meubles', voile=True):
    """Bureau : plateau chêne à chant fin, piètement en luge d'acier laqué, voile de fond, caisson à tiroirs."""
    r = Rep(x, z, ry)
    boite(nom + '_plateau', r, (0, 0.735, 0), (L, 0.03, P), 'hetre', ch=0.004, seg=2, groupe=groupe)
    for s in (-1, 1):
        xx = s * (L / 2 - 0.06)
        boite(f'{nom}_montant{s}', r, (xx, 0.36, 0), (0.05, 0.72, 0.05), 'anthracite', ch=0.006, groupe=groupe)
        boite(f'{nom}_luge{s}', r, (xx, 0.015, 0), (0.05, 0.03, P - 0.1), 'anthracite', ch=0.006, groupe=groupe)
        boite(f'{nom}_haut{s}', r, (xx, 0.705, 0), (0.05, 0.03, P - 0.1), 'anthracite', ch=0.006, groupe=groupe)
    if voile:
        boite(nom + '_voile', r, (0, 0.5, -P / 2 + 0.06), (L - 0.2, 0.36, 0.015), 'laque_grise', ch=0.004, groupe=groupe)
    boite(nom + '_caisson', r, (L / 2 - 0.35, 0.32, 0.05), (0.42, 0.56, 0.55), 'laque', ch=0.008, groupe=groupe)
    for k in range(3):
        boite(f'{nom}_tir{k}', r, (L / 2 - 0.35, 0.16 + k * 0.17, 0.33), (0.4, 0.15, 0.012), 'laque', ch=0.004, groupe=groupe)
        boite(f'{nom}_ptir{k}', r, (L / 2 - 0.35, 0.21 + k * 0.17, 0.343), (0.16, 0.012, 0.014), 'inox_brosse', ch=0.003, groupe='petits')
    c, s = abs(math.cos(ry)), abs(math.sin(ry))
    mobilier.solide(x - (c * L + s * P) / 2, z - (s * L + c * P) / 2, x + (c * L + s * P) / 2, z + (s * L + c * P) / 2)
    return r


def cadre_affiche(nom, r, c, w, h, img, groupe='cadres_affiches'):
    """Affiche sous cadre aluminium fin, accrochée au mur (c : centre, sur le mur, repère tourné vers la pièce)."""
    x, y, z = c
    for (dx, dy, ww, hh) in ((0, h / 2 + 0.01, w + 0.04, 0.02), (0, -h / 2 - 0.01, w + 0.04, 0.02), (-w / 2 - 0.01, 0, 0.02, h), (w / 2 + 0.01, 0, 0.02, h)):
        boite(f'{nom}_c{dx:.2f}{dy:.2f}', r, (x + dx, y + dy, z + 0.012), (ww, hh, 0.024), 'inox_brosse', ch=0.003, groupe=groupe)
    boite(nom + '_fond', r, (x, y, z + 0.006), (w, h, 0.012), 'laque', ch=0, groupe=groupe)
    plaque(nom + '_image', r, (x, y, z + 0.0125), w, h, img, groupe=img)


def panneau_suspendu(nom, x, z, ry, w, h, img, y_haut, h_plafond, deux_faces=True):
    """Panneau de signalétique suspendu au plafond par deux tiges."""
    r = Rep(x, z, ry)
    yc = y_haut - h / 2
    boite(nom + '_caisson', r, (0, yc, 0), (w + 0.04, h + 0.04, 0.04), 'nuit', ch=0.008, groupe='signaletique')
    plaque(nom + '_av', r, (0, yc, 0.0205), w, h, img, groupe=img)
    if deux_faces:
        plaque(nom + '_ar', r.sous(0, 0, 0, ry=PI), (0, yc, 0.0205), w, h, img, groupe=img)
    for s in (-1, 1):
        cyl(f'{nom}_tige{s}', r, (s * w * 0.35, y_haut, 0), [(0.006, 0), (0.006, h_plafond - y_haut), (0, h_plafond - y_haut)], 'inox_brosse', n=8, groupe='inox')


def comptoir_accueil(nom, x0, x1, z0, z1, retour='x0'):
    """Banque d'accueil : façade à tasseaux de chêne sur fond sarcelle, tablette haute en solid surface blanc,
    bandeau lumineux au pied, plan de travail bas derrière, retour latéral, lettres « Accueil » et logo."""
    g = 'meubles'
    L = x1 - x0
    zf = z0
    # carcasse et plinthe lumineuse
    geo.pave(nom + '_carcasse', x0, 0.08, zf + 0.03, x1, 1.02, z1, 'laque', groupe=g, chanfrein=0.004)
    geo.pave(nom + '_plinthe', x0 + 0.04, 0, zf + 0.06, x1, 0.08, z1, 'anthracite', groupe=g, chanfrein=0.002)
    geo.pave(nom + '_led', x0 + 0.04, 0.075, zf + 0.055, x1, 0.082, zf + 0.07, 'led_chaude', groupe='led', chanfrein=0)
    geo.pave(nom + '_fond_facade', x0, 0.1, zf, x1, 1.02, zf + 0.03, 'sarcelle', groupe=g, chanfrein=0.002)
    n = int(L / 0.06)
    for k in range(n):
        xx = x0 + 0.03 + k * (L - 0.06) / (n - 1)
        geo.pave(f'{nom}_tasseau{k}', xx - 0.016, 0.1, zf - 0.03, xx + 0.016, 1.02, zf, 'hetre', groupe='tasseaux', chanfrein=0.003, fil='y')
    geo.pave(nom + '_tablette', x0 - 0.05, 1.02, zf - 0.08, x1 + 0.02, 1.06, zf + 0.32, 'stratifie', groupe=g, chanfrein=0.01, segments=2)
    geo.pave(nom + '_plan', x0 + 0.04, 0.72, zf + 0.3, x1, 0.75, z1, 'stratifie', groupe=g, chanfrein=0.006)
    # retour latéral
    xr = x0 if retour == 'x0' else x1 - 0.06
    geo.pave(nom + '_retour', xr, 0.08, zf, xr + 0.06, 1.02, z1, 'hetre', groupe=g, chanfrein=0.004, fil='y')
    # lettres et logo sur un bandeau blanc
    r = Rep((x0 + x1) / 2, zf - 0.03, PI)      # la façade regarde vers −z… on oriente le texte vers le visiteur (+z page ? non : −z)
    return r


def porte_battant(nom, a, b, zp, cote, mat_feuille='hetre'):
    """Battant de porte de service, modelé autour de sa charnière (côté a) : âme en stratifié bois, chant,
    oculus vitré à cadre inox, plaque de propreté, béquille et rosace. Éclairé par sonde dans la page,
    qui le fait pivoter autour de la charnière."""
    L = b - a - 0.02
    r = Rep(a + 0.01, zp, 0.0)
    g = 'battant_' + nom
    # l'âme est percée de l'oculus (x de L−0.41 à L−0.19, y de 1.19 à 1.71) : quatre parties autour de la vitre
    xa, xb, ya, yb = L - 0.41, L - 0.19, 1.19, 1.71
    for k, (u0, u1, v0, v1) in enumerate(((0, L, 0, ya), (0, L, yb, 2.06), (0, xa, ya, yb), (xb, L, ya, yb))):
        boite(f'{g}_ame{k}', r, ((u0 + u1) / 2, (v0 + v1) / 2, 0), (u1 - u0, v1 - v0, 0.045), mat_feuille, ch=0.002, groupe=g, lumiere='sonde')
    for s in (-1, 1):
        zf = s * 0.0235
        boite(f'{g}_coup{s}', r, (L / 2, 0.15, zf), (L - 0.04, 0.26, 0.002), 'inox_brosse', ch=0.001, groupe=g, lumiere='sonde')
        for (dx, dy, w, h) in ((0, 0.27, 0.24, 0.025), (0, -0.27, 0.24, 0.025), (-0.12, 0, 0.025, 0.56), (0.12, 0, 0.025, 0.56)):
            boite(f'{g}_ocu{s}{dx}{dy}', r, (L - 0.3 + dx, 1.45 + dy, zf), (w, h, 0.012), 'inox_brosse', ch=0.003, groupe=g, lumiere='sonde')
        cyl(f'{g}_rosace{s}', r, (L - 0.08, 1.0, zf), [(0, 0), (0.028, 0), (0.028, 0.008), (0, 0.008)], 'inox_brosse', n=16, axe=Matrix.Rotation(s * PI / 2, 3, 'X'), groupe=g, lumiere='sonde')
        tube(f'{g}_bequille{s}', [r.p(L - 0.08, 1.0, s * 0.03), r.p(L - 0.08, 1.0, s * 0.07), r.p(L - 0.22, 1.0, s * 0.07)], 0.011, 'inox_brosse', groupe=g, lumiere='sonde')
    boite(g + '_vitre', r, (L - 0.3, 1.45, 0), (0.22, 0.52, 0.008), 'verre_appareil', ch=0, groupe=g + '_vitre', lumiere='sonde')
