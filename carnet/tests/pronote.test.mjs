import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lireIcs, deplier, desechapper, lireDuree } from '../js/ics.js';
import { depuisGoogle, interpreter, deduireNoms, niveauDe, lireChamps, estLienIcal, estQrConnexionPronote } from '../js/pronote.js';
import { construireCreneaux, dureeSeanceProbable, coupures } from '../js/moteur.js';
import { heureDe, jourDe } from '../js/dates.js';
import { semaineGoogle, extraitIcs } from './fixtures.mjs';

const TZ = 'Europe/Paris';
const cours = semaineGoogle.map((e) => interpreter(depuisGoogle(e, TZ)));
const parId = Object.fromEntries(cours.map((c) => [c.id, c]));

test('un demi-groupe : classe, groupe, salle, accompagnant', () => {
  const c = parId.c1;
  assert.equal(c.type, 'cours');
  assert.equal(c.code, '5G3');
  assert.equal(c.demi, true);
  assert.equal(c.groupe, 'P2');
  assert.equal(c.salle, '107');
  assert.equal(c.accompagnant, 'Mme MARTIN S.');
  assert.equal(c.matiere, 'SCIENCES VIE & TERRE');
  assert.equal(heureDe(c.debut, TZ), '09:20');
});

test('une classe entière', () => {
  const c = parId.c3;
  assert.equal(c.code, '5G1');
  assert.equal(c.demi, false);
  assert.equal(c.groupe, '');
});

test('une classe entière avec des élèves d’ULIS : pas un demi-groupe', () => {
  const c = parId.c11;
  assert.equal(c.code, '5G3');
  assert.equal(c.demi, false);
  assert.deepEqual(c.inclusions, ['ULIS GALVANI', 'ULIS LEPELLETIER']);
  assert.equal(c.nomSuggere, '503');
});

test('ce qui n’est pas un cours', () => {
  assert.equal(parId.e1.type, 'etablissement');
  assert.equal(parId.e2.type, 'etablissement');
  assert.equal(parId.v1.type, 'vacances');
  assert.equal(parId.v1.jour0, '2026-10-18');
  assert.equal(parId.v1.jour1, '2026-11-01');
});

test('les noms d’usage se déduisent d’un seul exemple (5G3 → 503)', () => {
  assert.deepEqual(deduireNoms(cours), { '5G3': '503', '5G1': '501', '6G2': '602', '6G3': '603', '5G4': '504', '3G4': '304' });
});

test('niveaux', () => {
  assert.equal(niveauDe('5G3', '503'), '5e');
  assert.equal(niveauDe('6G2'), '6e');
  assert.equal(niveauDe('3G4'), '3e');
  assert.equal(niveauDe('2NDE3'), '2nde');
  assert.equal(niveauDe('TG1'), 'Tle');
  assert.equal(niveauDe('1G2'), '1re');
  assert.equal(niveauDe('BTS'), 'Autre');
});

test('créneaux : les deux moitiés d’une classe le même jour ne font qu’un créneau', () => {
  const cr = construireCreneaux(cours, { fuseau: TZ, dureeSeance: 55 });
  const resume = cr.map((c) => `${c.code} ${c.jour} ${heureDe(c.debut, TZ)} ${c.demi ? c.groupes.join('+') : 'entière'} ×${c.capacite}`);
  assert.deepEqual(resume, [
    '5G3 2026-11-02 09:20 P2+P1 ×1',
    '5G1 2026-11-03 10:35 entière ×1',
    '6G2 2026-11-03 12:55 entière ×1',
    '6G3 2026-11-03 15:05 entière ×1',
    '5G1 2026-11-04 08:25 P2+P1 ×1',
    '5G4 2026-11-04 11:30 entière ×1',
    '6G2 2026-11-05 08:25 P2+P1 ×1',
    '5G3 2026-11-05 10:35 entière ×1',
    '3G4 2026-11-05 11:30 entière ×1',
  ]);
  assert.equal(cr[0].cle, '5G3_20261102_0920');
  assert.deepEqual(cr[7].inclusions, ['ULIS GALVANI', 'ULIS LEPELLETIER']);
  assert.deepEqual(cr[0].accompagnants, ['Mme MARTIN S.']);
});

test('durée de séance devinée : 55 min', () => {
  assert.equal(dureeSeanceProbable(cours), 55);
});

