# Prépare les images des matières de la pièce (Python ordinaire, avec numpy et Pillow) :
#  - teinte les photographies Poly Haven (CC0) vers la couleur voulue (calcul en lumière linéaire) ;
#  - dessine les textures qui n'existent pas en photographie libre : marbre veiné, tapis d'Orient.
# Usage : python3 -I preparer_textures.py <dossier poly haven> <dossier de sortie>
import sys, os, json
import numpy as np
from PIL import Image

PH, SORTIE = sys.argv[1], sys.argv[2]
os.makedirs(SORTIE, exist_ok=True)
rng = np.random.default_rng(1840)


def lin(c):
    c = np.asarray(c, dtype=np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def srgb(l):
    l = np.clip(l, 0, 1)
    return np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055) * 255.0


def charger(chemin, taille=None):
    im = Image.open(chemin).convert('RGB')
    if taille and im.size[0] != taille:
        im = im.resize((taille, taille), Image.LANCZOS)
    return np.asarray(im, dtype=np.float64)


def teinter(nom_ph, res, cible, sortie, taille=None, contraste=1.0):
    """Ramène la couleur moyenne de la photographie à « cible » (sRGB), sans toucher à ses détails."""
    a = charger(f'{PH}/tex/{nom_ph}/{nom_ph}_Diffuse_{res}.jpg', taille)
    L = lin(a)
    moy = L.reshape(-1, 3).mean(0)
    if contraste != 1.0:
        L = moy * (L / moy) ** contraste
        moy = L.reshape(-1, 3).mean(0)
    L = L * (lin(cible) / moy)
    Image.fromarray(srgb(L).round().astype(np.uint8)).save(f'{SORTIE}/{sortie}.jpg', quality=93)


# --- bruit périodique (donc texture raccordable) : champ gaussien filtré par transformée de Fourier ---
def bruit(n, beta=2.2, graine=0):
    r = np.random.default_rng(graine)
    f = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(n)[None, :] ** 2
    f[0, 0] = 1
    spectre = (r.normal(size=(n, n)) + 1j * r.normal(size=(n, n))) / f ** (beta / 4)
    spectre[0, 0] = 0
    b = np.real(np.fft.ifft2(spectre))
    return (b - b.mean()) / b.std()


def marbre(n=1024):
    """Marbre blanc veiné de gris (type Carrare), tel qu'on en sculptait les cheminées vers 1840."""
    y, x = np.mgrid[0:n, 0:n] / n
    t1 = bruit(n, 4.8, 1)
    t2 = bruit(n, 3.6, 2)
    masque = np.clip(bruit(n, 4.2, 5) * 0.8 + 0.3, 0, 1)        # les veines fines apparaissent par endroits
    s1 = np.sin(2 * np.pi * (1 * x + 2 * y) + 1.3 * t1)
    s2 = np.sin(2 * np.pi * (2 * x + 3 * y) + 2.2 * t1 + 0.6 * t2)
    veines = 0.38 * np.exp(-(s1 ** 2) / 0.09) + 0.75 * masque * np.exp(-(s2 ** 2) / 0.004)
    veines = np.clip(veines, 0, 0.85)
    nuage = bruit(n, 3.8, 3)
    base = np.array([228, 227, 222], float)
    gris = np.array([118, 122, 126], float)
    c = lin(base)[None, None, :] * (1 + 0.05 * nuage[..., None])
    c = c * (1 - veines[..., None]) + lin(gris)[None, None, :] * veines[..., None]
    Image.fromarray(srgb(c).round().astype(np.uint8)).save(f'{SORTIE}/marbre_couleur.jpg', quality=93)
    # « arm » : occlusion 1, rugosité faible (marbre poli, un peu plus mat dans les veines), pas de métal
    rug = np.clip(0.14 + 0.1 * veines + 0.03 * nuage, 0.05, 1)
    arm = np.stack([np.ones((n, n)), rug, np.zeros((n, n))], -1) * 255
    Image.fromarray(arm.round().astype(np.uint8)).save(f'{SORTIE}/marbre_arm.jpg', quality=93)


