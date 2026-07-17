import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribePushDto } from './dto/notifications.dto';
import { MESSAGES_RETOUR_INACTIF, MESSAGES_SERIE_EN_DANGER, messageAleatoire } from './messages';

export interface EnvoyerNotificationParams {
  type: NotificationType;
  titre: string;
  contenu?: string;
  lien?: string;
}

// Marqueur discret dans `lien` pour distinguer les deux sous-catégories de RAPPEL_SERIE sans
// modifier l'enum NotificationType une deuxième fois — voir anti-spam dans executerRappelsQuotidiens.
const LIEN_RETOUR_INACTIF = '/app?rappel=retour';
const LIEN_SERIE_EN_DANGER = '/app?rappel=serie';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly pushConfigure: boolean;

  constructor(private readonly prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    this.pushConfigure = !!(publicKey && privateKey);
    if (this.pushConfigure) {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:contact@btp-life.app', publicKey!, privateKey!);
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY absents — notifications push désactivées (les notifications restent visibles en in-app).');
    }
  }

  async subscribe(userId: string, dto: SubscribePushDto) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { userId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
      update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { statut: 'ok' };
  }

  /** Crée la notification en base ET tente un vrai push navigateur sur chaque appareil abonné —
   * nettoie automatiquement les abonnements expirés (404/410) rencontrés en cours de route. */
  async envoyerNotification(userId: string, params: EnvoyerNotificationParams) {
    const notification = await this.prisma.notification.create({
      data: { userId, type: params.type, titre: params.titre, contenu: params.contenu, lien: params.lien },
    });

    if (!this.pushConfigure) return notification;

    const abonnements = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (!abonnements.length) return notification;

    const payload = JSON.stringify({
      titre: params.titre,
      contenu: params.contenu,
      lien: params.lien ?? '/app',
      id: notification.id,
    });

    let auMoinsUnEnvoiReussi = false;
    await Promise.all(
      abonnements.map(async (abonnement) => {
        try {
          await webpush.sendNotification(
            { endpoint: abonnement.endpoint, keys: { p256dh: abonnement.p256dh, auth: abonnement.auth } },
            payload,
          );
          auMoinsUnEnvoiReussi = true;
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: abonnement.id } }).catch(() => undefined);
          } else {
            this.logger.warn(`Échec d'envoi push (userId=${userId}): ${(err as Error)?.message}`);
          }
        }
      }),
    );

    if (auMoinsUnEnvoiReussi) {
      await this.prisma.notification.update({ where: { id: notification.id }, data: { pushEnvoyee: true } });
    }
    return notification;
  }

  /** Cron quotidien — deux catégories, chacune avec sa propre banque de messages variés :
   * série en danger (a joué hier, pas encore aujourd'hui) et retour après absence (3+ jours). */
  async executerRappelsQuotidiens() {
    const maintenant = new Date();
    const debutAujourdhui = new Date(maintenant);
    debutAujourdhui.setHours(0, 0, 0, 0);
    const debutHier = new Date(debutAujourdhui.getTime() - 24 * 60 * 60 * 1000);
    const seuilInactivite = new Date(debutAujourdhui.getTime() - 3 * 24 * 60 * 60 * 1000);
    // Anti-spam : un joueur inactif de longue date ne reçoit ce rappel qu'une fois tous les 3 jours,
    // pas quotidiennement — la série en danger, elle, se résout naturellement d'un jour sur l'autre.
    const seuilAntiSpamInactif = new Date(maintenant.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [activites, dejaNotifiesInactifs] = await Promise.all([
      this.prisma.userMission.groupBy({
        by: ['userId'],
        where: { termineeLe: { not: null } },
        _max: { termineeLe: true },
      }),
      this.prisma.notification.findMany({
        where: { type: NotificationType.RAPPEL_SERIE, lien: LIEN_RETOUR_INACTIF, createdAt: { gte: seuilAntiSpamInactif } },
        select: { userId: true },
      }),
    ]);
    const dejaNotifiesSet = new Set(dejaNotifiesInactifs.map((n) => n.userId));

    let streakCount = 0;
    let inactifCount = 0;
    for (const activite of activites) {
      const derniere = activite._max.termineeLe;
      if (!derniere) continue;

      if (derniere >= debutHier && derniere < debutAujourdhui) {
        await this.envoyerNotification(activite.userId, {
          type: NotificationType.RAPPEL_SERIE,
          titre: 'Ta série est en jeu !',
          contenu: messageAleatoire(MESSAGES_SERIE_EN_DANGER),
          lien: LIEN_SERIE_EN_DANGER,
        });
        streakCount += 1;
      } else if (derniere < seuilInactivite && !dejaNotifiesSet.has(activite.userId)) {
        await this.envoyerNotification(activite.userId, {
          type: NotificationType.RAPPEL_SERIE,
          titre: 'On ne t\'a pas vu récemment...',
          contenu: messageAleatoire(MESSAGES_RETOUR_INACTIF),
          lien: LIEN_RETOUR_INACTIF,
        });
        inactifCount += 1;
      }
    }

    return { statut: 'ok', usersEvalues: activites.length, streakCount, inactifCount };
  }
}
