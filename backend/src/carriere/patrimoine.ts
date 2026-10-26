// Le patrimoine du joueur : son logement (un loyer chaque semaine, un logement plus grand qui repose mieux), son outillage
// (des achats qui rendent le travail plus efficace) et les travaux qu'il fait chez lui (métré, matériaux, journées de travaux). Catalogues et effets en un seul endroit, sans dépendance : les services
// de carrière appliquent les effets, le module monde vend, loue et prélève (frontend/src/lib/patrimoine.ts reprend les chiffres).

export type NiveauLogement = 'studio' | 'f2' | 'villa';
export interface Logement { nom: string; loyerSemaine: number; confort: number; description: string }
export const LOGEMENTS: Record<NiveauLogement, Logement> = {
  studio: { nom: 'Studio à la Résidence Lagune', loyerSemaine: 12_000, confort: 0, description: 'Une pièce, une kitchenette et une douche : de quoi démarrer.' },
  f2: { nom: 'Deux-pièces avec balcon', loyerSemaine: 25_000, confort: 4, description: 'Une chambre à part et un balcon sur la lagune : +4 de moral à chaque réveil.' },
  villa: { nom: 'Villa des Jardins', loyerSemaine: 55_000, confort: 10, description: 'Jardin, terrasse et calme : +10 de moral à chaque réveil.' },
};
export const NIVEAUX_LOGEMENT = Object.keys(LOGEMENTS) as NiveauLogement[];

export interface Outil { nom: string; prix: number; description: string; lieux?: readonly string[]; xp?: number; fatigue?: number }
export const OUTILS: Record<string, Outil> = {
  'metre-laser': { nom: 'Mètre laser', prix: 18_000, lieux: ['fournisseur', 'bureau-etudes'], xp: .08, description: 'Des métrés justes du premier coup : +8 % d’XP au dépôt et à la Maison des ingénieurs.' },
  'epi-complet': { nom: 'EPI haut de gamme', prix: 25_000, fatigue: .85, description: 'Casque ventilé, chaussures légères et gants : 15 % de fatigue en moins au travail.' },
  'niveau-laser': { nom: 'Niveau laser rotatif', prix: 45_000, lieux: ['construction-nord', 'laboratoire'], xp: .1, description: 'Implantations et aplombs précis : +10 % d’XP au Chantier du Plateau et au laboratoire.' },
  'tablette-chantier': { nom: 'Tablette de chantier', prix: 60_000, lieux: ['mairie', 'banque', 'agence'], xp: .08, description: 'Dossiers et suivis toujours à portée : +8 % d’XP à l’hôtel de ville, à la banque et à l’agence.' },
  'ordinateur-bim': { nom: 'Ordinateur portable et logiciels', prix: 120_000, lieux: ['atelier', 'bureau-etudes', 'entreprise'], xp: .1, description: 'Plans, devis et maquette numérique : +10 % d’XP à l’atelier, à la Maison des ingénieurs et à la Tour BTP Life.' },
};

