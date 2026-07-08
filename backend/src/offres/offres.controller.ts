import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { OffresService } from './offres.service';

@UseGuards(JwtAuthGuard)
@Controller('offres')
export class OffresController {
  constructor(private readonly offresService: OffresService) {}

  @Get('candidatures/mine')
  mesCandidatures(@CurrentUser() user: RequestUser) {
    return this.offresService.mesCandidatures(user.userId);
  }

  @Post(':id/candidater')
  candidater(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.offresService.candidater(user.userId, id);
  }
}
