export type V3 = [number, number, number];
/** Matière d'un bloc plein : l'enduit des murs par défaut ; le béton des dalles, socles, acrotères et claustras ; le métal
 * des garde-corps, menuiseries, lames et équipements ; le bois des portes et des persiennes. */
export type MatiereBloc = 'enduit' | 'beton' | 'metal' | 'bois';
export type BlocArchitecture = { position: V3; taille: V3; couleur: string; rotation: number; matiere?: MatiereBloc; forme?: 'cylindre' };
export type ToitArchitecture = { largeur: number; profondeur: number; hauteur: number; y: number; couleur: string };
export type PlanArchitecture = {
  solides: BlocArchitecture[]; vitres: BlocArchitecture[]; lumieres: BlocArchitecture[];
  /** Fleurs et feuillages des bacs, dessinés en sphères instanciées. */
  fleurs: BlocArchitecture[];
  /** Toit à quatre pans en tuiles, réservé aux maisons et aux petits commerces. */
  toit?: ToitArchitecture;
};
type LotBlocs = 'solides' | 'vitres' | 'lumieres' | 'fleurs';

/** Ce qui distingue une façade d'une autre, au-delà de sa couleur et de son gabarit. */
export interface StyleFacade {
  /** Protections solaires : lames verticales de métal, casquettes de béton au-dessus des fenêtres, ou claustras ajourés. */
  brise?: 'lames' | 'casquettes' | 'claustras';
  /** Un étage d'attique en retrait sur le toit-terrasse, bordé d'un garde-corps : la silhouette n'est plus un simple pavé. */
  attique?: boolean;
  /** Marquise de béton sur deux poteaux au-dessus de l'entrée. */
  marquise?: boolean;
  /** Persiennes de bois peint de part et d'autre des fenêtres d'étage. */
  persiennes?: string;
  /** Climatiseurs sous une fenêtre sur trois, comme sur les façades d'Abidjan. */
  climatiseurs?: boolean;
  /** Citernes d'eau noires sur le toit-terrasse. */
  citernes?: number;
  /** Bandeaux d'étage peints de cette couleur. */
  accent?: string;
}

/** La façade de chaque lieu : les tours de bureaux en lames et attique, les équipements publics en casquettes ou en
 * claustras, les logements en persiennes et climatiseurs, citernes sur les toits-terrasses. */
export const STYLES_LIEUX: Record<string, StyleFacade> = {
  universite: { brise: 'claustras', marquise: true, citernes: 2 },
  entreprise: { brise: 'lames', attique: true, marquise: true, climatiseurs: true },
  residence: { persiennes: '#3f6f5f', climatiseurs: true },
  banque: { brise: 'casquettes', marquise: true, climatiseurs: true, citernes: 1 },
  fournisseur: { citernes: 1, climatiseurs: true },
  mairie: { brise: 'casquettes', marquise: true, accent: '#3d7a63', citernes: 2 },
  laboratoire: { brise: 'claustras', citernes: 2, climatiseurs: true },
  'bureau-etudes': { brise: 'lames', attique: true, climatiseurs: true },
  'jardins-residence': { persiennes: '#2f5d82', climatiseurs: true },
  atelier: { citernes: 2, climatiseurs: true, accent: '#a5552f' },
  logistique: { brise: 'casquettes', citernes: 1 },
  agence: { brise: 'lames', attique: true, marquise: true },
  'centre-azur': { brise: 'casquettes', climatiseurs: true, citernes: 2 },
  'galerie-palmiers': { brise: 'claustras', climatiseurs: true, citernes: 1 },
  sports: { brise: 'casquettes', citernes: 1, accent: '#4f7f3f' },
  // Le R+5 du fil rouge : logements à persiennes au-dessus de ses deux commerces, citernes sur le toit-terrasse.
  'residence-roniers': { persiennes: '#8a5a33', climatiseurs: true, citernes: 2 },
};

const COULEURS_FLEURS = ['#e8476b', '#f2c14e', '#fff4e0', '#d94f9c', '#f08a4b'];
const FEUILLAGES = ['#3f7a3a', '#4d8b3f', '#2f6b35'];

/** Les maisons et les commerces bas reçoivent un toit de tuiles ; tours, campus et chantiers restent à toit plat. */
export function aToitTuiles(kind: string, h: number) {
  return kind === 'maison' || (kind === 'commerce' && h <= 5.5);
}

