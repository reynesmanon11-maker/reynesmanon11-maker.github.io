// Parcours de référence dans Chromium (Playwright) : tout ce qu'un élève fait dans le cabinet.
//   node tests/parcours.mjs      (depuis outils/cabinet/ ; CHROMIUM=/chemin pour un autre binaire)
// Le même scénario passe sur les DEUX pages : la version légère (outils/cabinet_curiosites.html)
// et la nouvelle, dessinée par Three.js (outils/cabinet/index.html). Chaque étape de la
// migration doit le réussir sur les deux, sans rien perdre en route. Viennent ensuite les
// vérifications propres à chacune (double-clic hors connexion, repli vers la version légère…).
// Le navigateur de test dessine la 3D par logiciel : il est lent, donc on fait avancer
// la marche et les animations par appels directs (deplacer, majInspection) plutôt
// qu'en attendant en temps réel. Les deux pages exposent les mêmes noms pour cela.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { servir, RACINE } from './serveur.mjs';

// require (et non import) suit NODE_PATH : Playwright peut être installé ailleurs que dans le projet.
const { chromium } = createRequire(import.meta.url)('playwright');

const { url: SITE, fermer } = await servir();
// La nouvelle version est parcourue en qualité moyenne (matières réalistes) : le navigateur
// de test n'a pas de carte graphique, et le choix automatique y prendrait la qualité basse.
const NOUVELLE = `${SITE}outils/cabinet/index.html`;
const PAGES = {
  'version légère': `${SITE}outils/cabinet_curiosites.html`,
  'nouvelle version': `${NOUVELLE}?qualite=moyenne`,
};
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
async function attendre(p) {
  await p.waitForFunction(() => typeof etat !== 'undefined' && (etat.pret || /indisponible/.test(document.getElementById('b-entrer').textContent)), null, { timeout: 120000 });
}
async function ouvrir(p, adresse) {
  await p.goto(adresse);
  await attendre(p);
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

/* ============================================================
   Le scénario commun, rejoué sur chaque page
   ============================================================ */
async function scenarioCommun(nomPage, adresse) {
  const E = (nom, f) => etape(`${nomPage} · ${nom}`, f);

  await E('démarre sans erreur et lit les textes de curiosites.js', async () => {
    const { ctx, p } = await contexte();
    await ouvrir(p, adresse);
    assert.equal(await p.evaluate(() => etat.sourceDonnees), 'fichier');
    assert.equal(await p.textContent('#b-entrer'), 'Entrer dans le cabinet');
    assert.equal(await p.evaluate(() => OBJETS.length), 14);
    assert.deepEqual(p.erreurs, []);
    await ctx.close();
  });

  const { ctx, p } = await contexte();
  await ouvrir(p, adresse);
  await entrer(p);

  await E('collisions : le mur est arrête, la porte mène à la serre, le bassin arrête', async () => {
    const [xMur] = await marcher(p, 5.0, -3.0, Math.PI / 2, 'KeyW', 60);
    assert.ok(xMur > 5.6 && xMur < 5.73, `arrêt devant le mur attendu vers x = 5,72, obtenu ${xMur}`);
    const [xPorte] = await marcher(p, 5.0, 0, Math.PI / 2, 'KeyW', 30);
    assert.ok(xPorte > 6.5, `on devait entrer dans la serre (x > 6,5), obtenu ${xPorte}`);
    const [xBassin] = await marcher(p, 7.0, 0, Math.PI / 2, 'KeyW', 60);
    assert.ok(xBassin < 7.75, `le bassin (x = 8) devait arrêter, obtenu ${xBassin}`);
  });

  await E('visée : la planche est visée, son nom reste secret avant la première saisie', async () => {
    await p.evaluate(() => { J.x = -4.6; J.z = 0; J.yaw = -Math.PI / 2; J.pitch = 0.45; cam.pos = [J.x, 1.6, J.z]; majCible(); });
    assert.equal(await p.evaluate(() => etat.cible && etat.cible.id), 'planche');
    assert.match(await p.textContent('#cible'), /Une curiosité/);
  });

  await E('saisie à la souris, réponse au clavier, correction, Échap, mémoire', async () => {
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

  await E('les 14 curiosités se saisissent, chacune avec sa fiche', async () => {
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

  await E('carnet : 14 entrées, ouvert par la touche C, fermé par Échap', async () => {
    await p.keyboard.press('KeyC');
    assert.ok(await p.isVisible('#m-carnet'));
    assert.equal(await p.locator('#carnet-grille .entree').count(), 14);
    assert.equal(await p.locator('#carnet-grille .entree.inconnue').count(), 0);
    await p.keyboard.press('Escape');
    assert.ok(!(await p.isVisible('#m-carnet')));
  });

  await E('bilan : s’ouvre une seule fois, quand toutes les questions sont traitées', async () => {
    await p.evaluate(() => { CURIOSITES.forEach((c) => { progression.rep.college[c.id] = progression.rep.college[c.id] || { ok: true, choix: 0 }; }); progression.bilanVu.college = false; saisir(OBJETS[0]); for (let i = 0; i < 12; i++) majInspection(0.05); reposer(); for (let i = 0; i < 12 && etat.inspection; i++) majInspection(0.05); });
    assert.ok(await p.isVisible('#m-bilan'));
    assert.equal(await p.evaluate(() => progression.bilanVu.college), true);
    await p.evaluate(() => fermerModales());
  });

  await E('impression du carnet : un tableau de 14 lignes', async () => {
    const lignes = await p.evaluate(() => { window.print = () => {}; imprimer(); return document.querySelectorAll('#impression tr').length; });
    assert.equal(lignes, 15);
  });

  await E('progression conservée après rechargement', async () => {
    const bonnes = await p.evaluate(() => compteBonnes('college'));
    await ouvrir(p, adresse);
    await entrer(p);
    assert.equal(await p.textContent('#compteur'), `🔍 14 / 14 curiosités · ✓ ${bonnes}`);
  });

  await E('aucune erreur JavaScript pendant tout le parcours', async () => { assert.deepEqual(p.erreurs, []); });
  await ctx.close();

  await E('texte corrigé dans curiosites.js : visible aussitôt', async () => {
    const { ctx, p } = await contexte();
    await p.route('**/outils/cabinet/js/donnees/curiosites.js', async (r) => {
      const corps = (await (await r.fetch()).text()).replace('nom: "Nautile"', 'nom: "Nautile corrigé"');
      await r.fulfill({ body: corps, contentType: 'text/javascript' });
    });
    await ouvrir(p, adresse);
    assert.equal(await p.evaluate(() => parId.nautile.nom), 'Nautile corrigé');
    await entrer(p);
    await p.evaluate(() => saisir(OBJETS.find((o) => o.id === 'nautile')));
    assert.equal(await p.textContent('#f-nom'), 'Nautile corrigé');
    await ctx.close();
  });

  await E('téléphone 390 px : saisie au doigt, pas de défilement, hauteur stable (DPR 2)', async () => {
    const { ctx, p } = await contexte({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await ouvrir(p, adresse);
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
}

for (const [nom, adresse] of Object.entries(PAGES)) await scenarioCommun(nom, adresse);

/* ============================================================
   Propre à la version légère
   ============================================================ */
await etape('version légère · curiosites.js abîmé : elle garde sa copie et démarre', async () => {
  const { ctx, p } = await contexte();
  await p.route('**/outils/cabinet/js/donnees/curiosites.js', (r) => r.fulfill({ body: 'export const CURIOSITES = [ "oubli', contentType: 'text/javascript' }));
  await ouvrir(p, PAGES['version légère']);
  assert.equal(await p.evaluate(() => etat.sourceDonnees), 'copie');
  assert.equal(await p.evaluate(() => parId.nautile.nom), 'Nautile');
  await ctx.close();
});

await etape('version légère · ouverte par double-clic (file://) : démarre avec sa copie, sans erreur', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, pathToFileURL(join(RACINE, 'outils', 'cabinet_curiosites.html')).href);
  assert.equal(await p.evaluate(() => etat.sourceDonnees), 'copie');
  await entrer(p);
  assert.deepEqual(p.erreurs, []);
  await ctx.close();
});

/* ============================================================
   Propre à la nouvelle version
   ============================================================ */
await etape('nouvelle version · curiosites.js abîmé : message clair et lien vers la version légère', async () => {
  const { ctx, p } = await contexte();
  await p.route('**/outils/cabinet/js/donnees/curiosites.js', (r) => r.fulfill({ body: 'export const CURIOSITES = [ "oubli', contentType: 'text/javascript' }));
  await p.goto(PAGES['nouvelle version']);
  await attendre(p);
  assert.equal(await p.evaluate(() => etat.pret), false);
  assert.match(await p.textContent('#chargement'), /curiosites\.js\) contiennent une erreur/);
  assert.equal(await p.getAttribute('#chargement a', 'href'), '../cabinet_curiosites.html');
  await ctx.close();
});

await etape('nouvelle version · sans WebGL 2 : renvoi vers la version légère', async () => {
  const { ctx, p } = await contexte();
  await p.addInitScript(() => {
    const ancien = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...r) { return type === 'webgl2' ? null : ancien.call(this, type, ...r); };
  });
  await p.goto(PAGES['nouvelle version']);
  await p.waitForURL('**/outils/cabinet_curiosites.html', { timeout: 30000 });
  await ctx.close();
});

await etape('nouvelle version · une seule progression pour les deux versions', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, PAGES['version légère']);
  await entrer(p);
  await p.evaluate(() => saisir(OBJETS.find((o) => o.id === 'corail')));
  await ouvrir(p, PAGES['nouvelle version']);
  await entrer(p);
  assert.match(await p.textContent('#compteur'), /^🔍 1 \/ 14/);
  await ctx.close();
});

await etape('nouvelle version · ?perf affiche le compteur d’images', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, PAGES['nouvelle version'] + '&perf');
  await entrer(p);
  await p.waitForFunction(() => /images\/s/.test(document.body.textContent), null, { timeout: 60000 });
  await ctx.close();
});

for (const q of ['basse', 'haute']) {
  await etape(`nouvelle version · qualité ${q} : démarre sans erreur, 14 curiosités, saisie`, async () => {
    const { ctx, p } = await contexte();
    await ouvrir(p, `${NOUVELLE}?qualite=${q}`);
    assert.equal(await p.evaluate(() => etat.profil), q);
    assert.equal(await p.evaluate(() => OBJETS.length), 14);
    await entrer(p);
    await p.evaluate(() => { saisir(OBJETS.find((o) => o.id === 'microscope')); for (let i = 0; i < 12; i++) majInspection(0.05); });
    assert.equal(await p.textContent('#f-nom'), 'Microscope en laiton');
    assert.deepEqual(p.erreurs, []);
    await ctx.close();
  });
}

await etape('nouvelle version · qualité automatique : sans carte graphique, elle choisit « basse »', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, NOUVELLE);
  assert.equal(await p.evaluate(() => etat.profil), 'basse');
  assert.match(await p.textContent('#b-qualite'), /basse \(automatique\)/);
  await ctx.close();
});

