# Le mobilier modelé du cabinet : bibliothèques, vitrine, table de travail, guéridon, médaillier,
# bureau, coffre, chaises, globe. Mêmes emplacements et mêmes hauteurs de plateaux que dans la
# pièce dessinée par le code : les curiosités (donnees/objets.js) retombent juste sur leurs supports.
import math, random
from mathutils import Matrix, Vector
from geo import pave, tour, balayer, extruder, arc, PI, TAU, V, objet
import piece
from piece import panneau, vantail, doucine

SOLIDES = []          # emprises au sol (x0, z0, x1, z1), pour les collisions dans la page
FLAMMES = []          # mèches allumées (x, y, z, taille)
ETAGERES = []         # rayons à garnir de livres : (x0, x1, y, z_fond, z_avant, hauteur libre)


def solide(x0, z0, x1, z1):
    SOLIDES.append([round(min(x0, x1), 3), round(min(z0, z1), 3), round(max(x0, x1), 3), round(max(z0, z1), 3)])


def corniche_meuble(nom, x0, x1, z_fond, z_avant, y, mat, groupe, retours=True, taille=1.0):
    """Corniche de couronnement : balayée sur la façade et retournée sur les côtés."""
    prof = [(a * taille, h * taille) for (a, h) in
            [(0, 0), (0.012, 0), (0.012, 0.012)] + doucine(0.012, 0.012, 0.05, 0.05, 6)[1:] + [(0.058, 0.054), (0.062, 0.058), (0.062, 0.09), (0.0, 0.09)]]
    pts = [(x0, y, z_fond), (x0, y, z_avant), (x1, y, z_avant), (x1, y, z_fond)]
    balayer(nom, pts, [(-1, 0, 0), (0, 0, 1), (1, 0, 0)], (0, 1, 0), prof, mat, groupe=groupe)


def socle_meuble(nom, x0, x1, z_fond, z_avant, mat, groupe, h=0.11):
    prof = [(0.0, 0.0), (0.018, 0.0), (0.018, h - 0.035)] + doucine(0.018, h - 0.035, 0.0, h, 5)[1:]
    sg = 1 if z_avant > z_fond else -1
    pts = [(x0, 0.0, z_fond), (x0, 0.0, z_avant), (x1, 0.0, z_avant), (x1, 0.0, z_fond)]
    if sg < 0:
        pts = [(x1, 0.0, z_fond), (x1, 0.0, z_avant), (x0, 0.0, z_avant), (x0, 0.0, z_fond)]
    balayer(nom, pts, [(-sg, 0, 0), (0, 0, sg), (sg, 0, 0)], (0, 1, 0), prof, mat, groupe=groupe)


