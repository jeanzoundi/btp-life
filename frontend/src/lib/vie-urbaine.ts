// La ville à horaires : où sont les habitants selon l'heure (leurs journées suivent celles des lieux), combien de passants
// et de véhicules il y a dans les rues, et ce que la météo change au jeu. Sans Three.js ni React.
import type { Meteo } from './meteo-monde';

type PointMonde = [number, number];
export interface Creneau { de: number; a: number; activite: string; route: PointMonde[] }

/** La journée de chaque habitant, devant les portes des lieux où il travaille et se détend ; hors créneau, il est chez lui. */
export const PLANNINGS_PNJ: Record<string, Creneau[]> = {
  Awa: [
    { de: 8, a: 17, activite: 'Au campus', route: [[-36, -15.8], [-22, -15.8]] },
    { de: 17, a: 21, activite: 'Au café', route: [[5, -27.6], [15, -27.6]] },
  ],
  Yao: [
    { de: 18, a: 21.5, activite: 'Au maquis', route: [[-16, 37.4], [-6, 37.4]] },
  ],
  Mariam: [
    { de: 8, a: 19, activite: 'À la Tour BTP Life', route: [[24, -16.3], [34, -16.3]] },
    { de: 19, a: 22, activite: 'À la marina', route: [[82, 62], [96, 62]] },
  ],
  Koffi: [
    { de: 6, a: 18, activite: 'Au dépôt', route: [[36, 6.6], [48, 6.6]] },
    { de: 18, a: 21, activite: 'Au maquis', route: [[-15, 38.4], [-7, 38.4]] },
  ],
  Fatou: [
    { de: 7, a: 12, activite: 'Au marché', route: [[-95, -50.5], [-81, -50.5]] },
    { de: 12, a: 21, activite: 'Sur la place', route: [[-22, 13], [-4, 13], [-4, -13], [22, -13], [22, 13]] },
  ],
};

const dansCreneau = (c: Pick<Creneau, 'de' | 'a'>, heure: number) => { const h = ((heure % 24) + 24) % 24; return h >= c.de && h < c.a; };
/** Où est l'habitant à cette heure : son créneau, ou rien s'il est rentré chez lui. */
export const creneauPnj = (nom: string, heure: number) => (PLANNINGS_PNJ[nom] ?? []).find(c => dansCreneau(c, heure)) ?? null;

/** Part de la foule selon l'heure : la nuit est calme, la journée animée, la soirée entre les deux. */
export function affluence(heure: number) {
  const h = ((heure % 24) + 24) % 24;
  return h >= 22 || h < 5 ? .15 : h < 7 ? .5 : h < 19 ? 1 : .65;
}
/** La pluie vide les trottoirs ; l'orage encore plus. */
export const facteurPluie = (pluie: number) => pluie >= 1 ? .35 : pluie > 0 ? .6 : 1;

/** Quartier de chaque itinéraire de passants : le marché des Jardins le matin, la plage le soir, le Plateau aux heures de bureau. */
const QUARTIER_ROUTES = ['jardins', 'batisseurs', 'plateau', 'plage-ouest', 'plage-est', 'plateau'] as const;
function attrait(quartier: (typeof QUARTIER_ROUTES)[number], heure: number) {
  const h = ((heure % 24) + 24) % 24;
  if (quartier === 'jardins') return h >= 7 && h < 13 ? 3 : 1;
  if (quartier === 'plateau') return h >= 8 && h < 18 ? 2 : .5;
  if (quartier.startsWith('plage')) return h >= 16 && h < 22 ? 3 : 1;
  return 1;
}
/** Les passants présents (itinéraire, départ) : leur nombre suit l'affluence et la pluie, les quartiers attirants d'abord. */
export function passantsPresents(heure: number, pluie: number, routes = QUARTIER_ROUTES.length, parRoute = 2) {
  const total = routes * parRoute, nombre = Math.round(total * affluence(heure) * facteurPluie(pluie));
  const ordre = Array.from({ length: total }, (_, k) => ({ route: Math.floor(k / parRoute), depart: k % parRoute }))
    .sort((a, b) => b.depart - a.depart ? a.depart - b.depart : attrait(QUARTIER_ROUTES[b.route] ?? 'batisseurs', heure) - attrait(QUARTIER_ROUTES[a.route] ?? 'batisseurs', heure) || a.route - b.route);
  return ordre.slice(0, nombre);
}

/** Véhicules en circulation : moins la nuit, davantage aux heures de pointe (7–9 h et 17–19 h). */
export function vehiculesEnCirculation(heure: number, total: number) {
  const h = ((heure % 24) + 24) % 24;
  const part = h >= 23 || h < 5 ? .3 : (h >= 7 && h < 9) || (h >= 17 && h < 19) ? 1 : h >= 21 ? .5 : .8;
  return Math.max(1, Math.round(total * part));
}

/** Ce que la météo change au jeu. */
export function effetsMeteo(meteo: Meteo) {
  return {
    /** La marche ralentit sous la pluie (trottoirs glissants, flaques). */
    vitesseMarche: meteo === 'orage' ? .75 : meteo === 'averse' ? .85 : 1,
    /** Pendant l'orage, le Grand chantier s'arrête : on ne coule pas, on ne monte pas sur les échafaudages. */
    chantierArrete: meteo === 'orage',
    /** Les passants sortent le parapluie. */
    parapluies: meteo === 'averse' || meteo === 'orage',
  };
}
