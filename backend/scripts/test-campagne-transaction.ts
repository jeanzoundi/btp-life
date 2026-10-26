import assert from 'node:assert/strict';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProgressionService } from '../src/carriere/progression.service';
import { BesoinsService } from '../src/carriere/besoins.service';
import { CampagneService } from '../src/carriere/campagne.service';
import corrige from '../src/carriere/campagne-corrige.json';

// Ce test crée un joueur uniquement dans la base jetable de test-migrations.ts.
for (const cle of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[cle] ?? 'http://absent');
  if (url.hostname !== 'localhost' || url.port !== '5433' || url.pathname !== '/btp_life_test') throw new Error('Base temporaire locale requise');
}
const prisma = new PrismaService();
const reponses = Object.fromEntries(corrige[0].map(t => [t.id,
  t.type === 'mesure' ? t.reponse! : t.type === 'situation' ? t.options!.findIndex(Boolean) : t.options!.flatMap((b, i) => b ? [i] : [])]));

async function main() {
  const joueur = await prisma.user.create({ data: { nom: 'Test transaction', email: 'transaction-campagne@example.invalid', passwordHash: 'compte-local-inutilisable',
    carriere: { create: { argentVirtuel: 1000, reputation: 0 } } } });
  const progression = new ProgressionService(prisma, { debloquerItemsEligibles: async () => [] } as never, { envoyerNotification: async () => undefined } as never);
  const campagne = new CampagneService(prisma, progression, new BesoinsService(prisma));
  const payer = progression.appliquerDelta.bind(progression);
  progression.appliquerDelta = async (...args) => { await payer(...args); throw new Error('Panne après écriture du paiement'); };
  await assert.rejects(campagne.chapitre(joueur.id, 0, reponses), /Panne après écriture/);
  const apresPanne = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: joueur.id } });
  assert.equal(apresPanne.campagne, null);
  assert.equal(apresPanne.argentVirtuel, 1000);
  assert.equal(apresPanne.xp, 0);
  assert.equal(apresPanne.energie, 100);

  progression.appliquerDelta = payer;
  const [premier, simultane] = await Promise.all([campagne.chapitre(joueur.id, 0, reponses), campagne.chapitre(joueur.id, 0, reponses)]);
  assert.deepEqual(premier, simultane);
  const renvoi = await campagne.chapitre(joueur.id, 0, reponses);
  assert.deepEqual(renvoi, premier);
  const apres = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: joueur.id } });
  assert.equal(apres.argentVirtuel, 3500);
  assert.equal(apres.xp, premier.gains.xp);
  assert.equal(apres.energie, 95);
  assert.equal(apres.faim, 96);
  await assert.rejects(campagne.chapitre(joueur.id, 1, { note: 100 }));
  console.log('OK PostgreSQL réel : rollback après paiement, double envoi et reprise sans double gain.');
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
