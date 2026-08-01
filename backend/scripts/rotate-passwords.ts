/**
 * Rotation des mots de passe des comptes de démonstration.
 *
 * Contexte : les identifiants demo/admin ont été affichés publiquement sur la page de connexion
 * pendant plusieurs semaines. Les retirer de l'affichage ne suffit pas — quiconque les a vus peut
 * toujours se connecter. Ce script remplace les hash en base.
 *
 * Usage :
 *   DATABASE_URL="..." ADMIN_PWD="..." DEMO_PWD="..." npx tsx scripts/rotate-passwords.ts
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function rotate(email: string, motDePasse: string | undefined) {
  if (!motDePasse) {
    console.log(`⏭  ${email} — aucun mot de passe fourni, ignoré.`);
    return;
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    console.log(`⏭  ${email} — compte introuvable.`);
    return;
  }
  const passwordHash = await argon2.hash(motDePasse);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  // Note : les refresh tokens sont des JWT non stockés en base — ils restent valides jusqu'à leur
  // expiration. Pour une révocation immédiate, faire tourner JWT_REFRESH_SECRET côté Vercel.
  console.log(`✅ ${email} — mot de passe changé.`);
}

async function main() {
  await rotate('admin@btplife.com', process.env.ADMIN_PWD);
  await rotate('demo@btplife.com', process.env.DEMO_PWD);
}

main()
  .catch((e) => {
    console.error('Erreur:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