/** Une teinte assombrie (pied de façade encrassé par les pluies, ombre d'un retrait). */
export function assombrir(couleur: string, facteur: number) {
  const hex = couleur.replace('#', '');
  const plein = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex.padEnd(6, '0').slice(0, 6);
  const canaux = [0, 2, 4].map(i => Math.round(parseInt(plein.slice(i, i + 2), 16) * facteur));
  return `#${canaux.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')}`;
}

/** Data-only shell: all opaque boxes share one draw call per matter, including balconies. */
export function construireArchitecture(w: number, h: number, d: number, kind: string, color: string, devanture: boolean, nuit: boolean, couleurToit = '#c9652f', style: StyleFacade = {}): PlanArchitecture {
  const plan: PlanArchitecture = { solides: [], vitres: [], lumieres: [], fleurs: [] };
  const ajouter = (position: V3, taille: V3, couleur: string, rotation = 0, lot: LotBlocs = 'solides', matiere?: MatiereBloc, forme?: 'cylindre') =>
    plan[lot].push({ position, taille, couleur, rotation, ...(matiere ? { matiere } : {}), ...(forme ? { forme } : {}) });
  if (kind === 'chantier') {
    ajouter([0, .18, 0], [w, .36, d], '#a89980', 0, 'solides', 'beton');
    for (const y of [0, 3.3, 6.6]) {
      ajouter([0, y + .3, 0], [w * .85, .3, d * .8], '#b2b0a7', 0, 'solides', 'beton');
      for (const x of [-1, 1]) for (const z of [-1, 0, 1]) ajouter([x * w * .38, y + 1.8, z * d * .34], [.45, 3, .45], '#aaa99c', 0, 'solides', 'beton');
    }
    ajouter([w / 2 - 1, 7, 0], [.6, 14, .6], '#edb43c', 0, 'solides', 'metal');
    ajouter([w / 2 - 6, 14, 0], [17, .5, .5], '#edb43c', 0, 'solides', 'metal');
    ajouter([-3, 10.5, 0], [.06, 7, .06], '#35434c', 0, 'solides', 'metal');
    for (const x of [-1, 0, 1]) ajouter([x * 3, .7, d / 2 + 2], [2.2, 1.4, 1.4], '#bf744e', 0, 'solides', 'metal');
    return plan;
  }
  const etages = Math.max(1, Math.floor(h / 3));
  const tuiles = aToitTuiles(kind, h);
  // L'attique ne coiffe qu'un toit-terrasse assez haut pour le porter.
  const attique = Boolean(style.attique) && !tuiles && etages >= 3;
  ajouter([0, h / 2, 0], [w, h, d], color);
  // Pied de bâtiment : socle de béton, parvis tout autour et soubassement assombri par les pluies.
  ajouter([0, .22, 0], [w + 1.2, .44, d + 1.2], '#c7c0ad', 0, 'solides', 'beton');
  ajouter([0, .05, 0], [w + 3.4, .06, d + 3.4], '#cfc9bb', 0, 'solides', 'beton');
  ajouter([0, .8, 0], [w + .08, .72, d + .08], assombrir(color, .8));
  // Descentes d'eau pluviale aux quatre angles.
  for (const x of [-1, 1]) for (const z of [-1, 1]) ajouter([x * (w / 2 + .1), (h + .3) / 2, z * (d / 2 + .1)], [.13, h - .3, .13], '#7d847f', 0, 'solides', 'metal');
  const bandeau = style.accent ?? '#e8d9bd';
  for (let f = 0; f < etages; f++) {
    ajouter([0, f * 3 + .35, 0], [w + .6, .24, d + .6], f === 0 ? '#e8d9bd' : bandeau, 0, 'solides', 'beton');
    for (let side = 0; side < 4; side++) {
      if (devanture && side === 0 && f === 0) continue;
      const r = side * Math.PI / 2, span = side % 2 ? d : w, offset = (side % 2 ? w : d) / 2;
      const count = Math.max(2, Math.floor(span / 2.5));
      const pas = span / count;
      const local = (x: number, y: number, z: number, taille: V3, couleur: string, lot: LotBlocs = 'solides', matiere?: MatiereBloc) => {
        ajouter([x * Math.cos(r) + z * Math.sin(r), y, -x * Math.sin(r) + z * Math.cos(r)], taille, couleur, r, lot, matiere);
      };
      for (let k = 0; k < count; k++) {
        const x = (k - (count - 1) / 2) * pas, y = f * 3 + 1.8, z = offset + .05;
        // Claustras de béton en bout de façade principale, à la place de la fenêtre : la grille laisse passer l'air.
        if (style.brise === 'claustras' && side === 0 && count >= 4 && (k === 0 || k === count - 1)) {
          local(x, y, z + .02, [1.6, 2.2, .1], '#2e2b26');
          for (const bx of [-.6, -.2, .2, .6]) local(x + bx, y, z + .1, [.09, 2.2, .16], '#ddd5c4', 'solides', 'beton');
          for (const by of [-.88, -.44, 0, .44, .88]) local(x, y + by, z + .1, [1.6, .09, .16], '#ddd5c4', 'solides', 'beton');
          continue;
        }
        local(x, y, z, [1.6, 2.1, .15], '#e9ddc5');
        const allumee = nuit && (k + f + side) % 3 !== 0;
        local(x, y, z + .09, [1.35, 1.85, .1], allumee ? '#b39360' : '#36515f', allumee ? 'lumieres' : 'vitres');
        local(x, y, z + .16, [.065, 1.85, .05], '#bfc3b8', 'solides', 'metal');
        if (style.brise === 'casquettes') local(x, y + 1.18, z + .32, [1.95, .1, .62], '#ddd5c4', 'solides', 'beton');
        if (style.persiennes && f > 0) for (const cote of [-1, 1]) local(x + cote * 1.06, y, z + .12, [.5, 1.85, .07], style.persiennes, 'solides', 'bois');
        if (style.climatiseurs && (k + f + side) % 3 === 1 && !(side === 0 && f === 0)) {
          local(x + .35, y - 1.38, z + .26, [.82, .5, .3], '#e3e3dc', 'solides', 'metal');
          local(x + .35, y - 1.38, z + .42, [.62, .3, .02], '#8f9592', 'solides', 'metal');
        }
        if (f > 0 && kind !== 'tour') {
          local(x, y - 1.12, z + .47, [1.95, .16, 1.1], '#e8d9bd', 'solides', 'beton');
          local(x, y - .45, z + .95, [1.9, .06, .06], '#35464a', 'solides', 'metal');
          for (const barre of [-.85, 0, .85]) local(x + barre, y - .8, z + .95, [.055, .7, .055], '#35464a', 'solides', 'metal');
        }
      }
    }
  }
  // Lames verticales de métal entre les travées, sur toute la hauteur (au-dessus de la devanture quand il y en a une).
  if (style.brise === 'lames') for (let side = 0; side < 4; side++) {
    const r = side * Math.PI / 2, span = side % 2 ? d : w, offset = (side % 2 ? w : d) / 2;
    const count = Math.max(2, Math.floor(span / 2.5)), bas = devanture && side === 0 ? 3.3 : .6;
    for (let k = 0; k <= count; k++) {
      const x = (k - count / 2) * span / count, z = offset + .34;
      ajouter([x * Math.cos(r) + z * Math.sin(r), (h + bas) / 2, -x * Math.sin(r) + z * Math.cos(r)], [.12, h - bas, .58], '#a9b2b5', r, 'solides', 'metal');
    }
  }
  ajouter([0, h + .1, 0], [w + .8, .3, d + .8], '#e8d9bd', 0, 'solides', 'beton');
  if (tuiles) {
    plan.toit = { largeur: w + 1.6, profondeur: d + 1.6, hauteur: Math.min(3.2, Math.min(w, d) * (kind === 'maison' ? .4 : .34)), y: h + .25, couleur: couleurToit };
    ajouterBacsFleuris(plan, w, d);
  } else {
    ajouter([0, h + .4, 0], [w - .8, .3, d - .8], '#697268', 0, 'solides', 'beton');
    // Locaux techniques, ventilations et acrotères : des silhouettes moins « maquette ».
    const technique: [number, number] = attique ? [w * .32, d * .3] : [w * .25, 0];
    ajouter([technique[0], h + .9, technique[1]], [2, .7, 1.4], '#aeb6ae', 0, 'solides', 'metal');
    for (const x of [-w / 2 + .25, w / 2 - .25]) ajouter([x, h + .65, 0], [.22, .8, d], '#d2c5ad', 0, 'solides', 'beton');
    for (let i = 0; i < 6; i++) ajouter([technique[0] - .8 + i * .32, h + 1.27, technique[1]], [.08, .025, 1.15], '#566164', 0, 'solides', 'metal');
    if (attique) ajouterAttique(plan, w, h, d, color, nuit);
    // Citernes d'eau noires sur leur support métallique, rangées le long du bord arrière.
    for (let i = 0; i < (style.citernes ?? 0); i++) {
      const x = -w / 2 + 1.6 + i * 2, z = -d / 2 + 1.6;
      ajouter([x, h + .85, z], [1.4, .5, 1.4], '#59605e', 0, 'solides', 'metal');
      ajouter([x, h + 1.85, z], [1.2, 1.5, 1.2], '#22272a', 0, 'solides', 'metal', 'cylindre');
    }
  }
  if (!devanture) ajouter([0, 1.25, d / 2 + .18], [2, 2.5, .25], '#233e45', 0, 'solides', 'bois');
  if (style.marquise && !devanture) {
    ajouter([0, 3.02, d / 2 + 1.05], [3.8, .18, 1.9], '#ddd5c4', 0, 'solides', 'beton');
    for (const x of [-1.7, 1.7]) ajouter([x, 1.47, d / 2 + 1.85], [.12, 2.94, .12], '#3d4a4e', 0, 'solides', 'metal');
  }
  if (kind === 'commerce') for (let i = 0; i < 10; i++) ajouter([(i - 4.5) * w / 10, 3.72, d / 2 + .8], [w / 10, .12, 1.4], i % 2 ? '#f6e7c6' : '#355b51');
  if (kind === 'campus') for (const x of [-w * .35, w * .35]) ajouter([x, 1.7, d / 2 + 1], [.6, 3.4, .6], '#e8d9bd', 0, 'solides', 'beton');
  return plan;
}

