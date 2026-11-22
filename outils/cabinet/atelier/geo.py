# Outils de modelage pour Blender, en coordonnées de la page (Three.js) :
#   x vers l'est, y vers le haut, z vers le sud ; Blender a z vers le haut, d'où V().
# Chaque pièce de modelage devient un objet Blender, rangé dans un « groupe » :
# à la fin, les objets d'un même groupe sont réunis (moins d'appels de dessin dans la page).
import bpy, bmesh, math
from mathutils import Vector, Matrix

PI = math.pi
TAU = 2 * PI


def V(x, y, z):
    """Point de la page → point de Blender."""
    return Vector((x, -z, y))


def P(v):
    """Point de Blender → point de la page."""
    return (v.x, v.z, -v.y)


COLLECTION = None


def collection(nom='piece'):
    global COLLECTION
    if nom in bpy.data.collections:
        COLLECTION = bpy.data.collections[nom]
    else:
        COLLECTION = bpy.data.collections.new(nom)
        bpy.context.scene.collection.children.link(COLLECTION)
    return COLLECTION


def uv_boite(bm, echelle=1.0, fil=None, decal=(0.0, 0.0)):
    """Coordonnées de texture « projetées » selon l'axe dominant de chaque face, 1 unité = 1 m.
    fil = 'y' fait courir le fil du bois verticalement sur les faces verticales."""
    uv = bm.loops.layers.uv.get('UVMap') or bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        n = f.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)   # repère de Blender
        for l in f.loops:
            x, y, z = P(l.vert.co)
            if az >= ax and az >= ay:        # face horizontale (sol, dessus)
                u, v = x, z
            elif ax >= ay:                    # face tournée vers l'est ou l'ouest
                u, v = z, y
            else:                             # face tournée vers le nord ou le sud
                u, v = x, y
            if fil == 'y' and not (az >= ax and az >= ay):
                u, v = v, u
            l[uv].uv = ((u + decal[0]) * echelle, (v + decal[1]) * echelle)


def objet(nom, bm, mats, groupe=None, lisse=None, uv=None, atlas='A', **props):
    """Crée l'objet Blender à partir d'un bmesh. mats : liste de noms de matières (indices des faces)."""
    if uv is None:
        uv_boite(bm)
    me = bpy.data.meshes.new(nom)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(bpy.data.materials[m])
    ob = bpy.data.objects.new(nom, me)
    COLLECTION.objects.link(ob)
    if lisse:
        for p in me.polygons:
            p.use_smooth = True
        me.set_sharp_from_angle(angle=math.radians(lisse))
    ob['groupe'] = groupe or nom
    ob['atlas'] = atlas
    for k, v in props.items():
        ob[k] = v
    return ob


def _boite_bm(bm, x0, y0, z0, x1, y1, z1, mi=0):
    xs, ys, zs = sorted((x0, x1)), sorted((y0, y1)), sorted((z0, z1))
    vs = [bm.verts.new(V(xs[i & 1], ys[(i >> 1) & 1], zs[(i >> 2) & 1])) for i in range(8)]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
    res = []
    for f in faces:
        fa = bm.faces.new([vs[i] for i in f])
        fa.material_index = mi
        res.append(fa)
    bmesh.ops.recalc_face_normals(bm, faces=res)
    return vs, res


def pave(nom, x0, y0, z0, x1, y1, z1, mat, chanfrein=0.004, groupe=None, fil=None, segments=1, atlas='A', **props):
    """Un pavé aux arêtes adoucies (le chanfrein accroche la lumière : un vrai meuble n'a pas d'arête vive)."""
    bm = bmesh.new()
    _boite_bm(bm, x0, y0, z0, x1, y1, z1)
    if chanfrein > 0:
        mx = min(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0))
        c = min(chanfrein, mx * 0.3)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=c, segments=segments, profile=0.5, affect='EDGES', clamp_overlap=True)
    uv_boite(bm, fil=fil)
    return objet(nom, bm, [mat], groupe=groupe, uv=False, lisse=40 if segments > 1 else None, atlas=atlas, **props)


