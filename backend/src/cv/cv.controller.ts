import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { CvService } from './cv.service';

@UseGuards(JwtAuthGuard)
@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.cvService.me(user.userId);
  }

  @Post('me/regenerer')
  regenerer(@CurrentUser() user: RequestUser) {
    return this.cvService.regenerer(user.userId);
  }
}
