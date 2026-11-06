import type { EmpriseVille, PointVille } from './itineraire-ville';

// Les déplacements du joueur dans une ville pleine de décor. Une grille de 50 cm couvre les limites de la ville ; chaque
// obstacle (bâtiment, arbre, banc, étal, bateau…) y bloque ses cases, élargi de la place du corps. L'itinéraire est
// cherché sur la grille (A*), puis tendu en lignes droites dès que la vue est dégagée. Avec quelques centaines
// d'obstacles, c'est bien plus rapide que de relier entre eux tous leurs coins (itineraire-ville.ts, gardé pour les
// habitants, qui ne contournent que les bâtiments).

/** Un point qu'on lit sans le modifier. */
type Lu = readonly [number, number];

export interface LimitesVille { minX: number; maxX: number; minZ: number; maxZ: number }

const PAS = .5;
/** Le corps du joueur : image par image, il s'arrête à 70 cm d'un obstacle. */
export const MARGE_CORPS = .7;
/** Les itinéraires gardent un peu plus d'écart, pour ne jamais frôler un angle. */
export const MARGE_ITINERAIRE = .85;
/** Une case est bloquée si son centre est trop près d'un obstacle pour qu'on y passe sans frôler : de centre à centre de
 * cases libres, on reste ainsi à MARGE_ITINERAIRE au moins. */
const MARGE_GRILLE = MARGE_ITINERAIRE + PAS * Math.SQRT1_2;
/** Au-delà, on abandonne : un clic ne doit jamais figer le jeu. */
const EXPANSIONS_MAX = 120_000;
const DIAGONALE = Math.SQRT2;

/** Le segment [a, b] reste-t-il à `marge` de tous les obstacles ? (Méthode des dalles, sur chaque rectangle élargi.) */
export function segmentLibre(a: Lu, b: Lu, obstacles: readonly EmpriseVille[], marge = MARGE_ITINERAIRE) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  for (const o of obstacles) {
    const minX = o.x - o.largeur / 2 - marge, maxX = o.x + o.largeur / 2 + marge;
    const minZ = o.z - o.profondeur / 2 - marge, maxZ = o.z + o.profondeur / 2 + marge;
    let entree = 0, sortie = 1;
    if (Math.abs(dx) < 1e-9) { if (a[0] <= minX || a[0] >= maxX) continue; }
    else {
      const t1 = (minX - a[0]) / dx, t2 = (maxX - a[0]) / dx;
      entree = Math.max(entree, Math.min(t1, t2)); sortie = Math.min(sortie, Math.max(t1, t2));
      if (entree >= sortie) continue;
    }
    if (Math.abs(dz) < 1e-9) { if (a[1] <= minZ || a[1] >= maxZ) continue; }
    else {
      const t1 = (minZ - a[1]) / dz, t2 = (maxZ - a[1]) / dz;
      entree = Math.max(entree, Math.min(t1, t2)); sortie = Math.min(sortie, Math.max(t1, t2));
      if (entree >= sortie) continue;
    }
    return false;
  }
  return true;
}

/** Tas binaire d'indices de cases, rangés par coût estimé. */
class Tas {
  private indices: Int32Array; private couts: Float32Array; taille = 0;
  constructor(capacite: number) { this.indices = new Int32Array(capacite); this.couts = new Float32Array(capacite); }
  vider() { this.taille = 0; }
  ajouter(indice: number, cout: number) {
    if (this.taille === this.indices.length) return;
    let i = this.taille++;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.couts[parent] <= cout) break;
      this.indices[i] = this.indices[parent]; this.couts[i] = this.couts[parent]; i = parent;
    }
    this.indices[i] = indice; this.couts[i] = cout;
  }
  retirer() {
    const sommet = this.indices[0], dernier = this.indices[--this.taille], coutDernier = this.couts[this.taille];
    let i = 0;
    for (;;) {
      let enfant = 2 * i + 1;
      if (enfant >= this.taille) break;
      if (enfant + 1 < this.taille && this.couts[enfant + 1] < this.couts[enfant]) enfant++;
      if (this.couts[enfant] >= coutDernier) break;
      this.indices[i] = this.indices[enfant]; this.couts[i] = this.couts[enfant]; i = enfant;
    }
    this.indices[i] = dernier; this.couts[i] = coutDernier;
    return sommet;
  }
}

export interface NavigationVille {
  /** Le joueur peut-il se tenir là (à MARGE_CORPS de tout obstacle, dans la ville) ? */
  passe(x: number, z: number): boolean;
  /** Le point libre le plus proche (lui-même s'il l'est) ; null si rien de libre alentour. */
  degager(p: Lu): PointVille | null;
  /** Les étapes pour aller de `depart` à `arrivee` (départ exclu) ; une destination dans le décor est ramenée juste à côté. */
  chemin(depart: Lu, arrivee: Lu): PointVille[];
}

