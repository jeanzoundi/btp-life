import { Module } from '@nestjs/common';
import { CarriereController } from './carriere.controller';
import { CarriereService } from './carriere.service';
import { ProgressionService } from './progression.service';
import { BesoinsService } from './besoins.service';
import { PnjService } from './pnj.service';
import { EpargneService } from './epargne.service';
import { AvatarItemsService } from './avatar-items.service';
import { LieuxService } from './lieux.service';
import { CampagneService } from './campagne.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CertificatsModule } from '../certificats/certificats.module';

@Module({
  imports: [NotificationsModule, CertificatsModule],
  controllers: [CarriereController],
  providers: [CarriereService, ProgressionService, BesoinsService, PnjService, EpargneService, AvatarItemsService, LieuxService, CampagneService],
  exports: [ProgressionService, BesoinsService, PnjService, EpargneService, AvatarItemsService],
})
export class CarriereModule {}
