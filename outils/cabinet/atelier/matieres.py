# Matières de la pièce, en PBR (rugosité / métal), exportables telles quelles en glTF.
import bpy, json, os

TEX = None   # réglages écrits par preparer_textures.py
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # outils/cabinet/


def charger_reglages(dossier):
    global TEX
    TEX = json.load(open(os.path.join(dossier, 'textures.json')))


def _image(chemin, couleur):
    nom = os.path.basename(chemin)
    im = bpy.data.images.get(nom) or bpy.data.images.load(chemin, check_existing=True)
    im.colorspace_settings.name = 'sRGB' if couleur else 'Non-Color'
    return im


def _sortie_gltf(nt):
    """Groupe « glTF Material Output » : l'exportateur y lit l'occlusion (canal R de la carte arm)."""
    g = bpy.data.node_groups.get('glTF Material Output')
    if g is None:
        g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        g.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        g.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    n = nt.nodes.new('ShaderNodeGroup')
    n.node_tree = g
    return n


def texturee(nom, cle, taille, rugosite=None, relief=1.0, metal=None, specular=0.5, ao=True):
    """Matière photographiée : couleur teintée, relief (normales OpenGL), carte « arm »
    (occlusion, rugosité, métal). taille = largeur couverte par l'image, en mètres."""
    if nom in bpy.data.materials:
        return bpy.data.materials[nom]
    r = TEX[cle]
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Specular IOR Level'].default_value = specular
    coord = nt.nodes.new('ShaderNodeTexCoord')
    mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (1 / taille, 1 / taille, 1)
    nt.links.new(coord.outputs['UV'], mapping.inputs['Vector'])

    def img(chemin, couleur):
        n = nt.nodes.new('ShaderNodeTexImage')
        n.image = _image(chemin, couleur)
        nt.links.new(mapping.outputs['Vector'], n.inputs['Vector'])
        return n
    c = img(r['couleur'], True)
    nt.links.new(c.outputs['Color'], bsdf.inputs['Base Color'])
    if r.get('arm'):
        a = img(r['arm'], False)
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(a.outputs['Color'], sep.inputs['Color'])
        if rugosite is None:
            nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
        else:
            bsdf.inputs['Roughness'].default_value = rugosite
        if metal is None:
            nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
        else:
            bsdf.inputs['Metallic'].default_value = metal
        if ao:
            nt.links.new(sep.outputs['Red'], _sortie_gltf(nt).inputs['Occlusion'])
    if r.get('relief') and relief > 0:
        n = img(r['relief'], False)
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = relief
        nt.links.new(n.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def unie(nom, couleur, rugosite=0.5, metal=0.0, emission=None, force=0.0, specular=0.5):
    if nom in bpy.data.materials:
        return bpy.data.materials[nom]
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*couleur, 1)
    b.inputs['Roughness'].default_value = rugosite
    b.inputs['Metallic'].default_value = metal
    b.inputs['Specular IOR Level'].default_value = specular
    if emission:
        b.inputs['Emission Color'].default_value = (*emission, 1)
        b.inputs['Emission Strength'].default_value = force
    m.diffuse_color = (*couleur, 1)
    return m


def verre(nom='verre'):
    if nom in bpy.data.materials:
        return bpy.data.materials[nom]
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.92, 0.95, 0.93, 1)
    b.inputs['Roughness'].default_value = 0.02
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['IOR'].default_value = 1.5
    b.inputs['Alpha'].default_value = 0.12          # l'export glTF garde une transparence, la page fait le reflet
    for attr, val in (('blend_method', 'BLEND'), ('surface_render_method', 'BLENDED')):
        try:
            setattr(m, attr, val)
        except Exception:
            pass
    m['verre'] = 1
    return m


def velours(nom, couleur):
    """Velours : mat, avec le reflet rasant (sheen) que l'export glTF transmet à la page."""
    m = unie(nom, couleur, rugosite=0.92)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Sheen Weight'].default_value = 1.0
    b.inputs['Sheen Roughness'].default_value = 0.45
    b.inputs['Sheen Tint'].default_value = (*[min(1, c * 2.5 + 0.15) for c in couleur], 1)
    return m


