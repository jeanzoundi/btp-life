import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CATALOG_RESOURCES, ResourceConfig } from '../registry/resource-registry';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private resolve(resource: string): ResourceConfig {
    const config = CATALOG_RESOURCES[resource];
    if (!config) throw new NotFoundException(`Ressource "${resource}" introuvable`);
    return config;
  }

  private delegate(config: ResourceConfig) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[config.model];
  }

  async list(resource: string, query: Record<string, string>) {
    const config = this.resolve(resource);
    const delegate = this.delegate(config);
    const { q, page = '1', pageSize = '50', ...filters } = query;

    // Le filtre public (ex. { publie: true }) est appliqué en premier et n'est jamais surchargeable
    // par un paramètre de requête — un brouillon ne doit jamais fuiter via le catalogue public.
    const where: Record<string, unknown> = { ...(config.publicWhere ?? {}) };
    // Seuls les champs explicitement autorisés peuvent être filtrés depuis l'URL : ça ferme
    // l'injection de filtres Prisma arbitraires (et empêche d'écraser le publicWhere ci-dessus).
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && config.filterableFields?.includes(key) && !(key in where)) {
        where[key] = value;
      }
    }
    if (q && config.searchFields?.length) {
      where.OR = config.searchFields.map((field) => ({
        [field]: { contains: q, mode: 'insensitive' },
      }));
    }

    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      delegate.findMany({ where, include: config.include, orderBy: config.orderBy, take, skip }),
      delegate.count({ where }),
    ]);

    return { items, total, page: Number(page) || 1, pageSize: take };
  }

  async getById(resource: string, id: string) {
    const config = this.resolve(resource);
    const item = await this.delegate(config).findUnique({ where: { id }, include: config.include });
    if (!item || this.estMasque(config, item)) throw new NotFoundException(`${resource} ${id} introuvable`);
    return item;
  }

  async getBySlug(resource: string, slug: string) {
    const config = this.resolve(resource);
    const item = await this.delegate(config).findUnique({ where: { slug }, include: config.include });
    if (!item || this.estMasque(config, item)) throw new NotFoundException(`${resource} "${slug}" introuvable`);
    return item;
  }

  // Applique le publicWhere aussi sur les accès unitaires (par id/slug), sinon on pourrait récupérer
  // un brouillon en le demandant directement par son identifiant.
  private estMasque(config: ResourceConfig, item: Record<string, unknown>): boolean {
    if (!config.publicWhere) return false;
    return Object.entries(config.publicWhere).some(([key, value]) => item[key] !== value);
  }
}
