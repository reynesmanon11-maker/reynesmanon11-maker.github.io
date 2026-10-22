import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fusionner, purger, vue, importer, exporter, identiques } from '../js/donnees.js';

test('fusion : document par document, le plus récent gagne', () => {
  const tel = { 'classes/5G1': { nom: '501', _m: 10 }, 'journal/x': { arret: { u: 'a', f: 0.5 }, _m: 30 } };
  const pc = { 'classes/5G1': { nom: '501 bis', _m: 20 }, 'taches/t': { texte: 'clés du labo', _m: 5 } };
  const m = fusionner(tel, pc);
  assert.equal(m['classes/5G1'].nom, '501 bis');
  assert.equal(m['journal/x'].arret.f, 0.5);
  assert.equal(m['taches/t'].texte, 'clés du labo');
});

test('fusion : commutative et idempotente, une suppression récente l’emporte', () => {
  const a = { 'taches/t': { texte: 'x', _m: 1 }, 'etapes/e': { titre: 'A', _m: 4 } };
  const b = { 'taches/t': { _x: 1, _m: 2 }, 'etapes/e': { titre: 'B', _m: 3 } };
  assert.ok(identiques(fusionner(a, b), fusionner(b, a)));
  assert.ok(identiques(fusionner(fusionner(a, b), b), fusionner(a, b)));
  assert.equal(fusionner(a, b)['taches/t']._x, 1);
  assert.equal(fusionner(a, b)['etapes/e'].titre, 'A');
  assert.equal(vue(fusionner(a, b)).taches.t, undefined);
});

test('pierres tombales purgées après 90 jours', () => {
  const j = 864e5;
  const p = purger({ 'taches/vieille': { _x: 1, _m: 0 }, 'taches/recente': { _x: 1, _m: 100 * j } }, 120 * j);
  assert.deepEqual(Object.keys(p), ['taches/recente']);
});

test('vue par collections', () => {
  const v = vue({ reglages: { debut: '2026-11-02' }, notes: { texte: 'appeler le labo' }, 'classes/6G2': { nom: '602' }, 'coches/a': { fait: true } });
  assert.equal(v.reglages.debut, '2026-11-02');
  assert.equal(v.notes, 'appeler le labo');
  assert.equal(v.classes['6G2'].nom, '602');
  assert.equal(v.coches.a.fait, true);
});

test('sauvegarde : export puis import à l’identique', () => {
  const docs = { 'classes/6G2': { nom: '602', _m: 3 } };
  const { docs: relu, origine } = importer(exporter(docs));
  assert.equal(origine, 'carnet-de-bord');
  assert.deepEqual(relu, docs);
});

test('import du carnet de claude.ai : les parts faites deviennent des points d’arrêt', () => {
  const carnet = {
    seances: {
      s1: { titre: 'Activité 5 – Le sol', duree: 1, niveau: '5e' },
      s2: { titre: 'Bilan', duree: 0.5, niveau: '5e' },
      s3: { titre: 'Évaluation', duree: 1, niveau: '5e', eval: true },
    },
    classes: { '5G1': { nom: '501', file: [{ u: 'a', sid: 's1', fait: 0.5 }, { u: 'b', sid: 's2', fait: 0 }, { u: 'c', sid: 's3', fait: 0 }], annonces: { c: true } } },
    journal: {
      '5G1_20261104_0825': { code: '5G1', items: [{ u: 'a', h: 0.5 }, { u: 'b', h: 0.5 }], note: 'fini le bilan' },
      '5G1_20261103_1035': { code: '5G1', items: [], note: 'rien avancé' },
    },
    taches: { t1: { texte: 'clés du labo', fait: false } },
    suivi: { coches: { c: { prep_x: true } } },
    reglages: { general: { debut: '2026-11-02' } },
  };
  const { docs, origine } = importer(JSON.stringify(carnet), 7);
  assert.equal(origine, 'carnet-claude');
  const v = vue(docs);
  assert.deepEqual(v.classes['5G1'].depart, { u: 'a', f: 0.5, rang: 0 });
  assert.deepEqual(v.classes['5G1'].annonces, { c: true });
  assert.deepEqual(v.journal['5G1_20261103_1035'].arret, { u: 'a', f: 0.5, rang: 0 });
  assert.deepEqual(v.journal['5G1_20261104_0825'].arret, { u: 'c', f: 0, rang: 2 });
  assert.equal(v.journal['5G1_20261104_0825'].jour, '2026-11-04');
  assert.equal(v.etapes.s3.eval, true);
  assert.equal(v.taches.t1.texte, 'clés du labo');
  assert.equal(v.coches.prep_x.fait, true);
  assert.equal(v.reglages.debut, '2026-11-02');
  assert.throws(() => importer('{"autre":1}'), /ni une sauvegarde/);
});
