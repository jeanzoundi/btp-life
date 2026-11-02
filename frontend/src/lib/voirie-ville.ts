import type { BlocArchitecture } from './architecture-ville';

// La voirie du quartier en blocs instanciés : bordures, caniveaux, trottoirs, passages piétons et lignes d'arrêt. Tout est
// coupé aux carrefours, pour qu'aucune bordure ne barre une chaussée et que chaque passage piéton soit hors du carrefour.

/** Axes des avenues est-ouest (z) et des avenues nord-sud (x), larges de 6 m. */
export const ROUTES_EST_OUEST = [-66, -10, 10];
export const AVENUES_NORD_SUD = [-54, 54];
export const DEMI_CHAUSSEE = 3;
const ETENDUE_X: [number, number] = [-120, 120];
const ETENDUE_Z: [number, number] = [-128, 48];

/** Les morceaux de [debut, fin] qui restent hors des coupures (centre ± demi-largeur), dans l'ordre. */
export function troncons(debut: number, fin: number, coupures: readonly number[], demiLargeur: number): [number, number][] {
  const morceaux: [number, number][] = [];
  let a = debut;
  for (const c of [...coupures].sort((x, y) => x - y)) {
    if (c - demiLargeur > a) morceaux.push([a, c - demiLargeur]);
    a = Math.max(a, c + demiLargeur);
  }
  if (fin > a) morceaux.push([a, fin]);
  return morceaux;
}

const bloc = (position: BlocArchitecture['position'], taille: BlocArchitecture['taille'], couleur: string, matiere?: BlocArchitecture['matiere']): BlocArchitecture =>
  ({ position, taille, couleur, rotation: 0, ...(matiere ? { matiere } : {}) });

/** Une bande parallèle à une avenue est-ouest (le long de x) ou nord-sud (le long de z), coupée aux carrefours. */
function bandes(sens: 'x' | 'z', axe: number, decalage: number, y: number, epaisseur: number, largeur: number, coupure: number, couleur: string, matiere?: BlocArchitecture['matiere']) {
  const [debut, fin] = sens === 'x' ? ETENDUE_X : ETENDUE_Z;
  const coupures = sens === 'x' ? AVENUES_NORD_SUD : ROUTES_EST_OUEST;
  return troncons(debut, fin, coupures, coupure).map(([a, b]) => sens === 'x'
    ? bloc([(a + b) / 2, y, axe + decalage], [b - a, epaisseur, largeur], couleur, matiere)
    : bloc([axe + decalage, y, (a + b) / 2], [largeur, epaisseur, b - a], couleur, matiere));
}

export function construireVoirie(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [];
  const bordsDe = (sens: 'x' | 'z', axe: number) => {
    for (const cote of [-1, 1]) {
      // Bordure de béton, caniveau à ciel ouvert et sa lèvre, puis le trottoir de béton clair.
      blocs.push(...bandes(sens, axe, cote * 3.15, .12, .2, .25, DEMI_CHAUSSEE + .8, '#e4dccb', 'beton'));
      blocs.push(...bandes(sens, axe, cote * 3.55, .065, .02, .35, DEMI_CHAUSSEE + .8, '#2b2f30'));
      blocs.push(...bandes(sens, axe, cote * 3.8, .08, .035, .12, DEMI_CHAUSSEE + .8, '#cfc8b6', 'beton'));
      blocs.push(...bandes(sens, axe, cote * 5.05, .045, .03, 2.2, DEMI_CHAUSSEE + 3.3, '#d6d0c2', 'beton'));
    }
  };
  for (const z of ROUTES_EST_OUEST) bordsDe('x', z);
  for (const x of AVENUES_NORD_SUD) {
    bordsDe('z', x);
    // Tirets d'axe de l'avenue, interrompus aux carrefours.
    for (const [a, b] of troncons(ETENDUE_Z[0], ETENDUE_Z[1], ROUTES_EST_OUEST, DEMI_CHAUSSEE + 1)) {
      for (let z = a + 1.5; z < b - 1; z += 4.3) blocs.push(bloc([x, .09, z], [.1, .015, 2], '#e6dcbf'));
    }
  }
  // À chaque carrefour, les quatre angles de trottoir, quatre passages piétons juste avant le croisement et leurs lignes d'arrêt.
  for (const x0 of AVENUES_NORD_SUD) for (const z0 of ROUTES_EST_OUEST) {
    for (const cx of [-1, 1]) for (const cz of [-1, 1]) blocs.push(bloc([x0 + cx * 5.05, .045, z0 + cz * 5.05], [2.2, .03, 2.2], '#d6d0c2', 'beton'));
    for (const cote of [-1, 1]) {
      // Sur l'avenue est-ouest, de part et d'autre de l'avenue nord-sud : bandes dans le sens de la circulation (x).
      for (let i = 0; i < 6; i++) blocs.push(bloc([x0 + cote * 5, .1, z0 - 2.4 + i * .96], [2.4, .02, .46], '#eee8d7'));
      blocs.push(bloc([x0 + cote * 6.6, .1, z0], [.25, .02, 5.6], '#eee8d7'));
      // Sur l'avenue nord-sud, de part et d'autre de l'avenue est-ouest : bandes dans le sens de la circulation (z).
      for (let i = 0; i < 6; i++) blocs.push(bloc([x0 - 2.4 + i * .96, .11, z0 + cote * 5], [.46, .02, 2.4], '#eee8d7'));
      blocs.push(bloc([x0, .11, z0 + cote * 6.6], [5.6, .02, .25], '#eee8d7'));
    }
  }
  return blocs;
}

/** Les flaques du quartier pilote, à la même place pour tous : au bord des chaussées, le long des caniveaux, et sur les
 * trottoirs. Elles n'apparaissent qu'avec l'humidité des sols (sols-mouilles.tsx). */
export function flaquesQuartier(nombre = 26) {
  return Array.from({ length: nombre }, (_, i) => {
    const h = (n: number) => { const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return s - Math.floor(s); };
    const route = ROUTES_EST_OUEST[1 + (i % 2)], cote = h(3) < .5 ? -1 : 1;
    // Une flaque sur deux environ au bord de la chaussée, les autres sur le trottoir.
    const ecart = h(2) < .55 ? 1.9 + h(4) * .8 : 4.6 + h(4) * .9;
    return { x: -46 + h(1) * 92, z: route + cote * ecart, rx: .6 + h(5) * 1.1, rz: .4 + h(6) * .7, angle: h(7) * Math.PI };
  });
}
