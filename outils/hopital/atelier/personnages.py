# Les médecins de l'exercice, en volume : les mêmes traits que leurs portraits dessinés (PEOPLE dans
# l'exercice d'origine) — teint, coiffure, lunettes, barbe, couleur de la tenue, accessoire du métier.
# Style volontairement simple et rond (« comme les Sims »), modelé par le code : pièces tournées,
# tubes balayés, surfaces lissées.
import math
from mathutils import Matrix, Vector
import bmesh
import geo, matieres
from geo import V, objet, tour, balayer, PI, TAU

# code : (salle, étape de l'exercice)
SERVICES = {
    'AC': ('hall', 'accueil'), 'DL': ('consult', 'etape-1'), 'DB': ('cyto', 'etape-2'), 'DR': ('endo', 'etape-3'),
    'DN': ('gene', 'etape-4'), 'DP': ('imagerie', 'etape-5'), 'DM': ('repro', 'etape-6'), 'CS': ('bloc', 'compte-rendu'),
}
PEOPLE = {
    'AC': dict(skin=(214, 160, 120), hair='bob', hc=(90, 52, 30), shirt=(11, 107, 119), coat=None, pant=(40, 46, 60), acc=None),
    'CS': dict(skin=(232, 179, 142), hair='cap', hc=(79, 143, 134), shirt=(79, 143, 134), coat=(127, 191, 178), pant=(79, 143, 134), acc='mask', bc=(90, 58, 36)),
    'DL': dict(skin=(241, 195, 159), hair='bun', hc=(107, 63, 36), shirt=(122, 167, 217), acc='stetho'),
    'DB': dict(skin=(185, 122, 80), hair='short', hc=(29, 26, 25), shirt=(93, 74, 134), acc=None, glasses=True, beard=True),
    'DR': dict(skin=(240, 199, 168), hair='receding', hc=(201, 201, 201), shirt=(180, 54, 26), acc='tubes', moustache=True),
    'DN': dict(skin=(242, 210, 169), hair='long', hc=(22, 17, 15), shirt=(22, 121, 74), acc=None),
    'DP': dict(skin=(245, 208, 181), hair='short', hc=(181, 86, 42), shirt=(36, 87, 197), acc=None),
    'DM': dict(skin=(141, 90, 59), hair='curly', hc=(42, 26, 18), shirt=(200, 50, 111), acc='clipboard', glasses=True),
}


def mat(nom, couleur, rug=0.6, metal=0.0, sheen=False):
    m = matieres.unie(nom, matieres.lin(couleur), rugosite=rug, metal=metal)
    if sheen:
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Sheen Weight'].default_value = 0.6
    return nom


class Corps:
    """Accumule les pièces d'un personnage en coordonnées locales (y vers le haut, la face vers +z),
    puis pose l'ensemble (rotation autour de la verticale, translation)."""
    def __init__(self, nom):
        self.nom = nom
        self.obs = []

    def ajoute(self, ob):
        self.obs.append(ob)
        return ob

    def tour(self, nom, profil, m, centre=(0, 0, 0), n=24, axe=None, **kw):
        return self.ajoute(tour(f'{self.nom}_{nom}', profil, m, centre=centre, n=n, groupe=self.nom, axe=axe, atlas='B', **kw))

    def tube(self, nom, pts, rayon, m, lisse=60):
        if callable(rayon):
            prof = None
        cercle = [(rayon * math.cos(t / 10 * TAU), rayon * math.sin(t / 10 * TAU)) for t in range(11)]
        normales = []
        for i in range(len(pts) - 1):
            d = Vector(pts[i + 1]) - Vector(pts[i])
            a = Vector((0, 0, 1)) if abs(d.normalized().z) < 0.9 else Vector((1, 0, 0))
            normales.append(tuple(d.cross(a).normalized()))
        haut = tuple(Vector(normales[0]).cross(Vector(pts[1]) - Vector(pts[0])).normalized())
        return self.ajoute(balayer(f'{self.nom}_{nom}', pts, normales, haut, cercle, m, groupe=self.nom, lisse=lisse, atlas='B'))

    def ellipsoide(self, nom, c, r, m, n=16):
        """Sphère étirée (rx, ry, rz)."""
        prof = [(0.0, -1.0)] + [(math.sin(t / 12 * PI), -math.cos(t / 12 * PI)) for t in range(1, 12)] + [(0.0, 1.0)]
        S = Matrix.Diagonal((r[0], r[1], r[2]))
        return self.ajoute(tour(f'{self.nom}_{nom}', prof, m, centre=c, n=n, groupe=self.nom, axe=S, lisse=80, atlas='B'))

    def poser(self, x, z, ry):
        M = Matrix.Translation(V(x, 0, z)) @ Matrix.Rotation(ry, 4, 'Z')
        for ob in self.obs:
            ob.data.transform(M)
            ob['lumiere'] = 'sonde'
            ob['personnage'] = self.nom


