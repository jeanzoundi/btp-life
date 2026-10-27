import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { transactionSerializable } from '../prisma/transaction';
import { ProgressionService } from '../carriere/progression.service';

// Le premier quart d'heure guidé : cinq gestes pour découvrir le jeu, chacun récompensé une seule fois, et un bonus quand
// tout est fait. Le jeu signale chaque étape au moment où le joueur la réussit (frontend/src/lib/premiers-pas.ts).

export const ETAPES_PREMIERS_PAS = ['deplacement', 'telephone', 'lieu', 'seance', 'quartier'] as const;
export type EtapePremiersPas = (typeof ETAPES_PREMIERS_PAS)[number];
export const RECOMPENSES_PREMIERS_PAS = { etape: { argentVirtuel: 500, xp: 15 }, finale: { argentVirtuel: 2_000, xp: 50 } } as const;
/** Au-delà de ce niveau, le joueur connaît déjà le jeu : le guide ne s'affiche plus. */
export const NIVEAU_MAX_GUIDE = 5;

export interface PremiersPas { faites: EtapePremiersPas[]; termineLe: string | null }

/** Lecture bornée : seules les étapes connues comptent, une fois chacune, dans l'ordre du guide. */
export function lirePremiersPas(brut: unknown): PremiersPas {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const faites = Array.isArray(c.faites) ? ETAPES_PREMIERS_PAS.filter((e) => (c.faites as unknown[]).includes(e)) : [];
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

  /** Valide une étape : la récompense n'est versée qu'une fois, et la dernière étape ajoute le bonus de fin. */
  async valider(userId: string, etape: string) {
    if (!(ETAPES_PREMIERS_PAS as readonly string[]).includes(etape)) throw new BadRequestException('Étape inconnue');
    const maintenant = new Date();
    const r = await transactionSerializable(this.prisma, async (tx) => {
      const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { premiersPas: true, niveau: true } });
      if (!carriere) throw new NotFoundException('Carrière introuvable');
      const avant = lirePremiersPas(carriere.premiersPas);
      if (avant.faites.includes(etape as EtapePremiersPas)) return { premiersPas: avant, niveau: carriere.niveau, niveaux: null, recompense: null };
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
