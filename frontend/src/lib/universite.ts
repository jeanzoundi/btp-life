// L'Université BTP du quartier : l'amphithéâtre où le doyen projette les vrais cours de l'Académie (GET /catalog/modules-academie),
// la bibliothèque pour les relire, l'emploi du temps du semestre. Un cours suivi jusqu'au bout est validé dans l'Académie
// (POST /carriere/cours/:id/termine) ; sa mission pratique, elle, rapporte XP et argent. Sans Three.js ni React.
import { zone, type Assise } from './navigation-plan';
import type { PlanLieu } from './programme-lieu';

export interface BlocCours { type: string; valeur: string }
export interface CoursAcademie { id: string; titre: string; dureeMin: number | null; contenu: { blocs?: BlocCours[] } | null; missionPratiqueId: string | null }
export interface ModuleAcademie { id: string; slug: string; titre: string; domaine: string; publie: boolean; cours: CoursAcademie[] }

/** La Grande École (niveau BTS2) vient après l'Académie de base, comme sur la page de l'Académie. */
export const DOMAINE_GRANDE_ECOLE = 'grande-ecole-batiment';

/** Modules publiés, dans l'ordre du semestre : l'Académie d'abord, la Grande École ensuite ; on garde l'ordre du catalogue. */
export function ordonnerModules(items: readonly ModuleAcademie[]): ModuleAcademie[] {
  const publies = items.filter(m => m.publie && m.cours.length);
  return [...publies.filter(m => m.domaine !== DOMAINE_GRANDE_ECOLE), ...publies.filter(m => m.domaine === DOMAINE_GRANDE_ECOLE)];
}

/** Premier cours pas encore suivi, module par module ; null quand tout le semestre est validé. */
export function prochainCours(modules: readonly ModuleAcademie[], termines: ReadonlySet<string>) {
  for (const module of modules) for (const cours of module.cours) if (!termines.has(cours.id)) return { module, cours };
  return null;
}

/** Avancement de chaque module (cours suivis sur cours prévus) et du semestre entier. */
export function avancementSemestre(modules: readonly ModuleAcademie[], termines: ReadonlySet<string>) {
  const parModule = modules.map(m => ({ module: m, faits: m.cours.filter(c => termines.has(c.id)).length, total: m.cours.length }));
  const faits = parModule.reduce((n, m) => n + m.faits, 0), total = parModule.reduce((n, m) => n + m.total, 0);
  return { parModule, faits, total, valides: parModule.filter(m => m.faits === m.total).length };
}

/** Sans réseau (ou en démonstration hors ligne), l'amphi garde deux modules à projeter : jamais envoyés au serveur. */
export const MODULES_HORS_LIGNE: ModuleAcademie[] = [
  {
    id: 'hors-ligne-hse', slug: 'securite-chantier', titre: 'Sécurité chantier (HSE)', domaine: 'hse', publie: true,
    cours: [{
      id: 'hors-ligne-hse-1', titre: 'Les EPI et les principes de prévention', dureeMin: 8, missionPratiqueId: null,
      contenu: { blocs: [
        { type: 'objectifs', valeur: 'Connaître les équipements de protection individuelle\nSavoir pourquoi on supprime le risque avant de s’en protéger' },
        { type: 'texte', valeur: 'Sur un chantier, la tenue minimale est le casque, les chaussures de sécurité et le gilet haute visibilité. Selon la tâche, on ajoute gants, lunettes, protections auditives ou harnais.' },
        { type: 'astuce', valeur: 'Avant de distribuer des EPI, demande-toi si le danger peut être supprimé : un garde-corps protège tout le monde, un harnais une seule personne.' },
        { type: 'attention', valeur: 'Un EPI abîmé ne protège plus : un casque fissuré ou un harnais effiloché se remplace, il ne se répare pas.' },
        { type: 'retenir', valeur: 'Casque, chaussures, gilet : le minimum pour tous\nSupprimer le risque d’abord, se protéger ensuite\nUn EPI abîmé se remplace' },
      ] },
    }],
  },
  {
    id: 'hors-ligne-beton', slug: 'beton-et-ferraillage', titre: 'Béton et ferraillage', domaine: 'technique', publie: true,
    cours: [{
      id: 'hors-ligne-beton-1', titre: 'Composition et dosage du béton', dureeMin: 10, missionPratiqueId: null,
      contenu: { blocs: [
        { type: 'objectifs', valeur: 'Connaître les constituants du béton\nComprendre le rôle de l’eau dans la résistance' },
        { type: 'texte', valeur: 'Un béton courant associe ciment, sable, gravier et eau. Pour un béton de structure, on vise environ 350 kg de ciment par mètre cube.' },
        { type: 'exemple', valeur: 'Pour une dalle de 20 m² sur 15 cm, il faut 3 m³ de béton, soit environ 1 050 kg de ciment : 21 sacs de 50 kg.' },
        { type: 'attention', valeur: 'Ajouter de l’eau pour faciliter la mise en place fait chuter la résistance : le béton devient poreux et fragile.' },
        { type: 'retenir', valeur: 'Ciment, sable, gravier, eau\nEnviron 350 kg de ciment par m³ pour la structure\nTrop d’eau, béton fragile' },
      ] },
    }],
  },
];

export const UNIVERSITE = {
  nom: 'Université BTP · Faculté du Bâtiment', accroche: 'Les cours de l’Académie, projetés en amphi par le doyen. La bibliothèque est ouverte à tous.',
  hote: { nom: 'Pr Kouamé N’Dri', role: 'Doyen de la Faculté du Bâtiment' },
  horaires: { ouverture: 7, fermeture: 20 },
};

/** Rangées de l'amphithéâtre (profondeur de chaque gradin) : deux blocs de part et d'autre d'une allée centrale. */
export const RANGEES_AMPHI = [-3.8, -1.8, .2, 2.2];

export const PLAN_UNIVERSITE: PlanLieu = {
  ambiance: 'interieur', demiLargeur: 12, demiProfondeur: 9, depart: [6, 7.8],
  obstacles: [
    zone(-8.2, 8.2, -9, -6.4), // estrade, pupitre et grand écran
    ...RANGEES_AMPHI.flatMap(z => [zone(-10.3, -4.6, z - .55, z + .55), zone(-3.4, 2.3, z - .55, z + .55)]),
    zone(10.6, 12, -6.5, 6.5), // rayonnages de la bibliothèque
    zone(6, 8, -1.7, -.3), zone(6, 8, 2.3, 3.7), // tables de lecture
    zone(-12, -10.6, 4.4, 9), // présentoir des diplômés
  ],
  stations: { place: [-4, .2], bibliotheque: [9.4, 1], tableau: [9.6, -7.6], mentor: [-5, -5.8] },
  libelles: { place: 'Ta place en amphi', bibliotheque: 'Bibliothèque', tableau: 'Emploi du temps', mentor: 'Pr Kouamé N’Dri' },
  mentor: { position: [-5, -7.4], rotation: 0 },
};

/** Ta place : premier siège du bloc de droite, troisième rang ; à la bibliothèque, la table du bas. */
export const ASSISE_AMPHI: Assise = { position: [-2.95, .45], rotation: Math.PI };
export const ASSISE_BIBLIOTHEQUE: Assise = { position: [7, 4.25], rotation: Math.PI };
