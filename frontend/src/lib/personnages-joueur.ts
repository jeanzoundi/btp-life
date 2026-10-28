// Les personnages jouables. Le même personnage sert au monde vivant (modèle 3D réaliste) et au mode classique
// (avatar 2D : même teint, mêmes cheveux). Le choix est rangé dans la configuration de l'avatar
// (`Avatar.config.personnage`, PATCH /carriere/avatar/personnage), à côté des réglages du dressing.
// Le personnage « sur mesure » n'a pas de modèle réaliste : la version stylisée le dessine, réglée trait par trait
// (`Avatar.config.apparence`).
import type { DesignPersonnage } from './identites-personnages';
import type { ModeleRealiste } from './personnages-realistes';
import { gabaritDepuis, type GabaritPersonnage } from './gabarit-personnage';
import { couleurCasque } from './casques';

export type IdPersonnage = 'combinaison' | 'bleu-travail' | 'tailleur' | 'tenue-ville' | 'jean' | 'capuche' | 'costume' | 'sur-mesure';
export type Pilosite = 'aucune' | 'moustache' | 'barbe' | 'bouc';

/** Ce que le personnage impose à l'avatar 2D ; la tenue, le casque et les accessoires restent ceux du dressing. */
export interface Apparence2D { peau: string; cheveux: 'court' | 'afro' | 'tresses' | 'chauve'; pilosite?: Pilosite; couleurCheveux?: string }

