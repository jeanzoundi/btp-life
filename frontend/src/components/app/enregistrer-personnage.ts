'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { apparenceSurMesure, estPersonnage, ID_SUR_MESURE, type ApparenceSurMesure, type IdPersonnage } from '@/lib/personnages-joueur';
import { gabaritDepuis, type GabaritPersonnage } from '@/lib/gabarit-personnage';
import { estCouleurCasque } from '@/lib/casques';

// Enregistrer le personnage choisi, sans charger la scène 3D : le créateur de l'inscription, le monde vivant et la carte
// de l'accueil classique s'en servent.

const CLE_DEMO = 'btp-life-personnage-demo';
export interface ChoixPersonnageJoueur extends Partial<GabaritPersonnage> { personnage: IdPersonnage; nom: string; casque?: string; apparence?: ApparenceSurMesure }
/** Ce que le choix ajoute au modèle : ses proportions, la couleur de son casque et, sur mesure, son apparence. */
export type FinitionsPersonnage = GabaritPersonnage & { casque: string; apparence?: ApparenceSurMesure };

/** Le choix fait en démonstration, gardé dans ce navigateur. */
export function lireChoixDemo(): ChoixPersonnageJoueur | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_DEMO) ?? 'null') as { personnage?: unknown; nom?: unknown; casque?: unknown } | null;
    if (!v || !estPersonnage(v.personnage)) return null;
    return { personnage: v.personnage, nom: typeof v.nom === 'string' ? v.nom : '', ...gabaritDepuis(v), ...(estCouleurCasque(v.casque) ? { casque: v.casque } : {}),
      ...(v.personnage === ID_SUR_MESURE ? { apparence: apparenceSurMesure(v) } : {}) };
  } catch { return null; }
}

/** Enregistre le choix : dans le compte (PATCH /carriere/avatar/personnage), ou dans ce navigateur en démonstration.
 * Un casque du dressing (hors palette du créateur) reste tel quel : on n'envoie que les couleurs de la palette. */
export function useEnregistrerPersonnage(demo: boolean, onDemo?: (choix: ChoixPersonnageJoueur) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ personnage, nom, casque, apparence, ...gabarit }: ChoixPersonnageJoueur) => {
      const teinte = estCouleurCasque(casque) ? { casque } : {};
      const surMesure = personnage === ID_SUR_MESURE && apparence ? { apparence } : {};
      if (demo) {
        try { localStorage.setItem(CLE_DEMO, JSON.stringify({ personnage, nom, ...gabaritDepuis(gabarit), ...teinte, ...surMesure })); } catch { throw new Error('Le navigateur ne peut pas sauvegarder ce personnage. Autorise le stockage puis réessaie.'); }
        return null;
      }
      return api.patch<{ nomPersonnage: string; config: unknown }>('/carriere/avatar/personnage', { personnage, ...gabaritDepuis(gabarit), ...teinte, ...surMesure, ...(nom.length >= 2 ? { nomPersonnage: nom } : {}) });
    },
    onSuccess: (avatar, choix) => {
      if (demo) { onDemo?.(choix); return; }
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ancienne ? { ...ancienne, avatar } : ancienne);
      client.invalidateQueries({ queryKey: ['carriere'] });
    },
  });
}
