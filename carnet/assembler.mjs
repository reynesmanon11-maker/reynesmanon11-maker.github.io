// Réunit tout le Carnet dans un seul fichier, carnet-complet.html : à envoyer à une collègue, à
// ouvrir sans rien installer, ou à donner à Claude Code pour qu'il le modifie.
//   node assembler.mjs            (depuis le dossier carnet/, après toute modification)
//
// Chaque module reste lisible, dans son propre bloc <script type="text/x-carnet-module">, sous son
// nom (« carnet/js/etat.js ») ; au chargement, une carte d'import les relie entre eux. Le style, la
// police et les icônes sont intégrés. Pas de service worker : le fichier n'a rien à mettre en cache.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const lire = (f) => readFile(path.join(ICI, f), 'utf8');
const base64 = async (f) => (await readFile(path.join(ICI, f))).toString('base64');
const ADRESSE = 'https://reynesmanon11-maker.github.io/carnet/';

// Les imports relatifs (« ./etat.js », « ../../config.js ») deviennent des noms fixes : carnet/js/etat.js.
const IMPORT = /(\bfrom\s*|\bimport\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

/** Tous les modules atteints depuis js/app.js, chacun avec ses imports réécrits. */
async function modules() {
  const vus = new Map(), aFaire = ['js/app.js'];
  while (aFaire.length) {
    const f = aFaire.shift();
    if (vus.has(f)) continue;
    let texte = await lire(f);
    texte = texte.replace(IMPORT, (_, mot, q, spec) => {
      const cible = path.posix.normalize(path.posix.join(path.posix.dirname(f), spec));
      aFaire.push(cible);
      return `${mot}${q}carnet/${cible}${q}`;
    });
    if (/<script/i.test(texte)) throw new Error(`${f} contient « <script » : il casserait le fichier unique.`);
    // Dans un bloc <script>, « </script » fermerait le bloc et « <!-- » le dérouterait.
    texte = texte.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
    vus.set(f, texte);
  }
  return vus;
}

export async function assembler() {
  let page = await lire('index.html');
  let css = await lire('css/app.css');
  for (const police of ['onest-latin', 'onest-latin-ext']) {
    css = css.replace(`url("../polices/${police}.woff2")`, `url("data:font/woff2;base64,${await base64(`polices/${police}.woff2`)}")`);
  }
  const svg = `data:image/svg+xml;base64,${await base64('icones/favicon.svg')}`;
  const png = `data:image/png;base64,${await base64('icones/favicon-32.png')}`;
  const mods = await modules();

  const remplacer = (avant, apres) => {
    if (!page.includes(avant)) throw new Error(`index.html a changé : « ${avant.slice(0, 60)} » introuvable.`);
    page = page.split(avant).join(apres);
  };
  // Les scripts intégrés et les modules en blob: doivent être permis.
  page = page.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: blob:; frame-src https://accounts.google.com; media-src 'self' blob:; base-uri 'self'; form-action 'self'">`);
  remplacer('<link rel="manifest" href="manifest.webmanifest">\n', '');
  remplacer('<link rel="preload" href="polices/onest-latin.woff2" as="font" type="font/woff2" crossorigin>\n', '');
  remplacer('href="icones/favicon.svg?v=3"', `href="${svg}"`);
  remplacer('src="icones/favicon.svg?v=3"', `src="${svg}"`);
  remplacer('href="icones/favicon-32.png?v=3"', `href="${png}"`);
  remplacer('<link rel="apple-touch-icon" href="icones/logo-180.png?v=3">\n', '');
  remplacer('<link rel="stylesheet" href="css/app.css">', `<style>\n${css}</style>`);
  remplacer('<script src="js/avant.js"></script>', `<script>\n${await lire('js/avant.js')}</script>`);

  const blocs = [...mods].map(([f, texte]) => `<script type="text/x-carnet-module" data-module="carnet/${f}">\n${texte}</script>`).join('\n');
  remplacer('<script type="module" src="js/app.js"></script>', `<!-- ===== Les modules du Carnet, un bloc par fichier de carnet/js/ (et config.js) ===== -->
${blocs}
<!-- ===== Chargement : chaque bloc devient un module, une carte d'import les relie ===== -->
<script>
(function () {
  var carte = { imports: {} };
  document.querySelectorAll('script[type="text/x-carnet-module"]').forEach(function (s) {
    carte.imports[s.dataset.module] = URL.createObjectURL(new Blob([s.textContent], { type: 'text/javascript' }));
  });
  window.CARNET_UN_FICHIER = true;
  var im = document.createElement('script');
  im.type = 'importmap';
  im.textContent = JSON.stringify(carte);
  document.currentScript.after(im);
  var m = document.createElement('script');
  m.type = 'module';
  m.textContent = "import 'carnet/js/app.js';";
  im.after(m);
})();
</script>`);

  const tete = `<!doctype html>
<!--
  Carnet de bord — version en un seul fichier, assemblée par carnet/assembler.mjs.
  L'original, en plusieurs fichiers : https://github.com/reynesmanon11-maker/reynesmanon11-maker.github.io/tree/main/carnet
  En ligne : ${ADRESSE}

  Pour le modifier (avec Claude Code par exemple) : chaque module est un bloc
  <script type="text/x-carnet-module" data-module="carnet/js/…"> plus bas ; le style est dans <style>.
  Ouvert depuis l'ordinateur (file://), le Carnet marche en démo et sans Google ; la connexion Google
  demande d'être servi depuis une adresse autorisée dans la console Google (voir brancher-google.html).
-->`;
  return page.replace('<!doctype html>', tete);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const html = await assembler();
  await writeFile(path.join(ICI, 'carnet-complet.html'), html);
  console.log(`carnet-complet.html : ${Math.round(html.length / 1024)} Ko`);
}
