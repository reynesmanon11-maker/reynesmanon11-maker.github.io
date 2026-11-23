# Dépose l'hôpital cuit dans outils/hopital/modeles/ : modèle, cartes de lumière, données (salles, personnes,
# collisions, sondes, intensités) et crédits (auteurs réels lus sur les fiches Poly Haven).
# python3 -I publier_hopital.py <dossier de cuisson> <glb optimisé> <données .json> <outils/hopital>
import sys, os, json, shutil
import numpy as np
from PIL import Image
CUI, GLB, DON, REPO = sys.argv[1:5]
ATELIER = os.environ.get('ATELIER', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEST = os.path.join(REPO, 'modeles')
os.makedirs(DEST, exist_ok=True)
lum = json.load(open(os.path.join(CUI, 'lumiere.json')))
for nom in lum:
    Image.fromarray(np.load(os.path.join(CUI, f'lumiere_{nom}.npy'))).save(os.path.join(DEST, f'lumiere-{nom.lower()}.webp'), quality=92, method=6)
shutil.copy(GLB, os.path.join(DEST, 'hopital.glb'))
d = json.load(open(DON))
phm = json.load(open(os.path.join(ATELIER, 'modeles', 'ph_modeles.json')))
def auteurs(f):
    a = f.get('authors', {})
    return ', '.join(f'{n} ({r.lower()})' if r and r != 'All' else n for n, r in a.items()) or 'Poly Haven'
cred = {}
for c in d.get('credits', []):
    src = c['source'].rsplit('.', 1)[0]
    f = phm.get(src, {})
    e = cred.setdefault(src, {'titre': f.get('name', c.get('titre', src)), 'sert': [], 'auteurs': auteurs(f), 'licence': 'CC0', 'site': 'Poly Haven',
                              'source': 'https://polyhaven.com/a/' + src})
    e['sert'].append(c['objet'].replace('_', ' '))
liste = [dict(e, sert=', '.join(dict.fromkeys(e['sert']))) for e in sorted(cred.values(), key=lambda e: e['titre'])]
liste += [
    {'titre': 'Plastered Wall (enduit des murs)', 'sert': 'murs peints', 'auteurs': 'Amal Kumar', 'licence': 'CC0', 'site': 'Poly Haven', 'source': 'https://polyhaven.com/a/plastered_wall'},
    {'titre': 'Natural Walnut Veneer (bois clair)', 'sert': "banque d'accueil", 'auteurs': 'Jenelle van Heerden', 'licence': 'CC0', 'site': 'Poly Haven', 'source': 'https://polyhaven.com/a/natural_walnut_veneer'},
    {'titre': 'Charolettenbrunn Park (panorama)', 'sert': 'le jardin vu par les fenêtres', 'auteurs': 'Grzegorz Wronkowski', 'licence': 'CC0', 'site': 'Poly Haven', 'source': 'https://polyhaven.com/a/charolettenbrunn_park'},
    {'titre': 'MakeHuman : corps, visages, peaux, yeux, cheveux, vêtements et squelette', 'sert': 'les médecins et le personnel',
     'auteurs': 'Data Collection AB, Joel Palmius, Jonas Hauquier et la communauté MakeHuman', 'licence': 'CC0', 'site': 'MakeHuman',
     'source': 'https://static.makehumancommunity.org/assets/assetdownload.html'},
    {'titre': 'Bâtiment, mobilier de laboratoire, linoléum, faux plafond, teintes des murs', 'sert': 'modelés et dessinés par programme pour cette activité',
     'auteurs': 'cabinet des curiosités (programme)', 'licence': 'CC0', 'site': 'ce site', 'source': 'https://reynesmanon11-maker.github.io/outils/hopital/'},
]
sortie = {k: d[k] for k in ('salles', 'personnes', 'sondes', 'soleil')}
sortie['solides'] = d['solides']
sortie['lumiere'] = {k: {'max': round(v['max'], 5)} for k, v in lum.items()}
sortie['credits'] = liste
json.dump(sortie, open(os.path.join(DEST, 'hopital.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
for f in sorted(os.listdir(DEST)):
    print(' ', f, os.path.getsize(os.path.join(DEST, f)) // 1024, 'Ko')
