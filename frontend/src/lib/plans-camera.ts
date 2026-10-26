// Les plans de caméra des moments clés : quand un chapitre du fil rouge est validé, la caméra quitte le joueur, tourne
// autour de la Résidence Akwaba qui vient de franchir une étape, puis revient. Sans Three.js ni React.

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

/** Le plan qui salue un chapitre validé : plus haut à mesure que l'immeuble monte, plus long à la livraison. */
export function planChapitre({ centre, chapitres, total, etape, titreChantier }: { centre: Point; chapitres: number; total: number; etape: string; titreChantier: string }): PlanCamera {
  const livraison = chapitres >= total;
  return {
    centre, hauteurCible: Math.min(7, 1.5 + chapitres * .65), rayon: livraison ? 34 : 28, hauteur: livraison ? 18 : 14,
    duree: livraison ? 9 : 6.5, azimut: .35, tour: livraison ? .55 : .3,
    titre: livraison ? `${titreChantier} · livrée !` : `${titreChantier} · chapitre ${chapitres}/${total} validé`,
    sousTitre: etape,
  };
}
