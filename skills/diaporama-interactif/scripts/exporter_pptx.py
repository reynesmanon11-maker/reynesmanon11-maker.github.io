#!/usr/bin/env python3
"""Exporte une présentation assemblée en PowerPoint (.pptx), pour la reprendre à la souris ailleurs.

    python3 scripts/exporter_pptx.py presentation.html -o presentation.pptx

À quoi ça sert : Genially, Canva, Google Slides et PowerPoint savent importer un .pptx, pas une
page web. On obtient une diapositive par page et par fenêtre, où :
  - chaque texte est une zone de texte modifiable, à sa place, avec sa police et sa couleur ;
  - chaque image, bloc coloré ou dessin est une image à sa place, déplaçable ;
  - les clics qui changent de page ou ouvrent une fenêtre deviennent des liens entre diapositives ;
  - les notes de chaque diapositive listent les infobulles et les liens, pour les refaire au besoin.

Ce qui ne passe pas : les animations, les infobulles, les quiz, cadenas, digicodes, cartes à
retourner et glisser-déposer (ils sont figés en image). C'est une passerelle pour retoucher la mise
en page et les textes dans un autre outil, pas une copie fonctionnelle.

Demande Node, Playwright et un navigateur (pour mesurer la mise en page), ainsi que python-pptx.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

ICI = os.path.dirname(os.path.abspath(__file__))
EMU = 10160          # une unité de scène (1200 de large) en EMU, pour une diapositive 16:9 de 13,333 pouces
PT = 0.8             # une unité de scène en points


def releve(source, dossier):
    env = dict(os.environ)
    env.setdefault('NODE_PATH', '/opt/node22/lib/node_modules')
    r = subprocess.run(['node', os.path.join(ICI, 'exporter_pptx.js'), source, dossier],
                       capture_output=True, text=True, env=env)
    if 'PAS_DE_NAVIGATEUR' in r.stdout:
        sys.exit('Export impossible ici : il faut Node, Playwright et un navigateur pour mesurer la mise en page.')
    if 'RELEVE_OK' not in r.stdout:
        sys.exit('Le relevé a échoué :\n' + r.stdout + r.stderr)
    with open(os.path.join(dossier, 'plan.json'), encoding='utf-8') as f:
        return json.load(f)


def compose(plan, dossier, sortie):
    try:
        from pptx import Presentation
        from pptx.dml.color import RGBColor
        from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
        from pptx.util import Emu, Pt
    except ImportError:
        sys.exit('Il manque python-pptx (pip install python-pptx).')

    prs = Presentation()
    prs.slide_width, prs.slide_height = Emu(1200 * EMU), Emu(675 * EMU)
    vierge = prs.slide_layouts[6]
    diapos = [prs.slides.add_slide(vierge) for _ in plan['diapos']]
    numero = {d['id']: i for i, d in enumerate(plan['diapos'])}
    pages = [d['id'] for d in plan['diapos'] if d['genre'] == 'page']
    ouvreurs = {}   # fenêtre -> première page qui l'ouvre, pour le lien de retour
    for d in plan['diapos']:
        for it in d['items']:
            v = (it.get('action') or {}).get('vers')
            if v and v in numero and plan['diapos'][numero[v]]['genre'] == 'fenetre':
                ouvreurs.setdefault(v, d['id'])
    aligne = {'center': PP_ALIGN.CENTER, 'right': PP_ALIGN.RIGHT, 'end': PP_ALIGN.RIGHT, 'justify': PP_ALIGN.JUSTIFY}

    def vers(d, action):
        """La diapositive visée par une action, ou None."""
        v = (action or {}).get('vers')
        if not v:
            return None
        if v in ('suivante', 'precedente', 'debut', 'fin', 'retour') and d['genre'] == 'page':
            i = pages.index(d['id'])
            v = {'suivante': pages[min(i + 1, len(pages) - 1)], 'precedente': pages[max(i - 1, 0)], 'retour': pages[max(i - 1, 0)],
                 'debut': pages[0], 'fin': pages[-1]}[v]
        return diapos[numero[v]] if v in numero else None

    def lie(forme, d, action):
        if not action:
            return
        cible = vers(d, action)
        try:
            if cible is not None:
                forme.click_action.target_slide = cible
            elif action.get('lien'):
                forme.click_action.hyperlink.address = action['lien']
        except Exception:
            pass  # un lien manqué ne doit pas faire échouer l'export

    for d, diapo in zip(plan['diapos'], diapos):
        formes = diapo.shapes
        if d['fond']:
            formes.add_picture(os.path.join(dossier, d['fond']), 0, 0, prs.slide_width, prs.slide_height)
        else:  # une fenêtre : fond gris, comme une fenêtre posée sur une page assombrie
            fond = diapo.background.fill
            fond.solid()
            fond.fore_color.rgb = RGBColor(0x8A, 0x8A, 0x8A)
        notes = list(d['notes'])
        for it in d['items']:
            x, y, w, h = (Emu(round(it[k] * EMU)) for k in ('x', 'y', 'w', 'h'))
            if it['type'] == 'image':
                forme = formes.add_picture(os.path.join(dossier, it['fichier']), x, y, w, h)
            else:
                # Un peu de large : si la police manque dans l'autre outil, sa remplaçante est souvent plus large.
                # Un titre prévu sur une ligne y reste, quitte à déborder un peu.
                marge = round(it['w'] * (0.12 if it.get('uneLigne') else 0.03) * EMU)
                forme = formes.add_textbox(x, y, Emu(round(it['w'] * EMU) + marge), h)
                if it.get('rot'):
                    forme.rotation = it['rot']
                cadre = forme.text_frame
                cadre.word_wrap = not it.get('uneLigne')
                cadre.auto_size = MSO_AUTO_SIZE.NONE
                cadre.margin_left = cadre.margin_right = cadre.margin_top = cadre.margin_bottom = 0
                cadre.vertical_anchor = MSO_ANCHOR.MIDDLE if it.get('milieu') else MSO_ANCHOR.TOP
                for i, para in enumerate(it['paras']):
                    p = cadre.paragraphs[0] if i == 0 else cadre.add_paragraph()
                    if it['align'] in aligne:
                        p.alignment = aligne[it['align']]
                    p.line_spacing = max(0.7, round(it['interligne'] / 1.2, 2))
                    for r in para:
                        run = p.add_run()
                        run.text = r['t']
                        f = run.font
                        f.size = Pt(round(r['taille'] * PT, 1))
                        f.bold, f.italic = r['gras'], r['italique']
                        if r['souligne']:
                            f.underline = True
                        f.color.rgb = RGBColor(*r['couleur'])
                        f.name = r['police']
            lie(forme, d, it.get('action'))
            a = it.get('action') or {}
            if a.get('vers') and vers(d, a) is not None:
                n = diapos.index(vers(d, a)) + 1
                ligne = 'Un clic mène à la diapositive %d (%s).' % (n, plan['diapos'][n - 1]['id'])
                if ligne not in notes:
                    notes.append(ligne)
            elif a.get('lien') and ('Lien : ' + a['lien']) not in notes:
                notes.append('Lien : ' + a['lien'])
        if d['genre'] == 'fenetre' and d['id'] in ouvreurs:   # la croix : revenir à la page
            croix = formes.add_textbox(Emu(1130 * EMU), Emu(16 * EMU), Emu(50 * EMU), Emu(44 * EMU))
            run = croix.text_frame.paragraphs[0].add_run()
            run.text = '✕'
            run.font.size, run.font.bold = Pt(24), True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            croix.click_action.target_slide = diapos[numero[ouvreurs[d['id']]]]
            notes.append('Fenêtre ouverte depuis la diapositive %d (%s).' % (numero[ouvreurs[d['id']]] + 1, ouvreurs[d['id']]))
        entete = ('Page « %s »' if d['genre'] == 'page' else 'Fenêtre « %s »') % d['id']
        diapo.notes_slide.notes_text_frame.text = '\n'.join([entete] + notes)
    prs.save(sortie)
    return len(diapos)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Exporte une présentation assemblée en PowerPoint (.pptx).')
    p.add_argument('source', help='le fichier HTML assemblé')
    p.add_argument('-o', '--sortie', help='le fichier .pptx à écrire')
    a = p.parse_args()
    sortie = a.sortie or os.path.splitext(a.source)[0] + '.pptx'
    with tempfile.TemporaryDirectory(prefix='pptx_') as tmp:
        n = compose(releve(a.source, tmp), tmp, sortie)
    print('OK : %s — %d diapositive(s), %.0f Ko' % (sortie, n, os.path.getsize(sortie) / 1024))
