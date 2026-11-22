// Profils de qualité de l'image : basse, moyenne, haute.
//   basse    le rendu de l'étape 1 (matières simples, textures dessinées) : rien à télécharger
//            en plus, pour les postes faibles et les connexions lentes ;
//   moyenne  matières réalistes (PBR), textures photographiées, reflets de la pièce ;
//   haute    la même chose avec plus de pixels, des ombres plus fines et le velours.
// Le choix est gardé dans le navigateur, sous une clé à part : la progression n'est jamais
// touchée. « Automatique » choisit au démarrage d'après l'appareil. ?qualite=basse|moyenne|haute
// dans l'adresse force un profil (pour comparer, ou pour les tests).
export const PROFILS = {
  basse:   {nom:'basse',   pbr:false, ombre:1024, pixels:1,    velours:false},
  moyenne: {nom:'moyenne', pbr:true,  ombre:2048, pixels:1.5,  velours:false},
  haute:   {nom:'haute',   pbr:true,  ombre:4096, pixels:2,    velours:true}
};
const CLE = 'cabinet-curiosites-qualite';

export function reglageEnregistre(){
  try { const v = localStorage.getItem(CLE); return (v === 'auto' || PROFILS[v]) ? v : 'auto'; }
  catch(e){ return 'auto'; }
}
export function enregistrerReglage(v){ try { localStorage.setItem(CLE, v); } catch(e){ /* navigation privée */ } }

/** Le nom de la carte graphique, quand le navigateur le donne. */
export function carteGraphique(){
  try {
    const c = document.createElement('canvas').getContext('webgl2');
    if (!c) return '';
    const ext = c.getExtension('WEBGL_debug_renderer_info');
    const nom = ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER);
    const perte = c.getExtension('WEBGL_lose_context'); if (perte) perte.loseContext();
    return String(nom || '');
  } catch(e){ return ''; }
}

/** Le choix « automatique » : basse si la 3D est calculée sans carte graphique ou si l'appareil est modeste. */
export function deviner(carte = carteGraphique()){
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(carte)) return 'basse';
  if ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) return 'basse';
  return 'moyenne';
}

export function choisirProfil(){
  const force = new URLSearchParams(location.search).get('qualite');
  const reglage = PROFILS[force] ? force : reglageEnregistre();
  const nom = reglage === 'auto' ? deviner() : reglage;
  return {reglage, force:!!PROFILS[force], profil:PROFILS[nom]};
}
