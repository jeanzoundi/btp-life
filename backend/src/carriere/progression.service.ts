import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProgressionDelta {
  xp?: number;
  reputation?: number;
  argentVirtuel?: number;
}

// Courbe de niveau : niveau N nécessite round(100 * (N-1)^2.2) XP cumulés, calibrée pour une
// progression qui va désormais jusqu'au niveau 100 (au lieu d'un plafond de contenu à 20-30
// auparavant). Le niveau 2 reste une victoire rapide (100 XP, ~1 mission) ; les paliers de
// carrière existants (niveau 12-18 selon la filière) restent à peu près à la même difficulté
// qu'avant (la courbe ne change presque pas sur cette plage) ; au-delà, elle s'étire pour que
// le niveau 30 (seuil pour devenir entrepreneur, voir CarriereService.devenirEntrepreneur)
// représente plusieurs mois de jeu régulier, et le niveau 100 plusieurs années.
export function xpRequisPourNiveau(niveau: number): number {
  return Math.round(100 * Math.pow(niveau - 1, 2.2));
}

export function xpToNiveau(xpTotal: number): number {
  let niveau = 1;
  while (xpTotal >= xpRequisPourNiveau(niveau + 1)) {
    niveau += 1;
  }
  return niveau;
}

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  async appliquerDelta(userId: string, delta: ProgressionDelta) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere) return null;

    const nouvelleXp = Math.max(0, carriere.xp + (delta.xp ?? 0));
    // Échelle 0-1000 — voir le commentaire sur UserCarriere.reputation dans schema.prisma.
    const nouvelleReputation = Math.min(1000, Math.max(0, carriere.reputation + (delta.reputation ?? 0)));
    const nouvelArgent = Math.max(0, carriere.argentVirtuel + (delta.argentVirtuel ?? 0));
    const nouveauNiveau = xpToNiveau(nouvelleXp);

    return this.prisma.userCarriere.update({
      where: { userId },
      data: {
        xp: nouvelleXp,
        reputation: nouvelleReputation,
        argentVirtuel: nouvelArgent,
        niveau: nouveauNiveau,
      },
    });
  }

  async validerCompetence(userId: string, competenceId: string, xpGagne: number, source: string) {
    const existing = await this.prisma.userCompetence.findUnique({
      where: { userId_competenceId: { userId, competenceId } },
    });
    const niveaux = await this.prisma.competenceNiveau.findMany({
      where: { competenceId },
      orderBy: { niveau: 'asc' },
    });

    const xpTotal = (existing?.xp ?? 0) + xpGagne;
    let niveauActuel = existing?.niveauActuel ?? 0;
    for (const palier of niveaux) {
      if (xpTotal >= palier.xpRequis) niveauActuel = Math.max(niveauActuel, palier.niveau);
    }

    return this.prisma.userCompetence.upsert({
      where: { userId_competenceId: { userId, competenceId } },
      create: {
        userId,
        competenceId,
        xp: xpTotal,
        niveauActuel,
        valideeLe: niveauActuel > 0 ? new Date() : null,
        source,
      },
      update: {
        xp: xpTotal,
        niveauActuel,
        valideeLe: niveauActuel > (existing?.niveauActuel ?? 0) ? new Date() : existing?.valideeLe,
        source,
      },
    });
  }

  async attribuerBadgeSiAbsent(userId: string, badgeId: string, missionSourceId?: string) {
    const already = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (already) return already;
    return this.prisma.userBadge.create({ data: { userId, badgeId, missionSourceId } });
  }
}
