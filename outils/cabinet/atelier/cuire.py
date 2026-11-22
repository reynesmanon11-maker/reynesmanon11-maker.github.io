# Cuisson de l'éclairage (Cycles) : chaque surface fixe reçoit, dans une seconde carte de
# coordonnées (« lightmap »), la lumière qu'elle reçoit — soleil, ciel, feu, et tous les rebonds.
# La page n'a plus qu'à multiplier sa couleur par cette lumière : l'éclairage global d'un rendu
# photoréaliste, pour le prix d'une texture.
# blender -b piece.blend -P cuire.py -- <dossier de sortie> <taille> <échantillons>
import bpy, bmesh, sys, os, math, json, time
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
SORTIE, TAILLE, ECH = args[0], int(args[1]), int(args[2])
os.makedirs(SORTIE, exist_ok=True)
sc = bpy.context.scene
piece = bpy.data.collections['piece']
ARCHI = {'murs', 'facade', 'facade_est', 'sol', 'plafond', 'lambris', 'menuiseries', 'ebrasements', 'chassis', 'marbre', 'foyer'}


def aire_monde(ob):
    me = ob.data
    m = ob.matrix_world
    return sum((m.to_3x3() @ p.normal).length * p.area for p in me.polygons) or 1e-6


def a_cuire(ob):
    if ob.type != 'MESH' or ob.get('cuire', 1) == 0 or ob.get('lumiere') == 'sonde':
        return False
    mats = [s.material for s in ob.material_slots if s.material]
    return not all(m.get('verre') for m in mats)


objets = [o for o in piece.objects if a_cuire(o)]
for o in objets:
    o['atlas'] = 'A' if o.name in ARCHI or o.get('groupe') in ARCHI else 'B'
groupes = {'A': [o for o in objets if o['atlas'] == 'A'], 'B': [o for o in objets if o['atlas'] == 'B']}
print('ATLAS', {k: len(v) for k, v in groupes.items()})

# ---------------------------------------------------------------- 1. coordonnées de lumière
t = time.time()
for o in objets:
    me = o.data
    if len(me.uv_layers) == 0:
        me.uv_layers.new(name='UVMap')
    if 'lightmap' not in me.uv_layers:
        me.uv_layers.new(name='lightmap')
    me.uv_layers.active = me.uv_layers['lightmap']
    me.uv_layers[0].active_render = True
bpy.ops.object.select_all(action='DESELECT')


def projeter(o, marge):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=marge, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    o.select_set(False)


def uvs(o):
    a = np.empty(len(o.data.loops) * 2, np.float32)
    o.data.uv_layers['lightmap'].data.foreach_get('uv', a)
    return a.reshape(-1, 2)


def ecrire(o, a):
    o.data.uv_layers['lightmap'].data.foreach_set('uv', np.ascontiguousarray(a, dtype=np.float32).ravel())


def ranger_par_objet(obs):
    """Chaque objet reçoit un carré de l'atlas, proportionné à sa surface (pondérée par sa densité) ;
    ses îles y sont rangées par la projection « intelligente » de Blender."""
    poids = {}
    for o in obs:
        projeter(o, 0.006)
        a = uvs(o)
        mn, mx = a.min(0), a.max(0)
        ecrire(o, (a - mn) / max(1e-9, (mx - mn).max()))
        poids[o.name] = math.sqrt(aire_monde(o) * o.get('densite', 1.0))
    ordre = sorted(obs, key=lambda o: -poids[o.name])

    def essai(K):
        x = y = h = 0.0
        pos = {}
        for o in ordre:
            c = poids[o.name] * K
            if c > 1:
                return None
            if x + c > 1:
                y += h; x = 0.0; h = 0.0
            if y + c > 1:
                return None
            pos[o.name] = (x, y, c)
            x += c
            h = max(h, c)
        return pos
    lo, hi = 0.0, 1.0 / max(poids.values())
    for _ in range(40):
        m = (lo + hi) / 2
        if essai(m):
            lo = m
        else:
            hi = m
    pos = essai(lo)
    pad = 2.0 / TAILLE
    for o in obs:
        x, y, c = pos[o.name]
        ecrire(o, uvs(o) * (c - 2 * pad) + np.array([x + pad, y + pad]))
    print('RANGÉ', len(obs), 'objets, plus petit carré', round(min(p[2] for p in pos.values()) * TAILLE), 'px')


def ranger_ensemble(obs):
    """Toutes les îles du groupe dans le même carré, à finesse égale (pour l'architecture)."""
    for o in obs:
        projeter(o, 0.0)
        me = o.data
        bm = bmesh.new()
        bm.from_mesh(me)
        uv = bm.loops.layers.uv['lightmap']
        a_uv = sum(abs(sum((l[uv].uv.x * l.link_loop_next[uv].uv.y - l.link_loop_next[uv].uv.x * l[uv].uv.y) for l in f.loops)) / 2 for f in bm.faces) or 1e-9
        k = math.sqrt(aire_monde(o) / a_uv) * math.sqrt(o.get('densite', 1.0))
        for f in bm.faces:
            for l in f.loops:
                l[uv].uv *= k
        o['aire_uv'] = a_uv * k * k
        bm.to_mesh(me)
        bm.free()
    total = sum(o['aire_uv'] for o in obs)
    f = math.sqrt(0.3 / total)
    for o in obs:
        a = uvs(o)
        ecrire(o, (a - a.min(0)) * f * 0.2 + 0.05)
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, scale=True, margin_method='FRACTION', margin=3.0 / TAILLE)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    mn = np.min([uvs(o).min(0) for o in obs], 0)
    mx = np.max([uvs(o).max(0) for o in obs], 0)
    print('BORNES', mn, mx)
    if mn.min() < -1e-3 or mx.max() > 1.001:
        e = (mx - mn).max()
        for o in obs:
            ecrire(o, (uvs(o) - mn) / e * 0.996 + 0.002)


