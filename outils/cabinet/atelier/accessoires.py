# Les objets de collection et de décor : vrais modèles numérisés ou modelés par des artistes,
# sous licence CC0 (Poly Haven, Smithsonian Institution), placés dans la pièce. Plus quelques
# objets modelés ici (plateau de roches, livre ouvert, terrarium, carte géologique encadrée).
import bpy, math, os
from mathutils import Matrix, Vector
import geo, matieres
from geo import V, P, pave, tour, balayer, objet, PI, TAU
import mobilier

S = os.environ.get('ATELIER', os.path.expanduser('~/atelier-cabinet'))   # téléchargements et fichiers de travail (hors dépôt)
PH = S + '/ph/mod'
SI = S + '/modeles/si2'
CREDITS = []
FLAMMES = []
# triangles au plus, par objet (sinon 6000) : un objet vu à deux mètres n'en demande pas davantage
PLAFONDS = {'lustre': 16000, 'tableau_est': 12000, 'microscope_bureau': 10000, 'buste': 10000, 'horloge': 9000, 'fauteuil': 6000, 'pendule': 8000}


def importer(chemin, garder=None, exclure=None, tri=None):
    avant = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=chemin)
    nouv = [o for o in bpy.data.objects if o not in avant]
    meshes = [o for o in nouv if o.type == 'MESH' and (garder is None or any(g in o.name for g in garder))
              and not (exclure and any(e in o.name for e in exclure))]
    for o in meshes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.data = o.data.copy()
        o.data.transform(mw)
        o.matrix_world = Matrix.Identity(4)
    for o in nouv:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        geo.COLLECTION.objects.link(o)
    ob = meshes[0]
    if len(meshes) > 1:
        with bpy.context.temp_override(active_object=ob, object=ob, selected_objects=meshes, selected_editable_objects=meshes):
            bpy.ops.object.join()
    n = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if tri and n > tri * 1.2:
        mod = ob.modifiers.new('decimer', 'DECIMATE')
        mod.ratio = tri / n
        mod.use_collapse_triangulate = True
        with bpy.context.temp_override(object=ob, active_object=ob):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    return ob


def boite_englobante(me):
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    return Vector((min(xs), min(ys), min(zs))), Vector((max(xs), max(ys), max(zs)))


