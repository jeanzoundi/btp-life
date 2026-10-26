import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { AchatOutilDto, CreationEntrepriseDto, DecisionImprevuDto, DemenagementDto, EmbaucheDto, LicenciementDto, MessageQuartierDto, MetreDto, MouvementEntrepriseDto, PresenceDto, RenovationDto, TransportDto } from './dto/monde.dto';
import { EnLigneService } from './en-ligne.service';
import { EntrepriseService } from './entreprise.service';
import { PatrimoineService } from './patrimoine.service';
import { DefisService } from './defis.service';
import { TransportService } from './transport.service';

/** La vie du quartier hors carrière : se déplacer, relever les défis, se loger, discuter entre voisins. */
@UseGuards(JwtAuthGuard)
@Controller('monde')
export class MondeController {
  constructor(
    private readonly transport: TransportService,
    private readonly defis: DefisService,
    private readonly patrimoine: PatrimoineService,
    private readonly entreprise: EntrepriseService,
    private readonly enLigne: EnLigneService,
  ) {}

  // Toutes les dix secondes environ par joueur connecté ; la limite laisse de la marge pour les émotes.
  @Post('presence')
  @Throttle({ default: { ttl: 60_000, limit: 40 } })
  signalerPresence(@CurrentUser() user: RequestUser, @Body() dto: PresenceDto) {
    return this.enLigne.signaler(user.userId, dto);
  }

  @Get('chat')
  messagesDuQuartier(@Query('depuis') depuis?: string) {
    return this.enLigne.messages(depuis);
  }

  @Post('chat')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  ecrireAuQuartier(@CurrentUser() user: RequestUser, @Body() dto: MessageQuartierDto) {
    return this.enLigne.ecrire(user.userId, dto.texte);
  }

  @Post('transport')
  async payerTransport(@CurrentUser() user: RequestUser, @Body() dto: TransportDto) {
    const course = await this.transport.payer(user.userId, dto.mode, dto.distance, dto.pluie ?? false);
    // Le trajet compte pour les défis ; un compteur indisponible ne doit pas faire échouer une course payée.
    await this.defis.compterTrajet(user.userId).catch(() => undefined);
    return course;
  }

  @Get('defis')
  defisDuMoment(@CurrentUser() user: RequestUser) {
    return this.defis.etat(user.userId);
  }

  @Post('defis/:slug/reclamer')
  reclamerDefi(@CurrentUser() user: RequestUser, @Param('slug') slug: string) {
    return this.defis.reclamer(user.userId, slug);
  }

  @Get('imprevu')
  imprevuDuJour(@CurrentUser() user: RequestUser) {
    return this.defis.imprevu(user.userId);
  }

  @Post('imprevu')
  deciderImprevu(@CurrentUser() user: RequestUser, @Body() dto: DecisionImprevuDto) {
    return this.defis.deciderImprevu(user.userId, dto.option);
  }

  @Get('patrimoine')
  patrimoineDuJoueur(@CurrentUser() user: RequestUser) {
    return this.patrimoine.etat(user.userId);
  }

  @Post('patrimoine/logement')
  demenager(@CurrentUser() user: RequestUser, @Body() dto: DemenagementDto) {
    return this.patrimoine.demenager(user.userId, dto.niveau);
  }

  @Post('patrimoine/renovation')
  commencerRenovation(@CurrentUser() user: RequestUser, @Body() dto: RenovationDto) {
    return this.patrimoine.commencerRenovation(user.userId, dto.slug);
  }

  @Post('patrimoine/renovation/metre')
  metrer(@CurrentUser() user: RequestUser, @Body() dto: MetreDto) {
    return this.patrimoine.metrer(user.userId, dto.reponse);
  }

  @Post('patrimoine/renovation/materiaux')
  acheterMateriaux(@CurrentUser() user: RequestUser) {
    return this.patrimoine.acheterMateriaux(user.userId);
  }

  @Post('patrimoine/renovation/journee')
  journeeTravaux(@CurrentUser() user: RequestUser) {
    return this.patrimoine.journeeTravaux(user.userId);
  }

  @Post('patrimoine/renovation/abandon')
  abandonnerRenovation(@CurrentUser() user: RequestUser) {
    return this.patrimoine.abandonnerRenovation(user.userId);
  }

  @Post('patrimoine/arrieres')
  payerArrieres(@CurrentUser() user: RequestUser) {
    return this.patrimoine.payerArrieres(user.userId);
  }

  @Post('patrimoine/outils')
  acheterOutil(@CurrentUser() user: RequestUser, @Body() dto: AchatOutilDto) {
    return this.patrimoine.acheterOutil(user.userId, dto.outil);
  }

  @Get('entreprise')
  entrepriseDuJoueur(@CurrentUser() user: RequestUser) {
    return this.entreprise.etat(user.userId);
  }

  @Post('entreprise')
  creerEntreprise(@CurrentUser() user: RequestUser, @Body() dto: CreationEntrepriseDto) {
    return this.entreprise.creer(user.userId, dto.nom, dto.apport);
  }

  @Post('entreprise/mouvement')
  mouvementEntreprise(@CurrentUser() user: RequestUser, @Body() dto: MouvementEntrepriseDto) {
    return this.entreprise.mouvement(user.userId, dto.montant);
  }

  @Post('entreprise/embaucher')
  embaucher(@CurrentUser() user: RequestUser, @Body() dto: EmbaucheDto) {
    return this.entreprise.embaucher(user.userId, dto.poste);
  }

  @Post('entreprise/licencier')
  licencier(@CurrentUser() user: RequestUser, @Body() dto: LicenciementDto) {
    return this.entreprise.licencier(user.userId, dto.rang);
  }
}
