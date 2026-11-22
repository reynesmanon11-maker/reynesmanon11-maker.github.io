# Exporte la pièce cuite en glTF binaire, pour la page. Les objets gardent leurs propriétés
# (atlas de lumière, éclairage par sonde) dans « extras ».
# blender -b piece_cuite.blend -P exporter.py -- <fichier.glb>
import bpy, sys, os
args = sys.argv[sys.argv.index('--') + 1:]
SORTIE = args[0]
for ob in list(bpy.data.collections['contexte'].objects):
    bpy.data.objects.remove(ob, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.collections['piece'].objects:
    if ob.type != 'MESH':
        continue
    ob.select_set(True)
    for k in ('aire_uv', 'densite', 'groupe'):
        if k in ob:
            del ob[k]
    if ob.get('lumiere') != 'sonde' and ob.get('cuire', 1) != 0 and 'lightmap' in ob.data.uv_layers:
        ob['lumiere'] = 'carte'
    # la première carte de coordonnées sert aux textures, la seconde (TEXCOORD_1) à la lumière : rien d'autre
    uvl = ob.data.uv_layers
    for L in [L for i, L in enumerate(uvl) if i > 0 and L.name != 'lightmap']:
        uvl.remove(L)
    if len(uvl):
        uvl[0].active_render = True
bpy.ops.export_scene.gltf(filepath=SORTIE, export_format='GLB', use_selection=True, export_extras=True, export_apply=True,
                          export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT',
                          export_image_format='AUTO', export_cameras=False, export_lights=False, export_yup=True)
print('EXPORTÉ', SORTIE, os.path.getsize(SORTIE) // 1024, 'Ko')
