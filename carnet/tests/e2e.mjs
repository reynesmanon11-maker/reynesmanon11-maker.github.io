// Tests de bout en bout dans Chromium (Playwright) : l'appli servie telle quelle, en mode démo.
//   node tests/e2e.mjs          (Playwright doit être installé ; CHROMIUM=/chemin pour un autre binaire)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { servir } from './serveur.mjs';
import { readFile } from 'node:fs/promises';
import { lireTableur } from '../js/tableur.js';

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
  // Sur ordinateur, l'emploi du temps de la semaine vient d'abord, en grille, comme l'accueil de Pronote.
  assert.equal(titres[0], 'Emploi du temps', titres.join(', '));
  for (const t of ['Cours à valider (2)', 'Pense-bête', 'Progression des classes', 'Évaluations à venir (3)']) assert.ok(titres.includes(t), `${t} — ${titres.join(', ')}`);
  assert.ok(titres.some((t) => /^Cahiers de textes non saisis \(\d+\)$/.test(t)), titres.join(', '));
  assert.ok(titres.some((t) => /^Agenda \(\d+\)$/.test(t)), titres.join(', '));
  assert.ok(await p.locator('.module[data-module="semaine"] .grille .bloc').count() > 10);
  assert.equal((await p.textContent('.module[data-module="semaine"] .grille-heures span')).trim(), '08h25', 'les heures de sonnerie de l’établissement');
  assert.equal(await p.locator('.module[data-module="semaine"] .hachure').count(), 1, 'le mercredi après-midi hachuré');
  assert.equal(await p.textContent('#rubrique'), "Page d'accueil");
  assert.equal(await p.getAttribute('.nav-haut a[aria-current="page"]', 'href'), '#/accueil');
  assert.match(await p.textContent('.resume'), /à valider/);
  await ctx.close();
});

await etape('valider un cours : le point d’arrêt fait glisser la suite', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  // Le cours de 602 de ce matin est à valider : la tuile « Cours à valider » y mène.
  await p.locator('.module[data-module="valider"] button', { hasText: '602' }).click();
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
  await p.locator('.module[data-module="valider"] button', { hasText: '503' }).first().click();
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
  for (let k = 0; k < 2; k++) {
    await p.locator('.module[data-module="preparer"] [data-action="module-monter"]').click();
    await rendu(p);
  }
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
  // Assez haut pour voir toutes les tuiles : le geste va de la dernière à la première sans défiler.
  const { ctx, p } = await contexte({ viewport: { width: 1280, height: 2600 } });
  await demo(p);
  await p.getByRole('button', { name: /Personnaliser/ }).click();
  await p.waitForSelector('.tableau.organiser');
  const poignee = p.locator('.module[data-module="libres"] [data-poignee]');
  await poignee.scrollIntoViewIfNeeded();
  const cible = p.locator('.module[data-module="semaine"]');
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
  // Un clic, et non check() : cochée, la tâche quitte la liste aussitôt, et check() attendrait en
  // vain de voir la case cochée.
  await tache.locator('input').click();
  await tache.waitFor({ state: 'detached', timeout: 5000 });
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
  // Par défaut, la grille horaire comme dans Pronote ; les cartes en colonnes sont à un toucher.
  assert.ok(await p.locator('.grille .bloc').count() > 10);
  assert.ok(await p.locator('.grille .recre').count() > 0, 'la récréation grisée');
  assert.ok(await p.locator('.bloc.perso').count() > 0, 'vie perso affichée');
  await p.getByRole('button', { name: 'Cartes' }).click();
  await rendu(p);
  assert.ok(await p.locator('.jours-liste .cours').count() > 10);
  assert.ok(await p.locator('.jours-liste .cours .a-prevoir input[type="checkbox"]').count() > 0, 'le matériel à prévoir en cases à cocher');
  await p.getByRole('button', { name: 'Grille horaire' }).click();
  await rendu(p);
  await p.getByRole('button', { name: 'Semaine suivante' }).click();
  await rendu(p);
  assert.match(await p.textContent('.semaine-outils h2'), /9 nov/);
  await p.getByRole('button', { name: /Vie perso/ }).click();
  await rendu(p);
  assert.equal(await p.locator('.bloc.perso').count(), 0);
  await ctx.close();
});

