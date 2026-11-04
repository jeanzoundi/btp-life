import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { transactionSerializable } from '../prisma/transaction';
import { CertificatsService } from '../certificats/certificats.service';
import { quitterEquipe } from '../monde/equipe.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivrance: CertificatsService,
  ) {}

  async update(userId: string, dto: UpdateUserDto) {
    const { passwordHash: _omit, ...user } = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return user;
  }

  /** Le joueur supprime son compte, mot de passe à l'appui. Personnage, progression, messages, notifications et le reste
   * partent en cascade avec lui ; une équipe qu'il dirigeait passe à son plus ancien membre. Un compte d'administration ou
   * qui gère un compte École ou Entreprise se traite à la main : ni l'administration ni des élèves sans responsable.
   * Un mauvais mot de passe répond 400, pas 401 : le client prendrait un 401 pour une session expirée. */
  async supprimerCompte(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, role: true } });
    if (!user) throw new NotFoundException('Compte introuvable');
    if (!(await argon2.verify(user.passwordHash, password))) throw new BadRequestException('Mot de passe incorrect');
    if (user.role === 'ADMIN') throw new ForbiddenException('Un compte d’administration ne se supprime pas depuis le jeu : écris à contact@btplife.com.');
    if (await this.prisma.compteB2b.count({ where: { adminUserId: userId } })) {
      throw new ConflictException('Ton compte gère un compte École ou Entreprise : écris à contact@btplife.com pour le transférer avant de supprimer le tien.');
    }
    await transactionSerializable(this.prisma, async (tx) => {
      await quitterEquipe(tx, userId);
      await tx.user.delete({ where: { id: userId } });
    });
    return { supprime: true };
  }

  competences(userId: string) {
    return this.prisma.userCompetence.findMany({
      where: { userId },
      include: { competence: true },
    });
  }

  logiciels(userId: string) {
    return this.prisma.userLogiciel.findMany({
      where: { userId },
      include: { logiciel: true },
    });
  }

  badges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { obtenuLe: 'desc' },
    });
  }

  async certificats(userId: string) {
    // Les certificats mérités avant leur mise en place (modules finis, métier déjà atteint) arrivent à la première lecture.
    await this.delivrance.delivrer(userId);
    return this.prisma.userCertificat.findMany({
      where: { userId },
      include: { certificat: true },
      orderBy: { delivreLe: 'desc' },
    });
  }

  notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  marquerNotificationLue(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { lue: true },
    });
  }

  messages(userId: string) {
    return this.prisma.userMessage.findMany({
      where: { userId },
      include: { pnj: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  marquerMessagesLus(userId: string) {
    return this.prisma.userMessage.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });
  }
}