await etape('nouvelle version · changer de qualité dans l’aide : rechargement et choix gardé', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, NOUVELLE);
  await p.click('#b-qualite');
  assert.ok(await p.isVisible('#m-aide'));
  await Promise.all([p.waitForEvent('load'), p.click('[data-qualite="haute"]')]);
  await attendre(p);
  assert.equal(await p.evaluate(() => etat.profil), 'haute');
  assert.equal(await p.evaluate(() => localStorage.getItem('cabinet-curiosites-qualite')), 'haute');
  assert.equal(await p.getAttribute('[data-qualite="haute"]', 'aria-pressed'), 'true');
  await ctx.close();
});

await etape('nouvelle version · matières réalistes : textures photographiées, reflets, halo de chaque flamme', async () => {
  const { ctx, p } = await contexte();
  await ouvrir(p, PAGES['nouvelle version']);
  const r = await p.evaluate(() => {
    const { scene, flammes } = moteur3d.interne();
    let photos = 0, reflets = 0;
    scene.traverse((o) => { if (o.isMesh && o.material.normalMap) photos++; if (o.isMesh && o.material.envMap) reflets++; });
    return { photos, reflets, flammes: flammes.length, halos: flammes.filter((f) => f.halo && f.halo.isSprite).length };
  });
  assert.ok(r.photos >= 4, `textures photographiées : ${r.photos}`);
  assert.ok(r.reflets > 20, `maillages avec reflets : ${r.reflets}`);
  assert.ok(r.flammes > 10 && r.halos === r.flammes, JSON.stringify(r));
  assert.equal(await p.locator('#credits li').count(), 4);
  await ctx.close();
});

await etape('nouvelle version · textures injoignables : le cabinet démarre avec les textures dessinées', async () => {
  const { ctx, p } = await contexte();
  await p.route('**/outils/cabinet/textures/**', (r) => r.abort());
  await ouvrir(p, PAGES['nouvelle version']);
  assert.equal(await p.evaluate(() => OBJETS.length), 14);
  const photos = await p.evaluate(() => { let n = 0; moteur3d.interne().scene.traverse((o) => { if (o.isMesh && o.material.normalMap) n++; }); return n; });
  assert.equal(photos, 0);
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
