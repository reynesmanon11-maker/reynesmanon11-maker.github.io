/* Essais du mode retouche : on retouche la vitrine à la souris, on enregistre, et le fichier
   enregistré doit rouvrir proprement.   node skills/essais/retouche-vitrine.js <vitrine.html> <dossier de sortie> */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [, , fichier, dossier] = process.argv;
  const nav = await chromium.launch();
  const p = await nav.newPage({ viewport: { width: 1280, height: 800 } });
  const erreurs = []; let rates = 0;
  p.on('pageerror', e => erreurs.push(String(e)));
  const ok = (nom, c) => { console.log((c ? '  ok   ' : '  RATÉ ') + nom); if (!c) rates++; };
  const html = () => p.evaluate(() => DiapoRetouche.html());
  const actif = () => p.evaluate(() => document.querySelector('.page.active').id);
  await p.goto('file://' + path.resolve(fichier) + '?retouche');
  await p.waitForFunction(() => window.Diapo && document.querySelector('.dp-retouche'));
  const depart = await html();
  ok('la barre de retouche s’ouvre avec ?retouche', true);
  ok('la scène se décale sous la barre', await p.evaluate(() => document.querySelector('.diapo').getBoundingClientRect().top >= document.querySelector('.dp-retouche').offsetHeight - 1));
  ok('la source mémorisée ne contient aucune trace du moteur', !/dp-actif|dp-retouche|class="[^"]*\bel\b/.test(depart.split('<main')[1]));

  // 1. un clic ne déclenche plus l'action ; il sélectionne
  await p.click('#accueil .bouton'); ok('en retouche, cliquer « Start » ne change pas de page', await actif() === 'accueil');
  ok('… mais sélectionne le bouton', await p.evaluate(() => document.querySelector('.dp-sel').style.display === 'block'));

  // 2. déplacer
  const t = await p.locator('#accueil h1 >> nth=0').boundingBox();
  await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2); await p.mouse.down();
  await p.mouse.move(t.x + t.width / 2 + 53, t.y + t.height / 2 + 41, { steps: 5 }); await p.mouse.up();
  const pos = await p.evaluate(() => { const e = document.querySelector('#accueil h1'); return [e.offsetLeft, e.offsetTop]; });
  ok('le titre a bougé (' + pos + ')', pos[0] > 80 && pos[1] > 150);
  ok('la source porte la nouvelle position', (await html()).includes(`data-pos="${pos[0]},${pos[1]},570"`));
  await p.keyboard.press('Control+z');
  ok('Ctrl + Z remet le titre à sa place', await p.evaluate(() => document.querySelector('#accueil h1').offsetLeft === 80) && (await html()) === depart);

  // 3. corriger un texte
  await p.dblclick('#accueil h1 >> nth=0');
  ok('double-clic : le texte devient modifiable', await p.evaluate(() => document.querySelector('#accueil h1').isContentEditable));
  await p.keyboard.press('Control+a'); await p.keyboard.type('La vitrine de Manon'); await p.keyboard.press('Escape');
  ok('le texte corrigé est dans la source', (await html()).includes('>La vitrine de Manon</h1>'));
  await p.dblclick('#accueil h1 >> nth=0'); await p.keyboard.press('Control+a'); await p.keyboard.press('Delete'); await p.keyboard.press('Escape');
  ok('un texte vide est refusé', await p.evaluate(() => document.querySelector('#accueil h1').textContent === 'La vitrine de Manon'));

  // 4. taille, couleur d'accent
  await p.click('#accueil h1 >> nth=0'); await p.click('.dp-retouche button:text-is("A+")');
  ok('A+ grossit le texte', /<h1[^>]*font-size: ?48px[^>]*>La vitrine de Manon/.test(await html()));
  await p.evaluate(() => { const c = document.querySelectorAll('.dp-retouche input[type=color]')[1]; c.value = '#1f8a70'; c.dispatchEvent(new Event('input')); c.dispatchEvent(new Event('change')); });
  ok('la couleur d’accent change partout', /<main[^>]*--accent: ?#1f8a70/.test(await html()));

  // 5. redimensionner
  await p.click('#accueil p >> nth=-1');
  const h = await p.locator('.dp-poignee.e').boundingBox();
  await p.mouse.move(h.x + 5, h.y + 5); await p.mouse.down(); await p.mouse.move(h.x + 65, h.y + 5, { steps: 4 }); await p.mouse.up();
  ok('la poignée élargit le bloc', await p.evaluate(() => document.querySelector('#accueil p:last-of-type').offsetWidth > 190));

  // 6. ajouter puis supprimer
  await p.click('.dp-retouche button:text-is("＋ Texte")'); await p.keyboard.type('Classe de 5e B'); await p.keyboard.press('Escape');
  ok('＋ Texte ajoute un bloc à la source', />Classe de 5e B<\/p>/.test(await html()));
  await p.click('#accueil >> text=Novembre 2026'); await p.keyboard.press('Delete');
  ok('Suppr enlève le bloc', !(await html()).includes('Novembre 2026'));

  // 7. suivre un clic, retoucher dans une fenêtre, infobulle
  await p.click('#accueil .bouton'); await p.click('.dp-suivre');
  ok('le bouton « Aller à la page » fait ce que ferait le clic', await actif() === 'sommaire');
  await p.selectOption('.dp-retouche select', 'p:image'); await p.click('#image .point[data-ouvrir="f-noyau"]'); await p.click('.dp-suivre');
  ok('le bouton « Ouvrir la fenêtre » l’ouvre', await p.evaluate(() => document.querySelector('#f-noyau').classList.contains('active')));
  await p.mouse.click(40, 500);
  ok('cliquer à côté referme la fenêtre', await p.evaluate(() => !document.querySelector('.fenetre.active')));
  await p.dblclick('.barre button[aria-label="Sommaire"]');
  ok('double-clic sur une icône cliquable : on suit le clic', await actif() === 'sommaire');
  await p.selectOption('.dp-retouche select', 'f:f-noyau');
  ok('la liste ouvre une fenêtre', await p.evaluate(() => document.querySelector('#f-noyau').classList.contains('active')));
  await p.dblclick('#f-noyau h3'); await p.keyboard.press('End'); await p.keyboard.type(' cellulaire'); await p.keyboard.press('Escape');
  ok('texte de fenêtre corrigé', /Le noyau cellulaire<\/h3>/.test(await html()));
  await p.selectOption('.dp-retouche select', 'p:fenetres'); await p.click('#fenetres .mot >> nth=0');
  await p.fill('.dp-retouche input[type=text]', 'Nouvelle définition.'); await p.keyboard.press('Enter');
  ok('infobulle modifiée', (await html()).includes('data-info="Nouvelle définition."'));
  await p.selectOption('.dp-retouche select', 'p:quiz'); await p.click('.dp-retouche button:text-is("Cachés")');
  ok('« Cachés » montre le bouton révélé par une réussite', await p.evaluate(() => document.getElementById('q-suite').getClientRects().length > 0));
  ok('… sans l’écrire dans la source', /class="bouton cache" id="q-suite"/.test(await html()));

  // 8. enregistrer, rouvrir
  await p.evaluate(() => { window.showSaveFilePicker = undefined; });   // navigateur sans écriture directe : téléchargement
  const [telechargement] = await Promise.all([p.waitForEvent('download'), p.click('.dp-retouche button:text-is("Enregistrer")')]);
  const sortie = path.join(dossier, 'vitrine-retouchee.html'); fs.mkdirSync(dossier, { recursive: true }); await telechargement.saveAs(sortie);
  const [eleves] = await Promise.all([p.waitForEvent('download'), p.click('.dp-retouche button:text-is("Version élèves")')]);
  const sortieEleves = path.join(dossier, 'vitrine-eleves.html'); await eleves.saveAs(sortieEleves);
  await p.click('.dp-retouche button:text-is("Terminer")');
  ok('« Terminer » referme la modification', await p.evaluate(() => !document.querySelector('.dp-retouche') && !document.querySelector('.diapo').classList.contains('retouche')));
  const q = await nav.newPage({ viewport: { width: 1200, height: 675 } }); const e2 = [];
  q.on('pageerror', e => e2.push(String(e)));
  await q.goto('file://' + path.resolve(sortie) + '?fixe'); await q.waitForFunction(() => window.Diapo);
  ok('le fichier enregistré démarre sans erreur', e2.length === 0);
  ok('… avec les retouches', await q.evaluate(() => document.querySelector('#accueil h1').textContent === 'La vitrine de Manon' && !!Array.from(document.querySelectorAll('#accueil p')).find(x => x.textContent === 'Classe de 5e B') && getComputedStyle(document.querySelector('#accueil .bouton')).backgroundColor === 'rgb(31, 138, 112)'));
  ok('… et sans trace de l’éditeur', await q.evaluate(() => !document.querySelector('.dp-sel, .dp-retouche, [contenteditable], .dp-fantome')));
  await q.click('#accueil .bouton');
  ok('… et il se joue normalement', await q.evaluate(() => document.querySelector('.page.active').id === 'sommaire'));
  ok('le fichier de travail garde son bouton « Modifier »', await q.evaluate(() => !!document.querySelector('.o-modif')));
  await q.click('.o-modif');
  ok('… qui rouvre la modification en un clic', await q.evaluate(() => !!document.querySelector('.dp-retouche')));
  const r = await nav.newPage({ viewport: { width: 1200, height: 675 } }); const e3 = [];
  r.on('pageerror', e => e3.push(String(e)));
  await r.goto('file://' + path.resolve(sortieEleves) + '?fixe'); await r.waitForFunction(() => window.Diapo);
  ok('la version élèves n’a ni bouton « Modifier » ni éditeur', await r.evaluate(() => !document.querySelector('.o-modif') && !window.DiapoRetouche) && e3.length === 0);
  await r.keyboard.press('Control+Alt+e');
  ok('… et le raccourci n’y fait rien', await r.evaluate(() => !document.querySelector('.dp-retouche')));
  ok('… mais elle a bien les retouches', await r.evaluate(() => document.querySelector('#accueil h1').textContent === 'La vitrine de Manon'));
  ok('aucune erreur JavaScript', erreurs.length === 0); if (erreurs.length) console.log(erreurs.join('\n'));
  await nav.close();
  console.log(rates ? rates + ' essai(s) raté(s)' : 'Tout passe.'); process.exit(rates ? 1 : 0);
})();
