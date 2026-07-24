// Courbe de niveau — source unique de vérité côté frontend, identique au backend
// (progression.service.ts : niveau N nécessite round(100 * (N-1)^2.2) XP cumulés).
// Utilisée par le hub d'accueil ET la topbar HUD pour que les % affichés concordent partout.

export function xpRequisPourNiveau(n: number): number {
  return Math.round(100 * Math.pow(Math.max(0, n - 1), 2.2));
}

export function progressionVersNiveauSuivant(xp: number, niveau: number): { pct: number; restant: number } {
  const bas = xpRequisPourNiveau(niveau);
  const haut = xpRequisPourNiveau(niveau + 1);
  const pct = haut > bas ? Math.min(100, Math.max(0, Math.round(((xp - bas) / (haut - bas)) * 100))) : 100;
  return { pct, restant: Math.max(0, haut - xp) };
}