def pierre_noire(n=1024):
    """Plateau de pierre noire (ardoise adoucie, comme les paillasses anciennes) : nuages gris,
    veines claires très rares, rayures fines du travail ; rugosité variable (zones lustrées par l'usage)."""
    nuage = bruit(n, 3.6, 11)
    fin = bruit(n, 2.4, 12)
    y, x = np.mgrid[0:n, 0:n] / n
    base = lin((44, 45, 48))
    c = base[None, None, :] * (1 + 0.16 * nuage[..., None] + 0.05 * fin[..., None])
    s1 = np.sin(2 * np.pi * (2 * x + 1 * y) + 1.6 * bruit(n, 4.6, 13))
    veine = 0.5 * np.exp(-(s1 ** 2) / 0.002) * np.clip(bruit(n, 4.0, 14), 0, 1)
    c = c * (1 - veine[..., None]) + lin((120, 122, 124))[None, None, :] * veine[..., None]
    rayures = np.zeros((n, n))
    for _ in range(260):
        a = rng.uniform(0, np.pi)
        x0, y0 = rng.uniform(0, n, 2)
        L = rng.uniform(20, 160)
        t = np.linspace(0, L, int(L))
        xs = ((x0 + np.cos(a) * t) % n).astype(int)
        ys = ((y0 + np.sin(a) * t) % n).astype(int)
        rayures[ys, xs] = rng.uniform(0.3, 1.0)
    c = c * (1 + 0.25 * rayures[..., None])
    Image.fromarray(srgb(c).round().astype(np.uint8)).save(f'{SORTIE}/pierre_noire_couleur.jpg', quality=93)
    rug = np.clip(0.36 + 0.12 * bruit(n, 3.4, 15) + 0.2 * rayures, 0.15, 0.9)
    arm = np.stack([np.ones((n, n)), rug, np.zeros((n, n))], -1) * 255
    Image.fromarray(arm.round().astype(np.uint8)).save(f'{SORTIE}/pierre_noire_arm.jpg', quality=93)


