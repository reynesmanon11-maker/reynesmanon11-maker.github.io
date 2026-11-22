// Petit serveur de fichiers pour les tests : sert TOUT le site (la version légère est dans
// outils/, la nouvelle dans outils/cabinet/), comme GitHub Pages, sur un port libre.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = fileURLToPath(new URL('../../../', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm', '.hdr': 'application/octet-stream',
};

export function servir(port = 0) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const fichier = normalize(join(RACINE, chemin.endsWith('/') ? `${chemin}index.html` : chemin));
      if (!fichier.startsWith(RACINE.endsWith(sep) ? RACINE : RACINE + sep)) { res.writeHead(403).end(); return; }
      try {
        const corps = await readFile(fichier);
        res.writeHead(200, { 'Content-Type': TYPES[extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(corps);
      } catch { res.writeHead(404).end('introuvable'); }
    });
    s.listen(port, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}/`, fermer: () => s.close() }));
  });
}
