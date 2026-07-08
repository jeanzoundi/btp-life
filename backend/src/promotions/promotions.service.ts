import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { PnjService } from '../carriere/pnj.service';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly pnj: PnjService,
  ) {}

  async eligibles(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere?.profilActuelId) return [];

    const regles = await this.prisma.reglePromotion.findMany({
      where: { profilSourceId: carriere.profilActuelId },
      include: { profilCible: true },
    });

    const resultats: Array<{ regle: (typeof regles)[number]; manquants: string[]; eligible: boolean }> = [];
    for (const regle of regles) {
      const manquants = await this.evaluerConditions(userId, carriere, regle.conditions as Record<string, unknown>);
      resultats.push({ regle, manquants, eligible: manquants.length === 0 });
    }
    return resultats;
  }

  private async evaluerConditions(
    userId: string,
    carriere: { niveau: number; reputation: number },
    conditions: Record<string, unknown>,
  ) {
    const manquants: string[] = [];
    if (typeof conditions.reputationMin === 'number' && carriere.reputation < conditions.reputationMin) {
      manquants.push(`Réputation ${conditions.reputationMin} requise`);
    }
    if (typeof conditions.niveauMin === 'number' && carriere.niveau < conditions.niveauMin) {
      manquants.push(`Niveau ${conditions.niveauMin} requis`);
    }
    if (Array.isArray(conditions.competences)) {
      for (const req of conditions.competences as Array<{ slug: string; niveau: number }>) {
        const competence = await this.prisma.competence.findUnique({ where: { slug: req.slug } });
        const userCompetence = competence
          ? await this.prisma.userCompetence.findUnique({
              where: { userId_competenceId: { userId, competenceId: competence.id } },
            })
          : null;
        if (!userCompetence || userCompetence.niveauActuel < req.niveau) {
          manquants.push(`${competence?.nom ?? req.slug} niveau ${req.niveau} requis`);
        }
      }
    }
    if (typeof conditions.chantiersReussis === 'number') {
      const count = await this.prisma.userChantier.count({
        where: { userId, statut: 'termine', noteFinale: { in: ['A', 'B'] } },
      });
      if (count < conditions.chantiersReussis) manquants.push(`${conditions.chantiersReussis} chantiers réussis requis`);
    }
    if (typeof conditions.examenMissionId === 'string') {
      const um = await this.prisma.userMission.findUnique({
        where: { userId_missionId: { userId, missionId: conditions.examenMissionId } },
      });
      if (um?.statut !== 'REUSSIE') manquants.push("Examen de passage non réussi");
    }
    return manquants;
  }

  async demander(userId: string, regleId: string) {
    const regle = await this.prisma.reglePromotion.findUnique({
      where: { id: regleId },
      include: { profilCible: true, profilSource: true },
    });
    if (!regle) throw new NotFoundException('Règle de promotion introuvable');

    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    if (carriere.profilActuelId !== regle.profilSourceId) {
      throw new BadRequestException("Cette promotion ne concerne pas ton profil actuel");
    }

    const manquants = await this.evaluerConditions(userId, carriere, regle.conditions as Record<string, unknown>);
    const statut = manquants.length === 0 ? 'ACCEPTEE' : 'REFUSEE';

    const demande = await this.prisma.demandePromotion.create({
      data: {
        userId,
        regleId,
        statut,
        evaluation: { manquants },
        decideeLe: new Date(),
      },
    });

    if (statut === 'ACCEPTEE') {
      await this.prisma.userCarriere.update({
        where: { userId },
        data: { profilActuelId: regle.profilCibleId },
      });
      await this.prisma.carriereHistorique.create({
        data: { userId, type: 'PROMOTION', profilId: regle.profilCibleId, details: { regleId } },
      });
      await this.progression.appliquerDelta(userId, { xp: 100, reputation: 5, argentVirtuel: 200 });
      await this.pnj.surPromotion(userId, regle.profilSource.nom, regle.profilCible.nom);
    }

    return demande;
  }

  mesDemandes(userId: string) {
    return this.prisma.demandePromotion.findMany({
      where: { userId },
      include: { regle: { include: { profilCible: true, profilSource: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
