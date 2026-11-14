#!/usr/bin/env python3
"""Lit une présentation Genially exportée (« Télécharger > HTML », un .zip) et en tire un plan lisible.

    python3 scripts/lire_genially.py export.zip            # plan sur la sortie standard
    python3 scripts/lire_genially.py export.zip -o plan.md --images dossier/

Sert à REFAIRE une présentation existante : on y lit, page par page, les textes, leur place,
les polices, les animations, ce qui est cliquable et où cela mène, les contenus intégrés.
Avec --images, les images de la présentation sont copiées dans le dossier indiqué.

On ne réutilise de l'export que le contenu de son auteur (textes, images qu'il a déposées,
liens). Le lecteur Genially lui-même (code, logo, illustrations de leur bibliothèque) ne se copie pas.
"""
import argparse
import base64
import html as htmllib
import json
import os
import re
import shutil
import sys
import tempfile
import zipfile

FAMILLES = ['Texts', 'Images', 'Svgs', 'Areas', 'Groups', 'RichContents', 'Videos', 'Audios',
            'Activities', 'ContainerBoxes', 'BaseWidgets', 'Charts']
ANIMS = {  # nom Genially -> data-anim du moteur
    'fade-in': 'fondu', 'fade-in-bottom': 'fondu-bas', 'fade-in-top': 'fondu-haut',
    'fade-in-left': 'fondu-gauche', 'fade-in-right': 'fondu-droite',
    'scale-in-center': 'zoom', 'scale-in-center-reverse': 'zoom-inverse',
    'slide-in-left': 'glisse-gauche', 'slide-in-right': 'glisse-droite',
    'slide-in-top': 'glisse-haut', 'slide-in-bottom': 'glisse-bas',
    'bounce-in-bck': 'rebond', 'focus-in': 'flou', 'card-reveal-up': 'bascule',
}
SURVOLS = {'heartbeat-hover': 'battement', 'small-buzz-hover': 'vibre', 'zoomHover-hover': 'grossit',
           'shrink-hover': 'retrecit', 'hvr-float': 'flotte', 'event-wobble-to-top-right': 'penche'}
VITESSES = {'vel1': 1, 'vel2': 2, 'vel3': 3, 'vel4': 4, 'vel5': 4}


def px(v):
    try:
        return round(float(str(v).replace('px', '')))
    except (TypeError, ValueError):
        return 0


def texte_nu(h):
    h = re.sub(r'<br\s*/?>|</(p|div|li|h\d)>', '\n', h or '')
    h = htmllib.unescape(re.sub(r'<[^>]+>', '', h))
    return re.sub(r'[ \t\xa0]+', ' ', re.sub(r'\n\s*\n+', '\n', h)).strip()


def charge(chemin):
    """Renvoie (données, dossier de l'export). Accepte un .zip, un dossier ou genially.html."""
    if zipfile.is_zipfile(chemin):
        dossier = tempfile.mkdtemp(prefix='genially_')
        with zipfile.ZipFile(chemin) as z:
            for nom in z.namelist():  # on n'extrait que ce qui sert, sans sortir du dossier
                if nom.endswith('/') or '..' in nom or nom.startswith('/'):
                    continue
                if nom == 'genially.html' or nom.startswith(('images/', 'audios/')):
                    z.extract(nom, dossier)
        chemin = dossier
    page = chemin if chemin.endswith('.html') else os.path.join(chemin, 'genially.html')
    with open(page, encoding='utf-8') as f:
        m = re.search(r'window\.dataBase64="([^"]+)"', f.read())
    if not m:
        sys.exit('Ce fichier ne ressemble pas à un export Genially (pas de données embarquées).')
    return json.loads(base64.b64decode(m.group(1)).decode('utf-8')), os.path.dirname(os.path.abspath(page))


