import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionModerationDto } from './dto/moderation.dto';

/** Un message signalé, avec le décompte de ses signalements par motif. */
export interface MessageSignale {
  messageId: string;
  texte: string;
  envoyeLe: string;
  retire: boolean;
  auteur: { id: string; email: string; pseudo: string | null; banni: boolean };
  signalements: number;
  motifs: Record<string, number>;
  dernierLe: string;
  decision: string | null;
  traiteLe: string | null;
}

const DECISION_ENREGISTREE = { retirer: 'retire', bannir: 'banni', ecarter: 'ecarte' } as const;

// La modération du chat du quartier : les messages signalés par les joueurs, et la décision de l'équipe.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/moderation')
export class AdminModerationController {
  constructor(private readonly prisma: PrismaService) {}

  /** Les messages signalés en attente, du plus récent au plus ancien ; l'historique des décisions avec `traites=1`. */
  @Get('signalements')
  async signalements(@Query('traites') traites?: string): Promise<MessageSignale[]> {
    const lignes = await this.prisma.signalementMessage.findMany({
      where: traites === '1' ? { traiteLe: { not: null } } : { traiteLe: null },
      orderBy: { creeLe: 'desc' },
      take: 500,
      select: {
        motif: true, creeLe: true, traiteLe: true, decision: true,
        message: { select: { id: true, texte: true, masque: true, createdAt: true, user: { select: { id: true, email: true, pseudo: true, banni: true } } } },
      },
    });
    const parMessage = new Map<string, MessageSignale>();
    for (const { motif, creeLe, traiteLe, decision, message } of lignes) {
      const fiche = parMessage.get(message.id) ?? {
        messageId: message.id, texte: message.texte, envoyeLe: message.createdAt.toISOString(), retire: message.masque, auteur: message.user,
        signalements: 0, motifs: {}, dernierLe: creeLe.toISOString(), decision, traiteLe: traiteLe?.toISOString() ?? null,
      };
      fiche.signalements += 1;
      fiche.motifs[motif] = (fiche.motifs[motif] ?? 0) + 1;
      parMessage.set(message.id, fiche);
    }
    return [...parMessage.values()];
  }

  /** Retirer le message, bannir son auteur (et retirer le message), ou écarter les signalements (le message revient). */
  @Post('signalements/:messageId')
  async decider(@Param('messageId') messageId: string, @Body() dto: DecisionModerationDto) {
    const message = await this.prisma.messageQuartier.findUnique({ where: { id: messageId }, select: { userId: true } });
    if (!message) throw new NotFoundException('Message introuvable');
    const decision = DECISION_ENREGISTREE[dto.decision];
    await this.prisma.$transaction([
      this.prisma.messageQuartier.update({ where: { id: messageId }, data: { masque: dto.decision !== 'ecarter' } }),
      this.prisma.signalementMessage.updateMany({ where: { messageId, traiteLe: null }, data: { traiteLe: new Date(), decision } }),
      ...(dto.decision === 'bannir' ? [this.prisma.user.update({ where: { id: message.userId }, data: { banni: true } })] : []),
    ]);
    return { messageId, decision };
  }
}
