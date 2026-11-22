# Télécharge les numérisations 3D du Smithsonian (Open Access, CC0) utilisées dans le cabinet,
# depuis le miroir de la Harvard Library Innovation Lab (source.coop).
# python3 -I telecharger_smithsonian.py <dossier>   (le dossier modeles/si2 de l'atelier)
import os, sys, urllib.request
DEST = sys.argv[1]
os.makedirs(DEST, exist_ok=True)
FICHIERS = [
    ('Archaeopteryx_siemensii.glb', 'Archaeopteryx siemensii Dames',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/391660da-7c49-499c-91f5-88a298686c09/PAL509743-150k-1024-low.glb'),
    ('Cypraecassis_rufa.glb', 'Cypraecassis rufa',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/8cd81303-17b2-413e-8804-93810f80b5a8/USNM_1127926-150k-1024-low.glb'),
    ('Diademodon_tetragonus.glb', 'Diademodon tetragonus Seeley, 1894',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/6758ddb3-2eea-49ad-89e2-a2973e7143eb/usnm-v-00023352-diademodon-tetragonus--150k-1024-low.glb'),
    ('Diodon_hystrix.glb', 'Diodon hystrix',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/e0bdb234-d604-41fd-8f47-27368159c476/USNM_195928-150k-1024-low.glb'),
    ('Gorilla_gorilla_gorilla_USNM574138_Cranium_.glb', 'Gorilla gorilla gorilla',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/007d262e-2ff0-45a7-b820-b923d395b055/USNM574138_Cranium_-600_dec-150k-1024-low.glb'),
    ('Lactophrys_bicaudalis.glb', 'Lactophrys bicaudalis',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/b64f9c0a-3634-4043-9b1d-a2aaf2823317/usnm_273167_test-150k-1024-low.glb'),
    ('Linckia_laevigata.glb', 'Linckia laevigata',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/aff2c3e5-e909-4c18-87ce-8390bac19186/usnm_e15868-150k-1024-low.glb'),
    ('Lopholithodes_foraminatus.glb', 'Lopholithodes foraminatus',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/5a518fb2-b5cb-4e21-a61a-eb6bf7c25db7/USNM_161385-150k-1024-low.glb'),
    ('Meandrina_meandrites.glb', 'Meandrina meandrites',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/74dc5709-1808-4de3-bce5-bb9be8573d42/USNM_1174917-150k-1024-low.glb'),
    ('Panulirus_longipes.glb', 'Panulirus longipes',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/baa516b6-ecff-480d-b93e-591dd7ce49c2/USNM_105728-150k-1024-low.glb'),
    ('Thrinaxodon_liorhinus.glb', 'Thrinaxodon liorhinus Seeley, 1894',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/e0ac6fea-5384-4787-9abc-cdfffec833c1/usnm-v-00022812-thrinaxodon-liorhinus-seeley-150k-1024-low.glb'),
    ('Tridacna.glb', 'Tridacna (Flodacna) squamosa',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/701a39f3-c97a-4951-9de4-1125229eb703/usnm_1444w-20m-150k-1024-low.glb'),
    ('White-tailed_Deer_PALDEERSKULL.glb', 'White-tailed Deer',
     'https://data.source.coop/harvard-lil/smithsonian-open-access/3d/fcc69841-d8be-4103-be0f-143e374c9ce6/PALDEERSKULL-150k-1024-low.glb'),
]
for nom, titre, url in FICHIERS:
    chemin = os.path.join(DEST, nom)
    if os.path.exists(chemin):
        continue
    req = urllib.request.Request(url, headers={'User-Agent': 'cabinet-curiosites-outillage'})
    with urllib.request.urlopen(req, timeout=120) as r, open(chemin, 'wb') as f:
        f.write(r.read())
    print('téléchargé', nom, '—', titre)
