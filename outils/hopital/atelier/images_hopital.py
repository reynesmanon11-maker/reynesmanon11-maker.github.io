# Les images de l'hôpital : affiches (schémas de l'exercice de Yamina Lucas, photographiés par affiches.mjs),
# écrans (caryotype, échographie, moniteur du bloc, scanner, dossier patient), plan « Vous êtes ici », signalétique.
# python3 -I images_hopital.py <dossier des schémas> <dossier de sortie> [panorama dehors.webp du cabinet]
# Charte : bleu nuit #18212e, sarcelle #0b6b77 (celle de l'exercice), bois de chêne, blanc chaud.
import sys, os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCH, OUT = sys.argv[1:3]
os.makedirs(OUT, exist_ok=True)
FI = '/usr/share/fonts/opentype/inter/'
def F(t, g='Regular'):
    return ImageFont.truetype(FI + f'Inter-{g}.otf', t)
NUIT, SARC, BLANC = (24, 33, 46), (11, 107, 119), (250, 249, 246)
rnd = random.Random(7)


def sauver(im, nom, q=90):
    im.convert('RGB').save(os.path.join(OUT, nom + '.jpg'), quality=q)
    print(' ', nom, im.size)


def centre(d, xy, t, f, fill):
    d.text(xy, t, font=f, fill=fill, anchor='mm')


def coller(fond, im, box):
    """Colle im dans box (x0, y0, x1, y1) en gardant ses proportions."""
    x0, y0, x1, y1 = box
    im = im.copy(); im.thumbnail((x1 - x0, y1 - y0), Image.LANCZOS)
    fond.paste(im, (x0 + (x1 - x0 - im.width) // 2, y0 + (y1 - y0 - im.height) // 2))


def rogner(im):
    a = np.asarray(im.convert('L')) < 245
    ys, xs = np.where(a)
    return im.crop((max(0, xs.min() - 10), max(0, ys.min() - 10), xs.max() + 10, ys.max() + 10))


def schema(n):
    return rogner(Image.open(os.path.join(SCH, f'svg{n}.png')).convert('RGB'))


# ------------------------------------------------------------------ affiches
def affiche(titre, sous, w=1200, h=1600, bande=SARC):
    im = Image.new('RGB', (w, h), BLANC); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 210), fill=bande)
    d.text((70, 60), titre, font=F(64, 'Bold'), fill='white')
    d.text((72, 145), sous, font=F(32), fill=(214, 236, 238))
    d.rectangle((0, h - 70, w, h), fill=NUIT)
    d.text((70, h - 35), 'Pôle Femme-Enfant · Service de chirurgie pédiatrique', font=F(24), fill=(190, 200, 212), anchor='lm')
    return im, d


im, d = affiche("L'appareil génital se met en place", "Trois stades du développement embryonnaire", w=1800, h=1200)
for k, (n, t) in enumerate(((2, 'Stade indifférencié'), (3, 'Évolution masculine'), (4, 'Évolution féminine'))):
    x0 = 60 + k * 580
    d.rounded_rectangle((x0, 260, x0 + 540, 1050), 24, fill='white', outline=(220, 224, 228), width=3)
    coller(im, schema(n), (x0 + 30, 290, x0 + 510, 940))
    centre(d, (x0 + 270, 1000), t, F(38, 'SemiBold'), NUIT)
sauver(im, 'affiche_appareil')

im, d = affiche("Du chromosome au gène", "L'information génétique, du noyau à la séquence d'ADN", w=1600, h=1200, bande=(93, 74, 134))
coller(im, schema(7), (60, 260, 1540, 640))
d.rounded_rectangle((60, 680, 1540, 1080), 24, fill='white', outline=(220, 224, 228), width=3)
coller(im, schema(8), (100, 700, 760, 1060))
d.multiline_text((820, 760), "Une paire de chromosomes\n\nLes deux chromosomes d'une paire\nportent les mêmes gènes, aux mêmes\nemplacements, parfois en versions\n(allèles) différentes.",
                 font=F(36), fill=NUIT, spacing=12)
sauver(im, 'affiche_adn')

