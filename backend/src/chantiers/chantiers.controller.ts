import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsPositive, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { ChantiersService } from './chantiers.service';

class CommanderDto {
  @IsString()
  ressourceId: string;

  @IsInt()
  @IsPositive()
  quantite: number;
}

class EmbaucherDto {
  @IsString()
  poste: string;
}

@UseGuards(JwtAuthGuard)
@Controller('chantiers')
export class ChantiersController {
  constructor(private readonly chantiersService: ChantiersService) {}

  @Get('mine')
  mine(@CurrentUser() user: RequestUser) {
    return this.chantiersService.mine(user.userId);
  }

  @Get('mine/:id')
  detailMine(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chantiersService.detailMine(user.userId, id);
  }

  @Post(':id/demarrer')
  demarrer(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chantiersService.demarrer(user.userId, id);
  }

  @Post('mine/:id/commander')
  commander(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CommanderDto) {
    return this.chantiersService.commander(user.userId, id, dto.ressourceId, dto.quantite);
  }

  @Post('mine/:id/embaucher')
  embaucher(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: EmbaucherDto) {
    return this.chantiersService.embaucher(user.userId, id, dto.poste);
  }

  @Post('mine/:id/ouvriers/:ouvrierId/licencier')
  licencier(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ouvrierId') ouvrierId: string) {
    return this.chantiersService.licencier(user.userId, id, ouvrierId);
  }

  @Post('mine/:id/ouvriers/:ouvrierId/repos')
  repos(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('ouvrierId') ouvrierId: string) {
    return this.chantiersService.basculerRepos(user.userId, id, ouvrierId);
  }

  @Post('mine/:id/journee')
  journee(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chantiersService.journee(user.userId, id);
  }

  @Post('mine/:id/abandonner')
  abandonner(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chantiersService.abandonner(user.userId, id);
  }
}
