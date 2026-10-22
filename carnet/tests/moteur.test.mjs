import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planifier, reprise, jusqua, pointsArret, seancesLisible, fractionLisible,
  peloton, aPreparer, plagesLibres, avantCoupure, coupures, arretDe, positionDe,
} from '../js/moteur.js';
import { instantDe } from '../js/dates.js';

const TZ = 'Europe/Paris';
const cr = (code, jour, hhmm, cap = 1, annule = false) => {
  const debut = instantDe(jour, hhmm, TZ);
  return { cle: `${code}_${jour.replace(/-/g, '')}_${hhmm.replace(':', '')}`, code, jour, debut, fin: new Date(debut.getTime() + 55 * 60000 * cap), capacite: annule ? 0 : cap, annule, demi: false, parties: [] };
};
const JOURS = ['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18'];
const creneaux = JOURS.map((j) => cr('5G1', j, '09:20'));
const etapes = {
  A: { titre: 'Activité 1', duree: 1, jalons: ['Situation', 'Hypothèses', 'Protocole', 'Bilan'] },
  B: { titre: 'Activité 2', duree: 0.5 },
  C: { titre: 'Évaluation', duree: 1, eval: true },
  D: { titre: 'Bilan', duree: 0.5, photocopies: 2 },
};
const file = [{ u: 'a', eid: 'A' }, { u: 'b', eid: 'B' }, { u: 'c', eid: 'C' }, { u: 'd', eid: 'D' }];
const donnees = (journal = {}, extra = {}) => ({
  classes: { '5G1': { code: '5G1', nom: '501', niveau: '5e', effectif: 27, file, ...extra } },
  etapes, journal, reglages: {},
});
const lire = (plan, cles = creneaux.map((c) => c.cle)) => cles.map((k) => {
  const p = plan.parCreneau[k];
  if (p.etat === 'annule') return 'annulé';
  if (p.etat === 'couvert') return 'couvert';
  const segs = p.segments.map((s) => `${s.eid}(${s.de}→${s.a})`).join(' ');
  return [p.etat === 'valide' ? '✓' : '', segs, p.libre > 0 ? `libre ${p.libre}` : ''].filter(Boolean).join(' ');
});