# ---------------------------------------------------------------- bibliothèques
def bibliotheque(nom, x0, x1, mat='noyer', groupe='meubles'):
    """Bibliothèque à hauteur d'appui : placards à panneaux en bas, rayons ouverts au-dessus,
    pilastres entre les travées, corniche moulurée. Adossée au mur nord (z = −4,5)."""
    zF = piece.Z0
    zB = zF + 0.45            # avant du bas
    zH = zF + 0.34            # avant du haut (en retrait)
    yT = 0.9                  # tablette d'appui
    h = 3.0
    nb = max(1, round((x1 - x0) / 1.2))
    lg = (x1 - x0) / nb
    socle_meuble(nom + '_socle', x0, x1, zF, zB + 0.015, mat, groupe)
    pave(nom + '_bas', x0, 0.11, zF, x1, yT - 0.035, zB, mat, groupe=groupe, chanfrein=0.002)
    pave(nom + '_appui', x0 - 0.02, yT - 0.035, zF, x1 + 0.02, yT, zB + 0.03, mat, groupe=groupe, chanfrein=0.012, segments=3, fil='x')
    for k in range(nb):
        a, b = x0 + k * lg + 0.03, x0 + (k + 1) * lg - 0.03
        m = (a + b) / 2
        vantail(f'{nom}_v{k}a', 'z', zB, +1, a, m - 0.003, 0.16, yT - 0.07, mat, groupe, bouton='droite')
        vantail(f'{nom}_v{k}b', 'z', zB, +1, m + 0.003, b, 0.16, yT - 0.07, mat, groupe, bouton='gauche')
    # partie haute : fond, côtés, pilastres, rayons
    pave(nom + '_fond', x0, yT, zF, x1, h, zF + 0.015, mat, groupe=groupe, chanfrein=0)
    pave(nom + '_cote_g', x0, yT, zF, x0 + 0.035, h, zH, mat, groupe=groupe, chanfrein=0.003, fil='y')
    pave(nom + '_cote_d', x1 - 0.035, yT, zF, x1, h, zH, mat, groupe=groupe, chanfrein=0.003, fil='y')
    for k in range(nb + 1):
        xc = x0 + k * lg
        a = xc if k == 0 else (x1 - 0.07 if k == nb else xc - 0.035)
        if 0 < k < nb:
            pave(f'{nom}_sep{k}', xc - 0.015, yT, zF, xc + 0.015, h, zH, mat, groupe=groupe, chanfrein=0.002, fil='y')
        # pilastre : fût en léger relief, base et chapiteau moulurés
        pave(f'{nom}_pil{k}', a, yT, zH, a + 0.07, h - 0.02, zH + 0.022, mat, groupe=groupe, chanfrein=0.004, fil='y')
        pave(f'{nom}_pil{k}_b', a - 0.008, yT, zH, a + 0.078, yT + 0.08, zH + 0.03, mat, groupe=groupe, chanfrein=0.006, segments=2)
        pave(f'{nom}_pil{k}_c', a - 0.008, h - 0.13, zH, a + 0.078, h - 0.09, zH + 0.03, mat, groupe=groupe, chanfrein=0.006, segments=2)
    pave(nom + '_frise', x0, h - 0.09, zF, x1, h, zH + 0.022, mat, groupe=groupe, chanfrein=0.003, fil='x')
    corniche_meuble(nom + '_corniche', x0 - 0.005, x1 + 0.005, zF, zH + 0.022, h, mat, groupe, taille=1.3)
    pave(nom + '_dessus', x0 - 0.06, h + 0.117, zF, x1 + 0.06, h + 0.125, zH + 0.1, mat, groupe=groupe, chanfrein=0.003)
    niveaux = [yT, 1.42, 1.9, 2.38, h - 0.13]
    for i, y in enumerate(niveaux[1:-1]):
        for k in range(nb):
            a, b = x0 + k * lg + (0.035 if k == 0 else 0.015), x0 + (k + 1) * lg - (0.035 if k == nb - 1 else 0.015)
            pave(f'{nom}_r{i}_{k}', a, y - 0.028, zF + 0.015, b, y, zH - 0.005, mat, groupe=groupe, chanfrein=0.004, segments=2, fil='x')
            # petite lambrequin de cuir festonné qui protège les livres de la poussière (vu chez les bibliophiles)
    for i in range(len(niveaux) - 1):
        y = niveaux[i]
        libre = niveaux[i + 1] - 0.028 - y
        for k in range(nb):
            a, b = x0 + k * lg + (0.035 if k == 0 else 0.015), x0 + (k + 1) * lg - (0.035 if k == nb - 1 else 0.015)
            ETAGERES.append((a + 0.004, b - 0.004, y, zF + 0.015, zH - 0.01, libre))
    solide(x0 - 0.02, zF, x1 + 0.02, zB + 0.03)
    return h + 0.125