def tour(nom, profil, mat, centre=(0, 0, 0), n=32, groupe=None, ferme_haut=True, ferme_bas=True, lisse=50, atlas='A', axe=None, **props):
    """Pièce tournée : profil = [(rayon, hauteur), ...] de bas en haut, révolution autour de l'axe vertical."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    cx, cy, cz = centre
    anneaux = []
    for (r, h) in profil:
        anneau = []
        for k in range(n):
            a = k / n * TAU
            p = Vector((r * math.cos(a), h, r * math.sin(a)))
            if axe is not None:
                p = axe @ p
            anneau.append(bm.verts.new(V(cx + p.x, cy + p.y, cz + p.z)))
        anneaux.append(anneau)
    # longueur le long du profil, pour le fil du bois
    s = [0.0]
    for i in range(1, len(profil)):
        s.append(s[-1] + math.hypot(profil[i][0] - profil[i - 1][0], profil[i][1] - profil[i - 1][1]))
    rmax = max(r for r, _ in profil) or 0.01
    for i in range(len(anneaux) - 1):
        for k in range(n):
            k2 = (k + 1) % n
            q = [anneaux[i][k], anneaux[i][k2], anneaux[i + 1][k2], anneaux[i + 1][k]]
            if len(set(q)) < 4:
                continue
            try:
                f = bm.faces.new(q)
            except ValueError:
                continue
            for l, (a, b) in zip(f.loops, [(k, i), (k + 1, i), (k + 1, i + 1), (k, i + 1)]):
                l[uv].uv = (a / n * TAU * rmax, s[b])
    for anneau, ferme, r in ((anneaux[0], ferme_bas, profil[0][0]), (anneaux[-1], ferme_haut, profil[-1][0])):
        if ferme and r > 1e-5:
            f = bm.faces.new(anneau)
            for l in f.loops:
                x, y, z = P(l.vert.co)
                l[uv].uv = (x - cx, z - cz)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return objet(nom, bm, [mat], groupe=groupe, uv=False, lisse=lisse, atlas=atlas, **props)


def balayer(nom, chemin, normales, haut, profil, mat, ferme=False, groupe=None, lisse=35, bouts=True, atlas='A', **props):
    """Balaie un profil de moulure le long d'un chemin.
    chemin : points (page) ; normales : pour chaque segment, la direction « vers l'avant » de la moulure
    (dans le plan perpendiculaire à haut) ; haut : direction des ordonnées du profil.
    profil : [(avancée, hauteur), ...]. Les angles sont coupés d'onglet, comme en menuiserie."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    pts = [Vector(p) for p in chemin]
    H = Vector(haut).normalized()
    nseg = len(pts) if ferme else len(pts) - 1
    N = [Vector(n).normalized() for n in normales]
    # direction d'onglet en chaque sommet
    onglets = []
    for i in range(len(pts)):
        if ferme:
            n0, n1 = N[(i - 1) % nseg], N[i % nseg]
        else:
            n0 = N[max(0, i - 1)] if i > 0 else N[0]
            n1 = N[min(i, nseg - 1)]
        m = (n0 + n1)
        if m.length < 1e-6:
            m = n1.copy()
        m.normalize()
        c = max(0.2, m.dot(n1))
        onglets.append(m / c)
    # longueur cumulée
    s = [0.0]
    for i in range(1, len(pts)):
        s.append(s[-1] + (pts[i] - pts[i - 1]).length)
    if ferme:
        s.append(s[-1] + (pts[0] - pts[-1]).length)
    sp = [0.0]
    for j in range(1, len(profil)):
        sp.append(sp[-1] + math.hypot(profil[j][0] - profil[j - 1][0], profil[j][1] - profil[j - 1][1]))
    rangs = []
    idx = list(range(len(pts))) + ([0] if ferme else [])
    for i in idx:
        rangs.append([bm.verts.new(V(*(pts[i] + onglets[i] * a + H * h))) for (a, h) in profil])
    for i in range(len(rangs) - 1):
        for j in range(len(profil) - 1):
            q = [rangs[i][j], rangs[i + 1][j], rangs[i + 1][j + 1], rangs[i][j + 1]]
            try:
                f = bm.faces.new(q)
            except ValueError:
                continue
            for l, (a, b) in zip(f.loops, [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]):
                l[uv].uv = (s[a], sp[b])
    if bouts and not ferme:
        for r in (rangs[0], rangs[-1]):
            if len(r) >= 3:
                try:
                    f = bm.faces.new(r)
                    for l in f.loops:
                        x, y, z = P(l.vert.co)
                        l[uv].uv = (x + z, y)
                except ValueError:
                    pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return objet(nom, bm, [mat], groupe=groupe, uv=False, lisse=lisse, atlas=atlas, **props)


