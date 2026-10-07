# grille.py page.png sortie.png : réduit la page et trace une grille 10 % pour repérer les cadrages
import sys
from PIL import Image, ImageDraw
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size; k=1000/h; im=im.resize((int(w*k),1000))
d=ImageDraw.Draw(im); W,H=im.size
for i in range(1,20):
    x=W*i/20; y=H*i/20; c=(255,0,0) if i%2==0 else (255,170,170)
    d.line([(x,0),(x,H)],fill=c,width=1); d.line([(0,y),(W,y)],fill=c,width=1)
    d.text((x+2,2),str(i*5),fill=(200,0,0)); d.text((2,y+2),str(i*5),fill=(200,0,0))
im.save(sys.argv[2])
