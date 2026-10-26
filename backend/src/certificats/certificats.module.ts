import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CertificatsService } from './certificats.service';

@Module({
  imports: [NotificationsModule],
  providers: [CertificatsService],
  exports: [CertificatsService],
})
export class CertificatsModule {}
