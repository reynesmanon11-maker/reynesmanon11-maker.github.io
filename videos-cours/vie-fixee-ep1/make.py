import runpy, pathlib, json, subprocess
d = pathlib.Path(__file__).parent
import sys; sys.path.insert(0, str(d))
g = runpy.run_path(str(d/'gen.py'), run_name='gen')
import re
html = g['DEFS'] + '\n' + '\n'.join(g['S'])
# l'opacité des éléments animés est pilotée par le style : celle du dessin passe en fill/stroke-opacity
def _op(m):
    tag = m.group(0)
    if 'data-fx' not in tag: return tag
    return re.sub(r' opacity="([\d.]+)"', r' fill-opacity="\1" stroke-opacity="\1"', tag)
html = re.sub(r'<[a-z]+ [^<>]*>', _op, html)
(d/'src'/'scenes.html').write_text(html)
(d/'src'/'config.js').write_text('window.OFFSET = 4;\nwindow.CHAPITRES = ' + json.dumps(g.get('CHAPITRES', []), ensure_ascii=False) + ';\n')
(d/'src'/'meta.json').write_text(json.dumps(g['META'], ensure_ascii=False))
if not (d/'src'/'subs.json').exists(): (d/'src'/'subs.json').write_text('[]')
subprocess.run(['python3', str(d/'build.py')], check=True)
