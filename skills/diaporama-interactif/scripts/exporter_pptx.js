#!/usr/bin/env node
/* Première moitié de l'export PowerPoint : ouvre la présentation dans un navigateur et relève,
   pour chaque page et chaque fenêtre, ce qu'il faut pour la refaire en diapositive :
     - le fond (une image) ;
     - les blocs colorés, images et dessins (des images à fond transparent, à leur place) ;
     - les textes (qui resteront modifiables), avec police, taille, couleur, alignement ;
     - ce qui est cliquable et où cela mène.
   Écrit <dossier>/plan.json et les images. Appelé par exporter_pptx.py ; s'emploie rarement seul.

     node scripts/exporter_pptx.js presentation.html dossier/ */
const path = require('path');
const fs = require('fs');

const RELEVE = `(() => {
  const diapo = document.querySelector('.diapo'), d0 = diapo.getBoundingClientRect();
  const ENTIER = 'img,svg,canvas,iframe,.digicode,.minuteur,.integration,.point,.verrou';
  const IGNORE = '.rideau,.infobulle,.dp-sel,.fermer,.voile,.verso,script,style,.cache';
  let n = 0;
  const items = [], notes = [];
  const alpha = c => { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return 0; const p = m[1].split(',').map(parseFloat); return p.length > 3 ? p[3] : 1; };
  const rvb = c => { const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/.exec(c); return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]; };
  const boite = el => { const r = el.getBoundingClientRect(); return { x: r.left - d0.left, y: r.top - d0.top, w: r.width, h: r.height }; };
  const rotation = el => { let a = 0; for (let e = el; e && e !== diapo; e = e.parentElement) { const r = getComputedStyle(e).rotate; if (r && r !== 'none') a += parseFloat(r) || 0; } return a; };
  const cible = el => {
    const a = el.closest('[data-aller],[data-ouvrir],[data-lien]');
    if (!a || !diapo.contains(a)) return null;
    if (a.hasAttribute('data-ouvrir')) return { vers: a.getAttribute('data-ouvrir').replace(/^#/, '') };
    if (a.hasAttribute('data-aller')) return { vers: a.getAttribute('data-aller').trim().split(/\\s+/)[0].replace(/^#/, '') };
    return { lien: a.getAttribute('data-lien') };
  };
  const aBoite = (el, cs) => {
    if (alpha(cs.backgroundColor) > 0.02 || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none') return true;
    if (parseFloat(cs.borderTopWidth) > 0 && alpha(cs.borderTopColor) > 0.02) return true;
    if (parseFloat(cs.borderBottomWidth) > 0 && alpha(cs.borderBottomColor) > 0.02) return true;
    return ['::before', '::after'].some(p => { const s = getComputedStyle(el, p); return s.content !== 'none' && s.content !== 'normal' && s.display !== 'none'; });
  };
  const nomDe = el => { const e = el.matches('[alt],[aria-label]') ? el : el.querySelector('[alt],[aria-label]'); return e ? (e.getAttribute('alt') || e.getAttribute('aria-label') || '').trim() : ''; };
  const aTexteDirect = el => Array.prototype.some.call(el.childNodes, x => x.nodeType === 3 && x.textContent.trim());
  const souligne = (el, racine) => { for (let e = el; e; e = e.parentElement) { if (getComputedStyle(e).textDecorationLine.includes('underline')) return true; if (e === racine) break; } return false; };

  function texte(el, cs) {
    const paras = [[]];
    (function lis(noeud) {
      noeud.childNodes.forEach(x => {
        if (x.nodeType === 3) {
          const t = x.textContent.replace(/\\s+/g, ' ');
          if (!t.trim() && !paras[paras.length - 1].length) return;
          const p = x.parentElement, s = getComputedStyle(p);
          paras[paras.length - 1].push({ t, taille: parseFloat(s.fontSize), gras: parseInt(s.fontWeight, 10) >= 600, italique: s.fontStyle === 'italic',
            souligne: souligne(p, el), couleur: rvb(s.color), police: s.fontFamily.split(',')[0].replace(/["']/g, '').trim() });
        } else if (x.nodeType === 1) {
          if (x.tagName === 'BR') paras.push([]);
          else if (!x.matches('svg,[data-ico],script,style')) {
            /* un enfant « en bloc » (ou rangé en colonne) commence un nouveau paragraphe */
            const ds = getComputedStyle(x), pp = getComputedStyle(x.parentElement);
            const enBloc = /^(block|flex|grid|list-item|table)$/.test(ds.display) || (/flex/.test(pp.display) && pp.flexDirection.startsWith('column'));
            if (enBloc && paras[paras.length - 1].length) paras.push([]);
            lis(x);
            if (enBloc) paras.push([]);
          }
        }
      });
    })(el);
    const propres = paras.map(p => { if (p.length) { p[0].t = p[0].t.replace(/^\\s+/, ''); p[p.length - 1].t = p[p.length - 1].t.replace(/\\s+$/, ''); } return p.filter(r => r.t); }).filter(p => p.length);
    if (!propres.length) return;
    if (el.tagName === 'LI') propres[0].unshift(Object.assign({}, propres[0][0], { t: '• ' }));
    const rot = rotation(el), b = boite(el);
    const pad = ['Left', 'Top', 'Right', 'Bottom'].map(c => parseFloat(cs['padding' + c]) + parseFloat(cs['border' + c + 'Width']));
    let w = el.offsetWidth || b.w, h = el.offsetHeight || b.h, x = b.x + b.w / 2 - w / 2, y = b.y + b.h / 2 - h / 2;
    const milieu = el.tagName === 'BUTTON' || (/flex|grid/.test(cs.display) && /center/.test(cs.alignItems + cs.placeItems + cs.justifyContent));
    let align = cs.textAlign;
    if (/flex|grid/.test(cs.display) && /center/.test(cs.justifyContent + cs.placeItems)) align = 'center';
    if (el.tagName === 'BUTTON') align = cs.textAlign === 'left' || cs.textAlign === 'start' ? 'left' : 'center';
    const lh = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    const uneLigne = cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre';
    items.push({ type: 'texte', x: x + pad[0], y: y + pad[1], w: w - pad[0] - pad[2], h: h - pad[1] - pad[3], rot, milieu, align, uneLigne,
      interligne: isFinite(lh) ? lh : 1.2, paras: propres, action: cible(el) });
  }

  function parcours(el) {
    if (el.matches(IGNORE) || !el.getClientRects().length) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return;
    const b = boite(el);
    if (b.w < 1 || b.h < 1) return;
    if (el.hasAttribute('data-info')) notes.push('Infobulle sur « ' + (el.textContent.trim().slice(0, 40) || el.getAttribute('aria-label') || 'élément') + ' » : ' + el.getAttribute('data-info'));
    if (el.matches(ENTIER) || (!el.children.length && !el.textContent.trim() && aBoite(el, cs)) ) {
      el.setAttribute('data-xp', ++n); items.push(Object.assign({ type: 'image', n, mode: 'tout', action: cible(el), nom: nomDe(el) }, b)); return;
    }
    if (aBoite(el, cs) && !el.classList.contains('page')) { el.setAttribute('data-xp', ++n); items.push(Object.assign({ type: 'image', n, mode: 'boite', action: cible(el), nom: nomDe(el) }, b)); }
    if (aTexteDirect(el)) { texte(el, cs); Array.prototype.forEach.call(el.querySelectorAll('svg'), parcours); return; }
    Array.prototype.forEach.call(el.children, parcours);
  }
  const ou = document.querySelector('.fenetre.active') || document.querySelector('.page.active');
  parcours(ou);
  if (ou.classList.contains('page')) Array.prototype.forEach.call(diapo.children, e => { if (!e.matches('.page,.fenetre')) parcours(e); });
  return { items, notes };
})()`;

