import * as fs from 'fs';
import { createHash } from 'crypto';
import { config } from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import { missionsData, questionsSupplementaires, questionsVague2 } from '../prisma/seed-data/missions-data';
import { modulesAcademie, coursSupplementaires, enrichissementCours } from '../prisma/seed-data/academie-data';
import { missionsGrandeEcole, modulesGrandeEcole } from '../prisma/seed-data/grande-ecole-batiment-data';

const production = config({ path: '.env.restore.local' }).parsed;
const url = production?.DATABASE_URL;
if (!url || !new URL(url).hostname.endsWith('.supabase.com')) throw new Error('Connexion production indisponible');
const prisma = new PrismaClient({ datasources: { db: { url } } });
const apply = process.argv.includes('--apply');
const missions = [...missionsData, ...missionsGrandeEcole];
const modules = [...modulesAcademie, ...modulesGrandeEcole];

async function main() {
  if (apply) {
    const proof = JSON.parse(fs.readFileSync('.vercel/restauration/backup-verifie.json', 'utf8'));
    if (Date.now() - Date.parse(proof.verifiedAt) > 3600000) throw new Error('Sauvegarde trop ancienne');
    if (createHash('sha256').update(fs.readFileSync(proof.file)).digest('hex') !== proof.sha256) throw new Error('Archive altérée');
  }
  const result = await prisma.$transaction(async tx => {
    // Sérialise ce script ; aucune écriture dans les comptes ou les tables de progression.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(8142026)`;
    const empreinte = async () => createHash('sha256').update(JSON.stringify(await Promise.all([
      tx.user.findMany({ orderBy: { id: 'asc' } }),
      tx.userCarriere.findMany({ orderBy: { id: 'asc' } }),
      tx.userMission.findMany({ orderBy: { id: 'asc' } }),
      tx.userCours.findMany({ orderBy: { id: 'asc' } }),
    ]))).digest('hex');
    const avant = await empreinte();
    const competences = new Map((await tx.competence.findMany()).map(x => [x.slug, x.id]));
    const badges = new Map((await tx.badge.findMany()).map(x => [x.slug, x.id]));
    const ids = new Map((await tx.mission.findMany()).map(x => [x.slug, x.id]));
    const stats = { missions: 0, questions: 0, modules: 0, cours: 0 };
    const coursIgnores: string[] = [];
    // Prévalide toutes les références avant une insertion.
    for (const m of missions) {
      for (const slug of m.competences) if (!competences.has(slug)) throw new Error(`Compétence absente : ${slug}`);
      if (m.badge && !badges.has(m.badge)) throw new Error(`Badge absent : ${m.badge}`);
    }
    for (const m of modules) {
      if (!competences.has(m.competence)) throw new Error(`Compétence absente : ${m.competence}`);
      for (const c of [...m.cours, ...(coursSupplementaires[m.slug] ?? [])]) {
        if (c.missionPratique && !ids.has(c.missionPratique) && !missions.some(x => x.slug === c.missionPratique)) coursIgnores.push(c.titre);
      }
    }
    for (const m of missions) {
      let id = ids.get(m.slug);
      if (!id) {
        stats.missions++;
        if (apply) {
          const row = await tx.mission.create({ data: {
            slug: m.slug, titre: m.titre, description: m.description, type: m.type,
            profils: m.profils, niveauRequis: m.niveauRequis,
            competences: m.competences.map(s => competences.get(s)!),
            dureeLimiteSec: m.dureeLimiteSec, conditionReussite: m.conditionReussite ?? 60,
            badgeId: m.badge ? badges.get(m.badge) : undefined, statut: 'PUBLIE',
          } });
          id = row.id; ids.set(m.slug, id);
        }
      }
      const existing = id ? await tx.missionContenu.findMany({ where: { missionId: id } }) : [];
      const questions = [...m.contenus, ...(questionsSupplementaires[m.slug] ?? []), ...(questionsVague2[m.slug] ?? [])];
      for (const [index, q] of questions.entries()) {
        if (existing.some(x => x.enonce === q.enonce && x.typeQuestion === q.typeQuestion)) continue;
        if (existing.some(x => x.ordre === index + 1)) throw new Error(`Conflit de question : ${m.slug}, ${index + 1}`);
        stats.questions++;
        if (apply && id) await tx.missionContenu.create({ data: {
          missionId: id, ordre: index + 1, typeQuestion: q.typeQuestion, enonce: q.enonce,
          options: q.options as Prisma.InputJsonValue, bonnesReponses: q.bonnesReponses as Prisma.InputJsonValue,
          tolerance: q.tolerance, correctionPedagogique: q.correctionPedagogique,
        } });
      }
    }
    for (const m of modules) {
      let module = await tx.moduleAcademie.findUnique({ where: { slug: m.slug } });
      if (!module) {
        stats.modules++;
        if (apply) module = await tx.moduleAcademie.create({ data: { slug: m.slug, titre: m.titre, domaine: m.domaine, ordre: m.ordre, publie: true } });
      }
      for (const c of [...m.cours, ...(coursSupplementaires[m.slug] ?? [])]) {
        if (coursIgnores.includes(c.titre)) continue;
        const existing = module ? await tx.cours.findMany({ where: { moduleId: module.id, titre: c.titre } }) : [];
        if (existing.length > 1) throw new Error(`Cours ambigu : ${c.titre}`);
        if (existing.length) continue;
        stats.cours++;
        const enrichi = enrichissementCours[c.titre];
        if (apply && module) await tx.cours.create({ data: {
          moduleId: module.id, titre: c.titre,
          contenu: { blocs: [...(enrichi?.avant ?? []), ...c.blocs, ...(enrichi?.apres ?? [])] },
          competenceId: competences.get(m.competence)!, dureeMin: c.dureeMin + (enrichi ? 8 : 0),
          missionPratiqueId: c.missionPratique ? ids.get(c.missionPratique) : undefined,
        } });
      }
    }
    if (await empreinte() !== avant) throw new Error('Comptes ou progression modifiés : annulation');
    return { ...stats, coursIgnores, comptesEtProgressionInchanges: true };
  }, { timeout: 600000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log(JSON.stringify({ mode: apply ? 'restauration' : 'simulation', ajouts: result }));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
