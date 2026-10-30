// Parcours Google de bout en bout, contre le faux Google de faux-google.mjs :
// connexion, détection de l'agenda Pronote, classes, écriture des agendas « Carnet »,
// resynchronisation sans rien changer, modification, puis un deuxième appareil.
//   node tests/google.e2e.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { servir } from './serveur.mjs';

// require (et non import) suit NODE_PATH : Playwright peut être installé ailleurs que dans le projet.
const { chromium } = createRequire(import.meta.url)('playwright');
import { fauxGoogle } from './faux-google.mjs';
import { semaineGoogle } from './fixtures.mjs';

const { url: URL, fermer } = await servir();
const nav = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const MAINTENANT = new Date('2026-11-04T10:00:00+01:00'); // un mercredi
const SEMAINE = 7 * 864e5;

// L'emploi du temps réel (anonymisé) répété de trois semaines avant à six semaines après.
const decale = (x, k) => (x.dateTime ? { ...x, dateTime: new Date(Date.parse(x.dateTime) + k * SEMAINE).toISOString() } : x);
const pronote = [];
for (let k = -3; k <= 6; k++) {
  for (const e of semaineGoogle) {
    if (e.start.date && k !== 0) continue; // vacances et parcours citoyen : une seule fois
    if (e.start.date) { pronote.push(e); continue; }
    pronote.push({ ...e, id: `${e.id}-s${k}`, start: decale(e.start, k), end: decale(e.end, k) });
  }
}
const perso = [{ id: 'p1', summary: 'Dentiste', start: { dateTime: '2026-11-04T13:00:00Z' }, end: { dateTime: '2026-11-04T13:45:00Z' }, status: 'confirmed' }];
const google = fauxGoogle({
  agendas: {
    'prof.test@gmail.com': { summary: 'prof.test@gmail.com', primary: true, accessRole: 'owner', evenements: perso },
    'pronote123@import.calendar.google.com': { summary: 'Calendrier - DURAND M. - du 01 septembre 2026 au 02 juillet 2027', description: 'Calendrier DURAND M. généré par le logiciel PRONOTE (©INDEX ÉDUCATION)', accessRole: 'reader', evenements: pronote },
    'fr.french#holiday@group.v.calendar.google.com': { summary: 'Jours fériés en France', accessRole: 'reader', evenements: [] },
  },
});

