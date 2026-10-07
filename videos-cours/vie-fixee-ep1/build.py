# Assemble l'épisode en un seul fichier HTML (polices incluses en base64).
import base64, json, pathlib, re, sys
d = pathlib.Path(__file__).parent; src = d/'src'; f = d/'polices'
b64 = lambda p: 'data:font/woff2;base64,' + base64.b64encode(p.read_bytes()).decode()
css = (src/'style.css').read_text()
css = css.replace('FONT_BEBAS', b64(f/'bebas.woff2')).replace('FONT_ONEST_EXT', b64(d.parents[1]/'polices'/'onest-latin-ext.woff2')).replace('FONT_ONEST', b64(d.parents[1]/'polices'/'onest-latin.woff2'))
scenes = (src/'scenes.html').read_text()
subs = json.loads((src/'subs.json').read_text())
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>La vie fixée · Épisode 1</title><style>{css}</style></head><body>
<div id="viewport"><div id="stage">
{scenes}
<div class="vignette"></div>
<div id="bug"><b>VIE FIXÉE</b><span>Épisode 1</span></div><div id="chap"></div><div id="barre"></div>
</div></div>
<div id="st"></div>
<div id="ctrl"><button id="bt">Lecture</button><input id="pos" type="range" min="0" max="1000" value="0"><button id="cc" title="Sous-titres">ST</button></div>
<div id="go"><div>▶ Lancer l’épisode</div></div>
<script>window.SUBS={json.dumps(subs, ensure_ascii=False)};</script>
<script>{(src/'config.js').read_text()}</script>
<script>{(src/'engine.js').read_text()}</script>
<script>{(src/'player.js').read_text()}</script>
</body></html>'''
(d/'episode.html').write_text(html)
print('episode.html', len(html)//1024, 'Ko')
