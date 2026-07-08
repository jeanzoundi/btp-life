import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { PromotionsService } from './promotions.service';

@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('eligibles')
  eligibles(@CurrentUser() user: RequestUser) {
    return this.promotionsService.eligibles(user.userId);
  }

  @Get('mine')
  mine(@CurrentUser() user: RequestUser) {
    return this.promotionsService.mesDemandes(user.userId);
  }

  @Post(':regleId/demander')
  demander(@CurrentUser() user: RequestUser, @Param('regleId') regleId: string) {
    return this.promotionsService.demander(user.userId, regleId);
  }
}
