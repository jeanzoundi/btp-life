// La coque d'une pirogue de pêche ivoirienne : longue et étroite, fond légèrement relevé aux bouts, étrave et étambot
// pointus qui remontent, peinte dehors en bandes franches, bois brut dedans. Calcul pur (sommets, couleurs, faces) :
// bateaux-plage.tsx en fait une géométrie Three.js, les tests en vérifient la forme.

export type Rgb = readonly [number, number, number];
/** Couleurs d'une pirogue, du plat-bord vers la quille. */
export interface MotifPirogue { haut: Rgb; milieu: Rgb; filet: Rgb; bas: Rgb; bois: Rgb; platBord: Rgb }

const rgb = (hex: string): Rgb => { const n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
/** Quatre décorations peintes, comme sur les plages de Grand-Bassam et de Vridi. */
export const MOTIFS_PIROGUES: MotifPirogue[] = [
  { haut: rgb('#F2C230'), milieu: rgb('#C8372D'), filet: rgb('#F4EEDC'), bas: rgb('#2F6FB3'), bois: rgb('#8A5A32'), platBord: rgb('#2B2118') },
  { haut: rgb('#3F8F4E'), milieu: rgb('#F2C230'), filet: rgb('#C8372D'), bas: rgb('#1F3B52'), bois: rgb('#7A4E2D'), platBord: rgb('#2B2118') },
  { haut: rgb('#E8742B'), milieu: rgb('#F4EEDC'), filet: rgb('#2F6FB3'), bas: rgb('#3B2A20'), bois: rgb('#94643A'), platBord: rgb('#1E1A16') },
  { haut: rgb('#2F6FB3'), milieu: rgb('#F4EEDC'), filet: rgb('#3F8F4E'), bas: rgb('#C8372D'), bois: rgb('#83552F'), platBord: rgb('#2B2118') },
];

export interface FormePirogue { longueur: number; largeur: number; creux: number; releve: number }
export const FORME_PIROGUE: FormePirogue = { longueur: 7.2, largeur: 1.25, creux: .62, releve: .45 };

const STATIONS = 28, POINTS = 12;

/** Demi-largeur, hauteur du plat-bord et hauteur du fond à la station u (−1 à l'arrière, 1 à l'avant). */
export function sectionPirogue(u: number, forme: FormePirogue = FORME_PIROGUE) {
  const a = Math.min(1, Math.abs(u));
  return {
    demiLargeur: forme.largeur / 2 * Math.pow(Math.max(0, 1 - Math.pow(a, 2.4)), .55),
    platBord: forme.creux + forme.releve * Math.pow(a, 3),
    fond: .06 + .14 * a * a,
  };
}

export function coquePirogue(motif: MotifPirogue, forme: FormePirogue = FORME_PIROGUE) {
  const positions: number[] = [], couleurs: number[] = [], indices: number[] = [];
  const couleurDehors = (fraction: number) => fraction > .8 ? motif.haut : fraction > .6 ? motif.milieu : fraction > .52 ? motif.filet : motif.bas;
  /** Une nappe de sections (dehors ou dedans) ; `interieur` retourne les faces vers le creux. */
  const nappe = (resserre: number, remonte: number, interieur: boolean) => {
    const depart = positions.length / 3;
    for (let s = 0; s <= STATIONS; s++) {
      const u = s / STATIONS * 2 - 1, x = u * forme.longueur / 2;
      const { demiLargeur, platBord, fond } = sectionPirogue(u, forme);
      const largeur = demiLargeur * resserre, bas = fond + remonte;
      for (let k = 0; k <= POINTS; k++) {
        const phi = Math.PI * k / POINTS;
        const fraction = Math.pow(1 - Math.sin(phi), .6);
        const y = bas + (platBord - bas) * fraction;
        positions.push(x, y, -largeur * Math.cos(phi));
        couleurs.push(...(interieur ? motif.bois : couleurDehors(fraction)));
      }
    }
    for (let s = 0; s < STATIONS; s++) for (let k = 0; k < POINTS; k++) {
      const a = depart + s * (POINTS + 1) + k, b = a + POINTS + 1;
      if (interieur) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return depart;
  };
  const dehors = nappe(1, 0, false);
  const dedans = nappe(.86, .07, true);
  // Le plat-bord, sombre, referme le haut entre la nappe extérieure et la nappe intérieure, des deux côtés.
  for (const k of [0, POINTS]) {
    const depart = positions.length / 3;
    for (let s = 0; s <= STATIONS; s++) {
      for (const nappeDepart of [dehors, dedans]) {
        const i = (nappeDepart + s * (POINTS + 1) + k) * 3;
        positions.push(positions[i], positions[i + 1] + .015, positions[i + 2]);
        couleurs.push(...motif.platBord);
      }
    }
    for (let s = 0; s < STATIONS; s++) {
      const a = depart + s * 2, b = a + 2;
      if (k === 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions: new Float32Array(positions), couleurs: new Float32Array(couleurs), indices: new Uint32Array(indices) };
}