def placer(ob, x, y, z, ry=0.0, taille=None, echelle=None, rx=0.0, rz=0.0, ancre='bas'):
    """Pose l'objet : (x, y, z) dans la page = centre du dessous (ancre 'bas') ou centre (ancre 'centre').
    ry tourne autour de la verticale (0 : la face du modèle regarde le sud, +z). taille = plus grande dimension visée."""
    me = ob.data
    mn, mx = boite_englobante(me)
    s = echelle if echelle else (taille / max(mx - mn) if taille else 1.0)
    c = (mn + mx) / 2
    me.transform(Matrix.Translation(-c))
    me.transform(Matrix.Rotation(ry, 4, 'Z') @ Matrix.Rotation(rz, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X') @ Matrix.Scale(s, 4))
    mn, mx = boite_englobante(me)
    c = (mn + mx) / 2
    cible = V(x, y, z)
    dz = cible.z - (mn.z if ancre == 'bas' else c.z)
    me.transform(Matrix.Translation((cible.x - c.x, cible.y - c.y, dz)))
    return ob


def ajouter(source, nom, x, y, z, ry=0.0, taille=None, echelle=None, garder=None, exclure=None, tri=None, rx=0.0, rz=0.0, ancre='bas',
            couleur=None, densite=0.6, credit=None):
    chemin = source if source.endswith(('.glb', '.gltf')) else (f'{PH}/{source}/{source}.gltf' if os.path.exists(f'{PH}/{source}/{source}.gltf') else f'{SI}/{source}.glb')
    plafond = PLAFONDS.get(nom, 4000 if (taille or 1) < 0.15 else 6000)
    if chemin.startswith(SI):
        plafond = min(tri or 7000, 7000)
    elif tri:
        plafond = min(tri, plafond)
    ob = importer(chemin, garder=garder, exclure=exclure, tri=plafond)
    placer(ob, x, y, z, ry=ry, taille=taille, echelle=echelle, rx=rx, rz=rz, ancre=ancre)
    ob.name = nom
    ob['groupe'] = nom
    ob['atlas'] = 'B'
    ob['densite'] = densite
    # les petits objets ne reçoivent pas de lumière cuite : la page les éclaire par une sonde
    mn, mx = boite_englobante(ob.data)
    if max(mx - mn) < 0.6 and nom not in ('tableau_ouest',):
        ob['lumiere'] = 'sonde'
    if couleur:      # scans sans couleur (os nettoyés) : une teinte d'os
        for sl in ob.material_slots:
            m = sl.material
            if m and m.use_nodes:
                b = m.node_tree.nodes.get('Principled BSDF')
                if b and not b.inputs['Base Color'].links:
                    b.inputs['Base Color'].default_value = (*couleur, 1)
    CREDITS.append({'objet': nom, 'source': os.path.basename(chemin), **(credit or {})})
    return ob


PH_C = lambda titre, auteurs, page: {'titre': titre, 'auteurs': auteurs, 'licence': 'CC0', 'site': 'Poly Haven', 'lien': 'https://polyhaven.com/a/' + page}
SI_C = lambda titre, numero: {'titre': titre, 'auteurs': 'Smithsonian Institution, National Museum of Natural History (' + numero + ')',
                              'licence': 'CC0', 'site': 'Smithsonian Open Access', 'lien': 'https://www.si.edu/openaccess'}
OS = matieres.lin((222, 212, 188))


def faits_main():
    """Objets modelés ici : plateau de roches, livre ouvert, terrarium, carte géologique, papiers, encrier."""
    # plateau de collection à compartiments (sur l'établi)
    x0, x1, z0, z1, y = 0.25, 0.75, 0.05, 0.4, 0.92
    pave('plateau_fond', x0, y, z0, x1, y + 0.012, z1, 'noyer', groupe='plateau_roches', atlas='B', chanfrein=0.002)
    for (a, b, c, d) in ((x0, x0 + 0.012, z0, z1), (x1 - 0.012, x1, z0, z1)):
        pave(f'plateau_b{a}', a, y, c, b, y + 0.05, d, 'noyer', groupe='plateau_roches', atlas='B', chanfrein=0.003)
    for (c, d) in ((z0, z0 + 0.012), (z1 - 0.012, z1)):
        pave(f'plateau_c{c}', x0 + 0.012, y, c, x1 - 0.012, y + 0.05, d, 'noyer', groupe='plateau_roches', atlas='B', chanfrein=0.003)
    for k in range(1, 3):
        x = x0 + (x1 - x0) * k / 3
        pave(f'plateau_sep{k}', x - 0.004, y + 0.012, z0 + 0.012, x + 0.004, y + 0.038, z1 - 0.012, 'noyer', groupe='plateau_roches', atlas='B', chanfrein=0.001)
    pave('plateau_sepz', x0 + 0.012, y + 0.012, (z0 + z1) / 2 - 0.004, x1 - 0.012, y + 0.038, (z0 + z1) / 2 + 0.004, 'noyer', groupe='plateau_roches', atlas='B', chanfrein=0.001)
    # livre ouvert : deux blocs de pages bombés, couverture de cuir
    import bmesh
    bx, bz, L, Lz = -1.1, 0.25, 0.46, 0.32
    pave('livre_couv', bx - L / 2 - 0.01, 0.92, bz - Lz / 2 - 0.008, bx + L / 2 + 0.01, 0.926, bz + Lz / 2 + 0.008, 'cuir', groupe='livre_ouvert', atlas='B', chanfrein=0.002)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    nx, nz = 32, 4
    rangs = []
    for i in range(nx + 1):
        u = i / nx
        x = bx - L / 2 + L * u
        t = abs(u - 0.5) * 2
        yh = 0.926 + 0.022 * math.sin(math.pi * min(1, t * 1.15)) ** 0.6 * (1 if t > 0.02 else 0.2)
        rangs.append([bm.verts.new(V(x, yh, bz - Lz / 2 + Lz * j / nz)) for j in range(nz + 1)])
    for i in range(nx):
        for j in range(nz):
            f = bm.faces.new([rangs[i][j], rangs[i + 1][j], rangs[i + 1][j + 1], rangs[i][j + 1]])
            for l, (a, b) in zip(f.loops, [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]):
                l[uv].uv = (a / nx, 1 - b / nz)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    objet('livre_pages', bm, ['pages'], groupe='livre_ouvert', uv=False, lisse=60, atlas='B')
    for s in (-1, 1):    # tranches des deux blocs de pages
        pave(f'livre_tranche{s}', bx + s * L / 4 - L / 4 + 0.005, 0.926, bz - Lz / 2 - 0.0, bx + s * L / 4 + L / 4 - 0.005, 0.935, bz - Lz / 2 + 0.002,
             'papier', groupe='livre_ouvert', atlas='B', chanfrein=0)
    # terrarium (cage de verre à montants de laiton) avec sol, mousse et petites plantes
    tx, tz, tl, tp, th = 1.18, -0.36, 0.42, 0.28, 0.3
    y0 = 0.92
    pave('terra_socle', tx - tl / 2 - 0.01, y0, tz - tp / 2 - 0.01, tx + tl / 2 + 0.01, y0 + 0.025, tz + tp / 2 + 0.01, 'noyer', groupe='terrarium', atlas='B', chanfrein=0.004, segments=2)
    pave('terra_terre', tx - tl / 2 + 0.008, y0 + 0.025, tz - tp / 2 + 0.008, tx + tl / 2 - 0.008, y0 + 0.07, tz + tp / 2 - 0.008, 'terreau', groupe='terrarium', atlas='B', chanfrein=0.0)
    for (a, b) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        x, z = tx + a * (tl / 2 - 0.004), tz + b * (tp / 2 - 0.004)
        pave(f'terra_mont{a}{b}', x - 0.006, y0 + 0.025, z - 0.006, x + 0.006, y0 + th, z + 0.006, 'laiton', groupe='laiton', atlas='B', chanfrein=0.002)
    for (xa, za, xb, zb) in ((tx - tl / 2, tz - tp / 2, tx + tl / 2, tz - tp / 2 + 0.012), (tx - tl / 2, tz + tp / 2 - 0.012, tx + tl / 2, tz + tp / 2),
                             (tx - tl / 2, tz - tp / 2, tx - tl / 2 + 0.012, tz + tp / 2), (tx + tl / 2 - 0.012, tz - tp / 2, tx + tl / 2, tz + tp / 2)):
        pave(f'terra_haut{xa}{za}', xa, y0 + th - 0.01, za, xb, y0 + th, zb, 'laiton', groupe='laiton', atlas='B', chanfrein=0.002)
    for (xa, za, xb, zb) in ((tx - tl / 2 + 0.003, tz - tp / 2 + 0.002, tx + tl / 2 - 0.003, tz - tp / 2 + 0.004), (tx - tl / 2 + 0.003, tz + tp / 2 - 0.004, tx + tl / 2 - 0.003, tz + tp / 2 - 0.002),
                             (tx - tl / 2 + 0.002, tz - tp / 2 + 0.003, tx - tl / 2 + 0.004, tz + tp / 2 - 0.003), (tx + tl / 2 - 0.004, tz - tp / 2 + 0.003, tx + tl / 2 - 0.002, tz + tp / 2 - 0.003)):
        pave(f'terra_verre{xa}{za}', xa, y0 + 0.025, za, xb, y0 + th - 0.01, zb, 'verre', groupe='verre', atlas='B', chanfrein=0, cuire=0)
    pave('terra_toit', tx - tl / 2 + 0.006, y0 + th - 0.004, tz - tp / 2 + 0.006, tx + tl / 2 - 0.006, y0 + th - 0.002, tz + tp / 2 - 0.006, 'verre', groupe='verre', chanfrein=0, cuire=0)
    # la mousse : un tapis bosselé
    bm = bmesh.new()
    import random
    r = random.Random(5)
    n1, n2 = 24, 16
    gr = []
    for i in range(n1 + 1):
        gr.append([bm.verts.new(V(tx - tl / 2 + 0.012 + (tl - 0.024) * i / n1, y0 + 0.07 + 0.012 * (math.sin(i * 0.9) * math.cos(j * 1.3) + 1) * 0.5 + r.uniform(0, 0.008),
                                  tz - tp / 2 + 0.012 + (tp - 0.024) * j / n2)) for j in range(n2 + 1)])
    for i in range(n1):
        for j in range(n2):
            bm.faces.new([gr[i][j], gr[i][j + 1], gr[i + 1][j + 1], gr[i + 1][j]])
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    geo.uv_boite(bm)
    objet('terra_mousse', bm, ['mousse'], groupe='terrarium', uv=False, lisse=70, atlas='B')
    # carte géologique encadrée (mur ouest, côté bibliothèque)
    cz, cy = -2.56, 2.25
    W_, H_ = 1.3, 1.02
    pave('carte_toile', -5.985, cy - H_ / 2, cz - W_ / 2, -5.975, cy + H_ / 2, cz + W_ / 2, 'carte', groupe='carte', atlas='B', chanfrein=0)
    pts = [(-5.985, cy - H_ / 2 - 0.05, cz - W_ / 2 - 0.05), (-5.985, cy + H_ / 2 + 0.05, cz - W_ / 2 - 0.05), (-5.985, cy + H_ / 2 + 0.05, cz + W_ / 2 + 0.05), (-5.985, cy - H_ / 2 - 0.05, cz + W_ / 2 + 0.05)]
    prof = [(0.0, 0.0), (0.0, 0.02), (0.012, 0.03), (0.035, 0.032), (0.05, 0.022), (0.06, 0.012), (0.06, 0.0)]
    balayer('carte_cadre', pts, [(0, -1, 0), (0, 0, -1), (0, 1, 0), (0, 0, 1)], (1, 0, 0), [(0.06 - a, h) for (a, h) in prof], 'noyer', ferme=True, groupe='carte', atlas='B')
    # papiers et encrier sur le bureau
    for k, (x, z, a) in enumerate(((1.45, 3.95, 0.15), (1.62, 4.05, -0.2))):
        bm = bmesh.new()
        uv = bm.loops.layers.uv.new('UVMap')
        c, s_ = math.cos(a), math.sin(a)
        pts = [(x + c * dx - s_ * dz, 0.7625 + k * 0.0006, z + s_ * dx + c * dz) for (dx, dz) in ((-0.105, -0.148), (0.105, -0.148), (0.105, 0.148), (-0.105, 0.148))]
        f = bm.faces.new([bm.verts.new(V(*p)) for p in pts])
        if f.normal.z < 0:
            f.normal_flip()
        for l, u in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            l[uv].uv = u
        objet(f'papier{k}', bm, ['papier_ecrit'], groupe='papiers', uv=False, atlas='B')
    tour('encrier', [(0.0, 0.0), (0.035, 0.0), (0.038, 0.004), (0.038, 0.04), (0.02, 0.05), (0.016, 0.06), (0.018, 0.066), (0.0, 0.066)], 'verre_sombre',
         centre=(1.95, 0.762, 4.12), n=20, groupe='encrier', atlas='B')
    tour('plume', [(0.0, 0.0), (0.0025, 0.0), (0.002, 0.24), (0.0, 0.25)], 'papier', centre=(1.95, 0.8, 4.12), n=6, groupe='encrier', atlas='B',
         axe=Matrix.Rotation(0.35, 3, 'Z') @ Matrix.Rotation(0.25, 3, 'X'))


def verrerie():
    """Verrerie de laboratoire sur l'établi : ballons, flacons, cloche de verre sur son socle (verre à double paroi)."""
    def flacon(nom, x, z, prof_ext, epaisseur, liquide=None, h_liq=0.0, y=0.92):
        tour(nom, prof_ext + [(max(0.0, r - epaisseur), h) for (r, h) in reversed(prof_ext)], 'verre', centre=(x, y, z), n=28, groupe='verre',
             ferme_haut=False, ferme_bas=False, cuire=0, atlas='B')
        if liquide:
            pts = [(0.0, 0.003)] + [(max(0.0, r - epaisseur - 0.001), h) for (r, h) in prof_ext if 0.003 < h <= h_liq] + [(0.0, h_liq)]
            tour(nom + '_liq', pts, liquide, centre=(x, y, z), n=24, groupe=liquide, cuire=0, atlas='B')
    ballon = [(0.0, 0.0), (0.03, 0.002), (0.055, 0.02), (0.065, 0.05), (0.058, 0.085), (0.035, 0.11), (0.016, 0.125), (0.015, 0.2), (0.018, 0.205)]
    flacon('ballon', -0.2, -0.45, ballon, 0.0025, 'liquide_vert', 0.06)
    erlen = [(0.0, 0.0), (0.05, 0.0), (0.052, 0.006), (0.04, 0.06), (0.018, 0.11), (0.015, 0.15), (0.017, 0.155)]
    flacon('fiole', -0.32, -0.3, erlen, 0.002, 'liquide_ambre', 0.035)
    bocal = [(0.0, 0.0), (0.045, 0.0), (0.047, 0.008), (0.047, 0.15), (0.04, 0.165), (0.038, 0.18), (0.04, 0.185)]
    flacon('bocal_etabli', 1.38, 0.42, bocal, 0.002, 'liquide', 0.12)
    tour('bocal_etabli_bouchon', [(0.0, 0.18), (0.034, 0.18), (0.036, 0.205), (0.0, 0.205)], 'liege', centre=(1.38, 0.92, 0.42), n=16, groupe='liege', atlas='B')
    # cloche de verre sur socle d'ébène, avec un crabe dessous
    tour('cloche_socle', [(0.0, 0.0), (0.16, 0.0), (0.165, 0.012), (0.155, 0.024), (0.0, 0.026)], 'ebene', centre=(-1.25, 0.92, -0.42), n=36, groupe='ebene', atlas='B')
    cl = [(0.15, 0.0), (0.152, 0.02), (0.15, 0.22), (0.13, 0.28), (0.08, 0.31), (0.0, 0.318)]
    tour('cloche', cl + [(max(0.0, r - 0.003), h - (0.003 if r < 0.01 else 0)) for (r, h) in reversed(cl)], 'verre', centre=(-1.25, 0.946, -0.42), n=36,
         groupe='verre', ferme_haut=False, ferme_bas=False, cuire=0, atlas='B')


def construire():
    # --- matières propres aux objets modelés ici
    matieres.TEX['carte'] = {'couleur': S + '/blender/tex/carte_couleur.jpg', 'relief': None, 'arm': None}
    matieres.texturee('carte', 'carte', 1.0, rugosite=0.75, metal=0.0)
    matieres.TEX['pages'] = {'couleur': S + '/blender/tex/pages_couleur.jpg', 'relief': None, 'arm': None}
    matieres.texturee('pages', 'pages', 1.0, rugosite=0.8, metal=0.0)
    m = matieres.unie('papier_ecrit', matieres.lin((230, 220, 196)), rugosite=0.85)
    matieres.unie('terreau', matieres.lin((52, 38, 28)), rugosite=0.95)
    matieres.unie('mousse', matieres.lin((70, 104, 44)), rugosite=0.9)
    matieres.unie('verre_sombre', matieres.lin((30, 40, 36)), rugosite=0.05, metal=0.0)
    for nom, c in (('liquide_vert', (120, 170, 90)), ('liquide_ambre', (200, 140, 60))):
        m = matieres.unie(nom, matieres.lin(c), rugosite=0.05)
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Transmission Weight'].default_value = 1.0
        b.inputs['Alpha'].default_value = 0.55
        m['verre'] = 1
    faits_main()
    verrerie()
    ajouter('shrub_sorrel_01', 'terra_plantes', 1.18, 0.985, -0.36, taille=0.33, credit=PH_C('Shrub Sorrel 01', 'Poly Haven', 'shrub_sorrel_01'))

    # --- grands objets
    ajouter('Chandelier_03', 'lustre', 0.0, 3.16, 0.0, densite=0.4, credit=PH_C('Chandelier 03', 'Kirill Sannikov (modèle), Poly Haven', 'Chandelier_03'))
    ajouter('vintage_grandfather_clock_01', 'horloge', 5.76, 0.0, -2.85, ry=-PI / 2, credit=PH_C('Vintage Grandfather Clock 01', 'Poly Haven', 'vintage_grandfather_clock_01'))
    mobilier.solide(5.5, -3.2, 6.0, -2.5)
    ajouter('ArmChair_01', 'fauteuil', -4.35, 0.0, 1.55, ry=-2.15, credit=PH_C('Arm Chair 01', 'Kirill Sannikov', 'ArmChair_01'))
    mobilier.solide(-4.8, 1.1, -3.9, 2.0)
    ajouter('fancy_picture_frame_02', 'tableau_est', 5.915, 2.3, 2.85, ry=-PI / 2, ancre='centre', densite=0.8, echelle=1.65,
            credit=PH_C('Fancy Picture Frame 02 (le tableau compris)', 'Poly Haven', 'fancy_picture_frame_02'))
    ajouter('fancy_picture_frame_01', 'tableau_ouest', -5.98, 2.3, 2.85, ry=PI / 2, ancre='centre', densite=0.8, echelle=1.85,
            credit=PH_C('Fancy Picture Frame 01 (le tableau compris)', 'Poly Haven', 'fancy_picture_frame_01'))
    ajouter('marble_bust_01', 'buste', -3.4, 3.125, -4.27, ry=0.25, credit=PH_C('Marble Bust 01', 'Poly Haven', 'marble_bust_01'))
    ajouter('horse_head', 'tete_cheval', 4.75, 3.125, -4.28, ry=-0.3, credit=PH_C('Horse Head', 'Poly Haven', 'horse_head'))
    ajouter('side_table_tall_01', 'sellette', -5.6, 0.0, 3.95, credit=PH_C('Side Table Tall 01', 'Poly Haven', 'side_table_tall_01'))
    mobilier.solide(-5.8, 3.75, -5.4, 4.15)
    ajouter('planter_pot_clay', 'pot_sellette', -5.6, 0.761, 3.95, taille=0.24, credit=PH_C('Planter Pot Clay', 'Poly Haven', 'planter_pot_clay'))
    ajouter('fern_02', 'fougere_sellette', -5.6, 0.92, 3.95, taille=0.62, garder=['fern_02_c'], credit=PH_C('Fern 02', 'Poly Haven', 'fern_02'))

    # --- cheminée : pendule, chandelier de laiton, crâne fossile
    ajouter('mantel_clock_01', 'pendule', -5.77, 1.06, -0.05, ry=PI / 2, credit=PH_C('Mantel Clock 01', 'Poly Haven', 'mantel_clock_01'))
    ajouter('brass_candleholders', 'chandelier_cheminee', -5.75, 1.06, -0.8, ry=PI / 2, garder=['brass_candleholder_02'], credit=PH_C('Brass Candleholders', 'Poly Haven', 'brass_candleholders'))
    ajouter('Diademodon_tetragonus', 'crane_diademodon', -5.76, 1.06, 0.72, ry=PI / 2 + 0.4, taille=0.23, tri=14000,
            credit=SI_C('Diademodon tetragonus (crâne fossile, Trias)', 'USNM V 23352'))

    # --- l'établi : roches dans le plateau, loupe, coquillage, boussole
    for k, (src, x, z, t) in enumerate((('moon_rock_03', 0.33, 0.13, 0.1), ('moon_rock_05', 0.5, 0.14, 0.08), ('moon_rock_06', 0.67, 0.13, 0.09),
                                         ('moon_rock_07', 0.33, 0.31, 0.09), ('rock_09', 0.5, 0.31, 0.11), ('moon_rock_04', 0.67, 0.31, 0.11))):
        ajouter(src, f'roche{k}', x, 0.932, z, ry=k * 1.3, taille=t, tri=2500, densite=0.5, credit=PH_C(src.replace('_', ' ').title(), 'Poly Haven', src))
    ajouter('moon_rock_01', 'roche_etabli', 0.95, 0.92, 0.42, ry=0.7, taille=0.2, tri=6000, credit=PH_C('Moon Rock 01', 'Poly Haven', 'moon_rock_01'))
    ajouter('rock_07', 'roche_etabli2', -0.15, 0.92, 0.5, ry=2.0, taille=0.17, tri=6000, credit=PH_C('Rock 07', 'Poly Haven', 'rock_07'))
    ajouter('magnifying_glass_01', 'loupe', 0.05, 0.92, -0.38, rx=-PI / 2, ry=0.6, credit=PH_C('Magnifying Glass 01', 'Poly Haven', 'magnifying_glass_01'))
    ajouter('Cypraecassis_rufa', 'casque', -0.55, 0.92, 0.48, ry=0.9, taille=0.12, tri=10000, credit=SI_C('Cypraecassis rufa (casque rouge)', 'USNM 1127926'))
    ajouter('seadogs_compass', 'boussole', 1.45, 0.92, 0.42, ry=-0.4, credit=PH_C('Seadogs Compass', 'Poly Haven', 'seadogs_compass'))

    # --- le bureau sous la verrière : microscope, montre, lunettes
    ajouter('vintage_microscope', 'microscope_bureau', 1.08, 0.762, 4.05, ry=PI - 0.5, credit=PH_C('Vintage Microscope', 'Poly Haven', 'vintage_microscope'))
    ajouter('vintage_pocket_watch', 'montre', 1.78, 0.762, 3.9, rx=-PI / 2, ry=0.4, credit=PH_C('Vintage Pocket Watch', 'Poly Haven', 'vintage_pocket_watch'))
    ajouter('round_spectacles', 'lunettes', 1.5, 0.762, 4.2, ry=2.6, credit=PH_C('Round Spectacles', 'Poly Haven', 'round_spectacles'))

    # --- médaillier : coquillages de part et d'autre des glossopètres
    ajouter('Tridacna', 'benitier', -2.5, 0.86, 4.08, ry=PI, taille=0.24, tri=12000, credit=SI_C('Tridacna squamosa (bénitier)', 'USNM 1444'))
    ajouter('lambis_shell', 'lambis', -3.55, 0.86, 4.1, ry=0.5, credit=PH_C('Lambis Shell', 'Poly Haven', 'lambis_shell'))

    # --- vitrine : spécimens de décor autour des quatre curiosités
    ajouter('Diodon_hystrix', 'poisson_porc_epic', 1.4, 0.906, -4.25, ry=0.2, taille=0.2, tri=12000, credit=SI_C('Diodon hystrix (poisson porc-épic)', 'USNM 195928'))
    ajouter('Meandrina_meandrites', 'corail_cerveau', 3.02, 0.906, -4.24, taille=0.2, tri=12000, credit=SI_C('Meandrina meandrites (corail cerveau)', 'USNM 1174917'))
    ajouter('Lactophrys_bicaudalis', 'poisson_coffre', 0.75, 1.45, -4.22, ry=PI / 2, taille=0.2, tri=10000, credit=SI_C('Lactophrys bicaudalis (poisson-coffre)', 'USNM 273167'))
    ajouter('Linckia_laevigata', 'etoile_de_mer', 2.55, 1.45, -4.25, ry=0.4, taille=0.17, tri=8000, credit=SI_C('Linckia laevigata (étoile de mer bleue)', 'USNM E15868'))
    ajouter('Lopholithodes_foraminatus', 'crabe_cloche', -1.25, 0.946, -0.42, ry=0.6, taille=0.2, credit=SI_C('Lopholithodes foraminatus (crabe)', 'USNM 161385'))
    ajouter('Lopholithodes_foraminatus', 'crabe', 1.55, 1.95, -4.25, ry=0.1, taille=0.2, tri=12000, credit=SI_C('Lopholithodes foraminatus (crabe)', 'USNM 161385'))
    ajouter('Thrinaxodon_liorhinus', 'thrinaxodon', 2.45, 1.95, -4.27, ry=0.0, taille=0.24, tri=12000, credit=SI_C('Thrinaxodon liorhinus (fossile, Trias)', 'USNM V 22812'))
    ajouter('Archaeopteryx_siemensii', 'archeopteryx', 1.8, 2.612, -4.36, rx=-0.2, taille=0.55, tri=10000, credit=SI_C("Archaeopteryx siemensii (moulage de l'exemplaire de Berlin)", 'USNM PAL 509743'))

    # --- murs : homard naturalisé sur sa planche, crânes de cerf et de gorille
    ajouter('Panulirus_longipes', 'homard', -0.35, 2.35, -4.4, taille=0.5, tri=14000, ancre='centre', credit=SI_C('Panulirus longipes (langouste, spécimen monté)', 'USNM 105728'))
    ajouter('White-tailed_Deer_PALDEERSKULL', 'crane_cerf', 4.6, 0.9, -4.1, ry=PI / 2 + 0.3, taille=0.26, tri=10000, couleur=OS,
            credit=SI_C('Odocoileus virginianus (crâne de cerf de Virginie)', 'NMNH, éducation'))
    ajouter('Gorilla_gorilla_gorilla_USNM574138_Cranium_', 'crane_gorille', -4.55, 0.9, -4.09, ry=-PI / 2 + 0.3, taille=0.2, tri=12000, couleur=OS,
            credit=SI_C('Gorilla gorilla gorilla (crâne)', 'USNM 574138'))

    # --- appuis des verrières : plantes et roche
    ajouter('potted_plant_04', 'plante_appui1', -4.55, 0.9, 4.53, ry=0.3, taille=0.3, credit=PH_C('Potted Plant 04', 'Poly Haven', 'potted_plant_04'))
    ajouter('planter_pot_clay', 'pot_appui2', 3.1, 0.9, 4.53, taille=0.2, credit=PH_C('Planter Pot Clay', 'Poly Haven', 'planter_pot_clay'))
    ajouter('fern_02', 'fougere_appui2', 3.1, 1.06, 4.5, taille=0.45, garder=['fern_02_b'], credit=PH_C('Fern 02', 'Poly Haven', 'fern_02'))
    ajouter('moon_rock_02', 'roche_appui', -2.0, 0.9, 4.52, ry=1.0, taille=0.2, tri=4000, credit=PH_C('Moon Rock 02', 'Poly Haven', 'moon_rock_02'))
    ajouter('potted_plant_04', 'plante_appui3', -1.75, 0.9, 4.52, ry=2.0, taille=0.32, credit=PH_C('Potted Plant 04', 'Poly Haven', 'potted_plant_04'))
    ajouter('potted_plant_04', 'plante_appui4', 0.35, 0.9, 4.52, ry=4.1, taille=0.27, credit=PH_C('Potted Plant 04', 'Poly Haven', 'potted_plant_04'))
    ajouter('planter_pot_clay', 'pot_appui5', -3.3, 0.9, 4.53, taille=0.19, credit=PH_C('Planter Pot Clay', 'Poly Haven', 'planter_pot_clay'))
    ajouter('fern_02', 'fougere_appui5', -3.3, 1.05, 4.5, taille=0.42, garder=['fern_02_d'], credit=PH_C('Fern 02', 'Poly Haven', 'fern_02'))
    ajouter('carved_wooden_elephant', 'elephant', 5.1, 0.9, -4.09, ry=-0.5, taille=0.13, credit=PH_C('Carved Wooden Elephant', 'Poly Haven', 'carved_wooden_elephant'))
    ajouter('antique_ceramic_vase_01', 'vase', 5.55, 0.0, 4.15, taille=0.5, credit=PH_C('Antique Ceramic Vase 01', 'Poly Haven', 'antique_ceramic_vase_01'))
    mobilier.solide(5.3, 3.9, 5.8, 4.4)