# ---------------------------------------------------------------- vitrine
def vitrine(x0=0.3, x1=3.3, mat='acajou', groupe='meubles'):
    """Vitrine d'histoire naturelle : soubassement à portes, grande cage vitrée à deux vantaux,
    fond et plateaux tendus de velours vert, corniche. Les rayons sont à 0,9 / 1,45 / 1,95 m,
    comme dans la pièce dessinée par le code (les curiosités y sont posées)."""
    zF, prof = piece.Z0, 0.55
    zA = zF + prof
    h = 2.5
    xm = (x0 + x1) / 2
    socle_meuble('vit_socle', x0, x1, zF, zA + 0.02, mat, groupe, h=0.1)
    pave('vit_bas', x0, 0.1, zF, x1, 0.84, zA, mat, groupe=groupe, chanfrein=0.002)
    w = (x1 - x0 - 0.1) / 3
    for k in range(3):
        a = x0 + 0.05 + k * w
        vantail(f'vit_p{k}', 'z', zA, +1, a + 0.01, a + w - 0.01, 0.15, 0.8, mat, groupe, bouton='gauche' if k < 2 else 'droite')
    pave('vit_ceinture', x0 - 0.015, 0.84, zF, x1 + 0.015, 0.9, zA + 0.025, mat, groupe=groupe, chanfrein=0.01, segments=2, fil='x')
    # cage vitrée : montants d'angle, fond de velours, plateaux
    pave('vit_mont_g', x0, 0.9, zF, x0 + 0.06, h, zA, mat, groupe=groupe, chanfrein=0.004, fil='y')
    pave('vit_mont_d', x1 - 0.06, 0.9, zF, x1, h, zA, mat, groupe=groupe, chanfrein=0.004, fil='y')
    pave('vit_velours_fond', x0 + 0.06, 0.9, zF, x1 - 0.06, h - 0.08, zF + 0.02, 'velours_vert', groupe='velours', chanfrein=0)
    pave('vit_velours_sol', x0 + 0.06, 0.9, zF + 0.02, x1 - 0.06, 0.906, zA - 0.06, 'velours_vert', groupe='velours', chanfrein=0)
    for y in (1.45, 1.95):
        pave(f'vit_plateau{y}', x0 + 0.06, y - 0.024, zF + 0.02, x1 - 0.06, y, zA - 0.07, mat, groupe=groupe, chanfrein=0.004, segments=2, fil='x')
        pave(f'vit_plateau_v{y}', x0 + 0.06, y - 0.004, zF + 0.02, x1 - 0.06, y + 0.002, zA - 0.075, 'velours_vert', groupe='velours', chanfrein=0)
    pave('vit_haut', x0, h - 0.08, zF, x1, h, zA, mat, groupe=groupe, chanfrein=0.003, fil='x')
    corniche_meuble('vit_corniche', x0 - 0.005, x1 + 0.005, zF, zA, h, mat, groupe, taille=1.2)
    pave('vit_dessus', x0 - 0.055, h + 0.105, zF, x1 + 0.055, h + 0.112, zA + 0.08, mat, groupe=groupe, chanfrein=0.002)
    # vantaux vitrés (cadres fins, petits-bois horizontaux à la hauteur des plateaux) et côtés vitrés
    ep = 0.03
    for v, (a, b) in enumerate([(x0 + 0.06, xm), (xm, x1 - 0.06)]):
        pave(f'vit_vv{v}_g', a, 0.9, zA - ep, a + 0.045, h - 0.08, zA, mat, groupe=groupe, chanfrein=0.003, fil='y')
        pave(f'vit_vv{v}_d', b - 0.045, 0.9, zA - ep, b, h - 0.08, zA, mat, groupe=groupe, chanfrein=0.003, fil='y')
        pave(f'vit_vv{v}_b', a + 0.045, 0.9, zA - ep, b - 0.045, 0.96, zA, mat, groupe=groupe, chanfrein=0.003, fil='x')
        pave(f'vit_vv{v}_h', a + 0.045, h - 0.14, zA - ep, b - 0.045, h - 0.08, zA, mat, groupe=groupe, chanfrein=0.003, fil='x')
        pave(f'vit_vv{v}_verre', a + 0.045, 0.96, zA - 0.016, b - 0.045, h - 0.14, zA - 0.014, 'verre', groupe='verre', chanfrein=0, cuire=0)
        tour(f'vit_entree{v}', [(0.0, 0.0), (0.012, 0.0), (0.012, 0.004), (0.0, 0.005)], 'laiton', centre=((b - 0.022) if v == 0 else (a + 0.022), 1.6, zA + 0.0),
             n=12, groupe='laiton', axe=Matrix.Rotation(PI / 2, 3, 'X'))
    for s, x in ((-1, x0), (1, x1)):
        xa = x0 + 0.005 if s < 0 else x1 - 0.007
        pave(f'vit_cote_verre{s}', xa, 0.96, zF + 0.06, xa + 0.002, h - 0.14, zA - 0.06, 'verre', groupe='verre', chanfrein=0, cuire=0)
    # petites curiosités de décor dans la vitrine : bocaux (verre et liquide) — les vraies curiosités sont ajoutées par la page
    for (x, y, r, hb, teinte) in [(1.7, 0.906, 0.07, 0.24, (0.82, 0.72, 0.42)), (2.15, 0.906, 0.055, 0.2, (0.75, 0.8, 0.55)), (3.05, 1.45, 0.05, 0.17, (0.85, 0.65, 0.4))]:
        z = -4.27
        tour(f'bocal{x}', [(0.0, 0.0), (r, 0.0), (r * 1.05, 0.012), (r * 1.05, hb * 0.85), (r * 0.85, hb * 0.93), (r * 0.8, hb)], 'verre', centre=(x, y, z), n=24,
             groupe='verre', ferme_haut=False, cuire=0)
        tour(f'bocal_liq{x}', [(0.0, 0.0), (r * 0.97, 0.0), (r * 0.97, hb * 0.78), (0.0, hb * 0.78)], f'liquide', centre=(x, y + 0.004, z), n=20, groupe='liquide', cuire=0)
        tour(f'bocal_bouchon{x}', [(0.0, hb - 0.004), (r * 0.82, hb - 0.004), (r * 0.84, hb + 0.022), (r * 0.6, hb + 0.03), (0.0, hb + 0.03)], 'liege',
             centre=(x, y, z), n=16, groupe='liege')
    solide(x0 - 0.02, zF, x1 + 0.02, zA + 0.03)


