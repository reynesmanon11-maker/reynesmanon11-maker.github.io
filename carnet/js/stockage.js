// Mémoire de l'appareil : IndexedDB quand il est disponible, sinon la mémoire de la page
// (navigation privée, aperçu intégré, données de site bloquées). Rien ne casse sans stockage :
// l'appli fonctionne, elle oublie seulement en se fermant — et le dit.

const BASE = 'carnet-de-bord', MAGASIN = 'kv';
let base = null, enMemoire = null;

function ouvrir() {
  if (base) return base;
  base = new Promise((ok) => {
    try {
      if (!('indexedDB' in globalThis)) throw new Error('pas d’IndexedDB');
      const req = indexedDB.open(BASE, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(MAGASIN);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(null);
      req.onblocked = () => ok(null);
    } catch { ok(null); }
  });
  return base;
}

const memoire = () => (enMemoire ||= new Map());

export async function stockageDurable() {
  return !!(await ouvrir());
}

export async function lire(cle) {
  const db = await ouvrir();
  if (!db) return memoire().get(cle);
  return new Promise((ok) => {
    try {
      const r = db.transaction(MAGASIN).objectStore(MAGASIN).get(cle);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(undefined);
    } catch { ok(memoire().get(cle)); }
  });
}

export async function ecrire(cle, valeur) {
  const db = await ouvrir();
  if (!db) { memoire().set(cle, valeur); return; }
  return new Promise((ok) => {
    try {
      const t = db.transaction(MAGASIN, 'readwrite');
      t.objectStore(MAGASIN).put(valeur, cle);
      t.oncomplete = () => ok();
      t.onerror = () => { memoire().set(cle, valeur); ok(); };
    } catch { memoire().set(cle, valeur); ok(); }
  });
}

/**
 * Lit, fusionne et réécrit dans une seule transaction : deux fenêtres du Carnet ouvertes en même
 * temps (l'appli installée et un onglet) ne s'écrasent plus l'une l'autre. Rend la valeur écrite.
 */
export async function fusionnerEcrire(cle, valeur, fusion) {
  const db = await ouvrir();
  if (!db) { const v = fusion(memoire().get(cle), valeur); memoire().set(cle, v); return v; }
  return new Promise((ok) => {
    try {
      const t = db.transaction(MAGASIN, 'readwrite'), magasin = t.objectStore(MAGASIN);
      let ecrit = valeur;
      const r = magasin.get(cle);
      r.onsuccess = () => { ecrit = fusion(r.result, valeur); magasin.put(ecrit, cle); };
      t.oncomplete = () => ok(ecrit);
      t.onerror = () => { memoire().set(cle, valeur); ok(valeur); };
    } catch { memoire().set(cle, valeur); ok(valeur); }
  });
}

export async function effacerTout() {
  enMemoire = new Map();
  const db = await ouvrir();
  if (!db) return;
  return new Promise((ok) => {
    try {
      const t = db.transaction(MAGASIN, 'readwrite');
      t.objectStore(MAGASIN).clear();
      t.oncomplete = () => ok();
      t.onerror = () => ok();
    } catch { ok(); }
  });
}
