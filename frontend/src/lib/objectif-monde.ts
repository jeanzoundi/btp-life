export interface BesoinsObjectif { energie: number; moral: number; faim: number; social: number }
export interface ObjectifMoment { texte: string; etiquette?: string; lieu?: string }

const URGENCES: Array<{ cle: keyof BesoinsObjectif; texte: string; lieu: string }> = [
  { cle: 'faim', texte: 'Mange au maquis', lieu: 'maquis' },
  { cle: 'energie', texte: 'Repose-toi chez toi', lieu: 'residence' },
  { cle: 'social', texte: 'Passe au café', lieu: 'cafe' },
  { cle: 'moral', texte: 'Souffle à la marina', lieu: 'marina' },
];

export type CleBesoin = keyof BesoinsObjectif;
export interface AlerteBesoin { cle: CleBesoin; texte: string; action: string; lieu: string }

const ALERTES: Record<CleBesoin, Omit<AlerteBesoin, 'cle'>> = {
  faim: { texte: 'Tu as faim', action: 'Aller manger', lieu: 'maquis' },
  energie: { texte: 'Tu tombes de fatigue', action: 'Rentrer dormir', lieu: 'residence' },
  social: { texte: 'Tu as besoin de voir du monde', action: 'Aller au café', lieu: 'cafe' },
  moral: { texte: 'Ton moral baisse', action: 'Souffler à la marina', lieu: 'marina' },
};

/** Besoins passés sous 25 et pas encore signalés. Un besoin remonté à 40 ou plus pourra l'être de nouveau. */
export function alertesBesoins(besoins: BesoinsObjectif, dejaSignales: ReadonlySet<CleBesoin>): { nouvelles: AlerteBesoin[]; signales: Set<CleBesoin> } {
  const signales = new Set(dejaSignales);
  const nouvelles: AlerteBesoin[] = [];
  for (const cle of Object.keys(ALERTES) as CleBesoin[]) {
    if (besoins[cle] < 25 && !signales.has(cle)) { signales.add(cle); nouvelles.push({ cle, ...ALERTES[cle] }); }
    else if (besoins[cle] >= 40) signales.delete(cle);
  }
  return { nouvelles, signales };
}

/** La prochaine chose à faire en vie libre : le besoin le plus bas sous 45 d'abord, puis les repères à découvrir. */
export function objectifDuMoment(besoins: BesoinsObjectif, decouvertes: number, total: number): ObjectifMoment {
  const urgence = URGENCES.filter(u => besoins[u.cle] < 45).sort((a, b) => besoins[a.cle] - besoins[b.cle])[0];
  if (urgence) return { texte: urgence.texte, etiquette: `${Math.round(Math.max(0, besoins[urgence.cle]))} %`, lieu: urgence.lieu };
  if (decouvertes < total) return { texte: 'Trouve les repères', etiquette: `${decouvertes}/${total}` };
  return { texte: 'Vie libre' };
}
