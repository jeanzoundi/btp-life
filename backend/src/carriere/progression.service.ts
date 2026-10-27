import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AvatarItemsService } from './avatar-items.service';
import { facteurReputation, lireTraits } from './traits';
import { NotificationsService } from '../notifications/notifications.service';
import { MESSAGES_BADGE, MESSAGES_NIVEAU, messageAleatoire } from '../notifications/messages';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarItems: AvatarItemsService,
    private readonly notifications: NotificationsService,
  ) {}

  async appliquerDelta(userId: string, delta: ProgressionDelta, transaction?: Prisma.TransactionClient) {
    // Lecture et écriture dans la même transaction : deux récompenses arrivant presque en
    // même temps ne peuvent plus s'écraser en repartant toutes les deux de l'ancien solde.
    const appliquer = async (tx: Prisma.TransactionClient) => {
      const carriere = await tx.userCarriere.findUnique({ where: { userId } });
      if (!carriere) return null;

      const nouvelleXp = Math.max(0, carriere.xp + (delta.xp ?? 0));
      // Échelle 0-1000 — voir le commentaire sur UserCarriere.reputation dans schema.prisma.
      // L'ambitieux tire 25 % de plus de chaque reconnaissance (les pertes, elles, ne sont pas amplifiées).
      const gainReputation = (delta.reputation ?? 0) > 0 ? Math.round((delta.reputation ?? 0) * facteurReputation(lireTraits(carriere.traits))) : (delta.reputation ?? 0);
      const nouvelleReputation = Math.min(1000, Math.max(0, carriere.reputation + gainReputation));
      const nouvelArgent = Math.max(0, carriere.argentVirtuel + (delta.argentVirtuel ?? 0));
      const nouveauNiveau = Math.max(carriere.niveau, xpToNiveau(nouvelleXp));
      const resultat = await tx.userCarriere.update({
        where: { userId },
        data: { xp: nouvelleXp, reputation: nouvelleReputation, argentVirtuel: nouvelArgent, niveau: nouveauNiveau },
      });
      return { carriere, resultat, nouveauNiveau };
    };
    const operation = transaction ? await appliquer(transaction)
      : await this.prisma.$transaction(appliquer, { isolationLevel: 'Serializable' });
    if (!operation) return null;
    const { carriere, resultat, nouveauNiveau } = operation;

    // Avec une transaction appelante, les effets externes attendent son commit.
    if (!transaction) await this.notifierNiveau(userId, carriere.niveau, nouveauNiveau);
    return resultat;
  }

  async notifierNiveau(userId: string, ancienNiveau: number, nouveauNiveau: number) {
    if (nouveauNiveau > ancienNiveau) {
      await this.avatarItems.debloquerItemsEligibles(userId, `niveau:${nouveauNiveau}`);
      await this.notifications.envoyerNotification(userId, {
        type: NotificationType.NIVEAU,
        titre: `Niveau ${nouveauNiveau} !`,
        contenu: messageAleatoire(MESSAGES_NIVEAU),
        lien: '/app',
      });
    }

  }

  async validerCompetence(userId: string, competenceId: string, xpGagne: number, source: string, transaction?: Prisma.TransactionClient) {
    const db = transaction ?? this.prisma;
    const existing = await db.userCompetence.findUnique({
      where: { userId_competenceId: { userId, competenceId } },
    });
    const niveaux = await db.competenceNiveau.findMany({
      where: { competenceId },
      orderBy: { niveau: 'asc' },
    });

    const xpTotal = (existing?.xp ?? 0) + xpGagne;
    let niveauActuel = existing?.niveauActuel ?? 0;
    for (const palier of niveaux) {
      if (xpTotal >= palier.xpRequis) niveauActuel = Math.max(niveauActuel, palier.niveau);
    }

    return db.userCompetence.upsert({
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
    const userBadge = await this.prisma.userBadge.create({ data: { userId, badgeId, missionSourceId } });

    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    await this.notifications.envoyerNotification(userId, {
      type: NotificationType.BADGE,
      titre: badge ? `Badge débloqué : ${badge.nom}` : 'Nouveau badge débloqué !',
      contenu: messageAleatoire(MESSAGES_BADGE),
      lien: '/app/profil',
    });

    return userBadge;
  }
}
