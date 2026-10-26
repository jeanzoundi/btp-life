import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CertificatsService } from '../certificats/certificats.service';

@Injectable()
export class OffresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificats: CertificatsService,
  ) {}

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
      const requis = offre.competencesRequises as Array<{ slug: string; niveau: number }>;
      // Groupé en deux requêtes au lieu de 2 par compétence requise.
      const competences = await this.prisma.competence.findMany({
        where: { slug: { in: requis.map((r) => r.slug) } },
      });
      const parSlug = new Map(competences.map((c) => [c.slug, c]));
      const userCompetences = await this.prisma.userCompetence.findMany({
        where: { userId, competenceId: { in: competences.map((c) => c.id) } },
      });
      const niveauParCompetence = new Map(userCompetences.map((uc) => [uc.competenceId, uc.niveauActuel]));

      for (const req of requis) {
        const competence = parSlug.get(req.slug);
        const niveauActuel = competence ? (niveauParCompetence.get(competence.id) ?? 0) : 0;
        if (niveauActuel < req.niveau) {
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
      // Jamais de recul : un poste de la même filière et de rang égal ou inférieur ne remplace pas le poste actuel, le
      // joueur change seulement d'employeur (même réflexe que Math.max sur le niveau dans setProfilActuel).
      const actuel = carriere?.profilActuelId
        ? await this.prisma.profil.findUnique({ where: { id: carriere.profilActuelId }, select: { famille: true, ordre: true } })
        : null;
      const recul = !!actuel && !!offre.profilRecherche && actuel.famille === offre.profilRecherche.famille && actuel.ordre >= offre.profilRecherche.ordre;
      if (!recul) {
        await this.prisma.userCarriere.update({
          where: { userId },
          data: { profilActuelId: offre.profilRechercheId },
        });
      }
      await this.prisma.carriereHistorique.create({
        data: {
          userId,
          type: 'EMBAUCHE',
          profilId: recul ? carriere!.profilActuelId : offre.profilRechercheId,
          details: { offreId, ...(recul ? { posteConserve: true } : {}) },
        },
      });
      // Une embauche au métier visé, ou plus haut dans la filière, termine aussi le parcours.
      await this.certificats.delivrer(userId);
    }

    return candidature;
  }
}
