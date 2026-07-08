import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ADMIN_RESOURCES, ResourceConfig } from '../registry/resource-registry';

@Injectable()
export class AdminCrudService {
  constructor(private readonly prisma: PrismaService) {}

  resolve(resource: string): ResourceConfig {
    const config = ADMIN_RESOURCES[resource];
    if (!config) throw new NotFoundException(`Ressource admin "${resource}" introuvable`);
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

    const where: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) where[key] = value;
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
    if (!item) throw new NotFoundException(`${resource} ${id} introuvable`);
    return item;
  }

  async create(resource: string, data: Record<string, unknown>) {
    const config = this.resolve(resource);
    return this.delegate(config).create({ data });
  }

  async update(resource: string, id: string, data: Record<string, unknown>) {
    const config = this.resolve(resource);
    await this.getById(resource, id);
    return this.delegate(config).update({ where: { id }, data });
  }

  async remove(resource: string, id: string) {
    const config = this.resolve(resource);
    await this.getById(resource, id);
    await this.delegate(config).delete({ where: { id } });
    return { deleted: true };
  }
}
