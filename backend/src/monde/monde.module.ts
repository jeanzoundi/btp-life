import { Module } from '@nestjs/common';
import { CarriereModule } from '../carriere/carriere.module';
import { MondeController } from './monde.controller';
import { DefisService } from './defis.service';
import { EntrepriseService } from './entreprise.service';
import { PatrimoineService } from './patrimoine.service';
import { TransportService } from './transport.service';
import { EnLigneService } from './en-ligne.service';

@Module({
  imports: [CarriereModule],
  controllers: [MondeController],
  providers: [TransportService, DefisService, PatrimoineService, EntrepriseService, EnLigneService],
})
export class MondeModule {}
