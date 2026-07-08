import type { IncomingMessage, ServerResponse } from 'http';
import type { Express } from 'express';
import { createApp } from '../src/create-app';

// Point d'entrée serverless Vercel : une seule instance Nest réutilisée
// entre les invocations tant que la fonction reste "chaude".
let serverPromise: Promise<Express> | null = null;

async function getServer(): Promise<Express> {
  if (!serverPromise) {
    serverPromise = createApp().then(async (app) => {
      await app.init();
      return app.getHttpAdapter().getInstance() as Express;
    });
  }
  return serverPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getServer();
  server(req, res);
}
