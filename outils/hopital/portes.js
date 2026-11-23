// Système de portes battantes, réutilisable pour toutes les salles de l'hôpital.
//
// Une porte = un battant (des objets 3D modelés autour de leur charnière) qui pivote autour d'un axe vertical.
// On l'ouvre et on la ferme avec E ; l'animation suit son cours sans bloquer la marche.
// Collisions :
//   - battant presque fermé (moins de OUVERT_PASSAGE) : l'embrasure entière est infranchissable ;
//   - à tout angle, le battant lui-même est un obstacle (un segment épais) : on ne le traverse pas,
//     mais s'il pivote vers le joueur, celui-ci peut toujours s'en écarter (jamais coincé).
//
// Ajouter une porte : creerPorte({...}) avec la charnière, la largeur, le sens d'ouverture et le rectangle
// de l'embrasure ; la page s'occupe du reste (visée, invite « Ouvrir », animation, collisions).
import * as THREE from 'three';

export const ANGLE_OUVERT = 1.62;        // ≈ 93° : grande ouverture
export const OUVERT_PASSAGE = 1.05;      // ≈ 60° : au-delà, l'embrasure laisse passer
const VITESSE = 2.2;                     // radians par seconde (un battant met ~0,75 s à s'ouvrir)

export class Porte {
  /**
   * @param {object} o
   * @param {string} o.nom        identifiant (la salle)
   * @param {THREE.Object3D[]} o.objets  objets du battant, modelés en place (porte fermée)
   * @param {number[]} o.charniere  [x, z] de l'axe de rotation
   * @param {number} o.largeur    largeur du battant (m)
   * @param {number} o.sens       +1 ou −1 : côté vers lequel il s'ouvre
   * @param {number[]} o.embrasure [x0, z0, x1, z1] de la baie (bloquée quand la porte est fermée)
   * @param {THREE.Scene} o.scene
   */
  constructor({nom, objets, charniere, largeur, sens, embrasure, scene}){
    this.nom = nom; this.largeur = largeur; this.sens = sens; this.rect = embrasure;
    this.charniere = charniere;
    this.g = new THREE.Group();
    this.g.position.set(charniere[0], 0, charniere[1]);
    scene.add(this.g);
    for (const o of objets) this.g.attach(o);
    this.angle = 0;            // angle courant
    this.ouverte = false;      // but : ouverte ou fermée
    this.verrouillee = false;  // un service pas encore ouvert dans l'enquête
  }
  get centre(){ const r = this.rect; return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]; }
  basculer(){ if (!this.verrouillee) this.ouverte = !this.ouverte; return this.ouverte; }
  animer(dt, instantane){
    const but = this.ouverte ? ANGLE_OUVERT : 0;
    if (instantane) this.angle = but;
    else {
      const d = but - this.angle, pas = VITESSE * dt;
      this.angle += Math.abs(d) <= pas ? d : Math.sign(d) * pas * (0.35 + 0.65 * Math.min(1, Math.abs(d) / 0.4));   // ralentit en fin de course
    }
    this.g.rotation.y = this.sens * this.angle;
  }
  /** Extrémités du battant dans le plan (x, z), à l'angle courant. */
  segment(){
    const [hx, hz] = this.charniere, a = this.sens * this.angle;
    return [hx, hz, hx + this.largeur * Math.cos(a), hz - this.largeur * Math.sin(a)];
  }
  distance(x, z){
    const [ax, az, bx, bz] = this.segment(), dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - ax - t * dx, z - az - t * dz);
  }
  /** Le pas de (x0, z0) vers (x, z) est-il arrêté par cette porte ? rayon = rayon du joueur. */
  bloque(x, z, x0, z0, rayon){
    const r = this.rect;
    if (this.angle < OUVERT_PASSAGE && x > r[0] - rayon && x < r[2] + rayon && z > r[1] - rayon && z < r[3] + rayon) return true;
    const d = this.distance(x, z);
    return d < rayon + 0.025 && d < this.distance(x0, z0);     // on peut toujours s'éloigner du battant
  }
}

export function creerPorte(o){ return new Porte(o); }
