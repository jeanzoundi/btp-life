import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CarriereModule } from './carriere/carriere.module';
import { MissionsModule } from './missions/missions.module';
import { ChantiersModule } from './chantiers/chantiers.module';
import { CvModule } from './cv/cv.module';
import { OffresModule } from './offres/offres.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CatalogModule } from './common/catalog/catalog.module';
import { AdminModule } from './admin/admin.module';
import { AdminCrudModule } from './common/admin-crud/admin-crud.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CarriereModule,
    MissionsModule,
    ChantiersModule,
    CvModule,
    OffresModule,
    PromotionsModule,
    CatalogModule,
    AdminModule,
    AdminCrudModule,
  ],
})
export class AppModule {}
