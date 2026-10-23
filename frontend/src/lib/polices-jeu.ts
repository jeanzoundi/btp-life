import { Archivo, Bungee } from 'next/font/google';

// Polices du mode jeu, auto-hébergées par Next au build (aucun appel à Google côté joueur).
// Bungee pour les chiffres et titres du HUD, Archivo pour les libellés.
const bungee = Bungee({ weight: '400', subsets: ['latin'], variable: '--font-hud-titre', display: 'swap' });
const archivo = Archivo({ weight: ['500', '700', '800'], subsets: ['latin'], variable: '--font-hud-texte', display: 'swap' });

/** À poser sur la racine d'un écran de jeu : expose les deux variables CSS utilisées par les classes `hud-*`. */
export const POLICES_JEU = `${bungee.variable} ${archivo.variable}`;
