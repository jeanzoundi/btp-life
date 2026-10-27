import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { nomPublic, REGLES_EN_LIGNE } from './en-ligne.service';

// Les équipes de quartier : des joueurs connectés s'invitent, puis travaillent ensemble. Une séance faite pendant qu'un
// coéquipier est dans le même lieu rapporte plus d'XP (voir lieux.service.ts). Un joueur n'est que dans une équipe à la fois.

export const REGLES_EQUIPE = { membresMax: 4, bonusXp: 0.1, invitationsMax: 5 } as const;

const AVEC_NOM = { pseudo: true, avatar: { select: { nomPersonnage: true } } } as const;
const recent = (date: Date | null | undefined, maintenant: Date) => !!date && maintenant.getTime() - date.getTime() < REGLES_EN_LIGNE.presenceMs;

/** Les coéquipiers signalés récemment dans le même lieu que le joueur : leur nom public. */
export async function coequipiersPresents(prisma: Pick<PrismaService, 'membreEquipe' | 'presenceMonde'>, userId: string, lieu: string, maintenant = new Date()) {
  const membre = await prisma.membreEquipe.findUnique({ where: { userId }, select: { equipeId: true } });
  if (!membre) return [];
  const presents = await prisma.presenceMonde.findMany({
    where: {
      lieu, userId: { not: userId }, majLe: { gte: new Date(maintenant.getTime() - REGLES_EN_LIGNE.presenceMs) },
      user: { banni: false, membreEquipe: { equipeId: membre.equipeId } },
    },
    select: { user: { select: AVEC_NOM } },
  });
  return presents.map((p) => nomPublic(p.user));
}

/** Le facteur d'XP du travail d'équipe : un coéquipier présent suffit. */
export const facteurEquipe = (coequipiers: readonly string[]) => (coequipiers.length ? 1 + REGLES_EQUIPE.bonusXp : 1);

@Injectable()
export class EquipeService {
  constructor(private readonly prisma: PrismaService) {}

  private transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(operation, { isolationLevel: 'Serializable', timeout: 10_000 });
  }

  /** L'équipe du joueur (ses membres, en ligne ou non, et leur lieu) et les invitations qu'il a reçues. */
  async etat(userId: string, maintenant = new Date()) {
    const [membre, invitations] = await Promise.all([
      this.prisma.membreEquipe.findUnique({
        where: { userId },
        select: { equipe: { select: { id: true, chefId: true, membres: {
          orderBy: { rejointLe: 'asc' },
          select: { userId: true, user: { select: { ...AVEC_NOM, presenceMonde: { select: { majLe: true, lieu: true } } } } },
        } } } },
      }),
      this.prisma.invitationEquipe.findMany({
        where: { versId: userId }, orderBy: { creeLe: 'desc' }, take: REGLES_EQUIPE.invitationsMax,
        select: { id: true, de: { select: AVEC_NOM } },
      }),
    ]);
    return {
      equipe: membre ? {
        id: membre.equipe.id,
        chefId: membre.equipe.chefId,
        membres: membre.equipe.membres.map((m) => ({
          userId: m.userId, nom: nomPublic(m.user), enLigne: m.userId === userId || recent(m.user.presenceMonde?.majLe, maintenant), lieu: m.user.presenceMonde?.lieu ?? null,
        })),
      } : null,
      invitations: invitations.map((i) => ({ id: i.id, de: nomPublic(i.de) })),
    };
  }

  /** Inviter un voisin connecté : l'équipe se crée au besoin, avec l'inviteur pour chef ; quatre joueurs au plus. */
  async inviter(userId: string, versId: string, maintenant = new Date()) {
    if (versId === userId) throw new BadRequestException('Invite plutôt un voisin.');
    const cible = await this.prisma.presenceMonde.findUnique({ where: { userId: versId }, select: { majLe: true, user: { select: { banni: true } } } });
    if (!cible || cible.user.banni || !recent(cible.majLe, maintenant)) throw new BadRequestException('Ce voisin n’est plus connecté.');
    await this.transaction(async (tx) => {
      const membre = await tx.membreEquipe.findUnique({ where: { userId }, select: { equipeId: true } });
      const equipeId = membre?.equipeId ?? (await tx.equipeQuartier.create({ data: { chefId: userId, membres: { create: { userId } } }, select: { id: true } })).id;
      const [membres, dejaMembre] = await Promise.all([
        tx.membreEquipe.count({ where: { equipeId } }),
        tx.membreEquipe.findFirst({ where: { equipeId, userId: versId }, select: { userId: true } }),
      ]);
      if (dejaMembre) throw new ConflictException('Ce voisin est déjà dans ton équipe.');
      if (membres >= REGLES_EQUIPE.membresMax) throw new BadRequestException(`Une équipe compte ${REGLES_EQUIPE.membresMax} joueurs au plus.`);
      await tx.invitationEquipe.upsert({
        where: { equipeId_versId: { equipeId, versId } },
        create: { equipeId, deId: userId, versId },
        update: { deId: userId, creeLe: maintenant },
      });
    });
    return this.etat(userId, maintenant);
  }

  /** Répondre à une invitation ; accepter fait quitter l'équipe précédente. */
  async repondre(userId: string, invitationId: string, accepter: boolean, maintenant = new Date()) {
    await this.transaction(async (tx) => {
      const invitation = await tx.invitationEquipe.findUnique({ where: { id: invitationId } });
      if (!invitation || invitation.versId !== userId) throw new NotFoundException('Invitation introuvable.');
      await tx.invitationEquipe.delete({ where: { id: invitationId } });
      if (!accepter) return;
      if ((await tx.membreEquipe.count({ where: { equipeId: invitation.equipeId } })) >= REGLES_EQUIPE.membresMax) {
        throw new BadRequestException('Cette équipe est déjà complète.');
      }
      await this.quitterDans(tx, userId);
      await tx.membreEquipe.create({ data: { userId, equipeId: invitation.equipeId } });
    });
    return this.etat(userId, maintenant);
  }

  /** Quitter son équipe. */
  async quitter(userId: string, maintenant = new Date()) {
    await this.transaction((tx) => this.quitterDans(tx, userId));
    return this.etat(userId, maintenant);
  }

  /** Le plus ancien membre restant devient chef ; une équipe vidée disparaît, avec ses invitations. */
  private async quitterDans(tx: Prisma.TransactionClient, userId: string) {
    const membre = await tx.membreEquipe.findUnique({ where: { userId }, select: { equipeId: true, equipe: { select: { chefId: true } } } });
    if (!membre) return;
    await tx.membreEquipe.delete({ where: { userId } });
    const suivant = await tx.membreEquipe.findFirst({ where: { equipeId: membre.equipeId }, orderBy: { rejointLe: 'asc' }, select: { userId: true } });
    if (!suivant) await tx.equipeQuartier.delete({ where: { id: membre.equipeId } });
    else if (membre.equipe.chefId === userId) await tx.equipeQuartier.update({ where: { id: membre.equipeId }, data: { chefId: suivant.userId } });
  }
}
