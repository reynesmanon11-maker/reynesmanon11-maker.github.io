// Parcours de référence dans Chromium (Playwright) : tout ce qu'un élève fait dans le cabinet.
//   node tests/parcours.mjs      (depuis outils/cabinet/ ; CHROMIUM=/chemin pour un autre binaire)
// Il vérifie aujourd'hui la version légère ; chaque étape de la migration vers Three.js
// devra le faire passer aussi sur la nouvelle page, sans rien perdre en route.
// Le navigateur de test dessine la 3D par logiciel : il est lent, donc on fait avancer
// la marche et les animations par appels directs (deplacer, majInspection) plutôt
// qu'en attendant en temps réel.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { servir, RACINE } from './serveur.mjs';

// require (et non import) suit NODE_PATH : Playwright peut être installé ailleurs que dans le projet.
const { chromium } = createRequire(import.meta.url)('playwright');

const { url: SITE, fermer } = await servir();
const LEGERE = `${SITE}outils/cabinet_curiosites.html`;
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const exe = process.env.CHROMIUM || process.env.PLAYWRIGHT_CHROMIUM;
const nav = await chromium.launch(exe ? { executablePath: exe, args: ARGS } : { args: ARGS });
const resultats = [];

async function contexte(opts = {}) {
  const ctx = await nav.newContext({ locale: 'fr-FR', viewport: { width: 1280, height: 800 }, ...opts });
  const p = await ctx.newPage();
  p.erreurs = [];
  // l'icône d'onglet absente d'une page de test n'est pas une erreur du cabinet
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text() + (m.location().url || ''))) p.erreurs.push(m.text()); });
  p.on('pageerror', (e) => p.erreurs.push(e.message));
  return { ctx, p };
}
async function ouvrir(p, adresse = LEGERE) {
  await p.goto(adresse);
  await p.waitForFunction(() => typeof etat !== 'undefined' && (etat.pret || /indisponible/.test(document.getElementById('b-entrer').textContent)), null, { timeout: 90000 });
  assert.ok(await p.evaluate(() => etat.pret), 'la 3D n’a pas démarré : ' + await p.textContent('#chargement'));
}
async function entrer(p) { await p.click('#b-entrer'); assert.equal(await p.evaluate(() => etat.ecran), 'jeu'); }
// marche « au clavier » : touches tenues pendant n pas de 50 ms
const marcher = (p, x, z, yaw, touche, n) => p.evaluate(([x, z, yaw, touche, n]) => {
  J.x = x; J.z = z; J.yaw = yaw; J.pitch = 0;
  touches.add(touche); for (let i = 0; i < n; i++) deplacer(0.05); touches.clear();
  return [J.x, J.z];
}, [x, z, yaw, touche, n]);
const finirAnimation = (p) => p.evaluate(() => { for (let i = 0; i < 40 && etat.inspection && (etat.inspection.sens < 0 || etat.inspection.t < 1); i++) majInspection(0.05); });
async function etape(nom, f) {
  try { await f(); resultats.push(['ok', nom]); }
  catch (e) { resultats.push(['ÉCHEC', nom, e.message.split('\n').filter(Boolean).slice(0, 4).join(' ')]); }
}

await etape('ordinateur : démarre sans erreur et relit les textes de curiosites.js', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p);
  assert.equal(await p.evaluate(() => etat.sourceDonnees), 'fichier');
  assert.equal(await p.textContent('#b-entrer'), 'Entrer dans le cabinet');
  assert.deepEqual(p.erreurs, []);
  await ctx.close();
});

const { ctx: ctxBureau, p } = await contexte();
await ouvrir(p);
await entrer(p);

await etape('collisions : le mur est arrête, la porte mène à la serre', async () => {
  const [xMur] = await marcher(p, 5.0, -3.0, Math.PI / 2, 'KeyW', 60);
  assert.ok(xMur > 5.6 && xMur < 5.73, `arrêt devant le mur attendu vers x = 5,72, obtenu ${xMur}`);
  const [xPorte] = await marcher(p, 5.0, 0, Math.PI / 2, 'KeyW', 30);
  assert.ok(xPorte > 6.5, `on devait entrer dans la serre (x > 6,5), obtenu ${xPorte}`);
  const [xBassin] = await marcher(p, 7.0, 0, Math.PI / 2, 'KeyW', 60);
  assert.ok(xBassin < 7.75, `le bassin (x = 8) devait arrêter, obtenu ${xBassin}`);
});

