import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsCronController } from './notifications-cron.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, NotificationsCronController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
