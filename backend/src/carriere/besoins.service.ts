import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Système de besoins façon "jeu de simulation de vie" : quatre jauges qui se
// dégradent avec le temps réel écoulé et se restaurent par des actions.
// Le calcul est "paresseux" (à la lecture) pour fonctionner sans tâche planifiée
// — indispensable en environnement serverless (Vercel).

const TAUX_DECLIN_PAR_HEURE = { energie: 4, faim: 6, social: 2, moral: 1 };
const HEURES_MAX_PRISES_EN_COMPTE = 72; // au-delà, on plafonne (éviter des écarts absurdes après une longue absence)

export type ActionBesoin = 'repos' | 'repas' | 'social';

// Manger et socialiser coûtent un peu d'argent réel (comme dans la vraie vie) — seul le repos
// chez soi reste gratuit. Ça donne une vraie raison de dépenser l'argent gagné en missions/chantiers.
const EFFETS_ACTION: Record<ActionBesoin, { cible: 'energie' | 'faim' | 'social'; valeur: number; bonusMoral: number; cout: number; message: string }> = {
  repos: { cible: 'energie', valeur: 100, bonusMoral: 4, cout: 0, message: 'Tu te sens reposé(e) et prêt(e) à repartir.' },
  repas: { cible: 'faim', valeur: 100, bonusMoral: 3, cout: 1200, message: 'Un bon repas, ça remet les idées en place.' },
  social: { cible: 'social', valeur: 100, bonusMoral: 6, cout: 900, message: 'Ça fait du bien de discuter un peu !' },
};

interface CarriereBesoins {
  energie: number;
  moral: number;
  faim: number;
  social: number;
  derniereMajBesoins: Date;
}

function decliner(carriere: CarriereBesoins, maintenant: Date) {
  const heuresEcoulees = Math.min(
    HEURES_MAX_PRISES_EN_COMPTE,
    Math.max(0, (maintenant.getTime() - carriere.derniereMajBesoins.getTime()) / 3_600_000),
  );
  return {
    energie: Math.max(0, Math.round(carriere.energie - TAUX_DECLIN_PAR_HEURE.energie * heuresEcoulees)),
    faim: Math.max(0, Math.round(carriere.faim - TAUX_DECLIN_PAR_HEURE.faim * heuresEcoulees)),
    social: Math.max(0, Math.round(carriere.social - TAUX_DECLIN_PAR_HEURE.social * heuresEcoulees)),
    moral: Math.max(0, Math.round(carriere.moral - TAUX_DECLIN_PAR_HEURE.moral * heuresEcoulees)),
  };
}

@Injectable()
export class BesoinsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Applique le déclin depuis la dernière mise à jour et persiste le résultat. */
  async actualiser(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    const maintenant = new Date();
    const decline = decliner(carriere, maintenant);
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { ...decline, derniereMajBesoins: maintenant },
    });
  }

  async agir(userId: string, action: ActionBesoin) {
    const effet = EFFETS_ACTION[action];
    if (!effet) throw new BadRequestException('Action inconnue');

    const actualisee = await this.actualiser(userId);
    const valeurActuelle = actualisee[effet.cible];
    if (valeurActuelle >= 98) {
      return { carriere: actualisee, message: "C'est déjà au maximum !", change: false, coutPaye: 0 };
    }
    if (effet.cout > 0 && actualisee.argentVirtuel < effet.cout) {
      throw new BadRequestException(
        `Pas assez d'argent : ${effet.cout.toLocaleString('fr-FR')} F requis (solde ${actualisee.argentVirtuel.toLocaleString('fr-FR')} F)`,
      );
    }

    const maj = await this.prisma.userCarriere.update({
      where: { userId },
      data: {
        [effet.cible]: effet.valeur,
        moral: Math.min(100, actualisee.moral + effet.bonusMoral),
        ...(effet.cout > 0 ? { argentVirtuel: { decrement: effet.cout } } : {}),
      },
    });
    return { carriere: maj, message: effet.message, change: true, coutPaye: effet.cout };
  }

  /** Consommation d'énergie/faim par le jeu (missions, journées de chantier…) — sans dépasser 0. */
  async consommer(userId: string, delta: { energie?: number; faim?: number }) {
    const actualisee = await this.actualiser(userId);
    return this.prisma.userCarriere.update({
      where: { userId },
      data: {
        energie: Math.max(0, Math.min(100, actualisee.energie - (delta.energie ?? 0))),
        faim: Math.max(0, Math.min(100, actualisee.faim - (delta.faim ?? 0))),
      },
    });
  }

  /** Facteur de performance (0,7 à 1,0) appliqué aux gains d'XP selon l'état du personnage. */
  static facteurPerformance(b: { energie: number; moral: number; faim: number; social: number }): number {
    const moyenne = (b.energie + b.moral + b.faim + b.social) / 4;
    return Math.max(0.7, Math.min(1, 0.7 + (moyenne / 100) * 0.3));
  }
}
