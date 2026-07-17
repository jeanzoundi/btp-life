import { Module } from '@nestjs/common';
import { CarriereController } from './carriere.controller';
import { CarriereService } from './carriere.service';
import { ProgressionService } from './progression.service';
import { BesoinsService } from './besoins.service';
import { PnjService } from './pnj.service';
import { EpargneService } from './epargne.service';
import { AvatarItemsService } from './avatar-items.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CarriereController],
  providers: [CarriereService, ProgressionService, BesoinsService, PnjService, EpargneService, AvatarItemsService],
  exports: [ProgressionService, BesoinsService, PnjService, EpargneService, AvatarItemsService],
})
export class CarriereModule {}
