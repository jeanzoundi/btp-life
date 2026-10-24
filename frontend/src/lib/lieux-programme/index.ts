// Lieux de la ville qui suivent un programme : chaque bâtiment a son métier, son mentor, sa mécanique et son intérieur.
// Certains ont aussi un service ouvert à tout moment, branché sur un vrai système du jeu (épargne, offres d'emploi…).
import type { PlanLieu, ProgrammeLieu } from '../programme-lieu';
import { PLAN_AGENCE, PROGRAMME_AGENCE } from './agence';
import { PLAN_ATELIER, PROGRAMME_ATELIER } from './atelier';
import { PLAN_BANQUE, PROGRAMME_BANQUE } from './banque';
import { PLAN_BUREAU_ETUDES, PROGRAMME_BUREAU_ETUDES } from './bureau-etudes';
import { PLAN_DEPOT, PROGRAMME_DEPOT } from './depot';
import { PLAN_ENTREPRISE, PROGRAMME_ENTREPRISE } from './entreprise';
import { PLAN_LABORATOIRE, PROGRAMME_LABORATOIRE } from './laboratoire';
import { PLAN_LOGISTIQUE, PROGRAMME_LOGISTIQUE } from './logistique';
import { PLAN_MAIRIE, PROGRAMME_MAIRIE } from './mairie';

/** Service d'un lieu : une station du plan, toujours signalée, qui ouvre un panneau relié au serveur. */
export type TypeServiceLieu = 'epargne' | 'offres' | 'competences' | 'chantiers' | 'marches' | 'logiciels';
export interface ServiceLieu { station: string; type: TypeServiceLieu }

export const LIEUX_PROGRAMME: Record<string, { programme: ProgrammeLieu; plan: PlanLieu; services?: ServiceLieu[] }> = {
  laboratoire: { programme: PROGRAMME_LABORATOIRE, plan: PLAN_LABORATOIRE },
  fournisseur: { programme: PROGRAMME_DEPOT, plan: PLAN_DEPOT },
  mairie: { programme: PROGRAMME_MAIRIE, plan: PLAN_MAIRIE },
  banque: { programme: PROGRAMME_BANQUE, plan: PLAN_BANQUE, services: [{ station: 'epargne', type: 'epargne' }] },
  agence: { programme: PROGRAMME_AGENCE, plan: PLAN_AGENCE, services: [{ station: 'offres', type: 'offres' }] },
  'bureau-etudes': { programme: PROGRAMME_BUREAU_ETUDES, plan: PLAN_BUREAU_ETUDES, services: [{ station: 'tableau', type: 'competences' }] },
  atelier: { programme: PROGRAMME_ATELIER, plan: PLAN_ATELIER, services: [{ station: 'catalogue', type: 'logiciels' }] },
  logistique: { programme: PROGRAMME_LOGISTIQUE, plan: PLAN_LOGISTIQUE, services: [{ station: 'suivi', type: 'chantiers' }] },
  entreprise: { programme: PROGRAMME_ENTREPRISE, plan: PLAN_ENTREPRISE, services: [{ station: 'marches', type: 'marches' }] },
};

export const aUnProgramme = (slug: string) => slug in LIEUX_PROGRAMME;
/** Le service ouvert à cette station du lieu, s'il y en a un. */
export const serviceA = (slug: string, station: string) => LIEUX_PROGRAMME[slug]?.services?.find(s => s.station === station) ?? null;
