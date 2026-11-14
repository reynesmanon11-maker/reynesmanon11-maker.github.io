/* Parcours automatique de la vitrine : vérifie que chaque brique du moteur réagit vraiment.
   node skills/essais/parcours-vitrine.js <vitrine-assemblée.html>     (NODE_PATH=/opt/node22/lib/node_modules) */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const nav = await chromium.launch();
  const p = await nav.newPage({ viewport: { width: 1200, height: 675 } });
  const erreurs = []; let rates = 0;
  p.on('pageerror', e => erreurs.push(String(e)));
  function ok(nom, cond) { console.log((cond ? '  ok   ' : '  RATÉ ') + nom); if (!cond) rates++; }
  const actif = () => p.evaluate(() => document.querySelector('.page.active').id);
  const fen = () => p.evaluate(() => (document.querySelector('.fenetre.active') || {}).id || null);
  await p.goto('file://' + path.resolve(process.argv[2]) + '?fixe');
  await p.waitForFunction(() => window.Diapo);

  ok('démarre sur l’accueil', await actif() === 'accueil');
  ok('la réponse du digicode n’est plus en clair', await p.evaluate(() => !document.documentElement.outerHTML.includes('data-code="1994"') && !!document.querySelector('.digicode[data-code-h]')));
  await p.click('#accueil .bouton'); ok('Start mène au sommaire', await actif() === 'sommaire');
  ok('barre de menu cachée au sommaire', await p.evaluate(() => document.querySelector('.barre').classList.contains('cache')));
  await p.click('.tuile[data-aller="#fenetres"]'); ok('tuile → fenêtres', await actif() === 'fenetres');
  ok('barre visible, rubrique surlignée', await p.evaluate(() => !document.querySelector('.barre').classList.contains('cache') && document.querySelector('.barre .ici').textContent === 'Fenêtres'));
  await p.hover('#fenetres .mot'); await p.waitForTimeout(100);
  ok('infobulle au survol', await p.evaluate(() => document.querySelector('.infobulle').classList.contains('visible') && document.querySelector('.infobulle').textContent.includes('matière organique')));
  await p.click('[data-ouvrir="f-experience"]'); ok('+ info ouvre la fenêtre', await fen() === 'f-experience');
  await p.keyboard.press('Escape'); ok('Échap ferme la fenêtre', await fen() === null);
  await p.click('[data-ouvrir="f-probleme"]'); await p.click('#f-probleme .fermer'); ok('la croix ferme la fenêtre', await fen() === null);

  await p.click('.barre [data-aller="#image"]'); await p.click('#image .point[data-ouvrir="f-noyau"]'); ok('point interactif → fenêtre', await fen() === 'f-noyau');
  await p.mouse.click(30, 300); ok('clic à côté ferme la fenêtre', await fen() === null);

  await p.click('.barre [data-aller="#cartes"]'); await p.click('#cartes .carte >> nth=1');
  ok('carte retournée', await p.evaluate(() => document.querySelectorAll('#cartes .carte.retournee').length === 1));

  await p.click('.barre [data-aller="#quiz"]');
  await p.click('#quiz .quiz >> nth=0 >> text=Le noyau');
  ok('mauvaise réponse signalée', await p.evaluate(() => !!document.querySelector('#quiz .choix.faux') && document.querySelector('#quiz .retour').classList.contains('ko')));
  await p.click('#quiz .quiz >> nth=0 >> text=Le chloroplaste'); await p.waitForTimeout(1100);
  ok('bonne réponse → suite révélée', await p.evaluate(() => document.querySelector('#quiz .quiz').classList.contains('fini') && !document.getElementById('q-suite').classList.contains('cache')));
  await p.click('#quiz .quiz >> nth=1 >> text=De l’eau'); await p.click('#quiz .quiz >> nth=1 >> text=De la terre'); await p.click('#quiz .valider');
  ok('choix multiple : erreur détectée', await p.evaluate(() => !document.querySelectorAll('#quiz .quiz')[1].classList.contains('fini')));
  await p.click('#quiz .quiz >> nth=1 >> text=De la terre'); await p.click('#quiz .quiz >> nth=1 >> text=Du dioxyde'); await p.click('#quiz .valider');
  ok('choix multiple : réussite', await p.evaluate(() => document.querySelectorAll('#quiz .quiz')[1].classList.contains('fini')));

  await p.click('#q-suite'); ok('suite → glisser-déposer', await actif() === 'glisser');
  async function glisse(va, attend) {
    const a = await p.locator(`#glisser .jeton[data-va="${va}"]`).boundingBox(), b = await p.locator(`#glisser .depot[data-attend="${attend}"]`).boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 }); await p.mouse.up();
  }
  await glisse('cratere', 'cheminee'); await glisse('cheminee', 'cratere'); await glisse('coulee', 'coulee'); await glisse('chambre', 'chambre');
  await p.click('#glisser .verifier');
  ok('étiquettes mal placées repérées', await p.evaluate(() => document.querySelectorAll('#glisser .depot.faux').length === 2 && document.querySelectorAll('#glisser .depot.juste').length === 2));
  await glisse('cratere', 'cratere'); await glisse('cheminee', 'cheminee'); await p.click('#glisser .verifier'); await p.waitForTimeout(1100);
  ok('schéma légendé → suite révélée', await p.evaluate(() => document.querySelector('#glisser .glisser').classList.contains('fini') && !document.getElementById('g-suite').classList.contains('cache')));

  await p.click('#g-suite'); ok('→ mission (thème aventure)', await actif() === 'mission');
  await p.waitForTimeout(1300);
  ok('minuteur lancé tout seul', await p.evaluate(() => document.querySelector('#mission .temps').textContent !== '10:00'));
  await p.click('#mission .eclat'); ok('éclat → énigme', await fen() === 'f-enigme');
  await p.fill('#f-enigme input', '14'); await p.keyboard.press('Enter');
  ok('cadenas : mauvaise réponse refusée', await p.evaluate(() => !document.querySelector('#f-enigme .cadenas').classList.contains('ouvert')));
  await p.fill('#f-enigme input', ' Quinze '); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  ok('cadenas : « Quinze » accepté', await p.evaluate(() => document.querySelector('#f-enigme .cadenas').classList.contains('ouvert') && !document.getElementById('vers-coffre').classList.contains('cache')));
  await p.click('#vers-coffre'); ok('→ coffre', await actif() === 'coffre' && await fen() === null);
  for (const c of '2024') await p.keyboard.press(c); await p.waitForTimeout(400);
  ok('digicode : mauvais code → erreur', await p.evaluate(() => document.querySelector('.digicode .ecran').textContent === 'ERREUR'));
  await p.waitForTimeout(1100);
  for (const c of ['1', '9', '9', '4']) await p.click(`.digicode .touches button:text-is("${c}")`);
  await p.waitForTimeout(1200); ok('digicode : bon code → trésor', await actif() === 'tresor');
  ok('aucune erreur JavaScript', erreurs.length === 0); if (erreurs.length) console.log(erreurs.join('\n'));
  await nav.close();
  console.log(rates ? rates + ' essai(s) raté(s)' : 'Tout passe.'); process.exit(rates ? 1 : 0);
})();
