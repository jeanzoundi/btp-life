import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AcademieGenerateurController } from './academie-generateur.controller';
import { AcademieGenerateurService } from './academie-generateur.service';

@Module({
  controllers: [AdminUsersController, AdminDashboardController, AcademieGenerateurController],
  providers: [AcademieGenerateurService],
})
export class AdminModule {}
