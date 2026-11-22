# Importe chaque modèle et affiche ses dimensions (x, y, z de la page), ses triangles et son origine.
import bpy, sys, os, glob
args = sys.argv[sys.argv.index('--') + 1:]
for chemin in args:
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob, do_unlink=True)
    try:
        bpy.ops.import_scene.gltf(filepath=chemin)
    except Exception as e:
        print('ÉCHEC', chemin, e); continue
    obs = [o for o in bpy.data.objects if o.type == 'MESH']
    import mathutils
    pts = [o.matrix_world @ mathutils.Vector(c) for o in obs for c in o.bound_box]
    mn = [min(p[i] for p in pts) for i in range(3)]; mx = [max(p[i] for p in pts) for i in range(3)]
    dg = bpy.context.evaluated_depsgraph_get()
    tri = sum(sum(len(p.vertices) - 2 for p in o.evaluated_get(dg).data.polygons) for o in obs)
    mats = sorted(set(s.material.name for o in obs for s in o.material_slots if s.material))
    print(f"INV {os.path.basename(chemin)[:40]:40s} larg {mx[0]-mn[0]:.3f} haut {mx[2]-mn[2]:.3f} prof {mx[1]-mn[1]:.3f} | bas z={mn[2]:.3f} centre ({(mn[0]+mx[0])/2:.3f},{(mn[1]+mx[1])/2:.3f}) | {tri} tri | {len(obs)} obj | {mats[:4]}")
