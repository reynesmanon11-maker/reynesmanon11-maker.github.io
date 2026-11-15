#!/usr/bin/env python3
"""Assemble un diaporama interactif en UN SEUL fichier HTML.

    python3 scripts/assembler.py source.html -o sortie.html

Ce que fait le script :
  1. insère le moteur (assets/moteur.css et assets/moteur.js) et les polices du thème ;
  2. incorpore les images locales (src, data-fond, url(...)) pour que le fichier se suffise ;
  3. remplace les réponses en clair (data-code, data-reponse, data-verrou) par une empreinte,
     afin qu'un élève qui ouvre le code source ne les lise pas d'un coup d'œil ;
  4. vérifie la cohérence : identifiants uniques, cibles existantes, images trouvées ;
  5. embarque le mode retouche à la souris (?retouche ou Ctrl + Alt + E), sauf avec --sans-retouche.

N'utilise que la bibliothèque standard. Si Pillow est installé, les grandes photos sont
réduites (1600 px de large au plus) pour garder un fichier léger.
"""
import argparse
import base64
import io
import mimetypes
import os
import re
import sys
import unicodedata
from html.parser import HTMLParser

ICI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ICI, '..', 'assets')

POLICES = {
    'atelier': ['Raleway:wght@300;400;500;600;700;800', 'Inter:wght@400;500;600'],
    'aventure': ['Bangers', 'Yusei+Magic'],
    'nature': ['Fraunces:wght@500;700', 'Nunito:wght@400;600;700'],
    'nuit': ['Space+Grotesk:wght@400;500;700', 'Inter:wght@400;500;600'],
}
MOTS_NAV = {'suivante', 'precedente', 'debut', 'fin', 'retour'}
FONDS = {'foret', 'ocean', 'nuit', 'volcan', 'parchemin', 'labo', 'metal', 'prairie', 'degrade'}
ATTR_CIBLES = ('data-aller', 'data-ouvrir', 'data-reussite', 'data-echec', 'data-fin',
               'data-montrer', 'data-cacher', 'data-basculer')
LARGEUR_MAX = 1600


def normalise(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if not ('̀' <= c <= 'ͯ'))
    return re.sub(r'\s+', ' ', s.lower()).strip()


def empreinte(s):
    """FNV-1a 32 bits — identique à la fonction du même nom dans moteur.js."""
    h = 0x811c9dc5
    for o in ('dp1:' + s).encode('utf-8'):
        h ^= o
        h = (h * 0x01000193) & 0xFFFFFFFF
    return '%08x' % h


class Releve(HTMLParser):
    """Parcourt le HTML pour relever identifiants, pages, fenêtres, cibles et thèmes."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.pages, self.fenetres, self.cibles, self.themes = [], [], [], [], set()
        self.scripts_externes, self.diapo, self.images = [], False, []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get('class') or '').split()
        if a.get('id'):
            self.ids.append(a['id'])
        if 'diapo' in classes:
            self.diapo = True
        if 'page' in classes:
            self.pages.append(a.get('id'))
        if 'fenetre' in classes:
            self.fenetres.append(a.get('id'))
        if a.get('data-theme'):
            self.themes.add(a['data-theme'])
        for nom in ATTR_CIBLES:
            if a.get(nom):
                for mot in a[nom].split():
                    self.cibles.append((nom, mot))
        if tag == 'script' and a.get('src', '').startswith('http'):
            self.scripts_externes.append(a['src'])
        if tag == 'img' and a.get('src'):
            self.images.append(a['src'])


def en_donnees(chemin, base, alertes, erreurs):
    """Renvoie l'image locale sous forme d'adresse data:, ou None si ce n'est pas un fichier local."""
    if re.match(r'^(data:|https?:|//|#)', chemin):
        return None
    fichier = os.path.normpath(os.path.join(base, chemin))
    if not os.path.isfile(fichier):
        erreurs.append('image introuvable : %s' % chemin)
        return None
    mime = mimetypes.guess_type(fichier)[0] or 'application/octet-stream'
    with open(fichier, 'rb') as f:
        octets = f.read()
    if mime in ('image/jpeg', 'image/png') and len(octets) > 250_000:
        try:
            from PIL import Image
            im = Image.open(io.BytesIO(octets))
            if im.width > LARGEUR_MAX:
                im = im.resize((LARGEUR_MAX, round(im.height * LARGEUR_MAX / im.width)))
            tampon = io.BytesIO()
            if mime == 'image/jpeg' or im.mode == 'RGB':
                im.convert('RGB').save(tampon, 'JPEG', quality=82, optimize=True)
                mime = 'image/jpeg'
            else:
                im.save(tampon, 'PNG', optimize=True)
            if tampon.tell() < len(octets):
                octets = tampon.getvalue()
        except ImportError:
            if len(octets) > 1_500_000:
                alertes.append('%s pèse %.1f Mo : réduis-la avant (Pillow absent, pas de réduction automatique)'
                               % (chemin, len(octets) / 1e6))
    return 'data:%s;base64,%s' % (mime, base64.b64encode(octets).decode('ascii'))


