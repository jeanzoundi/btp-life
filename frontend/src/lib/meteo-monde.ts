export type Meteo = 'soleil' | 'nuageux' | 'averse' | 'orage' | 'harmattan';

export const METEOS: Meteo[] = ['soleil', 'nuageux', 'averse', 'orage', 'harmattan'];

export const LIBELLES_METEO: Record<Meteo, { icone: string; nom: string }> = {
  soleil: { icone: '☀️', nom: 'Ensoleillé' },
  nuageux: { icone: '⛅', nom: 'Nuageux' },
  averse: { icone: '🌧️', nom: 'Averse' },
  orage: { icone: '⛈️', nom: 'Orage' },
  harmattan: { icone: '💨', nom: 'Harmattan' },
};

// La météo est automatique : elle avance par épisodes tirés au hasard selon la saison du mois en cours. Elle se calcule
// depuis l'heure réelle, sans rien sauvegarder : au même instant, tous les joueurs ont le même ciel.

export interface Saison { nom: string; mois: readonly number[]; probabilites: Partial<Record<Meteo, number>> }

/** Les saisons du sud ivoirien : grande saison sèche (harmattan de décembre à février), grande saison des pluies d'avril
 * à juillet, petite saison sèche en août-septembre, petite saison des pluies en octobre-novembre. */
export const SAISONS: readonly Saison[] = [
  { nom: 'Grande saison sèche · harmattan', mois: [11, 0, 1], probabilites: { soleil: .35, nuageux: .15, harmattan: .45, averse: .05 } },
  { nom: 'Grande saison sèche', mois: [2], probabilites: { soleil: .55, nuageux: .3, averse: .1, orage: .05 } },
  { nom: 'Grande saison des pluies', mois: [3, 4, 5, 6], probabilites: { soleil: .2, nuageux: .3, averse: .35, orage: .15 } },
  { nom: 'Petite saison sèche', mois: [7, 8], probabilites: { soleil: .45, nuageux: .4, averse: .15 } },
  { nom: 'Petite saison des pluies', mois: [9, 10], probabilites: { soleil: .3, nuageux: .3, averse: .3, orage: .1 } },
];

export function saisonDuMoment(instant: Date): Saison {
  return SAISONS.find(s => s.mois.includes(instant.getMonth())) ?? SAISONS[0];
}

/** Un épisode dure dix minutes réelles, soit dix heures de jeu à vitesse normale ; deux épisodes de suite peuvent se ressembler. */
export const DUREE_EPISODE_MS = 10 * 60_000;
/** Entre un ciel sec et la pluie, les nuages s'installent (ou se dissipent) pendant les dernières minutes de l'épisode. */
export const DUREE_TRANSITION_MS = 3 * 60_000;
// Du plus sec au plus humide : passer d'un côté à l'autre du ciel nuageux demande une transition.
const HUMIDITE: Record<Meteo, number> = { harmattan: 0, soleil: 1, nuageux: 2, averse: 3, orage: 4 };

function hachage(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function meteoEpisode(episode: number): Meteo {
  let tirage = hachage(episode);
  for (const [meteo, p] of Object.entries(saisonDuMoment(new Date(episode * DUREE_EPISODE_MS)).probabilites) as [Meteo, number][]) {
    if (tirage < p) return meteo;
    tirage -= p;
  }
  return 'soleil';
}

/** La météo à cet instant : celle de l'épisode en cours, ou des nuages juste avant de passer du sec à la pluie (et inversement). */
export function meteoDuMoment(instant: Date): Meteo {
  const t = instant.getTime();
  const episode = Math.floor(t / DUREE_EPISODE_MS);
  const actuelle = meteoEpisode(episode);
  if ((episode + 1) * DUREE_EPISODE_MS - t > DUREE_TRANSITION_MS) return actuelle;
  const [seche, humide] = [HUMIDITE[actuelle], HUMIDITE[meteoEpisode(episode + 1)]].sort((a, b) => a - b);
  return seche < HUMIDITE.nuageux && humide > HUMIDITE.nuageux ? 'nuageux' : actuelle;
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
