// Bounds shared by mouse destinations and keyboard movement.
export const LIMITES_VILLE = { minX: -118, maxX: 118, minZ: -120, maxZ: 66 } as const;
export const QUARTIERS = [
  { nom: 'Les Palmiers', x: 0, z: 0, description: 'Centre historique · vie de quartier' },
  { nom: 'Jardins de l’Ouest', x: -86, z: -18, description: 'Résidences · commerces · jardins' },
  { nom: 'Pôle des Bâtisseurs', x: 86, z: -18, description: 'Logistique · formation · matériaux' },
  { nom: 'Plateau Nord', x: 0, z: -91, description: 'Administration · études · entreprises' },
  { nom: 'Baie des Sables', x: 0, z: 53, description: 'Plage · marina · loisirs' },
] as const;
