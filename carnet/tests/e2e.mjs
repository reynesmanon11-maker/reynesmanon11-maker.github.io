// Tests de bout en bout dans Chromium (Playwright) : l'appli servie telle quelle, en mode démo.
//   node tests/e2e.mjs          (Playwright doit être installé ; CHROMIUM=/chemin pour un autre binaire)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { servir } from './serveur.mjs';

// require (et non import) suit NODE_PATH : Playwright peut être installé ailleurs que dans le projet.
const { chromium } = createRequire(import.meta.url)('playwright');

const { url: URL, fermer } = await servir();
const nav = await chromium.launch(process.env.CHROMIUM || process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.CHROMIUM || process.env.PLAYWRIGHT_CHROMIUM } : {});
const resultats = [];
const erreurs = [];

async function contexte(opts = {}) {
  const ctx = await nav.newContext({ timezoneId: 'Europe/Paris', locale: 'fr-FR', viewport: { width: 1280, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) erreurs.push(m.text()); });
  p.on('pageerror', (e) => erreurs.push(e.message));
  // Un jeudi matin d'école, pour que la démo ait toujours la même allure.
  await p.clock.setFixedTime(new Date('2026-11-05T10:50:00+01:00'));
  return { ctx, p };
}
const rendu = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
async function demo(p) {
  await p.goto(URL, { waitUntil: 'load' });
  await p.getByRole('button', { name: /Essayer avec un exemple/ }).click();
  await p.waitForSelector('.module');
}
async function etape(nom, f) {
  try { await f(); resultats.push(['ok', nom]); } catch (e) { resultats.push(['ÉCHEC', nom, e.message.split('\n')[0]]); }
}

await etape('démarrage : sans réglage, la mise en route s’ouvre', async () => {
  const { ctx, p } = await contexte();
  await p.goto(URL);
  await p.waitForSelector('.choix');
  assert.equal(await p.evaluate(() => location.hash), '#/demarrer');
  await ctx.close();
});

await etape('démo : tableau de bord complet, aucune erreur', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  const titres = await p.$$eval('.module h2', (h) => h.map((x) => x.textContent.trim()));
  assert.ok(titres.includes("Aujourd'hui") && titres.includes('Où en sont mes classes'), titres.join(', '));
  assert.match(await p.textContent('.resume'), /à valider/);
  await ctx.close();
});

await etape('valider un cours : le point d’arrêt fait glisser la suite', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  // Le cours de 602 de ce matin est à valider.
  const carte = p.locator('.module[data-module="aujourdhui"] .cours', { hasText: '602' });
  await carte.getByRole('button', { name: /Où en est-on/ }).click();
  await p.waitForSelector('dialog.feuille[open] .arret');
  const avant = await p.evaluate(() => [...document.querySelectorAll('dialog .puce[aria-pressed="true"]')].map((b) => b.textContent.trim()));
  assert.equal(avant.length, 1, 'un point présélectionné');
  // On s'est arrêté plus tôt que prévu : « Réglage du microscope ».
  await p.locator('dialog .puce', { hasText: 'Réglage du microscope ✓' }).click();
  await p.getByRole('button', { name: /Enregistrer/ }).click();
  await p.waitForFunction(() => /fait/.test(document.querySelector('dialog .cours-haut')?.textContent || ''));
  await p.keyboard.press('Escape');
  // Le prochain cours de la 602 reprend à « Observation ».
  const etat = await p.evaluate(async () => (await import('./js/etat.js')).calc().plan.parClasse['6G2'].positionFinale);
  assert.ok(etat, 'plan de la 602 présent');
  const reprise = await p.evaluate(async () => {
    const { calc } = await import('./js/etat.js');
    const c = calc();
    const suivant = c.plan.parClasse['6G2'].prochains[0];
    const s = c.plan.parCreneau[suivant.cle].segments[0];
    const { reprise } = await import('./js/moteur.js');
    return reprise(s, c.v.etapes[s.eid]).texte;
  });
  assert.equal(reprise, 'Observation');
  await ctx.close();
});

await etape('« Comme prévu » en un toucher', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  const avant = await p.evaluate(async () => (await import('./js/etat.js')).calc().plan.parClasse['5G3'].aValider);
  await p.locator('.bandeau button', { hasText: '503' }).first().click();
  await p.waitForSelector('dialog.feuille[open] .arret');
  await p.getByRole('button', { name: 'Comme prévu' }).click();
  await rendu(p);
  const apres = await p.evaluate(async () => (await import('./js/etat.js')).calc().plan.parClasse['5G3'].aValider);
  assert.equal(apres, avant - 1);
  await ctx.close();
});

