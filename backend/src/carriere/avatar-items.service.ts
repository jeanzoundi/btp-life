import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Dressing / inventaire d'avatar : catalogue d'items (ItemAvatar), possessions du
// joueur (UserItemAvatar), et déblocage automatique par niveau/métier. Équiper un
// item fusionne son configPatch dans Avatar.config — le rendu SVG (AvatarBtp côté
// frontend) n'a donc jamais besoin de connaître les items eux-mêmes.
@Injectable()
export class AvatarItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async catalogue(userId: string) {
    const [items, possessions, carriere] = await Promise.all([
      this.prisma.itemAvatar.findMany({ where: { publie: true }, orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }] }),
      this.prisma.userItemAvatar.findMany({ where: { userId } }),
      this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } }),
    ]);
    const possedes = new Map(possessions.map((p) => [p.itemId, p]));
    const niveau = carriere?.niveau ?? 1;
    const metierSlug = carriere?.profilActuel?.slug ?? null;

    return items.map((item) => {
      const possession = possedes.get(item.id);
      return {
        ...item,
        possede: !!possession,
        equipe: possession?.equipe ?? false,
        eligible: item.niveauRequis <= niveau && (!item.metierRequis || item.metierRequis === metierSlug),
      };
    });
  }

  async inventaire(userId: string) {
    return this.prisma.userItemAvatar.findMany({
      where: { userId },
      include: { item: true },
      orderBy: [{ equipe: 'desc' }, { obtenuLe: 'desc' }],
    });
  }

  async equiper(userId: string, itemId: string) {
    const possession = await this.prisma.userItemAvatar.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });
    if (!possession) throw new NotFoundException('Item non possédé');

    const avatar = await this.prisma.avatar.findUnique({ where: { userId } });
    const configActuel = (avatar?.config as Record<string, unknown>) ?? {};
    const nouveauConfig = { ...configActuel, ...(possession.item.configPatch as Record<string, unknown>) };

    await this.prisma.avatar.upsert({
      where: { userId },
      create: { userId, nomPersonnage: 'Joueur', config: nouveauConfig as Prisma.InputJsonValue },
      update: { config: nouveauConfig as Prisma.InputJsonValue },
    });

    // Un seul item équipé par catégorie (un seul casque, une seule tenue, ...).
    await this.prisma.userItemAvatar.updateMany({
      where: { userId, item: { categorie: possession.item.categorie } },
      data: { equipe: false },
    });
    return this.prisma.userItemAvatar.update({ where: { id: possession.id }, data: { equipe: true } });
  }

  /** Débloque automatiquement les items dont les conditions (niveau/métier) sont désormais
   * remplies. Appelé après un gain de niveau et après un changement de profil actuel. */
  async debloquerItemsEligibles(userId: string, source: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } });
    if (!carriere) return [];

    const niveau = carriere.niveau;
    const metierSlug = carriere.profilActuel?.slug ?? null;
    const filtreMetier: Prisma.ItemAvatarWhereInput = metierSlug
      ? { OR: [{ metierRequis: null }, { metierRequis: metierSlug }] }
      : { metierRequis: null };

    const eligibles = await this.prisma.itemAvatar.findMany({
      where: { publie: true, niveauRequis: { lte: niveau }, ...filtreMetier },
    });
    if (!eligibles.length) return [];

    const dejaPossedes = await this.prisma.userItemAvatar.findMany({ where: { userId }, select: { itemId: true } });
    const possedeSet = new Set(dejaPossedes.map((p) => p.itemId));
    const nouveaux = eligibles.filter((it) => !possedeSet.has(it.id));
    if (!nouveaux.length) return [];

    await this.prisma.userItemAvatar.createMany({
      data: nouveaux.map((it) => ({ userId, itemId: it.id, source })),
      skipDuplicates: true,
    });
    return nouveaux;
  }
}