# affiche générale (elle ne doit pas souffler les réponses de l'enquête)
im, d = affiche("Les glandes endocrines", "Elles libèrent des hormones dans le sang", w=1200, h=1600, bande=(176, 110, 40))
d.ellipse((470, 300, 730, 560), fill=(240, 226, 210), outline=NUIT, width=6)          # tête
d.rounded_rectangle((420, 560, 780, 1380), 120, fill=(240, 226, 210), outline=NUIT, width=6)   # tronc
for (x, y, t, cote) in ((600, 400, 'Hypothalamus', 1), (600, 470, 'Hypophyse', -1), (600, 640, 'Thyroïde', 1), (560, 900, 'Surrénales', -1),
                        (640, 960, 'Pancréas', 1), (600, 1250, 'Gonades', -1)):
    d.ellipse((x - 26, y - 26, x + 26, y + 26), fill=(176, 110, 40))
    xe = 860 if cote > 0 else 340
    d.line((x, y, xe, y), fill=NUIT, width=4)
    d.text((xe + 20 * cote, y), t, font=F(40, 'SemiBold'), fill=NUIT, anchor='lm' if cote > 0 else 'rm')
sauver(im, 'affiche_hormones')

im, d = affiche("Hygiène des mains", "Friction hydro-alcoolique : 30 secondes, 6 gestes", w=1200, h=1600, bande=(40, 120, 180))
for k in range(6):
    cx, cy = 300 + (k % 2) * 600, 420 + (k // 2) * 380
    d.ellipse((cx - 150, cy - 150, cx + 150, cy + 150), fill=(226, 238, 248))
    # deux mains stylisées
    for s in (-1, 1):
        d.rounded_rectangle((cx + s * 40 - 45, cy - 80 + s * 10, cx + s * 40 + 45, cy + 90), 40, fill=(232, 190, 160), outline=(170, 120, 96), width=4)
    centre(d, (cx, cy + 180), ('Paume contre paume', 'Dos des mains', 'Entre les doigts', 'Dos des doigts', 'Pouces', 'Bout des doigts')[k], F(34, 'SemiBold'), NUIT)
    d.ellipse((cx - 150, cy - 150, cx - 90, cy - 90), fill=(40, 120, 180)); centre(d, (cx - 120, cy - 120), str(k + 1), F(36, 'Bold'), 'white')
sauver(im, 'affiche_mains')

im, d = affiche("Zone à accès réglementé", "Bloc opératoire — tenue et masque obligatoires", w=1200, h=800, bande=(178, 54, 26))
d.ellipse((90, 300, 390, 600), outline=(178, 54, 26), width=26); d.line((140, 550, 340, 350), fill=(178, 54, 26), width=26)
d.multiline_text((450, 330), "Lavage chirurgical des mains\nCharlotte, masque, sabots\nNe pas franchir sans autorisation", font=F(42), fill=NUIT, spacing=26)
sauver(im, 'affiche_bloc')

# ------------------------------------------------------------------ écrans
def ui(w, h, titre, fond=(16, 20, 28)):
    im = Image.new('RGB', (w, h), fond); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 44), fill=(30, 40, 56)); d.text((16, 22), titre, font=F(22, 'SemiBold'), fill=(210, 220, 232), anchor='lm')
    return im, d


def chromosome(d, x, y, L, lg, bandes, centro):
    """Chromosome à deux chromatides avec bandes G (sombres) et centromère."""
    for dx in (-lg * 0.55, lg * 0.55):
        d.rounded_rectangle((x + dx - lg / 2, y, x + dx + lg / 2, y + L), int(lg / 2), fill=(236, 232, 226))
        for (a, b) in bandes:
            d.rectangle((x + dx - lg / 2 + 1, y + a * L, x + dx + lg / 2 - 1, y + b * L), fill=(70, 62, 80))
    c = y + centro * L
    d.ellipse((x - lg * 1.2, c - 3, x - lg * 0.9, c + 3), fill=(16, 20, 28)); d.ellipse((x + lg * 0.9, c - 3, x + lg * 1.2, c + 3), fill=(16, 20, 28))


