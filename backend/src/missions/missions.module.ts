import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { CarriereModule } from '../carriere/carriere.module';

@Module({
  imports: [CarriereModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
