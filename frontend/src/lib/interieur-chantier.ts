// Intérieur du Grand chantier : parcelle clôturée, base vie, stock, atelier de ferraillage, grue, ouvrage, et les postes
// où se font les tâches. Repère : centre de la parcelle, x vers l'est, z vers le sud (portail au sud). Testable sans Three.js.
import { creerNavigation, zone, type Obstacle, type Point } from './navigation-plan';
import type { ZoneChantier } from './programme-chantier';

export type { Obstacle, Point } from './navigation-plan';
export type StationChantier = ZoneChantier | 'yao';

export const PARCELLE = { demiLargeur: 16, demiProfondeur: 12 };
/** L'ouvrage est décalé vers le nord pour laisser la place à la base vie, au stock et au camion. */
export const DECALAGE_OUVRAGE = -2.5;
export const DEPART: Point = [0, 9.2];

/** La caméra regarde depuis le sud-sud-est : portes de la base vie et postes sont tournés vers elle, jamais cachés derrière un volume. */
export const STATIONS: Record<StationChantier, Point> = {
  vestiaire: [10.9, -6.6], bureau: [13.9, -6.6], yao: [8.9, -5.9],
  stockage: [-7.4, 7.3], ferraillage: [-9.2, -3.5], betonniere: [10, 1.3],
  implantation: [-8.1, 3.7], fouille: [-3.6, 3.9], 'entree-ouvrage': [0, 3.9], 'facade-sud': [3.6, 3.9],
  'facade-est': [9.3, -2.6], 'acces-etage': [7.8, 4], portail: [6.4, 8.4],
};

export const LIBELLES_STATIONS: Record<StationChantier, string> = {
  vestiaire: 'Vestiaire · EPI', bureau: 'Bureau de chantier', yao: 'Yao', stockage: 'Zone de stockage', ferraillage: 'Atelier de ferraillage',
  betonniere: 'Bétonnière', implantation: 'Chaises d’implantation', fouille: 'Fouilles', 'entree-ouvrage': 'Ouvrage', 'facade-sud': 'Façade sud',
  'facade-est': 'Façade est', 'acces-etage': 'Accès échafaudage', portail: 'Livraison',
};

/** Emprises qu'on contourne : ouvrage et échafaudage, base vie, stock, atelier, grue, bétonnière, tas de déblais. */
export const OBSTACLES: readonly Obstacle[] = [
  zone(-6.6, 8.3, -7.6, 3.2),       // ouvrage, échafaudages sud et est
  zone(9.3, 15.6, -10.8, -7.6),     // base vie : vestiaire et bureau, portes au sud
  zone(14.4, 15.6, -2.4, -1.2),     // sanitaires
  zone(14.3, 15.7, -.6, 1),         // citerne
  zone(-14.6, -11.4, 6.8, 9.3),     // tas de sable
  zone(-11.1, -8.5, 8.1, 10.4),     // tas de gravier
  zone(-14.1, -12.3, 3.7, 5.1),     // palette de ciment bâchée
  zone(-10.9, -8.3, 4.9, 6.3),      // palettes d'agglos
  zone(-15.2, -9.9, 1.3, 2.3),      // bottes d'aciers sur chevrons
  zone(-13.9, -10.1, -4.2, -2.8),   // établi de ferraillage
  zone(-12.9, -10.1, -10.4, -7.6),  // pied de grue
  zone(9.2, 10.8, -1.2, .2),        // bétonnière
  zone(-4.8, -1.6, -9.8, -7.6),     // déblais, au nord, à distance du bord des fouilles
  zone(1.8, 5, -9.8, -7.6),
  zone(-7.9, -3.1, 9.9, 10.5),      // panneau de chantier
];

export const { libre, avancer, chemin } = creerNavigation({ ...PARCELLE, obstacles: OBSTACLES });
