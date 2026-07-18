import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Secrets JWT : un secret ABSENT est fatal (sans lui, plus de fallback silencieux vers une valeur
// connue — c'était la vraie faille). Un secret laissé à la valeur par défaut connue est signalé très
// fort mais ne bloque pas le démarrage, pour ne pas risquer de couper la prod à un déploiement : à
// corriger en rotation manuelle des variables d'env.
function verifierSecretsObligatoires() {
  const manquants = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((k) => !process.env[k]);
  if (manquants.length) {
    throw new Error(`Configuration invalide — secrets JWT manquants : ${manquants.join(', ')}`);
  }
  for (const [k, defaut] of [
    ['JWT_ACCESS_SECRET', 'change-me-access-secret'],
    ['JWT_REFRESH_SECRET', 'change-me-refresh-secret'],
  ] as const) {
    if (process.env[k] === defaut) {
      // eslint-disable-next-line no-console
      console.error(`⚠️  SÉCURITÉ : ${k} utilise la valeur par défaut publique — des tokens peuvent être forgés. Remplace-la par un secret aléatoire fort SANS ATTENDRE.`);
    }
  }
}

// Configuration partagée entre le serveur local (main.ts) et le handler
// serverless Vercel (api/index.ts) — une seule source de vérité.
export async function createApp(): Promise<INestApplication> {
  verifierSecretsObligatoires();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En-têtes de sécurité HTTP (HSTS, X-Content-Type-Options, etc.). API JSON only, donc pas de CSP
  // ni de politiques cross-origin qui gêneraient l'appel depuis le frontend Vercel.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // Derrière le proxy Vercel : sans ça, req.ip vaut l'IP du proxy et toutes les requêtes partagent
  // le même compteur de rate-limit (limite mutualisée). Avec trust proxy, on lit la vraie IP client.
  app.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  return app;
}
