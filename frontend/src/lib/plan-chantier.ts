// Géométrie de l'ouvrage en construction au Grand chantier, étape par étape du programme : une liste de blocs
// instanciés, calculée sans Three.js pour rester testable. Repère local : centre de la parcelle, x vers l'est, z vers le sud.
import type { BlocArchitecture, V3 } from './architecture-ville';
import { PROGRAMME, type EtatVisuel } from './programme-chantier';

export interface PlanChantier {
  structure: BlocArchitecture[]; echafaudage: BlocArchitecture[]; vitres: BlocArchitecture[];
  /** Hauteur où l'on travaille (crochet de la grue, ouvrier perché). */
  hauteurTravail: number;
}

export const LARGEUR_OUVRAGE = 12, PROFONDEUR_OUVRAGE = 8, CENTRE_Z_OUVRAGE = -.5;
const LARGEUR = LARGEUR_OUVRAGE, PROFONDEUR = PROFONDEUR_OUVRAGE, CENTRE_Z = CENTRE_Z_OUVRAGE, HAUTEUR_NIVEAU = 3.1, NIVEAUX = 2;
const BETON = '#B7B2A6', PARPAING = '#9E9A91', PLEIN = '#85807A', TERRE = '#5E4A38', DEBLAI = '#8A6A4E', REMBLAI = '#7C6650', ACIER = '#8A5A3C',
  ENDUIT = '#EBDCC0', PEINTURE = '#F1E4C8', TUBE = '#8E9BA3', PLANCHE = '#A0774C', CHAUX = '#F4F1E8', CORDEAU = '#F2EEE4', BOIS = '#B88A56', HERBE = '#6E8B4A';
const hx = LARGEUR / 2, hz = PROFONDEUR / 2;
const POTEAUX: [number, number][] = [-1, -1 / 3, 1 / 3, 1].flatMap(x => [-1, 0, 1].map(z => [x * hx, CENTRE_Z + z * hz] as [number, number]));
/** Tracé des semelles filantes : le périmètre et le refend longitudinal. */
export const TRANCHEES: readonly { a: [number, number]; b: [number, number] }[] = [
  { a: [-hx, CENTRE_Z + hz], b: [hx, CENTRE_Z + hz] },
  { a: [hx, CENTRE_Z - hz], b: [hx, CENTRE_Z + hz] },
  { a: [-hx, CENTRE_Z - hz], b: [hx, CENTRE_Z - hz] },
  { a: [-hx, CENTRE_Z - hz], b: [-hx, CENTRE_Z + hz] },
  { a: [-hx, CENTRE_Z], b: [hx, CENTRE_Z] },
];
const borne = (v: number) => Math.min(1, Math.max(0, v));
const ORDRE = [...PROGRAMME.map(e => e.id), 'livre'] as const;