# ---------------------------------------------------------------- table de travail
def pied_tourne(nom, x, z, h, mat, groupe, gros=1.0):
    g = gros
    prof = [(0.0, 0.0), (0.026 * g, 0.0), (0.034 * g, 0.012), (0.03 * g, 0.03), (0.038 * g, 0.055), (0.03 * g, 0.075), (0.024 * g, 0.11),
            (0.028 * g, h * 0.45), (0.036 * g, h * 0.5), (0.04 * g, h * 0.53), (0.032 * g, h * 0.56), (0.03 * g, h * 0.62), (0.034 * g, h * 0.64),
            (0.031 * g, h * 0.7), (0.042 * g, h * 0.74), (0.042 * g, h - 0.17), (0.0, h - 0.17)]
    tour(nom, prof, mat, centre=(x, 0, z), n=16, groupe=groupe)


def etabli(x0=-1.6, z0=-0.75, x1=1.6, z1=0.75, h=0.92, mat='noyer', groupe='meubles'):
    """Établi de laboratoire (paillasse) : deux rangées de placards dos à dos, tiroirs sous le
    plateau, plinthe en retrait, épais plateau de pierre noire au bord adouci."""
    ep = 0.045
    pave('etabli_plinthe', x0 + 0.06, 0, z0 + 0.06, x1 - 0.06, 0.1, z1 - 0.06, 'fer_noir', groupe='chassis', chanfrein=0.002)
    pave('etabli_caisse', x0 + 0.02, 0.1, z0 + 0.03, x1 - 0.02, h - ep, z1 - 0.03, mat, groupe=groupe, chanfrein=0.002)
    pave('etabli_plateau', x0, h - ep, z0, x1, h, z1, 'pierre_noire', groupe='pierre', chanfrein=0.012, segments=3)
    n = 6
    lg = (x1 - x0 - 0.04) / n
    for face, zf, sens in (('s', z1 - 0.03, +1), ('n', z0 + 0.03, -1)):
        for k in range(n):
            a, b = x0 + 0.02 + k * lg + 0.006, x0 + 0.02 + (k + 1) * lg - 0.006
            # tiroir : façade à cadre mouluré, poignée de laiton
            yt0, yt1 = h - ep - 0.17, h - ep - 0.015
            if sens > 0:
                pave(f'etabli_t{face}{k}', a, yt0, zf, b, yt1, zf + 0.02, mat, groupe=groupe, chanfrein=0.004, segments=2, fil='x')
            else:
                pave(f'etabli_t{face}{k}', a, yt0, zf - 0.02, b, yt1, zf, mat, groupe=groupe, chanfrein=0.004, segments=2, fil='x')
            zc = zf + sens * 0.02
            for dx in (-0.045, 0.045):
                tour(f'etabli_pt{face}{k}{dx}', [(0.0, 0.0), (0.009, 0.0), (0.007, 0.012), (0.0, 0.014)], 'laiton', centre=((a + b) / 2 + dx, (yt0 + yt1) / 2, zc), n=10,
                     groupe='laiton', axe=Matrix.Rotation(sens * PI / 2, 3, 'X'))
            pave(f'etabli_pb{face}{k}', (a + b) / 2 - 0.05, (yt0 + yt1) / 2 - 0.006, min(zc, zc + sens * 0.014), (a + b) / 2 + 0.05,
                 (yt0 + yt1) / 2 + 0.006, max(zc, zc + sens * 0.014) + (0.0), 'laiton', groupe='laiton', chanfrein=0.004, segments=2)
            vantail(f'etabli_v{face}{k}', 'z', zf, sens, a, b, 0.12, yt0 - 0.012, mat, groupe, bouton='droite' if k % 2 else 'gauche')
    for s_, x in ((-1, x0 + 0.02), (1, x1 - 0.02)):
        panneau(f'etabli_cote{s_}', 'x', x, s_, z0 + 0.09, z1 - 0.09, 0.16, h - ep - 0.06, 0.0, mat, groupe, b=0.06)
    solide(x0, z0, x1, z1)


