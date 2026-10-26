import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProgressionService } from '../src/carriere/progression.service';
import { DefisService, lireEtatDefis } from '../src/monde/defis.service';
import { TransportService } from '../src/monde/transport.service';
import { DEFIS_JOUR } from '../prisma/seed-data/defis-data';

for (const cle of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[cle] ?? 'http://absent');
  if (url.hostname !== 'localhost' || url.port !== '5433' || url.pathname !== '/btp_life_test') throw new Error('Base temporaire locale requise');
}
const prisma = new PrismaService();
async function main() {
  const joueur = await prisma.user.create({ data: { nom: 'Test monde', email: 'monde-transactions@example.invalid', passwordHash: 'inutilisable', carriere: { create: { argentVirtuel: 1000 } } } });
  const progression = new ProgressionService(prisma, {} as never, {} as never);
  const defis = new DefisService(prisma, progression);
  const transport = new TransportService(prisma, defis);
  const compter = defis.compterTrajet.bind(defis);
  defis.compterTrajet = async (...args) => { await compter(...args); throw new Error('Compteur en panne'); };
  await assert.rejects(transport.payer(joueur.id, 'gbaka', 50), /Compteur en panne/);
  const annule = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: joueur.id } });
  assert.equal(annule.argentVirtuel, 1000);
  assert.equal(annule.defis, null);
  defis.compterTrajet = compter;
  await Promise.all([transport.payer(joueur.id, 'gbaka', 50), transport.payer(joueur.id, 'gbaka', 50), defis.etat(joueur.id)]);
  const apres = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: joueur.id } });
  assert.equal(apres.argentVirtuel, 600);
  assert.equal(lireEtatDefis(apres.defis, new Date(), { seances: 0, chapitres: 0 }).etat.trajets.jour, 2);

  // La publication ciblée recrée un contenu manquant et reste sans effet au second passage.
  await prisma.evenement.deleteMany({ where: { type: 'DEFI_JOUR', config: { path: ['slug'], equals: DEFIS_JOUR[0].slug } } });
  const avantPublication = await prisma.userCarriere.findMany({ orderBy: { id: 'asc' } });
  const publier = () => execFileSync(process.execPath, ['-r', 'ts-node/register', 'scripts/publier-contenu-monde.ts', '--apply'], { stdio: 'inherit', env: process.env });
  publier();
  const nombre = await prisma.evenement.count();
  publier();
  assert.equal(await prisma.evenement.count(), nombre);
  assert.equal(await prisma.evenement.count({ where: { type: 'DEFI_JOUR', config: { path: ['slug'], equals: DEFIS_JOUR[0].slug } } }), 1);
  assert.deepEqual(await prisma.userCarriere.findMany({ orderBy: { id: 'asc' } }), avantPublication);
  console.log('OK PostgreSQL : transports simultanés, rollback du débit, publication additive rejouable sans modifier les joueurs.');
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
