# Rendus d'aperçu de l'hôpital, salle par salle (Cycles, peu d'échantillons) : python -- <dossier> [vues…]
import bpy, sys, os, math
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]; os.makedirs(OUT, exist_ok=True)
def V(x, y, z): return Vector((x, -z, y))
VUES = {'hall': ((3.6, 1.6, 2.3), (2.3, 1.1, 7.0)), 'hall2': ((2.0, 1.6, 6.0), (5.4, 1.0, 2.2)),
        'couloir': ((3.5, 1.6, 0.0), (-12, 1.2, 0.0)), 'cyto': ((-6.2, 1.65, -2.0), (-12.5, 1.0, -7.5)),
        'consult': ((-2.0, 1.6, 2.0), (-6.5, 1.0, 7.0)), 'bloc': ((-2.0, 1.65, -1.8), (-3.6, 1.0, -6.5)),
        'imagerie': ((7.0, 1.6, 2.0), (14.0, 1.0, 6.5)), 'echo': ((9.8, 1.6, 2.2), (6.5, 0.9, 7.5)),
        'endo': ((7.6, 1.6, -2.0), (2.5, 1.0, -7.5)), 'gene': ((14.6, 1.6, -2.0), (9.0, 1.0, -7.5)), 'repro': ((-9.0, 1.6, 2.0), (-13.5, 1.0, 7.5))}
vues = args[1:] or list(VUES)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 800, 450
sc.view_settings.view_transform = 'AgX'
c = bpy.data.cameras.new('apercu'); c.sensor_fit = 'HORIZONTAL'; c.lens = 18; c.clip_start = 0.05
cam = bpy.data.objects.new('apercu', c); sc.collection.objects.link(cam); sc.camera = cam
for nom in vues:
    p, q = VUES[nom]
    cam.location = V(*p)
    cam.rotation_euler = (V(*q) - V(*p)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, nom + '.png')
    bpy.ops.render.render(write_still=True)
    print('VUE', nom)
