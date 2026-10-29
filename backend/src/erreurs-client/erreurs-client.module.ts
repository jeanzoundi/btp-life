import { Module } from '@nestjs/common';
import { ErreursClientController } from './erreurs-client.controller';
import { ErreursClientService } from './erreurs-client.service';

@Module({
  controllers: [ErreursClientController],
  providers: [ErreursClientService],
})
export class ErreursClientModule {}
