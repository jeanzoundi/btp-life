import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { CarriereService } from './carriere.service';
import { UpdateAvatarDto, SetProfilActuelDto, SetMetierCibleDto, SetTraitsDto, MontantDto } from './dto/carriere.dto';
import { BesoinsService, type ActionBesoin } from './besoins.service';
import { PnjService } from './pnj.service';
import { EpargneService } from './epargne.service';

@UseGuards(JwtAuthGuard)
@Controller('carriere')
export class CarriereController {
  constructor(
    private readonly carriereService: CarriereService,
    private readonly besoinsService: BesoinsService,
    private readonly pnjService: PnjService,
    private readonly epargneService: EpargneService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.carriereService.me(user.userId);
  }

  @Get('prochaine-etape')
  prochaineEtape(@CurrentUser() user: RequestUser) {
    return this.carriereService.prochaineEtape(user.userId);
  }

  @Get('arbre')
  arbre(@CurrentUser() user: RequestUser) {
    return this.carriereService.arbreCarriere(user.userId);
  }

  @Get('streak')
  streak(@CurrentUser() user: RequestUser) {
    return this.carriereService.streak(user.userId);
  }

  @Get('classement')
  classement(@CurrentUser() user: RequestUser) {
    return this.carriereService.classement(user.userId);
  }

  @Get('joueurs-actifs')
  joueursActifs(@CurrentUser() user: RequestUser) {
    return this.carriereService.joueursActifs(user.userId);
  }

  @Get('joueurs/:id')
  profilPublic(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.carriereService.profilPublic(user.userId, id);
  }

  @Get('pnj-actuel')
  pnjActuel(@CurrentUser() user: RequestUser) {
    return this.pnjService.pnjHierarchique(user.userId);
  }

  @Patch('avatar')
  avatar(@CurrentUser() user: RequestUser, @Body() dto: UpdateAvatarDto) {
    return this.carriereService.upsertAvatar(user.userId, dto);
  }

  @Patch('profil-actuel')
  profilActuel(@CurrentUser() user: RequestUser, @Body() dto: SetProfilActuelDto) {
    return this.carriereService.setProfilActuel(user.userId, dto);
  }

  @Patch('metier-cible')
  metierCible(@CurrentUser() user: RequestUser, @Body() dto: SetMetierCibleDto) {
    return this.carriereService.setMetierCible(user.userId, dto);
  }

  @Patch('traits')
  traits(@CurrentUser() user: RequestUser, @Body() dto: SetTraitsDto) {
    return this.carriereService.setTraits(user.userId, dto.traits);
  }

  @Post('generer-parcours')
  genererParcours(@CurrentUser() user: RequestUser) {
    return this.carriereService.genererParcours(user.userId);
  }

  @Post('besoins/:action')
  agirBesoin(@CurrentUser() user: RequestUser, @Param('action') action: ActionBesoin) {
    return this.besoinsService.agir(user.userId, action);
  }

  @Post('epargne/deposer')
  deposerEpargne(@CurrentUser() user: RequestUser, @Body() dto: MontantDto) {
    return this.epargneService.deposer(user.userId, dto.montant);
  }

  @Post('epargne/retirer')
  retirerEpargne(@CurrentUser() user: RequestUser, @Body() dto: MontantDto) {
    return this.epargneService.retirer(user.userId, dto.montant);
  }
}
