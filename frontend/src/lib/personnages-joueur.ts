// Les personnages jouables. Le même personnage sert au monde vivant (modèle 3D réaliste) et au mode classique
// (avatar 2D : même teint, mêmes cheveux). Le choix est rangé dans la configuration de l'avatar
// (`Avatar.config.personnage`, PATCH /carriere/avatar/personnage), à côté des réglages du dressing.
import type { DesignPersonnage } from './identites-personnages';
import type { ModeleRealiste } from './personnages-realistes';

export type IdPersonnage = 'combinaison' | 'bleu-travail' | 'tailleur' | 'tenue-ville' | 'jean' | 'capuche' | 'costume';

/** Ce que le personnage impose à l'avatar 2D ; la tenue, le casque et les accessoires restent ceux du dressing. */
export interface Apparence2D { peau: string; cheveux: 'court' | 'afro' | 'tresses' | 'chauve'; pilosite?: 'aucune' }

export interface PersonnageJoueur {
  id: IdPersonnage; titre: string; detail: string;
  /** Modèle 3D réaliste (de près) ; `design` habille la version stylisée (de loin, ou pendant le chargement). */
  modele: ModeleRealiste; design: DesignPersonnage;
  /** Le modèle porte son casque de chantier ; les autres arrivent tête nue. */
  casque: boolean;
  apparence: Apparence2D;
}

// Couleurs relevées sur les textures des modèles (peau de la tête, tenue du corps, casque).
export const PERSONNAGES: PersonnageJoueur[] = [
  {
    id: 'combinaison', titre: 'Combinaison de chantier', detail: 'Combinaison bleue, casque blanc, chaussures de sécurité', modele: 'ouvrier-casque', casque: true,
    design: { peau: '#563624', haut: '#164984', pantalon: '#0b3768', accent: '#f5efda', chaussures: '#2b2b2e', cheveux: 'court', tenue: 'veste', largeur: 1, hauteur: 1, feminin: false, casque: '#d2d6db' },
    apparence: { peau: '#5C3A24', cheveux: 'court' },
  },
  {
    id: 'bleu-travail', titre: 'Bleu de travail', detail: 'Ensemble marine, casque blanc, regard de chef d’équipe', modele: 'chef-chantier', casque: true,
    design: { peau: '#b07850', haut: '#0a3668', pantalon: '#092c56', accent: '#f5efda', chaussures: '#2b2b2e', cheveux: 'court', tenue: 'veste', largeur: 1.06, hauteur: 1.02, feminin: false, casque: '#d2d6db' },
    apparence: { peau: '#A9713C', cheveux: 'court' },
  },
  {
    id: 'tailleur', titre: 'Tailleur sombre', detail: 'Veste et pantalon noirs, prête pour la réunion de chantier', modele: 'cadre-femme', casque: false,
    design: { peau: '#94603c', haut: '#1c1d1e', pantalon: '#171818', accent: '#a9abc6', chaussures: '#141414', cheveux: 'tresses', tenue: 'veste', largeur: .92, hauteur: .98, feminin: true },
    apparence: { peau: '#8D5524', cheveux: 'tresses', pilosite: 'aucune' },
  },
  {
    id: 'tenue-ville', titre: 'Tenue de ville', detail: 'Haut noir, allure décontractée, pour arpenter le quartier', modele: 'femme-ville', casque: false,
    design: { peau: '#c48552', haut: '#171514', pantalon: '#2a2420', accent: '#c58758', chaussures: '#141414', cheveux: 'afro', tenue: 'chemise', largeur: .94, hauteur: .97, feminin: true },
    apparence: { peau: '#C68642', cheveux: 'afro', pilosite: 'aucune' },
  },
  {
    id: 'jean', titre: 'Jean et chemise', detail: 'Chemise sombre et jean, toujours entre deux rendez-vous', modele: 'homme-jean', casque: false,
    design: { peau: '#52331f', haut: '#34373a', pantalon: '#353c45', accent: '#edc36b', chaussures: '#2b2b2e', cheveux: 'court', tenue: 'chemise', largeur: .98, hauteur: 1.02, feminin: false },
    apparence: { peau: '#5C3A24', cheveux: 'court' },
  },
  {
    id: 'capuche', titre: 'Sweat à capuche', detail: 'Sweat gris, baskets, le dessinateur qui ne quitte pas sa tablette', modele: 'homme-capuche', casque: false,
    design: { peau: '#45291d', haut: '#7a746a', pantalon: '#181818', accent: '#f5efda', chaussures: '#ede8d7', cheveux: 'court', tenue: 'tshirt', largeur: .96, hauteur: 1, feminin: false },
    apparence: { peau: '#5C3A24', cheveux: 'court' },
  },
  {
    id: 'costume', titre: 'Costume', detail: 'Costume sombre, chemise claire, le chargé d’affaires', modele: 'cadre-homme', casque: false,
    design: { peau: '#a8734d', haut: '#23221e', pantalon: '#191816', accent: '#f5efda', chaussures: '#141414', cheveux: 'court', tenue: 'veste', largeur: 1, hauteur: 1.03, feminin: false },
    apparence: { peau: '#A9713C', cheveux: 'court' },
  },
];

/** Sans choix, on garde le personnage d'origine du jeu : la combinaison de chantier. */
export const PERSONNAGE_DEFAUT: IdPersonnage = 'combinaison';

export const estPersonnage = (id: unknown): id is IdPersonnage => typeof id === 'string' && PERSONNAGES.some(p => p.id === id);
const parId = (id: IdPersonnage) => PERSONNAGES.find(p => p.id === id)!;

/** Le personnage choisi dans une configuration d'avatar, ou null s'il n'a jamais été choisi. */
export function personnageChoisi(config: unknown): IdPersonnage | null {
  const id = config && typeof config === 'object' ? (config as { personnage?: unknown }).personnage : undefined;
  return estPersonnage(id) ? id : null;
}

/** Le personnage à afficher : celui choisi, sinon celui d'origine. */
export const personnageDe = (config: unknown): PersonnageJoueur => parId(personnageChoisi(config) ?? PERSONNAGE_DEFAUT);

/** Avant le premier choix, on propose le personnage le plus proche de l'avatar 2D : même teint, cheveux longs pour les tresses. */
export function personnageProche(config: unknown): IdPersonnage {
  const choisi = personnageChoisi(config);
  if (choisi) return choisi;
  const c = config && typeof config === 'object' ? config as { peau?: unknown; cheveux?: unknown; pilosite?: unknown } : {};
  if (typeof c.peau !== 'string' || !/^#[0-9a-f]{6}$/i.test(c.peau)) return PERSONNAGE_DEFAUT;
  const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const [r, g, b] = rgb(c.peau);
  const feminin = c.cheveux === 'tresses' && (c.pilosite === undefined || c.pilosite === 'aucune');
  const candidats = PERSONNAGES.filter(p => p.design.feminin === feminin);
  const ecart = (p: PersonnageJoueur) => { const [pr, pg, pb] = rgb(p.apparence.peau); return Math.hypot(pr - r, pg - g, pb - b); };
  return [...candidats].sort((x, y) => ecart(x) - ecart(y))[0]?.id ?? PERSONNAGE_DEFAUT;
}

/** L'avatar 2D prend le teint et les cheveux du personnage choisi : on est la même personne dans les deux modes. */
export function avecApparence<T extends object>(config: T): T {
  const choisi = personnageChoisi(config);
  return choisi ? { ...config, ...parId(choisi).apparence } : config;
}
