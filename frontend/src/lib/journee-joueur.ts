// La journée du joueur, vue de chez lui au réveil : où l'attend chaque programme, à quelle heure, et ce que
// ses besoins lui conseillent. Sans React : la résidence l'affiche, les tests la vérifient.
import { LIEUX_MONDE } from './liens-modes';
import { LIEUX_PROGRAMME } from './lieux-programme';

export interface RendezVous { slug: string; nom: string; ouverture: number; fermeture: number; titre: string; detail: string }

/** Les rendez-vous du jour : le chantier de Yao d'abord quand une journée l'attend, puis chaque lieu à programme
 * avec l'étape qui attend, dans l'ordre des ouvertures. */
export function programmeDuJour(progresDe: (slug: string) => { etapes: number; cycles: number }, journeeChantier: boolean): RendezVous[] {
  const lieux = Object.entries(LIEUX_PROGRAMME).map(([slug, { programme }]): RendezVous => {
    const total = programme.etapes.length, faites = Math.min(progresDe(slug).etapes, total - 1);
    return {
      slug, nom: LIEUX_MONDE[slug]?.nom ?? programme.titre, ouverture: programme.horaires.ouverture, fermeture: programme.horaires.fermeture,
      titre: programme.etapes[faites].nom, detail: `${programme.titre} · étape ${faites + 1}/${total}`,
    };
  }).sort((a, b) => a.ouverture - b.ouverture || a.nom.localeCompare(b.nom));
  const chantier: RendezVous[] = journeeChantier ? [{ slug: 'chantier', nom: 'Grand chantier', ouverture: 6, fermeture: 18, titre: 'Journée de travail avec Yao', detail: 'Le chantier ouvre à 6 h' }] : [];
  return [...chantier, ...lieux];
}

/** Ce que les besoins conseillent pour bien commencer : se doucher (chez soi, sans quitter l'appartement), où manger,
 * voir du monde, se changer les idées. */
export function conseilsDuMatin(besoins: { faim: number; social: number; moral: number; hygiene: number; divertissement: number }): { texte: string; slug?: string }[] {
  const conseils: { texte: string; slug?: string }[] = [];
  if (besoins.hygiene < 50) conseils.push({ texte: 'Pas très frais après la nuit : la douche t’attend dans la salle d’eau.' });
  if (besoins.faim < 50) conseils.push({ texte: 'Ventre creux : un café-croissant au Café des Bâtisseurs dès 7 h, ou le garba du maquis à midi.', slug: 'cafe' });
  if (besoins.social < 40) conseils.push({ texte: 'Envie de voir du monde : le match à cinq au complexe sportif, ou la table du réseau au café.', slug: 'sports' });
  if (besoins.divertissement < 40) conseils.push({ texte: 'Besoin de te changer les idées : la télé ce soir, ou la pirogue à la marina.', slug: 'marina' });
  else if (besoins.moral < 45) conseils.push({ texte: 'Moral en berne : un tour de lagune en pirogue à la marina remet les idées en place.', slug: 'marina' });
  return conseils;
}

/** Dormir la nuit fait passer le temps jusqu'au matin ; une sieste en journée repose sans sauter d'heures. */
export const dormirJusquAuMatin = (heure: number) => heure >= 19 || heure < 6;
export const HEURE_REVEIL = 6.5;
