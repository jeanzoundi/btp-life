/* Rejoue TOUTES les migrations Prisma depuis zéro sur une base Postgres éphémère
 * (embedded-postgres, aucune installation système requise), pour attraper une
 * migration cassée AVANT qu'elle ne parte en production. À lancer après avoir
 * écrit une nouvelle migration à la main : `npm run test:migrations`.
 */
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// `embedded-postgres` n'expose ses types qu'au travers d'un champ "exports" que la
// résolution de modules de ts-node (mode commonjs) ne suit pas — require() direct,
// fonctionnellement identique (vérifié), pour ne pas bloquer sur un souci de types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EmbeddedPostgres = require('embedded-postgres').default;

interface EmbeddedPg {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  createDatabase(name: string): Promise<void>;
}

const DATA_DIR = path.join(__dirname, '..', '.embedded-pg-data');
const PORT = 5433; // différent de 5432 pour ne jamais entrer en conflit avec un Postgres local existant.
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PORT}/btp_life_test`;

async function main() {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });

  const pg: EmbeddedPg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: false,
    // Sans ça, initdb échoue sur Windows dès que la locale système contient des caractères
    // non-ASCII (ex. "French_Côte d'Ivoire.1252") — sans rapport avec la locale des données
    // de jeu elles-mêmes, seulement avec celle du cluster Postgres de test.
    initdbFlags: ['--locale=C'],
  });

  console.log('Démarrage de Postgres embarqué (première fois : téléchargement du binaire)...');
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('btp_life_test');

  const env = { ...process.env, DATABASE_URL };
  const cwd = path.join(__dirname, '..');

  try {
    console.log('\n— Rejoue toutes les migrations depuis une base neuve —');
    execSync('npx prisma migrate deploy', { cwd, env, stdio: 'inherit' });
    console.log('✔ Toutes les migrations s\'appliquent proprement.');

    console.log('\n— Lance le seed complet sur cette base neuve —');
    execSync('npx prisma db seed', { cwd, env, stdio: 'inherit' });
    console.log('✔ Le seed s\'exécute sans erreur après migration.');

    console.log('\nOK — migrations + seed valides sur une base neuve.');
  } finally {
    await pg.stop();
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('\n✘ Échec — NE PAS déployer cette migration en production.');
  console.error(e);
  process.exit(1);
});
