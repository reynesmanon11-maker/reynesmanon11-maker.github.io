// Recopie les textes du cabinet dans la version légère.
//   node synchroniser.mjs              met à jour outils/cabinet_curiosites.html
//   node synchroniser.mjs --verifier   dit seulement si la copie est en retard (code de sortie 1)
//
// Pourquoi une copie ? La version légère est un fichier unique qui doit s'ouvrir
// par double-clic, hors connexion : elle ne peut pas lire un autre fichier dans ce
// cas. En ligne, elle relit directement js/donnees/curiosites.js ; la copie ne sert
// qu'hors connexion. Les textes se corrigent donc dans curiosites.js, jamais dans
// la copie : celle-ci est écrasée à chaque synchronisation.
//
// Avant de synchroniser, si la copie diffère, regarder d'abord si Manon a corrigé
// un texte directement dans la version légère : reporter sa correction dans
// curiosites.js, sinon elle serait perdue.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const SOURCE = new URL('./js/donnees/curiosites.js', import.meta.url);
export const LEGERE = new URL('../cabinet_curiosites.html', import.meta.url);
export const DEBUT = '/* COPIE AUTOMATIQUE DE outils/cabinet/js/donnees/curiosites.js : ne pas corriger les textes ici, mais dans ce fichier-là. */';
export const FIN = '/* FIN DE LA COPIE AUTOMATIQUE */';

/** Le tableau CURIOSITES tel qu'il s'écrit dans curiosites.js, sans le mot « export ». */
export function blocTextes(source) {
  const debut = source.indexOf('export const CURIOSITES = [');
  const fin = source.indexOf('\n];', debut);
  if (debut < 0 || fin < 0) throw new Error('curiosites.js : tableau « export const CURIOSITES = [ … ]; » introuvable.');
  return source.slice(debut, fin + 3).replace('export const CURIOSITES', 'const CURIOSITES');
}

/** Le contenu que devrait avoir la version légère. */
export async function synchroniser() {
  const [source, page] = await Promise.all([readFile(SOURCE, 'utf8'), readFile(LEGERE, 'utf8')]);
  const a = page.indexOf(DEBUT), b = page.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('cabinet_curiosites.html : repères de la copie automatique introuvables.');
  return page.slice(0, a + DEBUT.length) + '\n' + blocTextes(source) + '\n' + page.slice(b);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const attendu = await synchroniser();
  const actuel = await readFile(LEGERE, 'utf8');
  if (process.argv.includes('--verifier')) {
    console.log(attendu === actuel ? 'La copie des textes est à jour.' : 'La copie des textes est EN RETARD : lancer « node synchroniser.mjs ».');
    process.exit(attendu === actuel ? 0 : 1);
  }
  if (attendu === actuel) console.log('Rien à faire : la copie des textes est déjà à jour.');
  else { await writeFile(LEGERE, attendu); console.log('Version légère mise à jour.'); }
}