/** L'étage d'attique, en retrait vers l'arrière : son volume, ses baies vitrées et le garde-corps de la terrasse. */
function ajouterAttique(plan: PlanArchitecture, w: number, h: number, d: number, color: string, nuit: boolean) {
  const lw = w * .56, ld = d * .56, cx = -w * .1, cz = -d * .12, y = h + .25 + 1.4;
  plan.solides.push({ position: [cx, y, cz], taille: [lw, 2.8, ld], couleur: assombrir(color, .92), rotation: 0 });
  plan.solides.push({ position: [cx, h + .25 + 2.86, cz], taille: [lw + .5, .2, ld + .5], couleur: '#e8d9bd', rotation: 0, matiere: 'beton' });
  const baies = Math.max(2, Math.floor(lw / 2.2));
  for (let k = 0; k < baies; k++) {
    const x = cx + (k - (baies - 1) / 2) * lw / baies, allumee = nuit && k % 2 === 0;
    (allumee ? plan.lumieres : plan.vitres).push({ position: [x, y - .1, cz + ld / 2 + .05], taille: [lw / baies - .3, 2.1, .1], couleur: allumee ? '#b39360' : '#36515f', rotation: 0 });
  }
  // Garde-corps de la terrasse, sur les trois côtés dégagés.
  plan.solides.push({ position: [0, h + 1.05, d / 2 - .25], taille: [w - .9, .06, .06], couleur: '#35464a', rotation: 0, matiere: 'metal' });
  for (const x of [-1, 1]) plan.solides.push({ position: [x * (w / 2 - .45), h + 1.05, 0], taille: [.06, .06, d - .9], couleur: '#35464a', rotation: 0, matiere: 'metal' });
}

