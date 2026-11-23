// Parcours de l'hôpital 3D dans Chromium : chargement sans erreur, chaque personne atteignable à pied depuis
// le hall (portes ouvertes), chaque conversation ouvre l'exercice à la bonne étape, affichage sur téléphone.
// Depuis outils/hopital : NODE_PATH=/opt/node22/lib/node_modules CHROMIUM=/opt/pw-browsers/chromium node tests/parcours.mjs
import { chromium } from 'playwright';
import { servir } from '../../cabinet/tests/serveur.mjs';

const srv = await servir();
const nav = await chromium.launch({executablePath: process.env.CHROMIUM || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
let echecs = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  ÉCHEC ') + m); if (!c) echecs++; };

async function ouvrir(options){
  const p = await nav.newPage(options);
  const err = [];
  p.on('pageerror', e => err.push(e.message));
  p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  await p.goto(srv.url + 'outils/hopital/index.html');
  await p.waitForFunction(() => !document.getElementById('b-entrer').disabled, null, {timeout: 300000});
  return {p, err};
}

// 1. ordinateur : chargement, accessibilité de chaque personne, conversations
{
  const {p, err} = await ouvrir({viewport: {width: 1280, height: 720}});
  await p.click('#b-entrer');
  const r = await p.evaluate(() => {
    for (const g of Object.values(portes)) { g.ouverte = true; g.angle = 1.5; }
    // parcours en largeur sur une grille de 10 cm, depuis la position de départ, avec la vraie fonction de collision
    const pas = 0.1, vus = new Set(), file = [[Math.round(J.x / pas), Math.round(J.z / pas)]];
    vus.add(file[0].join(','));
    while (file.length){
      const [i, k] = file.shift();
      for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
        const c = [i + di, k + dk], cle = c.join(',');
        if (vus.has(cle) || !libre(c[0] * pas, c[1] * pas)) continue;
        vus.add(cle); file.push(c);
      }
    }
    const res = {};
    for (const [code, g] of Object.entries(gens)){
      let mieux = 99;
      for (const cle of vus){ const [i, k] = cle.split(',').map(Number); mieux = Math.min(mieux, Math.hypot(i * pas - g.p[0], k * pas - g.p[2])); }
      res[code] = +mieux.toFixed(2);
    }
    return {res, cases: vus.size};
  });
  ok(r.cases > 2000, `zone praticable : ${r.cases} cases de 10 cm`);
  for (const [code, d] of Object.entries(r.res)) ok(d < 1.6, `${code} atteignable (à ${d} m au plus près)`);
  for (const code of ['AC', 'DL', 'DB', 'DR', 'DN', 'DP', 'DM']){
    await p.evaluate(c => { fermerPanneau(); parler(c); }, code);
    await p.waitForTimeout(400);
    const e = await p.evaluate(() => etat());
    ok(e.ecran === 'panneau' && e.parle === code, `parler à ${code} ouvre l'enquête`);
  }
  await p.evaluate(() => fermerPanneau());
  ok(err.length === 0, `aucune erreur en console${err.length ? ' : ' + err.join(' | ') : ''}`);
  await p.close();
}

// 2. téléphone (390 px) : la page se charge, la manette tactile s'affiche
{
  const {p, err} = await ouvrir({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true});
  const large = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(large <= 390, `pas de défilement horizontal sur téléphone (${large} px)`);
  await p.tap('#b-entrer');
  await p.waitForTimeout(500);
  ok(err.length === 0, `téléphone : aucune erreur${err.length ? ' : ' + err.join(' | ') : ''}`);
  await p.close();
}
await nav.close(); srv.fermer();
console.log(echecs ? `${echecs} échec(s)` : 'parcours de l’hôpital : tout est bon');
process.exit(echecs ? 1 : 0);