const STYLE = `
  html, body { background: transparent !important; }
  .xp-fond .page.active > :not(.voile), .xp-fond > :not(.page) { visibility: hidden !important; }
  .xp-iso, .xp-iso .page { background: transparent !important; }
  .xp-iso::before, .xp-iso::after, .xp-iso .page::before, .xp-iso .page::after { display: none !important; }
  .xp-iso * { visibility: hidden !important; }
  .xp-iso [data-xp-cible] { visibility: visible !important; }
  .xp-iso [data-xp-cible="tout"] * { visibility: visible !important; }
  .xp-iso [data-xp-cible="boite"] { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; -webkit-text-stroke: 0 !important; }
  .xp-iso [data-xp-cible="boite"] > * { visibility: hidden !important; }
  .dp-outils { display: none !important; }
`;

(async () => {
  const [, , fichier, dossier] = process.argv;
  if (!fichier || !dossier) { console.log('usage : node exporter_pptx.js presentation.html dossier/'); process.exit(2); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.log('PAS_DE_NAVIGATEUR'); process.exit(3); }
  let nav;
  try { nav = await chromium.launch(); } catch (e) {
    try { nav = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }); } catch (e2) { console.log('PAS_DE_NAVIGATEUR'); process.exit(3); }
  }
  fs.mkdirSync(dossier, { recursive: true });
  const page = await nav.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(fichier) + '?fixe');
  await page.waitForFunction(() => window.Diapo, null, { timeout: 10000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.addStyleTag({ content: STYLE });
  const { pages, fenetres, titre } = await page.evaluate(() => ({ pages: Diapo.pages, fenetres: Diapo.fenetres, titre: document.title }));
  const plan = { titre, diapos: [] };
  let compteur = 0;
  for (const [genre, ids] of [['page', pages], ['fenetre', fenetres]]) {
    for (const id of ids) {
      await page.evaluate(([g, i]) => { Diapo.fermer(); if (g === 'page') Diapo.aller(i); else Diapo.ouvrir(i); }, [genre, id]);
      await page.waitForTimeout(120);
      const d = { id, genre, fond: null, items: [], notes: [] };
      if (genre === 'page') {
        await page.evaluate(() => document.querySelector('.diapo').classList.add('xp-fond'));
        d.fond = `fond-${id}.png`;
        await page.screenshot({ path: path.join(dossier, d.fond) });
        await page.evaluate(() => document.querySelector('.diapo').classList.remove('xp-fond'));
      }
      const releve = await page.evaluate(RELEVE);
      d.notes = releve.notes;
      await page.evaluate(() => document.querySelector('.diapo').classList.add('xp-iso'));
      for (const it of releve.items) {
        if (it.type === 'image') {
          const nom = `el-${++compteur}.png`;
          await page.evaluate(([n, mode]) => document.querySelector(`[data-xp="${n}"]`).setAttribute('data-xp-cible', mode), [it.n, it.mode]);
          const clip = { x: Math.max(0, it.x), y: Math.max(0, it.y), width: Math.min(1200 - Math.max(0, it.x), it.w - (Math.max(0, it.x) - it.x)), height: Math.min(675 - Math.max(0, it.y), it.h - (Math.max(0, it.y) - it.y)) };
          if (clip.width >= 1 && clip.height >= 1) {
            await page.screenshot({ path: path.join(dossier, nom), clip, omitBackground: true });
            Object.assign(it, { fichier: nom, x: clip.x, y: clip.y, w: clip.width, h: clip.height });
          }
          await page.evaluate(n => document.querySelector(`[data-xp="${n}"]`).removeAttribute('data-xp-cible'), it.n);
        }
        if (it.type !== 'image' || it.fichier) d.items.push(it);
      }
      await page.evaluate(() => { document.querySelector('.diapo').classList.remove('xp-iso'); document.querySelectorAll('[data-xp]').forEach(e => e.removeAttribute('data-xp')); });
      plan.diapos.push(d);
    }
  }
  await nav.close();
  fs.writeFileSync(path.join(dossier, 'plan.json'), JSON.stringify(plan));
  console.log(`RELEVE_OK ${plan.diapos.length} diapositives`);
})();