for nom, obs in groupes.items():
    if nom == 'A':
        ranger_ensemble(obs)
    else:
        ranger_par_objet(obs)
print('UV faites en', round(time.time() - t), 's')

# ---------------------------------------------------------------- 2. cuisson
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = ECH
sc.cycles.use_denoising = False
sc.render.bake.margin = 8
sc.render.bake.margin_type = 'EXTEND'
sc.render.bake.use_clear = True
reglages = {}
for nom, obs in groupes.items():
    img = bpy.data.images.new(f'lumiere_{nom}', TAILLE, TAILLE, float_buffer=True, alpha=False)
    noeuds = []
    for o in obs:
        for s in o.material_slots:
            m = s.material
            if not m or not m.use_nodes:
                continue
            n = m.node_tree.nodes.get('cuisson') or m.node_tree.nodes.new('ShaderNodeTexImage')
            n.name = 'cuisson'
            n.image = img
            m.node_tree.nodes.active = n
            noeuds.append(n)
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, uv_layer='lightmap')
    print('CUISSON', nom, round(time.time() - t), 's')
    img.filepath_raw = os.path.join(SORTIE, f'lumiere_{nom}_brut.exr')
    img.file_format = 'OPEN_EXR'
    img.save()

# ---------------------------------------------------------------- 3. débruitage (OpenImageDenoise, par le compositeur)
deb = bpy.data.scenes.new('debruitage')
deb.render.engine = 'CYCLES'
deb.cycles.samples = 1
deb.render.resolution_x = deb.render.resolution_y = TAILLE
deb.render.resolution_percentage = 100
deb.use_nodes = True
deb.render.image_settings.file_format = 'OPEN_EXR'
deb.render.image_settings.color_depth = '32'
deb.view_settings.view_transform = 'Standard'
deb.display_settings.display_device = 'sRGB'
nt = deb.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
for nom in groupes:
    im = bpy.data.images.load(os.path.join(SORTIE, f'lumiere_{nom}_brut.exr'))
    a = nt.nodes.new('CompositorNodeImage'); a.image = im
    d = nt.nodes.new('CompositorNodeDenoise'); d.use_hdr = True
    try:
        d.prefilter = 'ACCURATE'
    except Exception:
        pass
    c = nt.nodes.new('CompositorNodeComposite')
    nt.links.new(a.outputs['Image'], d.inputs['Image'])
    nt.links.new(d.outputs['Image'], c.inputs['Image'])
    deb.render.filepath = os.path.join(SORTIE, f'lumiere_{nom}.exr')
    with bpy.context.temp_override(scene=deb):
        bpy.ops.render.render(write_still=True, scene=deb.name)
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    print('DÉBRUITÉ', nom)

# ---------------------------------------------------------------- 4. codage 8 bits (sRGB, rapporté au maximum) et données
for nom in groupes:
    im = bpy.data.images.load(os.path.join(SORTIE, f'lumiere_{nom}.exr'))
    px = np.array(im.pixels[:], dtype=np.float32).reshape(TAILLE, TAILLE, 4)[..., :3]
    brut = bpy.data.images.load(os.path.join(SORTIE, f'lumiere_{nom}_brut.exr'))
    pb = np.array(brut.pixels[:], dtype=np.float32).reshape(TAILLE, TAILLE, 4)[..., :3]
    occupe = pb.max(-1) > 0
    if not occupe.any() or px.max() <= 0:
        px = pb
    px = np.clip(px, 0, None)
    M = float(np.percentile(px.max(-1)[occupe], 99.7)) if occupe.any() else 1.0
    v = np.clip(px / M, 0, 1)
    s = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    s = np.clip(s * 255 + np.random.default_rng(1).uniform(-0.5, 0.5, s.shape), 0, 255).round().astype(np.uint8)
    np.save(os.path.join(SORTIE, f'lumiere_{nom}.npy'), s[::-1])        # rangées de haut en bas, comme une image
    reglages[nom] = {'max': M, 'taille': TAILLE}
    print('CODÉ', nom, 'max', M)
json.dump(reglages, open(os.path.join(SORTIE, 'lumiere.json'), 'w'), indent=1)

# on retire les nœuds de cuisson avant d'enregistrer
for m in bpy.data.materials:
    if m.use_nodes and 'cuisson' in m.node_tree.nodes:
        m.node_tree.nodes.remove(m.node_tree.nodes['cuisson'])
bpy.data.scenes.remove(deb)
for o in objets:
    o.data.uv_layers[0].active = True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SORTIE, 'piece_cuite.blend'))
print('FINI')