def tabouret(nom, x, z, h=0.66, groupe='meubles'):
    """Tabouret de laboratoire : assise de hêtre tournée, piètement de fer à quatre pieds écartés et repose-pieds."""
    tour(nom + '_assise', [(0.0, h - 0.035), (0.165, h - 0.035), (0.175, h - 0.028), (0.18, h - 0.012), (0.174, h - 0.002), (0.15, h + 0.004), (0.0, h + 0.008)],
         'hetre', centre=(x, 0, z), n=40, groupe='hetre')
    tour(nom + '_moyeu', [(0.0, h - 0.07), (0.06, h - 0.07), (0.07, h - 0.05), (0.07, h - 0.035), (0.0, h - 0.035)], 'fer_noir', centre=(x, 0, z), n=20, groupe='chassis')
    cercle = [(0.011 * math.cos(t / 8 * TAU), 0.011 * math.sin(t / 8 * TAU)) for t in range(9)]
    for k in range(4):
        a = k / 4 * TAU + PI / 4
        ca, sa = math.cos(a), math.sin(a)
        pts = [(x + ca * r, y, z + sa * r) for (r, y) in [(0.055, h - 0.05), (0.12, h * 0.6), (0.19, h * 0.25), (0.215, 0.012)]]
        balayer(f'{nom}_pied{k}', pts, [(-sa, 0, ca)] * 3, (0, 1, 0), cercle, 'fer_noir', groupe='chassis', lisse=60)
        tour(f'{nom}_patin{k}', [(0.0, 0.0), (0.016, 0.0), (0.016, 0.014), (0.0, 0.018)], 'fer_noir', centre=(x + ca * 0.216, 0, z + sa * 0.216), n=10, groupe='chassis')
    # repose-pieds : anneau de fer
    tour(nom + '_anneau', [(0.165, 0.24), (0.175, 0.248), (0.165, 0.256), (0.155, 0.248), (0.165, 0.24)], 'fer_noir', centre=(x, 0, z), n=40, groupe='chassis',
         ferme_haut=False, ferme_bas=False)
    solide(x - 0.22, z - 0.22, x + 0.22, z + 0.22)


# ---------------------------------------------------------------- guéridon et globe de verre des pinsons
def gueridon(x=4.25, z=-2.25, mat='acajou', groupe='meubles'):
    tour('gueri_plateau', [(0.0, 0.72), (0.4, 0.72), (0.418, 0.728), (0.42, 0.742), (0.412, 0.752), (0.0, 0.755)], mat, centre=(x, 0, z), n=48, groupe=groupe)
    tour('gueri_fut', [(0.0, 0.12), (0.075, 0.12), (0.07, 0.16), (0.05, 0.2), (0.042, 0.32), (0.06, 0.4), (0.064, 0.43), (0.045, 0.47),
                       (0.038, 0.56), (0.05, 0.62), (0.07, 0.66), (0.06, 0.7), (0.09, 0.72), (0.0, 0.72)], mat, centre=(x, 0, z), n=20, groupe=groupe)
    for k in range(3):
        a = k / 3 * TAU + 0.3
        ca, sa = math.cos(a), math.sin(a)
        pts = [(x + ca * r, y, z + sa * r) for (r, y) in [(0.05, 0.16), (0.14, 0.12), (0.24, 0.07), (0.31, 0.035), (0.35, 0.03)]]
        cercle = [(0.022 * math.cos(t / 8 * TAU), 0.022 * math.sin(t / 8 * TAU)) for t in range(9)]
        # pied cambré : tube balayé dans le plan vertical du pied
        n_plan = (-sa, 0, ca)
        normales = [n_plan] * (len(pts) - 1)
        balayer(f'gueri_pied{k}', pts, normales, (0, 1, 0), [(c[0], c[1]) for c in cercle], mat, groupe=groupe, lisse=60)
        tour(f'gueri_patin{k}', [(0.0, 0.0), (0.03, 0.0), (0.03, 0.02), (0.0, 0.035)], mat, centre=(x + ca * 0.355, 0.0, z + sa * 0.355), n=12, groupe=groupe)
    # globe de verre sur son socle d'ébène
    tour('globe_socle', [(0.0, 0.755), (0.225, 0.755), (0.23, 0.765), (0.222, 0.775), (0.212, 0.778), (0.0, 0.778)], 'ebene', centre=(x, 0, z), n=40, groupe='ebene')
    tour('globe_verre', [(0.205, 0.0), (0.21, 0.02), (0.21, 0.3), (0.195, 0.38), (0.155, 0.43), (0.085, 0.455), (0.0, 0.462)], 'verre',
         centre=(x, 0.775, z), n=40, groupe='verre', ferme_bas=False, cuire=0)
    tour('globe_bouton', [(0.0, 0.0), (0.022, 0.006), (0.026, 0.022), (0.016, 0.04), (0.0, 0.046)], 'verre', centre=(x, 1.234, z), n=14, groupe='verre', cuire=0)
    solide(x - 0.42, z - 0.42, x + 0.42, z + 0.42)


