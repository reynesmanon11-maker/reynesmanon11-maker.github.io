// Exporte en PNG les textures que le jeu dessine (herbier, globe, planche, papillons) pour les réutiliser dans Blender.
// NODE_PATH=… node exporter_canvas.mjs <dossier>   (le dossier « canvas » de l'atelier)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');   // suit NODE_PATH
import { servir } from '../tests/serveur.mjs';
import { writeFileSync } from 'node:fs';
const srv = await servir();
const nav = await chromium.launch();
const page = await nav.newPage();
await page.goto(srv.url + 'outils/cabinet/index.html?qualite=basse');
const res = await page.evaluate(async () => {
  const t = await import('./js/procedural/textures.js');
  const sortie = {};
  for (const nom of ['texHerbier', 'texGlobe', 'texPlanche', 'texPapillons']) {
    const c = t[nom]();
    const cv = c instanceof HTMLCanvasElement ? c : (c.canvas || c);
    sortie[nom] = cv.toDataURL ? cv.toDataURL('image/png') : null;
  }
  return sortie;
});
for (const [k, v] of Object.entries(res)) if (v) writeFileSync(process.argv[2] + '/' + k + '.png', Buffer.from(v.split(',')[1], 'base64'));
console.log(Object.keys(res));
await nav.close(); srv.fermer(); process.exit(0);
