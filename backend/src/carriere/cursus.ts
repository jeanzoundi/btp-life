import { Prisma, PrismaClient, UserMissionStatut } from '@prisma/client';
import { lireChantierQuartier } from './journee-chantier';
import { ETAPES_LIEUX, lireProgresLieux } from './lieux.service';

// Le cursus de l'étudiant, relié à son choix de départ (BTS ou école d'ingénieurs, `Avatar.config.formationDepart`) :
// des semestres de modules de l'Académie, chacun clos par son examen (les missions pratiques de ses cours, notées par le
// serveur), des stages entre les semestres (des journées au Grand chantier, des étapes au bureau d'études), puis le
// diplôme, délivré comme un certificat. Chaque étape demande la précédente. Même cursus qu'au jeu
// (frontend/src/lib/cursus.ts) : modifier l'un, c'est modifier l'autre, et leurs tests.

export type Formation = 'BTS' | 'ingenieur';
export interface SemestreCursus { id: string; nom: string; modules: readonly string[] }
export type ConditionStage = { type: 'journees'; nombre: number } | { type: 'etapes-lieu'; lieu: string; nombre: number };
export interface StageCursus { id: string; nom: string; apres: string; condition: ConditionStage }
export interface Cursus { formation: Formation; titre: string; diplome: { slug: string; nom: string }; semestres: readonly SemestreCursus[]; stages: readonly StageCursus[] }

export const CURSUS: Record<Formation, Cursus> = {
  BTS: {
    formation: 'BTS', titre: 'BTS Bâtiment', diplome: { slug: 'diplome-bts-batiment', nom: 'Diplôme — BTS Bâtiment' },
    semestres: [
      { id: 'bts-s1', nom: 'Semestre 1 · Les bases du chantier', modules: ['introduction-btp', 'securite-chantier', 'lecture-de-plans', 'materiaux-construction'] },
      { id: 'bts-s2', nom: 'Semestre 2 · Gros œuvre', modules: ['beton-et-ferraillage', 'maconnerie-fondations', 'coffrage-etaiement', 'topographie-implantation'] },
      { id: 'bts-s3', nom: 'Semestre 3 · Études et métré (BTS2)', modules: ['metre-et-devis', 'metre-bts2', 'geotechnique-bts2', 'autocad-plans'] },
      { id: 'bts-s4', nom: 'Semestre 4 · Conduite de travaux', modules: ['techno-batiment-bts', 'planification-chantier', 'controle-qualite-chantier', 'reception-travaux'] },
    ],
    stages: [{ id: 'bts-stage', nom: 'Stage ouvrier · 5 journées au Grand chantier', apres: 'bts-s2', condition: { type: 'journees', nombre: 5 } }],
  },
  ingenieur: {
    formation: 'ingenieur', titre: 'Cycle ingénieur · génie civil', diplome: { slug: 'diplome-ingenieur-genie-civil', nom: 'Diplôme d’ingénieur en génie civil' },
    semestres: [
      { id: 'ing-s1', nom: 'Semestre 1 · Tronc commun', modules: ['introduction-btp', 'securite-chantier', 'lecture-de-plans', 'materiaux-construction', 'topographie-implantation'] },
      { id: 'ing-s2', nom: 'Semestre 2 · Structures et sols', modules: ['beton-et-ferraillage', 'coffrage-etaiement', 'geotechnique-sols', 'maconnerie-fondations'] },
      { id: 'ing-s3', nom: 'Semestre 3 · Numérique et économie', modules: ['autocad-plans', 'revit-bim-initiation', 'metre-et-devis', 'excel-btp-avance'] },
      { id: 'ing-s4', nom: 'Semestre 4 · Management de projet', modules: ['planification-chantier', 'msproject-planning', 'gestion-humaine', 'controle-qualite-chantier', 'reception-travaux'] },
    ],
    stages: [
      { id: 'ing-stage-execution', nom: 'Stage d’exécution · 5 journées au Grand chantier', apres: 'ing-s2', condition: { type: 'journees', nombre: 5 } },
      { id: 'ing-stage-conception', nom: 'Stage de conception · 3 étapes au bureau d’études', apres: 'ing-s4', condition: { type: 'etapes-lieu', lieu: 'bureau-etudes', nombre: 3 } },
    ],
  },
};

export const lireFormation = (config: unknown): Formation | null => {
  const f = config && typeof config === 'object' ? (config as { formationDepart?: unknown }).formationDepart : undefined;
  return f === 'BTS' || f === 'ingenieur' ? f : null;
};

/** Ce que le serveur sait du joueur pour son cursus. */
export interface EtatCursusJoueur {
  coursLus: ReadonlySet<string>;
  /** Pour chaque module : ses cours, et les missions pratiques qui font son examen. */
  modules: ReadonlyMap<string, { cours: readonly string[]; missions: readonly string[] }>;
  missionsReussies: ReadonlySet<string>;
  journees: number;
  /** Étapes réussies par lieu à mentor, cycles complets compris. */
  etapesLieux: Readonly<Record<string, number>>;
}

