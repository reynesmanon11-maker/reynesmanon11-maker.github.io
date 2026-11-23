# Télécharge des textures et modèles Poly Haven (CC0) dans le dossier donné.
import json, os, sys, urllib.request
dest = sys.argv[1]
TEX_ = {'herringbone_parquet':'2k','natural_walnut_veneer':'1k','dark_wood':'1k','lacquered_cherry_wood':'1k',
       'plastered_wall':'1k','white_plaster_02':'1k','leather_red_02':'1k','brown_leather':'1k','bark_brown_02':'1k',
       'poly_wool_herringbone':'1k','quatrefoil_jacquard_fabric':'1k','slate_floor':'1k','rosewood_veneer1':'1k'}
MOD = ['metal_office_desk','modern_arm_chair_01','sofa_02','modern_coffee_table_01','plastic_monobloc_chair_01','potted_plant_01','potted_plant_02',
       'wheelchair_01','medical_box','clipboard','classic_laptop','industrial_microscope','bunsen_burner','chemistry_set','steel_frame_shelves_01',
       'modern_wooden_cabinet','wall_clock','television_02','korean_fire_extinguisher_01','WetFloorSign_01','metal_trash_can','metal_stool_01',
       'office_notepads','binder_notebook','desk_lamp_arm_01','cardboard_box_01','industrial_storage_cart','side_table_01']
def get(url, chemin):
    if os.path.exists(chemin): return
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent':'cabinet-curiosites-outillage'})
    with urllib.request.urlopen(req) as r, open(chemin,'wb') as f: f.write(r.read())
def api(asset):
    req = urllib.request.Request('https://api.polyhaven.com/files/'+asset, headers={'User-Agent':'cabinet-curiosites-outillage'})
    return json.load(urllib.request.urlopen(req))
for t, res in {}.items():
    d = api(t)
    for carte in ('Diffuse','nor_gl','arm'):
        cle = carte if carte in d else {'Diffuse':'diffuse'}.get(carte, carte)
        if cle not in d: cle = 'coll1'
        get(d[cle][res]['jpg']['url'], f'{dest}/tex/{t}/{t}_{carte}_{res}.jpg')
    print('texture', t)
for m in MOD:
    try:
        d = api(m)['gltf']['1k']['gltf']
        get(d['url'], f'{dest}/mod/{m}/{m}.gltf')
        for chemin, inc in d['include'].items(): get(inc['url'], f'{dest}/mod/{m}/{chemin}')
        print('modèle', m)
    except Exception as e: print('ÉCHEC', m, e)
