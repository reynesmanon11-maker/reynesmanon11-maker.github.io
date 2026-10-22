// Petit serveur de fichiers pour les tests : sert le dossier de l'appli sur un port libre.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ics': 'text/calendar',
};

export function servir(port = 0) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const fichier = normalize(join(RACINE, chemin.endsWith('/') ? `${chemin}index.html` : chemin));
      if (!fichier.startsWith(RACINE)) { res.writeHead(403).end(); return; }
      try {
        const corps = await readFile(fichier);
        res.writeHead(200, { 'Content-Type': TYPES[extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(corps);
      } catch { res.writeHead(404).end('introuvable'); }
    });
    s.listen(port, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}/`, fermer: () => s.close() }));
  });
}
