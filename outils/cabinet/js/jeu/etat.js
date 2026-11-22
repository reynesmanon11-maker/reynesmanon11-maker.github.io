// État partagé du cabinet : ce que fait l'élève, où il se trouve, ce qu'il a déjà trouvé.
// Repris de la version légère (sections 1 et 2). Les objets exportés ne sont jamais
// réaffectés, seulement modifiés : tous les modules voient ainsi la même chose.

export const NIVEAUX = {college:'Collège', lycee:'Lycée'};
export const PORTEE = 2.9;          // distance (m) à laquelle on peut saisir un objet
// Même clé et même format que la version légère : un élève retrouve ses trouvailles
// d'une version à l'autre.
export const CLE_MEMOIRE = 'cabinet-curiosites-v1';

export const etat = {
  ecran:'chargement',   // chargement → accueil → jeu
  niveau:'college',
  inspection:null,      // {ob, t, sens, rx, ry}
  cible:null,           // objet visé au centre de l'écran
  modale:null,
  tactile:false,
  verrouImpossible:false,
  pret:false,
  sourceDonnees:'fichier',
  qualite:1,            // baisse si l'appareil peine (moins de pixels dessinés)
  temps:0,
  derniereConsigne:0
};
export const J = {x:-4.3, z:2.9, yaw:1.15, pitch:-0.06, pas:0};   // le joueur
export const cam = {pos:[0,1.6,0], fov:1.1, asp:1};

// Remplis au démarrage par main.js, après vérification de js/donnees/curiosites.js.
export const CURIOSITES = [];
export const parId = {};
export const OBJETS = [];           // les curiosités placées dans la scène (voir rendu/moteur.js)

export function progressionVide(){ return {v:1, niveau:'college', vus:{}, rep:{college:{}, lycee:{}}, bilanVu:{college:false, lycee:false}}; }
function chargerProgression(){
  try{
    const o = JSON.parse(localStorage.getItem(CLE_MEMOIRE) || 'null');
    if (o && o.v === 1 && o.rep) return Object.assign(progressionVide(), o);
  }catch(e){ /* navigation privée : on joue sans mémoire */ }
  return progressionVide();
}
export const progression = chargerProgression();
export function sauver(){ try{ localStorage.setItem(CLE_MEMOIRE, JSON.stringify(progression)); }catch(e){} }
export function toutEffacer(){
  const niv = etat.niveau;
  for (const k of Object.keys(progression)) delete progression[k];
  Object.assign(progression, progressionVide(), {niveau:niv});
  sauver();
}

export const $ = id => document.getElementById(id);
export function reduitMouvement(){ return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

/* Une entrée de curiosites.js n'est retenue que si elle est complète : une entrée
   abîmée par une correction est écartée (et signalée dans la console) au lieu de
   bloquer tout le cabinet. Même règle que dans la version légère. */
export function entreeValide(c){
  const question = q => !!q && typeof q.q==='string' && Array.isArray(q.choix) && q.choix.length>=2
    && q.choix.every(t=>typeof t==='string' && t.trim()!=='') && typeof q.expl==='string' && typeof q.prog==='string';
  return !!c && typeof c.id==='string' && ['nom','latin','emoji','regne','ou','desc','savais'].every(k=>typeof c[k]==='string')
    && Array.isArray(c.mots) && c.mots.every(m=>typeof m==='string') && question(c.college) && question(c.lycee);
}
