import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get(':resource')
  list(@Param('resource') resource: string, @Query() query: Record<string, string>) {
    return this.catalog.list(resource, query);
  }

  @Get(':resource/slug/:slug')
  getBySlug(@Param('resource') resource: string, @Param('slug') slug: string) {
    return this.catalog.getBySlug(resource, slug);
  }

  @Get(':resource/:id')
  getById(@Param('resource') resource: string, @Param('id') id: string) {
    return this.catalog.getById(resource, id);
  }
}
