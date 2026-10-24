// Import d'une programmation : en-tête et colonnes devinés, lignes → étapes, application aux
// classes, export réimportable. Les tableurs sont ceux de tests/tableurs/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lireTableur, ecrireXlsx } from '../js/tableur.js';
import {
  analyser, versEtapes, lireDuree, lireSemaine, niveauDansTexte, estNumerotation, roleDeTitre,
  planImport, lignesExport, versCsv, anneeRentree, lundiSemaineIso, modeleProgrammation,
} from '../js/programmation.js';

const fichier = (nom) => readFileSync(new URL(`./tableurs/${nom}`, import.meta.url));
let n = 0;
const nouvelId = (p = '') => `${p}${++n}`;

test('durées : séances, heures de cours, minutes, fractions', () => {
  const cas = {
    1: 1, '1,5': 1.5, '½': 0.5, '1 1/2': 1.5, '1 ½': 1.5, '2 séances': 2, '2 séance(s)': 2, '1/2 séance': 0.5,
    '1h30': 1.5, '1 h 30': 1.5, '2h': 2, '1:30': 1.5, '55 min': 1, '15 min': 0.25, '2 x 55 min': 2, '¼': 0.25,
  };
  for (const [texte, attendu] of Object.entries(cas)) assert.equal(lireDuree(texte), attendu, texte);
  assert.equal(lireDuree('3 semaines'), null, 'des semaines, sans savoir combien de cours par semaine');
  assert.equal(lireDuree('3 semaines', { seancesParSemaine: 1.5 }), 4.5);
  assert.equal(lireDuree('n’importe quoi'), null);
  assert.equal(lireDuree(''), null);
  assert.equal(lireDuree('60 min', { dureeSeance: 60 }), 1, 'lycée : séances d’une heure');
});

test('semaines visées : dates, numéros de semaine, mois, pour l’année scolaire en cours', () => {
  const r = { rentree: 2026 };
  assert.equal(lundiSemaineIso(2026, 45), '2026-11-02');
  assert.equal(lundiSemaineIso(2027, 1), '2027-01-04');
  for (const t of ['2026-11-04', '04/11/2026', '4/11', 'S45', 'semaine 45', '45', 'du 2 au 6 nov.', 'novembre']) assert.equal(lireSemaine(t, r), '2026-11-02', t);
  assert.equal(lireSemaine('lundi 16 novembre', r), '2026-11-16');
  assert.equal(lireSemaine('03/02', r), '2027-02-01', 'février : l’année d’après la rentrée');
  assert.equal(lireSemaine('janvier', r), '2027-01-04');
  assert.equal(lireSemaine('S2', r), '2027-01-11');
  assert.equal(lireSemaine('P2', r), null, 'une période sans date : rien d’inventé');
  assert.equal(lireSemaine('31/02', r), null);
  assert.equal(anneeRentree('2026-11-02'), 2026);
  assert.equal(anneeRentree('2027-03-15'), 2026);
});

test('niveaux et intitulés de colonnes', () => {
  assert.equal(niveauDansTexte('Programmation SVT 6e — 2026-2027'), '6e');
  assert.equal(niveauDansTexte('5ème'), '5e');
  assert.equal(niveauDansTexte('sixième'), '6e');
  assert.equal(niveauDansTexte('Seconde'), '2nde');
  assert.equal(niveauDansTexte('5G1'), '');
  assert.equal(roleDeTitre('Nombre de séances'), 'duree');
  assert.equal(roleDeTitre('Séance / activité'), 'titre');
  assert.equal(roleDeTitre('Travail à faire'), 'devoirs');
  assert.equal(roleDeTitre('Cahier de textes'), 'pronote');
  assert.equal(roleDeTitre('Séquence'), 'chapitre');
  assert.equal(roleDeTitre('Compétences travaillées'), 'complement');
  assert.ok(estNumerotation(['1', '2', '3', '4']));
  assert.ok(estNumerotation(['S1', 'S2', 'S3']));
  assert.ok(!estNumerotation(['1', '1', '2']), 'des durées, pas une numérotation');
  assert.ok(estNumerotation(['1', '2', '3', '1', '2']), 'une numérotation qui repart à chaque chapitre');
  assert.equal(roleDeTitre('Format'), 'format');
});

