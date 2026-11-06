export type QualiteMonde = 'auto' | 'elevee' | 'fluide';

/** Le choix fait dans la ville s'applique aussi aux intérieurs et au campus. */
export function qualiteMemorisee(): QualiteMonde {
  try {
    const choix = window.localStorage.getItem('btp-life-qualite');
    if (choix === 'fluide' || choix === 'elevee' || choix === 'auto') return choix;
  } catch { /* Stockage facultatif. */ }
  return 'auto';
}

/** Hysteresis avoids oscillating between resolutions near the same frame rate. `plancher` : la résolution la plus basse
 * permise (1 tant qu'il reste des effets à retirer : une image floue se voit plus qu'un halo en moins). */
export function ajusterResolution(dpr: number, fps: number, plafond: number, plancher = .8) {
  if (!Number.isFinite(fps) || fps <= 0) return dpr;
  const suivant = fps < 38 ? dpr - .15 : fps > 57 ? dpr + .1 : dpr;
  return Math.round(Math.max(Math.min(plancher, plafond), Math.min(plafond, suivant)) * 100) / 100;
}

/** Résolution maximale : celle de l'écran, jusqu'à 2 sur ordinateur et 1,5 sur téléphone (au-delà, le coût grimpe pour un
 * gain que l'œil ne voit plus sur un petit écran). */
export const plafondResolution = (pixelsParPoint: number, petitEcran: boolean) => Math.min(pixelsParPoint || 1, petitEcran ? 1.5 : 2);

export function orienterProgressivement(angle: number, cible: number, delta: number) {
  const ecart = Math.atan2(Math.sin(cible - angle), Math.cos(cible - angle));
  return angle + ecart * (1 - Math.exp(-12 * Math.min(Math.max(delta, 0), .1)));
}

/** Accelerate smoothly; stop at a red signal without stepping beyond its stop line. */
export function avancerTrafic(vitesse: number, distanceStop: number, rouge: boolean, delta: number, maximum = 3) {
  const dt = Math.min(.1, Math.max(0, delta));
  const distance = Math.max(0, distanceStop);
  const cible = rouge ? Math.min(maximum, Math.sqrt(2 * 2.8 * distance)) : maximum;
  const v = vitesse + Math.max(-3.5 * dt, Math.min(1.5 * dt, cible - vitesse));
  const deplacement = Math.min(Math.max(0, v) * dt, rouge ? distance : Infinity);
  return { vitesse: rouge && distance <= .01 ? 0 : Math.max(0, v), deplacement };
}
