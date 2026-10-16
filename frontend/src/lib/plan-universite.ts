export type PointUniversite = { id: string; label: string; detail: string; x: number; z: number; etage: 0 | 1 };

export const POINTS_UNIVERSITE: PointUniversite[] = [
  { id: 'accueil', label: 'Grand hall', detail: 'Grand hall · Orientation, inscriptions et informations pédagogiques.', x: -6.2, z: 4.2, etage: 0 },
  { id: 'amphi', label: 'Grand amphithéâtre', detail: 'Grand amphithéâtre · Cours magistral avec professeur et projection.', x: -6.2, z: -3.8, etage: 0 },
  { id: 'atelier', label: 'Atelier matériaux', detail: 'Atelier matériaux · Manipulations, éprouvettes et essais pédagogiques.', x: 0, z: -4.6, etage: 0 },
  { id: 'administration', label: 'Administration', detail: 'Administration · Suivi des dossiers et de la scolarité.', x: 6.2, z: 4.1, etage: 0 },
  { id: 'cafeteria', label: 'Cafétéria', detail: 'Cafétéria · Pause, repas et rencontres avec les autres étudiants.', x: 6.1, z: -3.8, etage: 0 },
  { id: 'cour', label: 'Cour centrale', detail: 'Cour centrale · Jardin du campus, bancs et espace de discussion.', x: 0, z: 3.8, etage: 0 },
  { id: 'classe', label: 'Salle de classe', detail: 'Salle de classe · Tables, tableau et enseignement en petit groupe.', x: -6.1, z: -3.8, etage: 1 },
  { id: 'cowork', label: 'Studio projets', detail: 'Studio projets · Travail collaboratif et revues de projets.', x: -5.9, z: 3.8, etage: 1 },
  { id: 'bim', label: 'Laboratoire BIM', detail: 'Laboratoire BIM · Postes de modélisation et maquette numérique.', x: 5.8, z: -3.8, etage: 1 },
  { id: 'bibliotheque', label: 'Médiathèque', detail: 'Médiathèque · Documentation technique et espaces de lecture.', x: 6, z: 3.8, etage: 1 },
];

export const ESCALIER_UNIVERSITE = { x: 0, z: .6 };

export function destinationUniversite(index: number): PointUniversite {
  return POINTS_UNIVERSITE[((index % POINTS_UNIVERSITE.length) + POINTS_UNIVERSITE.length) % POINTS_UNIVERSITE.length];
}

export function itineraireUniversite(etageActuel: 0 | 1, cible: PointUniversite): Array<{ x: number; z: number; etage: 0 | 1; escalier?: boolean }> {
  if (etageActuel === cible.etage) return [{ x: 0, z: 3.2, etage: etageActuel }, { x: cible.x, z: cible.z, etage: cible.etage }];
  return [
    { x: ESCALIER_UNIVERSITE.x, z: 2.8, etage: etageActuel },
    { x: ESCALIER_UNIVERSITE.x, z: ESCALIER_UNIVERSITE.z, etage: cible.etage, escalier: true },
    { x: 0, z: 3.2, etage: cible.etage },
    { x: cible.x, z: cible.z, etage: cible.etage },
  ];
}
