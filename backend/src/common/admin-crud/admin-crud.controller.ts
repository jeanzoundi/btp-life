import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCrudService } from './admin-crud.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminCrudController {
  constructor(private readonly adminCrud: AdminCrudService) {}

  @Get(':resource')
  list(@Param('resource') resource: string, @Query() query: Record<string, string>) {
    return this.adminCrud.list(resource, query);
  }

  @Get(':resource/:id')
  getById(@Param('resource') resource: string, @Param('id') id: string) {
    return this.adminCrud.getById(resource, id);
  }

  @Post(':resource')
  create(@Param('resource') resource: string, @Body() body: Record<string, unknown>) {
    return this.adminCrud.create(resource, body);
  }

  @Patch(':resource/:id')
  update(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminCrud.update(resource, id, body);
  }

  @Delete(':resource/:id')
  remove(@Param('resource') resource: string, @Param('id') id: string) {
    return this.adminCrud.remove(resource, id);
  }
}
