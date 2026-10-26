import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CertificatsModule } from '../certificats/certificats.module';

@Module({
  imports: [CertificatsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