test('heure double enchaînée : un créneau de deux séances', () => {
  const a = interpreter(depuisGoogle({ id: 'd1', summary: 'SVT - 4G1', description: 'Matière : SVT\nClasse : 4G1', start: { dateTime: '2026-11-06T07:25:00Z' }, end: { dateTime: '2026-11-06T08:20:00Z' } }, TZ));
  const b = interpreter(depuisGoogle({ id: 'd2', summary: 'SVT - 4G1', description: 'Matière : SVT\nClasse : 4G1', start: { dateTime: '2026-11-06T08:20:00Z' }, end: { dateTime: '2026-11-06T09:15:00Z' } }, TZ));
  const cr = construireCreneaux([a, b], { fuseau: TZ, dureeSeance: 55 });
  assert.equal(cr.length, 1);
  assert.equal(cr[0].capacite, 2);
});

test('un conseil de classe nommé comme un cours, sans matière, reste une réunion', () => {
  const r = interpreter(depuisGoogle({ id: 'r', summary: 'Conseil de classe - 3G4', description: 'Salle des professeurs', start: { dateTime: '2026-12-08T16:00:00Z' }, end: { dateTime: '2026-12-08T17:00:00Z' } }, TZ));
  assert.equal(r.type, 'etablissement');
});

test('iCal : dépliage, échappements, fuseau, alarme ignorée', () => {
  assert.equal(deplier('A\r\n B\r\n\tC'), 'ABC');
  assert.equal(desechapper('a\\nb\\, c\\; d\\\\e'), 'a\nb, c; d\\e');
  assert.equal(lireDuree('PT55M'), 55 * 60000);
  assert.equal(lireDuree('P1DT1H'), 25 * 3600000);
  const { nom, evenements } = lireIcs(extraitIcs, { fuseau: TZ });
  assert.match(nom, /DURAND/);
  assert.equal(evenements.length, 4);
  const [a, b, v, x] = evenements.map(interpreter);
  assert.equal(heureDe(a.debut, TZ), '09:20');
  assert.equal(a.code, '5G3');
  assert.equal(a.groupe, 'P2');
  assert.equal(a.accompagnant, 'Mme MARTIN S.');
  assert.equal(b.code, '5G1');
  assert.equal(heureDe(b.debut, TZ), '10:35');
  assert.equal(v.type, 'vacances');
  assert.equal(v.jour0, '2026-12-19');
  assert.equal(v.jour1, '2027-01-03');
  assert.equal(x.annule, true);
  assert.equal(x.statutPronote, 'Cours annulé');
  assert.equal(jourDe(x.fin, TZ), '2026-11-05');
  assert.equal(heureDe(x.fin, TZ), '12:15');
});

test('changement d’heure : 9h en hiver comme en été, lu dans le bon fuseau', () => {
  const { evenements } = lireIcs([
    'BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:a', 'DTSTART;TZID=Europe/Paris:20270329T090000', 'DTEND;TZID=Europe/Paris:20270329T095500', 'SUMMARY:x', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:b', 'DTSTART;TZID=/mozilla.org/20050126_1/Europe/Paris:20270326T090000', 'DTEND;TZID=Europe/Paris:20270326T095500', 'SUMMARY:y', 'END:VEVENT', 'END:VCALENDAR',
  ].join('\n'), { fuseau: 'UTC' });
  assert.equal(evenements[0].debut.toISOString(), '2027-03-29T07:00:00.000Z');
  assert.equal(evenements[1].debut.toISOString(), '2027-03-26T08:00:00.000Z');
});

test('champs de description, liens et QR codes', () => {
  assert.deepEqual(lireChamps('Matière : SVT\nSalle : 107'), { matiere: 'SVT', salle: '107' });
  assert.equal(estLienIcal('https://0000000x.index-education.net/pronote/ical/mesinformations.ics?icalsecurise=ABC&version=2026'), true);
  assert.equal(estLienIcal('webcal://exemple.fr/agenda.ics'), true);
  assert.equal(estLienIcal('https://www.exemple.fr/'), false);
  assert.equal(estQrConnexionPronote('{"jeton":"x","login":"y","url":"https://z"}'), true);
  assert.equal(estQrConnexionPronote('https://z'), false);
});

test('coupures : vacances de Pronote et trou de plus d’une semaine', () => {
  const k = coupures(cours, construireCreneaux(cours, { fuseau: TZ }));
  assert.deepEqual(k.map((x) => [x.debut, x.fin, x.titre]), [['2026-10-18', '2026-11-01', 'Vacances']]);
});
