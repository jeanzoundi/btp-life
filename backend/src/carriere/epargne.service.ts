import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Épargne à la Banque : un vrai produit financier plutôt qu'une page vitrine — déposer de
// l'argent personnel le met à l'abri ET le fait fructifier, calculé paresseusement (comme les
// besoins) pour fonctionner sans tâche planifiée en environnement serverless.
export const TAUX_INTERET_JOURNALIER = 0.004; // 0,4 %/jour, composé
export const JOURS_INTERET_MAX_PRIS_EN_COMPTE = 60; // plafond pour éviter un retour après des mois

@Injectable()
export class EpargneService {
  constructor(private readonly prisma: PrismaService) {}

  /** Applique l'intérêt accumulé depuis la dernière visite et persiste le résultat. */
  async actualiser(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    if (carriere.epargne <= 0) return carriere;

    const maintenant = new Date();
    const joursEcoules = Math.min(
      JOURS_INTERET_MAX_PRIS_EN_COMPTE,
      Math.max(0, (maintenant.getTime() - carriere.epargneMajLe.getTime()) / 86_400_000),
    );
    if (joursEcoules < 1) return carriere;

    const nouvelleEpargne = Math.round(carriere.epargne * Math.pow(1 + TAUX_INTERET_JOURNALIER, joursEcoules));
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { epargne: nouvelleEpargne, epargneMajLe: maintenant },
    });
  }

  async deposer(userId: string, montant: number) {
    if (!Number.isInteger(montant) || montant <= 0) throw new BadRequestException('Montant invalide');
    const carriere = await this.actualiser(userId);
    if (carriere.argentVirtuel < montant) {
      throw new BadRequestException(`Solde insuffisant : ${montant.toLocaleString('fr-FR')} F requis (disponible ${carriere.argentVirtuel.toLocaleString('fr-FR')} F)`);
    }
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { argentVirtuel: { decrement: montant }, epargne: { increment: montant } },
    });
  }

  async retirer(userId: string, montant: number) {
    if (!Number.isInteger(montant) || montant <= 0) throw new BadRequestException('Montant invalide');
    const carriere = await this.actualiser(userId);
    if (carriere.epargne < montant) {
      throw new BadRequestException(`Épargne insuffisante : ${montant.toLocaleString('fr-FR')} F requis (épargné ${carriere.epargne.toLocaleString('fr-FR')} F)`);
    }
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { argentVirtuel: { increment: montant }, epargne: { decrement: montant } },
    });
  }
}