export interface Renovation {
  nom: string; description: string; logements: readonly NiveauLogement[];
  /** Moral en plus à chaque réveil dans ce logement, une fois les travaux finis ; journées de travaux ; XP à la fin. */
  confort: number; journees: number; xp: number;
  /** Le métré à faire avant de commander : les cotes relevées, la grandeur cherchée et sa tolérance. */
  metre: { question: string; cotes: ReadonlyArray<readonly [string, string]>; unite: string; reponse: number; tolerance: number; explication: string };
  /** Le devis du dépôt, quantités tirées du métré (chutes et casse comprises). */
  materiaux: ReadonlyArray<{ nom: string; quantite: number; unite: string; prixUnitaire: number }>;
}
/** Les travaux possibles chez soi, du studio à la villa (frontend/src/lib/patrimoine.ts reprend les chiffres). */
export const RENOVATIONS: Record<string, Renovation> = {
  'peinture-sejour': {
    nom: 'Repeindre le séjour', description: 'Reboucher, poncer et passer deux couches de peinture vinylique.', logements: ['studio', 'f2', 'villa'], confort: 2, journees: 2, xp: 40,
    metre: { question: 'Surface de murs à peindre', unite: 'm²', reponse: 40.41, tolerance: 1,
      cotes: [['Pièce', '4,50 m × 3,60 m'], ['Hauteur sous plafond', '2,70 m'], ['Porte', '0,90 m × 2,10 m'], ['Fenêtre', '1,20 m × 1,20 m']],
      explication: 'Périmètre 2 × (4,50 + 3,60) = 16,20 m, fois 2,70 m = 43,74 m², moins la porte (1,89 m²) et la fenêtre (1,44 m²) : 40,41 m².' },
    materiaux: [{ nom: 'Peinture vinylique, seau de 10 L (deux couches à 10 m² par litre)', quantite: 1, unite: 'seau', prixUnitaire: 16_000 }, { nom: 'Enduit de rebouchage', quantite: 1, unite: 'sac', prixUnitaire: 3_000 }, { nom: 'Rouleau, bac et bâche', quantite: 1, unite: 'lot', prixUnitaire: 4_500 }],
  },
  'carrelage-douche': {
    nom: 'Carreler la salle d’eau', description: 'Déposer l’ancien revêtement et poser un grès cérame antidérapant.', logements: ['studio', 'f2', 'villa'], confort: 3, journees: 3, xp: 60,
    metre: { question: 'Surface de sol à carreler', unite: 'm²', reponse: 4.32, tolerance: .1,
      cotes: [['Salle d’eau', '2,40 m × 1,80 m']],
      explication: '2,40 × 1,80 = 4,32 m² ; on commande 10 % de plus pour les coupes, soit 5 m².' },
    materiaux: [{ nom: 'Carrelage grès cérame (4,32 m² + 10 % de coupes)', quantite: 5, unite: 'm²', prixUnitaire: 7_500 }, { nom: 'Mortier-colle, sac de 25 kg', quantite: 2, unite: 'sac', prixUnitaire: 6_500 }, { nom: 'Joint hydrofuge', quantite: 1, unite: 'sac', prixUnitaire: 3_500 }],
  },
  'cloison-bureau': {
    nom: 'Monter une cloison pour un bureau', description: 'Isoler un coin bureau avec une cloison en agglos de 10, enduite des deux côtés.', logements: ['f2', 'villa'], confort: 3, journees: 3, xp: 70,
    metre: { question: 'Nombre d’agglos à commander, 5 % de casse comprise', unite: 'agglos', reponse: 114, tolerance: 3,
      cotes: [['Cloison', '3,20 m × 2,70 m'], ['Agglos au m², joints compris', '12,5'], ['Casse', '5 %']],
      explication: '3,20 × 2,70 = 8,64 m², à 12,5 agglos par m² : 108 agglos, plus 5 % de casse : 114.' },
    materiaux: [{ nom: 'Agglos de 10', quantite: 114, unite: 'agglo', prixUnitaire: 350 }, { nom: 'Ciment CPJ 42,5, sac de 50 kg', quantite: 3, unite: 'sac', prixUnitaire: 5_200 }, { nom: 'Sable de rivière', quantite: .3, unite: 'm³', prixUnitaire: 12_000 }],
  },
  'terrasse-villa': {
    nom: 'Couler une dalle de terrasse', description: 'Coffrer, ferrailler et couler une dalle de 12 cm au jardin.', logements: ['villa'], confort: 4, journees: 4, xp: 100,
    metre: { question: 'Volume de béton à couler', unite: 'm³', reponse: 2.4, tolerance: .1,
      cotes: [['Dalle', '5,00 m × 4,00 m'], ['Épaisseur', '12 cm']],
      explication: '5,00 × 4,00 × 0,12 = 2,40 m³. Dosé à 350 kg/m³, il faut 840 kg de ciment, soit 17 sacs.' },
    materiaux: [{ nom: 'Ciment CPJ 42,5, sac de 50 kg (350 kg/m³)', quantite: 17, unite: 'sac', prixUnitaire: 5_200 }, { nom: 'Sable de rivière', quantite: 1, unite: 'm³', prixUnitaire: 12_000 }, { nom: 'Gravier concassé', quantite: 2, unite: 'm³', prixUnitaire: 15_000 }, { nom: 'Treillis soudé, panneau', quantite: 4, unite: 'panneau', prixUnitaire: 9_500 }],
  },
};
/** Le devis des matériaux d'une rénovation. */
export const coutMateriaux = (r: Pick<Renovation, 'materiaux'>) => Math.round(r.materiaux.reduce((s, m) => s + m.quantite * m.prixUnitaire, 0));
/** Une journée de travaux par journée du monde (24 minutes) : vingt minutes au moins entre deux, et de l'énergie. */
export const INTERVALLE_JOURNEE_TRAVAUX_MS = 20 * 60_000;
export const ENERGIE_JOURNEE_TRAVAUX = 20;
/** Après trois métrés faux, la correction est donnée et la commande se fait sur les bonnes quantités. */
export const ESSAIS_METRE = 3;
const ETAPES_CHANTIER = ['metre', 'materiaux', 'travaux'] as const;
export interface ChantierMaison { slug: string; logement: NiveauLogement; etape: (typeof ETAPES_CHANTIER)[number]; essais: number; journees: number; derniereJourneeLe: string | null }

export const SEMAINE_MS = 7 * 86_400_000;
export interface Patrimoine {
  logement: { niveau: NiveauLogement; payeJusquau: string; arrieres: number }; outils: string[];
  chantier: ChantierMaison | null;
  /** Les travaux finis, logement par logement (un déménagement repart d'un logement à refaire). */
  renovations: Array<{ slug: string; logement: NiveauLogement }>;
}