await etape('personnaliser : déplacer, élargir, masquer — gardé au rechargement', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.getByRole('button', { name: /Personnaliser/ }).click();
  const ordre = () => p.$$eval('.module', (m) => m.map((x) => x.dataset.module));
  const o1 = await ordre();
  await rendu(p);
  await p.locator('.module[data-module="preparer"] [data-action="module-monter"]').click();
  await rendu(p);
  await p.locator('.module[data-module="taches"] [data-action="module-taille"][data-taille="L"]').click();
  await rendu(p);
  await p.locator('.module[data-module="notes"] [data-action="module-masquer"]').click();
  await rendu(p);
  const o2 = await ordre();
  assert.equal(o2[0], 'preparer');
  assert.ok(!o2.includes('notes'));
  assert.notDeepEqual(o1, o2);
  await p.getByRole('button', { name: /Terminé/ }).click();
  await p.waitForTimeout(400);
  await p.reload();
  await p.waitForSelector('.module');
  assert.deepEqual(await ordre(), o2);
  assert.ok(await p.locator('.module[data-module="taches"].taille-L').count());
  await ctx.close();
});

await etape('glisser-déposer un module par sa poignée', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.getByRole('button', { name: /Personnaliser/ }).click();
  await p.waitForSelector('.tableau.organiser');
  const poignee = p.locator('.module[data-module="libres"] [data-poignee]');
  await poignee.scrollIntoViewIfNeeded();
  const cible = p.locator('.module[data-module="aujourdhui"]');
  const a = await poignee.boundingBox(), b = await cible.boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  for (let k = 1; k <= 12; k++) await p.mouse.move(a.x + (b.x + 40 - a.x) * k / 12, a.y + (b.y + 20 - a.y) * k / 12);
  await p.mouse.up();
  await rendu(p);
  const ordre = await p.$$eval('.module', (m) => m.map((x) => x.dataset.module));
  assert.equal(ordre[0], 'libres', ordre.join(','));
  await ctx.close();
});

await etape('options d’un module : « À préparer » en compteur', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.locator('.module[data-module="preparer"] .droite > [data-action="module-options"]').click();
  await p.locator('dialog input[value="compteur"]').check();
  await p.getByRole('button', { name: 'Terminé' }).click();
  await rendu(p);
  assert.ok(await p.locator('.module[data-module="preparer"] .compteur').count());
  await ctx.close();
});

await etape('thème sombre gardé au rechargement', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.click('#bouton-theme');
  await rendu(p);
  assert.equal(await p.getAttribute('html', 'data-theme'), 'dark');
  await p.waitForTimeout(400);
  await p.reload();
  await p.waitForSelector('.module');
  assert.equal(await p.getAttribute('html', 'data-theme'), 'dark');
  const fond = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(fond, 'rgb(27, 31, 28)');
  await ctx.close();
});

await etape('tâches : ajout rapide puis cochée', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.fill('#tache-rapide', 'Réserver la salle info');
  await p.press('#tache-rapide', 'Enter');
  const tache = p.locator('.module[data-module="taches"] label', { hasText: 'Réserver la salle info' });
  await tache.waitFor();
  await tache.locator('input').check();
  await rendu(p);
  assert.equal(await p.locator('.module[data-module="taches"] label', { hasText: 'Réserver la salle info' }).count(), 0);
  await ctx.close();
});

await etape('classes : nouvelle étape avec jalons, remontée dans la file', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/classes');
  const carte = p.locator('#classe-5G1');
  await carte.getByRole('button', { name: /Nouvelle étape/ }).click();
  await p.fill('dialog input[name="titre"]', 'Activité 8 – Germination des graines');
  await p.selectOption('dialog select[name="duree"]', '1.5');
  await p.getByRole('button', { name: /Enregistrer/ }).click();
  await p.waitForSelector('#classe-5G1 .etape >> text=Germination');
  const titres = () => p.$$eval('#classe-5G1 .etape > span:first-child', (s) => s.map((x) => x.textContent.trim()));
  await rendu(p);
  const t1 = await titres();
  assert.equal(t1[t1.length - 1], 'Activité 8 – Germination des graines');
  await p.locator('#classe-5G1 .etape').last().locator('[data-action="etape-monter"]').click();
  await rendu(p);
  const t2 = await titres();
  assert.equal(t2[t2.length - 2], 'Activité 8 – Germination des graines');
  // L'étape est partagée par le niveau : la 503 peut la reprendre.
  const options = await p.$$eval('#classe-5G3 select[data-change="etape-reprendre"] option', (o) => o.map((x) => x.textContent));
  assert.ok(options.some((x) => /Germination/.test(x)));
  await ctx.close();
});

await etape('semaine : grille, liste, semaine suivante', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/semaine');
  assert.ok(await p.locator('.grille .bloc').count() > 10);
  assert.ok(await p.locator('.bloc.perso').count() > 0, 'vie perso affichée');
  await p.getByRole('button', { name: 'Semaine suivante' }).click();
  await rendu(p);
  assert.match(await p.textContent('.semaine-outils h2'), /9 nov/);
  await p.getByRole('button', { name: /Vie perso/ }).click();
  await rendu(p);
  assert.equal(await p.locator('.bloc.perso').count(), 0);
  await ctx.close();
});

