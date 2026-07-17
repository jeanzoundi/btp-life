import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { SubscribePushDto, UnsubscribePushDto } from './dto/notifications.dto';

// La lecture (liste + marquer-lue) existait déjà dans UsersController (/users/me/notifications) —
// ce contrôleur ne couvre que ce qui manquait : l'abonnement push et sa clé publique.
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  vapidPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? null };
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: RequestUser, @Body() dto: SubscribePushDto) {
    return this.notificationsService.subscribe(user.userId, dto);
  }

  @Post('unsubscribe')
  unsubscribe(@CurrentUser() user: RequestUser, @Body() dto: UnsubscribePushDto) {
    return this.notificationsService.unsubscribe(user.userId, dto.endpoint);
  }
}