export function planChantier(etat: EtatVisuel): PlanChantier {
  const plan: PlanChantier = { structure: [], echafaudage: [], vitres: [], hauteurTravail: .4 };
  const bloc = (liste: BlocArchitecture[], position: V3, taille: V3, couleur: string, rotation = 0) => liste.push({ position, taille, couleur, rotation });
  const t = borne(etat.progression);
  const ordre = ORDRE.indexOf(etat.etape);
  const etape = (id: (typeof ORDRE)[number]) => ORDRE.indexOf(id);
  /** Part réalisée d'une étape : 0 avant, t pendant, 1 après. */
  const fait = (id: (typeof ORDRE)[number]) => ordre > etape(id) ? 1 : ordre === etape(id) ? t : 0;
  /** Un tronçon de tranchée, coupé à la fraction `f` de sa longueur. */
  const troncon = (liste: BlocArchitecture[], { a, b }: (typeof TRANCHEES)[number], f: number, y: number, h: number, l: number, couleur: string) => {
    if (f <= 0) return;
    const x = a[0] + (b[0] - a[0]) * f / 2, z = a[1] + (b[1] - a[1]) * f / 2, longueur = Math.hypot(b[0] - a[0], b[1] - a[1]) * f;
    const horizontal = a[1] === b[1];
    bloc(liste, [x, y + h / 2, z], horizontal ? [longueur + l, h, l] : [l, h, longueur + l], couleur);
  };
  /** Chaque tranchée se creuse, se ferraille ou se coule l'une après l'autre au fil de l'étape. */
  const parTranchee = (f: number, dessiner: (tr: (typeof TRANCHEES)[number], part: number) => void) =>
    TRANCHEES.forEach((tr, i) => dessiner(tr, borne(f * TRANCHEES.length - i)));

  // Terrain : herbes folles tant que rien n'a commencé, puis parcelle décapée.
  if (ordre === 0) for (const [x, z] of [[-4, 2], [3, -3], [5.5, 2.5], [-6, -3.5], [0, -1], [-2, 3.5]] as const) bloc(plan.structure, [x, .12, z], [.9, .24, .7], HERBE, x);
  else bloc(plan.structure, [0, .02, CENTRE_Z], [LARGEUR + 3, .04, PROFONDEUR + 3], fait('soubassement') >= 1 ? '#8F8576' : '#7C654C');

  // Implantation : chaises d'angle, cordeaux tendus entre elles, piquets des poteaux et traits de chaux.
  const implantation = fait('implantation');
  if (implantation > 0 && ordre < etape('elevation')) {
    const angles = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
    angles.slice(0, Math.max(1, Math.ceil(implantation * 4))).forEach(([sx, sz]) => {
      const x = sx * (hx + 1.4), z = CENTRE_Z + sz * (hz + 1.4);
      for (const [dx, dz] of [[0, 0], [-sx * 1.1, 0], [0, -sz * 1.1]]) bloc(plan.structure, [x + dx, .5, z + dz], [.08, 1, .08], BOIS);
      bloc(plan.structure, [x - sx * .55, .85, z], [1.2, .14, .04], BOIS);
      bloc(plan.structure, [x, .85, z - sz * .55], [.04, .14, 1.2], BOIS);
    });
    if (implantation >= .5) {
      for (const z of [-1, 0, 1]) bloc(plan.structure, [0, .86, CENTRE_Z + z * hz], [LARGEUR + 2.8, .015, .015], CORDEAU);
      for (const x of [-1, 1]) bloc(plan.structure, [x * hx, .86, CENTRE_Z], [.015, .015, PROFONDEUR + 2.8], CORDEAU);
    }
    if (implantation >= 1 && fait('fouilles') < 1) {
      for (const [x, z] of POTEAUX) bloc(plan.structure, [x, .25, z], [.06, .5, .06], '#D9A441');
      TRANCHEES.forEach(tr => troncon(plan.structure, tr, 1, .04, .012, .7, CHAUX));
    }
    plan.hauteurTravail = .6;
  }

  // Fouilles : les tranchées se creusent une à une, les déblais montent à distance du bord.
  const fouilles = fait('fouilles');
  if (fouilles > 0 && ordre <= etape('soubassement')) {
    parTranchee(fouilles, (tr, part) => troncon(plan.structure, tr, part, .04, .015, .85, TERRE));
    const tas = ordre === etape('soubassement') ? 1 - t : borne(fouilles);
    // Au nord de l'ouvrage, à plus d'un mètre du bord des fouilles.
    if (tas > 0) for (const [x, z, r] of [[-3.2, CENTRE_Z - hz - 1.7, 1.5], [3.4, CENTRE_Z - hz - 1.7, 1.5]] as const) {
      for (let k = 0; k < 3; k++) bloc(plan.structure, [x, .2 * tas + k * .32 * tas, z], [r * (1 - k * .28) * 2, .4 * tas, r * (1 - k * .28) * 1.3], DEBLAI, .2 + k * .15);
    }
    plan.hauteurTravail = .4;
  }

  // Semelles : béton de propreté, cages d'armatures, puis béton coulé tranchée par tranchée et attentes des poteaux.
  const semelles = fait('semelles');
  if (semelles > 0 && ordre <= etape('soubassement')) {
    TRANCHEES.forEach(tr => troncon(plan.structure, tr, 1, .055, .02, .8, '#C9C4B8'));
    parTranchee(semelles, (tr, part) => {
      troncon(plan.structure, tr, part, .07, .28, .7, BETON);
      if (part < 1) for (const decalage of [-.18, .18]) {
        const decale = tr.a[1] === tr.b[1] ? { a: [tr.a[0], tr.a[1] + decalage] as [number, number], b: [tr.b[0], tr.b[1] + decalage] as [number, number] } : { a: [tr.a[0] + decalage, tr.a[1]] as [number, number], b: [tr.b[0] + decalage, tr.b[1]] as [number, number] };
        troncon(plan.structure, decale, 1, .22, .03, .03, ACIER);
      }
    });
    if (semelles >= .5) for (const [x, z] of POTEAUX) for (const [dx, dz] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]]) bloc(plan.structure, [x + dx, .8, z + dz], [.035, 1.4, .035], ACIER);
    plan.hauteurTravail = .5;
  }

  // Soubassement : murs en agglos pleins sur les semelles, remblai compacté, puis dallage.
  const soubassement = fait('soubassement');
  if (soubassement > 0) {
    TRANCHEES.forEach(tr => troncon(plan.structure, tr, 1, .05, .6 * Math.min(1, soubassement * 1.6), .22, PLEIN));
    if (soubassement >= .6) bloc(plan.structure, [0, .3, CENTRE_Z], [LARGEUR - .3, .5, PROFONDEUR - .3], REMBLAI);
    if (soubassement >= 1) bloc(plan.structure, [0, .62, CENTRE_Z], [LARGEUR + .4, .25, PROFONDEUR + .4], BETON);
    plan.hauteurTravail = .8;
  }

  // Murs, niveau par niveau : poteaux, agglos qui montent, chaînage en tête.
  const peinture = fait('reception') >= 1 || etat.etape === 'livre';
  const finitions = fait('finitions');
  const enduitFait = Math.floor(finitions * 4.999);
  // Indice de façade (0 sud, 1 est, 2 nord, 3 ouest), pour colorer le chaînage comme le mur qu'il couronne.
  const i0 = (face: { position: V3 }) => face.position[2] > CENTRE_Z + 1 ? 0 : face.position[0] > 1 ? 1 : face.position[2] < CENTRE_Z - 1 ? 2 : 3;
  const murs = (n: number, f: number) => {
    if (f <= 0) return;
    const base = .75 + n * HAUTEUR_NIVEAU, h = HAUTEUR_NIVEAU * f;
    for (const [x, z] of POTEAUX) bloc(plan.structure, [x, base + Math.min(HAUTEUR_NIVEAU, h + .4) / 2, z], [.32, Math.min(HAUTEUR_NIVEAU, h + .4), .32], BETON);
    const faces: { position: V3; taille: V3 }[] = [
      { position: [0, base + h / 2, CENTRE_Z + hz], taille: [LARGEUR, h, .22] },
      { position: [hx, base + h / 2, CENTRE_Z], taille: [.22, h, PROFONDEUR] },
      { position: [0, base + h / 2, CENTRE_Z - hz], taille: [LARGEUR, h, .22] },
      { position: [-hx, base + h / 2, CENTRE_Z], taille: [.22, h, PROFONDEUR] },
    ];
    faces.forEach((face, i) => bloc(plan.structure, face.position, face.taille, i < enduitFait ? (peinture ? PEINTURE : ENDUIT) : PARPAING));
    if (f >= 1) for (const face of faces) bloc(plan.structure, [face.position[0], base + HAUTEUR_NIVEAU - .1, face.position[2]], [face.taille[0] + .02, .2, face.taille[2] + .02], i0(face) < enduitFait ? (peinture ? PEINTURE : ENDUIT) : BETON);
    if (f >= 1 && finitions > 0) for (const x of [-3.6, 0, 3.6]) {
      if (enduitFait >= 1) bloc(plan.vitres, [x, base + 1.6, CENTRE_Z + hz + .13], [1.6, 1.5, .06], '#3B5664');
      if (enduitFait >= 3) bloc(plan.vitres, [x, base + 1.6, CENTRE_Z - hz - .13], [1.6, 1.5, .06], '#3B5664');
    }
    plan.hauteurTravail = base + h;
  };
  murs(0, fait('elevation'));

  // Dalle du plancher haut : étais et coffrage, aciers, puis béton coulé. Les étais restent jusqu'au décoffrage.
  const dalle = fait('dalle');
  if (dalle > 0) {
    const sousFace = .75 + HAUTEUR_NIVEAU;
    if (fait('etage') < 1) for (let x = -hx + 1; x < hx; x += 1.5) for (let z = CENTRE_Z - hz + 1; z < CENTRE_Z + hz; z += 1.5) bloc(plan.structure, [x, .75 + HAUTEUR_NIVEAU / 2, z], [.06, HAUTEUR_NIVEAU, .06], '#C9A13B');
    bloc(plan.structure, [0, sousFace + .03, CENTRE_Z], [LARGEUR + .3, .06, PROFONDEUR + .3], PLANCHE);
    if (dalle < 1) for (let x = -hx; x <= hx; x += .8) bloc(plan.structure, [x, sousFace + .14, CENTRE_Z], [.03, .03, PROFONDEUR], ACIER);
    else bloc(plan.structure, [0, sousFace + .12, CENTRE_Z], [LARGEUR + .3, .22, PROFONDEUR + .3], BETON);
    plan.hauteurTravail = sousFace + .3;
  }

  // Étage : mêmes murs, montés depuis l'échafaudage.
  murs(1, fait('etage'));

  // Toiture-terrasse : dalle haute, acrotère, cage d'escalier, puis citerne d'eau.
  const toiture = fait('toiture');
  if (toiture > 0) {
    const toit = .75 + NIVEAUX * HAUTEUR_NIVEAU;
    bloc(plan.structure, [0, toit + .1, CENTRE_Z], [LARGEUR + .3, .22, PROFONDEUR + .3], BETON);
    const hAcrotere = .7 * Math.max(.2, toiture), couleur = enduitFait >= 2 ? (peinture ? PEINTURE : ENDUIT) : PARPAING;
    for (const z of [-1, 1]) bloc(plan.structure, [0, toit + .2 + hAcrotere / 2, CENTRE_Z + z * hz], [LARGEUR + .3, hAcrotere, .2], couleur);
    for (const x of [-1, 1]) bloc(plan.structure, [x * hx, toit + .2 + hAcrotere / 2, CENTRE_Z], [.2, hAcrotere, PROFONDEUR + .3], couleur);
    bloc(plan.structure, [-3.4, toit + 1.35, CENTRE_Z - 1.6], [2.6, 2.5, 2.6], enduitFait >= 4 ? (peinture ? PEINTURE : ENDUIT) : PARPAING);
    if (toiture >= 1) bloc(plan.structure, [3.4, toit + .95, CENTRE_Z - 1.8], [1.4, 1.5, 1.4], '#2F6E8E');
    plan.hauteurTravail = toit + .8;
  }

  // Échafaudage sur les façades sud et est pendant les murs et les finitions, retiré au fil des enduits.
  const echafaudage = ordre >= etape('elevation') && ordre <= etape('finitions');
  if (echafaudage) {
    const hauteur = Math.min(plan.hauteurTravail + 1.2, .75 + NIVEAUX * HAUTEUR_NIVEAU + 1.4);
    const facades: { axe: 'x' | 'z'; fixe: number; longueur: number; face: number }[] = [
      { axe: 'x', fixe: CENTRE_Z + hz + 1.1, longueur: LARGEUR + 1.6, face: 0 },
      { axe: 'z', fixe: hx + 1.1, longueur: PROFONDEUR + 1.6, face: 1 },
    ];
    for (const facade of facades) {
      if (facade.face < enduitFait) continue;
      const pas = 2.2, n = Math.floor(facade.longueur / pas);
      for (let i = 0; i <= n; i++) {
        const u = -facade.longueur / 2 + i * facade.longueur / n;
        for (const decalage of [0, .9]) {
          const p: V3 = facade.axe === 'x' ? [u, hauteur / 2, facade.fixe + decalage] : [facade.fixe + decalage, hauteur / 2, CENTRE_Z + u];
          bloc(plan.echafaudage, p, [.06, hauteur, .06], TUBE);
        }
      }
      for (let y = 1.6; y < hauteur; y += 1.55) {
        for (const decalage of [0, .9]) {
          const p: V3 = facade.axe === 'x' ? [0, y, facade.fixe + decalage] : [facade.fixe + decalage, y, CENTRE_Z];
          bloc(plan.echafaudage, p, facade.axe === 'x' ? [facade.longueur, .05, .05] : [.05, .05, facade.longueur], TUBE);
        }
        const plancher: V3 = facade.axe === 'x' ? [0, y - .05, facade.fixe + .45] : [facade.fixe + .45, y - .05, CENTRE_Z];
        bloc(plan.echafaudage, plancher, facade.axe === 'x' ? [facade.longueur, .05, .85] : [.85, .05, facade.longueur], PLANCHE);
      }
    }
  }
  return plan;
}
