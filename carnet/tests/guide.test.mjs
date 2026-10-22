// La page « Activer la connexion Google » doit lister exactement les autorisations que l'appli
// demande : sinon Google refuserait la connexion (autorisation non déclarée) ou en accorderait trop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PORTEES } from '../js/google.js';
import { CONFIG } from '../config.js';

const page = await readFile(new URL('../brancher-google.html', import.meta.url), 'utf8');

test('guide : la liste des autorisations à coller est celle que l’appli demande', () => {
  const liste = page.match(/<pre[^>]*id="v-portees"[^>]*>([^<]*)<\/pre>/)[1].trim().split('\n').map((x) => x.trim());
  const attendues = PORTEES.map((x) => (x === 'email' ? 'https://www.googleapis.com/auth/userinfo.email' : x));
  assert.deepEqual(liste, attendues);
});

test('guide : les adresses écrites dans la page sont celles de config.js', () => {
  const u = new URL(CONFIG.urlPublique);
  const valeur = (id) => page.match(new RegExp(`id="${id}">([^<]*)<`))[1];
  assert.equal(valeur('v-accueil'), u.href);
  assert.equal(valeur('v-retour'), u.href);
  assert.equal(valeur('v-origine'), u.origin);
  assert.equal(valeur('v-domaine'), u.hostname);
  assert.equal(valeur('v-confidentialite'), new URL('confidentialite.html', u).href);
});
