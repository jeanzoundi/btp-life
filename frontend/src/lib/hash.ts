// Hash FNV-1a — déterministe et stable : même entrée = même sortie, toujours.
// Sert à assigner une école ou une parcelle de maison à un joueur sans rien stocker
// côté serveur (l'assignation "aléatoire" reste identique à chaque connexion).
export function hashStable(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
