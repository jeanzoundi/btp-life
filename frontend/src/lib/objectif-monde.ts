export interface BesoinsObjectif { energie: number; moral: number; faim: number; social: number }
export interface ObjectifMoment { texte: string; etiquette?: string; lieu?: string }

const URGENCES: Array<{ cle: keyof BesoinsObjectif; texte: string; lieu: string }> = [
  { cle: 'faim', texte: 'Mange au maquis', lieu: 'maquis' },
  { cle: 'energie', texte: 'Repose-toi chez toi', lieu: 'residence' },
  { cle: 'social', texte: 'Passe au café', lieu: 'cafe' },
  { cle: 'moral', texte: 'Souffle à la marina', lieu: 'marina' },
];

/** La prochaine chose à faire en vie libre : le besoin le plus bas sous 45 d'abord, puis les repères à découvrir. */
export function objectifDuMoment(besoins: BesoinsObjectif, decouvertes: number, total: number): ObjectifMoment {
  const urgence = URGENCES.filter(u => besoins[u.cle] < 45).sort((a, b) => besoins[a.cle] - besoins[b.cle])[0];
  if (urgence) return { texte: urgence.texte, etiquette: `${Math.round(Math.max(0, besoins[urgence.cle]))} %`, lieu: urgence.lieu };
  if (decouvertes < total) return { texte: 'Trouve les repères', etiquette: `${decouvertes}/${total}` };
  return { texte: 'Vie libre' };
}
