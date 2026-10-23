import type { EmpriseVille, PointVille } from './itineraire-ville';

/** Alignement derrière le trottoir nord ; passage central et portes existantes restent libres. */
export const BOUTIQUES_PALMIERS = [
  { id: 'couture', nom: 'ATELIER AWA', sousTitre: 'COUTURE · RETOUCHES', x: -13.5, z: -20, largeur: 7, hauteur: 5.8, mur: '#e9bd72', accent: '#167c89', toit: '#b35632' },
  { id: 'maquis', nom: 'CHEZ LES VOISINS', sousTitre: 'ALLÔCO · BRAISÉ · BISSAP', x: 10.3, z: -20, largeur: 6.1, hauteur: 3.7, mur: '#e6aa7b', accent: '#b84232', toit: '#ae4630' },
  { id: 'librairie', nom: 'LE PETIT PLAN', sousTitre: 'LIBRAIRIE · IMPRESSION', x: 17.5, z: -20, largeur: 6.5, hauteur: 6.6, mur: '#6ca69b', accent: '#194c65', toit: '#657b73' },
] as const;

export const EMPRISES_PALMIERS: EmpriseVille[] = [
  ...BOUTIQUES_PALMIERS.map(b => ({ x: b.x, z: b.z + .2, largeur: b.largeur + .6, profondeur: 6 })),
  { x: -23, z: 0, largeur: 3.8, profondeur: 3 },
  { x: 23, z: 0, largeur: 3.8, profondeur: 3 },
];

/** Une ancienne sauvegarde peut être à l'emplacement d'une nouvelle boutique. On la replace sur son trottoir. */
export function degagerPositionPalmiers(position: PointVille): PointVille {
  const obstacle = EMPRISES_PALMIERS.find(b => Math.abs(position[0] - b.x) <= b.largeur / 2 + .85 && Math.abs(position[1] - b.z) <= b.profondeur / 2 + .85);
  return obstacle ? [position[0], obstacle.z + obstacle.profondeur / 2 + 1] : position;
}
