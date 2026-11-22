# Télécharge les textures, modèles et le panorama Poly Haven (CC0) utilisés par le cabinet.
# python3 -I telecharger.py <atelier>/ph
import json, os, sys, urllib.request
dest = sys.argv[1]
TEX = {'herringbone_parquet':'2k','natural_walnut_veneer':'1k','dark_wood':'1k','lacquered_cherry_wood':'1k',
       'plastered_wall':'1k','white_plaster_02':'1k','leather_red_02':'1k','brown_leather':'1k','bark_brown_02':'1k',
       'poly_wool_herringbone':'1k','quatrefoil_jacquard_fabric':'1k','slate_floor':'1k','rosewood_veneer1':'1k'}
MOD = ['ArmChair_01','vintage_grandfather_clock_01','Chandelier_03','fancy_picture_frame_01','fancy_picture_frame_02',
       'marble_bust_01','brass_candleholders','mantel_clock_01','GothicCabinet_01','lambis_shell','seadogs_compass',
       'vintage_pocket_watch','magnifying_glass_01','round_spectacles','vintage_binocular','carved_wooden_elephant',
       'horse_head','lion_head','tea_set_01','antique_ceramic_vase_01','vintage_microscope','wooden_candlestick','side_table_tall_01','round_wooden_table_01',
       'moon_rock_01','moon_rock_02','moon_rock_03','moon_rock_04','moon_rock_05','moon_rock_06','moon_rock_07','rock_07','rock_09',
       'potted_plant_04','planter_pot_clay','fern_02','shrub_sorrel_01','pot_enamel_01']
def get(url, chemin):
    if os.path.exists(chemin): return
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent':'cabinet-curiosites-outillage'})
    with urllib.request.urlopen(req) as r, open(chemin,'wb') as f: f.write(r.read())
def api(asset):
    req = urllib.request.Request('https://api.polyhaven.com/files/'+asset, headers={'User-Agent':'cabinet-curiosites-outillage'})
    return json.load(urllib.request.urlopen(req))
for t, res in TEX.items():
    d = api(t)
    for carte in ('Diffuse','nor_gl','arm'):
        cle = carte if carte in d else {'Diffuse':'diffuse'}.get(carte, carte)
        if cle not in d: cle = 'coll1'
        get(d[cle][res]['jpg']['url'], f'{dest}/tex/{t}/{t}_{carte}_{res}.jpg')
    print('texture', t)
# le panorama du dehors (CC0), en JPG déjà tonemappé (8192 × 4096)
pano = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/charolettenbrunn_park.jpg'
get(pano, os.path.join(os.path.dirname(dest), 'modeles', 'hdri', 'charolettenbrunn_park.jpg'))
for m in MOD:
    try:
        d = api(m)['gltf']['1k']['gltf']
        get(d['url'], f'{dest}/mod/{m}/{m}.gltf')
        for chemin, inc in d['include'].items(): get(inc['url'], f'{dest}/mod/{m}/{chemin}')
        print('modèle', m)
    except Exception as e: print('ÉCHEC', m, e)
