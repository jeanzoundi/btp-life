// Géométrie isométrique partagée par tous les rendus du quartier (bâtiments, maisons) —
// module neutre pour éviter tout import circulaire entre les composants qui l'utilisent.

// Vecteurs isométriques 2:1 — droite = (1, 0.5), gauche = (-1, 0.5)
export function pt(x: number, y: number) {
  return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
}

/** Les trois faces d'un prisme isométrique : O = coin arrière du toit. */
export function facesIso(ox: number, oy: number, w: number, d: number, h: number) {
  const R = { x: ox + w, y: oy + w * 0.5 };
  const L = { x: ox - d, y: oy + d * 0.5 };
  const F = { x: ox + w - d, y: oy + (w + d) * 0.5 };
  return {
    top: `${pt(ox, oy)} ${pt(R.x, R.y)} ${pt(F.x, F.y)} ${pt(L.x, L.y)}`,
    droite: `${pt(R.x, R.y)} ${pt(F.x, F.y)} ${pt(F.x, F.y + h)} ${pt(R.x, R.y + h)}`,
    gauche: `${pt(L.x, L.y)} ${pt(F.x, F.y)} ${pt(F.x, F.y + h)} ${pt(L.x, L.y + h)}`,
    F,
    R,
    L,
  };
}

export function assombrir(hex: string, facteur: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * facteur);
  const g = Math.round(((n >> 8) & 255) * facteur);
  const b = Math.round((n & 255) * facteur);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
