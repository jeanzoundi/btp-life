import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { CarriereModule } from '../carriere/carriere.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CertificatsModule } from '../certificats/certificats.module';

@Module({
  imports: [CarriereModule, NotificationsModule, CertificatsModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