def plan(d):
    pages = sorted(d['Slides'], key=lambda s: float(s.get('Order') or 0))
    numero = {s['Id']: i + 1 for i, s in enumerate(pages)}
    actions = d.get('interactivityActions') or {}
    groupes = {g['Id']: g for g in d.get('Groups', [])}
    par_page = {}
    for fam in FAMILLES:
        for e in d.get(fam, []):
            par_page.setdefault(e.get('IdSlide'), []).append((fam, e))

    def place(e):
        p, s = e.get('Position') or {}, e.get('Size') or {}
        x, y = px(p.get('PositionLeft')), px(p.get('PositionTop'))
        g = groupes.get(e.get('IdGroup'))
        if g:
            x += px(g['Position'].get('PositionLeft'))
            y += px(g['Position'].get('PositionTop'))
        return '%d,%d,%d,%d' % (x, y, px(s.get('Width')), px(s.get('Height')))

    def mene(e):
        sortie = []
        for ref in (e.get('interactivities') or {}).values():
            a = actions.get(ref) or {}
            t = a.get('type')
            if t == 'goToSlide':
                c = a.get('target') or {}
                sortie.append('va à ' + ('la page %s' % numero.get(c.get('slideId'), '?') if c.get('slideId')
                                         else {'previousPage': 'la page précédente', 'nextPage': 'la page suivante'}.get(c.get('smartLink'), str(c))))
            elif t == 'slidePopup':
                sortie.append('ouvre en fenêtre la page %s' % numero.get(a.get('targetSlideId'), '?'))
            elif t == 'closeSlidePopup':
                sortie.append('ferme la fenêtre')
            elif t == 'openLink':
                sortie.append('ouvre le lien ' + str(a.get('link')))
            elif t:
                sortie.append(t + ' ' + json.dumps({k: v for k, v in a.items() if k not in ('type', 'refId')}, ensure_ascii=False)[:160])
        return sortie

    def mouvement(e):
        m = []
        if e.get('EffectIn') not in (None, 'none'):
            a = ANIMS.get(e['EffectIn'], e['EffectIn'])
            m.append('entrée %s (vitesse %s%s)' % (a, VITESSES.get(e.get('DurationIn'), 3),
                                                  ', délai %ss' % e['DelayIn'] if str(e.get('DelayIn', '0')) not in ('0', '') else ''))
        if e.get('Effect') not in (None, 'none'):
            m.append('effet continu ' + ('battement' if e['Effect'] == 'heartbeat' else e['Effect']))
        if e.get('EffectHover') not in (None, 'none'):
            m.append('survol ' + SURVOLS.get(e['EffectHover'], e['EffectHover']))
        return m

    L = ['# %s' % d['Genially'].get('Name', 'Présentation'), '']
    L.append('%d pages, dont %d servent de fenêtres. Scène de %s × %s.' % (
        len(pages), sum(1 for s in pages if s.get('Popup')),
        pages[0]['Size']['Width'], pages[0]['Size']['Height']))
    polices = {}
    for t in d.get('Texts', []):
        f = (t.get('FontFamily') or '').strip('"')
        if f:
            polices[f] = polices.get(f, 0) + 1
    L.append('Polices : ' + ', '.join('%s (%d)' % kv for kv in sorted(polices.items(), key=lambda kv: -kv[1])))
    c = (d.get('DocumentConfig') or {}).get('colors') or {}
    if c:
        L.append('Couleurs du document : ' + ', '.join('%s %s' % (k, v) for k, v in c.items() if v))
    L.append('')

    for s in pages:
        n = numero[s['Id']]
        L.append('## Page %d%s%s' % (n, ' — FENÊTRE' if s.get('Popup') else '',
                                    ' — protégée par le mot de passe « %s »' % s['Password'] if s.get('Password') else ''))
        fond = s.get('Background')
        L.append('Fond : ' + (os.path.basename(fond) if fond else (s.get('BackgroundColor') or 'aucun')))
        elements = sorted(par_page.get(s['Id'], []), key=lambda fe: (px((fe[1].get('Position') or {}).get('PositionTop')),
                                                                     px((fe[1].get('Position') or {}).get('PositionLeft'))))
        for fam, e in elements:
            if fam == 'Groups' and not mene(e) and not mouvement(e):
                continue
            extra = mene(e) + mouvement(e)
            suite = (' → ' + ' ; '.join(extra)) if extra else ''
            if fam == 'Texts':
                t = texte_nu(e.get('TextMessage'))
                if not t and not extra:
                    continue
                L.append('- TEXTE [%s] %s %spx : %s%s' % (place(e), (e.get('FontFamily') or '').strip('"'),
                                                         px(e.get('FontSize')), t.replace('\n', ' / '), suite))
            elif fam == 'Images':
                L.append('- IMAGE [%s] %s%s' % (place(e), os.path.basename(e.get('Source') or ''), suite))
            elif fam == 'Svgs':
                if extra:  # les formes décoratives sans effet ni action n'apportent rien au plan
                    L.append('- FORME/ICÔNE [%s] couleurs %s%s' % (place(e), ' '.join(map(str, e.get('Colors') or [])), suite))
            elif fam == 'Areas':
                L.append('- ZONE CLIQUABLE [%s]%s' % (place(e), suite))
            elif fam == 'Groups':
                L.append('- GROUPE [%s]%s' % (place(e), suite))
            elif fam == 'RichContents':
                m = re.search(r'src="([^"]+)"', e.get('Source') or '')
                L.append('- CONTENU INTÉGRÉ [%s] %s%s' % (place(e), m.group(1) if m else '(code libre)', suite))
            elif fam == 'Videos':
                L.append('- VIDÉO [%s] %s%s' % (place(e), e.get('Source'), suite))
            elif fam == 'Audios':
                L.append('- SON %s%s' % (e.get('Source'), suite))
            elif fam == 'Activities':
                L.append('- QUIZ [%s] %s' % (place(e), e.get('Question')))
                for r in e.get('Answers') or []:
                    L.append('    - %s %s' % ('(juste)' if r.get('IsCorrect') else '(faux) ', r.get('Text')))
            elif fam == 'ContainerBoxes':
                L.append('- CARTES [%s] %s, %d carte(s)%s' % (place(e), e.get('Name'), len(e.get('group') or []), suite))
            elif fam == 'BaseWidgets':
                L.append('- GADGET [%s] %s%s' % (place(e), e.get('Name'), suite))
            elif fam == 'Charts':
                L.append('- GRAPHIQUE [%s] %s : %s%s' % (place(e), e.get('Type'), json.dumps(e.get('RawData'), ensure_ascii=False), suite))
        L.append('')
    return '\n'.join(L)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Tire un plan lisible d\'une présentation Genially exportée.')
    p.add_argument('export', help='le .zip téléchargé depuis Genially, le dossier décompressé, ou genially.html')
    p.add_argument('-o', '--sortie', help='écrire le plan dans ce fichier')
    p.add_argument('--images', help='copier les images de la présentation dans ce dossier')
    a = p.parse_args()
    donnees, dossier = charge(a.export)
    texte = plan(donnees)
    if a.sortie:
        with open(a.sortie, 'w', encoding='utf-8') as f:
            f.write(texte)
        print('Plan écrit dans ' + a.sortie)
    else:
        print(texte)
    if a.images:
        src = os.path.join(dossier, 'images')
        os.makedirs(a.images, exist_ok=True)
        n = 0
        for nom in sorted(os.listdir(src)) if os.path.isdir(src) else []:
            if re.search(r'(mosca|genially|backgroundStandard)', nom, re.I):
                continue  # éléments de marque du lecteur : on ne les reprend pas
            shutil.copy(os.path.join(src, nom), os.path.join(a.images, nom))
            n += 1
        print('%d image(s) copiée(s) dans %s' % (n, a.images))
