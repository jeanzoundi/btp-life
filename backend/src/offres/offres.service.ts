import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OffresService {
  constructor(private readonly prisma: PrismaService) {}

  mesCandidatures(userId: string) {
    return this.prisma.candidature.findMany({
      where: { userId },
      include: { offre: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async candidater(userId: string, offreId: string) {
    const offre = await this.prisma.offreEmploi.findUnique({
      where: { id: offreId },
      include: { profilRecherche: true },
    });
    if (!offre) throw new NotFoundException('Offre introuvable');

    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    const manquants: string[] = [];

    if (carriere) {
      if (offre.niveauMin > carriere.niveau) {
        manquants.push(`Niveau ${offre.niveauMin} requis (actuel : ${carriere.niveau})`);
      }
      if (offre.reputationMin > carriere.reputation) {
        manquants.push(`Réputation ${offre.reputationMin} requise (actuelle : ${carriere.reputation})`);
      }
    }

    if (offre.chantiersRequis > 0) {
      const nb = await this.prisma.userChantier.count({ where: { userId, statut: 'termine' } });
      if (nb < offre.chantiersRequis) {
        manquants.push(`${offre.chantiersRequis} chantier(s) réalisé(s) requis (actuel : ${nb})`);
      }
    }

    if (Array.isArray(offre.competencesRequises)) {
      for (const req of offre.competencesRequises as Array<{ slug: string; niveau: number }>) {
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

    let scoreTest: number | null = null;
    if (offre.testEntreeMissionId) {
      const userMission = await this.prisma.userMission.findUnique({
        where: { userId_missionId: { userId, missionId: offre.testEntreeMissionId } },
      });
      scoreTest = userMission?.score ?? null;
      if (userMission?.statut !== 'REUSSIE') {
        manquants.push("Test d'entrée non réussi");
      }
    }

    const acceptee = manquants.length === 0;

    const candidature = await this.prisma.candidature.create({
      data: {
        userId,
        offreId,
        statut: acceptee ? 'ACCEPTEE' : 'REFUSEE',
        scoreTest: scoreTest ?? undefined,
        feedback: { manquants, planAction: manquants.length ? 'Complète ces conditions puis repostule.' : null },
      },
    });

    if (acceptee && offre.profilRechercheId) {
      await this.prisma.userCarriere.update({
        where: { userId },
        data: { profilActuelId: offre.profilRechercheId },
      });
      await this.prisma.carriereHistorique.create({
        data: { userId, type: 'EMBAUCHE', profilId: offre.profilRechercheId, details: { offreId } },
      });
    }

    return candidature;
  }
}