# ---------------------------------------------------------------- médaillier, bureau, coffre
def medaillier(x0=-3.8, x1=-2.2, z0=3.84, z1=4.38, h=0.86, mat='acajou', groupe='meubles'):
    """Médaillier : deux colonnes de six tiroirs plats, boutons de laiton, plateau mouluré."""
    socle_meuble('med_socle', x0, x1, z1, z0 - 0.015, mat, groupe, h=0.08)
    pave('med_caisse', x0, 0.08, z0, x1, h - 0.03, z1, mat, groupe=groupe, chanfrein=0.003)
    pave('med_plateau', x0 - 0.02, h - 0.03, z0 - 0.03, x1 + 0.02, h, z1, mat, groupe=groupe, chanfrein=0.012, segments=3, fil='x')
    n, w = 6, (x1 - x0 - 0.1) / 2
    hh = (h - 0.03 - 0.12) / n
    for col in range(2):
        a = x0 + 0.04 + col * (w + 0.02)
        for k in range(n):
            y = 0.1 + k * hh
            pave(f'med_t{col}{k}', a, y + 0.006, z0 - 0.014, a + w, y + hh - 0.006, z0 + 0.002, mat, groupe=groupe, chanfrein=0.003, fil='x')
            tour(f'med_b{col}{k}', [(0.0, 0.0), (0.008, 0.0), (0.006, 0.008), (0.012, 0.016), (0.0, 0.02)], 'laiton', centre=(a + w / 2, y + hh / 2, z0 - 0.014),
                 n=10, groupe='laiton', axe=Matrix.Rotation(-PI / 2, 3, 'X'))
    solide(x0 - 0.02, z0 - 0.03, x1 + 0.02, z1)


def bureau(x0=0.85, x1=2.15, z0=3.72, z1=4.38, h=0.76, mat='noyer', groupe='meubles'):
    """Bureau plat : plateau gainé de cuir, ceinture à deux tiroirs, pieds fuselés."""
    pave('bur_plateau', x0, h - 0.035, z0, x1, h, z1, mat, groupe=groupe, chanfrein=0.01, segments=3, fil='x')
    pave('bur_cuir', x0 + 0.05, h - 0.0005, z0 + 0.05, x1 - 0.05, h + 0.0015, z1 - 0.05, 'cuir', groupe='cuir', chanfrein=0)
    pave('bur_ceinture', x0 + 0.04, h - 0.16, z0 + 0.04, x1 - 0.04, h - 0.035, z1 - 0.04, mat, groupe=groupe, chanfrein=0.003, fil='x')
    for k, (a, b) in enumerate([(x0 + 0.08, (x0 + x1) / 2 - 0.02), ((x0 + x1) / 2 + 0.02, x1 - 0.08)]):
        pave(f'bur_tiroir{k}', a, h - 0.145, z0 + 0.034, b, h - 0.05, z0 + 0.04, mat, groupe=groupe, chanfrein=0.003, fil='x')
        tour(f'bur_poignee{k}', [(0.0, 0.0), (0.012, 0.0), (0.006, 0.01), (0.011, 0.02), (0.0, 0.022)], 'laiton', centre=((a + b) / 2, h - 0.097, z0 + 0.034),
             n=10, groupe='laiton', axe=Matrix.Rotation(-PI / 2, 3, 'X'))
    for i, (x, z) in enumerate([(x0 + 0.06, z0 + 0.06), (x1 - 0.06, z0 + 0.06), (x0 + 0.06, z1 - 0.06), (x1 - 0.06, z1 - 0.06)]):
        tour(f'bur_pied{i}', [(0.0, 0.0), (0.016, 0.0), (0.02, 0.03), (0.016, 0.05), (0.022, 0.4), (0.028, h - 0.2), (0.032, h - 0.17), (0.0, h - 0.16)],
             mat, centre=(x, 0, z), n=14, groupe=groupe)
    solide(x0, z0, x1, z1)


