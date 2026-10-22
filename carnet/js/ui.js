// Petits outils d'affichage. Tout passe par le gabarit `html` qui échappe chaque valeur insérée :
// un titre de cours ou une description d'agenda vient de Pronote ou de Google, jamais du code de
// l'appli, et ne doit pas pouvoir y injecter de balises. `brut()` marque le HTML déjà sûr.

class Brut {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const brut = (s) => new Brut(String(s));

const ECHAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ECHAP[c]);

function rendu(v) {
  if (v == null) return '';
  // Un booléen s'écrit en toutes lettres : aria-pressed="${actif}" doit donner "true" ou "false".
  // (Les conditions s'écrivent avec ? : '' — jamais avec && — pour ne pas afficher « false ».)
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Brut) return v.s;
  if (Array.isArray(v)) return v.map(rendu).join('');
  return esc(v);
}

/** Gabarit : html`<p>${texte}</p>` → Brut, avec chaque valeur échappée. */
export function html(chaines, ...valeurs) {
  let s = chaines[0];
  for (let i = 0; i < valeurs.length; i++) s += rendu(valeurs[i]) + chaines[i + 1];
  return new Brut(s);
}

export const icone = (nom, titre) => brut(`<svg class="ic" aria-hidden="${titre ? 'false' : 'true'}"${titre ? ` role="img" aria-label="${esc(titre)}"` : ''}><use href="#i-${esc(nom)}"/></svg>`);

export const $ = (sel, racine = document) => racine.querySelector(sel);
export const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];

let minuteurToast;
export function toast(message, { action, duree = 3200 } = {}) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = message;
  t.appendChild(span);
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.libelle;
    b.addEventListener('click', () => { action.faire(); t.remove(); });
    t.appendChild(b);
  }
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.remove(), action ? duree * 2 : duree);
}

// ---------- Feuille : une boîte de dialogue qui se redessine avec l'état ----------
let feuille = null;
let rendreFeuille = null;

/** Ouvre une feuille. `contenu()` renvoie { titre, corps, pied } ; il est rappelé à chaque changement d'état. */
export function ouvrirFeuille(contenu, { classe = '', surFermeture } = {}) {
  if (!feuille) {
    feuille = document.createElement('dialog');
    feuille.className = 'feuille';
    feuille.addEventListener('close', () => {
      const f = feuille._surFermeture;
      rendreFeuille = null;
      feuille.innerHTML = '';
      if (f) f();
    });
    feuille.addEventListener('click', (e) => { if (e.target === feuille) feuille.close(); });
    document.body.appendChild(feuille);
  }
  feuille.className = `feuille ${classe}`;
  feuille._surFermeture = surFermeture;
  rendreFeuille = contenu;
  redessinerFeuille(true);
  if (!feuille.open) {
    if (typeof feuille.showModal === 'function') feuille.showModal();
    else feuille.setAttribute('open', '');
  }
  const premier = feuille.querySelector('[autofocus]');
  if (premier) premier.focus();
}

export function redessinerFeuille(force = false) {
  if (!feuille || !rendreFeuille) return;
  // Ne pas écraser un champ en cours de saisie dans la feuille.
  const actif = document.activeElement;
  if (!force && actif && feuille.contains(actif) && /^(INPUT|TEXTAREA|SELECT)$/.test(actif.tagName)) return;
  const { titre, corps, pied } = rendreFeuille();
  const defilement = feuille.querySelector('.feuille-corps')?.scrollTop || 0;
  feuille.innerHTML = String(html`<div class="feuille-int">
    <div class="feuille-tete"><h2>${titre}</h2><button class="btn-rond" data-action="fermer-feuille" aria-label="Fermer">${icone('croix')}</button></div>
    <div class="feuille-corps">${corps}</div>
    ${pied ? html`<div class="feuille-pied">${pied}</div>` : ''}
  </div>`);
  const c = feuille.querySelector('.feuille-corps');
  if (c) c.scrollTop = defilement;
}

export function fermerFeuille() { if (feuille && feuille.open) feuille.close(); }
export const feuilleOuverte = () => !!(feuille && feuille.open);

/** Copie du texte, avec repli par sélection quand le presse-papiers est refusé. */
export async function copier(texte, element) {
  try { await navigator.clipboard.writeText(texte); return true; } catch {
    if (element) {
      const r = document.createRange(); r.selectNodeContents(element);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    return false;
  }
}

/** Charge un script externe une seule fois. */
const scripts = new Map();
export function chargerScript(src) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.defer = true;
      s.onload = ok; s.onerror = () => { scripts.delete(src); ko(new Error(`Impossible de charger ${src}`)); };
      document.head.appendChild(s);
    }));
  }
  return scripts.get(src);
}

/** Télécharge un texte comme fichier. */
export function telecharger(nom, texte, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([texte], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
