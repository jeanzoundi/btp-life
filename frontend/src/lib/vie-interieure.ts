export type TypeVieInterieure = 'habitation' | 'bureau' | 'formation' | 'restauration' | 'commerce' | 'institution' | 'laboratoire' | 'chantier' | 'logistique' | 'loisirs';

export const PROFILS_INTERIEURS: Record<TypeVieInterieure, { personnes: number; role: string; couleur: string; rythme: number }> = {
  habitation: { personnes: 1, role: 'Habitant', couleur: '#9b6b4c', rythme: .55 },
  bureau: { personnes: 2, role: 'Collaborateur', couleur: '#486c78', rythme: .7 },
  formation: { personnes: 3, role: 'Apprenant', couleur: '#557a70', rythme: .75 },
  restauration: { personnes: 3, role: 'Client', couleur: '#b95e45', rythme: .85 },
  commerce: { personnes: 3, role: 'Visiteur', couleur: '#557f7d', rythme: .8 },
  institution: { personnes: 2, role: 'Usager', couleur: '#5e7186', rythme: .6 },
  laboratoire: { personnes: 2, role: 'Technicien', couleur: '#5c8b83', rythme: .55 },
  chantier: { personnes: 3, role: 'Ouvrier', couleur: '#d39b2b', rythme: .8 },
  logistique: { personnes: 3, role: 'Magasinier', couleur: '#687d86', rythme: .75 },
  loisirs: { personnes: 3, role: 'Visiteur', couleur: '#62865f', rythme: .7 },
};

export function positionsVieInterieure(type: TypeVieInterieure) {
  const profil = PROFILS_INTERIEURS[type];
  return Array.from({ length: profil.personnes }, (_, i) => ({ id: `${type}-${i}`, depart: [-2 + i * 1.8, 3.65] as [number, number], role: profil.role }));
}