im, d = ui(1600, 1000, 'Caryotype humain — coloration en bandes G — en cours d\'analyse')
LONG = [248, 242, 198, 190, 181, 171, 159, 146, 141, 135, 135, 133, 115, 107, 102, 90, 83, 80, 59, 64, 47, 51]
pos = [(k % 7, k // 7) for k in range(22)]
for k, L in enumerate(LONG):
    col, lig = (k % 6, 0) if k < 6 else ((k - 6) % 6, 1) if k < 12 else ((k - 12) % 6, 2) if k < 18 else ((k - 18), 3)
    cx = 150 + col * 230 + (230 if lig == 3 else 0); cy = 90 + lig * 230
    r = random.Random(k)
    bandes = []
    t = 0.06
    while t < 0.94:
        e = r.uniform(0.03, 0.08); bandes.append((t, t + e)); t += e + r.uniform(0.05, 0.12)
    for s in (-28, 28):
        chromosome(d, cx + s, cy + 170 - L * 0.7, L * 0.7, 10, bandes, r.uniform(0.25, 0.48))
    centre(d, (cx, cy + 190), str(k + 1), F(22), (170, 182, 196))
cx, cy = 150 + 5 * 230, 90 + 3 * 230
chromosome(d, cx - 30, cy + 170 - 110, 110, 10, [(0.1, 0.16), (0.3, 0.36), (0.6, 0.7), (0.8, 0.86)], 0.4)
chromosome(d, cx + 30, cy + 170 - 40, 40, 10, [(0.15, 0.25), (0.6, 0.75)], 0.3)
centre(d, (cx, cy + 190), 'X   Y', F(22, 'SemiBold'), (170, 182, 196))
sauver(im, 'ecran_caryotype')

# échographie : secteur, chatoiement, utérus maternel et embryon
W, H = 1200, 900
a = np.zeros((H, W)); yy, xx = np.mgrid[0:H, 0:W]
ox, oy = W / 2, 60
r = np.hypot(xx - ox, yy - oy); th = np.arctan2(xx - ox, yy - oy)
secteur = (r < 800) & (np.abs(th) < 0.62) & (r > 40)
bruit = np.random.default_rng(3).rayleigh(0.35, (H, W))
bruit = np.asarray(Image.fromarray((bruit * 120).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), float) / 255
tissu = 0.55 + 0.25 * np.sin(r / 30) * 0.3
cav = ((xx - 600) / 300) ** 2 + ((yy - 470) / 190) ** 2 < 1          # sac gestationnel (liquide : noir)
paroi = ((xx - 600) / 340) ** 2 + ((yy - 470) / 225) ** 2 < 1
emb = ((xx - 560) / 120) ** 2 + ((yy - 500) / 62) ** 2 < 1
tete = ((xx - 690) / 64) ** 2 + ((yy - 468) / 58) ** 2 < 1
img = tissu * bruit * 1.4
img = np.where(paroi & ~cav, img * 1.6, img)
img = np.where(cav, bruit * 0.08, img)
img = np.where(emb | tete, bruit * 1.5 + 0.2, img)
img = np.where(secteur, img * (1 - r / 1100), 0)
im = Image.fromarray((img.clip(0, 1) * 255).astype(np.uint8)).convert('RGB')
d = ImageDraw.Draw(im)
d.text((20, 20), 'OBST 1er trim.   12 SA + 2 j', font=F(24), fill=(200, 210, 220))
d.text((20, 54), 'LCC 58 mm', font=F(24), fill=(230, 200, 90))
d.line((496, 500, 754, 470), fill=(230, 200, 90), width=2)
d.text((W - 20, 20), 'Freq 5.0 MHz  Gain 62', font=F(22), fill=(200, 210, 220), anchor='ra')
for k in range(9):
    d.line((W - 30, 120 + k * 80, W - 20, 120 + k * 80), fill=(200, 210, 220), width=2)
sauver(im, 'ecran_echo')

# moniteur de surveillance du bloc
im, d = ui(1200, 800, 'Salle 2  ·  Surveillance', fond=(6, 8, 10))
for k, (c, nom, val, f) in enumerate((((80, 230, 90), 'ECG II', '92', lambda t: (math.exp(-((t % 1) - 0.3) ** 2 * 900) * 1.0 - math.exp(-((t % 1) - 0.27) ** 2 * 2000) * 0.25 + 0.1 * math.sin(t * 6.28))),
                                      ((80, 210, 240), 'SpO2', '98', lambda t: max(0, math.sin((t % 1) * 3.14)) ** 2),
                                      ((240, 220, 80), 'CO2', '36', lambda t: 1.0 if (t % 1.6) < 0.9 else 0.0),
                                      ((240, 90, 90), 'PNI', '108/64', lambda t: 0.5 + 0.4 * math.sin(t * 6.28) * math.exp(-(t % 1) * 3)))):
    y = 110 + k * 170
    pts = [(30 + i * 2, y + 60 - f(i / 140) * 90) for i in range(420)]
    d.line(pts, fill=c, width=3)
    d.text((880, y - 20), nom, font=F(26), fill=c)
    d.text((1170, y + 50), val, font=F(84 if len(val) < 4 else 56, 'Bold'), fill=c, anchor='rm')
sauver(im, 'ecran_moniteur')

# scanner : coupes abdominales
im, d = ui(1600, 900, 'TDM abdomino-pelvienne  ·  coupes axiales', fond=(0, 0, 0))
for k in range(2):
    cx = 400 + k * 800; cy = 480
    a = np.zeros((760, 760)); yy, xx = np.mgrid[0:760, 0:760]
    e = ((xx - 380) / 330) ** 2 + ((yy - 380) / 250) ** 2
    a[e < 1] = 0.45; a[e < 0.86] = 0.32
    a[((xx - 380) / 40) ** 2 + ((yy - 560) / 40) ** 2 < 1] = 0.95          # vertèbre
    for sx in (-1, 1):
        a[((xx - 380 - sx * 170) / 70) ** 2 + ((yy - 420) / 110) ** 2 < 1] = 0.5   # reins / psoas
    a[((xx - 380) / 90) ** 2 + ((yy - 330 - k * 30) / 60) ** 2 < 1] = 0.58 if k else 0.18   # vessie (k=0) / masse
    a += np.random.default_rng(k).normal(0, 0.03, a.shape)
    sl = Image.fromarray((a.clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)).convert('RGB')
    im.paste(sl, (cx - 380, cy - 380))
    d.text((cx - 370, 70), f'Se 3  Im {41 + k * 6}', font=F(22), fill=(200, 200, 200))
sauver(im, 'ecran_scanner')

# dossier patient (logiciel hospitalier, thème clair)
im = Image.new('RGB', (1600, 1000), (241, 244, 247)); d = ImageDraw.Draw(im)
d.rectangle((0, 0, 1600, 70), fill=SARC); d.text((24, 35), 'Dossier patient informatisé', font=F(30, 'SemiBold'), fill='white', anchor='lm')
d.rectangle((0, 70, 300, 1000), fill=(226, 232, 238))
for k, t in enumerate(('Synthèse', 'Consultations', 'Biologie', 'Imagerie', 'Génétique', 'Comptes-rendus', 'Prescriptions')):
    d.text((30, 120 + k * 60), t, font=F(26, 'SemiBold' if k == 0 else 'Regular'), fill=NUIT)
d.rounded_rectangle((340, 110, 1560, 300), 16, fill='white'); d.text((370, 140), 'Patient D., 4 ans', font=F(40, 'Bold'), fill=NUIT)
d.text((370, 205), 'Chirurgie pédiatrique · Douleurs abdominales', font=F(26), fill=(80, 92, 108))
for k in range(4):
    d.rounded_rectangle((340 + k * 310, 340, 630 + k * 310, 560), 16, fill='white')
    d.rectangle((340 + k * 310, 340, 630 + k * 310, 350), fill=((11, 107, 119), (93, 74, 134), (176, 110, 40), (40, 120, 180))[k])
    for j in range(4):
        d.rounded_rectangle((360 + k * 310, 390 + j * 40, 360 + k * 310 + rnd.randint(140, 250), 410 + j * 40), 8, fill=(222, 228, 234))
d.rounded_rectangle((340, 600, 1560, 960), 16, fill='white')
for j in range(7):
    d.rounded_rectangle((370, 640 + j * 44, 370 + rnd.randint(500, 1100), 662 + j * 44), 8, fill=(226, 231, 236))
sauver(im, 'ecran_dossier')

# électrophorèse (schéma de l'exercice) affichée sur un écran du laboratoire
im, d = ui(1600, 900, "Électrophorèse des protéines — recherche de l'AMH", fond=(250, 251, 252))
coller(im, schema(14), (60, 90, 1540, 860))
sauver(im, 'ecran_electro')

# ------------------------------------------------------------------ plan « Vous êtes ici »
ROOMS = {'cyto': (20, 20, 270, 205), 'bloc': (300, 20, 110, 205), 'endo': (490, 20, 190, 205), 'gene': (690, 20, 190, 205),
         'repro': (20, 305, 190, 195), 'consult': (220, 305, 190, 195), 'hall': (490, 305, 120, 195), 'imagerie': (620, 305, 260, 195)}
NOMS = {'hall': "Hall d'accueil", 'bloc': 'Bloc opératoire'}
im = Image.new('RGB', (1800, 1200), BLANC); d = ImageDraw.Draw(im)
d.rectangle((0, 0, 1800, 150), fill=NUIT); d.text((60, 75), 'Plan du rez-de-chaussée', font=F(60, 'Bold'), fill='white', anchor='lm')
d.text((1740, 75), 'Pôle Femme-Enfant', font=F(36), fill=(170, 210, 214), anchor='rm')
k = 1.8; ox, oy = 90, 200
d.rectangle((ox + 20 * k, oy + 240 * k, ox + 880 * k, oy + 290 * k), fill=(232, 226, 214))
d.rectangle((ox + 425 * k, oy + 20 * k, ox + 475 * k, oy + 500 * k), fill=(232, 226, 214))
for nom, (x, y, w, h) in ROOMS.items():
    connu = nom in NOMS
    d.rectangle((ox + x * k, oy + y * k, ox + (x + w) * k, oy + (y + h) * k), fill=(214, 236, 233) if nom == 'bloc' else (246, 234, 210) if nom == 'hall' else (222, 228, 236),
                outline=NUIT, width=5)
    t = NOMS.get(nom, 'Service').replace(' ', '\n', 1)
    d.multiline_text((ox + (x + w / 2) * k, oy + (y + h / 2) * k), t, font=F(34, 'SemiBold'), fill=NUIT, anchor='mm', align='center')
d.ellipse((ox + 540 * k - 26, oy + 470 * k - 26, ox + 540 * k + 26, oy + 470 * k + 26), fill=(200, 40, 40))
d.text((ox + 540 * k + 40, oy + 470 * k), 'Vous êtes ici', font=F(32, 'Bold'), fill=(200, 40, 40), anchor='lm')
sauver(im, 'plan_hall')

# ------------------------------------------------------------------ signalétique
def panneau(lignes, w=1600, h=300, nom='x'):
    im = Image.new('RGB', (w, h), NUIT); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 18, h), fill=SARC)
    n = len(lignes)
    for i, (fl, t) in enumerate(lignes):
        y = h * (i + 0.5) / n
        x0 = 60
        if fl:
            d.polygon(((x0, y), (x0 + 50, y - 34), (x0 + 50, y - 14), (x0 + 100, y - 14), (x0 + 100, y + 14), (x0 + 50, y + 14), (x0 + 50, y + 34))
                      if fl == '<' else ((x0 + 100, y), (x0 + 50, y - 34), (x0 + 50, y - 14), (x0, y - 14), (x0, y + 14), (x0 + 50, y + 14), (x0 + 50, y + 34))
                      if fl == '>' else ((x0 + 50, y - 40), (x0 + 16, y), (x0 + 38, y), (x0 + 38, y + 40), (x0 + 62, y + 40), (x0 + 62, y), (x0 + 84, y)), fill='white')
        d.text((x0 + 140, y), t, font=F(int(h / n * 0.42), 'SemiBold'), fill='white', anchor='lm')
    sauver(im, nom)


