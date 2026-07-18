import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite de débit anti brute-force / credential-stuffing. Stockage en mémoire : sur Vercel
    // (serverless), le compteur n'est pas partagé entre instances et se réinitialise à froid — ça
    // reste une barrière utile sur une instance chaude, mais pour un blocage strict il faudrait un
    // store partagé (Redis/Upstash). Défaut large ici, durci par @Throttle sur les routes d'auth.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
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
    NotificationsModule,
  ],
  providers: [
    // Applique la limite de débit à toutes les routes (les routes d'auth la resserrent via @Throttle).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