const resultats = [], erreurs = [];
async function appareil({ connexion = 'auto', g = google } = {}) {
  const ctx = await nav.newContext({ timezoneId: 'Europe/Paris', locale: 'fr-FR', viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await g.brancher(ctx);
  // L'identifiant de test, l'adresse du serveur de test (et non celle du site), la méthode de connexion.
  await ctx.route('**/config.js', async (r) => {
    const rep = await r.fetch();
    r.fulfill({ response: rep, body: (await rep.text())
      .replace(/googleClientId: '[^']*'/, "googleClientId: 'test.apps.googleusercontent.com'")
      .replace(/urlPublique: '[^']*'/, "urlPublique: ''")
      .replace("connexion: 'auto'", `connexion: '${connexion}'`) });
  });
  const p = await ctx.newPage();
  // Les refus 403 voulus par le faux Google (« Google freine ») s'inscrivent dans la console : ce ne sont pas des erreurs de l'appli.
  p.on('console', (m) => { if (m.type() === 'error' && !/status of 403/.test(m.text())) erreurs.push(m.text()); });
  p.on('pageerror', (e) => erreurs.push(e.message));
  await p.clock.setFixedTime(MAINTENANT);
  return { ctx, p };
}
const rendu = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const synchroFinie = (p) => p.waitForFunction(() => {
  const e = document.getElementById('pastille-synchro');
  return e && e.dataset.etat !== 'cours' && /À jour|Erreur|refuse/i.test(e.textContent);
}, null, { timeout: 30000 });
async function etape(nom, f) {
  try { await f(); resultats.push(['ok', nom]); } catch (e) { resultats.push(['ÉCHEC', nom, e.message.split('\n')[0]]); }
}
const agendasCarnet = () => Object.entries(google.etat.agendas).filter(([, a]) => a.creeParAppli);
const evenementsCarnet = () => agendasCarnet().flatMap(([, a]) => a.evenements);

// Ce qui doit être écrit : chaque cours (chaque moitié pour un demi-groupe) entre J-7 et J+42.
const jourParis = (iso) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(iso));
const COURS = pronote.filter((e) => e.start.dateTime && /Matière/.test(e.description || ''));
const ATTENDUS = COURS.filter((e) => { const j = jourParis(e.start.dateTime); return j >= '2026-10-28' && j <= '2026-12-16'; }).length;

const { ctx: ctx1, p } = await appareil();

await etape('connexion et mise en route : l’agenda Pronote est trouvé tout seul', async () => {
  await p.goto(URL);
  await p.getByRole('button', { name: /Avec mon compte Google/ }).click();
  await p.getByRole('button', { name: /Se connecter avec Google/ }).click();
  await p.waitForSelector('input[name="agenda-pronote"]');
  assert.equal(await p.locator('input[name="agenda-pronote"]:checked').getAttribute('value'), 'pronote123@import.calendar.google.com');
  await p.getByRole('button', { name: 'Continuer' }).click();
  await p.waitForSelector('#form-classes');
  const lignes = await p.$$eval('#form-classes tbody tr', (t) => t.map((r) => [r.cells[1].textContent.trim(), r.querySelector('input[type=text]').value]));
  assert.deepEqual(Object.fromEntries(lignes), { '3G4': '304', '5G1': '501', '5G3': '503', '5G4': '504', '6G2': '602', '6G3': '603' });
  await p.fill('input[name="effectif-5G1"]', '28');
  await p.getByRole('button', { name: 'Continuer' }).click();
  await p.waitForSelector('input[name="mode-ecriture"][value="niveau"]:checked');
  await p.getByRole('button', { name: 'Continuer' }).click();
  await p.waitForSelector('input[name="perso"]');
  const perso = await p.$$eval('input[name="perso"]', (i) => i.map((x) => [x.value, x.checked]));
  assert.deepEqual(perso, [['prof.test@gmail.com', true]], 'ni Pronote, ni jours fériés, l’agenda principal coché');
  await p.getByRole('button', { name: 'Continuer' }).click();
  await p.getByRole('button', { name: /Partir de zéro/ }).click();
  await p.waitForSelector('.module');
  await synchroFinie(p);
});

await etape('Google Agenda : un agenda coloré par niveau, chaque cours écrit une fois', async () => {
  const noms = agendasCarnet().map(([, a]) => [a.summary, a.backgroundColor]).sort();
  assert.deepEqual(noms, [['Carnet · 3e', '#e8b400'], ['Carnet · 5e', '#8e24aa'], ['Carnet · 6e', '#7cb342'], ['Carnet · Établissement', '#8a8f87']]);
  const cours = evenementsCarnet().filter((e) => e.extendedProperties.private.cle.match(/^[0-9A-Z]+_\d{8}_\d{4}/));
  assert.equal(cours.length, ATTENDUS, `${cours.length} cours écrits, ${ATTENDUS} attendus`);
  const cles = cours.map((e) => e.extendedProperties.private.cle);
  assert.equal(new Set(cles).size, cles.length, 'aucun doublon');
  const e = cours.find((x) => x.extendedProperties.private.cle === '5G3_20261102_0920_P2');
  assert.ok(e, 'le demi-groupe P2 de la 503, lundi 9h20');
  assert.equal(e.summary, '503 P2 · à préparer');
  assert.equal(e.location, 'Salle 107');
  assert.equal(e.start.timeZone, 'Europe/Paris');
  assert.match(e.description, /Avec Mme MARTIN S\./);
  assert.match(e.description, /#valider=5G3_20261102_0920/);
  assert.equal(e.source.title, 'Carnet de bord');
  const etab = agendasCarnet().find(([, a]) => a.summary === 'Carnet · Établissement')[1].evenements.map((x) => x.summary);
  assert.ok(etab.includes("Heure de com'") && etab.includes('Vacances'), etab.join(' | '));
});

await etape('rien n’est jamais écrit dans les agendas de Pronote ni dans l’agenda perso', async () => {
  const interdits = google.ecritures().filter((a) => /pronote123|prof\.test|holiday/.test(a.chemin));
  assert.deepEqual(interdits, []);
  assert.equal(google.etat.agendas['pronote123@import.calendar.google.com'].evenements.length, pronote.length);
});

await etape('les données partent dans le dossier caché du Drive', async () => {
  const f = Object.values(google.etat.fichiers);
  assert.equal(f.length, 1);
  const docs = JSON.parse(f[0].contenu).docs;
  assert.equal(docs['classes/5G1'].effectif, 28);
  assert.equal(docs.reglages.source.agendaPronote, 'pronote123@import.calendar.google.com');
});

await etape('resynchroniser sans changement : aucun appel d’écriture', async () => {
  google.vider();
  await p.click('#pastille-synchro');
  await synchroFinie(p);
  assert.deepEqual(google.ecritures().map((a) => `${a.methode} ${a.chemin}`), []);
});

await etape('une étape ajoutée à la 501 : seuls ses cours concernés sont réécrits', async () => {
  google.vider();
  await p.goto(URL + '#/classes');
  await p.locator('#classe-5G1').getByRole('button', { name: /Nouvelle étape/ }).click();
  await p.fill('dialog input[name="titre"]', 'Activité 6 – Les besoins des végétaux');
  await p.selectOption('dialog select[name="duree"]', '1.5');
  // Pour la 501 seule : on décoche les autres 5e, proposées d'office.
  for (const c of await p.$$('dialog input[name="aussi"]')) await c.uncheck();
  await p.getByRole('button', { name: /Enregistrer/ }).click();
  await p.waitForFunction(() => document.getElementById('pastille-synchro').dataset.etat === 'cours', null, { timeout: 10000 });
  await synchroFinie(p);
  const ev = google.ecritures().filter((a) => a.chemin.includes('/events'));
  assert.ok(ev.length > 0, 'quelque chose a été réécrit');
  assert.ok(ev.every((a) => a.methode === 'PUT'), ev.map((a) => a.methode).join(','));
  const cles = ev.map((a) => a.chemin.split('/').pop());
  const touches = evenementsCarnet().filter((e) => cles.includes(e.id));
  assert.ok(touches.every((e) => e.summary.startsWith('501')), touches.map((e) => e.summary).join(' | '));
  assert.ok(touches.some((e) => /Les besoins des végétaux/.test(e.summary)));
});

await etape('lien depuis Google Agenda : « Où en est-on ? » ouvre la validation du cours', async () => {
  await p.goto(`${URL}#valider=5G1_20261103_1035`);
  await p.waitForSelector('dialog.feuille[open] .arret');
  assert.match(await p.textContent('dialog .feuille-tete h2'), /501 · mardi 3 novembre/);
  await p.getByRole('button', { name: 'Comme prévu' }).click();
  await rendu(p);
  await p.keyboard.press('Escape');
  // La validation part toute seule vers Google quelques secondes après.
  await p.waitForFunction(() => document.getElementById('pastille-synchro').dataset.etat === 'cours', null, { timeout: 10000 });
  await synchroFinie(p);
});

await etape('un deuxième appareil retrouve tout, sans refaire la mise en route', async () => {
  await synchroFinie(p);
  const { ctx: ctx2, p: p2 } = await appareil();
  await p2.goto(URL);
  await p2.getByRole('button', { name: /Avec mon compte Google/ }).click();
  await p2.getByRole('button', { name: /Se connecter avec Google/ }).click();
  await p2.waitForSelector('.module');
  await synchroFinie(p2);
  await p2.goto(URL + '#/classes');
  await p2.waitForFunction(() => /Les besoins des végétaux/.test(document.getElementById('classe-5G1')?.textContent || ''));
  const valide = await p2.evaluate(async () => !!(await import('./js/etat.js')).calc().v.journal['5G1_20261103_1035']);
  assert.ok(valide, 'la validation faite sur le premier appareil est là');
  assert.equal(agendasCarnet().length, 4, 'pas de nouveaux agendas créés');
  await ctx2.close();
});

await etape('appli installée sur Android : la connexion passe par la page de Google, puis revient', async () => {
  const { ctx: ctx3, p: p3 } = await appareil({ connexion: 'redirection' });
  let demande = null;
  await ctx3.route(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/, (r) => {
    const q = new globalThis.URL(r.request().url()).searchParams;
    demande = Object.fromEntries(q);
    const retour = `${q.get('redirect_uri')}#access_token=jeton-test-redirection&token_type=Bearer&expires_in=3599&scope=${encodeURIComponent(q.get('scope'))}&state=${q.get('state')}`;
    r.fulfill({ status: 302, headers: { Location: retour } });
  });
  await p3.goto(URL);
  await p3.getByRole('button', { name: /Avec mon compte Google/ }).click();
  await p3.getByRole('button', { name: /Se connecter avec Google/ }).click();
  await p3.waitForSelector('.module', { timeout: 15000 });
  assert.equal(demande.client_id, 'test.apps.googleusercontent.com');
  assert.equal(demande.redirect_uri, URL);
  assert.equal(demande.response_type, 'token');
  assert.equal(demande.prompt, 'consent');
  assert.match(demande.scope, /calendar\.app\.created/);
  assert.equal(await p3.evaluate(() => location.hash), '#/accueil', 'le jeton ne reste pas dans l’adresse');
  const garde = await p3.evaluate(() => Object.keys(localStorage).some((k) => (localStorage.getItem(k) || '').includes('jeton-test-redirection')));
  assert.equal(garde, false, 'le jeton n’est pas écrit sur l’appareil');
  await synchroFinie(p3);
  assert.match(await p3.textContent('#pastille-synchro'), /À jour/);
  await ctx3.close();
});

await etape('un faux retour de Google, sans le numéro tiré au départ, est ignoré', async () => {
  const { ctx: ctx4, p: p4 } = await appareil({ connexion: 'redirection' });
  await p4.goto(`${URL}#access_token=jeton-test-pirate&expires_in=3599&state=invente`);
  await p4.waitForFunction(() => /pas été lancée par le Carnet/.test(document.querySelector('.toast')?.textContent || ''));
  assert.equal(await p4.evaluate(async () => (await import('./js/google.js')).connecte()), false);
  assert.doesNotMatch(await p4.evaluate(() => location.href), /jeton-test-pirate/);
  await ctx4.close();
});

await etape('un lien d’import reprend une progression : résumé, confirmation, puis la suite dans l’agenda', async () => {
  const ancien = {
    seances: { s1: { titre: 'Activité importée par lien', duree: 1, niveau: '5e', format: 'indiff' } },
    classes: { '5G1': { nom: '501', file: [{ u: 'l1', sid: 's1', fait: 0 }] } },
    journal: {},
  };
  await p.goto(`${URL}#importer=${Buffer.from(JSON.stringify(ancien)).toString('base64url')}`);
  await p.waitForSelector('dialog.feuille[open] [data-action="importer-lien"]');
  assert.match(await p.textContent('dialog'), /1 classe : 501/);
  assert.doesNotMatch(await p.evaluate(() => location.href), /importer=/, 'les données ne restent pas dans l’adresse');
  await p.getByRole('button', { name: 'Importer' }).click();
  await p.waitForFunction(() => document.getElementById('pastille-synchro').dataset.etat === 'cours', null, { timeout: 10000 });
  await synchroFinie(p);
  const d = await p.evaluate(async () => {
    const { calc } = await import('./js/etat.js');
    const c = calc(), cl = c.v.classes['5G1'];
    return { titre: c.v.etapes[cl.file[0].eid].titre, n: cl.file.length, effectif: cl.effectif };
  });
  assert.deepEqual(d, { titre: 'Activité importée par lien', n: 1, effectif: 28 });
  assert.ok(evenementsCarnet().some((e) => /^501 · Activité importée par lien/.test(e.summary)), 'les cours de la 501 réécrits dans l’agenda');
});

await etape('mise en route avec l’import de l’ancien carnet : étapes importées, réglages d’ici gardés', async () => {
  // Un autre compte, tout neuf : rien dans son Drive, la mise en route va jusqu'au bout.
  const autre = fauxGoogle({ agendas: {
    'prof.test@gmail.com': { summary: 'prof.test@gmail.com', primary: true, accessRole: 'owner', evenements: [] },
    'pronote123@import.calendar.google.com': { summary: 'Calendrier - DURAND M.', description: 'Calendrier DURAND M. généré par le logiciel PRONOTE (©INDEX ÉDUCATION)', accessRole: 'reader', evenements: pronote },
  } });
  const ancien = {
    seances: {
      'c5-act5': { titre: 'Activité 5 – Le Soleil et la Terre', duree: 1, niveau: '5e', format: 'indiff' },
      'c5-eval': { titre: 'Évaluation chapitres 1 et 2', duree: 0.25, niveau: '5e', eval: true, format: 'entiere' },
    },
    classes: { '5G1': { nom: '501', file: [{ u: 'a1', sid: 'c5-act5', fait: 0.5 }, { u: 'a2', sid: 'c5-eval', fait: 0 }] } },
    journal: {},
    reglages: { general: { debut: '2026-11-02' } },
  };
  const { ctx: c5, p: p5 } = await appareil({ g: autre });
  await p5.goto(URL);
  await p5.getByRole('button', { name: /Avec mon compte Google/ }).click();
  await p5.getByRole('button', { name: /Se connecter avec Google/ }).click();
  await p5.waitForSelector('input[name="agenda-pronote"]');
  await p5.getByRole('button', { name: 'Continuer' }).click();
  await p5.waitForSelector('#form-classes');
  await p5.fill('input[name="effectif-5G1"]', '28');
  await p5.getByRole('button', { name: 'Continuer' }).click();
  await p5.waitForSelector('input[name="mode-ecriture"][value="niveau"]:checked');
  await p5.getByRole('button', { name: 'Continuer' }).click();
  await p5.waitForSelector('input[name="perso"]');
  await p5.getByRole('button', { name: 'Continuer' }).click();
  await p5.setInputFiles('input[data-change="fichier-progression"]', { name: 'carnet-svt.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(ancien)) });
  await p5.waitForSelector('.module');
  await synchroFinie(p5);
  const d = await p5.evaluate(async () => {
    const { calc, reglages } = await import('./js/etat.js');
    const c = calc(), r = reglages();
    return { file: c.v.classes['5G1'].file.length, effectif: c.v.classes['5G1'].effectif, pronote: (r.source || {}).agendaPronote, debut: r.debut, ecrire: (r.ecriture || {}).actif };
  });
  assert.deepEqual(d, { file: 2, effectif: 28, pronote: 'pronote123@import.calendar.google.com', debut: '2026-11-02', ecrire: true });
  const ecrits = Object.values(autre.etat.agendas).filter((a) => a.creeParAppli).flatMap((a) => a.evenements);
  const e501 = ecrits.find((e) => e.extendedProperties.private.cle.startsWith('5G1_20261103'));
  assert.ok(e501, 'le cours de la 501 du mardi 3 novembre est écrit');
  assert.match(e501.summary, /^501 · Activité 5 – Le Soleil et la Terre · reprendre à ½/);
  await c5.close();
});

await etape('rendez-vous perso : créé, déplacé, supprimé dans le Carnet, et fait dans Google Agenda', async () => {
  const perso = () => google.etat.agendas['prof.test@gmail.com'].evenements;
  const avant = perso().length;
  google.vider();
  await p.goto(URL + '#/semaine');
  await p.getByRole('button', { name: /Rendez-vous/ }).click();
  await p.fill('#rdv-titre', 'Inspection Yamina');
  await p.fill('#rdv-jour', '2026-11-06');
  await p.fill('#rdv-debut', '14:00');
  await p.fill('#rdv-fin', '15:00');
  await p.getByRole('button', { name: 'Enregistrer' }).click();
  await p.waitForFunction(() => /ajouté à Google Agenda/.test(document.querySelector('.toast')?.textContent || ''));
  const cree = perso().find((e) => e.summary === 'Inspection Yamina');
  assert.ok(cree, 'écrit dans l’agenda principal');
  assert.equal(new Date(cree.start.dateTime).toISOString(), '2026-11-06T13:00:00.000Z');
  // Déplacé d'une heure : seuls les champs changés partent, le rendez-vous garde le reste.
  cree.attendees = [{ email: 'collegue@example.com' }];
  await p.locator('.bloc.perso', { hasText: 'Inspection Yamina' }).click();
  await p.getByRole('button', { name: 'Modifier' }).click();
  await p.fill('#rdv-debut', '15:00');
  await p.fill('#rdv-fin', '16:00');
  await p.getByRole('button', { name: 'Enregistrer' }).click();
  await p.waitForFunction(() => /modifié dans Google Agenda/.test(document.querySelector('.toast')?.textContent || ''));
  const deplace = perso().find((e) => e.id === cree.id);
  assert.equal(new Date(deplace.start.dateTime).toISOString(), '2026-11-06T14:00:00.000Z');
  assert.deepEqual(deplace.attendees, [{ email: 'collegue@example.com' }], 'les invités restent');
  await p.locator('.bloc.perso', { hasText: 'Inspection Yamina' }).click();
  await p.getByRole('button', { name: /Supprimer/ }).click();
  await p.getByRole('button', { name: /Toucher encore/ }).click();
  await p.waitForFunction(() => /supprimé de Google Agenda/.test(document.querySelector('.toast')?.textContent || ''));
  assert.equal(perso().length, avant);
  assert.deepEqual(google.ecritures().filter((a) => /prof\.test/.test(a.chemin)).map((a) => a.methode), ['POST', 'PATCH', 'DELETE'], 'une écriture par geste, aucune autre');
  assert.ok(!google.ecritures().some((a) => /pronote123/.test(a.chemin)), 'rien dans l’agenda de Pronote');
});

// La mise en route Google jusqu'au tableau de bord, sur un faux Google donné.
async function miseEnRoute(g) {
  const { ctx, p: pg } = await appareil({ g });
  await pg.goto(URL);
  await pg.getByRole('button', { name: /Avec mon compte Google/ }).click();
  await pg.getByRole('button', { name: /Se connecter avec Google/ }).click();
  await pg.waitForSelector('input[name="agenda-pronote"]');
  await pg.getByRole('button', { name: 'Continuer' }).click();
  await pg.waitForSelector('#form-classes');
  await pg.getByRole('button', { name: 'Continuer' }).click();
  await pg.waitForSelector('input[name="mode-ecriture"][value="niveau"]:checked');
  await pg.getByRole('button', { name: 'Continuer' }).click();
  await pg.waitForSelector('input[name="perso"]');
  return { ctx, pg };
}
const SIGNE = 'Écrit par le Carnet de bord : les cours avec ce qui est prévu. Modifié automatiquement.';
const PRONOTE_SEUL = { summary: 'Calendrier - DURAND M.', description: 'Calendrier DURAND M. généré par le logiciel PRONOTE (©INDEX ÉDUCATION)', accessRole: 'reader', evenements: pronote };

await etape('agendas : les « Carnet · 3e » vides d’une synchronisation interrompue sont renommés, pas recréés', async () => {
  // Ce qu'a laissé la première version : trois « Carnet · 3e » vides (une synchronisation
  // interrompue juste après chaque création), et un agenda de l'utilisatrice qui porte le même nom.
  const vide = (n) => ({ summary: 'Carnet · 3e', description: SIGNE, accessRole: 'owner', creeParAppli: true, evenements: [], n });
  const abime = fauxGoogle({ refusCreations: 4, agendas: {
    'prof.test@gmail.com': { summary: 'prof.test@gmail.com', primary: true, accessRole: 'owner', evenements: [] },
    'pronote123@import.calendar.google.com': PRONOTE_SEUL,
    'double1@group.calendar.google.com': vide(1),
    'double2@group.calendar.google.com': vide(2),
    'double3@group.calendar.google.com': vide(3),
    'a-moi@group.calendar.google.com': { summary: 'Carnet · 3e', description: 'Mes notes à moi', accessRole: 'owner', evenements: [] },
  } });
  const { ctx: c6, pg: p6 } = await miseEnRoute(abime);
  const proposes = await p6.$$eval('input[name="perso"]', (i) => i.map((x) => x.value));
  assert.ok(!proposes.some((v) => v.startsWith('double')), 'les agendas du Carnet ne sont pas proposés comme vie perso');
  assert.ok(proposes.includes('a-moi@group.calendar.google.com'), 'celui de l’utilisatrice, si');
  await p6.getByRole('button', { name: 'Continuer' }).click();
  await p6.getByRole('button', { name: /Partir de zéro/ }).click();
  await p6.waitForSelector('.module');
  await synchroFinie(p6);
  const carnet = () => Object.entries(abime.etat.agendas).filter(([, a]) => a.description === SIGNE);
  const noms = () => carnet().map(([, a]) => a.summary).sort();
  assert.deepEqual(noms(), ['Carnet · 3e', 'Carnet · 5e', 'Carnet · 6e', 'Carnet · Établissement'], 'tout est là dès la première synchronisation');
  assert.equal(abime.etat.creations, 1, 'un seul agenda créé : les deux doublons vides ont été renommés');
  assert.equal(abime.etat.renommages, 2);
  assert.deepEqual(['double1', 'double2', 'double3'].map((k) => abime.etat.agendas[`${k}@group.calendar.google.com`].summary), ['Carnet · 3e', 'Carnet · 5e', 'Carnet · 6e']);
  assert.ok(abime.etat.agendas['a-moi@group.calendar.google.com'], 'l’agenda de l’utilisatrice n’est pas touché');
  assert.doesNotMatch(await p6.textContent('#pastille-synchro'), /à créer/);
  assert.ok(carnet().filter(([, a]) => /3e|5e|6e/.test(a.summary)).every(([, a]) => a.evenements.length > 0), 'les cours de chaque niveau sont écrits');
  await c6.close();
});

await etape('agendas : Google qui freine les créations ne bloque rien, la synchronisation suivante finit le travail', async () => {
  const frein = fauxGoogle({ refusCreations: 4, agendas: {
    'prof.test@gmail.com': { summary: 'prof.test@gmail.com', primary: true, accessRole: 'owner', evenements: [] },
    'pronote123@import.calendar.google.com': PRONOTE_SEUL,
  } });
  const { ctx: c7, pg: p7 } = await miseEnRoute(frein);
  await p7.getByRole('button', { name: 'Continuer' }).click();
  await p7.getByRole('button', { name: /Partir de zéro/ }).click();
  await p7.waitForSelector('.module');
  await synchroFinie(p7);
  const noms = () => Object.values(frein.etat.agendas).filter((a) => a.description === SIGNE).map((a) => a.summary).sort();
  assert.deepEqual(noms(), ['Carnet · 3e'], 'le premier créé, la suite refusée par Google');
  assert.match(await p7.textContent('#pastille-synchro'), /encore 3 agendas à créer/);
  assert.ok(Object.values(frein.etat.agendas).find((a) => a.summary === 'Carnet · 3e').evenements.length > 0, 'les cours de la 3e sont déjà écrits');
  // Plus tard, Google accepte : la synchronisation suivante finit le travail, sans rien recréer.
  await p7.click('#pastille-synchro');
  await p7.waitForFunction(() => /À jour/.test(document.getElementById('pastille-synchro').textContent) && !/à créer/.test(document.getElementById('pastille-synchro').textContent), null, { timeout: 30000 });
  assert.deepEqual(noms(), ['Carnet · 3e', 'Carnet · 5e', 'Carnet · 6e', 'Carnet · Établissement']);
  await c7.close();
});

await ctx1.close();
await nav.close();
fermer();
for (const r of resultats) console.log(r[0] === 'ok' ? '  ✓' : '  ✗', r[1], r[2] ? `— ${r[2]}` : '');
if (erreurs.length) console.log('\nErreurs de page :\n' + [...new Set(erreurs)].join('\n'));
const echecs = resultats.filter((r) => r[0] !== 'ok').length;
console.log(`\n${resultats.length - echecs}/${resultats.length} étapes Google réussies (${ATTENDUS} cours attendus dans l'agenda)${erreurs.length ? `, ${erreurs.length} erreur(s) de page` : ', aucune erreur de page'}`);
process.exit(echecs || erreurs.length ? 1 : 0);
