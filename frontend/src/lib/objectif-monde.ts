export interface BesoinsObjectif { energie: number; moral: number; faim: number; social: number; hygiene: number; divertissement: number }
export interface ObjectifMoment { texte: string; etiquette?: string; lieu?: string }

const URGENCES: Array<{ cle: keyof BesoinsObjectif; texte: string; lieu: string }> = [
  { cle: 'faim', texte: 'Mange au maquis', lieu: 'maquis' },
  { cle: 'energie', texte: 'Repose-toi chez toi', lieu: 'residence' },
  { cle: 'hygiene', texte: 'Douche-toi chez toi', lieu: 'residence' },
  { cle: 'divertissement', texte: 'Défoule-toi au complexe sportif', lieu: 'sports' },
  { cle: 'social', texte: 'Passe au café', lieu: 'cafe' },
  { cle: 'moral', texte: 'Souffle à la marina', lieu: 'marina' },
];

export type CleBesoin = keyof BesoinsObjectif;
export interface AlerteBesoin { cle: CleBesoin; texte: string; action: string; lieu: string }

const ALERTES: Record<CleBesoin, Omit<AlerteBesoin, 'cle'>> = {
  faim: { texte: 'Tu as faim', action: 'Aller manger', lieu: 'maquis' },
  energie: { texte: 'Tu tombes de fatigue', action: 'Rentrer dormir', lieu: 'residence' },
  hygiene: { texte: 'Tu ne te sens pas très frais', action: 'Rentrer te doucher', lieu: 'residence' },
  divertissement: { texte: 'Tu t’ennuies', action: 'Aller te défouler', lieu: 'sports' },
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

/** D'où vient l'objectif principal, le seul affiché dans la case objectif (les autres propositions restent dans le
 * téléphone et le planning) : une activité commencée d'abord, puis le guide des premiers pas, puis les propositions. */
export type SourceObjectif = 'mode' | 'journee' | 'seance' | 'chapitre' | 'guide' | 'fil-rouge' | 'yao' | 'vie';
export interface EtatObjectif {
  modeEnCours: boolean; journee: boolean; seance: boolean; chapitreEnCours: boolean;
  /** Il reste une étape au guide des premiers pas, qui n'a pas été masqué. */
  guide: boolean;
  /** Un besoin est sous 45 : on mange ou on dort avant le guide et les rendez-vous. */
  besoinUrgent: boolean;
  /** Le rendez-vous du fil rouge reçoit à cette heure ; la journée de Yao est disponible. */
  filRouge: boolean; travail: boolean;
}
export function sourceObjectif(e: EtatObjectif): SourceObjectif {
  if (e.modeEnCours) return 'mode';
  if (e.journee) return 'journee';
  if (e.seance) return 'seance';
  if (e.chapitreEnCours) return 'chapitre';
  if (e.besoinUrgent) return 'vie';
  if (e.guide) return 'guide';
  if (e.filRouge) return 'fil-rouge';
  if (e.travail) return 'yao';
  return 'vie';
}

/** La prochaine chose à faire en vie libre : le besoin le plus bas sous 45 d'abord, puis les repères à découvrir. */
export function objectifDuMoment(besoins: BesoinsObjectif, decouvertes: number, total: number): ObjectifMoment {
  const urgence = URGENCES.filter(u => besoins[u.cle] < 45).sort((a, b) => besoins[a.cle] - besoins[b.cle])[0];
  if (urgence) return { texte: urgence.texte, etiquette: `${Math.round(Math.max(0, besoins[urgence.cle]))} %`, lieu: urgence.lieu };
  if (decouvertes < total) return { texte: 'Trouve les repères', etiquette: `${decouvertes}/${total}` };
  return { texte: 'Vie libre' };
}