test('programmation de 6e (Excel) : en-tête sous un titre, séquences fusionnées, une ligne de séquence seule', async () => {
  const { feuilles } = await lireTableur(fichier('programmation.xlsx'));
  const lignes = feuilles[0].lignes;
  const a = analyser(lignes);
  assert.equal(a.entete, 2);
  assert.deepEqual(a.colonnes.map((c) => c.role), ['chapitre', 'titre', 'duree', 'type', 'materiel', 'semaine', 'devoirs']);
  const { etapes, chapitres, avertissements } = versEtapes(lignes, { ...a, rentree: 2026, niveau: '6e' });
  assert.deepEqual(avertissements, []);
  assert.deepEqual(chapitres, ['Séquence 1 — Le vivant et son environnement', 'Séquence 2 — Les besoins des végétaux']);
  assert.deepEqual(etapes.map((e) => [e.titre, e.duree, e.eval, e.cible]), [
    ['Sortie dehors : observer et relever les paramètres du milieu', 1, false, '2026-11-02'],
    ['Activité « Vivant ou non vivant »', 1.5, false, '2026-11-02'],
    ['Bilan : les caractéristiques du vivant', 0.5, false, ''],
    ['Évaluation courte', 0.25, true, '2026-11-09'],
    ['Activité 1 : de quoi la plante a-t-elle besoin ?', 1.5, false, '2026-11-16'],
    ['DS séquence 2', 1, true, ''],
  ]);
  assert.equal(etapes[4].chapitre, 'Séquence 2 — Les besoins des végétaux', 'chapitre repris des lignes au-dessus');
  assert.equal(etapes[1].devoirs, 'Finir la question 4');
  assert.equal(etapes[0].afaire, 'Thermomètres, luxmètre');
  assert.ok(etapes.every((e) => e.niveau === '6e'));
});

test('programmation de 5e : jalons sur plusieurs lignes ou séparés par des points-virgules, photocopies', async () => {
  const { feuilles } = await lireTableur(fichier('programmation.xlsx'));
  const lignes = feuilles[1].lignes;
  const a = analyser(lignes);
  assert.equal(a.entete, 0);
  const { etapes } = versEtapes(lignes, { ...a, rentree: 2026, niveau: '5e' });
  assert.deepEqual(etapes[0].jalons, ['Documents', 'Questions', 'Mise en commun']);
  assert.deepEqual(etapes[3].jalons, ['Problème', 'Hypothèses', 'Protocole', 'Résultats']);
  assert.equal(etapes[0].photocopies, 2);
  assert.equal(etapes[2].eval, true, '« x » dans la colonne Évaluation');
  assert.equal(etapes[3].duree, 2);
  assert.equal(etapes[3].chapitre, 'Ch. 2 La respiration');
});

test('sans ligne d’en-tête, ou avec une colonne de numéros', () => {
  const brut = [
    ['Le vivant', 'Sortie dehors : relevés des paramètres', '1'],
    ['', 'Activité vivant ou non vivant', '1,5'],
    ['', 'Évaluation courte', '¼'],
  ];
  const a = analyser(brut);
  assert.equal(a.entete, -1);
  assert.deepEqual(a.colonnes.map((c) => c.role), ['chapitre', 'titre', 'duree']);
  const { etapes } = versEtapes(brut, a);
  assert.deepEqual(etapes.map((e) => [e.titre, e.duree, e.chapitre, e.eval]), [
    ['Sortie dehors : relevés des paramètres', 1, 'Le vivant', false],
    ['Activité vivant ou non vivant', 1.5, 'Le vivant', false],
    ['Évaluation courte', 0.25, 'Le vivant', true],
  ]);
  const numerotee = [['Séance', 'Activité', 'Durée', 'Objectifs'], ['1', 'Le sol, un milieu vivant', '1', 'Identifier des êtres vivants'], ['2', 'Les décomposeurs', '2', ''], ['3', 'Bilan', '½', '']];
  const b = analyser(numerotee);
  assert.deepEqual(b.colonnes.map((c) => c.role), ['ignorer', 'titre', 'duree', 'complement']);
  const r = versEtapes(numerotee, b);
  assert.equal(r.etapes[0].pronote, 'Objectifs : Identifier des êtres vivants', 'une colonne « Objectifs » complète le cahier de textes');
  assert.equal(r.etapes[2].duree, 0.5);
});

