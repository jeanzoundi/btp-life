import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CvService {
  constructor(private readonly prisma: PrismaService) {}

  async regenerer(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { pays: true, avatar: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const [carriere, competences, logiciels, chantiers, badges, certificats, historique] = await Promise.all([
      this.prisma.userCarriere.findUnique({
        where: { userId },
        include: { profilActuel: true, metierCible: true },
      }),
      this.prisma.userCompetence.findMany({ where: { userId }, include: { competence: true } }),
      this.prisma.userLogiciel.findMany({ where: { userId }, include: { logiciel: true } }),
      this.prisma.userChantier.findMany({
        where: { userId, statut: 'termine' },
        include: { chantier: true },
        orderBy: { termineLe: 'desc' },
      }),
      this.prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
      this.prisma.userCertificat.findMany({ where: { userId }, include: { certificat: true } }),
      this.prisma.carriereHistorique.findMany({ where: { userId }, orderBy: { dateVirtuelle: 'desc' } }),
    ]);

    const contenu = {
      identite: {
        nom: user.pseudo ?? user.nom,
        avatar: user.avatar,
        pays: user.pays?.nom,
        referentiel: user.pays?.nom ?? 'Générique',
      },
      profilActuel: carriere?.profilActuel?.nom ?? null,
      metierCible: carriere?.metierCible?.nom ?? null,
      niveau: carriere?.niveau ?? 1,
      xp: carriere?.xp ?? 0,
      reputation: carriere?.reputation ?? 500,
      competences: competences.map((c) => ({ nom: c.competence.nom, niveau: c.niveauActuel })),
      logiciels: logiciels.map((l) => ({ nom: l.logiciel.nom, niveau: l.niveauMaitrise })),
      experiences: chantiers.map((c) => ({
        chantier: c.chantier.nom,
        note: c.noteFinale,
        termineLe: c.termineLe,
      })),
      badges: badges.map((b) => ({ nom: b.badge.nom, rarete: b.badge.rarete, obtenuLe: b.obtenuLe })),
      certificats: certificats.map((c) => ({
        nom: c.certificat.nom,
        numero: c.numeroUnique,
        delivreLe: c.delivreLe,
      })),
      historique,
    };

    return this.prisma.cvVirtuel.upsert({
      where: { userId },
      create: { userId, contenu },
      update: { contenu },
    });
  }

  async me(userId: string) {
    const cv = await this.prisma.cvVirtuel.findUnique({ where: { userId } });
    if (!cv) return this.regenerer(userId);
    return cv;
  }
}