def assemble(source, sortie, retouche=True):
    base = os.path.dirname(os.path.abspath(source))
    with open(source, encoding='utf-8') as f:
        html = f.read()
    erreurs, alertes = [], []
    # Un fichier déjà assemblé (par exemple retouché à la souris puis téléchargé) peut resservir de source :
    # on retire le moteur qu'il contient, il sera remis à neuf.
    html = re.sub(r'<!-- MOTEUR:debut -->.*?<!-- MOTEUR:fin -->', '<!-- MOTEUR -->', html, flags=re.S)

    # ---- relevé et vérifications ----
    r = Releve()
    r.feed(html)
    if not r.diapo:
        erreurs.append('aucun élément class="diapo" : rien à animer')
    if not r.pages:
        erreurs.append('aucune <section class="page">')
    for nom, liste in (('page', r.pages), ('fenêtre', r.fenetres)):
        if any(not i for i in liste):
            erreurs.append('une %s n\'a pas d\'identifiant (id="…")' % nom)
    doublons = sorted({i for i in r.ids if r.ids.count(i) > 1})
    if doublons:
        erreurs.append('identifiants en double : ' + ', '.join(doublons))
    connus = set(r.ids)
    for nom, mot in r.cibles:
        if mot in MOTS_NAV:
            continue
        if mot.lstrip('#') not in connus:
            erreurs.append('%s="%s" ne mène nulle part (aucun id="%s")' % (nom, mot, mot.lstrip('#')))
        elif nom == 'data-ouvrir' and mot.lstrip('#') not in r.fenetres:
            erreurs.append('data-ouvrir="%s" vise un élément qui n\'est pas une fenêtre' % mot)
    visees = {m.lstrip('#') for n, m in r.cibles}
    for f in r.fenetres:
        if f and f not in visees:
            alertes.append('la fenêtre "%s" n\'est ouverte par aucun élément' % f)
    for s in r.scripts_externes:
        alertes.append('script externe (%s) : le fichier ne fonctionnera plus hors ligne' % s)
    for t in r.themes:
        if t not in POLICES:
            alertes.append('thème inconnu : "%s" (connus : %s)' % (t, ', '.join(POLICES)))

    # ---- images locales ----
    def remplace_src(m):
        d = en_donnees(m.group(3), base, alertes, erreurs)
        return m.group(0) if d is None else '%s%s%s%s' % (m.group(1), m.group(2), d, m.group(2))
    html = re.sub(r'(<(?:img|image|source|video|audio)\b[^>]*?\s(?:src|href|xlink:href|poster)=)(["\'])(.*?)\2',
                  remplace_src, html, flags=re.S)

    def remplace_fond(m):
        if m.group(3) in FONDS or re.match(r'^(#|rgb|hsl)', m.group(3)) or 'gradient(' in m.group(3):
            return m.group(0)
        d = en_donnees(m.group(3), base, alertes, erreurs)
        return m.group(0) if d is None else '%s%s%s%s' % (m.group(1), m.group(2), d, m.group(2))
    html = re.sub(r'(\sdata-fond=)(["\'])(.*?)\2', remplace_fond, html)

    def remplace_url(m):
        d = en_donnees(m.group(2), base, alertes, erreurs)
        return m.group(0) if d is None else 'url(%s)' % d
    html = re.sub(r'url\(\s*(["\']?)([^)"\']+?\.(?:png|jpe?g|gif|webp|svg))\1\s*\)', remplace_url, html, flags=re.I)

    # ---- réponses masquées ----
    def masque(m):
        nom, valeur = m.group(1), m.group(3)
        variantes = [normalise(v) for v in valeur.split('|') if v.strip()]
        if not variantes:
            erreurs.append('data-%s est vide' % nom)
            return m.group(0)
        extra = ' data-n="%d"' % len(variantes[0]) if nom == 'code' else ''
        return ' data-%s-h="%s"%s' % (nom, ' '.join(empreinte(v) for v in variantes), extra)
    html = re.sub(r'\sdata-(code|reponse|verrou)=(["\'])(.*?)\2', masque, html)

    # ---- moteur et polices ----
    with open(os.path.join(ASSETS, 'moteur.css'), encoding='utf-8') as f:
        css = f.read()
    with open(os.path.join(ASSETS, 'moteur.js'), encoding='utf-8') as f:
        js = f.read()
    js = '<script>\n' + js.replace('</script', '<\\/script') + '\n</script>'
    if retouche:  # le mode retouche se charge avant le moteur, qui le découvre au démarrage ;
        # il a sa propre balise pour que la « version élèves » puisse le retirer
        with open(os.path.join(ASSETS, 'retouche.js'), encoding='utf-8') as f:
            js = '<script data-retouche>\n' + f.read().replace('</script', '<\\/script') + '\n</script>\n' + js
    familles = []
    for t in sorted(r.themes or {'atelier'}):
        for fam in POLICES.get(t, []):
            if fam not in familles:
                familles.append(fam)
    for m in re.finditer(r'data-polices=(["\'])(.*?)\1', html):
        for fam in m.group(2).split('|'):
            fam = fam.strip().replace(' ', '+')
            if fam and fam not in familles:
                familles.append(fam)
    liens = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
             '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?%s&display=swap">\n'
             % '&'.join('family=' + f for f in familles))
    bloc = ('<!-- MOTEUR:debut -->\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + liens +
            '<style>\n' + css + '\n</style>\n' + js + '\n<!-- MOTEUR:fin -->')
    if '<!-- MOTEUR -->' in html:
        html = html.replace('<!-- MOTEUR -->', bloc, 1)
    elif re.search(r'</head>', html, flags=re.I):
        html = re.sub(r'</head>', lambda m: bloc + '\n</head>', html, count=1, flags=re.I)
    else:
        erreurs.append('ni repère <!-- MOTEUR --> ni </head> : impossible d\'insérer le moteur')

    for a in alertes:
        print('  attention : ' + a)
    if erreurs:
        for e in erreurs:
            print('  ERREUR : ' + e)
        print('Assemblage refusé : %d erreur(s) à corriger dans %s' % (len(erreurs), source))
        return 1
    with open(sortie, 'w', encoding='utf-8') as f:
        f.write(html)
    poids = os.path.getsize(sortie)
    print('OK : %s — %d page(s), %d fenêtre(s), %.0f Ko' % (sortie, len(r.pages), len(r.fenetres), poids / 1024))
    if poids > 12_000_000:
        print('  attention : fichier lourd (plus de 12 Mo) ; réduis les photographies')
    return 0


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Assemble un diaporama interactif en un seul fichier HTML.')
    p.add_argument('source', help='le fichier source (.html)')
    p.add_argument('-o', '--sortie', help='le fichier produit (défaut : <source>-final.html)')
    p.add_argument('--sans-retouche', action='store_true',
                   help='ne pas embarquer le mode retouche (version à donner aux élèves pour un escape game)')
    a = p.parse_args()
    sys.exit(assemble(a.source, a.sortie or re.sub(r'\.html?$', '', a.source) + '-final.html',
                      retouche=not a.sans_retouche))
