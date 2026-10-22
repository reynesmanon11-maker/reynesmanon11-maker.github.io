// Ouvre l'appli sur cet ordinateur : node tests/lancer.mjs  →  http://127.0.0.1:8080/
// (Le port 8080 est aussi celui à déclarer comme origine de test dans la console Google.)
import { servir } from './serveur.mjs';

const { url } = await servir(Number(process.env.PORT) || 8080);
console.log(`Carnet de bord : ${url}  (Ctrl+C pour arrêter)`);
