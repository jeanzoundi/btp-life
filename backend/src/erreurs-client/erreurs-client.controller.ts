import { Body, Controller, Headers, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ErreurClientDto } from './dto/erreur-client.dto';
import { ErreursClientService } from './erreurs-client.service';

// Ouvert sans connexion : une erreur peut survenir avant (accueil, inscription) ou faire perdre la session. Le débit est
// bridé par adresse, et le navigateur n'envoie au plus que quelques erreurs différentes par page.
@Controller('erreurs-client')
export class ErreursClientController {
  constructor(private readonly erreurs: ErreursClientService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  remonter(@Body() dto: ErreurClientDto, @Headers('user-agent') navigateur?: string) {
    return this.erreurs.enregistrer(dto, navigateur);
  }
}
