import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminDashboardController } from './admin-dashboard.controller';

@Module({
  controllers: [AdminUsersController, AdminDashboardController],
})
export class AdminModule {}
