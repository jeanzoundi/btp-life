import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { transactionSerializable } from '../prisma/transaction';
import { BesoinsService } from './besoins.service';
import { ProgressionService } from './progression.service';
import { bonusParcours, porteDuProfil } from './parcours';
import { coequipiersPresents, facteurEquipe, REGLES_EQUIPE } from '../monde/equipe.service';
import {
  corrigerJournee, DELAI_JOURNEE_MS, gainsJournee, jourAttendu, lireChantierQuartier, TAUX_ENTRAINEMENT_JOURNEE, TOTAL_JOURS_CHANTIER,
  type ChantierQuartierServeur,
} from './journee-chantier';

// Le premier travail payé du jeu, sans avoir son propre chantier : une journée avec Yao sur le chantier du quartier.
// Le serveur tient l'avancement de l'ouvrage, corrige les situations du jour et verse le salaire (une journée payée toutes
// les 20 minutes réelles au plus) ; l'équipe recrutée et le repos du jour restent dans le navigateur. Faite pendant qu'un
// coéquipier est lui aussi sur le chantier, c'est une journée en équipe : +10 % d'XP, comme les séances (lieux.service.ts).
@Injectable()
export class JourneeChantierService {
  private readonly logger = new Logger(JourneeChantierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly besoins: BesoinsService,
  ) {}

  async progres(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { chantierQuartier: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    return lireChantierQuartier(carriere.chantierQuartier);
  }

  /** Une journée terminée : les choix bruts de chaque situation du jour, corrigés ici. */
  async journee(userId: string, numero: number, reponses: unknown) {
    // L'état du personnage module l'XP, comme pour les séances et les missions (jamais sous 70 %).
    const actualisee = await this.besoins.actualiser(userId);
    const facteurBesoins = BesoinsService.facteurPerformance(actualisee);
    const maintenant = Date.now();
    // Les coéquipiers signalés sur le chantier en ce moment (leur relevé de présence dit le lieu où ils sont).
    const coequipiers = await coequipiersPresents(this.prisma, userId, 'chantier', new Date(maintenant));

    // Lecture, contrôle du jour et écriture dans une même transaction : deux envois simultanés de la même journée ne la
    // comptent (et ne la paient) qu'une fois.
    const r = await transactionSerializable(this.prisma, async (tx) => {
      const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { chantierQuartier: true, niveau: true, profilActuel: { select: { slug: true } } } });
      if (!carriere) throw new NotFoundException('Carrière introuvable');
      const avant = lireChantierQuartier(carriere.chantierQuartier);
      if (!jourAttendu(avant, numero)) throw new ConflictException('Cette journée n’est plus celle du chantier : actualise la page.');
      const { note } = corrigerJournee(numero, reponses);
      const gains = gainsJournee(note);
      const jours = Math.min(TOTAL_JOURS_CHANTIER, numero + (gains.compte ? 1 : 0));
      const livraison = jours >= TOTAL_JOURS_CHANTIER;
      const payee = !avant.derniereRecompenseLe || maintenant - Date.parse(avant.derniereRecompenseLe) >= DELAI_JOURNEE_MS;
      const apres: ChantierQuartierServeur = {
        jours, journees: avant.journees + 1, livraisons: avant.livraisons + (livraison ? 1 : 0),
        derniereRecompenseLe: payee ? new Date(maintenant).toISOString() : avant.derniereRecompenseLe,
      };
      await tx.userCarriere.update({ where: { userId }, data: { chantierQuartier: apres as unknown as Prisma.InputJsonValue } });
      // Le parcours du joueur : l'ouvrier est mieux payé, l'encadrant gagne en expérience et en réputation (parcours.ts).
      const bonus = bonusParcours(porteDuProfil(carriere.profilActuel?.slug), { type: 'journee' });
      const xp = Math.round(gains.xp * facteurBesoins * facteurEquipe(coequipiers) * bonus.xp * (payee ? 1 : TAUX_ENTRAINEMENT_JOURNEE));
      const argent = payee ? Math.round(gains.argent * bonus.argent) : 0;
      const reputation = !payee ? 0 : (livraison ? 3 : gains.compte && note >= 60 ? 1 : 0) + (gains.compte ? bonus.reputation : 0);
      const payement = await this.progression.appliquerDelta(userId, { xp, argentVirtuel: argent, reputation }, tx);
      // Une journée de chantier fatigue et creuse davantage qu'une séance.
      await this.besoins.consommer(userId, { energie: 8, faim: 6 }, tx);
      return { apres, note, payee, xp, argent, reputation, ancienNiveau: carriere.niveau, nouveauNiveau: payement?.niveau ?? carriere.niveau };
    });
    try { await this.progression.notifierNiveau(userId, r.ancienNiveau, r.nouveauNiveau); }
    catch { this.logger.warn('Notification indisponible après une journée de chantier validée'); }
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    return {
      progres: r.apres,
      /** La note calculée par le serveur : celle qui fait foi, affichée au bilan. */
      note: r.note,
      gains: {
        xp: r.xp, argent: r.argent, reputation: r.reputation, facteurBesoins, entrainement: !r.payee,
        equipe: coequipiers.length ? { coequipiers, bonus: REGLES_EQUIPE.bonusXp } : null,
        prochaineRecompenseLe: new Date(Date.parse(r.apres.derniereRecompenseLe ?? new Date(maintenant).toISOString()) + DELAI_JOURNEE_MS).toISOString(),
      },
      carriere,
    };
  }
}