await etape('rendez-vous perso : ajouté, modifié, supprimé depuis le Carnet', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/semaine');
  await p.getByRole('button', { name: /Rendez-vous/ }).click();
  await p.fill('#rdv-titre', 'Inspection Yamina');
  await p.fill('#rdv-jour', '2026-11-06');
  await p.fill('#rdv-debut', '14:00');
  await p.fill('#rdv-fin', '15:30');
  await p.getByRole('button', { name: 'Enregistrer' }).click();
  const bloc = p.locator('.bloc.perso', { hasText: 'Inspection Yamina' });
  await bloc.waitFor();
  await bloc.click();
  await p.getByRole('button', { name: 'Modifier' }).click();
  await p.fill('#rdv-titre', 'Inspection de Yamina');
  await p.getByRole('button', { name: 'Enregistrer' }).click();
  await p.locator('.bloc.perso', { hasText: 'Inspection de Yamina' }).waitFor();
  await p.locator('.bloc.perso', { hasText: 'Inspection de Yamina' }).click();
  await p.getByRole('button', { name: /Supprimer/ }).click();
  await p.getByRole('button', { name: /Toucher encore/ }).click();
  await p.locator('.bloc.perso', { hasText: 'Yamina' }).waitFor({ state: 'detached' });
  // Une case vide de la grille propose un rendez-vous à cette heure-là.
  const jeudi = p.locator('.corps-jour[data-jour="2026-11-05"]');
  const r = await jeudi.boundingBox();
  await jeudi.click({ position: { x: r.width - 8, y: r.height - 12 } });
  await p.waitForSelector('#rdv-titre');
  assert.equal(await p.inputValue('#rdv-jour'), '2026-11-05');
  await ctx.close();
});

await etape('prévoir une étape depuis un cours de l’emploi du temps : elle tombe sur ce cours', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/semaine');
  const cle = await p.evaluate(async () => (await import('./js/etat.js')).calc().plan.parClasse['6G1'].prochains[0].cle);
  await p.locator(`.bloc[data-cle="${cle}"]`).first().click();
  await p.getByRole('button', { name: /(Prévoir|Ajouter) une (autre )?étape dans ce cours/ }).click();
  await p.fill('dialog input[name="titre"]', 'TP lampe – ensoleillement et forme de la Terre');
  await p.getByRole('button', { name: /Enregistrer/ }).click();
  await p.waitForFunction((k) => {
    return import('./js/etat.js').then(({ calc }) => {
      const c = calc(), s = (c.plan.parCreneau[k].segments || [])[0];
      return s && /TP lampe/.test(c.v.etapes[s.eid].titre) && s.de === 0;
    });
  }, cle);
  // On la retrouve dans le cours, et la toucher l'ouvre remplie : pas une étape vide.
  await p.locator(`.bloc[data-cle="${cle}"]`).first().click();
  await p.locator('dialog .segment-modifier', { hasText: 'TP lampe' }).click();
  await p.waitForSelector('dialog input[name="titre"]');
  assert.match(await p.inputValue('dialog input[name="titre"]'), /TP lampe/);
  await p.fill('dialog input[name="titre"]', 'TP lampe – ensoleillement (modifié)');
  await p.getByRole('button', { name: /Enregistrer/ }).click();
  await p.waitForFunction(() => import('./js/etat.js').then(({ calc }) => Object.values(calc().v.etapes).some((e) => /modifié/.test(e.titre))));
  await ctx.close();
});

