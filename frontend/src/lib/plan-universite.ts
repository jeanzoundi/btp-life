export type PointUniversite = { id: string; label: string; detail: string; x: number; z: number; etage: 0 | 1 };

export const POINTS_UNIVERSITE: PointUniversite[] = [
  { id: 'accueil', label: 'Accueil', detail: 'Accueil · Orientation, inscriptions et informations pédagogiques.', x: -3.8, z: 2.8, etage: 0 },
  { id: 'amphi', label: 'Amphithéâtre', detail: 'Amphithéâtre · Cours magistral avec professeur et projection.', x: -3.2, z: -2.7, etage: 0 },
  { id: 'administration', label: 'Administration', detail: 'Administration · Suivi des dossiers et de la scolarité.', x: 3.8, z: 2.5, etage: 0 },
  { id: 'classe', label: 'Salle de classe', detail: 'Salle de classe · Tables, tableau et enseignement en petit groupe.', x: -3.3, z: -2.5, etage: 1 },
  { id: 'bim', label: 'Laboratoire BIM', detail: 'Laboratoire BIM · Postes de modélisation et maquette numérique.', x: 3.2, z: -2.4, etage: 1 },
  { id: 'bibliotheque', label: 'Bibliothèque', detail: 'Bibliothèque · Documentation technique et espace de lecture.', x: 3.7, z: 2.6, etage: 1 },
];

export const ESCALIER_UNIVERSITE = { x: 0, z: .5 };

export function destinationUniversite(index: number): PointUniversite {
  return POINTS_UNIVERSITE[((index % POINTS_UNIVERSITE.length) + POINTS_UNIVERSITE.length) % POINTS_UNIVERSITE.length];
}

export function itineraireUniversite(etageActuel: 0 | 1, cible: PointUniversite): Array<{ x: number; z: number; etage: 0 | 1; escalier?: boolean }> {
  if (etageActuel === cible.etage) return [{ x: 0, z: 2.6, etage: etageActuel }, { x: cible.x, z: cible.z, etage: cible.etage }];
  return [
    { x: ESCALIER_UNIVERSITE.x, z: 2.3, etage: etageActuel },
    { x: ESCALIER_UNIVERSITE.x, z: ESCALIER_UNIVERSITE.z, etage: cible.etage, escalier: true },
    { x: 0, z: 2.6, etage: cible.etage },
    { x: cible.x, z: cible.z, etage: cible.etage },
  ];
}
