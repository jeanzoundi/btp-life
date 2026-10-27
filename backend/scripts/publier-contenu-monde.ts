import { Prisma, PrismaClient } from '@prisma/client';
import { DEFIS_JOUR, DEFIS_SEMAINE, IMPREVUS } from '../prisma/seed-data/defis-data';
import { OFFRES_EMPLOI, PROFILS_EXPERTS, REGLES_EXPERTS, certificatsDuJeu } from '../prisma/seed-data/carriere-data';
import { modulesAcademie } from '../prisma/seed-data/academie-data';
import { modulesGrandeEcole } from '../prisma/seed-data/grande-ecole-batiment-data';

// Publication additive uniquement : aucun compte, progrès, cours ou contenu administré n'est remplacé.
// --apply est obligatoire. Toutes les insertions sont validées ensemble ou annulées ensemble.

/** Les modules qui délivrent une attestation : l'académie et la Grande École, comme dans le seed, qui ajoute la Grande
 * École à l'académie avant de créer les certificats. */
export const modulesAvecAttestation = () =>
  [...modulesAcademie, ...modulesGrandeEcole].filter((m, i, liste) => liste.findIndex(x => x.slug === m.slug) === i);

async function main(prisma: PrismaClient) {
  if (!process.argv.includes('--apply')) throw new Error('Ajouter --apply pour publier le contenu du monde.');
  const resultat = await prisma.$transaction(async tx => {
    const pays = await tx.pays.findUniqueOrThrow({ where: { codeIso: 'CIV' } });
    const ajouts = { profils: 0, offres: 0, regles: 0, certificats: 0, defis: 0, imprevus: 0 };
    for (const p of PROFILS_EXPERTS) {
      if (await tx.profil.findUnique({ where: { slug: p.slug } })) continue;
      await tx.profil.create({ data: p }); ajouts.profils++;
    }
    const profils = new Map((await tx.profil.findMany({ select: { slug: true, id: true } })).map(p => [p.slug, p.id]));
    const missions = new Map((await tx.mission.findMany({ select: { slug: true, id: true } })).map(m => [m.slug, m.id]));
    const id = (table: Map<string, string>, slug: string) => {
      const valeur = table.get(slug);
      if (!valeur) throw new Error(`Contenu préalable absent : ${slug}`);
      return valeur;
    };
    for (const o of OFFRES_EMPLOI) {
      if (await tx.offreEmploi.findFirst({ where: { titre: o.titre } })) continue;
      await tx.offreEmploi.create({ data: {
        titre: o.titre, description: o.description, paysId: pays.id, statut: 'publiee',
        profilRechercheId: id(profils, o.profil), competencesRequises: o.competences ?? Prisma.JsonNull,
        niveauMin: o.niveauMin, chantiersRequis: o.chantiers ?? 0, reputationMin: o.reputationMin,
        testEntreeMissionId: id(missions, o.test), entrepriseFictive: o.entreprise,
      } }); ajouts.offres++;
    }
    for (const r of REGLES_EXPERTS) {
      const paire = { profilSourceId: id(profils, r.source), profilCibleId: id(profils, r.cible) };
      if (await tx.reglePromotion.findFirst({ where: paire })) continue;
      await tx.reglePromotion.create({ data: { ...paire, conditions: { ...r.conditions, ...(r.examen ? { examenMissionId: id(missions, r.examen) } : {}) } } }); ajouts.regles++;
    }
    const metiers = await tx.metierCible.findMany({ select: { slug: true, nom: true } });
    for (const c of certificatsDuJeu(modulesAvecAttestation(), metiers)) {
      if (await tx.certificat.findUnique({ where: { slug: c.slug } })) continue;
      await tx.certificat.create({ data: c }); ajouts.certificats++;
    }
    for (const [type, defis] of [['DEFI_JOUR', DEFIS_JOUR], ['DEFI_SEMAINE', DEFIS_SEMAINE]] as const) {
      for (const d of defis) {
        if (await tx.evenement.findFirst({ where: { type, config: { path: ['slug'], equals: d.slug } } })) continue;
        await tx.evenement.create({ data: { type, config: d as unknown as Prisma.InputJsonValue } }); ajouts.defis++;
      }
    }
    for (const i of IMPREVUS) {
      if (await tx.imprevu.findFirst({ where: { declencheur: { path: ['slug'], equals: i.slug } } })) continue;
      await tx.imprevu.create({ data: { titre: i.titre, description: i.description,
        declencheur: { slug: i.slug, lieu: 'chantier' }, options: i.options as unknown as Prisma.InputJsonValue,
        consequences: { appliquees: 'effets de l’option choisie' },
      } }); ajouts.imprevus++;
    }
    return ajouts;
  }, { isolationLevel: 'Serializable', timeout: 120_000 });
  console.log('Contenu ajouté sans modifier les joueurs :', JSON.stringify(resultat));
}
// Lancé en script seulement : un test peut importer la liste des modules sans ouvrir de connexion ni rien publier.
if (require.main === module) {
  const prisma = new PrismaClient();
  main(prisma).catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
