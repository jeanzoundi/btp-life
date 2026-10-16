export type ZoneMusicale = { id: string; nom: string; style: string; position: [number, number]; rayon: number; tempo: number; notes: number[] };

export const ZONES_MUSICALES: ZoneMusicale[] = [
  { id: 'place', nom: 'Scène de la Place', style: 'Afro urbain instrumental', position: [0, 20], rayon: 22, tempo: 104, notes: [48, 55, 60, 58] },
  { id: 'lagune', nom: 'Promenade Lagune', style: 'Ambiance douce', position: [0, 52], rayon: 25, tempo: 78, notes: [45, 52, 57, 52] },
  { id: 'jardins', nom: 'Marché des Jardins', style: 'Percussions du quartier', position: [-88, -56], rayon: 22, tempo: 116, notes: [50, 53, 57, 55] },
  { id: 'marina', nom: 'Terrasse Marina', style: 'Lounge instrumental', position: [89, 50], rayon: 24, tempo: 88, notes: [47, 54, 59, 57] },
];

export function zoneMusicaleProche(position: [number, number]): (ZoneMusicale & { distance: number }) | null {
  const zones = ZONES_MUSICALES.map(zone => ({ ...zone, distance: Math.hypot(position[0] - zone.position[0], position[1] - zone.position[1]) })).sort((a, b) => a.distance - b.distance);
  return zones[0] && zones[0].distance <= zones[0].rayon ? zones[0] : null;
}
