import { Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Déclenché par un cron Vercel (voir vercel.json) — protégé par un secret partagé, pas par
// l'authentification utilisateur habituelle. Double garde volontaire : CRON_SECRET contrôle qui
// peut appeler cet endpoint, CRON_ENVOI_ACTIF contrôle si un appel autorisé envoie réellement des
// notifications à de vrais joueurs — les deux doivent être vrais pour un envoi effectif en prod.
@Controller('notifications/cron')
export class NotificationsCronController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('rappels')
  async rappels(@Headers('x-cron-secret') secret?: string) {
    const secretAttendu = process.env.CRON_SECRET;
    if (!secretAttendu || secret !== secretAttendu) {
      throw new UnauthorizedException();
    }
    if (process.env.CRON_ENVOI_ACTIF !== 'true') {
      return { statut: 'desactive', message: 'CRON_ENVOI_ACTIF non activé — aucun envoi effectué.' };
    }
    return this.notificationsService.executerRappelsQuotidiens();
  }
}