def extruder(nom, contour, profondeur, origine, ax_u, ax_v, ax_w, mat, groupe=None, chanfrein=0.0, lisse=None, atlas='A', **props):
    """Extrude un contour plan (points (u, v)) sur une profondeur, le long de ax_w.
    Sert aux consoles de cheminée, aux traverses chantournées…"""
    bm = bmesh.new()
    O, U, Vv, W = Vector(origine), Vector(ax_u), Vector(ax_v), Vector(ax_w)
    bas = [bm.verts.new(V(*(O + U * u + Vv * v))) for (u, v) in contour]
    haut = [bm.verts.new(V(*(O + U * u + Vv * v + W * profondeur))) for (u, v) in contour]
    bm.faces.new(bas)
    bm.faces.new(list(reversed(haut)))
    n = len(contour)
    for i in range(n):
        j = (i + 1) % n
        try:
            bm.faces.new([bas[i], bas[j], haut[j], haut[i]])
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if chanfrein > 0:
        bords = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(50)]
        bmesh.ops.bevel(bm, geom=bords, offset=chanfrein, segments=2, profile=0.5, affect='EDGES', clamp_overlap=True)
    uv_boite(bm)
    return objet(nom, bm, [mat], groupe=groupe, uv=False, lisse=lisse, atlas=atlas, **props)


def arc(cx, cy, r, a0, a1, n=8):
    """Points d'un arc (angles en degrés), pour dessiner les profils de moulure."""
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]


def reunir(groupes=None):
    """Réunit les objets d'un même groupe (une seule géométrie par groupe et par matière)."""
    par = {}
    for ob in list(COLLECTION.objects):
        if ob.type != 'MESH':
            continue
        if len(ob.data.uv_layers):
            ob.data.uv_layers[0].name = 'UVMap'      # même nom partout : une seule carte après réunion
        g = ob.get('groupe')
        if groupes and g not in groupes:
            continue
        par.setdefault(g, []).append(ob)
    for g, obs in par.items():
        if len(obs) < 2:
            obs[0].name = g
            continue
        with bpy.context.temp_override(active_object=obs[0], object=obs[0], selected_objects=obs, selected_editable_objects=obs):
            bpy.ops.object.join()
        obs[0].name = g
        obs[0].data.name = g


def orienter(ob, vers):
    """Retourne toutes les faces si, en majorité (pondérée par l'aire), elles tournent le dos au point « vers »
    (la pièce) : une moulure ouverte n'a pas d'intérieur, Blender ne peut pas deviner son sens."""
    from mathutils import Vector
    ref = V(*vers)
    me = ob.data
    vote = sum(p.area * p.normal.dot(ref - p.center) / max(1e-6, (ref - p.center).length) for p in me.polygons)
    if vote < 0:
        bm = bmesh.new()
        bm.from_mesh(me)
        for f in bm.faces:
            f.normal_flip()
        bm.to_mesh(me)
        bm.free()
    return vote < 0