test('ce qui n’est pas compris est dit, pas inventé', () => {
  const lignes = [['Titre', 'Durée', 'Semaine'], ['Activité 1', 'beaucoup', 'P2'], ['', '1', ''], ['Bilan', '', '']];
  const a = analyser(lignes);
  const { etapes, avertissements } = versEtapes(lignes, { ...a, rentree: 2026 });
  assert.deepEqual(etapes.map((e) => [e.titre, e.duree]), [['Activité 1', 1], ['Bilan', 1]]);
  assert.deepEqual(avertissements, [
    'Ligne 2 : durée « beaucoup » non comprise, comptée une séance.',
    'Ligne 2 : semaine « P2 » non comprise.',
    'Ligne 3 : pas d’intitulé, écartée.',
  ]);
});

function donneesCinquieme() {
  return {
    etapes: {
      bilan: { titre: 'Bilan du chapitre', niveau: '5e', duree: 0.25, jalons: ['Correction'], pronote: 'Bilan' },
      act5: { titre: 'Activité 5 – Le Soleil et la Terre : manipulation', niveau: '5e', duree: 1 },
      six: { titre: 'Bilan du chapitre', niveau: '6e', duree: 1 },
    },
    classes: {
      '5G1': { code: '5G1', niveau: '5e', file: [{ u: 'a1', eid: 'bilan' }, { u: 'a2', eid: 'act5' }], depart: { u: 'a1', f: 0, rang: 0 } },
      '5G3': { code: '5G3', niveau: '5e', file: [{ u: 'b1', eid: 'bilan' }] },
    },
    journal: {
      '5G1_20261103_1035': { code: '5G1', arret: { u: 'a2', f: 0.5 } },
      '5G1_20261104_0825': { code: '5G1', arret: { u: 'a1', f: 1 } },
    },
  };
}
const importees = [
  { titre: 'Activité 5 – Le Soleil et la Terre : réflexion', duree: 0.5, eval: false, jalons: [], chapitre: 'Ch. 1' },
  { titre: 'bilan du chapitre ', duree: 0.5, eval: false, jalons: [], chapitre: 'Ch. 1', devoirs: 'Apprendre' },
  { titre: 'Évaluation chapitres 1 et 2', duree: 0.25, eval: true, jalons: [], chapitre: 'Ch. 1' },
];

test('appliquer à des classes : à la suite, sans doublon, en complétant les étapes du niveau', () => {
  n = 0;
  const v = donneesCinquieme();
  const p = planImport(v, importees, { niveau: '5e', cibles: ['5G1', '5G3'], mode: 'ajouter', nouvelId });
  assert.equal(p.resume.nouvelles, 2);
  assert.equal(p.resume.reprises, 1, '« bilan du chapitre » est l’étape de 5e qui existe déjà');
  assert.equal(p.etapes.bilan.duree, 0.5, 'la durée importée remplace');
  assert.deepEqual(p.etapes.bilan.jalons, ['Correction'], 'les jalons d’ici restent quand l’import n’en a pas');
  assert.equal(p.etapes.bilan.devoirs, 'Apprendre');
  assert.equal(p.etapes.six, undefined, 'l’étape de 6e du même nom n’est pas touchée');
  assert.deepEqual(p.classes['5G1'].file.map((it) => it.eid), ['bilan', 'act5', 'e5e-1', 'e5e-2']);
  assert.deepEqual(p.classes['5G3'].file.map((it) => it.eid), ['bilan', 'e5e-1', 'e5e-2']);
  assert.deepEqual(p.resume.ajoutees, { '5G1': 2, '5G3': 2 });
  assert.deepEqual(p.oublies, []);
});

