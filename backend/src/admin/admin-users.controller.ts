import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: { q?: string; page?: string; pageSize?: string }) {
    const take = Math.min(Number(query.pageSize) || 50, 200);
    const skip = (Math.max(Number(query.page) || 1, 1) - 1) * take;
    const where = query.q
      ? { OR: [{ email: { contains: query.q, mode: 'insensitive' as const } }, { nom: { contains: query.q, mode: 'insensitive' as const } }] }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nom: true,
          pseudo: true,
          role: true,
          adminSubRole: true,
          plan: true,
          banni: true,
          emailVerified: true,
          createdAt: true,
          pays: true,
        },
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: Number(query.page) || 1, pageSize: take };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const { passwordHash: _omit, ...user } = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { carriere: true, pays: true, avatar: true },
    });
    return user;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { role?: string; adminSubRole?: string | null; plan?: string; banni?: boolean },
  ) {
    const { passwordHash: _omit, ...user } = await this.prisma.user.update({
      where: { id },
      data: body as never,
    });
    return user;
  }
}
