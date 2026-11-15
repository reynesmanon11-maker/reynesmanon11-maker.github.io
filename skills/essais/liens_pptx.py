#!/usr/bin/env python3
"""Fabrique un petit PowerPoint d'essai : sur la première diapositive, huit boutons portent chacun
un lien écrit d'une façon différente. On l'importe dans Genially, et l'on regarde lesquels
arrivent avec une interactivité : c'est la façon qu'exporter_pptx.py doit employer.

    python3 skills/essais/liens_pptx.py essai-liens.pptx
"""
import sys
from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

EMU = 10160
RT_SLIDE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide'
RT_LIEN = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'


def lien_texte(run, diapo_source, cible=None, action=None, url=None):
    """Pose un lien sur le texte lui-même (et non sur la zone)."""
    rpr = run._r.get_or_add_rPr()
    h = etree.SubElement(rpr, qn('a:hlinkClick'))
    if cible is not None:
        h.set(qn('r:id'), diapo_source.part.relate_to(cible.part, RT_SLIDE))
        h.set('action', 'ppaction://hlinksldjump')
    elif url:
        h.set(qn('r:id'), diapo_source.part.relate_to(url, RT_LIEN, is_external=True))
    else:
        h.set(qn('r:id'), '')
        h.set('action', action)


def lien_forme_action(forme, action):
    """Lien posé sur la zone, sans cible précise (« diapositive suivante »)."""
    cnvpr = forme._element.xpath('./*[1]/p:cNvPr')[0]
    h = etree.SubElement(cnvpr, qn('a:hlinkClick'))
    h.set(qn('r:id'), '')
    h.set('action', action)


def main(sortie):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Emu(1200 * EMU), Emu(675 * EMU)
    d1, d2, d3 = (prs.slides.add_slide(prs.slide_layouts[6]) for _ in range(3))
    for n, d in ((2, d2), (3, d3)):
        t = d.shapes.add_textbox(Emu(100 * EMU), Emu(280 * EMU), Emu(1000 * EMU), Emu(100 * EMU))
        r = t.text_frame.paragraphs[0].add_run()
        r.text = 'Page %d — l’essai a réussi si un clic vous a amenée ici' % n
        r.font.size = Pt(32)

    titre = d1.shapes.add_textbox(Emu(40 * EMU), Emu(20 * EMU), Emu(1120 * EMU), Emu(60 * EMU))
    r = titre.text_frame.paragraphs[0].add_run()
    r.text = 'Essai : lesquels de ces boutons arrivent dans Genially avec une interactivité ?'
    r.font.size, r.font.bold = Pt(22), True

    essais = [
        ('A', 'zone de texte, lien sur la zone → page 2', 'zone'),
        ('B', 'zone de texte, lien sur le texte → page 2', 'texte'),
        ('C', 'zone de texte, « page suivante » sur la zone', 'zone-suivante'),
        ('D', 'zone de texte, « page suivante » sur le texte', 'texte-suivante'),
        ('E', 'rectangle plein, lien sur la forme → page 3', 'rectangle'),
        ('F', 'image, lien sur l’image → page 3', 'image'),
        ('G', 'lien web sur le texte (wikipedia.org)', 'web-texte'),
        ('H', 'lien web sur la zone (wikipedia.org)', 'web-zone'),
    ]
    url = 'https://fr.wikipedia.org/wiki/Contraception'
    for i, (lettre, quoi, genre) in enumerate(essais):
        x, y = 60 + (i % 2) * 560, 120 + (i // 2) * 130
        texte = '%s — %s' % (lettre, quoi)
        if genre == 'rectangle':
            f = d1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(x * EMU), Emu(y * EMU), Emu(520 * EMU), Emu(90 * EMU))
            f.fill.solid(); f.fill.fore_color.rgb = RGBColor(0xF7, 0x43, 0x95)
            f.line.fill.background()
            r = f.text_frame.paragraphs[0].add_run(); r.text = texte
            r.font.size, r.font.color.rgb = Pt(16), RGBColor(0xFF, 0xFF, 0xFF)
            f.click_action.target_slide = d3
            continue
        if genre == 'image':
            import io
            from PIL import Image, ImageDraw
            im = Image.new('RGB', (520, 90), (96, 132, 238)); ImageDraw.Draw(im).text((14, 34), 'F - image cliquable -> page 3', fill=(255, 255, 255))
            tampon = io.BytesIO(); im.save(tampon, 'PNG'); tampon.seek(0)
            f = d1.shapes.add_picture(tampon, Emu(x * EMU), Emu(y * EMU), Emu(520 * EMU), Emu(90 * EMU))
            f.click_action.target_slide = d3
            continue
        f = d1.shapes.add_textbox(Emu(x * EMU), Emu(y * EMU), Emu(520 * EMU), Emu(90 * EMU))
        f.line.color.rgb = RGBColor(0x12, 0x12, 0x12)
        r = f.text_frame.paragraphs[0].add_run(); r.text = texte; r.font.size = Pt(16)
        if genre == 'zone':
            f.click_action.target_slide = d2
        elif genre == 'texte':
            lien_texte(r, d1, cible=d2)
        elif genre == 'zone-suivante':
            lien_forme_action(f, 'ppaction://hlinkshowjump?jump=nextslide')
        elif genre == 'texte-suivante':
            lien_texte(r, d1, action='ppaction://hlinkshowjump?jump=nextslide')
        elif genre == 'web-texte':
            r.hyperlink.address = url
        elif genre == 'web-zone':
            f.click_action.hyperlink.address = url
    prs.save(sortie)
    print('OK : ' + sortie)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'essai-liens.pptx')
