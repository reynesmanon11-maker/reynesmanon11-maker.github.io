# Construit la scène Blender du cabinet (architecture, mobilier, lumière) et l'enregistre.
# blender -b --factory-startup -P construire.py -- <dossier des textures préparées> <fichier .blend>
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib
import geo, matieres, piece
for m in (geo, matieres, piece):
    importlib.reload(m)
from mathutils import Vector
from geo import V

args = sys.argv[sys.argv.index('--') + 1:]
TEX, SORTIE = args[0], args[1]

# Le soleil vient du même côté que dans la page (moteur.js : SOLEIL = [−0,45 ; 0,62 ; 0,6])
SOLEIL = Vector((-0.5, 0.45, 0.75)).normalized()      # soleil d'après-midi, plus rasant (prototype)
REGLAGES = {'ciel': 0.45, 'soleil': 3.2, 'feu': 70.0, 'bougie': 1.6, 'exposition': 2.2}


def vider():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def lien(ob, coll):
    coll.objects.link(ob)
    return ob


def lumieres():
    sc = bpy.context.scene
    ctx = geo.collection('contexte')
    ctx['exporter'] = 0
    # ciel physique (sans disque solaire : le soleil est une lampe, plus facile à échantillonner)
    w = bpy.data.worlds.new('ciel')
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    fond = nt.nodes['Background']
    ciel = nt.nodes.new('ShaderNodeTexSky')
    ciel.sky_type = 'NISHITA'
    ciel.sun_disc = False
    ciel.sun_elevation = math.asin(SOLEIL.y)
    sb = V(*SOLEIL)                      # direction du soleil dans Blender
    ciel.sun_rotation = math.atan2(sb.x, -sb.y) % (2 * math.pi)
    ciel.air_density, ciel.dust_density, ciel.ozone_density = 1.0, 2.0, 1.0
    nt.links.new(ciel.outputs['Color'], fond.inputs['Color'])
    fond.inputs['Strength'].default_value = REGLAGES['ciel']
    # soleil
    s = bpy.data.lights.new('soleil', 'SUN')
    s.energy = REGLAGES['soleil']
    s.angle = math.radians(1.2)
    s.color = (1.0, 0.9, 0.76)
    o = lien(bpy.data.objects.new('soleil', s), ctx)
    o.rotation_euler = sb.to_track_quat('Z', 'Y').to_euler()
    # portails : ils guident les rayons du ciel vers les baies (moins de bruit, même résultat)
    for i, (wa, wb) in enumerate(piece.FENETRES):
        l = bpy.data.lights.new(f'portail{i}', 'AREA')
        l.shape = 'RECTANGLE'
        l.size, l.size_y = (wb - wa), (piece.F_HAUT - piece.F_BAS)
        l.cycles.is_portal = True
        o = lien(bpy.data.objects.new(f'portail{i}', l), ctx)
        o.location = V((wa + wb) / 2, (piece.F_BAS + piece.F_HAUT) / 2, 4.83)
        o.rotation_euler = Vector((0, 1, 0)).to_track_quat('-Z', 'Z').to_euler()
    l = bpy.data.lights.new('portail_porte', 'AREA')
    l.shape = 'RECTANGLE'
    l.size, l.size_y = 2.2, 2.7
    l.cycles.is_portal = True
    o = lien(bpy.data.objects.new('portail_porte', l), ctx)
    o.location = V(6.33, 1.35, 0)
    o.rotation_euler = Vector((-1, 0, 0)).to_track_quat('-Z', 'Z').to_euler()
    # le feu : deux sources chaudes et diffuses au-dessus des braises
    for k, z in enumerate((-0.14, 0.12)):
        l = bpy.data.lights.new(f'feu{k}', 'POINT')
        l.energy = REGLAGES['feu']
        l.shadow_soft_size = 0.12
        l.color = (1.0, 0.52, 0.22)
        o = lien(bpy.data.objects.new(f'feu{k}', l), ctx)
        o.location = V(-5.96, 0.24, z)
    # le dehors : un sol d'herbe et le dallage de la serre, pour que la lumière qui entre ait sa couleur
    herbe = matieres.unie('herbe', matieres.lin((70, 88, 50)), rugosite=1.0)
    dalles = matieres.unie('dalles_serre', matieres.lin((150, 92, 66)), rugosite=0.8)
    import bmesh
    for nom, (x0, z0, x1, z1, y), m in (('herbe', (-60, -60, 60, 60, -0.04), 'herbe'), ('dalles_serre', (6.3, -4.5, 14, 4.5, -0.005), 'dalles_serre')):
        bm = bmesh.new()
        vs = [bm.verts.new(V(x, y, z)) for (x, z) in ((x0, z0), (x1, z0), (x1, z1), (x0, z1))]
        bm.faces.new(vs)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            if f.normal.z < 0:
                f.normal_flip()
        me = bpy.data.meshes.new(nom)
        bm.to_mesh(me)
        me.materials.append(bpy.data.materials[m])
        lien(bpy.data.objects.new(nom, me), ctx)


def cameras():
    ctx = geo.collection('contexte')
    vues = {
        'depart':   ((-4.3, 1.6, 2.9), (0.913, -0.06, -0.408)),
        'cheminee': ((3.6, 1.6, 1.9), (-9.6, -0.35, -1.9)),
        'vitrine':  ((1.4, 1.6, 2.4), (0.0, -0.12, -1.0)),
        'fenetres': ((-0.8, 1.6, -2.6), (0.05, -0.05, 1.0)),
        'serre':    ((-4.2, 1.6, -1.2), (1.0, -0.06, 0.12)),
    }
    for nom, (p, d) in vues.items():
        c = bpy.data.cameras.new(nom)
        c.sensor_fit = 'VERTICAL'
        c.angle_y = 1.1
        c.clip_start = 0.04
        o = lien(bpy.data.objects.new('cam_' + nom, c), ctx)
        o.location = V(*p)
        dv = Vector(d).normalized()
        o.rotation_euler = V(*dv).to_track_quat('-Z', 'Y').to_euler()


def reglages_rendu():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 48
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 8
    sc.cycles.diffuse_bounces = 5
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 6
    sc.cycles.transparent_max_bounces = 8
    sc.cycles.sample_clamp_indirect = 8.0
    sc.render.resolution_x, sc.render.resolution_y = 960, 540
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = REGLAGES['exposition']
    sc.render.image_settings.file_format = 'PNG'


vider()
geo.collection('piece')
matieres.charger_reglages(TEX)
matieres.creer_toutes()
piece.construire()
try:
    import mobilier
    importlib.reload(mobilier)
    mobilier.construire()
    import livres
    importlib.reload(livres)
    livres.charger(TEX)
    livres.garnir(mobilier.ETAGERES)
    import accessoires
    importlib.reload(accessoires)
    accessoires.construire()
    import json
    json.dump({'solides': mobilier.SOLIDES, 'credits': accessoires.CREDITS}, open(os.path.join(os.path.dirname(SORTIE), 'piece_donnees.json'), 'w'), indent=1, ensure_ascii=False)
except ImportError as e:
    print('IMPORT', e)
geo.collection('piece')
geo.reunir()
lumieres()
cameras()
reglages_rendu()
bpy.context.scene['reglages'] = str(REGLAGES)
bpy.ops.wm.save_as_mainfile(filepath=SORTIE)
nb = sum(len(o.data.polygons) for o in bpy.data.collections['piece'].objects if o.type == 'MESH')
print('SCÈNE ENREGISTRÉE', SORTIE, len(bpy.data.collections['piece'].objects), 'objets,', nb, 'faces')
