import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { MissionsService } from './missions.service';
import { SubmitMissionDto } from './dto/submit-mission.dto';

@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  disponibles(@CurrentUser() user: RequestUser, @Query() query: { type?: string; niveauMax?: string }) {
    return this.missionsService.disponibles(user.userId, query);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.missionsService.detail(user.userId, id);
  }

  @Post(':id/start')
  start(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.missionsService.start(user.userId, id);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SubmitMissionDto) {
    return this.missionsService.submit(user.userId, id, dto);
  }
}
