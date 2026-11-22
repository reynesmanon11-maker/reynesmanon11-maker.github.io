# Rend des vues d'aperçu de la scène (Cycles), pour juger la lumière avant de la cuire.
# blender -b scene.blend -P apercu.py -- <dossier de sortie> [vues…] [--echantillons N] [--largeur L]
import bpy, sys, os
args = sys.argv[sys.argv.index('--') + 1:]
dossier = args[0]
os.makedirs(dossier, exist_ok=True)
sc = bpy.context.scene
vues = [a for a in args[1:] if not a.startswith('--') and not a.isdigit()]
if '--echantillons' in args:
    sc.cycles.samples = int(args[args.index('--echantillons') + 1])
if '--largeur' in args:
    L = int(args[args.index('--largeur') + 1])
    sc.render.resolution_x, sc.render.resolution_y = L, L * 9 // 16
if '--exposition' in args:
    sc.view_settings.exposure = float(args[args.index('--exposition') + 1])
for ob in bpy.data.objects:
    if ob.type == 'CAMERA' and (not vues or ob.name[4:] in vues):
        sc.camera = ob
        sc.render.filepath = os.path.join(dossier, ob.name[4:] + '.png')
        bpy.ops.render.render(write_still=True)
        print('VUE', ob.name[4:])
