import type { IdentitePersonnage } from './identites-personnages';

/** Personnages Microsoft Rocketbox (licence MIT), convertis en GLB légers dans public/personnages. */
export type ModeleRealiste = 'ouvrier-casque' | 'chef-chantier' | 'cadre-femme' | 'femme-ville' | 'homme-jean' | 'homme-capuche' | 'cadre-homme';
export type EtatAnimation = 'repos' | 'marche' | 'course' | 'assis' | 'parle';

export const MODELES_REALISTES: Record<ModeleRealiste, { genre: 'h' | 'f'; source: string }> = {
  'ouvrier-casque': { genre: 'h', source: 'Construction_Male_03' },
  'chef-chantier': { genre: 'h', source: 'Construction_Male_08' },
  'cadre-femme': { genre: 'f', source: 'Business_Female_01' },
  'femme-ville': { genre: 'f', source: 'Female_Party_02' },
  'homme-jean': { genre: 'h', source: 'Male_Adult_12' },
  'homme-capuche': { genre: 'h', source: 'Male_Adult_18' },
  'cadre-homme': { genre: 'h', source: 'Business_Male_05' },
};

/** Les identités du jeu gardent leur rôle : l'ouvrier casqué est le bâtisseur, le chef de chantier est Yao. */
const PAR_IDENTITE: Record<IdentitePersonnage, ModeleRealiste> = {
  batisseur: 'ouvrier-casque', yao: 'chef-chantier', awa: 'cadre-femme', mariam: 'cadre-femme', fatou: 'femme-ville', koffi: 'homme-jean',
};
const PASSANTS: ModeleRealiste[] = ['homme-capuche', 'femme-ville', 'cadre-homme', 'homme-jean', 'cadre-femme'];

export function modeleRealiste({ identite, variante = 0, casque = false, prof = false }: { identite?: IdentitePersonnage; variante?: number; casque?: boolean; prof?: boolean }): ModeleRealiste {
  if (identite) return PAR_IDENTITE[identite];
  const i = Math.abs(Math.floor(variante));
  if (casque) return i % 2 ? 'chef-chantier' : 'ouvrier-casque';
  if (prof) return i % 2 ? 'cadre-homme' : 'cadre-femme';
  return PASSANTS[i % PASSANTS.length];
}

/** Au-delà de 3 m/s, on court ; une enseignante ou un responsable qui explique « parle ». */
export function etatAnimation({ marche = false, assis = false, prof = false, allure = 1.4 }: { marche?: boolean; assis?: boolean; prof?: boolean; allure?: number }): EtatAnimation {
  if (assis) return 'assis';
  if (marche) return allure > 3 ? 'course' : 'marche';
  return prof ? 'parle' : 'repos';
}

/** Cadence de lecture calée sur la vitesse réelle pour limiter le glissement des pieds. */
export function cadenceAnimation(etat: EtatAnimation, allure = 1.4) {
  if (etat === 'marche') return Math.min(1.6, Math.max(.75, allure / 1.4));
  if (etat === 'course') return Math.min(1.5, Math.max(.8, allure / 3.8));
  return 1;
}
