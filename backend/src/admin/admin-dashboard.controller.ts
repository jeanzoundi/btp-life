import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('kpis')
  async kpis() {
    const [
      totalUsers,
      usersOnboardes,
      missionsJouees,
      missionsReussies,
      totalMissionsPubliees,
      totalChantiersTermines,
      usersPremium,
      inscritsSemaine,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userCarriere.count({ where: { profilActuelId: { not: null } } }),
      this.prisma.userMission.count({ where: { statut: { in: ['REUSSIE', 'ECHOUEE'] } } }),
      this.prisma.userMission.count({ where: { statut: 'REUSSIE' } }),
      this.prisma.mission.count({ where: { statut: 'PUBLIE' } }),
      this.prisma.userChantier.count({ where: { statut: 'termine' } }),
      this.prisma.user.count({ where: { plan: { not: 'FREE' } } }),
      this.prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } } }),
    ]);

    const tauxReussiteGlobal = missionsJouees > 0 ? Math.round((missionsReussies / missionsJouees) * 100) : 0;
    const tauxCompletionOnboarding = totalUsers > 0 ? Math.round((usersOnboardes / totalUsers) * 100) : 0;
    const tauxConversionPremium = totalUsers > 0 ? Math.round((usersPremium / totalUsers) * 100) : 0;

    // Taux de réussite par mission — détection des missions trop dures/faciles (§4.4).
    const parMission = await this.prisma.userMission.groupBy({
      by: ['missionId', 'statut'],
      _count: true,
    });
    const parMissionMap = new Map<string, { reussies: number; total: number }>();
    for (const row of parMission) {
      const entry = parMissionMap.get(row.missionId) ?? { reussies: 0, total: 0 };
      entry.total += row._count;
      if (row.statut === 'REUSSIE') entry.reussies += row._count;
      parMissionMap.set(row.missionId, entry);
    }
    const missions = await this.prisma.mission.findMany({ where: { statut: 'PUBLIE' }, select: { id: true, titre: true } });
    const tauxParMission = missions.map((m) => {
      const stats = parMissionMap.get(m.id) ?? { reussies: 0, total: 0 };
      return {
        missionId: m.id,
        titre: m.titre,
        total: stats.total,
        tauxReussite: stats.total > 0 ? Math.round((stats.reussies / stats.total) * 100) : null,
      };
    });

    return {
      totalUsers,
      inscritsSemaine,
      totalMissionsPubliees,
      missionsJouees,
      tauxReussiteGlobal,
      tauxCompletionOnboarding,
      totalChantiersTermines,
      tauxConversionPremium,
      tauxParMission,
    };
  }
}
