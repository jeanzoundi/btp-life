import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import { ProgressionService } from './progression.service';
import { facteurXpLieu, lireTraits } from './traits';
import { facteurXpOutils, lirePatrimoine } from './patrimoine';
import { coequipiersPresents, facteurEquipe, REGLES_EQUIPE } from '../monde/equipe.service';

// Programmes des lieux du quartier : le contenu des séances (situations, mesures, sélections) vit
// côté client, dans frontend/src/lib/lieux-programme/ ; le serveur tient la progression de chaque
// lieu, paie les séances et fait progresser la compétence travaillée à chaque étape (compétences
// seedées dans prisma/seed.ts). Une compétence par étape : autant que d'étapes dans le programme du client.
export const COMPETENCES_LIEUX: Record<string, string[]> = {
  laboratoire: ['controle-qualite', 'controle-qualite', 'controle-qualite', 'controle-qualite', 'controle-qualite', 'controle-qualite', 'word-rapport'],
  fournisseur: ['controle-qualite', 'metre-devis', 'metre-devis', 'decision-chantier', 'metre-devis'],
  mairie: ['decision-chantier', 'lecture-plans', 'lecture-plans', 'decision-chantier', 'reception-travaux', 'reception-travaux'],
  banque: ['decision-chantier', 'decision-chantier', 'metre-devis', 'decision-chantier', 'decision-chantier'],
  agence: ['gestion-humaine', 'word-rapport', 'metre-devis', 'gestion-humaine', 'decision-chantier'],
  atelier: ['excel-btp', 'autocad-lecture', 'decision-chantier', 'word-rapport', 'revit-bim'],
  'bureau-etudes': ['lecture-plans', 'beton-ferraillage', 'geotechnique', 'beton-ferraillage', 'word-rapport', 'controle-qualite'],
  logistique: ['controle-qualite', 'securite-n1', 'decision-chantier', 'securite-n1', 'decision-chantier'],
  entreprise: ['metre-devis', 'metre-devis', 'decision-chantier', 'gestion-humaine', 'decision-chantier'],
  'jardins-residence': ['technologie-batiment', 'securite-n1', 'maconnerie', 'technologie-batiment', 'metre-devis'],
  'construction-nord': ['securite-n1', 'securite-n1', 'securite-n1', 'securite-n1', 'word-rapport'],
};
export const ETAPES_LIEUX: Record<string, number> = Object.fromEntries(Object.entries(COMPETENCES_LIEUX).map(([slug, competences]) => [slug, competences.length]));
/** Une séance payée qui compte fait gagner 30 % de sa note à la compétence de l'étape (cinq paliers de 150 XP). */
export const PART_COMPETENCE = 0.3;

// Une séance payée par lieu toutes les 20 minutes réelles ; entre-temps, c'est de l'entraînement :
// la progression avance, un quart de l'XP, ni argent ni réputation — la logique du rejeu des missions.
export const DELAI_RECOMPENSE_MS = 20 * 60_000;
const TAUX_ENTRAINEMENT = 0.25;

export interface ProgresLieuServeur { etapes: number; cycles: number; seances: number; derniereRecompenseLe: string | null }

function entier(valeur: unknown, min: number, max: number) {
  const n = Math.floor(Number(valeur));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

/** Progression de chaque lieu connu, bornée : un JSON abîmé ou absent repart de zéro. */
export function lireProgresLieux(brut: unknown): Record<string, ProgresLieuServeur> {
  const source = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(ETAPES_LIEUX).map(([slug, total]) => {
    const p = (source[slug] && typeof source[slug] === 'object' ? source[slug] : {}) as Record<string, unknown>;
    const le = typeof p.derniereRecompenseLe === 'string' && Number.isFinite(Date.parse(p.derniereRecompenseLe)) ? p.derniereRecompenseLe : null;
    return [slug, { etapes: entier(p.etapes, 0, total), cycles: entier(p.cycles, 0, 100_000), seances: entier(p.seances, 0, 10_000_000), derniereRecompenseLe: le }];
  }));
}

/** Gains d'une séance selon sa note (0-100), avant le facteur des besoins : la réussite paie, l'échec ne rapporte jamais zéro XP. */
export function gainsSeance(note: number) {
  const compte = note >= 40;
  return { compte, xp: compte ? 10 + Math.round(note * 0.4) : Math.round(note * 0.2), argent: compte ? 500 + note * 15 : 0 };
}

