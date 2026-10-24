// Lecture des tableurs : de vrais fichiers fabriqués par Excel (openpyxl) et LibreOffice, rangés
// dans tests/tableurs/ — une programmation de 6e et de 5e avec cellules fusionnées, dates, durée
// tapée « 1:30 », feuille masquée ; un CSV enregistré par Excel en français ; un copier-coller.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  lireTableur, lireTexteTabule, decoderTexte, dateExcel, formatEstDate, formatEstHeure, heureDepuisFraction,
  jetonsXml, adresse, entreesZip, ecrireXlsx, crc32,
} from '../js/tableur.js';

const fichier = (nom) => readFileSync(new URL(`./tableurs/${nom}`, import.meta.url));

const SIXIEME = [
  ['Programmation SVT 6e — 2026-2027'],
  [],
  ['Séquence', 'Séance / activité', 'Durée', 'Type', 'Matériel', 'Semaine', 'Travail à faire'],
  ['Séquence 1 — Le vivant et son environnement', 'Sortie dehors : observer et relever les paramètres du milieu', '1', 'TP', 'Thermomètres, luxmètre', '2026-11-02'],
  ['Séquence 1 — Le vivant et son environnement', 'Activité « Vivant ou non vivant »', '1h30', 'Activité documentaire', '', 'S45', 'Finir la question 4'],
  ['Séquence 1 — Le vivant et son environnement', 'Bilan : les caractéristiques du vivant', '0.5', 'Bilan', '', '', 'Apprendre le bilan'],
  ['Séquence 1 — Le vivant et son environnement', 'Évaluation courte', '15 min', 'Évaluation', 'Photocopies du sujet', '46'],
  ['Séquence 2 — Les besoins des végétaux'],
  ['', 'Activité 1 : de quoi la plante a-t-elle besoin ?', '1h30', "Démarche d'investigation", 'Graines, terreau, pots', '2026-11-16'],
  ['', 'DS séquence 2', '1', 'Évaluation'],
];

test('Excel (.xlsx) : feuilles visibles, fusions descendues, dates, durée « 1:30 »', async () => {
  const { format, feuilles } = await lireTableur(fichier('programmation.xlsx'), 'programmation.xlsx');
  assert.equal(format, 'xlsx');
  assert.deepEqual(feuilles.map((f) => f.nom), ['6e', '5e'], 'la feuille masquée « Brouillon » est écartée');
  assert.deepEqual(feuilles[0].lignes, SIXIEME);
  const cinq = feuilles[1].lignes;
  assert.equal(cinq[1][4], 'Documents\nQuestions\nMise en commun', 'retours à la ligne gardés dans une cellule');
  assert.equal(cinq[1][5], '2');
  assert.equal(cinq[3][2], '¼');
});

test('LibreOffice (.ods) : la même lecture que l’Excel', async () => {
  const x = await lireTableur(fichier('programmation.xlsx'));
  const o = await lireTableur(fichier('programmation.ods'), 'programmation.ods');
  assert.equal(o.format, 'ods');
  assert.deepEqual(o.feuilles.map((f) => f.nom), ['6e', '5e']);
  assert.deepEqual(o.feuilles, x.feuilles);
});

test('CSV d’Excel en français : Windows-1252, point-virgule, champ cité sur deux lignes', async () => {
  const { format, feuilles } = await lireTableur(fichier('programmation-excel.csv'), 'programmation-excel.csv');
  assert.equal(format, 'csv');
  assert.deepEqual(feuilles[0].lignes, [
    ['Chapitre', 'Séance', 'Durée', 'Évaluation', 'Matériel'],
    ['Le vivant', 'Sortie dehors ; relevés', '1', '', 'Thermomètres\nLuxmètre'],
    ['', 'Activité « Vivant ou non vivant »', '1,5'],
    ['', 'Évaluation courte', '0,25', 'oui'],
  ]);
});

test('copier-coller depuis un tableur : des tabulations', async () => {
  const { feuilles } = await lireTableur(fichier('collage.tsv'), 'collage.tsv');
  assert.deepEqual(feuilles[0].lignes[2], ['', 'Vivant ou non vivant', '1h']);
  assert.deepEqual(lireTexteTabule('A\tB\r\n1\t"deux\tmots"\r\n'), [['A', 'B'], ['1', 'deux\tmots']]);
});

