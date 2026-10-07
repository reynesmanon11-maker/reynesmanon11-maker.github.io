# recadre.py dossier_pages crops.json dossier_sortie : découpe chaque document (cadres en % de la page)
import json, sys, pathlib
from PIL import Image
pages, crops, out = pathlib.Path(sys.argv[1]), json.load(open(sys.argv[2])), pathlib.Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
for nom, (p, x0, y0, x1, y1) in crops.items():
    f = next(q for q in pages.glob('p-*.png') if q.stem.split('-')[1].isdigit() and int(q.stem.split('-')[1]) == p)
    im = Image.open(f).convert('RGB'); w, h = im.size
    c = im.crop((int(w*x0/100), int(h*y0/100), int(w*x1/100), int(h*y1/100)))
    if c.width > 1700: c = c.resize((1700, int(c.height*1700/c.width)), Image.LANCZOS)
    c.save(out/f'{nom}.jpg', quality=90)
    print(nom, c.size)
