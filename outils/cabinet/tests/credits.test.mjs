// Règle du site : aucun fichier téléchargé sans son crédit, et seulement CC0 ou CC BY.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, access } from 'node:fs/promises';
import { TEXTURES, LICENCES } from '../js/donnees/credits.js';

const DOSSIER = new URL('../textures/', import.meta.url);

test('chaque fichier de textures/ a son crédit, et chaque crédit son fichier', async () => {
  const fichiers = (await readdir(DOSSIER)).filter((f) => !f.startsWith('.'));
  const declares = Object.values(TEXTURES).flatMap((t) => Object.values(t.fichiers));
  for (const f of fichiers) assert.ok(declares.includes(f), `textures/${f} n’a pas d’entrée dans js/donnees/credits.js`);
  for (const f of declares) await access(new URL(f, DOSSIER)).catch(() => assert.fail(`credits.js cite textures/${f}, introuvable`));
});

test('licences CC0 ou CC BY seulement, avec auteurs, source et taille réelle', () => {
  for (const [id, t] of Object.entries(TEXTURES)) {
    assert.ok(LICENCES[t.licence], `${id} : licence « ${t.licence} » non admise (CC0 ou CC BY seulement)`);
    assert.ok(t.auteurs && t.auteurs.trim(), `${id} : auteurs manquants`);
    assert.match(t.source, /^https:\/\//, `${id} : lien vers la fiche d’origine manquant`);
    assert.ok(t.taille > 0, `${id} : taille réelle manquante`);
    assert.deepEqual(Object.keys(t.fichiers).sort(), ['arm', 'couleur', 'relief'], `${id} : il faut les trois cartes`);
  }
});
