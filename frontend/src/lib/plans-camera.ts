// Les plans de caméra des moments clés : quand un chapitre du fil rouge est validé, la caméra quitte le joueur, tourne
// autour de l'immeuble du dossier (la Résidence Akwaba, puis Les Rôniers) qui vient de franchir une étape, puis revient.
// Sans Three.js ni React.

type Point = [number, number];
export interface PlanCamera {
  centre: Point;
  /** Hauteur du point regardé (m), rayon et hauteur de la caméra au départ du plan. */
  hauteurCible: number; rayon: number; hauteur: number;
  /** Durée (s), azimut de départ (rad) et part de tour parcourue. */
  duree: number; azimut: number; tour: number;
  titre: string; sousTitre: string;
}

/** Accélère puis ralentit : le plan démarre et s'arrête en douceur. */
export const adoucir = (k: number) => { const t = Math.min(1, Math.max(0, k)); return t * t * (3 - 2 * t); };

/** Position de la caméra et point regardé à l'instant t (s) du plan : un arc autour du centre, qui se rapproche et descend un peu. */
export function positionPlan(plan: PlanCamera, t: number): { camera: [number, number, number]; cible: [number, number, number] } {
  const k = adoucir(t / plan.duree);
  const angle = plan.azimut + plan.tour * Math.PI * 2 * k;
  const rayon = plan.rayon * (1.15 - .2 * k), hauteur = plan.hauteur * (1.2 - .25 * k);
  return {
    camera: [plan.centre[0] + Math.sin(angle) * rayon, hauteur, plan.centre[1] + Math.cos(angle) * rayon],
    cible: [plan.centre[0], plan.hauteurCible, plan.centre[1]],
  };
}

/** Le plan qui salue un chapitre validé : plus haut à mesure que l'immeuble monte, plus long à la livraison. `livraison` :
 * les chapitres validés quand l'ouvrage est livré, si l'histoire continue après (par défaut, le dernier chapitre).
 * `hauteurMax` : le point regardé le plus haut (7 m pour un R+3 ; plus pour un immeuble plus haut, cadré de plus loin). */
export function planChapitre({ centre, chapitres, total, livraison = total, etape, titreChantier, hauteurMax = 7 }: { centre: Point; chapitres: number; total: number; livraison?: number; etape: string; titreChantier: string; hauteurMax?: number }): PlanCamera {
  const livree = chapitres === livraison, recul = hauteurMax / 7;
  return {
    centre, hauteurCible: Math.min(hauteurMax, 1.5 + chapitres * .65 * recul), rayon: (livree ? 34 : 28) * Math.max(1, recul * .9), hauteur: (livree ? 18 : 14) * Math.max(1, recul * .9),
    duree: livree ? 9 : 6.5, azimut: .35, tour: livree ? .55 : .3,
    titre: livree ? `${titreChantier} · livrée !` : `${titreChantier} · chapitre ${chapitres}/${total} validé`,
    sousTitre: etape,
  };
}
