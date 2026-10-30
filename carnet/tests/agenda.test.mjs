import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparer, different, agendasVoulus, evenementsVoulus } from '../js/agenda.js';
import { construireCreneaux, planifier } from '../js/moteur.js';
import { depuisGoogle, interpreter } from '../js/pronote.js';
import { semaineGoogle } from './fixtures.mjs';

const ev = (cle, extra = {}) => ({ id: `id-${cle}`, summary: 'x', description: 'd', location: '', start: { dateTime: '2026-11-02T08:20:00Z' }, end: { dateTime: '2026-11-02T09:15:00Z' }, reminders: { useDefault: false }, extendedProperties: { private: { carnet: '1', cle } }, ...extra });
const voulu = (cle, calId = 'A', corps = {}) => ({ cle, calId, corps: { summary: 'x', description: 'd', location: '', start: { dateTime: '2026-11-02T08:20:00.000Z' }, end: { dateTime: '2026-11-02T09:15:00.000Z' }, reminders: { useDefault: false }, ...corps } });

test('comparer : créer, garder, modifier, supprimer', () => {
  const r = comparer(
    [voulu('a'), voulu('b', 'A', { summary: 'nouveau titre' }), voulu('c')],
    [{ calId: 'A', ev: ev('a') }, { calId: 'A', ev: ev('b') }, { calId: 'A', ev: ev('vieux') }],
  );
  assert.deepEqual(r.creer.map((x) => x.cle), ['c']);
  assert.deepEqual(r.modifier.map((x) => [x.cle, x.id]), [['b', 'id-b']]);
  assert.deepEqual(r.supprimer.map((x) => x.ev.id), ['id-vieux']);
});

test('comparer : un doublon est supprimé, un événement sans marque n’est jamais touché', () => {
  const r = comparer([voulu('a')], [
    { calId: 'A', ev: ev('a') }, { calId: 'A', ev: { ...ev('a'), id: 'double' } },
    { calId: 'A', ev: { id: 'a-la-main', summary: 'Réunion parents', start: {}, end: {} } },
  ]);
  assert.deepEqual(r.supprimer.map((x) => x.ev.id), ['double']);
  assert.equal(r.creer.length + r.modifier.length, 0);
});

test('comparer : passer d’un agenda unique aux agendas par niveau déplace l’événement', () => {
  const r = comparer([voulu('a', 'B')], [{ calId: 'A', ev: ev('a') }]);
  assert.deepEqual(r.supprimer.map((x) => x.calId), ['A']);
  assert.deepEqual(r.creer.map((x) => x.calId), ['B']);
});

test('différent : mêmes instants écrits autrement, espaces de description', () => {
  assert.equal(different(ev('a', { description: 'd \n' }), voulu('a').corps), false);
  assert.equal(different(ev('a'), voulu('a', 'A', { colorId: '10' }).corps), true);
  assert.equal(different(ev('a'), voulu('a', 'A', { reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] } }).corps), true);
});

test('agendas voulus : par niveau avec couleurs choisies, ou un seul', () => {
  assert.deepEqual(agendasVoulus({ parNiveau: true, couleurs: { '5e': '#123456' } }, ['5e', '6e']).map((a) => [a.nom, a.couleur]),
    [['Carnet · 5e', '#123456'], ['Carnet · 6e', '#7cb342'], ['Carnet · Établissement', '#8a8f87']]);
  assert.deepEqual(agendasVoulus({ parNiveau: false }, ['5e']).map((a) => a.nom), ['Carnet de bord']);
});

test('événements voulus : une évaluation colorée, un demi-groupe en deux, l’AESH dans la description', () => {
  const TZ = 'Europe/Paris';
  const cours = semaineGoogle.map((e) => interpreter(depuisGoogle(e, TZ)));
  const creneaux = construireCreneaux(cours, { fuseau: TZ, dureeSeance: 55 });
  const v = {
    reglages: {},
    classes: { '5G3': { nom: '503', niveau: '5e', file: [{ u: 'x', eid: 'E' }] } },
    etapes: { E: { titre: 'Évaluation – Respiration', duree: 1, eval: true } },
    journal: {},
  };
  const plan = planifier(v, creneaux.filter((c) => c.code === '5G3'), { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  const voulus = evenementsVoulus({ creneaux: creneaux.filter((c) => c.code === '5G3'), plan, v, fuseau: TZ, etablissement: [], coupures: [] }, { parNiveau: true }, { debut: '2026-11-01', fin: '2026-11-30', urlAppli: 'https://exemple.fr/carnet/' });
  assert.deepEqual(voulus.map((x) => x.cle), ['5G3_20261102_0920_P2', '5G3_20261102_0920_P1', '5G3_20261105_1035']);
  assert.equal(voulus[0].agenda, 'niveau:5e');
  assert.equal(voulus[0].corps.colorId, '10');
  assert.match(voulus[0].corps.summary, /^503 P2 · ✎ Évaluation – Respiration$/);
  assert.match(voulus[0].corps.description, /Avec Mme MARTIN S\./);
  assert.equal(voulus[0].corps.source.url, 'https://exemple.fr/carnet/#creneau=5G3_20261102_0920');
  assert.equal(voulus[2].corps.summary, '503 · à préparer');
  assert.match(voulus[2].corps.description, /Inclusion : ULIS GALVANI, ULIS LEPELLETIER/);
});
