# Prépare les fichiers du nouveau cabinet pour le site : cartes de lumière en WebP, données (lumière,
# collisions) et crédits de chaque ressource.
# python3 -I publier.py <dossier de cuisson> <glb optimisé> <dossier outils/cabinet>
import sys, os, json, shutil
import numpy as np
from PIL import Image
CUI, GLB, REPO = sys.argv[1], sys.argv[2], sys.argv[3]
S = os.environ.get('ATELIER', os.path.expanduser('~/atelier-cabinet'))
DEST = os.path.join(REPO, 'modeles', 'cabinet')
os.makedirs(DEST, exist_ok=True)
lum = json.load(open(os.path.join(CUI, 'lumiere.json')))
for nom in lum:
    a = np.load(os.path.join(CUI, f'lumiere_{nom}.npy'))
    Image.fromarray(a).save(os.path.join(DEST, f'lumiere-{nom.lower()}.webp'), quality=92, method=6)
shutil.copy(GLB, os.path.join(DEST, 'cabinet.glb'))
donnees = json.load(open(os.path.join(S, 'blender', 'piece_donnees.json')))
json.dump({'lumiere': {k: {'max': round(v['max'], 5)} for k, v in lum.items()}, 'solides': donnees['solides']},
          open(os.path.join(DEST, 'cabinet.json'), 'w'), separators=(',', ':'))

# --- crédits : auteurs réels d'après les fiches Poly Haven
phm = json.load(open(os.path.join(S, 'modeles', 'ph_modeles.json')))
pht = json.load(open(os.path.join(S, 'modeles', 'ph_textures.json')))
def auteurs(fiche):
    a = fiche.get('authors', {})
    return ', '.join(f'{n} ({r.lower()})' if r and r != 'All' else n for n, r in a.items()) or 'Poly Haven'
entrees = {}
for c in donnees['credits']:
    src = c['source'].rsplit('.', 1)[0]
    if c.get('site') == 'Poly Haven':
        fiche = phm.get(src, {})
        cle = 'ph:' + src
        titre = fiche.get('name', c['titre'])
        e = entrees.setdefault(cle, {'titre': titre, 'sert': [], 'auteurs': auteurs(fiche), 'licence': 'CC0',
                                     'source': 'https://polyhaven.com/a/' + src, 'site': 'Poly Haven'})
    else:
        cle = 'si:' + src
        e = entrees.setdefault(cle, {'titre': c['titre'], 'sert': [], 'auteurs': c['auteurs'], 'licence': 'CC0',
                                     'source': c['lien'], 'site': 'Smithsonian Open Access'})
    e['sert'].append(c['objet'].replace('_', ' '))
TEX_PH = {'herringbone_parquet': 'le parquet', 'natural_walnut_veneer': 'les boiseries de noyer, les tabourets', 'dark_wood': "l'acajou des meubles",
          'lacquered_cherry_wood': 'le noyer sombre des bibliothèques et de l’établi', 'plastered_wall': 'les murs peints, le plafond, les ébrasements',
          'leather_red_02': 'le cuir du bureau et du livre ouvert', 'brown_leather': 'le grain des reliures', 'bark_brown_02': 'les bûches',
          'poly_wool_herringbone': 'la laine du tapis', 'slate_floor': 'le fond du foyer', 'quatrefoil_jacquard_fabric': 'le damas (réserve)'}
for t, sert in TEX_PH.items():
    f = pht.get(t, {})
    entrees['pht:' + t] = {'titre': f.get('name', t), 'sert': [sert], 'auteurs': auteurs(f), 'licence': 'CC0',
                           'source': 'https://polyhaven.com/a/' + t, 'site': 'Poly Haven'}
entrees['hdri'] = {'titre': 'Charolettenbrunn Park (panorama)', 'sert': ['le jardin et le ciel vus par les verrières et la serre'],
                   'auteurs': 'Grzegorz Wronkowski', 'licence': 'CC0', 'source': 'https://polyhaven.com/a/charolettenbrunn_park', 'site': 'Poly Haven'}
pano = os.path.join(S, 'modeles', 'hdri', 'charolettenbrunn_park.jpg')
if os.path.exists(pano):
    Image.MAX_IMAGE_PIXELS = None
    Image.open(pano).convert('RGB').resize((4096, 2048), Image.LANCZOS).save(os.path.join(DEST, 'dehors.webp'), quality=80, method=6)
entrees['dessin'] = {'titre': 'Marbre, pierre noire, tapis, reliures, carte géologique', 'sert': ['textures dessinées par programme pour le cabinet'],
                     'auteurs': 'cabinet des curiosités (programme)', 'licence': 'CC0', 'source': 'https://reynesmanon11-maker.github.io/outils/cabinet/',
                     'site': 'ce site'}
lignes = ['// FICHIER PRODUIT PAR LA CHAÎNE DE PRÉPARATION (outils/cabinet/atelier/publier.py) : ne pas corriger à la main.',
          "// Crédits de tout ce que contient modeles/cabinet/ : modèles, numérisations et textures, tous en CC0.",
          'export const MODELES_CABINET = [']
for e in sorted(entrees.values(), key=lambda e: (e['site'], e['titre'])):
    e = dict(e, sert=', '.join(dict.fromkeys(e['sert'])))
    lignes.append('  ' + json.dumps(e, ensure_ascii=False) + ',')
lignes.append('];')
open(os.path.join(REPO, 'js', 'donnees', 'credits-cabinet.js'), 'w').write('\n'.join(lignes) + '\n')
print('PUBLIÉ', DEST, sorted(os.listdir(DEST)), len(entrees), 'crédits')
for f in sorted(os.listdir(DEST)):
    print(' ', f, os.path.getsize(os.path.join(DEST, f)) // 1024, 'Ko')