await etape('visée : la planche est visée, son nom reste secret avant la première saisie', async () => {
  await p.evaluate(() => { J.x = -4.6; J.z = 0; J.yaw = -Math.PI / 2; J.pitch = 0.45; cam.pos = [J.x, 1.6, J.z]; majCible(); });
  assert.equal(await p.evaluate(() => etat.cible && etat.cible.id), 'planche');
  assert.match(await p.textContent('#cible'), /Une curiosité/);
});

await etape('saisie à la souris, réponse au clavier, correction, Échap', async () => {
  await p.mouse.click(640, 400);
  assert.equal(await p.evaluate(() => etat.inspection && etat.inspection.ob.id), 'planche');
  assert.ok(await p.isVisible('#fiche'));
  assert.equal(await p.textContent('#f-nom'), 'Planche des membres antérieurs');
  await p.keyboard.press('1');
  assert.ok(await p.isVisible('#f-retour .retour'), 'pas de correction affichée');
  assert.equal(await p.locator('#f-choix button.juste').count(), 1, 'la bonne réponse doit être marquée');
  await p.keyboard.press('Escape');
  await finirAnimation(p);
  assert.ok(!(await p.isVisible('#fiche')));
  assert.equal(await p.evaluate(() => etat.inspection), null);
  const memoire = await p.evaluate(() => JSON.parse(localStorage.getItem('cabinet-curiosites-v1')));
  assert.equal(memoire.v, 1);
  assert.ok(memoire.vus.planche && memoire.rep.college.planche, 'réponse non mémorisée');
  assert.deepEqual(Object.keys(memoire).sort(), ['bilanVu', 'niveau', 'rep', 'v', 'vus']);
});

await etape('les 14 curiosités se saisissent, chacune avec sa fiche', async () => {
  const noms = await p.evaluate(() => OBJETS.map((ob) => {
    saisir(ob); for (let i = 0; i < 12; i++) majInspection(0.05);
    const nom = document.getElementById('f-nom').textContent;
    reposer(); for (let i = 0; i < 12 && etat.inspection; i++) majInspection(0.05);
    return [ob.id, nom, parId[ob.id].nom];
  }));
  assert.equal(noms.length, 14);
  for (const [id, affiche, attendu] of noms) assert.equal(affiche, attendu, id);
  assert.match(await p.textContent('#compteur'), /14 \/ 14/);
});

await etape('carnet : 14 entrées, ouvert par la touche C, fermé par Échap', async () => {
  await p.keyboard.press('KeyC');
  assert.ok(await p.isVisible('#m-carnet'));
  assert.equal(await p.locator('#carnet-grille .entree').count(), 14);
  assert.equal(await p.locator('#carnet-grille .entree.inconnue').count(), 0);
  await p.keyboard.press('Escape');
  assert.ok(!(await p.isVisible('#m-carnet')));
});

await etape('bilan : s’ouvre une seule fois, quand toutes les questions sont traitées', async () => {
  await p.evaluate(() => { CURIOSITES.forEach((c) => { progression.rep.college[c.id] = progression.rep.college[c.id] || { ok: true, choix: 0 }; }); progression.bilanVu.college = false; saisir(OBJETS[0]); for (let i = 0; i < 12; i++) majInspection(0.05); reposer(); for (let i = 0; i < 12 && etat.inspection; i++) majInspection(0.05); });
  assert.ok(await p.isVisible('#m-bilan'));
  assert.equal(await p.evaluate(() => progression.bilanVu.college), true);
  await p.evaluate(() => fermerModales());
});

await etape('impression du carnet : un tableau de 14 lignes', async () => {
  const lignes = await p.evaluate(() => { window.print = () => {}; imprimer(); return document.querySelectorAll('#impression tr').length; });
  assert.equal(lignes, 15);
});

