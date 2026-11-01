// Le fichier unique doit suivre le Carnet : après toute modification, « node assembler.mjs ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assembler } from '../assembler.mjs';

test('carnet-complet.html est à jour (sinon : node assembler.mjs)', async () => {
  const attendu = await assembler();
  const actuel = await readFile(new URL('../carnet-complet.html', import.meta.url), 'utf8');
  assert.ok(actuel === attendu, 'carnet-complet.html est en retard sur le Carnet : lancez « node assembler.mjs » dans carnet/.');
});
