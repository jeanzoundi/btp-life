import { Module } from '@nestjs/common';
import { OffresController } from './offres.controller';
import { OffresService } from './offres.service';
import { CertificatsModule } from '../certificats/certificats.module';

@Module({
  imports: [CertificatsModule],
  controllers: [OffresController],
  providers: [OffresService],
})
export class OffresModule {}
