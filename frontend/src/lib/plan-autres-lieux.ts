import type { PointInterieur } from './navigation-interieur';

export type FamilleLieu = 'formation' | 'restauration' | 'commerce' | 'institution' | 'laboratoire' | 'chantier' | 'logistique' | 'loisirs';
export type StationLieu = PointInterieur & { id: string; label: string; detail: string };
export type ObstacleLieu = PointInterieur & { largeur: number; profondeur: number };

const FAMILLES: Record<string, FamilleLieu> = {
  universite: 'formation', atelier: 'formation', maquis: 'restauration', cafe: 'restauration', marche: 'commerce',
  'centre-azur': 'commerce', 'galerie-palmiers': 'commerce', fournisseur: 'logistique', logistique: 'logistique',
  banque: 'institution', mairie: 'institution', agence: 'institution', laboratoire: 'laboratoire',
  chantier: 'chantier', 'construction-nord': 'chantier', marina: 'loisirs', sports: 'loisirs',
};

export function familleLieu(slug: string): FamilleLieu | null { return FAMILLES[slug] ?? null; }

const LABELS: Record<FamilleLieu, Array<[string, string, string]>> = {
  formation: [['accueil', 'Accueil', 'Accueil pédagogique et orientation'], ['cours', 'Salle de cours', 'Supports de formation et tableau technique'], ['atelier', 'Atelier pratique', 'Postes de simulation et exercices'], ['ressources', 'Ressources', 'Documentation et références métier']],
  restauration: [['comptoir', 'Comptoir', 'Commande et service'], ['salle', 'Salle', 'Tables et espace social'], ['cuisine', 'Cuisine', 'Préparation et hygiène'], ['terrasse', 'Terrasse', 'Espace extérieur convivial']],
  commerce: [['accueil', 'Accueil', 'Information et orientation'], ['rayons', 'Rayons', 'Produits et équipements'], ['caisse', 'Caisse', 'Validation des achats virtuels'], ['stock', 'Réserve', 'Stockage et réassort']],
  institution: [['accueil', 'Accueil', 'Orientation des visiteurs'], ['guichet', 'Guichet', 'Démarches et opérations'], ['conseil', 'Bureau conseil', 'Examen des dossiers'], ['archives', 'Archives', 'Classement et traçabilité']],
  laboratoire: [['accueil', 'Accueil', 'Réception et identification des échantillons'], ['essais', 'Zone d’essais', 'Contrôle pédagogique des matériaux'], ['analyse', 'Paillasse', 'Mesures et observations'], ['stock', 'Échantillons', 'Rangement et traçabilité']],
  chantier: [['briefing', 'Briefing', 'Consignes et préparation de la journée'], ['plans', 'Table à plans', 'Lecture des documents d’exécution'], ['materiel', 'Matériel', 'Équipements de chantier'], ['controle', 'Contrôle', 'Inspection pédagogique de la zone']],
  logistique: [['accueil', 'Comptoir', 'Réception des demandes'], ['stock', 'Stock', 'Matériaux rangés par famille'], ['preparation', 'Préparation', 'Constitution des commandes'], ['expedition', 'Expédition', 'Contrôle avant sortie']],
  loisirs: [['accueil', 'Accueil', 'Informations sur le lieu'], ['activite', 'Activité', 'Espace de pratique'], ['detente', 'Détente', 'Assises et rencontres'], ['service', 'Services', 'Équipements accessibles']],
};
const POSITIONS = [[-3.4, 3.4], [-3.3, -1.2], [3.1, -.9], [3.7, 3.2]] as const;
export function stationsLieu(famille: FamilleLieu): StationLieu[] {
  return LABELS[famille].map(([id, label, detail], i) => ({ id, label, detail: `${label} · ${detail}.`, x: POSITIONS[i][0], z: POSITIONS[i][1] }));
}
export const OBSTACLES_LIEU: ObstacleLieu[] = [
  { x: -3.5, z: 2.2, largeur: 2.7, profondeur: .9 },
  { x: -3.5, z: -2.6, largeur: 2.7, profondeur: 1.6 },
  { x: 3.2, z: -2.4, largeur: 3.1, profondeur: 1.7 },
  { x: 4.9, z: 2.3, largeur: .8, profondeur: 2.5 },
  { x: -3.9, z: -.35, largeur: 3.4, profondeur: .14 },
];

export function navigationLieu() {
  const libre = ({ x, z }: PointInterieur, marge = .25) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 5.4 && Math.abs(z) <= 4.4 && !OBSTACLES_LIEU.some(o => Math.abs(x - o.x) < o.largeur / 2 + marge && Math.abs(z - o.z) < o.profondeur / 2 + marge);
  const avancer = (p: PointInterieur, dx: number, dz: number, delta: number): PointInterieur => {
    const longueur = Math.hypot(dx, dz); if (!longueur) return p;
    const pas = Math.min(Math.max(delta, 0), .05) * 2.1, x = p.x + dx / longueur * pas, z = p.z + dz / longueur * pas;
    const suivant = { x: libre({ x, z: p.z }) ? x : p.x, z: p.z }; if (libre({ x: suivant.x, z })) suivant.z = z; return suivant;
  };
  const chemin = (depart: PointInterieur, cible: PointInterieur): PointInterieur[] => {
    if (!libre(depart) || !libre(cible)) return [];
    const cell = (p: PointInterieur) => ({ x: Math.round(p.x * 5), z: Math.round(p.z * 5) }), key = (p: PointInterieur) => `${p.x},${p.z}`;
    const debut = cell(depart), fin = cell(cible), file = [debut], parents = new Map<string, PointInterieur | null>([[key(debut), null]]);
    for (let i = 0; i < file.length; i++) { const courant = file[i]; if (key(courant) === key(fin)) { const route: PointInterieur[] = []; let p: PointInterieur | null = courant; while (p && key(p) !== key(debut)) { route.unshift({ x: p.x / 5, z: p.z / 5 }); p = parents.get(key(p)) ?? null; } return route; }
      for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) { const voisin = { x: courant.x + dx, z: courant.z + dz }; if (!parents.has(key(voisin)) && libre({ x: voisin.x / 5, z: voisin.z / 5 }, .34)) { parents.set(key(voisin), courant); file.push(voisin); } }
    } return [];
  };
  return { libre: (p: PointInterieur) => libre(p), avancer, chemin };
}
