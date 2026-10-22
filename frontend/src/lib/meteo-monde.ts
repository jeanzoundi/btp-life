export type Meteo = 'soleil' | 'nuageux' | 'averse' | 'orage' | 'harmattan';

export const METEOS: Meteo[] = ['soleil', 'nuageux', 'averse', 'orage', 'harmattan'];

export const LIBELLES_METEO: Record<Meteo, { icone: string; nom: string }> = {
  soleil: { icone: '☀️', nom: 'Ensoleillé' },
  nuageux: { icone: '⛅', nom: 'Nuageux' },
  averse: { icone: '🌧️', nom: 'Averse' },
  orage: { icone: '⛈️', nom: 'Orage' },
  harmattan: { icone: '💨', nom: 'Harmattan' },
};

/** Saisons d'Abidjan : grande saison des pluies d'avril à juillet, petite en octobre-novembre, harmattan de décembre à février. */
function probabilites(mois: number): Partial<Record<Meteo, number>> {
  if (mois >= 3 && mois <= 6) return { soleil: .2, nuageux: .3, averse: .35, orage: .15 };
  if (mois === 9 || mois === 10) return { soleil: .3, nuageux: .3, averse: .3, orage: .1 };
  if (mois === 11 || mois <= 1) return { soleil: .35, nuageux: .15, harmattan: .45, averse: .05 };
  return { soleil: .5, nuageux: .35, averse: .15 };
}

function hachage(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Déterministe : même jour réel et même tranche de trois heures de jeu, même météo, sans rien sauvegarder. */
export function meteoDuMoment(date: Date, heure: number): Meteo {
  const debutAnnee = Date.UTC(date.getFullYear(), 0, 1);
  const jour = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - debutAnnee) / 86_400_000);
  const tranche = Math.floor((((heure % 24) + 24) % 24) / 3);
  let tirage = hachage(date.getFullYear() * 1000 + jour * 8 + tranche);
  for (const [meteo, p] of Object.entries(probabilites(date.getMonth())) as [Meteo, number][]) {
    if (tirage < p) return meteo;
    tirage -= p;
  }
  return 'soleil';
}

export interface AmbianceMeteo {
  /** Multiplicateur de l'intensité du soleil. */
  soleil: number;
  /** Teinte du ciel et du brouillard, mélangée selon `melange`. */
  teinte: string;
  melange: number;
  brouillardProche: number;
  brouillardLoin: number;
  /** 0 à 1. */
  pluie: number;
  eclairs: boolean;
  turbidite: number;
}

export function ambianceMeteo(meteo: Meteo): AmbianceMeteo {
  switch (meteo) {
    case 'nuageux': return { soleil: .6, teinte: '#9aa6ad', melange: .35, brouillardProche: 80, brouillardLoin: 250, pluie: 0, eclairs: false, turbidite: 9 };
    case 'averse': return { soleil: .32, teinte: '#7d8a93', melange: .6, brouillardProche: 40, brouillardLoin: 170, pluie: .65, eclairs: false, turbidite: 14 };
    case 'orage': return { soleil: .18, teinte: '#545f6b', melange: .75, brouillardProche: 28, brouillardLoin: 140, pluie: 1, eclairs: true, turbidite: 18 };
    case 'harmattan': return { soleil: .7, teinte: '#d2b48f', melange: .55, brouillardProche: 25, brouillardLoin: 150, pluie: 0, eclairs: false, turbidite: 16 };
    default: return { soleil: 1, teinte: '#adcddd', melange: 0, brouillardProche: 90, brouillardLoin: 280, pluie: 0, eclairs: false, turbidite: 5 };
  }
}
