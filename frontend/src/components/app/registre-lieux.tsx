'use client';

import type { ComponentType } from 'react';
import { DecorDepot, DecorLaboratoire, DecorMairie } from './decors-lieux';
import { DecorAtelier, DecorBureauEtudes, DecorEntreprise, DecorLogistique } from './decors-metiers';
import { DecorJardins, DecorPlateau } from './decors-quartier';
import { DecorAgence, DecorBanque } from './decors-services';
import type { ProprietesDecor } from './interieur-lieu-programme';
import type { ModeleHote } from './scene-plan';

// Décor et mentor de chaque lieu à programme. Les mentors : une identité du jeu, ou une tenue et une variante
// (« prof » : tenue de bureau, variante paire pour une femme, impaire pour un homme ; sans « prof » : l'un des passants ;
// « casque » : la tenue de chantier).
export const DECORS_LIEUX: Record<string, ComponentType<ProprietesDecor>> = {
  laboratoire: DecorLaboratoire, fournisseur: DecorDepot, mairie: DecorMairie, banque: DecorBanque, agence: DecorAgence,
  'bureau-etudes': DecorBureauEtudes, atelier: DecorAtelier, logistique: DecorLogistique, entreprise: DecorEntreprise,
  'jardins-residence': DecorJardins, 'construction-nord': DecorPlateau,
};
export const MENTORS_LIEUX: Record<string, ModeleHote> = {
  laboratoire: { identite: 'awa' }, fournisseur: { identite: 'koffi' }, mairie: { identite: 'mariam' },
  banque: { prof: true, variante: 0 }, agence: { prof: false, variante: 1 },
  // Inès Diabaté, l'ingénieure du café, travaille ici : même personnage.
  'bureau-etudes': { prof: false, variante: 1 }, atelier: { prof: false, variante: 0 },
  logistique: { prof: false, casque: true, variante: 0 }, entreprise: { prof: true, variante: 1 },
  // Le gardien en chemise ; le coordinateur sécurité casqué, comme il l'exige de tous.
  'jardins-residence': { prof: false, variante: 3 }, 'construction-nord': { prof: false, casque: true, variante: 1 },
};