def lin(c):
    return tuple((x / 255) / 12.92 if x / 255 <= 0.04045 else ((x / 255 + 0.055) / 1.055) ** 2.4 for x in c)


def creer_toutes():
    """Les matières de la pièce. Les tailles sont celles des objets réels (lame de parquet, planche…)."""
    texturee('parquet', 'parquet', 3.4, relief=0.8)
    texturee('lambris', 'lambris', 1.0, rugosite=None, relief=0.5)
    texturee('acajou', 'acajou', 2.0, relief=0.5)
    texturee('noyer', 'noyer', 1.0, relief=0.4)
    texturee('hetre', 'hetre', 1.0, relief=0.4)
    texturee('mur', 'mur', 2.0, relief=0.6, metal=0.0)
    texturee('plafond', 'plafond', 2.0, relief=0.35, metal=0.0)
    texturee('peinture', 'peinture', 1.0, relief=0.25, rugosite=0.38, metal=0.0)
    texturee('marbre', 'marbre', 1.0, relief=0)
    texturee('pierre_noire', 'pierre_noire', 1.2, relief=0)
    texturee('ardoise', 'ardoise', 2.29, relief=0.7)
    texturee('cuir', 'cuir', 0.6, relief=0.8)
    texturee('cuir_brun', 'cuir_brun', 0.4, relief=0.8)
    texturee('rideau', 'rideau', 0.28, relief=0.9, metal=0.0)
    texturee('buches', 'buches', 1.0, relief=1.0, metal=0.0)
    m = texturee('tapis', 'tapis', 1.0, relief=0.8, metal=0.0, rugosite=0.95)
    unie('laiton', lin((196, 150, 84)), rugosite=0.32, metal=1.0)
    unie('fonte', lin((30, 29, 28)), rugosite=0.62, metal=0.6)
    unie('fer_noir', lin((22, 22, 22)), rugosite=0.42, metal=0.15)
    unie('braises', lin((40, 22, 14)), rugosite=0.9, emission=lin((255, 110, 30)), force=6.0)
    unie('suie', lin((18, 16, 15)), rugosite=0.95)
    unie('brique_feu', lin((120, 62, 44)), rugosite=0.9)
    unie('facade', lin((150, 82, 60)), rugosite=0.9)
    unie('toiture', lin((60, 58, 62)), rugosite=0.7)
    unie('ebene', lin((22, 18, 16)), rugosite=0.35)
    unie('papier', lin((226, 216, 190)), rugosite=0.85)
    unie('cire', lin((238, 232, 212)), rugosite=0.45)
    unie('corde', lin((140, 116, 80)), rugosite=0.9)
    verre()
    velours('velours_vert', lin((34, 62, 44)))
    velours('velours_rouge', lin((112, 22, 26)))
    unie('liege', lin((150, 112, 72)), rugosite=0.9)
    TEX['globe'] = {'couleur': os.path.join(os.path.dirname(os.path.dirname(TEX['parquet']['couleur'])), 'canvas', 'texGlobe.png'), 'relief': None, 'arm': None}
    texturee('globe', 'globe', 1.0, rugosite=0.32, metal=0.0)
    m2 = unie('liquide', lin((205, 180, 110)), rugosite=0.05)
    b = m2.node_tree.nodes['Principled BSDF']
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['Alpha'].default_value = 0.55
    m2['verre'] = 1
    TEX['brique'] = {'couleur': REPO + '/textures/brique-couleur.webp', 'relief': REPO + '/textures/brique-relief.webp', 'arm': REPO + '/textures/brique-arm.webp'}
    texturee('brique', 'brique', 3.0, relief=1.0, metal=0.0)
    # le tapis : le motif couvre tout le tapis, le relief de laine se répète tous les 30 cm
    nt = m.node_tree
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (1 / 0.27, 1 / 0.27, 1)
    nt.links.new(nt.nodes['Texture Coordinate'].outputs['UV'], mp.inputs['Vector'])
    for n in list(nt.nodes):
        if n.type == 'TEX_IMAGE' and 'tapis_couleur' not in n.image.name:
            nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
