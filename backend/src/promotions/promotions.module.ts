import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { CarriereModule } from '../carriere/carriere.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CarriereModule, NotificationsModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