panneau([('<', 'Bloc opératoire'), ('<', 'Aile ouest · Laboratoires'), ('>', 'Aile est · Services')], h=420, nom='signal_croisement')
panneau([('>', "Hall d'accueil · Sortie")], h=160, nom='signal_ouest')
panneau([('<', "Hall d'accueil · Sortie")], h=160, nom='signal_est')

# logo de l'accueil : une croix sarcelle dans un rond
im = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.ellipse((16, 16, 496, 496), fill=SARC)
d.rounded_rectangle((206, 96, 306, 416), 16, fill='white'); d.rounded_rectangle((96, 206, 416, 306), 16, fill='white')
im.convert('RGB').save(os.path.join(OUT, 'logo.jpg'), quality=92)
# clavier vu de dessus (touches gris foncé, lettres claires)
im = Image.new('RGB', (840, 250), (40, 42, 46)); d = ImageDraw.Draw(im)
for j, n in enumerate((14, 14, 13, 12)):
    for i in range(n):
        x = 12 + i * 58 + j * 14; y = 12 + j * 56
        d.rounded_rectangle((x, y, x + 52, y + 50), 6, fill=(62, 65, 70))
d.rounded_rectangle((180, 236 - 12 - 4, 560, 246), 6, fill=(62, 65, 70))
im.save(os.path.join(OUT, 'clavier.jpg'), quality=90)
# écran de la borne d'accueil
im = Image.new('RGB', (840, 540), (246, 248, 250)); d = ImageDraw.Draw(im)
d.rectangle((0, 0, 840, 90), fill=SARC); d.text((30, 45), 'Bienvenue', font=F(44, 'Bold'), fill='white', anchor='lm')
for k, t in enumerate(("Je m'enregistre", 'Je cherche un service', 'Plan du rez-de-chaussée')):
    d.rounded_rectangle((40, 130 + k * 125, 800, 230 + k * 125), 18, fill='white', outline=(200, 210, 218), width=3)
    d.text((80, 180 + k * 125), t, font=F(36, 'SemiBold'), fill=NUIT, anchor='lm')
