import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaService } from '../src/prisma/prisma.service';
import { CatalogService } from '../src/common/catalog/catalog.service';
import { modulesAcademie, coursSupplementaires, enrichissementCours } from '../prisma/seed-data/academie-data';
import { modulesGrandeEcole } from '../prisma/seed-data/grande-ecole-batiment-data';

// Ce test rejoue le seed uniquement dans la base jetable de test-migrations.ts, après qu'un joueur y a lu tous les cours.
for (const cle of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[cle] ?? 'http://absent');
  if (url.hostname !== 'localhost' || url.port !== '5433' || url.pathname !== '/btp_life_test') throw new Error('Base temporaire locale requise');
}
const prisma = new PrismaService();
const modules = [...modulesAcademie, ...modulesGrandeEcole].map((m) => ({ slug: m.slug, cours: [...m.cours, ...(coursSupplementaires[m.slug] ?? [])] }));

async function main() {
  const joueur = await prisma.user.create({ data: { nom: 'Test seed', email: 'seed-cours@example.invalid', passwordHash: 'compte-local-inutilisable' } });
  // Avant de rejouer le seed : un cours absent des données, un cours des données absent de la base (au milieu de son
  // module) et un cours modifié à la main.
  const donnees = modules.find((m) => m.cours.length >= 3)!;
  const module = await prisma.moduleAcademie.findUniqueOrThrow({ where: { slug: donnees.slug }, include: { cours: { orderBy: { ordre: 'asc' } } } });
  const retire = await prisma.cours.create({ data: { moduleId: module.id, titre: 'Cours retiré des données', contenu: { blocs: [] } } });
  await prisma.cours.delete({ where: { id: module.cours[1].id } });
  const mission = await prisma.mission.findFirstOrThrow();
  await prisma.cours.update({ where: { id: module.cours[0].id }, data: {
    ordre: 99, dureeMin: 999, contenu: { blocs: [] }, missionPratiqueId: module.cours[0].missionPratiqueId ? null : mission.id,
  } });
  const coursAvant = await prisma.cours.findMany({ orderBy: { id: 'asc' } });
  await prisma.userCours.createMany({ data: coursAvant.map((c) => ({ userId: joueur.id, coursId: c.id })) });
  const lusAvant = await prisma.userCours.findMany({ where: { coursId: { not: retire.id } }, orderBy: { id: 'asc' } });

  execSync('npx prisma db seed', { cwd: path.join(__dirname, '..'), env: process.env, stdio: 'inherit' });

  // Les cours lus survivent tous, sauf celui du cours retiré des données, et chaque cours resté garde son id.
  assert.deepEqual(await prisma.userCours.findMany({ orderBy: { id: 'asc' } }), lusAvant);
  const idsApres = new Set((await prisma.cours.findMany({ select: { id: true } })).map((c) => c.id));
  assert.ok(!idsApres.has(retire.id), 'le cours retiré des données doit être supprimé');
  for (const c of coursAvant) if (c.id !== retire.id) assert.ok(idsApres.has(c.id), `cours recréé au lieu d'être mis à jour : ${c.titre}`);

  // Le catalogue rend les cours dans l'ordre des données, avec leur contenu enrichi et leur mission pratique.
  const missions = new Map((await prisma.mission.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  const { items } = await new CatalogService(prisma).list('modules-academie', { pageSize: '200' });
  for (const m of modules) {
    const cours = items.find((x) => x.slug === m.slug).cours;
    assert.deepEqual(cours.map((c) => c.titre), m.cours.map((c) => c.titre), `ordre des cours de ${m.slug}`);
    m.cours.forEach((c, i) => {
      const enrichi = enrichissementCours[c.titre];
      assert.deepEqual(cours[i].contenu, { blocs: [...(enrichi?.avant ?? []), ...c.blocs, ...(enrichi?.apres ?? [])] });
      assert.equal(cours[i].dureeMin, c.dureeMin + (enrichi ? 8 : 0));
      assert.equal(cours[i].missionPratiqueId, (c.missionPratique && missions.get(c.missionPratique)) ?? null);
    });
  }
  console.log(`OK PostgreSQL réel : seed rejoué, ${lusAvant.length} cours lus conservés avec leur id, cours retiré supprimé, ordre et contenu des données rétablis.`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
