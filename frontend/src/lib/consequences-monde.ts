// Ce que le joueur laisse dans le monde, écrit là où on le voit : ses journées et les ouvrages livrés sur le panneau du
// Grand chantier, sa progression sur l'enseigne de chaque lieu à mentor. Sans Three.js ni React.

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** La ligne du panneau de chantier : l'appel au nouveau venu, puis les journées du joueur et les ouvrages livrés. */
export function contributionAuChantier(nom: string, journees: number, livraisons: number) {
  if (journees <= 0) return 'On recrute : présente-toi à Yao, devant la base vie';
  return `${pluriel(journees, 'journée')} de ${nom}${livraisons > 0 ? ` · ${pluriel(livraisons, 'ouvrage')} livré${livraisons > 1 ? 's' : ''}` : ''}`;
}

/** L'enseigne d'un lieu à mentor : l'étape atteinte du programme, et le cycle en cours une fois le premier bouclé. Rien
 * tant que le joueur n'y a rien réussi. */
export function progressionAuLieu(progres: { etapes: number; cycles: number }, programme: { etapes: readonly unknown[] }) {
  if (progres.etapes <= 0 && progres.cycles <= 0) return undefined;
  return `Étape ${Math.min(progres.etapes, programme.etapes.length)}/${programme.etapes.length}${progres.cycles > 0 ? ` · cycle ${progres.cycles + 1}` : ''}`;
}