function lireChantier(brut: unknown): ChantierMaison | null {
  const c = (brut && typeof brut === 'object' ? brut : null) as Record<string, unknown> | null;
  if (!c || typeof c.slug !== 'string' || !Object.prototype.hasOwnProperty.call(RENOVATIONS, c.slug)) return null;
  if (!NIVEAUX_LOGEMENT.includes(c.logement as NiveauLogement) || !ETAPES_CHANTIER.includes(c.etape as ChantierMaison['etape'])) return null;
  const borne = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return {
    slug: c.slug, logement: c.logement as NiveauLogement, etape: c.etape as ChantierMaison['etape'],
    essais: borne(c.essais, ESSAIS_METRE), journees: borne(c.journees, RENOVATIONS[c.slug].journees),
    derniereJourneeLe: typeof c.derniereJourneeLe === 'string' && Number.isFinite(Date.parse(c.derniereJourneeLe)) ? c.derniereJourneeLe : null,
  };
}

/** Lecture bornée : un patrimoine absent démarre au studio, sa première semaine comprise. */
export function lirePatrimoine(brut: unknown, maintenant: Date): Patrimoine {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const l = (c.logement && typeof c.logement === 'object' ? c.logement : {}) as Record<string, unknown>;
  const niveau = NIVEAUX_LOGEMENT.includes(l.niveau as NiveauLogement) ? l.niveau as NiveauLogement : 'studio';
  const paye = typeof l.payeJusquau === 'string' && Number.isFinite(Date.parse(l.payeJusquau)) ? l.payeJusquau : new Date(maintenant.getTime() + SEMAINE_MS).toISOString();
  const arrieres = Math.max(0, Math.min(10_000_000, Math.round(Number(l.arrieres) || 0)));
  const outils = Array.isArray(c.outils) ? [...new Set(c.outils.filter((o): o is string => typeof o === 'string' && o in OUTILS))] : [];
  const renovations = Array.isArray(c.renovations) ? c.renovations.flatMap((r: unknown) => {
    const x = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
    return typeof x.slug === 'string' && Object.prototype.hasOwnProperty.call(RENOVATIONS, x.slug) && NIVEAUX_LOGEMENT.includes(x.logement as NiveauLogement)
      ? [{ slug: x.slug, logement: x.logement as NiveauLogement }] : [];
  }).filter((r, i, liste) => liste.findIndex(a => a.slug === r.slug && a.logement === r.logement) === i) : [];
  return { logement: { niveau, payeJusquau: paye, arrieres }, outils, chantier: lireChantier(c.chantier), renovations };
}

/** XP en plus dans un lieu grâce aux outils possédés (les bonus se multiplient). */
export const facteurXpOutils = (outils: readonly string[], slug: string) =>
  outils.reduce((f, o) => OUTILS[o]?.lieux?.includes(slug) ? f * (1 + (OUTILS[o].xp ?? 0)) : f, 1);
/** Fatigue du travail, réduite par l'équipement. */
export const facteurFatigueOutils = (outils: readonly string[]) => outils.reduce((f, o) => f * (OUTILS[o]?.fatigue ?? 1), 1);
/** Moral en plus au réveil : le confort du logement et celui des travaux qu'on y a faits. */
export const confortLogement = (patrimoine: Pick<Patrimoine, 'logement'> & Partial<Pick<Patrimoine, 'renovations'>>) =>
  LOGEMENTS[patrimoine.logement.niveau].confort
  + (patrimoine.renovations ?? []).filter(r => r.logement === patrimoine.logement.niveau).reduce((s, r) => s + (RENOVATIONS[r.slug]?.confort ?? 0), 0);

/** Le loyer dû depuis la fin de la période payée : prélevé semaine par semaine tant que le solde suffit, le reste en
 * arriérés (huit semaines au plus d'un coup, pour un joueur qui revient après longtemps). */
export function reglerLoyer(p: Patrimoine, argent: number, maintenant: Date) {
  const fin = Date.parse(p.logement.payeJusquau);
  if (maintenant.getTime() < fin) return { patrimoine: p, argent, preleve: 0, impaye: 0 };
  const semaines = Math.min(8, Math.floor((maintenant.getTime() - fin) / SEMAINE_MS) + 1);
  const loyer = LOGEMENTS[p.logement.niveau].loyerSemaine;
  let reste = argent, preleve = 0, impaye = 0;
  for (let s = 0; s < semaines; s++) if (reste >= loyer) { reste -= loyer; preleve += loyer; } else impaye += loyer;
  const payeJusquau = new Date(fin + Math.max(semaines, Math.floor((maintenant.getTime() - fin) / SEMAINE_MS) + 1) * SEMAINE_MS).toISOString();
  return { patrimoine: { ...p, logement: { ...p.logement, payeJusquau, arrieres: p.logement.arrieres + impaye } }, argent: reste, preleve, impaye };
}
