import { Bricolage_Grotesque, Manrope } from 'next/font/google';

// Polices du mode jeu, auto-hébergées par Next au build (aucun appel externe côté joueur) :
// Bricolage Grotesque, au dessin artisanal, pour les titres et les chiffres ; Manrope, très lisible, pour le texte.
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-jeu-titre', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-jeu-texte', display: 'swap' });

/** À poser sur la racine d'un écran de jeu : expose les variables CSS utilisées par les classes `hud-*`. */
export const POLICES_JEU = `${bricolage.variable} ${manrope.variable}`;