test('remplacer la file : l’ordre de la programmation, ce qui était commun garde son suivi', () => {
  n = 0;
  const v = donneesCinquieme();
  const p = planImport(v, importees, { niveau: '5e', cibles: ['5G1'], mode: 'remplacer', nouvelId });
  const file = p.classes['5G1'].file;
  assert.deepEqual(file.map((it) => it.eid), ['e5e-1', 'bilan', 'e5e-2']);
  assert.equal(file[1].u, 'a1', 'le bilan garde son identifiant : ses points d’arrêt restent valables');
  assert.deepEqual(p.oublies, ['5G1_20261103_1035'], 'le point d’arrêt sur l’étape retirée n’a plus de sens');
  assert.deepEqual(p.classes['5G1'].depart, { u: 'a1', f: 0, rang: 0 });
});

test('exporter puis réimporter : la même programmation, chez soi ou chez un collègue', async () => {
  n = 0;
  const v = {
    etapes: {
      x: { titre: 'Sortie dehors ; relevés', chapitre: 'Séq. 1 — Le vivant', duree: 1.5, eval: false, format: 'demi', jalons: ['Observation', 'Relevés'], afaire: 'Thermomètres', photocopies: 2, pronote: 'Relevés du milieu', devoirs: 'Finir le tableau', cible: '2026-11-02' },
      y: { titre: 'Évaluation « courte »', chapitre: 'Séq. 1 — Le vivant', duree: 0.25, eval: true, format: 'entiere', jalons: [], afaire: '', photocopies: 0, pronote: '', devoirs: '', cible: '' },
    },
    classes: { '6G2': { code: '6G2', file: [{ u: 'u1', eid: 'x' }, { u: 'u2', eid: 'y' }] } },
  };
  const csv = versCsv(lignesExport(v, '6G2'));
  assert.ok(csv.startsWith('﻿Chapitre;Étape;'), 'BOM et point-virgule : Excel l’ouvre en français');
  const { feuilles } = await lireTableur(new TextEncoder().encode(csv), 'progression.csv');
  const a = analyser(feuilles[0].lignes);
  const { etapes } = versEtapes(feuilles[0].lignes, { ...a, rentree: 2026 });
  const garde = (e) => [e.titre, e.chapitre, e.duree, e.eval, e.format, e.jalons, e.afaire, e.photocopies, e.pronote, e.devoirs, e.cible];
  assert.deepEqual(etapes.map(garde), Object.values(v.etapes).map(garde));
  // Le même aller-retour en vrai fichier Excel.
  const x = await lireTableur(await ecrireXlsx([{ nom: '6G2', lignes: lignesExport(v, '6G2') }]), 'progression.xlsx');
  const ax = analyser(x.feuilles[0].lignes);
  assert.deepEqual(versEtapes(x.feuilles[0].lignes, { ...ax, rentree: 2026 }).etapes.map(garde), Object.values(v.etapes).map(garde));
});

test('le modèle vierge se réimporte : chapitre, durées, demi-groupe, évaluation, semaine', async () => {
  const x = await lireTableur(await ecrireXlsx([{ nom: 'Programmation', lignes: modeleProgrammation() }]), 'modele.xlsx');
  const a = analyser(x.feuilles[0].lignes);
  assert.equal(a.entete, 0);
  const { etapes, avertissements } = versEtapes(x.feuilles[0].lignes, { ...a, rentree: 2026 });
  assert.deepEqual(avertissements, []);
  assert.deepEqual(etapes.map((e) => [e.chapitre, e.duree, e.format, e.eval, e.jalons.length, e.cible]), [
    ['Chapitre 1 — Titre du chapitre', 1, 'indiff', false, 4, '2026-11-02'],
    ['Chapitre 1 — Titre du chapitre', 1.5, 'demi', false, 4, ''],
    ['Chapitre 1 — Titre du chapitre', 0.5, 'entiere', true, 0, ''],
  ]);
});
