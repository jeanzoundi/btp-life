import type { Meteo } from './meteo-monde';

export interface Pensee { icone: string; texte: string }
export interface ContextePensee { meteo: Meteo; heure: number }

const METIERS: Record<string, Pensee[]> = {
  Awa: [{ icone: '📐', texte: 'Ce plan de façade…' }, { icone: '🏛️', texte: 'Un nouvel équipement ici ?' }],
  Yao: [{ icone: '🏗️', texte: 'Le coulage est demain' }, { icone: '🦺', texte: 'Casque sur la tête !' }],
  Mariam: [{ icone: '📊', texte: 'Le devis est serré' }, { icone: '🤝', texte: 'Un marché à signer' }],
  Koffi: [{ icone: '🧱', texte: 'Livraison de parpaings' }, { icone: '🚚', texte: 'Le camion est en retard' }],
  Fatou: [{ icone: '☕', texte: 'Un café au maquis ?' }, { icone: '🍲', texte: 'Garba ce midi' }],
};

function ambiance({ meteo, heure }: ContextePensee): Pensee | null {
  if (meteo === 'averse' || meteo === 'orage') return { icone: '☔', texte: 'Vite, à l’abri !' };
  if (meteo === 'harmattan') return { icone: '💨', texte: 'Quelle poussière…' };
  if (heure >= 21 || heure < 5) return { icone: '🌙', texte: 'Il se fait tard' };
  if (heure >= 11.5 && heure < 14) return { icone: '🍛', texte: 'C’est l’heure du repas' };
  return null;
}

/** Un besoin critique l'emporte toujours ; sinon une pensée liée au temps qu'il fait ou à l'heure. */
export function penseeJoueur(critique: { icone: string; label: string } | null, contexte: ContextePensee, graine: number): Pensee | null {
  if (critique) return { icone: critique.icone, texte: critique.label };
  const liee = ambiance(contexte);
  if (liee && graine % 2 === 0) return liee;
  return graine % 3 === 0 ? { icone: '🏗️', texte: 'Prochain chantier ?' } : liee ?? { icone: '😊', texte: 'Belle journée' };
}

export function penseePnj(nom: string, contexte: ContextePensee, graine: number): Pensee {
  const liee = ambiance(contexte);
  if (liee && graine % 3 === 0) return liee;
  const metier = METIERS[nom] ?? [{ icone: '💭', texte: 'Hmm…' }];
  return metier[Math.abs(graine) % metier.length];
}