await etape('téléphone (390 px) : aucune page ne déborde', async () => {
  const { ctx, p } = await contexte({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await demo(p);
  for (const r of ['accueil', 'semaine', 'cahier', 'classes', 'classes/calendrier', 'taches', 'reglages']) {
    await p.goto(`${URL}#/${r}`);
    await p.waitForTimeout(150);
    const l = await p.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(l <= 390, `${r} : ${l} px`);
  }
  await ctx.close();
});

await etape('programmation : un vrai fichier Excel, une feuille par niveau, importé dans les files', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/classes');
  const avant = await p.locator('#classe-6G2 .etape').count();
  await p.getByRole('button', { name: /Importer une programmation/ }).click();
  await p.setInputFiles('dialog input[data-change="prog-fichier"]', new globalThis.URL('./tableurs/programmation.xlsx', import.meta.url).pathname);
  await p.waitForSelector('dialog .apercu-import');
  assert.deepEqual(await p.$$eval('dialog .onglets-feuilles button', (b) => b.map((x) => x.textContent.trim())), ['6e', '5e'], 'la feuille masquée n’est pas proposée');
  assert.equal(await p.inputValue('#prog-niveau'), '6e', 'le niveau lu dans le nom de la feuille');
  assert.match(await p.textContent('dialog .resume-import'), /6 étapes en 2 chapitres/);
  assert.deepEqual(await p.$$eval('dialog input[data-change="prog-cible"]:checked', (i) => i.map((x) => x.value)).then((l) => l.sort()), ['6G1', '6G2']);
  await p.getByRole('button', { name: /Importer 6 étapes/ }).click();
  // La feuille suivante s'ouvre d'elle-même.
  await p.waitForFunction(() => document.querySelector('#prog-niveau')?.value === '5e');
  await p.getByRole('button', { name: /^Importer \d+ étapes/ }).click();
  await p.waitForSelector('dialog [data-action="prog-appliquer"][disabled]');
  await p.getByRole('button', { name: 'Terminer' }).click();
  await rendu(p);
  assert.equal(await p.locator('#classe-6G2 .etape').count(), avant + 6, 'ajoutées à la suite de la file');
  const texte = await p.textContent('#classe-6G2');
  assert.match(texte, /Séquence 1 — Le vivant et son environnement/, 'le chapitre en intertitre');
  assert.match(texte, /✎ Évaluation courte/);
  assert.match(await p.textContent('#classe-5G1'), /Activité 1 : respirer dans différents milieux/);
  await ctx.close();
});

await etape('progressions : le calendrier dit où tombe chaque étape, et chaque évaluation', async () => {
  const { ctx, p } = await contexte();
  await demo(p);
  await p.goto(URL + '#/classes');
  await p.getByRole('button', { name: 'Calendrier et évaluations' }).click();
  await rendu(p);
  assert.equal(await p.locator('.calendrier-etapes').count(), 4, 'un tableau par niveau');
  assert.ok(await p.locator('.calendrier-etapes tr.eval').count() >= 4);
  assert.match(await p.textContent('.evals-a-venir'), /602[\s\S]*Évaluation – Le vivant/);
  // La tuile « Évaluations à venir » y mène directement.
  await p.goto(URL + '#/accueil');
  await p.locator('.module[data-module="annonces"] .tout-voir').click();
  await p.waitForSelector('.calendrier-etapes');
  await ctx.close();
});

await etape('cahier de textes : le contenu de chaque cours, « Saisi » le fait disparaître', async () => {
  const { ctx, p } = await contexte({ permissions: ['clipboard-read', 'clipboard-write'] });
  await demo(p);
  await p.goto(URL + '#/cahier');
  const n = await p.locator('.cdt').count();
  assert.ok(n > 3, `${n} cours non saisis`);
  const premier = p.locator('.cdt').filter({ has: p.getByRole('button', { name: 'Copier pour Pronote' }) }).first();
  await premier.getByRole('button', { name: 'Copier pour Pronote' }).click();
  assert.ok((await p.evaluate(() => navigator.clipboard.readText())).length > 5, 'le contenu est copié');
  // Copier pour Pronote vaut « saisi » : le cours quitte la liste.
  await p.waitForFunction((k) => document.querySelectorAll('.cdt').length === k, n - 1);
  await p.locator('.cdt input[type="checkbox"]').first().check();
  await p.waitForFunction((k) => document.querySelectorAll('.cdt').length === k, n - 2);
  await p.getByRole('button', { name: 'Par semaine' }).click();
  await rendu(p);
  assert.ok(await p.locator('.jour-cdt').count() >= 4);
  assert.ok(await p.locator('.cdt.saisi').count() >= 1, 'le cours saisi reste visible, grisé, dans la semaine');
  await ctx.close();
});

await etape('exporter en Excel : un vrai .xlsx, une feuille par classe, qui se relit', async () => {
  const { ctx, p } = await contexte({ acceptDownloads: true });
  await demo(p);
  await p.goto(URL + '#/classes');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Exporter \(Excel\)/ }).click()]);
  assert.equal(dl.suggestedFilename(), 'Progressions - Carnet de bord.xlsx');
  const { format, feuilles } = await lireTableur(await readFile(await dl.path()), dl.suggestedFilename());
  assert.equal(format, 'xlsx');
  assert.ok(feuilles.map((f) => f.nom).includes('602'), feuilles.map((f) => f.nom).join(', '));
  const f602 = feuilles.find((f) => f.nom === '602');
  assert.equal(f602.lignes[0][1], 'Étape');
  assert.ok(f602.lignes.some((l) => /Observer des cellules au microscope/.test(l[1])));
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
