# Des personnes réalistes à partir des données de MakeHuman (CC0) : maillage de base, cibles de
# morphologie (sexe, âge, origine), peau photographique, yeux, sourcils, cils, coiffure, vêtements,
# chaussures. On ne fait que LIRE leurs fichiers : l'ajustement des vêtements (fichiers .mhclo), la
# morphologie (.target) et le squelette (.json) sont calculés ici, puis Blender pose les bras le long du corps.
import os, gzip, json, math
import bpy, bmesh
from mathutils import Vector, Matrix
import geo
from geo import V

MH = os.environ.get('MAKEHUMAN', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sources'))
DONNEES = os.path.join(MH, 'mpfb2', 'src', 'mpfb', 'data')
ACTIFS = os.path.join(MH, 'mh', 'assets')
_BASE = None
REFS = {}


def base():
    """base.obj : sommets, coordonnées de texture, faces avec leur groupe (corps, aides, articulations)."""
    global _BASE
    if _BASE:
        return _BASE
    vs, vts, faces, groupes, g = [], [], [], {}, 'body'
    for l in open(os.path.join(DONNEES, '3dobjs', 'base.obj')):
        if l.startswith('v '):
            vs.append([float(a) for a in l.split()[1:4]])
        elif l.startswith('vt '):
            vts.append([float(a) for a in l.split()[1:3]])
        elif l.startswith('g '):
            g = l.split()[1]
        elif l.startswith('f '):
            idx = [p.split('/') for p in l.split()[1:]]
            faces.append(([int(p[0]) - 1 for p in idx], [int(p[1]) - 1 for p in idx] if len(idx[0]) > 1 and idx[0][1] else None, g))
            groupes.setdefault(g, set()).update(int(p[0]) - 1 for p in idx)
    _BASE = (vs, vts, faces, groupes)
    return _BASE


def cible(nom):
    deltas = {}
    with gzip.open(os.path.join(DONNEES, 'targets', nom + '.target.gz'), 'rt') as f:
        for l in f:
            if l[0].isdigit():
                a = l.split()
                deltas[int(a[0])] = (float(a[1]), float(a[2]), float(a[3]))
    return deltas


def morpho(sexe, age, origine):
    """Sommets déformés : âge 0 = 25 ans, 1 = 90 ans ; mélange jeune/vieux comme MakeHuman."""
    vs = [list(v) for v in base()[0]]
    vieux = max(0.0, min(1.0, age))
    for (nom, poids) in ((f'macrodetails/universal-{sexe}-young-averagemuscle-averageweight', 1 - vieux),
                         (f'macrodetails/universal-{sexe}-old-averagemuscle-averageweight', vieux),
                         (f'macrodetails/{origine}-{sexe}-young', 1 - vieux), (f'macrodetails/{origine}-{sexe}-old', vieux)):
        if poids <= 0:
            continue
        for i, d in cible(nom).items():
            vs[i][0] += d[0] * poids; vs[i][1] += d[1] * poids; vs[i][2] += d[2] * poids
    return vs


def lire_mhclo(chemin):
    info = {'refs': [], 'echelles': {}, 'suppr': set(), 'obj': None, 'mat': None}
    mode = None
    d = os.path.dirname(chemin)
    for l in open(chemin, encoding='utf-8', errors='replace'):
        l = l.strip()
        if not l or l.startswith('#'):
            continue
        a = l.split()
        if a[0] in ('x_scale', 'y_scale', 'z_scale'):
            info['echelles'][a[0][0]] = (int(a[1]), int(a[2]), float(a[3]))
        elif a[0] == 'obj_file':
            info['obj'] = os.path.join(d, a[1])
        elif a[0] == 'material':
            info['mat'] = os.path.join(d, a[1])
        elif a[0] == 'verts':
            mode = 'verts'
        elif a[0] == 'delete_verts':
            mode = 'suppr'
        elif a[0] in ('weights', 'offsets', 'z_depth', 'max_pole', 'special_pose'):
            mode = None if a[0] != 'z_depth' else mode
        elif mode == 'verts' and (a[0].lstrip('-').isdigit()):
            if len(a) >= 9:
                info['refs'].append(([int(x) for x in a[:3]], [float(x) for x in a[3:6]], [float(x) for x in a[6:9]]))
            elif len(a) == 1:
                info['refs'].append(([int(a[0])] * 3, [1.0, 0, 0], [0.0, 0, 0]))
        elif mode == 'suppr':
            # « 1355 - 1398 1404 » : des plages séparées par un tiret isolé, et des numéros seuls
            prec, plage = None, False
            for t in a:
                if t == '-':
                    plage = True
                    continue
                if not t.isdigit():
                    continue
                n = int(t)
                if plage and prec is not None:
                    info['suppr'].update(range(prec, n + 1))
                else:
                    info['suppr'].add(n)
                prec, plage = n, False
    return info


def lire_obj(chemin):
    vs, vts, fs = [], [], []
    for l in open(chemin, encoding='utf-8', errors='replace'):
        if l.startswith('v '):
            vs.append([float(a) for a in l.split()[1:4]])
        elif l.startswith('vt '):
            vts.append([float(a) for a in l.split()[1:3]])
        elif l.startswith('f '):
            idx = [p.split('/') for p in l.split()[1:]]
            fs.append(([int(p[0]) - 1 for p in idx], [int(p[1]) - 1 for p in idx] if len(idx[0]) > 1 and idx[0][1] else None))
    return vs, vts, fs


def texture_mhmat(chemin, cle='diffuseTexture'):
    for l in open(chemin, encoding='utf-8', errors='replace'):
        a = l.split()
        if a and a[0] == cle:
            return os.path.join(os.path.dirname(chemin), a[1])
    return None


def matiere(nom, texture=None, couleur=None, rug=0.6, alpha=False, normal=None, sss=0.0):
    if nom in bpy.data.materials:
        return bpy.data.materials[nom]
    m = bpy.data.materials.new(nom); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rug
    b.inputs['Specular IOR Level'].default_value = 0.35
    if texture:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(texture, check_existing=True)
        if couleur:
            mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
            mix.inputs[7].default_value = (*couleur, 1)
            nt.links.new(t.outputs['Color'], mix.inputs[6]); nt.links.new(mix.outputs[2], b.inputs['Base Color'])
        else:
            nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alpha:
            nt.links.new(t.outputs['Alpha'], b.inputs['Alpha'])
            for attr, val in (('blend_method', 'HASHED'), ('surface_render_method', 'DITHERED')):
                try: setattr(m, attr, val)
                except Exception: pass
    elif couleur:
        b.inputs['Base Color'].default_value = (*couleur, 1)
    if normal and os.path.exists(normal):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(normal, check_existing=True); t.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.6
        nt.links.new(t.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.012, 0.005, 0.003)
    return m


def maillage(nom, vs, vts, fs, mat):
    me = bpy.data.meshes.new(nom)
    bm = bmesh.new()
    bv = [bm.verts.new((v[0], -v[2], v[1])) for v in vs]      # MakeHuman : y vers le haut → Blender : z vers le haut
    uv = bm.loops.layers.uv.new('UVMap')
    for (fi, ti) in fs:
        try:
            f = bm.faces.new([bv[i] for i in fi])
        except ValueError:
            continue
        if ti and vts:
            for l, t in zip(f.loops, ti):
                l[uv].uv = vts[t]
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(nom, me)
    geo.COLLECTION.objects.link(ob)
    return ob


def ajuster(chemin_mhclo, vs_corps, nom, mat=None, couleur=None, rug=0.7):
    """Un vêtement, des cheveux, des sourcils… placés sur le corps déformé, comme le fait MakeHuman."""
    c = lire_mhclo(chemin_mhclo)
    pvs, pvts, pfs = lire_obj(c['obj'])
    ech = {}
    for k, (a, b, den) in c['echelles'].items():
        j = 'xyz'.index(k)
        ech[k] = abs(vs_corps[a][j] - vs_corps[b][j]) / den if den else 1.0
    pos = []
    for (r, w, d) in c['refs']:
        p = [sum(w[i] * vs_corps[r[i]][j] for i in range(3)) for j in range(3)]
        p = [p[0] + d[0] * ech.get('x', 1), p[1] + d[1] * ech.get('y', 1), p[2] + d[2] * ech.get('z', 1)]
        pos.append(p)
    if mat is None:
        tex = texture_mhmat(c['mat']) if c['mat'] else None
        transp = any(x in chemin_mhclo for x in ('hair', 'eyebrow', 'eyelash'))
        mat = matiere(nom + '_mat', texture=tex, couleur=couleur, rug=rug, alpha=transp,
                      normal=texture_mhmat(c['mat'], 'normalmapTexture') if c['mat'] else None)
    ob = maillage(nom, pos, pvts, pfs, mat)
    ob['refs'] = 1
    REFS[ob.name] = c['refs']
    return ob, c['suppr']


# ------------------------------------------------------------------ squelette et pose
def armature(nom, vs, groupes):
    rig = json.load(open(os.path.join(DONNEES, 'rigs', 'standard', 'rig.default.json')))
    def point(p):
        if p['strategy'] == 'CUBE':
            ids = groupes[p['cube_name']]
            m = [sum(vs[i][j] for i in ids) / len(ids) for j in range(3)]
        elif p['strategy'] == 'VERTEX':
            m = vs[p['vertex_index']]
        else:
            ids = p.get('vertex_indices', [])
            m = [sum(vs[i][j] for i in ids) / len(ids) for j in range(3)] if ids else [0, 0, 0]
        return Vector((m[0], -m[2], m[1]))
    arm = bpy.data.armatures.new(nom); ob = bpy.data.objects.new(nom, arm)
    geo.COLLECTION.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    for b, d in rig.items():
        e = arm.edit_bones.new(b); e.head = point(d['head']); e.tail = point(d['tail'])
        if (e.tail - e.head).length < 1e-4:
            e.tail = e.head + Vector((0, 0, 0.01))
        e.roll = d.get('roll', 0.0)
    for b, d in rig.items():
        if d.get('parent'):
            arm.edit_bones[b].parent = arm.edit_bones[d['parent']]
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def lier(ob, arm, poids=None, source=None):
    if poids is not None:
        for b, liste in poids.items():
            g = ob.vertex_groups.new(name=b)
            for (i, w) in liste:
                g.add([i], w, 'REPLACE')
    elif source is not None:
        for g in source.vertex_groups:
            ob.vertex_groups.new(name=g.name)
        dt = ob.modifiers.new('poids', 'DATA_TRANSFER'); dt.object = source
        dt.use_vert_data = True; dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
        dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
        with bpy.context.temp_override(object=ob, active_object=ob):
            bpy.ops.object.modifier_apply(modifier=dt.name)
    m = ob.modifiers.new('squelette', 'ARMATURE'); m.object = arm


def tourner_vers(arm, nom, direction):
    """Tourne l'os pour qu'il pointe dans la direction voulue (repère de l'armature)."""
    pb = arm.pose.bones.get(nom)
    if not pb:
        return
    bpy.context.view_layer.update()
    actuel = (pb.tail - pb.head).normalized()
    q = actuel.rotation_difference(Vector(direction).normalized())
    M = pb.matrix.to_quaternion()
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (M.inverted() @ q @ M) @ pb.rotation_quaternion


def poser(arm, tete=0.0, mains_devant=False):
    """Bras le long du corps (la pose de repos de MakeHuman a les bras écartés), coudes à peine pliés."""
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for s, sx in (('L', 1), ('R', -1)):
        tourner_vers(arm, 'upperarm01.' + s, (sx * 0.2, -0.06, -1.0))
        tourner_vers(arm, 'lowerarm01.' + s, (sx * 0.12, -0.75 if mains_devant else -0.25, -1.0))
    if tete:
        pb = arm.pose.bones.get('head')
        if pb:
            pb.rotation_mode = 'XYZ'; pb.rotation_euler.y = tete
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()


# ------------------------------------------------------------------ une personne
def personne(code, x, z, ry, sexe='male', age=0.3, origine='caucasian', peau='middleage_caucasian_male', cheveux='short02', tenue='male_elegantsuit01',
             couleur_tenue=None, chaussures='shoes02', taille=1.76, sourcils='eyebrow001', cils='eyelashes01', yeux='brown', tete=0.0, mains_devant=False):
    vs = morpho(sexe, age, origine)
    _, vts, faces, groupes = base()
    nom = 'medecin_' + code
    objets = []
    # vêtements d'abord : ils disent quelles parties du corps sont cachées (on les retire, sinon elles percent le tissu)
    cache = set()
    pieces = []
    for (dossier, n, col, rug) in (('clothes', tenue, couleur_tenue, 0.75), ('clothes', chaussures, None, 0.4), ('hair', cheveux, None, 0.45),
                                    ('eyebrows', sourcils, None, 0.6), ('eyelashes', cils, None, 0.6)):
        if not n:
            continue
        ch = os.path.join(ACTIFS, dossier, n, n + '.mhclo')
        if not os.path.exists(ch):
            continue
        m_blanc = matiere(f'blouse_{code}', couleur=col, rug=0.82) if (dossier == 'clothes' and n == tenue and col) else None
        ob, suppr = ajuster(ch, vs, f'{nom}_{n}', mat=m_blanc, rug=rug)
        cache |= suppr
        pieces.append(ob)
    # yeux (maillage bas-poly, iris photographié)
    oeil = os.path.join(ACTIFS, 'eyes', 'low-poly', 'low-poly.mhclo')
    if os.path.exists(oeil):
        mat_oeil = matiere(f'yeux_{yeux}', texture=os.path.join(ACTIFS, 'eyes', 'materials', f'{yeux}_eye.png') if os.path.exists(os.path.join(ACTIFS, 'eyes', 'materials', f'{yeux}_eye.png')) else None,
                           couleur=None if os.path.exists(os.path.join(ACTIFS, 'eyes', 'materials', f'{yeux}_eye.png')) else (0.3, 0.2, 0.1), rug=0.1)
        ob, _ = ajuster(oeil, vs, f'{nom}_yeux', mat=mat_oeil)
        pieces.append(ob)
    # le corps (sans les aides ni les articulations, sans ce que cachent les vêtements)
    tex_peau = texture_mhmat(os.path.join(ACTIFS, 'skins', peau, peau + '.mhmat'))
    mat_peau = matiere('peau_' + peau, texture=tex_peau, rug=0.48, sss=0.08)
    fs = [(fi, ti) for (fi, ti, g) in faces if g == 'body' and not (set(fi) & cache)]
    corps = maillage(nom + '_corps', vs, vts, fs, mat_peau)
    # pose : squelette de MakeHuman, poids du corps transférés aux vêtements
    arm = armature(nom + '_squelette', vs, groupes)
    poids = json.load(open(os.path.join(DONNEES, 'rigs', 'standard', 'weights.default.json')))['weights']
    lier(corps, arm, poids=poids)
    par_sommet = {}
    for b, liste in poids.items():
        for (i, w) in liste:
            par_sommet.setdefault(i, []).append((b, w))
    for p in pieces:
        acc = {}
        for k, (r, w, _) in enumerate(REFS[p.name]):
            for i in range(3):
                for (b, wb) in par_sommet.get(r[i], ()):
                    acc.setdefault(b, {}).setdefault(k, 0.0)
                    acc[b][k] += w[i] * wb
        lier(p, arm, poids={b: list(d.items()) for b, d in acc.items()})
    poser(arm, tete=tete, mains_devant=mains_devant)
    # on fige la pose, on réunit, on met à l'échelle (MakeHuman travaille en décimètres) et on pose dans la pièce
    tous = [corps] + pieces
    for o in tous:
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier='squelette')
        o.vertex_groups.clear()
    bpy.data.objects.remove(arm, do_unlink=True)
    with bpy.context.temp_override(active_object=corps, object=corps, selected_objects=tous, selected_editable_objects=tous):
        bpy.ops.object.join()
    ob = corps; ob.name = nom
    zs = [v.co.z for v in ob.data.vertices]
    h = max(zs) - min(zs)
    s = taille / h
    ob.data.transform(Matrix.Translation((0, 0, -min(zs))))
    ob.data.transform(Matrix.Translation(V(x, 0, z)) @ Matrix.Rotation(ry, 4, 'Z') @ Matrix.Scale(s, 4))
    ob['groupe'] = nom; ob['lumiere'] = 'sonde'; ob['atlas'] = 'B'; ob['personnage'] = nom
    return ob
