import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: string, dto: UpdateUserDto) {
    const { passwordHash: _omit, ...user } = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return user;
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

  certificats(userId: string) {
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
