// Tests rapides, sans navigateur : node --test tests/*.test.mjs (depuis outils/cabinet/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CURIOSITES } from '../js/donnees/curiosites.js';
import { synchroniser, LEGERE } from '../synchroniser.mjs';

const CHAMPS = ['id', 'nom', 'latin', 'emoji', 'regne', 'ou', 'desc', 'savais'];
const legere = await readFile(LEGERE, 'utf8');

test('curiosites.js : identifiants uniques, entrées complètes', () => {
  assert.ok(CURIOSITES.length > 0);
  const ids = CURIOSITES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, `identifiant en double : ${ids.join(', ')}`);
  for (const c of CURIOSITES) {
    for (const k of CHAMPS) assert.ok(typeof c[k] === 'string' && c[k].trim(), `${c.id} : champ « ${k} » vide`);
    assert.ok(Array.isArray(c.mots) && c.mots.length > 0, `${c.id} : mots-clés manquants`);
    for (const niv of ['college', 'lycee']) {
      const q = c[niv];
      assert.ok(q, `${c.id} : question ${niv} manquante`);
      for (const k of ['q', 'expl', 'prog']) assert.ok(typeof q[k] === 'string' && q[k].trim(), `${c.id}/${niv} : « ${k} » vide`);
      assert.ok(Array.isArray(q.choix) && q.choix.length >= 2, `${c.id}/${niv} : il faut au moins deux réponses`);
      assert.ok(q.choix.every((t) => typeof t === 'string' && t.trim()), `${c.id}/${niv} : réponse vide`);
      assert.equal(new Set(q.choix).size, q.choix.length, `${c.id}/${niv} : deux réponses identiques`);
    }
  }
});

test('chaque curiosité a sa place et son modèle dans la version légère', () => {
  const places = legere.slice(legere.indexOf('const PLACES = {'), legere.indexOf('};', legere.indexOf('const PLACES = {')));
  const modeles = legere.slice(legere.indexOf('const MODELES = {'));
  for (const { id } of CURIOSITES) {
    assert.match(places, new RegExp(`\\n\\s+${id}:\\s*\\{p:`), `${id} : pas de place dans PLACES`);
    assert.match(modeles, new RegExp(`\\n\\s+${id}\\(B\\)\\s*\\{`), `${id} : pas de modèle dans MODELES`);
  }
});

test('la copie des textes dans la version légère est à jour (sinon : node synchroniser.mjs)', async () => {
  assert.ok(legere === await synchroniser(),
    'outils/cabinet_curiosites.html est en retard sur js/donnees/curiosites.js : lancer « node synchroniser.mjs » dans outils/cabinet/ (après avoir vérifié que Manon n’a pas corrigé la copie directement).');
});

test('Three.js r187 est intact (empreintes de vendor/three-r187/SHA256SUMS)', async () => {
  const dossier = new URL('../vendor/three-r187/', import.meta.url);
  const lignes = (await readFile(new URL('SHA256SUMS', dossier), 'utf8')).trim().split('\n');
  assert.equal(lignes.length, 3);
  for (const l of lignes) {
    const [empreinte, nom] = l.split(/\s+/);
    const calcul = createHash('sha256').update(await readFile(new URL(nom, dossier))).digest('hex');
    assert.equal(calcul, empreinte, `${nom} a été modifié : ne jamais retoucher les fichiers de Three.js, en changer la version entière`);
  }
  assert.match(await readFile(new URL('three.core.js', dossier), 'utf8'), /const REVISION = '187';/);
});

test('aucun .md du cabinet ne fait échouer Jekyll (pas de double accolade ni d’accolade-pourcentage)', async () => {
  const fichiers = (await readdir(new URL('../', import.meta.url), { recursive: true })).filter((f) => f.endsWith('.md') && !f.includes('node_modules'));
  fichiers.push('../../CLAUDE.md');
  for (const f of fichiers) {
    const texte = await readFile(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.ok(!/\{\{|\{%/.test(texte), `${f} contient une double accolade ou une accolade-pourcentage : la publication du site échouerait`);
  }
});