test('sans validation : la file coule sur les créneaux, l’évaluation n’est pas coupée en deux', () => {
  const plan = planifier(donnees(), creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.deepEqual(lire(plan), [
    'A(0→1)', 'B(0→1) libre 0.5', 'C(0→1)', 'D(0→1) libre 0.5', 'libre 1', 'libre 1',
  ]);
  const pc = plan.parClasse['5G1'];
  assert.equal(pc.premierLibre.jour, '2026-11-04');
  assert.equal(pc.couvertJusqua, '2026-11-02');
  assert.equal(pc.finFile.jour, '2026-11-11');
  assert.equal(pc.total, 3);
});

test('une étape « ne pas couper » plus longue qu’un cours se répartit quand même', () => {
  const d = donnees();
  d.etapes = { ...etapes, A: { ...etapes.A, duree: 2, insecable: true } };
  const plan = planifier(d, creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.deepEqual(lire(plan).slice(0, 3), ['A(0→0.5)', 'A(0.5→1)', 'B(0→1) libre 0.5']);
});

test('un point d’arrêt après les hypothèses : on reprend au protocole', () => {
  const journal = { [creneaux[0].cle]: { code: '5G1', arret: { u: 'a', f: 0.5 } } };
  const plan = planifier(donnees(journal), creneaux, { auj: '2026-11-05', maintenant: new Date('2026-11-05T11:00:00Z') });
  assert.deepEqual(lire(plan), [
    '✓ A(0→0.5)', 'A(0.5→1) B(0→1)', 'C(0→1)', 'D(0→1) libre 0.5', 'libre 1', 'libre 1',
  ]);
  const seg = plan.parCreneau[creneaux[1].cle].segments[0];
  assert.deepEqual(reprise(seg, etapes.A), { texte: 'Protocole', jalon: 2 });
  assert.equal(jusqua(seg, etapes.A).fin, true);
  assert.equal(plan.parCreneau[creneaux[1].cle].aValider, true);
  const pc = plan.parClasse['5G1'];
  assert.equal(pc.aValider, 1);
  assert.deepEqual(pc.position, { i: 2, f: 0 });
  assert.equal(pc.avancement, 1.5);
});

test('une validation oubliée ne fausse rien : le dernier point fait foi', () => {
  const journal = { [creneaux[1].cle]: { code: '5G1', arret: { u: 'b', f: 1 } } };
  const plan = planifier(donnees(journal), creneaux, { auj: '2026-11-05', maintenant: new Date('2026-11-05T11:00:00Z') });
  assert.deepEqual(lire(plan).slice(0, 3), ['couvert', '✓ A(0→1) B(0→1)', 'C(0→1)']);
  assert.equal(plan.parClasse['5G1'].aValider, 0);
});

test('un cours annulé : la suite glisse au créneau suivant', () => {
  const cs = creneaux.map((c, k) => (k === 1 ? { ...c, annule: true, capacite: 0 } : c));
  const plan = planifier(donnees(), cs, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.deepEqual(lire(plan, cs.map((c) => c.cle)).slice(0, 4), ['A(0→1)', 'annulé', 'B(0→1) libre 0.5', 'C(0→1)']);
});

test('une validation dont l’heure a changé dans Pronote se raccroche au même jour', () => {
  const journal = { '5G1_20261102_0800': { code: '5G1', jour: '2026-11-02', arret: { u: 'a', f: 1 } } };
  const plan = planifier(donnees(journal), creneaux, { auj: '2026-11-03', maintenant: new Date('2026-11-03T12:00:00Z') });
  assert.equal(plan.parCreneau[creneaux[0].cle].etat, 'valide');
  assert.deepEqual(lire(plan)[1], 'B(0→1) libre 0.5');
});

test('évaluation : le créneau d’une semaine avant est passé, on prévient au prochain cours', () => {
  const plan = planifier(donnees(), creneaux, { auj: '2026-11-03', maintenant: new Date('2026-11-03T12:00:00Z') });
  assert.deepEqual(Object.keys(plan.annonces), [creneaux[1].cle]);
  assert.deepEqual(plan.annonces[creneaux[1].cle].map((a) => [a.titre, a.jourEval, a.tard]), [['Évaluation', '2026-11-09', true]]);
});

test('évaluation : annoncée une semaine avant, au bon créneau', () => {
  const d = donnees();
  d.etapes = { ...etapes, A: { ...etapes.A, duree: 2 }, B: { ...etapes.B, duree: 1 } };
  const plan = planifier(d, creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.equal(lire(plan)[3], 'C(0→1)');
  assert.deepEqual(Object.keys(plan.annonces), [creneaux[1].cle]);
  assert.equal(plan.annonces[creneaux[1].cle][0].tard, false);
  const dejaFait = { ...d, classes: { '5G1': { ...d.classes['5G1'], annonces: { c: true } } } };
  assert.deepEqual(planifier(dejaFait, creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') }).annonces, {});
});

test('un créneau double avance de deux séances', () => {
  const cs = [cr('5G1', '2026-11-02', '08:25', 2), cr('5G1', '2026-11-04', '08:25')];
  const plan = planifier(donnees(), cs, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.deepEqual(lire(plan, cs.map((c) => c.cle)), ['A(0→1) B(0→1) libre 0.5', 'C(0→1)']);
});

test('point de départ : une classe déjà avancée avant le suivi', () => {
  const plan = planifier(donnees({}, { depart: { u: 'b', f: 0 } }), creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.equal(lire(plan)[0], 'B(0→1) libre 0.5');
});

test('libellés', () => {
  assert.equal(seancesLisible(1), '1 séance');
  assert.equal(seancesLisible(0.5), '½ séance');
  assert.equal(seancesLisible(2.25), '2 séances ¼');
  assert.equal(fractionLisible(0.5), '½');
  assert.equal(fractionLisible(1 / 3), '33 %');
  assert.deepEqual(pointsArret(etapes.A).map((p) => p.libelle), ['Pas commencée', 'Situation', 'Hypothèses', 'Protocole', 'Bilan']);
  assert.deepEqual(pointsArret(etapes.B).map((p) => p.f), [0, 0.25, 0.5, 0.75, 1]);
  assert.deepEqual(jusqua({ de: 0, a: 0.5 }, etapes.A), { texte: 'Hypothèses', jalon: 1 });
  assert.deepEqual(reprise({ de: 0.5 }, etapes.B), { texte: '½' }); // affiché « reprendre à ½ »
});

test('positions et arrêts : aller-retour, étape supprimée', () => {
  assert.deepEqual(positionDe({ u: 'b', f: 1 }, file), { i: 2, f: 0 });
  assert.deepEqual(arretDe({ i: 4, f: 0 }, file), { u: 'd', f: 1, rang: 4 });
  assert.deepEqual(positionDe({ u: 'disparue', f: 0.5, rang: 3 }, file), { i: 3, f: 0 });
});

test('où en sont mes classes : deux 6e sur la même suite', () => {
  const etapes6 = { X: { titre: 'Vivant ou non vivant', duree: 1 }, Y: { titre: 'Cellule', duree: 1 } };
  const f6 = (p) => [{ u: `${p}x`, eid: 'X' }, { u: `${p}y`, eid: 'Y' }];
  const cs = [cr('6G2', '2026-11-03', '12:55'), cr('6G3', '2026-11-03', '15:05')];
  const d = {
    classes: { '6G2': { niveau: '6e', file: f6('a') }, '6G3': { niveau: '6e', file: f6('b') } },
    etapes: etapes6, reglages: {},
    journal: { [cs[0].cle]: { code: '6G2', arret: { u: 'ax', f: 1 } }, [cs[1].cle]: { code: '6G3', arret: { u: 'bx', f: 0.5 } } },
  };
  const plan = planifier(d, cs, { auj: '2026-11-04', maintenant: new Date('2026-11-04T08:00:00Z') });
  const [niv] = peloton(d, plan);
  assert.equal(niv.niveau, '6e');
  assert.deepEqual(niv.lignes.map((l) => [l.code, l.rang, l.retard]), [['6G2', 1, 0], ['6G3', 0.5, 0.5]]);
});

test('à préparer : les photocopies de l’étape qui commence', () => {
  const plan = planifier(donnees(), creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  const prep = aPreparer(donnees(), plan, creneaux, { auj: '2026-11-01', jours: 10 });
  assert.deepEqual(prep.map((p) => [p.jour, p.eid, p.pages, p.effectif]), [['2026-11-11', 'D', 2, 27]]);
});

test('trous de la journée, entre les cours et les rendez-vous', () => {
  const ev = (h0, h1, pro) => { const d = instantDe('2026-11-02', h0, TZ), f = instantDe('2026-11-02', h1, TZ); return { debut: d, fin: f, jour0: '2026-11-02', jour1: '2026-11-02', pro }; };
  const libres = plagesLibres([ev('08:25', '09:20', 1), ev('09:20', '10:15', 1), ev('12:00', '13:00', 0), ev('13:55', '14:50', 1)], '2026-11-02', { fuseau: TZ });
  assert.deepEqual(libres, [[615, 720], [780, 835]]);
});

test('avant les vacances : la file tient-elle ?', () => {
  const vac = [{ type: 'vacances', jour0: '2026-11-12', jour1: '2026-11-15', titre: 'Vacances' }];
  const k = coupures(vac, creneaux);
  const plan = planifier(donnees(), creneaux, { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  const r = avantCoupure(plan, creneaux, k, '5G1', { auj: '2026-11-01', maintenant: new Date('2026-11-01T12:00:00Z') });
  assert.equal(r.coupure.debut, '2026-11-12');
  assert.equal(r.seances, 4);
  assert.equal(r.resteFile, 3);
  assert.equal(r.marge, 1);
  assert.equal(r.finFile.jour, '2026-11-11');
});
