'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { personnageDe, type PersonnageJoueur } from '@/lib/personnages-joueur';
import { HumainMonde } from './humain-monde';

// Le personnage choisi par le joueur, fourni une fois autour du monde : la ville, le chantier, la résidence et chaque
// intérieur le dessinent pareil (le contexte traverse les Canvas de React Three Fiber).
const ContextePersonnage = createContext<PersonnageJoueur>(personnageDe(null));

export function FournisseurPersonnage({ personnage, children }: { personnage: PersonnageJoueur; children: ReactNode }) {
  return <ContextePersonnage.Provider value={personnage}>{children}</ContextePersonnage.Provider>;
}

export const usePersonnageJoueur = () => useContext(ContextePersonnage);

/** Le joueur dans une scène 3D. Casque au chantier et en ville ; tête nue dans les lieux de vie. De loin, la version
 * stylisée porte un casque jaune sur le chantier même quand le modèle choisi n'en a pas. */
export function HumainJoueur({ casque = true, nom, marche, assis, prof, allure, scale }: {
  casque?: boolean; nom?: string; marche?: boolean; assis?: boolean; prof?: boolean; allure?: number; scale?: number;
}) {
  const personnage = usePersonnageJoueur();
  const design = casque ? { ...personnage.design, casque: personnage.design.casque ?? '#f4c430' } : { ...personnage.design, casque: undefined };
  return <HumainMonde modele={personnage.modele} design={design} casque={casque} sansCasque={!casque} nom={nom} marche={marche} assis={assis} prof={prof} allure={allure} scale={scale} />;
}