await etape('téléphone (390 px) : aucune page ne déborde', async () => {
  const { ctx, p } = await contexte({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await demo(p);
  for (const r of ['accueil', 'semaine', 'classes', 'taches', 'reglages']) {
    await p.goto(`${URL}#/${r}`);
    await p.waitForTimeout(150);
    const l = await p.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(l <= 390, `${r} : ${l} px`);
  }
  await ctx.close();
});

await etape('hors ligne : l’appli se rouvre sans réseau', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload(); // tout de suite : vérifie aussi que rien ne se perd en fermant vite
  await p.waitForSelector('.module');
  await p.waitForTimeout(300);
  await ctx.setOffline(true);
  await p.reload();
  await p.waitForSelector('.module', { timeout: 5000 });
  assert.ok(await p.locator('.module').count() > 3);
  await ctx.close();
});

await etape('import du carnet de claude.ai', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/reglages');
  await p.waitForSelector('input[data-change="importer"]', { state: 'attached' });
  const fichier = JSON.stringify({
    seances: { s1: { titre: 'Activité importée', duree: 1, niveau: '5e' } },
    classes: { '5G1': { nom: '501', file: [{ u: 'z1', sid: 's1', fait: 0.5 }] } },
    journal: {},
  });
  await p.setInputFiles('input[data-change="importer"]', { name: 'carnet.json', mimeType: 'application/json', buffer: Buffer.from(fichier) });
  await p.waitForFunction(() => /Carnet SVT importé/.test(document.querySelector('.toast')?.textContent || ''));
  await p.goto(URL + '#/classes');
  await p.waitForFunction(() => /Activité importée/.test(document.getElementById('classe-5G1')?.textContent || ''));
  await ctx.close();
});

await etape('partager : QR code, lien et message pour un collègue', async () => {
  const { ctx, p } = await contexte({ permissions: ['clipboard-read', 'clipboard-write'] });
  await demo(p);
  await p.goto(URL + '#/reglages');
  await p.getByRole('button', { name: /Partager, ou ouvrir sur un téléphone/ }).click();
  await p.waitForSelector('dialog.feuille[open] svg.qr');
  assert.equal((await p.textContent('#adresse-appli')).trim(), 'reynesmanon11-maker.github.io/carnet');
  // Le dessin correspond, module pour module, au QR code calculé pour l'adresse.
  const identique = await p.evaluate(async () => {
    const { qr } = await import('./js/qr.js');
    const { taille, modules } = qr('https://reynesmanon11-maker.github.io/carnet/');
    const d = document.querySelector('svg.qr path').getAttribute('d');
    const vu = Array.from({ length: taille }, () => new Array(taille).fill(false));
    for (const [, x, y, l] of d.matchAll(/M(\d+) (\d+)h(\d+)/g)) for (let k = 0; k < +l; k++) vu[+y - 4][+x - 4 + k] = true;
    return JSON.stringify(vu) === JSON.stringify(modules);
  });
  assert.ok(identique, 'le SVG dessine exactement le QR code de l’adresse');
  await p.getByRole('button', { name: 'Copier le lien' }).click();
  assert.equal(await p.evaluate(() => navigator.clipboard.readText()), 'https://reynesmanon11-maker.github.io/carnet/');
  await p.locator('dialog summary').click();
  await p.getByRole('button', { name: 'Copier le message' }).click();
  assert.match(await p.evaluate(() => navigator.clipboard.readText()), /1\. Ouvre https:\/\/reynesmanon11-maker\.github\.io\/carnet\//);
  await ctx.close();
});

await etape('installer : proposé quand le navigateur le permet, d’un toucher ; « Plus tard » le fait taire', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  assert.equal(await p.locator('.bandeau.installer').count(), 0, 'rien tant que le navigateur ne propose rien');
  const proposer = () => p.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => { window.__invite = (window.__invite || 0) + 1; };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  await proposer();
  await p.waitForSelector('.bandeau.installer');
  await p.locator('.bandeau.installer').getByRole('button', { name: /Installer/ }).click();
  await p.waitForFunction(() => window.__invite === 1);
  await p.waitForFunction(() => /Carnet installé/.test(document.querySelector('.toast')?.textContent || ''));
  await rendu(p);
  assert.equal(await p.locator('.bandeau.installer').count(), 0, 'le bandeau s’en va');
  await proposer();
  await p.waitForSelector('.bandeau.installer');
  await p.locator('.bandeau.installer').getByRole('button', { name: 'Plus tard' }).click();
  await rendu(p);
  assert.equal(await p.locator('.bandeau.installer').count(), 0);
  await p.reload();
  await p.waitForSelector('.module');
  await proposer();
  await rendu(p);
  assert.equal(await p.locator('.bandeau.installer').count(), 0, 'toujours silencieux après rechargement');
  await ctx.close();
});

await nav.close();
fermer();
for (const r of resultats) console.log(r[0] === 'ok' ? '  ✓' : '  ✗', r[1], r[2] ? `— ${r[2]}` : '');
if (erreurs.length) console.log('\nErreurs de page :\n' + [...new Set(erreurs)].join('\n'));
const echecs = resultats.filter((r) => r[0] !== 'ok').length;
console.log(`\n${resultats.length - echecs}/${resultats.length} parcours réussis${erreurs.length ? `, ${erreurs.length} erreur(s) de page` : ', aucune erreur de page'}`);
process.exit(echecs || erreurs.length ? 1 : 0);
