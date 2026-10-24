// Calendrier des étapes, prochaines évaluations, heures de sonnerie, mercredi après-midi et
// semaines A/B : ce que les écrans à la manière de Pronote lisent dans le moteur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planifier, calendrierEtapes, prochainesEvaluations, placesHoraires, apresMidiLibre, lettreSemaine, construireCreneaux } from '../js/moteur.js';
import { depuisGoogle, interpreter } from '../js/pronote.js';
import { instantDe } from '../js/dates.js';
import { semaineGoogle } from './fixtures.mjs';

const TZ = 'Europe/Paris';
const cr = (code, jour, hhmm, cap = 1) => {
  const debut = instantDe(jour, hhmm, TZ);
  return { cle: `${code}_${jour.replace(/-/g, '')}_${hhmm.replace(':', '')}`, code, jour, debut, fin: new Date(debut.getTime() + 55 * 60000 * cap), capacite: cap, annule: false, demi: false, parties: [] };
};
const JOURS = ['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-16'];
const creneaux = JOURS.map((j) => cr('5G1', j, '09:20'));
const etapes = {
  A: { titre: 'Activité 1', duree: 1 },
  B: { titre: 'Activité 2', duree: 1.5 },
  C: { titre: 'Évaluation', duree: 0.5, eval: true },
  D: { titre: 'Bilan', duree: 1 },
};
const donnees = (journal = {}) => ({
  classes: { '5G1': { code: '5G1', niveau: '5e', file: [{ u: 'a', eid: 'A' }, { u: 'b', eid: 'B' }, { u: 'c', eid: 'C' }, { u: 'd', eid: 'D' }], annonces: {} } },
  etapes, journal, reglages: {},
});

test('calendrier des étapes : faites, en cours, prévues, au-delà de l’emploi du temps', () => {
  // Le 2 novembre : l'activité 1 et le début de la 2. Nous sommes le 5 : le 4 est passé, non validé.
  const journal = { [creneaux[0].cle]: { code: '5G1', arret: { u: 'b', f: 0 } } };
  const plan = planifier(donnees(journal), creneaux, { auj: '2026-11-05', maintenant: new Date('2026-11-05T12:00:00Z') });
  const cal = calendrierEtapes(plan, creneaux)['5G1'];
  assert.deepEqual(cal.a, { debut: '2026-11-02', fin: '2026-11-02', etat: 'faite' });
  assert.deepEqual(cal.b, { debut: '2026-11-04', fin: '2026-11-09', etat: 'encours' }, 'commencée le 4 (supposé comme prévu), finie le 9');
  assert.deepEqual(cal.c, { debut: '2026-11-09', fin: '2026-11-09', etat: 'prevue' });
  assert.deepEqual(cal.d, { debut: '2026-11-11', fin: '2026-11-11', etat: 'prevue' });
  const court = planifier(donnees(), creneaux.slice(0, 2), { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.equal(calendrierEtapes(court, creneaux.slice(0, 2))['5G1'].d.etat, 'au-dela', 'pas de cours connu pour le bilan');
});

test('prochaines évaluations : la date prévue, annoncée ou non', () => {
  const d = donnees();
  const plan = planifier(d, creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.deepEqual(prochainesEvaluations(d, plan, creneaux, { maintenant: new Date('2026-11-01T12:00:00Z') }).map((e) => [e.code, e.titre, e.jour, e.annoncee]),
    [['5G1', 'Évaluation', '2026-11-09', false]]);
  d.classes['5G1'].annonces = { c: true };
  assert.equal(prochainesEvaluations(d, plan, creneaux, { maintenant: new Date('2026-11-01T12:00:00Z') })[0].annoncee, true);
  assert.deepEqual(prochainesEvaluations(d, plan, creneaux, { maintenant: new Date('2026-11-10T12:00:00Z') }), [], 'passée : plus à venir');
});

test('heures de sonnerie d’un vrai emploi du temps : la récréation reste dans son créneau', () => {
  const cours = semaineGoogle.map((e) => interpreter(depuisGoogle(e, TZ))).filter(Boolean);
  const { places, recres } = placesHoraires(cours, TZ);
  const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}`;
  assert.deepEqual(places.map(hm), ['08h25', '09h20', '10h35', '11h30', '12h25', '12h55', '13h50', '15h05', '16h00']);
  assert.deepEqual(recres.map(([a, b]) => `${hm(a)}–${hm(b)}`), ['10h15–10h35']);
  assert.equal(apresMidiLibre(cours, TZ), true, 'aucun cours le mercredi après-midi');
  const avecMercredi = [...cours, interpreter(depuisGoogle({ id: 'x', summary: 'SVT - 5G1', description: 'Matière : SVT\nClasse : 5G1', start: { dateTime: '2026-11-04T13:00:00Z' }, end: { dateTime: '2026-11-04T13:55:00Z' } }, TZ))];
  assert.equal(apresMidiLibre(avecMercredi, TZ), false);
  assert.ok(construireCreneaux(cours, { fuseau: TZ }).length > 0);
});

test('semaines A et B : on compte les semaines de cours, les vacances n’en sont pas', () => {
  const ref = { lundi: '2026-11-02', lettre: 'B' };
  // Toussaint, Noël, et une semaine isolée sans cours (fictive) : c'est elle qui départage.
  const coupures = [{ debut: '2026-10-17', fin: '2026-11-01' }, { debut: '2026-12-19', fin: '2027-01-03' }, { debut: '2027-02-06', fin: '2027-02-14' }];
  assert.equal(lettreSemaine('2026-11-04', ref, coupures), 'B', 'n’importe quel jour de la semaine');
  assert.equal(lettreSemaine('2026-11-09', ref, coupures), 'A');
  assert.equal(lettreSemaine('2026-12-14', ref, coupures), 'B');
  assert.equal(lettreSemaine('2026-12-21', ref, coupures), '', 'vacances de Noël : pas de lettre');
  assert.equal(lettreSemaine('2027-01-04', ref, coupures), 'A');
  assert.equal(lettreSemaine('2027-02-15', ref, coupures), 'B', 'la semaine sans cours ne compte pas : sinon ce serait A');
  assert.equal(lettreSemaine('2026-10-12', ref, coupures), 'A', 'avant la Toussaint, en remontant');
  assert.equal(lettreSemaine('2026-11-09', null, coupures), '', 'sans référence, pas de lettre');
});
