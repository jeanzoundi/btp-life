import { strict as assert } from 'assert';
import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../src/auth/mail.service';

// Ce test ne doit jamais créer de comptes ni de codes dans une base distante.
const database = new URL(process.env.DATABASE_URL ?? '');
if (!['localhost', '127.0.0.1'].includes(database.hostname) || database.pathname !== '/btp_life_test') {
  throw new Error('Test réservé au PostgreSQL temporaire btp_life_test.');
}
process.env.JWT_ACCESS_SECRET = 'secret-ephemere-test-auth';
const prisma = new PrismaClient();
const envois: unknown[] = [];
const mail = { envoyer: async (message: unknown) => { envois.push(message); }, modeDeveloppement: () => false };
const auth = new AuthService(prisma as PrismaService,
  { signAsync: async () => 'jeton-test' } as unknown as JwtService, mail as unknown as MailService);
const email = (suffixe: string) => `test-auth-${suffixe}@example.com`;
async function enregistrer(adresse: string) {
  return prisma.codeConnexion.create({ data: { email: adresse, expireLe: new Date(Date.now() + 600_000),
    empreinte: createHmac('sha256', process.env.JWT_ACCESS_SECRET!).update(`code-connexion:${adresse}:123456`).digest('hex') } });
}

async function main() {
  const demandes = await Promise.allSettled([auth.demanderCode(email('quota')), auth.demanderCode(email('quota'))]);
  assert.equal(demandes.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(envois.length, 1, 'Un seul mail malgré deux demandes simultanées');
  assert.equal(await prisma.codeConnexion.count({ where: { email: email('quota') } }), 1);

  await enregistrer(email('unique'));
  const connexions = await Promise.allSettled([auth.verifierCode(email('unique'), '123456'), auth.verifierCode(email('unique'), '123456')]);
  assert.equal(connexions.filter(r => r.status === 'fulfilled').length, 1, 'Un code ne donne qu’une session');
  assert.equal(await prisma.user.count({ where: { email: email('unique') } }), 1);
  await assert.rejects(() => auth.verifierCode(email('unique'), '123456'));
  await assert.rejects(() => auth.demanderCode(email('unique')), /attends/);

  const code = await enregistrer(email('essais'));
  for (let i = 0; i < 5; i++) await assert.rejects(() => auth.verifierCode(email('essais'), '000000'));
  assert.equal((await prisma.codeConnexion.findUniqueOrThrow({ where: { id: code.id } })).essais, 5,
    'Les mauvais essais restent enregistrés malgré la réponse d’erreur');
  await assert.rejects(() => auth.verifierCode(email('essais'), '123456'));

  const concurrence = await enregistrer(email('concurrence'));
  await prisma.codeConnexion.update({ where: { id: concurrence.id }, data: { essais: 4 } });
  await Promise.allSettled([auth.verifierCode(email('concurrence'), '000000'), auth.verifierCode(email('concurrence'), '111111')]);
  assert.equal((await prisma.codeConnexion.findUniqueOrThrow({ where: { id: concurrence.id } })).essais, 5);
  console.log('OK PostgreSQL : quota mail atomique, code à usage unique, cinq essais persistants et limite concurrente.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
