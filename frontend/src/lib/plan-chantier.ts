// Géométrie de l'ouvrage en construction au Grand chantier, phase par phase : une liste de blocs instanciés,
// calculée sans Three.js pour rester testable. Repère local : centre de la parcelle, x vers l'est, z vers le sud.
import type { BlocArchitecture, V3 } from './architecture-ville';
import type { EtatVisuel } from './journee-chantier';

export interface PlanChantier {
  structure: BlocArchitecture[]; echafaudage: BlocArchitecture[]; vitres: BlocArchitecture[];
  /** Hauteur où l'on travaille (crochet de la grue, ouvrier perché). */
  hauteurTravail: number;
}

const LARGEUR = 12, PROFONDEUR = 8, HAUTEUR_NIVEAU = 3.1, NIVEAUX = 2, CENTRE_Z = -.5;
const BETON = '#B7B2A6', PARPAING = '#9E9A91', TERRE = '#6B5843', ACIER = '#8A5A3C', ENDUIT = '#EBDCC0', TUBE = '#8E9BA3', PLANCHE = '#A0774C';
const POTEAUX: [number, number][] = [-1, -1 / 3, 1 / 3, 1].flatMap(x => [-1, 0, 1].map(z => [x * LARGEUR / 2, CENTRE_Z + z * PROFONDEUR / 2] as [number, number]));
const borne = (v: number) => Math.min(1, Math.max(0, v));

