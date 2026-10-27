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
// Sous Windows, Postgres relâche ses fichiers un instant après stop() : sans nouvelles tentatives,
// la suppression du dossier échoue (EBUSY) et fait passer pour cassée une migration valide.
const SUPPRESSION = { recursive: true, force: true, maxRetries: 10, retryDelay: 300 } as const;
const PORT = 5433; // différent de 5432 pour ne jamais entrer en conflit avec un Postgres local existant.
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PORT}/btp_life_test`;

async function main() {
  fs.rmSync(DATA_DIR, SUPPRESSION);

  const pg: EmbeddedPg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    // Le nettoyage est géré ci-dessous avec des tentatives adaptées aux verrous Windows.
    persistent: true,
    // Sans ça, initdb échoue sur Windows dès que la locale système contient des caractères
    // non-ASCII (ex. "French_Côte d'Ivoire.1252") — sans rapport avec la locale des données
    // de jeu elles-mêmes, seulement avec celle du cluster Postgres de test.
    initdbFlags: ['--locale=C'],
    // Postgres 18 délègue ses lectures à des processus « io_worker ». Sous Windows, l'un d'eux survit
    // parfois à l'arrêt du serveur, sans parent : il garde la sortie du serveur ouverte, pg.stop() ne
    // rend jamais la main, et le port 5433 comme le dossier de données restent pris. En lectures
    // synchrones, aucun io_worker n'est lancé.
    postgresFlags: ['-c', 'io_method=sync'],
  });

  console.log('Démarrage de Postgres embarqué (première fois : téléchargement du binaire)...');
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('btp_life_test');

  // Prisma utilise `directUrl` pour les migrations lorsqu'il est défini dans le
  // schéma. Les deux URL doivent donc viser la base embarquée : sinon une valeur
  // DIRECT_URL chargée depuis `.env` contourne ce test et peut toucher un Postgres
  // local ou distant au lieu du cluster éphémère créé ci-dessus.
  const env = { ...process.env, DATABASE_URL, DIRECT_URL: DATABASE_URL };
  const cwd = path.join(__dirname, '..');

  try {
    console.log('\n— Rejoue toutes les migrations depuis une base neuve —');
    execSync('npx prisma migrate deploy', { cwd, env, stdio: 'inherit' });
    console.log('✔ Toutes les migrations s\'appliquent proprement.');

    console.log('\n— Lance le seed complet sur cette base neuve —');
    execSync('npx prisma db seed', { cwd, env, stdio: 'inherit' });
    console.log('✔ Le seed s\'exécute sans erreur après migration.');

    execSync('npx ts-node scripts/test-campagne-transaction.ts', { cwd, env, stdio: 'inherit' });

    console.log('\n— Rejoue le seed sur des cours déjà lus —');
    execSync('npx ts-node scripts/test-seed-cours.ts', { cwd, env, stdio: 'inherit' });
    execSync('npx ts-node scripts/test-monde-transactions.ts', { cwd, env, stdio: 'inherit' });
    execSync('npx ts-node scripts/test-installation-transactions.ts', { cwd, env, stdio: 'inherit' });
    console.log('\nOK — migrations, seed rejouable et transactions campagne valides sur une base neuve.');
  } finally {
    await pg.stop();
    // Un dossier encore verrouillé ne doit ni masquer l'erreur d'une migration, ni faire échouer un
    // test réussi : il sera supprimé au prochain lancement.
    try { fs.rmSync(DATA_DIR, SUPPRESSION); } catch (e) { console.warn(`Nettoyage reporté : ${DATA_DIR} sera supprimé au prochain lancement (${(e as Error).message}).`); }
  }
}

main().catch((e) => {
  console.error('\n✘ Échec — NE PAS déployer cette migration en production.');
  console.error(e);
  process.exit(1);
});
