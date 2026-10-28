'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { personnageDe, type PersonnageJoueur } from '@/lib/personnages-joueur';
import { HumainMonde } from './humain-monde';
import { echelleGabarit } from '@/lib/gabarit-personnage';

// Le personnage choisi par le joueur, fourni une fois autour du monde : la ville, le chantier, la résidence et chaque
// intérieur le dessinent pareil (le contexte traverse les Canvas de React Three Fiber).
const ContextePersonnage = createContext<PersonnageJoueur>(personnageDe(null));

export function FournisseurPersonnage({ personnage, children }: { personnage: PersonnageJoueur; children: ReactNode }) {
  return <ContextePersonnage.Provider value={personnage}>{children}</ContextePersonnage.Provider>;
}

export const usePersonnageJoueur = () => useContext(ContextePersonnage);

/** Le joueur dans une scène 3D. Casque au chantier et en ville ; tête nue dans les lieux de vie. De loin, la version
 * stylisée porte un casque jaune sur le chantier même quand le modèle choisi n'en a pas. Le personnage sur mesure,
 * dessiné de près par la version stylisée, ne le porte que s'il l'a choisi : sa coiffure reste visible. */
export function HumainJoueur({ casque: casqueDuLieu = true, nom, marche, assis, prof, allure, scale }: {
  casque?: boolean; nom?: string; marche?: boolean; assis?: boolean; prof?: boolean; allure?: number; scale?: number;
}) {
  const personnage = usePersonnageJoueur();
  const casque = casqueDuLieu && (personnage.modele !== null || personnage.casque);
  // Le casque choisi (créateur ou dressing) colore le casque réaliste et la version stylisée.
  const teinte = personnage.couleurCasque;
  const design = casque ? { ...personnage.design, casque: teinte ?? personnage.design.casque ?? '#f4c430' } : { ...personnage.design, casque: undefined };
  return <group scale={echelleGabarit(personnage.gabarit)}><HumainMonde modele={personnage.modele} design={design} casque={casque} sansCasque={!casque} nom={nom} marche={marche} assis={assis} prof={prof} allure={allure} scale={scale} teinteCasque={teinte} /></group>;
}