export type StatutEtape = 'valide' | 'en-cours' | 'verrouille';
export interface EtapeCursus {
  id: string; nom: string; type: 'semestre' | 'stage' | 'diplome'; statut: StatutEtape;
  cours?: { lus: number; total: number }; examen?: { reussis: number; total: number }; stage?: { fait: number; requis: number };
}

/** Les étapes dans l'ordre : chaque semestre, le stage placé après lui, puis le diplôme. */
function etapesOrdonnees(c: Cursus) {
  return [
    ...c.semestres.flatMap(s => [{ type: 'semestre' as const, semestre: s }, ...c.stages.filter(t => t.apres === s.id).map(t => ({ type: 'stage' as const, stage: t }))]),
  ];
}

/** L'avancement du cursus : chaque étape n'est validée que si la précédente l'est ; le diplôme, quand toutes le sont. */
export function avancementCursus(formation: Formation, etat: EtatCursusJoueur): { titre: string; diplome: Cursus['diplome']; etapes: EtapeCursus[]; diplomeMerite: boolean } {
  const cursus = CURSUS[formation];
  let precedenteValide = true, enCoursPlace = false;
  const statut = (rempli: boolean): StatutEtape => {
    if (precedenteValide && rempli) return 'valide';
    const s: StatutEtape = precedenteValide && !enCoursPlace ? 'en-cours' : 'verrouille';
    if (s === 'en-cours') enCoursPlace = true;
    precedenteValide = false;
    return s;
  };
  const etapes: EtapeCursus[] = etapesOrdonnees(cursus).map(e => {
    if (e.type === 'semestre') {
      const contenus = e.semestre.modules.map(m => etat.modules.get(m) ?? { cours: [], missions: [] });
      const cours = contenus.flatMap(c => c.cours), missions = contenus.flatMap(c => c.missions);
      const lus = cours.filter(id => etat.coursLus.has(id)).length, reussis = missions.filter(id => etat.missionsReussies.has(id)).length;
      return { id: e.semestre.id, nom: e.semestre.nom, type: 'semestre', cours: { lus, total: cours.length }, examen: { reussis, total: missions.length },
        statut: statut(cours.length > 0 && lus === cours.length && reussis === missions.length) };
    }
    const c = e.stage.condition, fait = c.type === 'journees' ? etat.journees : etat.etapesLieux[c.lieu] ?? 0;
    return { id: e.stage.id, nom: e.stage.nom, type: 'stage', stage: { fait: Math.min(fait, c.nombre), requis: c.nombre }, statut: statut(fait >= c.nombre) };
  });
  const diplomeMerite = precedenteValide;
  etapes.push({ id: `${formation}-diplome`, nom: cursus.diplome.nom, type: 'diplome', statut: diplomeMerite ? 'valide' : 'verrouille' });
  return { titre: cursus.titre, diplome: cursus.diplome, etapes, diplomeMerite };
}

type ClientPrisma = PrismaClient | Prisma.TransactionClient;

/** Tout ce que le cursus du joueur demande, lu en base : formation, cours lus, examens réussis, journées, étapes. */
export async function chargerEtatCursus(prisma: ClientPrisma, userId: string): Promise<{ formation: Formation | null; etat: EtatCursusJoueur }> {
  const modulesCursus = [...new Set(Object.values(CURSUS).flatMap(c => c.semestres.flatMap(s => s.modules)))];
  const [avatar, carriere, lus, modules] = await Promise.all([
    prisma.avatar.findUnique({ where: { userId }, select: { config: true } }),
    prisma.userCarriere.findUnique({ where: { userId }, select: { chantierQuartier: true, progresLieux: true } }),
    prisma.userCours.findMany({ where: { userId }, select: { coursId: true } }),
    prisma.moduleAcademie.findMany({ where: { slug: { in: modulesCursus } }, select: { slug: true, cours: { select: { id: true, missionPratiqueId: true } } } }),
  ]);
  const missions = modules.flatMap(m => m.cours.flatMap(c => c.missionPratiqueId ? [c.missionPratiqueId] : []));
  const reussies = missions.length ? await prisma.userMission.findMany({ where: { userId, statut: UserMissionStatut.REUSSIE, missionId: { in: missions } }, select: { missionId: true } }) : [];
  const progres = lireProgresLieux(carriere?.progresLieux);
  return {
    formation: lireFormation(avatar?.config),
    etat: {
      coursLus: new Set(lus.map(l => l.coursId)),
      modules: new Map(modules.map(m => [m.slug, { cours: m.cours.map(c => c.id), missions: m.cours.flatMap(c => c.missionPratiqueId ? [c.missionPratiqueId] : []) }])),
      missionsReussies: new Set(reussies.map(r => r.missionId)),
      journees: lireChantierQuartier(carriere?.chantierQuartier).journees,
      etapesLieux: Object.fromEntries(Object.entries(progres).map(([slug, p]) => [slug, p.etapes + p.cycles * (ETAPES_LIEUX[slug] ?? 0)])),
    },
  };
}
