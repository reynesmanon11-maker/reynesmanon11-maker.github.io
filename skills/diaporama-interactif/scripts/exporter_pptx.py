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


def compose(plan, dossier, sortie, reperes=True):
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

    def etiquette(formes, it, texte):
        """Une petite étiquette orange posée sur un élément cliquable : Genially ne reprend ni les liens
        ni les notes d'un PowerPoint, alors on écrit sur la diapositive elle-même ce qu'il faut rebrancher.
        Une fois l'interactivité refaite dans Genially, on supprime l'étiquette."""
        x = min(max(0, it['x'] - 6), 1200 - 190)
        y = min(max(0, it['y'] - 18), 675 - 30)
        boite = formes.add_textbox(Emu(round(x * EMU)), Emu(round(y * EMU)), Emu(190 * EMU), Emu(30 * EMU))
        boite.fill.solid()
        boite.fill.fore_color.rgb = RGBColor(0xE8, 0x71, 0x0A)
        cadre = boite.text_frame
        cadre.word_wrap = False
        cadre.auto_size = MSO_AUTO_SIZE.SHAPE_TO_FIT_TEXT
        cadre.margin_left = cadre.margin_right = Emu(6 * EMU)
        cadre.margin_top = cadre.margin_bottom = Emu(2 * EMU)
        run = cadre.paragraphs[0].add_run()
        run.text = texte
        run.font.size, run.font.bold, run.font.name = Pt(13), True, 'Arial'
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for d, diapo in zip(plan['diapos'], diapos):
        formes = diapo.shapes
        a_etiqueter = []
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
            if it['type'] == 'image' and not it.get('nom') and any(
                    t is not it and t.get('action') == a and (t['type'] == 'texte' or t.get('nom')) for t in d['items']):
                continue  # le fond ou l'icône d'un bouton déjà nommé : une seule ligne par bouton
            nom = ' '.join(r['t'] for p in it.get('paras', []) for r in p).strip()
            if nom:
                nom = '« %s »' % (nom[:50] + ('…' if len(nom) > 50 else ''))
            else:
                nom = 'L’image « %s »' % it['nom'] if it.get('nom') else 'L’image'
            if a.get('vers') and vers(d, a) is not None:
                n = diapos.index(vers(d, a)) + 1
                cible = plan['diapos'][n - 1]
                geste = 'Ouvrir une fenêtre' if cible['genre'] == 'fenetre' else 'Aller à la page'
                ligne = '%s → %s : page %d (%s).' % (nom, geste, n, cible['id'])
                if ligne not in notes:
                    notes.append(ligne)
                    a_etiqueter.append((it, '%s %d' % ('Fenêtre p.' if cible['genre'] == 'fenetre' else 'Aller p.', n)))
            elif a.get('lien'):
                ligne = '%s → Ouvrir le lien : %s' % (nom, a['lien'])
                if ligne not in notes:
                    notes.append(ligne)
                    a_etiqueter.append((it, 'Lien web (voir note)'))
        if reperes:   # posées en dernier : au-dessus de tout, faciles à sélectionner puis à supprimer
            for it, texte in a_etiqueter:
                etiquette(formes, it, '🔗 ' + texte)
        if d['genre'] == 'fenetre' and d['id'] in ouvreurs:   # la croix : revenir à la page
            croix = formes.add_textbox(Emu(1130 * EMU), Emu(16 * EMU), Emu(50 * EMU), Emu(44 * EMU))
            run = croix.text_frame.paragraphs[0].add_run()
            run.text = '✕'
            run.font.size, run.font.bold = Pt(24), True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            croix.click_action.target_slide = diapos[numero[ouvreurs[d['id']]]]
            notes.append('Fenêtre : dans Genially, la brancher avec « Ouvrir une fenêtre » sur le bouton de la page %d (%s).' % (numero[ouvreurs[d['id']]] + 1, ouvreurs[d['id']]))
        entete = ('Page « %s » — interactivités à refaire :' if d['genre'] == 'page' else 'Fenêtre « %s » :') % d['id']
        diapo.notes_slide.notes_text_frame.text = '\n'.join([entete] + notes)
    prs.save(sortie)
    return len(diapos)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Exporte une présentation assemblée en PowerPoint (.pptx).')
    p.add_argument('source', help='le fichier HTML assemblé')
    p.add_argument('-o', '--sortie', help='le fichier .pptx à écrire')
    p.add_argument('--sans-reperes', action='store_true',
                   help='ne pas poser les étiquettes orange « Aller p. 2 » sur les éléments cliquables')
    a = p.parse_args()
    sortie = a.sortie or os.path.splitext(a.source)[0] + '.pptx'
    with tempfile.TemporaryDirectory(prefix='pptx_') as tmp:
        n = compose(releve(a.source, tmp), tmp, sortie, reperes=not a.sans_reperes)
    print('OK : %s — %d diapositive(s), %.0f Ko' % (sortie, n, os.path.getsize(sortie) / 1024))
