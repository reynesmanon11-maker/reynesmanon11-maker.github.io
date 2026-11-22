// La nouvelle version est faite de modules : un import qui pointe dans le vide, et la
// page reste blanche. Ces tests le voient sans ouvrir de navigateur.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { CURIOSITES } from '../js/donnees/curiosites.js';
import { PLACES } from '../js/donnees/objets.js';
import { MODELES } from '../js/procedural/modeles.js';
import { ORDRE_ETIQUETTES } from '../js/procedural/textures.js';

const RACINE = new URL('../', import.meta.url);

test('chaque import des modules pointe vers un fichier qui existe', async () => {
  const page = await readFile(new URL('index.html', RACINE), 'utf8');
  const carte = JSON.parse(page.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  await access(new URL(carte.three, RACINE));
  const fichiers = (await readdir(new URL('js/', RACINE), { recursive: true })).filter((f) => f.endsWith('.js'));
  for (const f of fichiers) {
    const source = await readFile(new URL(`js/${f}`, RACINE), 'utf8');
    for (const [, cible] of source.matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)) {
      if (cible === 'three') continue;
      assert.ok(cible.startsWith('.'), `${f} : import « ${cible} » inconnu (ni relatif, ni « three »)`);
      await access(new URL(cible, new URL(`js/${f}`, RACINE))).catch(() => assert.fail(`${f} importe « ${cible} », introuvable`));
    }
  }
  await access(new URL(page.match(/<script type="module" src="([^"]+)"/)[1], RACINE));
});

test('nouvelle version : chaque curiosité a son modèle, sa place et son étiquette', () => {
  for (const { id } of CURIOSITES) {
    assert.equal(typeof MODELES[id], 'function', `${id} : pas de modèle dans js/procedural/modeles.js`);
    assert.ok(PLACES[id] && PLACES[id].p.length === 3, `${id} : pas de place dans js/donnees/objets.js`);
    assert.ok(ORDRE_ETIQUETTES.includes(id), `${id} : absent de ORDRE_ETIQUETTES (js/procedural/textures.js)`);
  }
});
