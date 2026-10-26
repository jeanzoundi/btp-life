import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { CarriereService } from './carriere.service';
import { UpdateAvatarDto, SetProfilActuelDto, SetMetierCibleDto, SetTraitsDto, MontantDto, DevenirEntrepreneurDto, NomEntrepriseDto, EquiperItemAvatarDto, UpdateEtatMondeDto, SeanceLieuDto, ActionBesoinDto, ChoisirPersonnageDto, TempsMondeDto, ChapitreCampagneDto } from './dto/carriere.dto';
import { BesoinsService, type ActionBesoin } from './besoins.service';
import { PnjService } from './pnj.service';
import { EpargneService } from './epargne.service';
import { AvatarItemsService } from './avatar-items.service';
import { LieuxService } from './lieux.service';
import { CampagneService } from './campagne.service';

@UseGuards(JwtAuthGuard)
@Controller('carriere')
export class CarriereController {
  constructor(
    private readonly carriereService: CarriereService,
    private readonly besoinsService: BesoinsService,
    private readonly pnjService: PnjService,
    private readonly epargneService: EpargneService,
    private readonly avatarItemsService: AvatarItemsService,
    private readonly lieuxService: LieuxService,
    private readonly campagneService: CampagneService,
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

  @Get('chronologie')
  chronologie(@CurrentUser() user: RequestUser) {
    return this.carriereService.chronologie(user.userId);
  }

  @Get('streak')
  streak(@CurrentUser() user: RequestUser) {
    return this.carriereService.streak(user.userId);
  }

  @Get('cours-termines')
  coursTermines(@CurrentUser() user: RequestUser) {
    return this.carriereService.coursTermines(user.userId);
  }

  @Post('cours/:coursId/termine')
  marquerCoursTermine(@CurrentUser() user: RequestUser, @Param('coursId') coursId: string) {
    return this.carriereService.marquerCoursTermine(user.userId, coursId);
  }

  @Get('classement')
  classement(@CurrentUser() user: RequestUser) {
    return this.carriereService.classement(user.userId);
  }

  @Get('joueurs-actifs')
  joueursActifs(@CurrentUser() user: RequestUser) {
    return this.carriereService.joueursActifs(user.userId);
  }

  @Get('monde')
  etatMonde(@CurrentUser() user: RequestUser) {
    return this.carriereService.etatMonde(user.userId);
  }

  @Patch('monde')
  sauvegarderMonde(@CurrentUser() user: RequestUser, @Body() dto: UpdateEtatMondeDto) {
    return this.carriereService.sauvegarderEtatMonde(user.userId, dto.etat);
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

  @Patch('avatar/personnage')
  choisirPersonnage(@CurrentUser() user: RequestUser, @Body() dto: ChoisirPersonnageDto) {
    return this.carriereService.choisirPersonnage(user.userId, dto);
  }

  @Get('avatar/dressing')
  dressing(@CurrentUser() user: RequestUser) {
    return this.avatarItemsService.catalogue(user.userId);
  }

  @Get('avatar/inventaire')
  inventaireAvatar(@CurrentUser() user: RequestUser) {
    return this.avatarItemsService.inventaire(user.userId);
  }

  @Post('avatar/equiper')
  equiperItemAvatar(@CurrentUser() user: RequestUser, @Body() dto: EquiperItemAvatarDto) {
    return this.avatarItemsService.equiper(user.userId, dto.itemId);
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

  @Post('devenir-entrepreneur')
  devenirEntrepreneur(@CurrentUser() user: RequestUser, @Body() dto: DevenirEntrepreneurDto) {
    return this.carriereService.devenirEntrepreneur(user.userId, dto.nomEntreprise);
  }

  @Patch('nom-entreprise')
  renommerEntreprise(@CurrentUser() user: RequestUser, @Body() dto: NomEntrepriseDto) {
    return this.carriereService.renommerEntreprise(user.userId, dto.nom);
  }

  @Get('lieux')
  progresLieux(@CurrentUser() user: RequestUser) {
    return this.lieuxService.progres(user.userId);
  }

  @Post('lieux/:slug/seance')
  seanceLieu(@CurrentUser() user: RequestUser, @Param('slug') slug: string, @Body() dto: SeanceLieuDto) {
    return this.lieuxService.seance(user.userId, slug, dto.etape, dto.note);
  }

  /** Le fil rouge : où en est la Résidence Akwaba. */
  @Get('campagne')
  campagne(@CurrentUser() user: RequestUser) {
    return this.campagneService.etat(user.userId);
  }

  @Post('campagne/chapitre')
  chapitreCampagne(@CurrentUser() user: RequestUser, @Body() dto: ChapitreCampagneDto) {
    return this.campagneService.chapitre(user.userId, dto.chapitre, dto.reponses);
  }

  @Post('besoins/:action')
  agirBesoin(@CurrentUser() user: RequestUser, @Param('action') action: ActionBesoin, @Body() dto: ActionBesoinDto) {
    return this.besoinsService.agir(user.userId, action, { article: dto?.article, tablee: dto?.tablee, remise: dto?.remise, victoire: dto?.victoire });
  }

  /** Le monde vivant déclare les heures de jeu passées : les besoins y baissent au rythme du monde. */
  @Post('temps-monde')
  passerTempsMonde(@CurrentUser() user: RequestUser, @Body() dto: TempsMondeDto) {
    return this.besoinsService.passerTemps(user.userId, dto.heures, dto.sommeil);
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
