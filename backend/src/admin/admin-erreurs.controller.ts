import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

// Les erreurs remontées par le navigateur des joueurs (voir src/erreurs-client) : les plus récentes d'abord.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/erreurs')
export class AdminErreursController {
  constructor(private readonly prisma: PrismaService) {}

  /** Les erreurs à regarder ; celles marquées résolues avec `resolues=1`. */
  @Get()
  liste(@Query('resolues') resolues?: string) {
    return this.prisma.erreurClient.findMany({
      where: { resolueLe: resolues === '1' ? { not: null } : null },
      orderBy: { derniereLe: 'desc' },
      take: 200,
    });
  }

  /** Résolue : elle sort de la liste, et y revient si elle se reproduit. */
  @Post(':id/resolue')
  resoudre(@Param('id') id: string) {
    return this.prisma.erreurClient.update({ where: { id }, data: { resolueLe: new Date() }, select: { id: true, resolueLe: true } });
  }
}
