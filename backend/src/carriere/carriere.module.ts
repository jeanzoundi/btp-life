import { Module } from '@nestjs/common';
import { CarriereController } from './carriere.controller';
import { CarriereService } from './carriere.service';
import { ProgressionService } from './progression.service';
import { BesoinsService } from './besoins.service';
import { PnjService } from './pnj.service';

@Module({
  controllers: [CarriereController],
  providers: [CarriereService, ProgressionService, BesoinsService, PnjService],
  exports: [ProgressionService, BesoinsService, PnjService],
})
export class CarriereModule {}
