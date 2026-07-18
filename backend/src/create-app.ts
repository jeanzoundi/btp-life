import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Secrets sans lesquels l'app ne doit PAS démarrer : mieux vaut planter au boot que tourner avec un
// secret par défaut connu (tokens forgeables) ou un JWT non signable. Vérifié une seule fois ici.
function verifierSecretsObligatoires() {
  const manquants = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((k) => !process.env[k]);
  for (const [k, defaut] of [
    ['JWT_ACCESS_SECRET', 'change-me-access-secret'],
    ['JWT_REFRESH_SECRET', 'change-me-refresh-secret'],
  ] as const) {
    if (process.env[k] === defaut) manquants.push(`${k} (valeur par défaut non modifiée)`);
  }
  if (manquants.length) {
    throw new Error(`Configuration invalide — secrets manquants ou non sécurisés : ${manquants.join(', ')}`);
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
