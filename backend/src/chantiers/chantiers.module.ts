import { Module } from '@nestjs/common';
import { ChantiersController } from './chantiers.controller';
import { ChantiersService } from './chantiers.service';
import { CarriereModule } from '../carriere/carriere.module';

@Module({
  imports: [CarriereModule],
  controllers: [ChantiersController],
  providers: [ChantiersService],
})
export class ChantiersModule {}
