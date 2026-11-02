import assert from 'node:assert/strict';
import { PrismaService } from '../src/prisma/prisma.service';
import { CarriereService, ETUDIANT_DEPART, primeInstallation } from '../src/carriere/carriere.service';
import { LieuxService } from '../src/carriere/lieux.service';
import { reponsesParfaites } from '../src/carriere/programmes-scoring';
import { ProgressionService } from '../src/carriere/progression.service';
import { BesoinsService } from '../src/carriere/besoins.service';
import { JourneeChantierService } from '../src/carriere/journee-chantier.service';
import { reponsesJournee } from '../src/carriere/journee-chantier';
import { PremiersPasService } from '../src/monde/premiers-pas.service';
import { bonusParcours, porteDuProfil } from '../src/carriere/parcours';

for (const cle of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[cle] ?? 'http://absent');
  if (url.hostname !== 'localhost' || url.port !== '5433' || url.pathname !== '/btp_life_test') throw new Error('Base temporaire locale requise');
}
const prisma = new PrismaService();
async function main() {
  const user = await prisma.user.create({ data: { nom: 'Test installation', email: 'installation@example.invalid', passwordHash: 'inutilisable', carriere: { create: { argentVirtuel: 0 } } } });
  const avatarItems = { debloquerItemsEligibles: async () => [] };
  const carriere = new CarriereService(prisma, {} as never, {} as never, avatarItems as never, {} as never);
  const profil = await prisma.profil.findFirstOrThrow({ where: { niveauDepart: 1 } });
  await Promise.all([carriere.setProfilActuel(user.id, { profilId: profil.id }), carriere.setProfilActuel(user.id, { profilId: profil.id })]);
  const installe = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: user.id } });
  // La prime dépend du poste choisi ; un étudiant arrive en cité universitaire.
  const PRIME_INSTALLATION = primeInstallation(profil);
  assert.equal(installe.argentVirtuel, PRIME_INSTALLATION);
  if (ETUDIANT_DEPART.test(profil.slug)) assert.equal((installe.patrimoine as { logement: { niveau: string } }).logement.niveau, 'chambre');
  // La séance se joue avec les réponses brutes de chaque tâche, corrigées par le serveur.
  const reponses = reponsesParfaites('laboratoire', 0, 0);
  const progression = new ProgressionService(prisma, avatarItems as never, { envoyerNotification: async () => {} } as never);
  const besoins = new BesoinsService(prisma);
  const lieux = new LieuxService(prisma, progression, besoins);
  const appliquer = progression.appliquerDelta.bind(progression);
  progression.appliquerDelta = async (...args) => { await appliquer(...args); throw new Error('Paiement interrompu'); };
  await assert.rejects(lieux.seance(user.id, 'laboratoire', 0, reponses), /Paiement interrompu/);
  const annule = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: user.id } });
  assert.equal(annule.progresLieux, null);
  assert.equal(annule.argentVirtuel, PRIME_INSTALLATION);
  assert.equal(annule.xp, installe.xp);
  progression.appliquerDelta = appliquer;
  const notifier = progression.notifierNiveau;
  progression.notifierNiveau = async () => { throw new Error('Notification interrompue'); };
  await lieux.seance(user.id, 'laboratoire', 0, reponses);
  const valide = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: user.id } });
  assert.equal(valide.argentVirtuel, PRIME_INSTALLATION + 2000);
  assert.equal((valide.progresLieux as Record<string, { etapes: number }>).laboratoire.etapes, 1);
  assert.equal(await prisma.userCompetence.count({ where: { userId: user.id } }), 1);
  assert.ok(valide.energie < annule.energie);
  progression.notifierNiveau = notifier;
  // La journée avec Yao, sans chantier à soi : annulée en bloc si le paiement échoue, comptée et payée une seule fois même
  // envoyée deux fois en même temps.
  const yao = new JourneeChantierService(prisma, progression, besoins);
  progression.appliquerDelta = async (...args) => { await appliquer(...args); throw new Error('Paiement interrompu'); };
  await assert.rejects(yao.journee(user.id, 0, reponsesJournee(0, true)), /Paiement interrompu/);
  const journeeAnnulee = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: user.id } });
  assert.equal(journeeAnnulee.chantierQuartier, null);
  assert.equal(journeeAnnulee.argentVirtuel, valide.argentVirtuel);
  progression.appliquerDelta = appliquer;
  const envois = await Promise.allSettled([yao.journee(user.id, 0, reponsesJournee(0, true)), yao.journee(user.id, 0, reponsesJournee(0, true))]);
  assert.equal(envois.filter(e => e.status === 'fulfilled').length, 1);
  const journeePayee = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: user.id } });
  // Le parcours du poste de départ module la paie (un ouvrier touche 15 % de plus) : même barème qu'au service.
  const bonus = bonusParcours(porteDuProfil(profil.slug), { type: 'journee' });
  assert.equal(journeePayee.argentVirtuel, valide.argentVirtuel + Math.round(7000 * bonus.argent));
  assert.deepEqual({ ...(journeePayee.chantierQuartier as object), derniereRecompenseLe: null }, { jours: 1, journees: 1, livraisons: 0, derniereRecompenseLe: null });
  // La première journée guidée : la paie enregistrée ouvre la suite, et le guide fini ne paie plus.
  const guide = new PremiersPasService(prisma, progression);
  for (const etape of ['travail', 'paie', 'objectif', 'logement']) await guide.valider(user.id, etape);
  const guideFini = await prisma.userCarriere.findUniqueOrThrow({ where: { userId: user.id } });
  assert.equal(guideFini.argentVirtuel, journeePayee.argentVirtuel + 4 * 500 + 2000);
  assert.equal((await guide.valider(user.id, 'logement')).recompense, null);
  console.log('OK PostgreSQL : prime unique sous concurrence, rollback intégral séance et journée, journée payée une fois sous concurrence, compétence et fatigue enregistrées, guide de la première journée payé une fois, notification non bloquante.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
