# grillecrop.py dossier nom : quadrille un document recadré avec les coordonnées de la PAGE (en %)
import sys, json, pathlib
from PIL import Image, ImageDraw
d=pathlib.Path(sys.argv[1]); nom=sys.argv[2]
p,x0,y0,x1,y1=json.load(open(d/'crops.json'))[nom]
im=Image.open(d/'docs'/f'{nom}.jpg').convert('RGB'); W,H=im.size; k=1400/W; im=im.resize((1400,int(H*k))); W,H=im.size
dr=ImageDraw.Draw(im)
import math
for v in range(math.ceil(x0),int(x1)+1):
    x=(v-x0)/(x1-x0)*W; dr.line([(x,0),(x,H)],fill=(255,0,0) if v%5==0 else (255,190,190),width=1)
    if v%5==0: dr.text((x+2,2),str(v),fill=(200,0,0))
for v in range(math.ceil(y0),int(y1)+1):
    y=(v-y0)/(y1-y0)*H; dr.line([(0,y),(W,y)],fill=(0,0,255) if v%5==0 else (190,190,255),width=1)
    dr.text((2,y+2),str(v),fill=(0,0,200))
im.save(f'/tmp/claude-0/-home-user-reynesmanon11-maker-github-io/4efa1b98-71a0-549e-9d14-f7441031016d/scratchpad/gc_{nom}.png')