test('texte séparé : séparateur deviné, guillemets doublés, lignes vides finales retirées', () => {
  assert.deepEqual(lireTexteTabule('a,b,c\n1,"il a dit ""oui""",3\n\n\n'), [['a', 'b', 'c'], ['1', 'il a dit "oui"', '3']]);
  assert.deepEqual(lireTexteTabule('titre;durée\nBilan, puis exercices;1\n'), [['titre', 'durée'], ['Bilan, puis exercices', '1']], 'le point-virgule l’emporte quand il revient à chaque ligne');
  assert.deepEqual(lireTexteTabule('  seule colonne  \nautre'), [['seule colonne'], ['autre']]);
  assert.equal(decoderTexte(Uint8Array.from([0xef, 0xbb, 0xbf, 0x41])), 'A', 'BOM retiré');
  assert.equal(decoderTexte(Uint8Array.from([0xc9, 0x76, 0x61, 0x6c])), 'Éval', 'Windows-1252 quand ce n’est pas de l’UTF-8');
});

test('fichiers refusés avec une explication', async () => {
  await assert.rejects(lireTableur(new Uint8Array(0)), { code: 'vide' });
  await assert.rejects(lireTableur(Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]), 'vieux.xls'), { code: 'xls' });
  await assert.rejects(lireTableur(new TextEncoder().encode('%PDF-1.7 …'), 'x.pdf'), { code: 'pdf' });
  await assert.rejects(lireTableur(new TextEncoder().encode('\n \n'), 'vide.csv'), { code: 'vide' });
  // Un zip qui n'est pas un tableur (l'ods, sans son content.xml, ne compte plus).
  const zip = fichier('programmation.xlsx');
  assert.ok(entreesZip(zip).has('xl/workbook.xml'));
  await assert.rejects(lireTableur(zip.subarray(0, 200), 'coupé.xlsx'), { code: 'zip' });
});

test('dates et heures d’Excel', () => {
  const serie = (a, m, j) => Date.UTC(a, m - 1, j) / 864e5 + 25569;
  assert.equal(dateExcel(serie(2026, 11, 2)), '2026-11-02');
  assert.equal(dateExcel(serie(2027, 6, 30) + 0.5), '2027-06-30', 'la partie heure ne change pas le jour');
  assert.equal(dateExcel('n’importe quoi'), null);
  assert.ok(formatEstDate('DD/MM/YYYY'));
  assert.ok(formatEstDate('[$-40C]d mmmm yyyy'));
  assert.ok(!formatEstDate('0.00'));
  assert.ok(!formatEstDate('"semaine "0'), 'un texte entre guillemets ne compte pas');
  assert.ok(!formatEstDate('h:mm'));
  assert.ok(formatEstHeure('h:mm'));
  assert.ok(formatEstHeure('[h]:mm:ss'));
  assert.ok(!formatEstHeure('dd/mm/yyyy hh:mm'), 'date et heure : c’est une date');
  assert.equal(heureDepuisFraction(1 / 16), '1h30');
  assert.equal(heureDepuisFraction(55 / 1440), '0h55');
});

test('XML : entités, chevrons cités dans un attribut, CDATA, adresses de cellules', () => {
  const j = [...jetonsXml('<a x="1 &gt; 0" y=\'b>c\'>t&amp;u &#233;&#x2019;<![CDATA[<brut>]]><b/></a>')];
  assert.deepEqual(j, [['o', 'a', { x: '1 > 0', y: 'b>c' }, false], ['t', 't&u é’'], ['t', '<brut>'], ['o', 'b', {}, true], ['f', 'a']]);
  assert.deepEqual(adresse('B12'), { l: 11, c: 1 });
  assert.deepEqual(adresse('$AA$3'), { l: 2, c: 26 });
  assert.equal(adresse('x'), null);
});

test('écrire un .xlsx : relu à l’identique, nombres gardés, noms de feuilles acceptés par Excel', async () => {
  const lignes = [['Chapitre', 'Étape', 'Durée'], ['Le vivant', 'Sortie « dehors » & relevés\nsur deux lignes', 1.5], ['', 'Évaluation <courte>', 0.25]];
  const o = await ecrireXlsx([{ nom: '6e : progression [essai]', lignes }, { nom: '6E : progression [essai]', lignes: [['x']] }]);
  assert.equal(o[0], 0x50, 'un zip');
  const { format, feuilles } = await lireTableur(o, 'export.xlsx');
  assert.equal(format, 'xlsx');
  assert.deepEqual(feuilles.map((f) => f.nom), ['6e progression essai', '6E progression essai (2)'], 'sans « : [ ] », et deux noms distincts même à la casse près');
  assert.deepEqual(feuilles[0].lignes, lignes.map((l) => l.map((v) => String(v))));
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926, 'le CRC de référence');
});
