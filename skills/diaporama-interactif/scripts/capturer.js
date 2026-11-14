#!/usr/bin/env node
/* Relit un diaporama assemblé dans un vrai navigateur, quand il y en a un.

     node scripts/capturer.js sortie.html dossier-de-captures

   Produit une image par page et par fenêtre, puis affiche :
     - les erreurs JavaScript éventuelles ;
     - les défauts de mise en page repérés par le moteur (texte qui dépasse, blocs qui se chevauchent).
   Sans Playwright ni Chromium, le script le dit et s'arrête sans erreur : la vérification
   visuelle est alors à faire en ouvrant le fichier avec « ?controle » au bout de l'adresse. */
const path = require('path');
const fs = require('fs');

(async () => {
  const [, , fichier, dossier = 'captures'] = process.argv;
  if (!fichier) { console.log('usage : node capturer.js sortie.html [dossier]'); process.exit(2); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) {
    console.log('Playwright absent : pas de capture possible ici. Ouvre le fichier avec ?controle pour vérifier à l’œil.');
    return;
  }
  let nav;
  try { nav = await chromium.launch(); } catch (e) {
    try { nav = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }); }
    catch (e2) { console.log('Aucun navigateur utilisable : ' + String(e2).split('\n')[0]); return; }
  }
  fs.mkdirSync(dossier, { recursive: true });
  const page = await nav.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1 });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.goto('file://' + path.resolve(fichier) + '?fixe');
  await page.waitForFunction(() => window.Diapo, null, { timeout: 8000 }).catch(() => {});
  if (!(await page.evaluate(() => !!window.Diapo))) {
    console.log('Le moteur n’a pas démarré.\n' + erreurs.join('\n')); await nav.close(); process.exit(1);
  }
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const { pages, fenetres } = await page.evaluate(() => ({ pages: Diapo.pages, fenetres: Diapo.fenetres }));
  let n = 0;
  for (const id of pages) {
    await page.evaluate(i => Diapo.aller(i), id);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dossier, `page-${String(++n).padStart(2, '0')}-${id}.png`) });
  }
  n = 0;
  for (const id of fenetres) {
    await page.evaluate(i => Diapo.ouvrir(i), id);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dossier, `fenetre-${String(++n).padStart(2, '0')}-${id}.png`) });
  }
  await page.evaluate(() => Diapo.fermer());
  const soucis = await page.evaluate(() => Diapo.controle());

  // Rendu sur un écran de téléphone tenu en hauteur : la scène doit tenir entière, sans défilement
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(i => Diapo.aller(i), pages[0]);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(dossier, 'telephone.png') });
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1);
  await nav.close();

  console.log(`${pages.length} page(s) et ${fenetres.length} fenêtre(s) capturées dans ${dossier}/`);
  console.log(erreurs.length ? 'ERREURS JavaScript :\n  ' + erreurs.join('\n  ') : 'Aucune erreur JavaScript.');
  console.log(soucis.length ? 'Mise en page à revoir :\n' + soucis.map(s => `  [${s.page}] ${s.quoi} : ${s.element}`).join('\n') : 'Mise en page : rien à signaler.');
  if (deborde) console.log('Sur téléphone, la page défile : ce ne devrait pas être le cas.');
  process.exit(erreurs.length ? 1 : 0);
})();