def coffre(x0=4.0, x1=5.3, z0=2.95, z1=3.85, h=0.5, mat='noyer', groupe='meubles'):
    """Coffre de marine : planches, couvercle débordant, ferrures, poignées de corde."""
    pave('coffre_caisse', x0, 0.04, z0, x1, h - 0.06, z1, mat, groupe=groupe, chanfrein=0.006, segments=2, fil='x')
    for k in range(1, 4):
        y = 0.04 + k * (h - 0.1) / 4
        for (za, zb) in ((z0 - 0.002, z0 + 0.003), (z1 - 0.003, z1 + 0.002)):
            pave(f'coffre_joint{k}{za}', x0 + 0.01, y - 0.002, za, x1 - 0.01, y + 0.002, zb, 'suie', groupe='fonte', chanfrein=0)
    pave('coffre_couvercle', x0 - 0.025, h - 0.06, z0 - 0.025, x1 + 0.025, h, z1 + 0.025, mat, groupe=groupe, chanfrein=0.012, segments=3, fil='x')
    for x in (x0 + 0.16, x1 - 0.16):
        for (za, zb) in ((z0 - 0.012, z0 + 0.002), (z1 - 0.002, z1 + 0.012)):
            pave(f'coffre_fer{x}{za}', x - 0.03, 0.04, za, x + 0.03, h - 0.06, zb, 'fonte', groupe='fonte', chanfrein=0.003)
        pave(f'coffre_ferh{x}', x - 0.03, h, z0 - 0.03, x + 0.03, h + 0.006, z1 + 0.03, 'fonte', groupe='fonte', chanfrein=0.002)
        for z in (z0 - 0.012, z1 + 0.012):
            for yy in (0.1, 0.26):
                tour(f'coffre_clou{x}{z}{yy}', [(0.0, 0.0), (0.008, 0.0), (0.006, 0.004), (0.0, 0.006)], 'fonte', centre=(x, yy, z), n=8, groupe='fonte',
                     axe=Matrix.Rotation(-PI / 2 if z < z0 else PI / 2, 3, 'X'))
    for s, x in ((-1, x0), (1, x1)):
        tour(f'coffre_anse{s}', [(0.03, -0.012), (0.036, 0.0), (0.03, 0.012)], 'corde', centre=(x + s * 0.03, h - 0.16, (z0 + z1) / 2), n=14, groupe='corde',
             axe=Matrix.Rotation(PI / 2, 3, 'Z'), ferme_haut=False, ferme_bas=False)
    pave('coffre_serrure', x0 - 0.016, h - 0.16, (z0 + z1) / 2 - 0.05, x0, h - 0.06, (z0 + z1) / 2 + 0.05, 'laiton', groupe='laiton', chanfrein=0.004)
    for (x, z) in ((x0 + 0.05, z0 + 0.05), (x1 - 0.05, z0 + 0.05), (x0 + 0.05, z1 - 0.05), (x1 - 0.05, z1 - 0.05)):
        tour(f'coffre_patin{x}{z}', [(0.0, 0.0), (0.035, 0.0), (0.04, 0.02), (0.035, 0.04), (0.0, 0.04)], mat, centre=(x, 0, z), n=12, groupe=groupe)
    solide(x0 - 0.03, z0 - 0.03, x1 + 0.03, z1 + 0.03)


# ---------------------------------------------------------------- chaises
def chaise(nom, x, z, ry, mat='noyer', groupe='meubles'):
    """Chaise Louis-Philippe : pieds avant tournés, pieds arrière en sabre, dossier à bandeau cintré,
    assise rembourrée de velours."""
    R = Matrix.Rotation(ry, 3, 'Y')
    def p(dx, y, dz):
        v = R @ Vector((dx, y, dz))
        return (x + v.x, v.y, z + v.z)
    for s in (-1, 1):
        tour(f'{nom}_pav{s}', [(0.0, 0.0), (0.016, 0.0), (0.019, 0.02), (0.015, 0.05), (0.018, 0.2), (0.022, 0.3), (0.02, 0.36), (0.024, 0.4), (0.0, 0.42)],
             mat, centre=p(s * 0.19, 0, 0.18), n=12, groupe=groupe)
        # pied arrière en sabre, qui devient montant du dossier
        pts = [p(s * 0.185, y, dz) for (y, dz) in [(0.0, -0.26), (0.15, -0.22), (0.42, -0.19), (0.6, -0.21), (0.8, -0.24), (0.9, -0.255)]]
        n = [tuple(R @ Vector((1, 0, 0)))] * (len(pts) - 1)
        balayer(f'{nom}_par{s}', pts, n, tuple(R @ Vector((0, 0, 1))), [(-0.014, -0.016), (0.014, -0.016), (0.016, 0.0), (0.014, 0.016), (-0.014, 0.016), (-0.016, 0.0)],
                mat, groupe=groupe, lisse=50)
    # ceinture de l'assise
    import bmesh
    from geo import uv_boite
    def boite_tournee(nm, cx, cy, cz, sx, sy, sz, m, chanfrein=0.004, seg=1):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            loc = Vector((cx + v.co.x * sx, cy + v.co.z * sy, cz + v.co.y * sz))
            w = R @ loc
            v.co = V(x + w.x, w.y, z + w.z)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=chanfrein, segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
        uv_boite(bm)
        objet(nm, bm, [m], groupe=groupe if m == mat else m, uv=False, lisse=40 if seg > 1 else None)
    boite_tournee(f'{nom}_ceint', 0, 0.39, -0.03, 0.44, 0.06, 0.44, mat)
    boite_tournee(f'{nom}_galette', 0, 0.445, -0.025, 0.42, 0.06, 0.42, 'velours_rouge', chanfrein=0.025, seg=3)
    # dossier : bandeau cintré et traverse
    for (y, hh, ep) in ((0.86, 0.09, 0.022), (0.66, 0.04, 0.018)):
        pts = [p(0.17 * math.sin(t), y, -0.245 - 0.02 * math.cos(t) - (0.86 - y) * 0.06) for t in [(-1 + 2 * k / 8) * PI / 2.2 for k in range(9)]]
        n = []
        for i in range(len(pts) - 1):
            d = Vector(pts[i + 1]) - Vector(pts[i])
            nv = Vector((-d.z, 0, d.x)).normalized()
            n.append(tuple(nv))
        balayer(f'{nom}_dos{y}', pts, n, (0, 1, 0), [(-ep / 2, -hh / 2), (ep / 2, -hh / 2), (ep / 2, hh / 2), (-ep / 2, hh / 2), (-ep / 2, -hh / 2)], mat, groupe=groupe, lisse=40)
    solide(x - 0.27, z - 0.27, x + 0.27, z + 0.27)