export interface Boucle {
  /** Le tracé complet, qui contourne le décor. */
  points: PointVille[];
  /** `reperes[i]` : l'indice, dans le tracé, du i-ème point d'origine (pour faire partir chacun d'un point différent). */
  reperes: number[];
}

/** Une boucle de passage (passants, habitants à leur poste) qui contourne le décor : chaque point est d'abord dégagé, puis
 * relié au suivant par un itinéraire ; après le dernier, on revient au premier. */
export function boucleContournee(navigation: NavigationVille, points: readonly Lu[]): Boucle {
  const degages = points.map((p): PointVille => navigation.degager(p) ?? [p[0], p[1]]);
  const trace: PointVille[] = [], reperes: number[] = [];
  degages.forEach((p, i) => {
    reperes.push(trace.length);
    trace.push(p);
    if (degages.length < 2) return;
    // L'itinéraire finit sur le point suivant, ajouté au tour d'après.
    trace.push(...navigation.chemin(p, degages[(i + 1) % degages.length]).slice(0, -1));
  });
  return { points: trace, reperes };
}

export function creerNavigation(obstacles: readonly EmpriseVille[], limites: LimitesVille): NavigationVille {
  const colonnes = Math.floor((limites.maxX - limites.minX) / PAS) + 1;
  const lignes = Math.floor((limites.maxZ - limites.minZ) / PAS) + 1;
  const total = colonnes * lignes;
  const borner = (p: Lu): PointVille => [Math.min(limites.maxX, Math.max(limites.minX, p[0])), Math.min(limites.maxZ, Math.max(limites.minZ, p[1]))];
  const colonne = (x: number) => Math.min(colonnes - 1, Math.max(0, Math.round((x - limites.minX) / PAS)));
  const ligne = (z: number) => Math.min(lignes - 1, Math.max(0, Math.round((z - limites.minZ) / PAS)));
  const centre = (i: number): PointVille => [limites.minX + (i % colonnes) * PAS, limites.minZ + Math.floor(i / colonnes) * PAS];

  // La grille ne se construit qu'au premier itinéraire : la ville s'ouvre sans attendre.
  let bloque: Uint8Array | null = null;
  const grilleBloquee = () => {
    if (bloque) return bloque;
    bloque = new Uint8Array(total);
    for (const o of obstacles) {
      const c0 = Math.max(0, Math.ceil((o.x - o.largeur / 2 - MARGE_GRILLE - limites.minX) / PAS));
      const c1 = Math.min(colonnes - 1, Math.floor((o.x + o.largeur / 2 + MARGE_GRILLE - limites.minX) / PAS));
      const l0 = Math.max(0, Math.ceil((o.z - o.profondeur / 2 - MARGE_GRILLE - limites.minZ) / PAS));
      const l1 = Math.min(lignes - 1, Math.floor((o.z + o.profondeur / 2 + MARGE_GRILLE - limites.minZ) / PAS));
      for (let l = l0; l <= l1; l++) bloque.fill(1, l * colonnes + c0, l * colonnes + c1 + 1);
    }
    return bloque;
  };

  const passe = (x: number, z: number) => {
    if (x < limites.minX || x > limites.maxX || z < limites.minZ || z > limites.maxZ) return false;
    for (const o of obstacles) if (Math.abs(x - o.x) < o.largeur / 2 + MARGE_CORPS && Math.abs(z - o.z) < o.profondeur / 2 + MARGE_CORPS) return false;
    return true;
  };

  /** La case libre la plus proche de la case `i` (jusqu'à 25 m). On cherche en anneaux carrés ; une fois une case trouvée,
   * on regarde encore les anneaux qui peuvent cacher plus près à vol d'oiseau (un coin d'anneau est plus loin qu'un côté). */
  const caseLibreProche = (i: number) => {
    const g = grilleBloquee();
    if (!g[i]) return i;
    const c = i % colonnes, l = Math.floor(i / colonnes);
    let meilleure = -1, distanceMeilleure = Infinity, limite = 50;
    for (let r = 1; r <= limite; r++) {
      for (let dl = -r; dl <= r; dl++) for (let dc = -r; dc <= r; dc++) {
        if (Math.max(Math.abs(dl), Math.abs(dc)) !== r) continue;
        const cc = c + dc, ll = l + dl;
        if (cc < 0 || ll < 0 || cc >= colonnes || ll >= lignes) continue;
        const j = ll * colonnes + cc, d = dc * dc + dl * dl;
        if (!g[j] && d < distanceMeilleure) { meilleure = j; distanceMeilleure = d; }
      }
      if (meilleure >= 0 && limite === 50) limite = Math.min(50, Math.ceil(Math.sqrt(distanceMeilleure)));
    }
    return meilleure;
  };

  const degager = (p: Lu): PointVille | null => {
    const q = borner(p);
    if (!grilleBloquee()[ligne(q[1]) * colonnes + colonne(q[0])] && passe(q[0], q[1])) return q;
    const j = caseLibreProche(ligne(q[1]) * colonnes + colonne(q[0]));
    return j < 0 ? null : centre(j);
  };

  // Mémoire de la recherche, réutilisée d'un itinéraire à l'autre (le tampon dit quelles cases sont à jour).
  let couts: Float32Array | null = null, parents: Int32Array | null = null, tampons: Uint32Array | null = null, fermees: Uint32Array | null = null, tas: Tas | null = null;
  let generation = 0;

  const chemin = (depart: Lu, arrivee: Lu): PointVille[] => {
    const g = grilleBloquee();
    const fin = degager(arrivee);
    if (!fin) return [];
    if (segmentLibre(depart, fin, obstacles)) return [fin];
    const iDepart = caseLibreProche(ligne(depart[1]) * colonnes + colonne(depart[0]));
    const iFin = ligne(fin[1]) * colonnes + colonne(fin[0]);
    if (iDepart < 0 || g[iFin]) return [];

    couts ??= new Float32Array(total); parents ??= new Int32Array(total); tampons ??= new Uint32Array(total); fermees ??= new Uint32Array(total); tas ??= new Tas(total);
    const gen = ++generation;
    const cFin = iFin % colonnes, lFin = Math.floor(iFin / colonnes);
    const heuristique = (i: number) => {
      const dc = Math.abs(i % colonnes - cFin), dl = Math.abs(Math.floor(i / colonnes) - lFin);
      return Math.max(dc, dl) + (DIAGONALE - 1) * Math.min(dc, dl);
    };
    tas.vider();
    couts[iDepart] = 0; parents[iDepart] = -1; tampons[iDepart] = gen;
    tas.ajouter(iDepart, heuristique(iDepart));
    let trouve = false;
    for (let expansions = 0; tas.taille && expansions < EXPANSIONS_MAX; expansions++) {
      const i = tas.retirer();
      if (fermees[i] === gen) continue;
      fermees[i] = gen;
      if (i === iFin) { trouve = true; break; }
      const c = i % colonnes, l = Math.floor(i / colonnes);
      for (let dl = -1; dl <= 1; dl++) for (let dc = -1; dc <= 1; dc++) {
        if (!dl && !dc) continue;
        const cc = c + dc, ll = l + dl;
        if (cc < 0 || ll < 0 || cc >= colonnes || ll >= lignes) continue;
        const j = ll * colonnes + cc;
        if (g[j] || fermees[j] === gen) continue;
        // En diagonale, jamais en coupant l'angle d'un obstacle.
        if (dl && dc && (g[l * colonnes + cc] || g[ll * colonnes + c])) continue;
        const cout = couts[i] + (dl && dc ? DIAGONALE : 1);
        if (tampons[j] === gen && cout >= couts[j]) continue;
        couts[j] = cout; parents[j] = i; tampons[j] = gen;
        tas.ajouter(j, cout + heuristique(j));
      }
    }
    if (!trouve) return [];

    const cases: PointVille[] = [];
    for (let i = iFin; i >= 0; i = parents[i]) cases.unshift(centre(i));
    cases[cases.length - 1] = fin;
    // Tendre le fil : depuis chaque étape, aller droit au point le plus lointain encore visible. Un départ collé à un
    // obstacle passe d'abord par la case libre la plus proche, pour s'en écarter sans le frôler.
    const etapes: PointVille[] = [];
    let ici: Lu = depart, k = 0;
    if (g[ligne(depart[1]) * colonnes + colonne(depart[0])]) { ici = cases[0]; etapes.push(cases[0]); }
    while (k < cases.length - 1) {
      let loin = k;
      while (loin + 1 < cases.length && segmentLibre(ici, cases[loin + 1], obstacles)) loin++;
      if (loin === k) loin = k + 1;
      ici = cases[loin];
      etapes.push(cases[loin]);
      k = loin;
    }
    if (!etapes.length || etapes[etapes.length - 1] !== fin) etapes.push(fin);
    return etapes;
  };

  return { passe, degager, chemin };
}
