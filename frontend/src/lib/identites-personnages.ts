export type IdentitePersonnage = 'batisseur' | 'awa' | 'yao' | 'mariam' | 'fatou' | 'koffi';
export type Coiffure = 'court' | 'tresses' | 'afro' | 'foulard';
export interface DesignPersonnage {
  peau: string; haut: string; pantalon: string; accent: string; chaussures: string;
  cheveux: Coiffure; tenue: 'gilet' | 'chemise' | 'veste' | 'pagne' | 'tshirt';
  largeur: number; hauteur: number; feminin: boolean; casque?: string; lunettes?: boolean;
}

/** Palettes originales, silhouettes et accessoires stables, indépendants des règles de carrière. */
export const IDENTITES_PERSONNAGES: Record<IdentitePersonnage, DesignPersonnage> = {
  batisseur: { peau: '#794a32', haut: '#edab29', pantalon: '#243a51', accent: '#f5efda', chaussures: '#a57543', cheveux: 'court', tenue: 'gilet', largeur: 1, hauteur: 1, feminin: false, casque: '#efb82e' },
  awa: { peau: '#875038', haut: '#f4e7ce', pantalon: '#293d47', accent: '#cb8b39', chaussures: '#7e4a32', cheveux: 'tresses', tenue: 'chemise', largeur: .9, hauteur: .98, feminin: true, lunettes: true },
  yao: { peau: '#553425', haut: '#e56832', pantalon: '#344a52', accent: '#edebbb', chaussures: '#604431', cheveux: 'court', tenue: 'gilet', largeur: 1.16, hauteur: 1.04, feminin: false, casque: '#f1eee0' },
  mariam: { peau: '#70402d', haut: '#14786e', pantalon: '#203d3b', accent: '#eab75b', chaussures: '#222c2a', cheveux: 'afro', tenue: 'veste', largeur: .96, hauteur: 1.02, feminin: true },
  fatou: { peau: '#9b5b36', haut: '#c34653', pantalon: '#d59038', accent: '#f5d978', chaussures: '#85542f', cheveux: 'foulard', tenue: 'pagne', largeur: 1.12, hauteur: .96, feminin: true },
  koffi: { peau: '#73432b', haut: '#2b718a', pantalon: '#485141', accent: '#edc36b', chaussures: '#ede8d7', cheveux: 'court', tenue: 'tshirt', largeur: .94, hauteur: 1.03, feminin: false },
};

export function identiteDepuisNom(nom?: string): IdentitePersonnage | undefined {
  const cle = nom?.split(' · ')[0].trim().toLowerCase();
  return cle && Object.hasOwn(IDENTITES_PERSONNAGES, cle) ? cle as IdentitePersonnage : undefined;
}
