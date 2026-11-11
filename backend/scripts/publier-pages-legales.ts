import { Prisma, PrismaClient } from '@prisma/client';
import { PAGES_LEGALES, PAGES_LEGALES_D_ORIGINE } from '../prisma/seed-data/pages-legales-data';

// Publie les pages légales complètes (mentions légales, CGU, confidentialité, cookies) à la place des versions d'une ligne
// d'origine. Une page déjà réécrite dans l'administration n'est jamais remplacée : elle est signalée et laissée telle quelle.
// Sans --apply, le script dit seulement ce qu'il ferait. Tout est validé ensemble ou annulé ensemble.

export type ActionPage = 'creer' | 'remplacer' | 'a-jour' | 'laisser';

/** Ce qu'il faut faire d'une page légale, d'après le texte qu'elle porte aujourd'hui (null : la page n'existe pas). */
export function actionPage(slug: string, texteActuel: string | null | undefined, nouveau: string): ActionPage {
  if (texteActuel === null || texteActuel === undefined) return 'creer';
  if (texteActuel.trim() === nouveau.trim()) return 'a-jour';
  return texteActuel.trim() === PAGES_LEGALES_D_ORIGINE[slug]?.trim() ? 'remplacer' : 'laisser';
}

async function main(prisma: PrismaClient) {
  const appliquer = process.argv.includes('--apply');
  const bilan = await prisma.$transaction(async tx => {
    const lignes: string[] = [];
    for (const page of PAGES_LEGALES) {
      const actuelle = await tx.pageCms.findUnique({ where: { slug: page.slug } });
      const texteActuel = actuelle ? (actuelle.contenu as { texte?: string } | null)?.texte ?? '' : null;
      const action = actionPage(page.slug, texteActuel, page.texte);
      lignes.push(`${page.slug} : ${{ creer: 'à créer', remplacer: 'à remplacer', 'a-jour': 'déjà à jour', laisser: 'réécrite dans l’administration, laissée telle quelle' }[action]}`);
      if (!appliquer || action === 'a-jour' || action === 'laisser') continue;
      const donnees = { titre: page.titre, contenu: { texte: page.texte } as Prisma.InputJsonValue, publie: true };
      if (action === 'creer') await tx.pageCms.create({ data: { slug: page.slug, ...donnees } });
      else await tx.pageCms.update({ where: { slug: page.slug }, data: donnees });
    }
    return lignes;
  }, { isolationLevel: 'Serializable', timeout: 60_000 });
  console.log(`${appliquer ? 'Pages légales publiées' : 'Simulation (ajouter --apply pour publier)'} :\n- ${bilan.join('\n- ')}`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  main(prisma).catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
