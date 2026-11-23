// Photographie les schémas de l'exercice (SVG) pour en faire des affiches murales.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [fichier, dossier] = process.argv.slice(2);
const nav = await chromium.launch();
const p = await nav.newPage({viewport: {width: 1400, height: 1000}, deviceScaleFactor: 3});
await p.goto('file://' + fichier);
await p.waitForTimeout(800);
const noms = await p.evaluate(() => {
  const box = document.createElement('div');
  box.id = 'affiches';
  box.style.cssText = 'position:absolute;left:0;top:0;z-index:99999;background:#fff';
  document.body.prepend(box);
  const svgs = [...document.querySelectorAll('svg[aria-label]')];
  for (const s of svgs) {
    const d = document.createElement('div');
    d.className = 'aff';
    d.style.cssText = 'background:#fff;padding:14px;display:block;width:' + (s.viewBox.baseVal.width > 400 ? 900 : 360) + 'px';
    const c = s.cloneNode(true);
    c.style.width = '100%';
    c.style.height = 'auto';
    d.appendChild(c);
    box.appendChild(d);
  }
  return svgs.map(s => s.getAttribute('aria-label'));
});
console.log(JSON.stringify(noms));
const els = await p.$$('#affiches .aff');
for (let i = 0; i < els.length; i++) await els[i].screenshot({path: `${dossier}/svg${i}.png`});
await nav.close();
