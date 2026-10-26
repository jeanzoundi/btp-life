import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import { ProgressionService } from './progression.service';
import { corrigerChapitre } from './campagne-scoring';

// Le fil rouge : une campagne qui suit un même immeuble, la Résidence Akwaba (R+3, huit logements, pour Mme Touré), à
// travers les lieux du quartier, de l'appel d'offres à la réception. Chaque chapitre se joue chez le mentor d'un lieu ;
// le serveur tient la progression et verse les gains. Le contenu des chapitres vit dans le jeu (frontend/src/lib/campagne.ts).

export const CAMPAGNE = { id: 'residence-akwaba', nom: 'Résidence Akwaba', chapitres: 9 } as const;
/** Un chapitre se valide à 50 sur 100 ; en dessous, il se rejoue aussitôt, sans gain. */
export const NOTE_CHAPITRE = 50;
const CLIENTE = 'client-madame-toure';
/** La cliente écrit au joueur aux grands moments : le permis affiché, les clés remises. */
const MESSAGES_CLIENTE: Record<number, string> = {
  4: 'Le permis est affiché sur la parcelle : je suis passée le voir ce matin. Merci pour ce dossier si bien mené, la suite me rend impatiente !',
  9: 'Les clés de la Résidence Akwaba sont dans mes mains. Huit familles vont y vivre grâce à ton travail : je te recommanderai à tout le Plateau.',
};

export interface ProgresCampagne { chapitres: number; termineeLe: string | null }

/** Progression bornée : un JSON abîmé ou absent repart du premier chapitre. */
export function lireCampagne(brut: unknown): ProgresCampagne {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const n = Math.floor(Number(c.chapitres));
  const le = typeof c.termineeLe === 'string' && Number.isFinite(Date.parse(c.termineeLe)) ? c.termineeLe : null;
  return { chapitres: Number.isFinite(n) ? Math.max(0, Math.min(CAMPAGNE.chapitres, n)) : 0, termineeLe: le };
}

/** Gains d'un chapitre selon sa note, avant le facteur des besoins sur l'XP. La réception de l'immeuble rapporte bien plus. */
export function gainsChapitre(chapitre: number, note: number) {
  const reussi = note >= NOTE_CHAPITRE;
  if (!reussi) return { reussi, xp: 0, argent: 0, reputation: 0 };
  const finale = chapitre === CAMPAGNE.chapitres - 1;
  return { reussi, xp: 30 + Math.round(note / 2) + (finale ? 200 : 0), argent: finale ? 25_000 : 2_500, reputation: finale ? 15 : 2 };
}

@Injectable()
export class CampagneService {
  private readonly logger = new Logger(CampagneService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly besoins: BesoinsService,
  ) {}

  async etat(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { campagne: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    return lireCampagne(carriere.campagne);
  }

  async chapitre(userId: string, chapitre: number, brut: unknown) {
    const { note, reponses } = corrigerChapitre(chapitre, brut);
    const empreinte = createHash('sha256').update(JSON.stringify(Object.keys(reponses).sort().map(id =>
      [id, Array.isArray(reponses[id]) ? [...reponses[id] as number[]].sort((a, b) => a - b) : reponses[id]]))).digest('hex');
    await this.besoins.actualiser(userId);
    const gains = gainsChapitre(chapitre, note);
    const maintenant = new Date();
    // Tout ce qui est promis au joueur est validé ensemble. Un reçu permet de
    // retrouver le résultat si la réponse HTTP se perd, sans payer une deuxième fois.
    const operation = () => this.prisma.$transaction(async (tx) => {
      const carriere = await tx.userCarriere.findUnique({ where: { userId } });
      if (!carriere) throw new NotFoundException('Carrière introuvable');
      const avant = lireCampagne(carriere.campagne);
      const recus = ((carriere.campagne as Record<string, unknown> | null)?.recus ?? {}) as Record<string, {
        empreinte: string; note: number; gains: { reussi: boolean; xp: number; argent: number; reputation: number; facteurBesoins: number };
      }>;
      const recu = recus[String(chapitre)];
      if (chapitre < avant.chapitres && recu?.empreinte === empreinte) {
        return { progres: avant, note: recu.note, gains: recu.gains, ancienNiveau: carriere.niveau, nouveauNiveau: carriere.niveau };
      }
      if (chapitre !== avant.chapitres) throw new ConflictException('Ce chapitre n’est plus celui en cours : actualise la page.');
      const facteurBesoins = BesoinsService.facteurPerformance(carriere);
      const recompense = { ...gains, xp: Math.round(gains.xp * facteurBesoins), facteurBesoins };
      if (!gains.reussi) return { progres: avant, note, gains: recompense, ancienNiveau: carriere.niveau, nouveauNiveau: carriere.niveau };
      const chapitres = avant.chapitres + 1;
      const suivant: ProgresCampagne = { chapitres, termineeLe: chapitres >= CAMPAGNE.chapitres ? maintenant.toISOString() : null };
      await tx.userCarriere.update({ where: { userId }, data: {
        campagne: { ...suivant, recus: { ...recus, [chapitre]: { empreinte, note, gains: recompense } } } as unknown as Prisma.InputJsonValue,
        energie: Math.max(0, carriere.energie - 5), faim: Math.max(0, carriere.faim - 4),
      } });
      const payee = await this.progression.appliquerDelta(userId, { xp: recompense.xp, argentVirtuel: gains.argent, reputation: gains.reputation }, tx);
      if (!payee) throw new NotFoundException('Carrière introuvable');
      if (chapitres >= CAMPAGNE.chapitres) {
        await tx.carriereHistorique.create({ data: { userId, type: 'CHANTIER_LIVRE', details: { campagne: CAMPAGNE.id, nom: CAMPAGNE.nom } } });
      }
      const message = MESSAGES_CLIENTE[chapitres];
      if (message) {
        const cliente = await tx.pnj.findUnique({ where: { slug: CLIENTE }, select: { id: true } });
        if (cliente) await tx.userMessage.create({ data: { userId, pnjId: cliente.id, contenu: message } });
      }
      return { progres: suivant, note, gains: recompense, ancienNiveau: carriere.niveau, nouveauNiveau: payee.niveau };
    }, { isolationLevel: 'Serializable', timeout: 10000 });
    for (let tentative = 0; ; tentative++) {
      try {
        const { ancienNiveau, nouveauNiveau, ...resultat } = await operation();
        // Les notifications ne doivent pas transformer un paiement validé en erreur HTTP.
        try { await this.progression.notifierNiveau(userId, ancienNiveau, nouveauNiveau); }
        catch { this.logger.warn('Notification de niveau indisponible après validation du chapitre'); }
        return resultat;
      } catch (erreur) {
        if ((erreur as { code?: string }).code !== 'P2034' || tentative >= 2) throw erreur;
      }
    }
  }
}