/** Deux bacs en terre cuite devant l'entrée, garnis de feuillage et de fleurs ; disposition fixe pour un rendu stable. */
function ajouterBacsFleuris(plan: PlanArchitecture, w: number, d: number) {
  const z = d / 2 + 1.35;
  for (const cote of [-1, 1]) {
    const x = cote * Math.max(1.6, w / 2 - 1.4);
    plan.solides.push({ position: [x, .3, z], taille: [2.2, .6, .8], couleur: '#b5653f', rotation: 0 });
    plan.solides.push({ position: [x, .61, z], taille: [2, .04, .62], couleur: '#5a3b2a', rotation: 0 });
    for (let i = 0; i < 4; i++) {
      const fx = x - .75 + i * .5;
      plan.fleurs.push({ position: [fx, .78, z + (i % 2 ? .1 : -.1)], taille: [.5, .42, .5], couleur: FEUILLAGES[(i + (cote > 0 ? 1 : 0)) % FEUILLAGES.length], rotation: 0 });
    }
    for (let i = 0; i < 7; i++) {
      const fx = x - .85 + i * .28;
      plan.fleurs.push({ position: [fx, .98 + (i % 3) * .05, z + ((i * 7) % 5 - 2) * .07], taille: [.2, .18, .2], couleur: COULEURS_FLEURS[(i + (cote > 0 ? 2 : 0)) % COULEURS_FLEURS.length], rotation: 0 });
    }
  }
}