await etape('progression conservée après rechargement', async () => {
  const bonnes = await p.evaluate(() => compteBonnes('college'));
  await ouvrir(p);
  await entrer(p);
  assert.equal(await p.textContent('#compteur'), `🔍 14 / 14 curiosités · ✓ ${bonnes}`);
});

await etape('ordinateur : aucune erreur JavaScript pendant tout le parcours', async () => { assert.deepEqual(p.erreurs, []); });
await ctxBureau.close();

await etape('texte corrigé dans curiosites.js : visible dans la version légère sans synchroniser', async () => {
  const { ctx, p } = await contexte();
  await p.route('**/outils/cabinet/js/donnees/curiosites.js', async (r) => {
    const corps = (await (await r.fetch()).text()).replace('nom: "Nautile"', 'nom: "Nautile corrigé"');
    await r.fulfill({ body: corps, contentType: 'text/javascript' });
  });
  await ouvrir(p);
  assert.equal(await p.evaluate(() => parId.nautile.nom), 'Nautile corrigé');
  await entrer(p);
  await p.evaluate(() => saisir(OBJETS.find((o) => o.id === 'nautile')));
  assert.equal(await p.textContent('#f-nom'), 'Nautile corrigé');
  await ctx.close();
});

await etape('curiosites.js abîmé : la version légère garde sa copie et démarre', async () => {
  const { ctx, p } = await contexte();
  await p.route('**/outils/cabinet/js/donnees/curiosites.js', (r) => r.fulfill({ body: 'export const CURIOSITES = [ "oubli', contentType: 'text/javascript' }));
  await ouvrir(p);
  assert.equal(await p.evaluate(() => etat.sourceDonnees), 'copie');
  assert.equal(await p.evaluate(() => parId.nautile.nom), 'Nautile');
  await ctx.close();
});

await etape('ouverte par double-clic (file://) : démarre avec sa copie, sans erreur', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, pathToFileURL(join(RACINE, 'outils', 'cabinet_curiosites.html')).href);
  assert.equal(await p.evaluate(() => etat.sourceDonnees), 'copie');
  await entrer(p);
  assert.deepEqual(p.erreurs, []);
  await ctx.close();
});

await etape('téléphone 390 px : saisie au doigt, pas de défilement, hauteur stable (DPR 2)', async () => {
  const { ctx, p } = await contexte({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ouvrir(p);
  const avant = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
  await p.tap('#b-entrer');
  assert.equal(await p.evaluate(() => etat.tactile), true);
  await p.evaluate(() => { J.x = 1.95; J.z = -3.3; J.yaw = 0; J.pitch = 0; cam.pos = [J.x, 1.6, J.z]; majCible(); });
  assert.equal(await p.evaluate(() => etat.cible && etat.cible.id), 'ammonite');
  assert.ok(await p.isVisible('#b-saisir'), 'le bouton ✋ doit apparaître');
  await p.tap('#b-saisir');
  assert.ok(await p.isVisible('#fiche'));
  await p.waitForTimeout(1500);
  const apres = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
  assert.deepEqual(avant, [390, 844]);
  assert.deepEqual(apres, [390, 844]);
  assert.deepEqual(p.erreurs, []);
  await ctx.close();
});

await etape('Three.js r187 se charge depuis le dépôt et ouvre un rendu WebGL 2', async () => {
  const { ctx, p } = await contexte();
  await p.goto(`${SITE}outils/cabinet/package.json`);
  const r = await p.evaluate(async () => {
    const THREE = await import('/outils/cabinet/vendor/three-r187/three.module.js');
    const rendu = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') });
    const scene = new THREE.Scene(); scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
    rendu.render(scene, new THREE.PerspectiveCamera());
    return [THREE.REVISION, rendu.getContext() instanceof WebGL2RenderingContext];
  });
  assert.deepEqual(r, ['187', true]);
  assert.deepEqual(p.erreurs, []);
  await ctx.close();
});

await nav.close();
fermer();
for (const [etat, nom, detail] of resultats) console.log(`${etat === 'ok' ? '✓' : '✗'} ${nom}${detail ? `\n    → ${detail}` : ''}`);
const echecs = resultats.filter((r) => r[0] !== 'ok').length;
console.log(`\n${resultats.length - echecs} réussis, ${echecs} en échec`);
process.exit(echecs ? 1 : 0);
