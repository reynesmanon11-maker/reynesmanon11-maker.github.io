# Textures propres à l'hôpital, dessinées par programme : linoléum moucheté, dalles de faux plafond.
import sys, os, numpy as np
from PIL import Image
sys.argv = [sys.argv[0], '/tmp', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')]
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'blender', 'scripts', 'preparer_textures.py')).read().split('TEINTES = {')[0].split('def rugosite')[0])
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
r = np.random.default_rng(3)
n = 1024
# linoléum : fond gris-beige, nuages doux, mouchetures claires et sombres, légère usure
nuage = bruit(n, 3.8, 51)
L = lin((196, 192, 182))[None, None, :] * (1 + 0.05 * nuage[..., None])
for coul, dens, k in (((236, 234, 226), 0.05, 1), ((120, 116, 110), 0.03, 1), ((160, 172, 176), 0.015, 2)):
    m = r.random((n, n)) < dens
    if k > 1:
        m = m | np.roll(m, 1, 0) | np.roll(m, 1, 1)
    L[m] = L[m] * 0.4 + lin(coul) * 0.6
Image.fromarray(srgb(L).round().astype(np.uint8)).save(f'{OUT}/lino_couleur.jpg', quality=92)
rug = np.clip(0.32 + 0.1 * bruit(n, 3.0, 52), 0.15, 0.7)
Image.fromarray((np.stack([np.ones((n, n)), rug, np.zeros((n, n))], -1) * 255).round().astype(np.uint8)).save(f'{OUT}/lino_arm.jpg', quality=92)
# dalles de faux plafond 60 × 60 cm (l'image couvre 1,2 m : 2 × 2 dalles), joints de profilé blanc, surface microperforée
m = 1024
y, x = np.mgrid[0:m, 0:m]
c = np.ones((m, m, 3)) * lin((236, 236, 232))
perf = ((x % 9 < 2) & (y % 9 < 2)) & (r.random((m, m)) < 0.8)
c[perf] *= 0.82
c *= (1 + 0.02 * bruit(m, 3.0, 53))[..., None]
joint = (np.minimum(x % 512, 511 - x % 512) < 5) | (np.minimum(y % 512, 511 - y % 512) < 5)
ombre = (np.minimum(x % 512, 511 - x % 512) < 9) | (np.minimum(y % 512, 511 - y % 512) < 9)
c[ombre & ~joint] *= 0.86
c[joint] = lin((248, 248, 246))
Image.fromarray(srgb(c).round().astype(np.uint8)).save(f'{OUT}/plafond_couleur.jpg', quality=92)
print('textures hôpital prêtes')

# murs : l'enduit photographié (CC0) teinté en blanc cassé, et aux couleurs des services
SALLES = {'blanc': (232, 230, 224), 'cyto': (236, 230, 246), 'bloc': (214, 236, 233), 'endo': (251, 238, 222), 'gene': (227, 244, 234),
          'repro': (249, 227, 236), 'consult': (228, 240, 251), 'hall': (246, 234, 210), 'imagerie': (225, 238, 247)}
src = np.asarray(Image.open(os.path.join(os.path.dirname(OUT), '..', 'blender', 'tex', 'mur_couleur.jpg')).convert('RGB'), float)
Ls = lin(src); moy = Ls.reshape(-1, 3).mean(0)
for nom, c in SALLES.items():
    if nom != 'blanc':
        c = tuple(max(0, min(255, int(v + (v - sum(c) / 3) * 2.6 - 22))) for v in c)
    Image.fromarray(srgb(Ls * (lin(c) / moy)).round().astype(np.uint8)).save(f'{OUT}/mur_{nom}.jpg', quality=92)
print('murs teintés')
