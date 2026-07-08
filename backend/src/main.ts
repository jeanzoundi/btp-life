import { createApp } from './create-app';

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BTP Life API listening on http://localhost:${port}/api`);
}

bootstrap();
