import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { transactionSerializable } from '../prisma/transaction';
import { ProgressionService } from '../carriere/progression.service';
import { lireProgresLieux } from '../carriere/lieux.service';
import { lireChantierQuartier } from '../carriere/journee-chantier';

// La première journée guidée : rentrer chez soi, gagner sa première paie, la voir sur son compte, puis choisir son
// prochain objectif. Chaque étape est récompensée une seule fois, et un bonus s'ajoute quand tout est fait. Le jeu
// signale chaque étape au moment où le joueur la réussit (frontend/src/lib/premiers-pas.ts) : les gestes (entrer chez soi,
// ouvrir la banque, puis la carrière, le patrimoine ou les défis) restent déclaratifs, 500 F une seule fois. La première paie, elle,
// se vérifie dans les progrès (séance réussie chez un mentor ou journée avec Yao), et le guide ne paie que les débutants.

export const ETAPES_PREMIERS_PAS = ['logement', 'travail', 'paie', 'objectif'] as const;
export type EtapePremiersPas = (typeof ETAPES_PREMIERS_PAS)[number];
/** On vérifie sa paie une fois payé, et on choisit son prochain objectif après l'avoir vue ; le reste, dans l'ordre qu'on veut. */
export const PREREQUIS_PREMIERS_PAS: Partial<Record<EtapePremiersPas, { etape: EtapePremiersPas; message: string }>> = {
  paie: { etape: 'travail', message: 'Gagne d’abord ta première paie : une journée avec Yao ou une séance chez un mentor.' },
  objectif: { etape: 'paie', message: 'Vérifie d’abord ta paie dans la Banque du téléphone.' },
};
/** L'étape de l'ancien guide qui vaut une étape de celui-ci : la séance réussie était déjà une première paie. */
const ANCIENNES_ETAPES: Record<string, EtapePremiersPas> = { seance: 'travail' };
export const RECOMPENSES_PREMIERS_PAS = { etape: { argentVirtuel: 500, xp: 15 }, finale: { argentVirtuel: 2_000, xp: 50 } } as const;
/** Au-delà de ce niveau, le joueur connaît déjà le jeu : le guide ne s'affiche plus. */
export const NIVEAU_MAX_GUIDE = 5;

export interface PremiersPas { faites: EtapePremiersPas[]; termineLe: string | null }

/** Une première paie enregistrée : une étape gagnée chez un mentor, ou une journée faite avec Yao. */
export function premierePaieEnregistree(progresLieux: unknown, chantierQuartier: unknown) {
  return Object.values(lireProgresLieux(progresLieux)).some((p) => p.etapes > 0 || p.cycles > 0) || lireChantierQuartier(chantierQuartier).journees > 0;
}

/** Lecture bornée : seules les étapes connues comptent (l'ancienne séance vaut la première paie), une fois chacune, dans l'ordre. */
export function lirePremiersPas(brut: unknown): PremiersPas {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const brutes = Array.isArray(c.faites) ? (c.faites as unknown[]).map((e) => (typeof e === 'string' && ANCIENNES_ETAPES[e]) || e) : [];
  const faites = ETAPES_PREMIERS_PAS.filter((e) => brutes.includes(e));
  const termineLe = typeof c.termineLe === 'string' && Number.isFinite(Date.parse(c.termineLe)) ? c.termineLe : null;
  return { faites, termineLe };
}

@Injectable()
export class PremiersPasService {
  private readonly logger = new Logger(PremiersPasService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
  ) {}

  private vue(p: PremiersPas, niveau: number) {
    return { ...p, etapes: ETAPES_PREMIERS_PAS, afficher: !p.termineLe && niveau <= NIVEAU_MAX_GUIDE, recompenses: RECOMPENSES_PREMIERS_PAS };
  }

  async etat(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { premiersPas: true, niveau: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    return this.vue(lirePremiersPas(carriere.premiersPas), carriere.niveau);
  }

  /** Valide une étape : la récompense n'est versée qu'une fois, la dernière étape ajoute le bonus de fin, et un guide fini
   * ne paie plus rien, pas même une étape qu'une version précédente du guide n'avait pas. */
  async valider(userId: string, etape: string) {
    if (!(ETAPES_PREMIERS_PAS as readonly string[]).includes(etape)) throw new BadRequestException('Étape inconnue');
    const maintenant = new Date();
    const r = await transactionSerializable(this.prisma, async (tx) => {
      const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { premiersPas: true, niveau: true, progresLieux: true, chantierQuartier: true } });
      if (!carriere) throw new NotFoundException('Carrière introuvable');
      const avant = lirePremiersPas(carriere.premiersPas);
      if (avant.termineLe || avant.faites.includes(etape as EtapePremiersPas)) return { premiersPas: avant, niveau: carriere.niveau, niveaux: null, recompense: null };
      // Le guide est pour les débutants : au-delà, il ne s'affiche plus et ne paie plus.
      if (carriere.niveau > NIVEAU_MAX_GUIDE) throw new ForbiddenException('Le guide de la première journée est réservé aux débutants.');
      const prerequis = PREREQUIS_PREMIERS_PAS[etape as EtapePremiersPas];
      if (prerequis && !avant.faites.includes(prerequis.etape)) throw new BadRequestException(prerequis.message);
      if (etape === 'travail' && !premierePaieEnregistree(carriere.progresLieux, carriere.chantierQuartier)) {
        throw new BadRequestException('Aucune paie enregistrée pour l’instant : termine une journée avec Yao ou une séance chez un mentor.');
      }
      const faites = ETAPES_PREMIERS_PAS.filter((e) => e === etape || avant.faites.includes(e));
      const termine = faites.length === ETAPES_PREMIERS_PAS.length;
      const premiersPas: PremiersPas = { faites, termineLe: termine ? maintenant.toISOString() : null };
      await tx.userCarriere.update({ where: { userId }, data: { premiersPas: premiersPas as unknown as Prisma.InputJsonValue } });
      const { etape: base, finale } = RECOMPENSES_PREMIERS_PAS;
      const recompense = { argentVirtuel: base.argentVirtuel + (termine ? finale.argentVirtuel : 0), xp: base.xp + (termine ? finale.xp : 0) };
      const apres = await this.progression.appliquerDelta(userId, recompense, tx);
      return { premiersPas, recompense, niveau: apres?.niveau ?? carriere.niveau, niveaux: apres ? { avant: carriere.niveau, apres: apres.niveau } : null };
    });
    if (r.niveaux) {
      try { await this.progression.notifierNiveau(userId, r.niveaux.avant, r.niveaux.apres); }
      catch { this.logger.warn('Notification indisponible après validation du guide'); }
    }
    return { ...this.vue(r.premiersPas, r.niveau), recompense: r.recompense };
  }
}