export function planChantier(etat: EtatVisuel): PlanChantier {
  const plan: PlanChantier = { structure: [], echafaudage: [], vitres: [], hauteurTravail: 0 };
  const bloc = (liste: BlocArchitecture[], position: V3, taille: V3, couleur: string, rotation = 0) => liste.push({ position, taille, couleur, rotation });
  const t = borne(etat.progression);
  const ordre = ['terrain', 'fondations', 'elevation', 'toiture', 'finitions', 'livre'].indexOf(etat.phase);
  const apres = (phase: number) => ordre > phase;

  // Terrassement : fouille qui s'élargit, chaises d'implantation et cordeaux.
  if (ordre === 0) {
    const s = .45 + .55 * t;
    bloc(plan.structure, [0, .03, CENTRE_Z], [(LARGEUR + 1) * s, .06, (PROFONDEUR + 1) * s], TERRE);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bloc(plan.structure, [x * (LARGEUR / 2 + 1), .4, CENTRE_Z + z * (PROFONDEUR / 2 + 1)], [.07, .8, .07], '#D9A441');
    for (const z of [-1, 1]) bloc(plan.structure, [0, .55, CENTRE_Z + z * (PROFONDEUR / 2 + 1)], [LARGEUR + 2, .02, .02], '#F2EEE4');
    for (const x of [-1, 1]) bloc(plan.structure, [x * (LARGEUR / 2 + 1), .55, CENTRE_Z], [.02, .02, PROFONDEUR + 2], '#F2EEE4');
    bloc(plan.structure, [-LARGEUR / 2 - 2.6, .45, CENTRE_Z + 2], [2.2, .9, 1.6], '#7A6348', .3);
    bloc(plan.structure, [LARGEUR / 2 + 2.4, .35, CENTRE_Z - 2.5], [1.8, .7, 1.4], '#7A6348', -.4);
    plan.hauteurTravail = .5;
    return plan;
  }

  // Fondations : semelles coulées tronçon par tronçon, puis attentes d'acier des poteaux.
  bloc(plan.structure, [0, .03, CENTRE_Z], [LARGEUR + 1, .06, PROFONDEUR + 1], apres(1) ? '#8F8576' : TERRE);
  const troncons = 8, coules = ordre === 1 ? Math.ceil(t * troncons) : troncons;
  for (let i = 0; i < coules; i++) {
    const cote = Math.floor(i / 2), moitie = i % 2 ? 1 : -1;
    const horizontal = cote % 2 === 0, signe = cote < 2 ? -1 : 1;
    if (horizontal) bloc(plan.structure, [moitie * LARGEUR / 4, .25, CENTRE_Z + signe * PROFONDEUR / 2], [LARGEUR / 2, .5, .7], BETON);
    else bloc(plan.structure, [signe * LARGEUR / 2, .25, CENTRE_Z + moitie * PROFONDEUR / 4], [.7, .5, PROFONDEUR / 2], BETON);
  }
  if (ordre === 1) {
    POTEAUX.slice(0, Math.max(2, Math.round(t * POTEAUX.length))).forEach(([x, z]) => {
      bloc(plan.structure, [x, .3, z], [.8, .55, .8], BETON);
      for (const [dx, dz] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]]) bloc(plan.structure, [x + dx, 1.1, z + dz], [.035, 1.2, .035], ACIER);
    });
    plan.hauteurTravail = .6;
    return plan;
  }

  // Élévation : dallage, puis pour chaque niveau poteaux, murs de parpaings qui montent, et dalle au-dessus.
  bloc(plan.structure, [0, .62, CENTRE_Z], [LARGEUR + .4, .25, PROFONDEUR + .4], BETON);
  const avancementNiveaux = ordre === 2 ? t * NIVEAUX : NIVEAUX;
  const finitions = ordre >= 4, livre = ordre >= 5;
  const enduitFait = finitions ? (livre ? 4 : Math.floor(t * 4.999)) : 0;
  for (let n = 0; n < NIVEAUX; n++) {
    const f = borne(avancementNiveaux - n);
    if (f <= 0) break;
    const base = .75 + n * HAUTEUR_NIVEAU;
    for (const [x, z] of POTEAUX) bloc(plan.structure, [x, base + HAUTEUR_NIVEAU * Math.min(1, f * 1.4) / 2, z], [.35, HAUTEUR_NIVEAU * Math.min(1, f * 1.4), .35], BETON);
    const h = HAUTEUR_NIVEAU * f;
    // Façades : 0 sud, 1 est, 2 nord, 3 ouest. Enduites une à une pendant les finitions.
    const faces: { position: V3; taille: V3 }[] = [
      { position: [0, base + h / 2, CENTRE_Z + PROFONDEUR / 2], taille: [LARGEUR, h, .22] },
      { position: [LARGEUR / 2, base + h / 2, CENTRE_Z], taille: [.22, h, PROFONDEUR] },
      { position: [0, base + h / 2, CENTRE_Z - PROFONDEUR / 2], taille: [LARGEUR, h, .22] },
      { position: [-LARGEUR / 2, base + h / 2, CENTRE_Z], taille: [.22, h, PROFONDEUR] },
    ];
    faces.forEach((face, i) => bloc(plan.structure, face.position, face.taille, i < enduitFait ? ENDUIT : PARPAING));
    if (f >= 1) bloc(plan.structure, [0, base + HAUTEUR_NIVEAU + .1, CENTRE_Z], [LARGEUR + .3, .22, PROFONDEUR + .3], BETON);
    // Baies vitrées une fois les murs montés et les menuiseries posées (finitions).
    if (f >= 1 && finitions) for (const x of [-3.6, 0, 3.6]) {
      if (enduitFait >= 1) bloc(plan.vitres, [x, base + 1.6, CENTRE_Z + PROFONDEUR / 2 + .13], [1.6, 1.5, .06], '#3B5664');
      if (enduitFait >= 3) bloc(plan.vitres, [x, base + 1.6, CENTRE_Z - PROFONDEUR / 2 - .13], [1.6, 1.5, .06], '#3B5664');
    }
    plan.hauteurTravail = base + h;
  }

  // Toiture-terrasse à l'ivoirienne : acrotère qui monte, cage d'escalier, puis citerne d'eau.
  if (ordre >= 3) {
    const toit = .75 + NIVEAUX * HAUTEUR_NIVEAU + .2, r = ordre === 3 ? t : 1;
    const hAcrotere = .7 * Math.max(.15, r);
    for (const z of [-1, 1]) bloc(plan.structure, [0, toit + hAcrotere / 2, CENTRE_Z + z * PROFONDEUR / 2], [LARGEUR + .3, hAcrotere, .2], enduitFait >= 2 ? ENDUIT : PARPAING);
    for (const x of [-1, 1]) bloc(plan.structure, [x * LARGEUR / 2, toit + hAcrotere / 2, CENTRE_Z], [.2, hAcrotere, PROFONDEUR + .3], enduitFait >= 2 ? ENDUIT : PARPAING);
    if (r > .5) bloc(plan.structure, [-3.4, toit + 1.25, CENTRE_Z - 1.6], [2.6, 2.5, 2.6], enduitFait >= 4 ? ENDUIT : PARPAING);
    if (r > .85) bloc(plan.structure, [3.4, toit + .75, CENTRE_Z - 1.8], [1.4, 1.5, 1.4], '#2F6E8E');
    plan.hauteurTravail = toit + .7;
  }

  // Échafaudage sur les façades sud et est, retiré au fur et à mesure des enduits ; absent à la livraison.
  if (!livre) {
    const hauteur = Math.min(plan.hauteurTravail + 1.2, .75 + NIVEAUX * HAUTEUR_NIVEAU + 1.4);
    const facades: { axe: 'x' | 'z'; fixe: number; longueur: number; face: number }[] = [
      { axe: 'x', fixe: CENTRE_Z + PROFONDEUR / 2 + 1.1, longueur: LARGEUR + 1.6, face: 0 },
      { axe: 'z', fixe: LARGEUR / 2 + 1.1, longueur: PROFONDEUR + 1.6, face: 1 },
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