@Injectable()
export class LieuxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly besoins: BesoinsService,
  ) {}

  async progres(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { progresLieux: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    return lireProgresLieux(carriere.progresLieux);
  }

  async seance(userId: string, slug: string, etape: number, note: number) {
    const total = ETAPES_LIEUX[slug];
    if (!total) throw new BadRequestException('Lieu inconnu');
    // L'état du personnage module l'XP, comme pour les missions (jamais sous 70 %).
    const actualisee = await this.besoins.actualiser(userId);
    const facteurBesoins = BesoinsService.facteurPerformance(actualisee);
    // Les traits du personnage : 15 % de plus dans les lieux de son trait, 20 % sur un sans-faute pour le perfectionniste.
    const facteurTraits = facteurXpLieu(lireTraits(actualisee.traits), slug, note);
    // L'outillage acheté (mètre laser, niveau laser, ordinateur…) rend le travail plus efficace dans ses lieux.
    const facteurOutils = facteurXpOutils(lirePatrimoine(actualisee.patrimoine, new Date()).outils, slug);
    // Le travail d'équipe : un coéquipier dans le même lieu, et la séance rapporte 10 % d'XP de plus.
    const coequipiers = await coequipiersPresents(this.prisma, userId, slug);
    const gains = gainsSeance(note);
    const maintenant = Date.now();

    // Lecture, contrôle de l'étape et écriture dans une même transaction : deux envois simultanés
    // de la même séance ne la comptent (et ne la paient) qu'une fois.
    const { apres, payee, boucle } = await this.prisma.$transaction(async (tx) => {
      const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { progresLieux: true } });
      if (!carriere) throw new NotFoundException('Carrière introuvable');
      const tous = lireProgresLieux(carriere.progresLieux), avant = tous[slug];
      const attendue = avant.etapes >= total ? 0 : avant.etapes;
      if (etape !== attendue) throw new ConflictException('Cette étape n’est plus celle du jour : actualise la page.');
      const etapes = Math.min(total, etape + (gains.compte ? 1 : 0));
      const boucle = etapes >= total;
      const payee = !avant.derniereRecompenseLe || maintenant - Date.parse(avant.derniereRecompenseLe) >= DELAI_RECOMPENSE_MS;
      const apres: ProgresLieuServeur = {
        etapes, cycles: avant.cycles + (boucle ? 1 : 0), seances: avant.seances + 1,
        derniereRecompenseLe: payee ? new Date(maintenant).toISOString() : avant.derniereRecompenseLe,
      };
      await tx.userCarriere.update({ where: { userId }, data: { progresLieux: { ...tous, [slug]: apres } as unknown as Prisma.InputJsonValue } });
      return { apres, payee, boucle };
    }, { isolationLevel: 'Serializable' });

    const xp = Math.round(gains.xp * facteurBesoins * facteurTraits * facteurOutils * facteurEquipe(coequipiers) * (payee ? 1 : TAUX_ENTRAINEMENT));
    const argent = payee ? gains.argent : 0;
    const reputation = !payee ? 0 : boucle ? 3 : gains.compte && note >= 60 ? 1 : 0;
    await this.progression.appliquerDelta(userId, { xp, argentVirtuel: argent, reputation });
    // Une séance de travail fatigue et creuse, comme une mission ou une journée de chantier.
    await this.besoins.consommer(userId, { energie: 5, faim: 4 });
    // La compétence travaillée à cette étape progresse, comme après une mission réussie (pas à l'entraînement).
    let competence: { slug: string; nom: string; xp: number } | null = null;
    const slugCompetence = COMPETENCES_LIEUX[slug][etape];
    if (payee && gains.compte && slugCompetence) {
      const fiche = await this.prisma.competence.findUnique({ where: { slug: slugCompetence }, select: { id: true, nom: true } });
      if (fiche) {
        const xpCompetence = Math.round(note * PART_COMPETENCE);
        await this.progression.validerCompetence(userId, fiche.id, xpCompetence, `lieu:${slug}`);
        competence = { slug: slugCompetence, nom: fiche.nom, xp: xpCompetence };
      }
    }
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    return {
      progres: apres,
      gains: {
        xp, argent, reputation, facteurBesoins, entrainement: !payee, competence,
        equipe: coequipiers.length ? { coequipiers, bonus: REGLES_EQUIPE.bonusXp } : null,
        prochaineRecompenseLe: new Date(Date.parse(apres.derniereRecompenseLe ?? new Date(maintenant).toISOString()) + DELAI_RECOMPENSE_MS).toISOString(),
      },
      carriere,
    };
  }
}