def tapis(w=2048, h=1380):
    """Un tapis d'Orient dessiné pour l'occasion : médaillon central, écoinçons, bordures,
    champ semé de motifs, laine irrégulière (« abrash » : bandes de teinte d'un bain à l'autre)."""
    rouge, indigo, ivoire, or_, brun, vert = (lin(c) for c in [(128, 28, 30), (32, 40, 74), (214, 196, 160), (190, 140, 62), (66, 36, 26), (58, 84, 70)])
    img = np.zeros((h, w, 3)) + rouge
    y, x = np.mgrid[0:h, 0:w].astype(float)
    u, v = x / w, y / h
    # bordures (distance au bord, en pixels)
    d = np.minimum(np.minimum(x, w - 1 - x), np.minimum(y, h - 1 - y))
    def bande(d0, d1, coul):
        m = (d >= d0) & (d < d1)
        img[m] = coul
        return m
    bande(0, 26, brun)
    bande(26, 36, or_)
    m = bande(36, 120, indigo)
    # motif courant dans la bordure principale : rosettes alternées
    pas = 84
    t = np.where(np.minimum(x, w - 1 - x) < np.minimum(y, h - 1 - y), y, x)
    ph = (t % pas) / pas
    centre = 78
    ros = (np.abs(d - centre) < 26) & (np.hypot((ph - 0.5) * pas, d - centre) < 24)
    img[m & ros] = rouge
    ros2 = (np.abs(d - centre) < 26) & (np.hypot((ph - 0.5) * pas, d - centre) < 11)
    img[m & ros2] = ivoire
    zig = m & (np.abs(d - (38 + 8 * np.abs(((t / 16) % 2) - 1))) < 3)
    img[zig] = ivoire
    bande(120, 130, or_)
    bande(130, 150, rouge)
    zz = (d >= 130) & (d < 150) & (np.abs((d - 130) - 20 * np.abs(((t / 20) % 2) - 1)) < 3)
    img[zz] = ivoire
    bande(150, 158, indigo)
    champ = d >= 158
    # champ : semis de petits losanges et de « boteh » simplifiés
    cx, cy = w / 2, h / 2
    gx, gy = ((x - cx) % 90) - 45, ((y - cy) % 90) - 45
    los = champ & (np.abs(gx) + np.abs(gy) < 16)
    img[los] = indigo
    img[champ & (np.abs(gx) + np.abs(gy) < 7)] = or_
    gx2, gy2 = ((x - cx + 45) % 90) - 45, ((y - cy + 45) % 90) - 45
    img[champ & (np.hypot(gx2, gy2) < 6)] = ivoire
    # médaillon central en losange à gradins, puis écoinçons
    r = np.abs(x - cx) / (w * 0.30) + np.abs(y - cy) / (h * 0.36)
    marches = np.floor(np.abs(x - cx) / 18) * 18 / (w * 0.30) + np.floor(np.abs(y - cy) / 18) * 18 / (h * 0.36)
    img[champ & (marches < 1.0)] = ivoire
    img[champ & (marches < 0.9)] = indigo
    img[champ & (marches < 0.78)] = rouge
    img[champ & (r < 0.5) & (np.abs(((x - cx) / 30) % 1 - 0.5) < 0.12)] = or_
    img[champ & (r < 0.36)] = indigo
    img[champ & (r < 0.24)] = ivoire
    img[champ & (r < 0.12)] = rouge
    for sx in (0, 1):
        for sy in (0, 1):
            ex = np.abs(x - (158 if sx == 0 else w - 159))
            ey = np.abs(y - (158 if sy == 0 else h - 159))
            q = ex / (w * 0.13) + ey / (h * 0.17)
            img[champ & (q < 1.0)] = indigo
            img[champ & (q < 0.86)] = rouge
            img[champ & (q < 0.5) & (np.hypot(ex, ey) % 28 < 9)] = vert
    # laine : bandes de teinte (abrash), grain des nœuds, usure au centre
    k = 3   # un nœud de laine = 3 × 3 pixels
    img = img[(np.arange(h) // k * k)[:, None], (np.arange(w) // k * k)[None, :]]
    from PIL import ImageFilter
    img = lin(np.asarray(Image.fromarray(srgb(img).round().astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), float))
    noeud = rng.normal(size=(h // k + 1, w // k + 1))[(np.arange(h) // k)[:, None], (np.arange(w) // k)[None, :]]
    img = img * (1 + 0.07 * noeud[..., None])
    abrash = 1 + 0.07 * np.sin(v * 31 + 2 * np.sin(v * 7)) * (u * 0 + 1)
    noeuds = 1 + 0.04 * rng.normal(size=(h, w))
    usure = 1 + 0.08 * np.exp(-(((u - 0.5) / 0.25) ** 2 + ((v - 0.5) / 0.3) ** 2))
    L = img * abrash[..., None] * noeuds[..., None] * usure[..., None]
    Image.fromarray(srgb(L).round().astype(np.uint8)).save(f'{SORTIE}/tapis_couleur.jpg', quality=92)


def rugosite(nom_ph, res, sortie, mini, maxi):
    """Recalibre la rugosité (canal vert de la carte arm) entre mini et maxi : un parquet ciré
    n'est pas un miroir mouillé."""
    a = np.asarray(Image.open(f'{PH}/tex/{nom_ph}/{nom_ph}_arm_{res}.jpg').convert('RGB'), float)
    g = a[..., 1] / 255
    g = (g - g.min()) / max(1e-6, g.max() - g.min())
    a[..., 1] = (mini + (maxi - mini) * g) * 255
    Image.fromarray(a.round().astype(np.uint8)).save(f'{SORTIE}/{sortie}_arm.jpg', quality=93)
    return f'{SORTIE}/{sortie}_arm.jpg'


RUGOSITES = {'hetre': (0.4, 0.62), 'parquet': (0.42, 0.72), 'lambris': (0.38, 0.6), 'acajou': (0.3, 0.52), 'noyer': (0.3, 0.5)}

TEINTES = {
    # matière : (photographie, résolution, couleur moyenne visée en sRGB, contraste)
    'parquet':   ('herringbone_parquet', '2k', (122, 88, 58), 1.0),
    'lambris':   ('natural_walnut_veneer', '1k', (74, 49, 32), 1.35),
    'acajou':    ('dark_wood', '1k', (78, 37, 22), 1.0),
    'noyer':     ('lacquered_cherry_wood', '1k', (60, 37, 22), 1.0),
    'hetre':     ('natural_walnut_veneer', '1k', (176, 128, 84), 0.9),
    'mur':       ('plastered_wall', '1k', (138, 146, 122), 1.0),
    'plafond':   ('plastered_wall', '1k', (214, 210, 198), 0.7),
    'peinture':  ('plastered_wall', '1k', (206, 199, 180), 0.6),
    'cuir':      ('leather_red_02', '1k', (92, 40, 26), 1.0),
    'cuir_brun': ('brown_leather', '1k', (70, 42, 22), 1.0),
    'rideau':    ('quatrefoil_jacquard_fabric', '1k', (104, 20, 28), 1.0),
    'buches':    ('bark_brown_02', '1k', (70, 60, 46), 1.0),
    'ardoise':   ('slate_floor', '1k', (48, 44, 42), 1.0),
}

if __name__ == '__main__':
    reglages = {}
    for nom, (ph, res, cible, contraste) in TEINTES.items():
        teinter(ph, res, cible, f'{nom}_couleur', contraste=contraste)
        reglages[nom] = {'source': ph, 'res': res,
                         'relief': f'{PH}/tex/{ph}/{ph}_nor_gl_{res}.jpg',
                         'arm': f'{PH}/tex/{ph}/{ph}_arm_{res}.jpg',
                         'couleur': f'{SORTIE}/{nom}_couleur.jpg'}
        if nom in RUGOSITES:
            reglages[nom]['arm'] = rugosite(ph, res, nom, *RUGOSITES[nom])
    marbre()
    reglages['marbre'] = {'source': 'dessiné', 'couleur': f'{SORTIE}/marbre_couleur.jpg', 'arm': f'{SORTIE}/marbre_arm.jpg', 'relief': None}
    pierre_noire()
    reglages['pierre_noire'] = {'source': 'dessiné', 'couleur': f'{SORTIE}/pierre_noire_couleur.jpg', 'arm': f'{SORTIE}/pierre_noire_arm.jpg', 'relief': None}
    tapis()
    reglages['tapis'] = {'source': 'dessiné', 'couleur': f'{SORTIE}/tapis_couleur.jpg',
                         'relief': f'{PH}/tex/poly_wool_herringbone/poly_wool_herringbone_nor_gl_1k.jpg',
                         'arm': f'{PH}/tex/poly_wool_herringbone/poly_wool_herringbone_arm_1k.jpg'}
    json.dump(reglages, open(f'{SORTIE}/textures.json', 'w'), indent=1)
    print('textures prêtes :', ', '.join(reglages))


# ------------------------------------------------------------------ reliures
def atlas_livres(N=2048):
    """Planche des livres : 96 dos de reliure (nervures, pièces de titre, filets et fleurons dorés),
    8 plats (4 papiers marbrés, 4 cuirs), 8 tranches. Couleur, relief (normales OpenGL) et arm
    (l'or est métallique). Chaque livre de la pièce choisit un dos ; sa taille le déforme : aucun
    rayon ne montre deux fois le même livre."""
    r = np.random.default_rng(7)
    coul = np.zeros((N, N, 3))
    haut = np.zeros((N, N))
    metal = np.zeros((N, N))
    rug = np.full((N, N), 0.58)
    grain_src = charger(f'{PH}/tex/brown_leather/brown_leather_Diffuse_1k.jpg').mean(-1)
    grain_src = grain_src / grain_src.mean()
    OR = lin((214, 172, 86))
    cuirs = [(98, 60, 36), (82, 48, 30), (122, 78, 46), (118, 36, 30), (92, 28, 26), (44, 66, 48), (32, 52, 40), (36, 32, 30),
             (40, 48, 74), (150, 108, 68), (214, 200, 166), (84, 52, 62), (66, 40, 26), (140, 58, 34)]
    poids = np.array([6, 6, 5, 4, 3, 3, 2, 3, 2, 3, 1.2, 1.5, 5, 2], float)
    poids /= poids.sum()
    cases = []

    def grain(h, w):
        y0, x0 = r.integers(0, grain_src.shape[0] - h), r.integers(0, grain_src.shape[1] - w)
        g = grain_src[y0:y0 + h, x0:x0 + w]
        return 1 + 0.35 * (g - 1)

    cw, ch = 64, 512
    for k in range(96):
        cx, cy = (k % 32) * cw, (k // 32) * ch
        base = lin(cuirs[r.choice(len(cuirs), p=poids)]) * r.uniform(0.85, 1.15)
        vel = base.mean() > 0.4
        c = np.ones((ch, cw, 3)) * base * grain(ch, cw)[..., None]
        hm = np.zeros((ch, cw))
        mt = np.zeros((ch, cw))
        yy = np.arange(ch)[:, None] * np.ones((1, cw))
        xx = np.ones((ch, 1)) * np.arange(cw)[None, :]
        # arrondi du dos : plus sombre sur les bords (usure et ombre)
        c *= (0.78 + 0.22 * np.sin(np.pi * (xx + 0.5) / cw))[..., None]
        nb = int(r.integers(4, 7)) if not vel else int(r.integers(0, 3))
        m0, m1 = 0.06 * ch, 0.94 * ch
        bandes = [m0 + (m1 - m0) * (i + 1) / (nb + 1) for i in range(nb)] if nb else []
        dore = r.random() < 0.8 and not vel
        for yb in bandes:
            d = np.abs(yy - yb)
            hm += np.clip(1 - d / 6, 0, 1) ** 0.7
            if dore:
                for off in (-9, 9):
                    m = np.abs(yy - (yb + off)) < 1.2
                    mt[m] = 1
        # pièces de titre (et de tomaison)
        bords = [m0] + bandes + [m1]
        cases_dos = list(zip(bords[:-1], bords[1:]))
        if len(cases_dos) >= 3 and not vel:
            ya, yb = cases_dos[1]
            ya, yb = ya + 6, yb - 6
            piece = lin([(128, 30, 26), (28, 24, 22), (36, 60, 44)][r.integers(0, 3)])
            m = (yy > ya) & (yy < yb) & (xx > 5) & (xx < cw - 5)
            c[m] = piece * grain(ch, cw)[m][:, None]
            hm[m] += 0.15
            bord = m & ((np.abs(yy - ya) < 2.5) | (np.abs(yy - yb) < 2.5) | (np.abs(xx - 5) < 2) | (np.abs(xx - (cw - 5)) < 2))
            mt[bord] = 1
            for j in range(int(r.integers(2, 4))):
                yl = ya + (yb - ya) * (j + 1) / 4 + r.uniform(-2, 2)
                lg = r.uniform(0.35, 0.8) * (cw - 16)
                ml = (np.abs(yy - yl) < 1.6) & (np.abs(xx - cw / 2) < lg / 2)
                # « lettres » : traits coupés
                ml &= ((xx // 3) % 4 != 0)
                mt[ml] = 1
            if len(cases_dos) >= 4 and r.random() < 0.6:
                ya, yb = cases_dos[2]
                ya, yb = ya + 10, yb - 10
                m = (yy > ya) & (yy < yb) & (xx > 8) & (xx < cw - 8)
                if r.random() < 0.5:
                    c[m] = piece
                mt[m & ((np.abs(yy - (ya + yb) / 2) < 2) & (np.abs(xx - cw / 2) < 8))] = 1
        # fleurons dans les autres caisses
        for i, (ya, yb) in enumerate(cases_dos):
            if i in (1, 2) or not dore:
                continue
            ym = (ya + yb) / 2
            f = (np.abs(xx - cw / 2) / 11 + np.abs(yy - ym) / 15 < 1) & ~(np.abs(xx - cw / 2) / 7 + np.abs(yy - ym) / 10 < 1)
            f |= (np.abs(xx - cw / 2) < 1.5) & (np.abs(yy - ym) < 18)
            mt[f] = 1
            hm[f] += 0.2
        if vel:   # vélin : écriture à l'encre, pas d'or
            for j in range(3):
                yl = ch * r.uniform(0.15, 0.45)
                ml = (np.abs(yy - yl - j * 9) < 1.4) & (np.abs(xx - cw / 2) < r.uniform(8, 20)) & ((xx // 2) % 3 != 0)
                c[ml] = lin((60, 44, 30))
        # usure : coiffes frottées, éraflures
        use = np.exp(-np.minimum(yy, ch - 1 - yy) / 14)[..., None]
        c = c * (1 - 0.25 * use) + lin((150, 120, 90)) * 0.25 * use
        for _ in range(int(r.integers(0, 4))):
            ey, ex = r.uniform(0, ch), r.uniform(0, cw)
            d = np.hypot((yy - ey) / r.uniform(6, 30), (xx - ex) / r.uniform(2, 8))
            c *= (1 + 0.18 * np.exp(-d * d))[..., None]
        c[mt > 0] = OR * r.uniform(0.75, 1.0) * (0.85 + 0.15 * grain(ch, cw)[mt > 0][:, None])
        coul[cy:cy + ch, cx:cx + cw] = c
        haut[cy:cy + ch, cx:cx + cw] = hm + 0.3 * mt
        metal[cy:cy + ch, cx:cx + cw] = mt
        rug[cy:cy + ch, cx:cx + cw] = np.where(mt > 0, 0.32, r.uniform(0.45, 0.7))
        cases.append([cx / N, cy / N, (cx + cw) / N, (cy + ch) / N])
    # plats : papiers marbrés et cuirs
    plats = []
    for k in range(8):
        cx, cy = k * 256, 1536
        if k < 4:
            n = 256
            yy, xx = np.mgrid[0:n, 0:n] / n
            t = bruit(n, 4.4, 100 + k)
            veine = np.sin(2 * np.pi * (3 * xx + 1 * yy) + 3.5 * t + 1.5 * bruit(n, 3.4, 200 + k))
            fond = lin([(52, 70, 110), (120, 48, 36), (70, 60, 40), (40, 70, 60)][k])
            v2 = lin([(196, 150, 70), (220, 200, 160), (180, 90, 50), (200, 170, 110)][k])
            c = fond * (1 - np.exp(-veine ** 2 / 0.05))[..., None] + v2 * np.exp(-veine ** 2 / 0.05)[..., None]
            c = c * (1 + 0.12 * bruit(n, 3.0, 300 + k))[..., None]
            ru = 0.75
        else:
            c = np.ones((256, 256, 3)) * lin(cuirs[k]) * grain(256, 256)[..., None]
            ru = 0.55
        coul[cy:cy + 256, cx:cx + 256] = c
        rug[cy:cy + 256, cx:cx + 256] = ru
        plats.append([cx / N, cy / N, (cx + 256) / N, (cy + 256) / N])
    # tranches : papier crème rayé de feuillets, tranches rouges, dorées
    tranches = []
    for k in range(8):
        cx, cy = k * 256, 1792
        yy = np.arange(256)[:, None] * np.ones((1, 256))
        base = lin([(226, 214, 186), (220, 206, 176), (232, 222, 196), (210, 196, 164), (226, 214, 186), (150, 44, 34), (214, 172, 86), (226, 214, 186)][k])
        c = np.ones((256, 256, 3)) * base * (1 - 0.08 * ((yy % 3) < 1))[..., None] * (1 + 0.04 * r.normal(size=(256, 256)))[..., None]
        coul[cy:cy + 256, cx:cx + 256] = c
        metal[cy:cy + 256, cx:cx + 256] = 1.0 if k == 6 else 0.0
        rug[cy:cy + 256, cx:cx + 256] = 0.35 if k == 6 else 0.8
        tranches.append([cx / N, cy / N, (cx + 256) / N, (cy + 256) / N])
    Image.fromarray(srgb(coul).round().astype(np.uint8)).save(f'{SORTIE}/livres_couleur.png')
    # relief : gradient de la carte de hauteur → normales (OpenGL : +y vers le haut de l'image)
    gy, gx = np.gradient(haut)
    k = 2.2
    nx, ny, nz = -gx * k, gy * k, np.ones_like(haut)
    L = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    nrm = np.stack([nx / L, ny / L, nz / L], -1) * 0.5 + 0.5
    Image.fromarray((nrm * 255).round().astype(np.uint8)).save(f'{SORTIE}/livres_relief.png')
    arm = np.stack([np.ones((N, N)), rug, metal], -1) * 255
    Image.fromarray(arm.round().astype(np.uint8)).save(f'{SORTIE}/livres_arm.png')
    json.dump({'dos': cases, 'plats': plats, 'tranches': tranches}, open(f'{SORTIE}/livres.json', 'w'))


if __name__ == '__main__':
    atlas_livres()
    print('reliures prêtes')


# ------------------------------------------------------------------ carte géologique et pages de livre
def papier(h, w, graine):
    r = np.random.default_rng(graine)
    p = lin((226, 214, 184))[None, None, :] * (1 + 0.05 * bruit(max(h, w), 3.2, graine)[:h, :w][..., None]) * (1 + 0.02 * r.normal(size=(h, w))[..., None])
    y, x = np.mgrid[0:h, 0:w]
    bord = np.minimum(np.minimum(x, w - 1 - x), np.minimum(y, h - 1 - y)) / max(h, w)
    p *= (0.82 + 0.18 * np.clip(bord / 0.06, 0, 1))[..., None]   # bords roussis
    return p


def carte_geologique(w=1024, h=800):
    """Carte géologique imaginaire, coloriée à la main comme celles du XIXᵉ siècle :
    terrains en aplats, contours noirs, rivières, légende et cartouche."""
    n = 1024
    champ = bruit(n, 4.2, 21)[:h, :w] + 0.35 * bruit(n, 3.0, 22)[:h, :w] + np.linspace(-1.2, 1.2, w)[None, :]
    seuils = np.quantile(champ, np.linspace(0, 1, 9)[1:-1])
    cls = np.digitize(champ, seuils)
    teintes = [(196, 120, 96), (222, 170, 120), (236, 210, 140), (190, 206, 150), (150, 186, 170), (170, 160, 200), (222, 196, 170), (176, 136, 110)]
    img = papier(h, w, 23)
    marge = 40
    zone = np.zeros((h, w), bool)
    zone[marge:h - marge, marge:w - 260] = True
    for k, t in enumerate(teintes):
        m = (cls == k) & zone
        img[m] = img[m] * 0.35 + lin(t) * 0.65
    contour = np.zeros((h, w), bool)
    contour[1:, :] |= cls[1:, :] != cls[:-1, :]
    contour[:, 1:] |= cls[:, 1:] != cls[:, :-1]
    img[contour & zone] = lin((60, 50, 44))
    r = np.random.default_rng(24)
    for _ in range(4):        # rivières
        x, y = r.uniform(marge, w - 280), marge
        a = np.pi / 2
        while y < h - marge and marge < x < w - 260:
            a += r.normal(0, 0.25)
            a = np.clip(a, 0.4, np.pi - 0.4)
            x += np.cos(a) * 2
            y += np.sin(a) * 2
            yi, xi = int(y), int(x)
            img[yi - 1:yi + 2, xi - 1:xi + 2] = lin((70, 110, 160))
    # cadre, légende, cartouche
    for e, c in ((marge - 6, 2), (marge - 2, 1)):
        img[e:h - e, e:e + c] = img[e:h - e, w - 260 + 2 - e + marge - c:w - 260 + 2 - e + marge] = lin((50, 42, 36))
        img[e:e + c, e:w - 260 + marge - e] = img[h - e - c:h - e, e:w - 260 + marge - e] = lin((50, 42, 36))
    for k, t in enumerate(teintes):
        y0 = 80 + k * 70
        img[y0:y0 + 40, w - 220:w - 170] = lin(t)
        img[y0:y0 + 40, w - 220:w - 219] = img[y0:y0 + 40, w - 171:w - 170] = lin((50, 42, 36))
        img[y0:y0 + 1, w - 220:w - 170] = img[y0 + 39:y0 + 40, w - 220:w - 170] = lin((50, 42, 36))
        for j in range(2):
            lg = r.integers(50, 120)
            img[y0 + 10 + j * 14:y0 + 12 + j * 14, w - 160:w - 160 + lg] = lin((70, 60, 52))
    img[h - 190:h - 60, w - 240:w - 50] = img[h - 190:h - 60, w - 240:w - 50] * 0.97
    for j in range(5):
        lg = r.integers(80, 170)
        img[h - 170 + j * 22:h - 166 + j * 22, w - 230:w - 230 + lg] = lin((60, 50, 44))
    Image.fromarray(srgb(img).round().astype(np.uint8)).save(f'{SORTIE}/carte_couleur.jpg', quality=92)


def pages_livre(w=1024, h=640):
    """Un livre ouvert : texte à gauche, planche de papillons gravée à droite (dessinée par le jeu)."""
    img = papier(h, w, 31)
    r = np.random.default_rng(32)
    encre = lin((52, 44, 38))
    for page, x0 in ((0, 60), (1, w // 2 + 50)):
        if page == 0:
            for j in range(34):
                y = 58 + j * 15
                x = x0
                fin = w // 2 - 50 - (r.integers(40, 200) if j % 9 == 8 else 0)
                while x < fin:
                    lg = r.integers(6, 34)
                    img[y:y + 2, x:min(x + lg, fin)] = img[y:y + 2, x:min(x + lg, fin)] * 0.45 + encre * 0.55
                    x += lg + r.integers(4, 7)
    try:
        pl = Image.open(os.path.join(os.path.dirname(SORTIE), 'canvas', 'texPapillons.png')).convert('RGB').resize((w // 2 - 110, h - 140))
        a = lin(np.asarray(pl, float))
        img[70:70 + a.shape[0], w // 2 + 55:w // 2 + 55 + a.shape[1]] = a * 0.92
    except Exception as e:
        print('planche indisponible', e)
    # le creux de la reliure
    x = np.arange(w)
    img *= (1 - 0.35 * np.exp(-((x - w / 2) / 18) ** 2))[None, :, None]
    Image.fromarray(srgb(img).round().astype(np.uint8)).save(f'{SORTIE}/pages_couleur.jpg', quality=92)


if __name__ == '__main__':
    carte_geologique()
    pages_livre()
    print('carte et pages prêtes')