def personnage(code, x, z, ry):
    P = PEOPLE[code]
    C = Corps('medecin_' + code)
    peau = mat(f'peau_{code}', P['skin'], rug=0.55)
    cheveux = mat(f'cheveux_{code}', P['hc'], rug=0.7)
    tenue = mat(f'tenue_{code}', P['shirt'], rug=0.75)
    blouse = mat(f'blouse_{code}', P.get('coat') or (240, 242, 244), rug=0.8) if P.get('coat', 1) is not None else tenue
    pantalon = mat(f'pantalon_{code}', P.get('pant', (52, 56, 66)), rug=0.8)
    chaussures = mat('chaussures', (30, 30, 32), rug=0.45)
    noir = mat('yeux', (18, 16, 15), rug=0.2)
    # jambes et chaussures
    for s in (-1, 1):
        C.tour(f'jambe{s}', [(0.0, 0.08), (0.052, 0.08), (0.056, 0.2), (0.058, 0.45), (0.07, 0.62), (0.082, 0.8), (0.0, 0.84)], pantalon,
               centre=(s * 0.095, 0, 0), n=16, lisse=60)
        C.ellipsoide(f'chaussure{s}', (s * 0.095, 0.045, 0.04), (0.06, 0.05, 0.13), chaussures)
    # buste : chemise, puis blouse ouverte (ou tunique) évasée vers le bas
    torse = Matrix.Diagonal((1.0, 1.0, 0.62))
    C.tour('torse', [(0.0, 0.8), (0.17, 0.82), (0.18, 1.0), (0.2, 1.2), (0.215, 1.34), (0.19, 1.42), (0.11, 1.46), (0.055, 1.48), (0.0, 1.48)],
           tenue, n=28, axe=torse, lisse=60)
    if P.get('coat', 1) is not None:
        # la blouse : un peu plus large que le buste, descend aux genoux, ouverte devant (on la coupe en deux pans)
        for s in (-1, 1):
            prof = [(0.27, 0.48), (0.245, 0.7), (0.215, 0.95), (0.222, 1.2), (0.235, 1.34), (0.205, 1.43), (0.12, 1.475), (0.06, 1.49)]
            ob = C.tour(f'blouse{s}', prof, blouse, n=32, axe=Matrix.Diagonal((1.0, 1.0, 0.66)), ferme_haut=False, ferme_bas=False, lisse=60)
            me = ob.data
            bm = bmesh.new(); bm.from_mesh(me)
            # on garde le côté s (x de même signe), et on ouvre le devant (z > 0 près de l'axe)
            supp = [f for f in bm.faces if (f.calc_center_median().x * s < -0.01) or (f.calc_center_median().x * s < 0.045 and -f.calc_center_median().y > 0.05)]
            bmesh.ops.delete(bm, geom=supp, context='FACES')
            bm.to_mesh(me); bm.free()
            for p in me.polygons:
                p.use_smooth = True
        # poches et col
        for s in (-1, 1):
            geo.pave(f'medecin_{code}_poche{s}', s * 0.08 - 0.06, 0.66, 0.155, s * 0.08 + 0.06, 0.8, 0.165, blouse, groupe='medecin_' + code, chanfrein=0.004, atlas='B')
            C.obs.append(geo.bpy.data.objects[f'medecin_{code}_poche{s}'])
    # bras (manches de blouse) et mains
    for s in (-1, 1):
        epaule = (s * 0.215, 1.38, 0.0)
        coude = (s * 0.25, 1.1, 0.02)
        poignet = (s * 0.26, 0.86, 0.06) if not (P.get('acc') == 'clipboard' and s < 0) else (s * 0.2, 1.0, 0.2)
        C.tube(f'bras{s}', [epaule, coude, poignet], 0.055, blouse)
        C.ellipsoide(f'main{s}', (poignet[0], poignet[1] - 0.06, poignet[2] + 0.01), (0.04, 0.07, 0.03), peau)
    # cou et tête
    C.tour('cou', [(0.05, 1.42), (0.048, 1.56), (0.0, 1.56)], peau, n=14)
    tete = (0.0, 1.66, 0.0)
    C.ellipsoide('tete', tete, (0.095, 0.12, 0.105), peau, n=24)
    C.ellipsoide('nez', (0.0, 1.655, 0.1), (0.018, 0.026, 0.022), peau, n=10)
    for s in (-1, 1):
        C.ellipsoide(f'oreille{s}', (s * 0.095, 1.665, -0.005), (0.015, 0.03, 0.022), peau, n=10)
        C.ellipsoide(f'oeil{s}', (s * 0.036, 1.69, 0.088), (0.012, 0.014, 0.008), noir, n=10)
        C.ellipsoide(f'sourcil{s}', (s * 0.038, 1.722, 0.09), (0.022, 0.005, 0.008), cheveux, n=8)
    bouche = mat('bouche', (160, 80, 70), rug=0.5)
    C.ellipsoide('bouche', (0.0, 1.605, 0.092), (0.025, 0.006, 0.01), bouche, n=10)
    # cheveux
    h = P['hair']
    if h in ('short', 'bun', 'long', 'bob', 'receding'):
        haut = 1.74 if h != 'receding' else 1.77
        C.ellipsoide('calotte', (0.0, 1.70, -0.012), (0.102, 0.128 if h != 'receding' else 0.11, 0.11), cheveux, n=24)
        # on dégage le visage : on retire les faces de la calotte devant et en bas
        ob = C.obs[-1]; me = ob.data
        bm = bmesh.new(); bm.from_mesh(me)
        supp = [f for f in bm.faces if (f.calc_center_median().z < haut - 0.06 and -f.calc_center_median().y > 0.02) or f.calc_center_median().z < 1.6]
        bmesh.ops.delete(bm, geom=supp, context='FACES'); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = True
    if h == 'bun':
        C.ellipsoide('chignon', (0.0, 1.76, -0.11), (0.055, 0.05, 0.05), cheveux)
    if h == 'long':
        C.ellipsoide('cheveux_dos', (0.0, 1.55, -0.07), (0.1, 0.17, 0.06), cheveux)
    if h == 'bob':
        C.ellipsoide('cheveux_dos', (0.0, 1.63, -0.05), (0.11, 0.1, 0.08), cheveux)
    if h == 'curly':
        for k in range(16):
            a = k / 16 * TAU
            C.ellipsoide(f'boucle{k}', (0.09 * math.sin(a), 1.73 + 0.03 * math.cos(2 * a), -0.03 + 0.09 * math.cos(a) * (0.6 if math.cos(a) > 0 else 1)),
                         (0.045, 0.045, 0.045), cheveux, n=10)
        C.ellipsoide('boucles_haut', (0.0, 1.77, -0.02), (0.09, 0.05, 0.09), cheveux)
    if h == 'cap':
        C.ellipsoide('charlotte', (0.0, 1.725, -0.01), (0.108, 0.075, 0.115), cheveux, n=24)
    if P.get('beard'):
        barbe = mat(f'barbe_{code}', P['hc'], rug=0.8)
        C.ellipsoide('barbe', (0.0, 1.6, 0.06), (0.085, 0.06, 0.06), barbe)
    if P.get('moustache'):
        C.ellipsoide('moustache', (0.0, 1.625, 0.098), (0.035, 0.008, 0.012), mat('moustache', P['hc']), n=10)
    if P.get('glasses'):
        monture = mat('monture', (30, 28, 26), rug=0.3)
        for s in (-1, 1):
            C.tour(f'verre{s}', [(0.022, -0.003), (0.026, 0.0), (0.022, 0.003)], monture, centre=(s * 0.037, 1.69, 0.103), n=16,
                   axe=Matrix.Rotation(PI / 2, 3, 'X'), ferme_haut=False, ferme_bas=False)
        C.tube('pont', [(-0.012, 1.692, 0.105), (0.012, 1.692, 0.105)], 0.003, monture)
    if P.get('acc') == 'mask':
        C.ellipsoide('masque', (0.0, 1.58, 0.07), (0.075, 0.04, 0.04), mat('masque', (176, 214, 226), rug=0.9))
    if P.get('acc') == 'stetho':
        st = mat('stetho', (40, 40, 44), rug=0.4)
        C.tube('stetho', [(-0.07, 1.47, 0.07), (-0.08, 1.3, 0.13), (0.0, 1.22, 0.15), (0.08, 1.3, 0.13), (0.07, 1.47, 0.07)], 0.007, st)
        C.ellipsoide('stetho_disque', (0.0, 1.2, 0.155), (0.02, 0.02, 0.008), mat('inox_p', (200, 202, 204), rug=0.2, metal=1.0), n=12)
    if P.get('acc') == 'clipboard':
        geo.pave(f'medecin_{code}_porte_bloc', -0.32, 0.95, 0.15, -0.1, 0.98, 0.45, mat('bloc_bois', (150, 112, 70)), groupe='medecin_' + code, chanfrein=0.003, atlas='B')
        C.obs.append(geo.bpy.data.objects[f'medecin_{code}_porte_bloc'])
    if P.get('acc') == 'tubes':
        for k in range(3):
            C.tour(f'tube{k}', [(0.0, 0.0), (0.008, 0.0), (0.008, 0.09), (0.0, 0.09)], mat('tube_sang', (150, 24, 30), rug=0.2),
                   centre=(0.13 + k * 0.02, 1.2, 0.16), n=8)
    C.poser(x, z, ry)