export interface PersonnageJoueur {
  gabarit?: GabaritPersonnage;
  /** Couleur du casque choisie (créateur ou dressing) : le casque réaliste et la version stylisée la prennent. */
  couleurCasque?: string;
  id: IdPersonnage; titre: string; detail: string;
  /** Modèle 3D réaliste (de près) ; `design` habille la version stylisée (de loin, ou pendant le chargement). Sans
   * modèle (sur mesure), la version stylisée dessine le personnage de près comme de loin. */
  modele: ModeleRealiste | null; design: DesignPersonnage;
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

// ─── Le personnage sur mesure ───

export const ID_SUR_MESURE = 'sur-mesure';
/** Tous les choix possibles, miroir de PERSONNAGES_JOUEUR (backend/src/carriere/personnages.ts). */
export const IDS_PERSONNAGES: IdPersonnage[] = [...PERSONNAGES.map(p => p.id), ID_SUR_MESURE];

export type CoiffureSurMesure = 'court' | 'afro' | 'tresses' | 'foulard' | 'chauve';
export type TenueSurMesure = 'gilet' | 'chemise' | 'veste' | 'pagne' | 'tshirt';
export interface ApparenceSurMesure {
  feminin: boolean; peau: string; coiffure: CoiffureSurMesure; couleurCheveux: string; pilosite: Pilosite; lunettes: boolean;
  /** Casque porté en ville et au chantier (tête nue dans les lieux de vie) ; sinon toujours tête nue. */
  casque: boolean;
  tenue: TenueSurMesure; haut: string; bas: string;
}

// Les choix du créateur, miroir des listes validées par le serveur (`ApparenceSurMesureDto`).
export const COIFFURES_SUR_MESURE: [CoiffureSurMesure, string][] = [['court', 'Courte'], ['afro', 'Afro'], ['tresses', 'Tresses'], ['foulard', 'Foulard'], ['chauve', 'Chauve']];
export const PILOSITES: [Pilosite, string][] = [['aucune', 'Aucune'], ['moustache', 'Moustache'], ['barbe', 'Barbe'], ['bouc', 'Bouc']];
export const TENUES_SUR_MESURE: [TenueSurMesure, string][] = [['gilet', 'Gilet'], ['chemise', 'Chemise'], ['veste', 'Veste'], ['pagne', 'Pagne'], ['tshirt', 'T-shirt']];
export const TEINTS_SUR_MESURE: [string, string][] = [['#3F2618', 'Très foncé'], ['#5C3A24', 'Foncé'], ['#8D5524', 'Brun'], ['#A9713C', 'Caramel'], ['#C68642', 'Doré'], ['#E0AC69', 'Clair']];
export const CHEVEUX_SUR_MESURE: [string, string][] = [['#1E1715', 'Noirs'], ['#4A342A', 'Bruns'], ['#6E4A30', 'Châtains'], ['#8A8680', 'Gris'], ['#A85F4C', 'Roux'], ['#C9A66B', 'Blonds']];
export const HAUTS_SUR_MESURE: [string, string][] = [['#EDAB29', 'Jaune chantier'], ['#E56832', 'Orange'], ['#C34653', 'Rouge'], ['#14786E', 'Vert lagune'], ['#2B718A', 'Bleu pétrole'], ['#164984', 'Bleu roi'], ['#F4E7CE', 'Crème'], ['#23221E', 'Noir']];
export const BAS_SUR_MESURE: [string, string][] = [['#243A51', 'Marine'], ['#0B3768', 'Bleu nuit'], ['#2A2420', 'Brun'], ['#485141', 'Kaki'], ['#D59038', 'Ocre'], ['#171818', 'Noir']];

export const APPARENCE_DEFAUT: ApparenceSurMesure = {
  feminin: false, peau: '#5C3A24', coiffure: 'court', couleurCheveux: '#1E1715', pilosite: 'aucune', lunettes: false, casque: true, tenue: 'gilet', haut: '#EDAB29', bas: '#243A51',
};

/** Des idées de départ pour le personnage sur mesure, chacune modifiable ensuite. */
export const IDEES_SUR_MESURE: { nom: string; apparence: ApparenceSurMesure }[] = [
  { nom: 'Ingénieure en pagne', apparence: { feminin: true, peau: '#8D5524', coiffure: 'foulard', couleurCheveux: '#1E1715', pilosite: 'aucune', lunettes: false, casque: false, tenue: 'pagne', haut: '#C34653', bas: '#D59038' } },
  { nom: 'Topographe barbu', apparence: { feminin: false, peau: '#3F2618', coiffure: 'court', couleurCheveux: '#1E1715', pilosite: 'barbe', lunettes: false, casque: true, tenue: 'gilet', haut: '#E56832', bas: '#243A51' } },
  { nom: 'Architecte', apparence: { feminin: true, peau: '#A9713C', coiffure: 'tresses', couleurCheveux: '#4A342A', pilosite: 'aucune', lunettes: true, casque: false, tenue: 'veste', haut: '#14786E', bas: '#171818' } },
  { nom: 'Chef d’équipe', apparence: { feminin: false, peau: '#5C3A24', coiffure: 'chauve', couleurCheveux: '#1E1715', pilosite: 'bouc', lunettes: false, casque: true, tenue: 'chemise', haut: '#2B718A', bas: '#485141' } },
  { nom: 'Électricienne', apparence: { feminin: true, peau: '#C68642', coiffure: 'afro', couleurCheveux: '#6E4A30', pilosite: 'aucune', lunettes: false, casque: false, tenue: 'tshirt', haut: '#164984', bas: '#2A2420' } },
  { nom: 'Doyen du métier', apparence: { feminin: false, peau: '#8D5524', coiffure: 'court', couleurCheveux: '#8A8680', pilosite: 'moustache', lunettes: true, casque: false, tenue: 'veste', haut: '#23221E', bas: '#0B3768' } },
];

const couleurValide = (v: unknown, defaut: string) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : defaut;
const parmi = <T extends string>(v: unknown, options: [T, string][], defaut: T): T => options.some(([id]) => id === v) ? v as T : defaut;

/** L'apparence sur mesure rangée dans la configuration (`apparence`) ; un réglage absent ou inconnu prend sa valeur par défaut. */
export function apparenceSurMesure(config: unknown): ApparenceSurMesure {
  const brute = config && typeof config === 'object' ? (config as { apparence?: unknown }).apparence : undefined;
  const a = brute && typeof brute === 'object' ? brute as Record<string, unknown> : {};
  const d = APPARENCE_DEFAUT;
  return {
    feminin: typeof a.feminin === 'boolean' ? a.feminin : d.feminin,
    peau: couleurValide(a.peau, d.peau),
    coiffure: parmi(a.coiffure, COIFFURES_SUR_MESURE, d.coiffure),
    couleurCheveux: couleurValide(a.couleurCheveux, d.couleurCheveux),
    pilosite: parmi(a.pilosite, PILOSITES, d.pilosite),
    lunettes: typeof a.lunettes === 'boolean' ? a.lunettes : d.lunettes,
    casque: typeof a.casque === 'boolean' ? a.casque : d.casque,
    tenue: parmi(a.tenue, TENUES_SUR_MESURE, d.tenue),
    haut: couleurValide(a.haut, d.haut),
    bas: couleurValide(a.bas, d.bas),
  };
}

/** Le personnage sur mesure : la version stylisée habillée selon l'apparence ; l'avatar 2D en reprend le teint, les
 * cheveux et la barbe (il n'a pas de foulard : des tresses à la place). */
export function personnageSurMesure(a: ApparenceSurMesure): PersonnageJoueur {
  return {
    id: ID_SUR_MESURE, titre: 'Sur mesure', detail: 'Ton style : coiffure, barbe, teint et tenue au choix', modele: null, casque: a.casque,
    design: { peau: a.peau, haut: a.haut, pantalon: a.bas, accent: '#f5efda', chaussures: '#2b2b2e', cheveux: a.coiffure, couleurCheveux: a.couleurCheveux, pilosite: a.pilosite,
      tenue: a.tenue, largeur: a.feminin ? .93 : 1, hauteur: a.feminin ? .98 : 1, feminin: a.feminin, lunettes: a.lunettes, ...(a.casque ? { casque: '#d2d6db' } : {}) },
    apparence: { peau: a.peau, cheveux: a.coiffure === 'foulard' ? 'tresses' : a.coiffure, couleurCheveux: a.couleurCheveux, pilosite: a.pilosite },
  };
}

const parId = (id: IdPersonnage) => PERSONNAGES.find(p => p.id === id)!;
/** Le personnage d'un choix : un modèle réaliste, ou le sur-mesure avec son apparence. */
export const personnageDuChoix = (id: IdPersonnage, apparence: ApparenceSurMesure = APPARENCE_DEFAUT): PersonnageJoueur =>
  id === ID_SUR_MESURE ? personnageSurMesure(apparence) : parId(id);

export const estPersonnage = (id: unknown): id is IdPersonnage => typeof id === 'string' && (IDS_PERSONNAGES as string[]).includes(id);

/** Le personnage choisi dans une configuration d'avatar, ou null s'il n'a jamais été choisi. */
export function personnageChoisi(config: unknown): IdPersonnage | null {
  const id = config && typeof config === 'object' ? (config as { personnage?: unknown }).personnage : undefined;
  return estPersonnage(id) ? id : null;
}

/** Le personnage à afficher : celui choisi, sinon celui d'origine. */
export const personnageDe = (config: unknown): PersonnageJoueur => ({
  ...personnageDuChoix(personnageChoisi(config) ?? PERSONNAGE_DEFAUT, apparenceSurMesure(config)), gabarit: gabaritDepuis(config), couleurCasque: couleurCasque(config) ?? undefined,
});

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
  return choisi ? { ...config, ...personnageDuChoix(choisi, apparenceSurMesure(config)).apparence } : config;
}