# ---------------------------------------------------------------- globe terrestre
def globe(x=-5.05, z=-3.35, groupe='meubles'):
    c = 'noyer'
    for k in range(3):
        a = k / 3 * TAU + PI / 6
        ca, sa = math.cos(a), math.sin(a)
        pts = [(x + ca * r, y, z + sa * r) for (r, y) in [(0.34, 0.0), (0.29, 0.2), (0.24, 0.42), (0.27, 0.62), (0.31, 0.78)]]
        cercle = [(0.022 * math.cos(t / 8 * TAU), 0.022 * math.sin(t / 8 * TAU)) for t in range(9)]
        balayer(f'globe_pied{k}', pts, [(-sa, 0, ca)] * 4, (0, 1, 0), cercle, c, groupe=groupe, lisse=60)
    tour('globe_moyeu', [(0.0, 0.2), (0.05, 0.2), (0.06, 0.24), (0.04, 0.3), (0.0, 0.32)], c, centre=(x, 0, z), n=14, groupe=groupe)
    # cercle d'horizon (bois) et méridien (laiton)
    tour('globe_horizon', [(0.30, 0.78), (0.36, 0.78), (0.365, 0.79), (0.36, 0.805), (0.30, 0.805), (0.30, 0.78)], c, centre=(x, 0, z), n=64, groupe=groupe,
         ferme_haut=False, ferme_bas=False)
    rot = Matrix.Rotation(0.41, 3, 'Z')
    tour('globe_meridien', [(0.3, -0.012), (0.315, -0.01), (0.315, 0.01), (0.3, 0.012), (0.3, -0.012)], 'laiton', centre=(x, 0.92, z), n=64, groupe='laiton',
         axe=rot @ Matrix.Rotation(PI / 2, 3, 'X'), ferme_haut=False, ferme_bas=False)
    # la sphère, avec des coordonnées de carte (la mappemonde dessinée par le jeu, projection équirectangulaire)
    import bmesh
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    n, m = 48, 24
    R = 0.28
    anneaux = []
    for j in range(m + 1):
        th = PI * j / m
        anneaux.append([bm.verts.new(V(*(Vector((x, 0.92, z)) + rot @ Vector((R * math.sin(th) * math.cos(TAU * k / n), -R * math.cos(th), R * math.sin(th) * math.sin(TAU * k / n)))))) for k in range(n + 1)])
    for j in range(m):
        for k in range(n):
            f = bm.faces.new([anneaux[j][k], anneaux[j][k + 1], anneaux[j + 1][k + 1], anneaux[j + 1][k]])
            for l, (a, b2) in zip(f.loops, [(k, j), (k + 1, j), (k + 1, j + 1), (k, j + 1)]):
                l[uv].uv = (1 - a / n, b2 / m)
    bmesh.ops.remove_doubles(bm, verts=[v for r in (anneaux[0], anneaux[-1]) for v in r], dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    objet('globe_sphere', bm, ['globe'], groupe='globe', uv=False, lisse=80)
    solide(x - 0.37, z - 0.37, x + 0.37, z + 0.37)


def construire():
    hb = bibliotheque('bib_g', -5.85, -1.0)
    bibliotheque('bib_d', 3.65, 5.85)
    vitrine()
    etabli()
    for i, (x, z) in enumerate([(-0.95, 1.15), (0.25, 1.15), (-0.5, -1.15), (0.8, -1.15)]):
        tabouret(f'tabouret{i}', x, z)
    gueridon()
    medaillier()
    bureau()
    coffre()
    chaise('chaise_bureau', 1.5, 3.22, 0)
    globe()
    # les murs et la cheminée bloquent aussi le passage
    solide(-6.4, -4.9, 6.4, -4.5); solide(-6.4, 4.5, 6.4, 4.9); solide(-6.4, -4.9, -6.0, 4.9)
    solide(6.0, -4.9, 6.3, -1.1); solide(6.0, 1.1, 6.3, 4.9)
    solide(-6.0, -1.2, -5.28, 1.2)
