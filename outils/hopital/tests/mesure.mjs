// Mesure des performances de l'hôpital 3D : pour quelques points de vue, appels de dessin, triangles, programmes,
// et temps de calcul par image (page et envoi du dessin), en marchant. Sans carte graphique, les images par seconde
// sont celles du rendu logiciel : elles ne valent qu'en comparaison avant/après.
// NODE_PATH=/opt/node22/lib/node_modules node tests/mesure.mjs [qualite] [ouvertes]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { servir } from '../../cabinet/tests/serveur.mjs';
const qualite = process.argv[2] || 'legere';
const srv = await servir();
const nav = await chromium.launch({executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const p = await nav.newPage({viewport: {width: 1280, height: 720}});
await p.goto(srv.url + `outils/hopital/index.html?perf&qualite=${qualite}`);
await p.waitForFunction(() => !document.getElementById('b-entrer').disabled, null, {timeout: 300000});
await p.evaluate(() => document.getElementById('b-entrer').click());
const VUES = {hall: {x: 3.9, z: 2.6, yaw: -2.64}, couloir: {x: 3.5, z: 0, yaw: -1.5708}, cyto: {x: -6.2, z: -2.0, yaw: -2.3}};
const res = {};
const ouvertes = process.argv[3] === 'ouvertes';
for (const [nom, v] of Object.entries(VUES)){
  await p.evaluate(([v, ouv]) => { Object.assign(J, v, {pitch: -0.05}); if (ouv) for (const g of Object.values(portes)){ g.verrouillee = false; g.ouverte = true; g.angle = 1.6; } }, [v, ouvertes]);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(800); await p.keyboard.up('KeyW');
  await p.evaluate(v => Object.assign(J, v), v);
  await p.waitForTimeout(2600);
  res[nom] = await p.evaluate(() => ({im_s: +perf.fps.toFixed(1), page_ms: +perf.js.toFixed(2), dessin_ms: +perf.rendu.toFixed(1), appels: perf.appels, ktri: Math.round(perf.triangles / 1000), programmes: perf.programmes, textures: perf.textures}));
}
console.log(JSON.stringify({qualite, portes: ouvertes ? 'toutes ouvertes' : 'fermées', ...res}));
await nav.close(); srv.fermer();
