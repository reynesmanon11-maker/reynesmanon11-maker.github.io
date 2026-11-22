# Garnit les rayons des bibliothèques : des livres tous différents (hauteur, épaisseur, profondeur,
# reliure), rangés comme dans une vraie bibliothèque : séries de volumes, livres penchés, piles
# couchées, vides. Un seul objet, une seule matière (la planche de reliures).
import math, random, json, os
import bmesh
from mathutils import Matrix, Vector
from geo import V, objet
import matieres

rng = random.Random(1840)
ATLAS = None


def charger(dossier):
    global ATLAS
    ATLAS = json.load(open(os.path.join(dossier, 'livres.json')))
    m = matieres.bpy.data.materials.get('livres')
    if m is None:
        matieres.TEX['livres'] = {'couleur': os.path.join(dossier, 'livres_couleur.png'), 'relief': os.path.join(dossier, 'livres_relief.png'),
                                  'arm': os.path.join(dossier, 'livres_arm.png')}
        matieres.texturee('livres', 'livres', 1.0, relief=1.0)


def rect_uv(cel):
    x0, y0, x1, y1 = cel
    return x0, 1 - y1, x1, 1 - y0          # rangée d'image → coordonnées de texture


class Livres:
    def __init__(self):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('UVMap')

    def face(self, pts, uvs):
        try:
            f = self.bm.faces.new([self.bm.verts.new(V(*p)) for p in pts])
        except ValueError:
            return
        for l, u in zip(f.loops, uvs):
            l[self.uv].uv = u

    def boite(self, M, x0, y0, z0, x1, y1, z1, cel, ignorer=()):
        u0, v0, u1, v1 = rect_uv(cel)
        c = [M @ Vector(p) for p in [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]]
        faces = {'arriere': (1, 0, 3, 2), 'avant': (4, 5, 6, 7), 'g': (0, 4, 7, 3), 'd': (5, 1, 2, 6), 'bas': (0, 1, 5, 4), 'haut': (7, 6, 2, 3)}
        for nom, f in faces.items():
            if nom in ignorer:
                continue
            self.face([c[i] for i in f], [(u0, v0), (u1, v0), (u1, v1), (u0, v1)])

    def livre(self, M, t, h, d, dos, plat, tranche):
        """Un livre debout, dos vers +z, coin arrière-gauche-bas à l'origine du repère M."""
        e, ov = 0.0025, 0.003
        b = min(0.007, t * 0.14)
        # plats (cartons couverts) et bloc des feuillets
        self.boite(M, 0, 0, -d, e, h, 0, plat)
        self.boite(M, t - e, 0, -d, t, h, 0, plat)
        self.boite(M, e, ov, -d + ov, t - e, h - ov, -0.002, tranche, ignorer=('avant',))
        # dos arrondi : bande courbe de la hauteur du livre
        u0, v0, u1, v1 = rect_uv(dos)
        n = 6
        prof = [(t * k / n, b * math.sin(math.pi * k / n)) for k in range(n + 1)]
        for k in range(n):
            (xa, za), (xb, zb) = prof[k], prof[k + 1]
            pa0, pb0 = M @ Vector((xa, 0, za)), M @ Vector((xb, 0, zb))
            pa1, pb1 = M @ Vector((xa, h, za)), M @ Vector((xb, h, zb))
            ua, ub = u0 + (u1 - u0) * k / n, u0 + (u1 - u0) * (k + 1) / n
            self.face([pa0, pb0, pb1, pa1], [(ua, v0), (ub, v0), (ub, v1), (ua, v1)])
        for y, sens in ((0, -1), (h, 1)):
            pts = [M @ Vector((x, y, z)) for (x, z) in prof]
            if sens < 0:
                pts = pts[::-1]
            pu0, pv0, pu1, pv1 = rect_uv(plat)
            self.face(pts, [(pu0 + (pu1 - pu0) * i / len(pts), pv0) for i in range(len(pts))])

    def fin(self):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-6)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        return objet('livres', self.bm, ['livres'], groupe='livres', uv=False, lisse=None, atlas='B', densite=0.9)


def garnir(etageres):
    L = Livres()
    n_livres = 0
    for (a, b, y, zF, zA, libre) in etageres:
        x = a + rng.uniform(0.0, 0.03)
        prof_max = zA - zF - 0.01
        dernier_h = None
        while x < b - 0.03:
            r = rng.random()
            if r < 0.07 and b - x > 0.3 and libre > 0.12:
                # pile de livres couchés (le dos vers la pièce)
                lg = rng.uniform(0.17, 0.26)
                yy = y
                for k in range(rng.randint(2, 5)):
                    th = rng.uniform(0.022, 0.05)
                    if yy + th > y + libre - 0.01:
                        break
                    hh = lg * rng.uniform(0.88, 1.0)
                    d = min(prof_max, hh * rng.uniform(0.62, 0.78))
                    # livre couché : sa hauteur suit x, son épaisseur suit y (rotation de −90° autour de z)
                    M = Matrix.Translation((x + (lg - hh) / 2 + rng.uniform(-0.01, 0.01), yy + th, zA - rng.uniform(0.0, 0.012))) @ Matrix.Rotation(-math.pi / 2, 4, 'Z')
                    L.livre(M, th, hh, d, *choix())
                    yy += th
                    n_livres += 1
                x += lg + rng.uniform(0.01, 0.04)
                dernier_h = None
                continue
            if r < 0.12:
                x += rng.uniform(0.03, 0.12)       # un vide (un livre sorti)
                dernier_h = None
                continue
            # une série de volumes, de même hauteur et de même reliure, épaisseurs voisines
            h_max = min(libre - 0.012, 0.42)
            h = rng.uniform(0.17, h_max) if rng.random() < 0.7 else rng.uniform(max(0.17, h_max - 0.08), h_max)
            t0 = rng.uniform(0.02, 0.065)
            serie = choix()
            for k in range(rng.randint(1, 9)):
                t = t0 * rng.uniform(0.85, 1.15)
                if x + t > b:
                    break
                d = min(prof_max, h * rng.uniform(0.66, 0.8))
                dos = serie if rng.random() < 0.85 else choix()
                M = Matrix.Translation((x, y, zA - rng.uniform(0.0, 0.018)))
                L.livre(M, t, h * rng.uniform(0.985, 1.0), d, *dos)
                x += t + rng.uniform(0.0003, 0.002)
                n_livres += 1
                dernier_h = h
            # parfois, un livre penché contre la série (au bout du rayon ou devant un vide)
            if dernier_h and rng.random() < 0.18:
                th = rng.uniform(0.08, 0.3)
                t, h = rng.uniform(0.025, 0.05), min(dernier_h * rng.uniform(0.85, 1.05), libre / math.cos(th) - 0.02)
                place = h * math.sin(th) + t * math.cos(th)
                if x + place < b:
                    d = min(prof_max, h * 0.72)
                    M = Matrix.Translation((x + h * math.sin(th), y, zA - rng.uniform(0.005, 0.02))) @ Matrix.Rotation(th, 4, 'Z')
                    L.livre(M, t, h, d, *choix())
                    x += place + rng.uniform(0.02, 0.08)
                    n_livres += 1
                    dernier_h = None
    ob = L.fin()
    print('LIVRES', n_livres, 'livres,', len(ob.data.polygons), 'faces')
    return ob


def choix():
    return (rng.choice(ATLAS['dos']), rng.choice(ATLAS['plats']), rng.choice(ATLAS['tranches'][:6] if rng.random() < 0.85 else ATLAS['tranches']))