im.save(os.path.join(OUT, 'ecran_borne.jpg'), quality=90)
# écran d'information (image de repli : la page dessine ses propres diapositives)
im = Image.new('RGB', (1280, 720), NUIT); d = ImageDraw.Draw(im)
d.rectangle((0, 0, 24, 720), fill=SARC)
d.text((80, 300), 'Pôle Femme-Enfant', font=F(80, 'Bold'), fill='white', anchor='lm')
d.text((84, 400), 'Bienvenue', font=F(48), fill=(170, 210, 214), anchor='lm')
im.save(os.path.join(OUT, 'ecran_tv.jpg'), quality=90)
# pictogramme de sortie de secours (vert, personnage qui court vers une porte, flèche)
im = Image.new('RGB', (800, 300), (20, 140, 70)); d = ImageDraw.Draw(im)
d.rectangle((40, 40, 260, 260), outline='white', width=14)                    # la porte
d.ellipse((380, 50, 440, 110), fill='white')                                  # tête
d.line((405, 115, 370, 200), fill='white', width=30); d.line((370, 200, 430, 270), fill='white', width=26)
d.line((370, 200, 310, 250), fill='white', width=26); d.line((395, 140, 460, 170), fill='white', width=22); d.line((395, 140, 330, 150), fill='white', width=22)
d.polygon(((520, 150), (600, 90), (600, 125), (740, 125), (740, 175), (600, 175), (600, 210)), fill='white')
im.save(os.path.join(OUT, 'sortie_secours.jpg'), quality=90)
# enseigne suspendue de l'accueil
im = Image.new('RGB', (1400, 260), NUIT); d = ImageDraw.Draw(im)
d.rectangle((0, 0, 1400, 18), fill=SARC)
d.text((700, 140), 'Accueil  ·  Admissions', font=F(96, 'SemiBold'), fill='white', anchor='mm')
im.save(os.path.join(OUT, 'enseigne_accueil.jpg'), quality=90)
# deux photographies de paysage, tirées du panorama du parc (Poly Haven, CC0)
if len(sys.argv) > 3:            # troisième argument : le panorama du parc (Poly Haven, CC0), d'où l'on tire deux photographies
    from PIL import ImageEnhance
    pano = Image.open(sys.argv[3]).convert('RGB')
    for k, (x, y) in enumerate(((300, 700), (2350, 720))):
        ph = pano.crop((x, y, x + 900, y + 600))
        ImageEnhance.Contrast(ImageEnhance.Color(ph).enhance(1.15)).enhance(1.08).save(os.path.join(OUT, f'photo_parc{k}.jpg'), quality=90)
print('images prêtes')
