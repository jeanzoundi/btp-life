import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import { ProgressionService } from './progression.service';
import { corrigerChapitre } from './campagne-scoring';

// Le fil rouge : des dossiers joués l'un après l'autre, chacun un immeuble suivi à travers les lieux du quartier. D'abord
// la Résidence Akwaba (R+3, huit logements, pour Mme Touré), de l'appel d'offres à la réception, puis l'année de garantie,
// le décompte final et le retour d'expérience ; ensuite la Résidence Les Rôniers (R+5, dix logements et deux commerces,
// pour son frère Daouda). Leurs chapitres se suivent dans une seule progression. Chaque chapitre se joue chez le mentor
// d'un lieu ; le serveur tient la progression et verse les gains. Le contenu des chapitres vit dans le jeu
// (frontend/src/lib/campagne.ts et dossier-roniers.ts), son corrigé ici (campagne-corrige.json).

/** Un chapitre se valide à 50 sur 100 ; en dessous, il se rejoue aussitôt, sans gain. */
export const NOTE_CHAPITRE = 50;

interface Dossier {
  id: string; nom: string; chapitres: number;
  /** Chapitres du dossier validés à la livraison : la réception livre l'immeuble. */
  livraison: number;
  /** Le client, qui écrit au joueur aux grands moments du dossier (clé : chapitres du dossier validés). */
  client: string; messages: Record<number, string>;
  /** Gains d'un chapitre ordinaire, de la livraison et de la clôture ; l'XP vaut `xpBase` + la moitié de la note + la prime. */
  argent: { chapitre: number; livraison: number; cloture: number };
  xpBase: number; xpPrime: { livraison: number; cloture: number };
  reputation: { chapitre: number; livraison: number; cloture: number };
}

const DOSSIERS_SANS_RANG: Dossier[] = [
  {
    id: 'residence-akwaba', nom: 'Résidence Akwaba', chapitres: 12, livraison: 9, client: 'client-madame-toure',
    messages: {
      4: 'Le permis est affiché sur la parcelle : je suis passée le voir ce matin. Merci pour ce dossier si bien mené, la suite me rend impatiente !',
      9: 'Les clés de la Résidence Akwaba sont dans mes mains. Huit familles vont y vivre grâce à ton travail : je te recommanderai à tout le Plateau.',
      12: 'La réception définitive est signée et le marché soldé. Mon frère prépare un immeuble à Cocody : je lui ai donné ton nom, et conseillé de ne pas chercher ailleurs.',
    },
    argent: { chapitre: 2_500, livraison: 25_000, cloture: 10_000 }, xpBase: 30, xpPrime: { livraison: 200, cloture: 100 }, reputation: { chapitre: 2, livraison: 15, cloture: 8 },
  },
  {
    id: 'residence-roniers', nom: 'Résidence Les Rôniers', chapitres: 12, livraison: 11, client: 'client-daouda-toure',
    messages: {
      4: 'Le permis est affiché sur la palissade ! M. Diallo est venu le lire avec moi : il a apprécié qu’on le reçoive à la mairie. Ma sœur avait raison à ton sujet.',
      11: 'Les clés sont remises et les deux commerces ouvrent lundi. Dix familles s’installent aux Rôniers : merci, au nom de toute la famille Touré.',
      12: 'Bâti-Express et toi, ensemble pour un groupe scolaire ? Ma sœur n’en revient pas. Le dossier des Rôniers est clos : je te recommanderai à tout le quartier.',
    },
    argent: { chapitre: 4_000, livraison: 40_000, cloture: 15_000 }, xpBase: 40, xpPrime: { livraison: 250, cloture: 120 }, reputation: { chapitre: 3, livraison: 20, cloture: 10 },
  },
  {
    id: 'groupe-scolaire', nom: 'Groupe scolaire des Palmiers', chapitres: 8, livraison: 7, client: 'client-mairie-kanga',
    messages: {
      3: 'L’ordre de service est notifié : le chantier de l’école peut commencer. La mairie compte sur le groupement pour la rentrée.',
      7: 'Les élèves ont fait leur rentrée dans des classes claires et fraîches. Merci au groupement : la mairie s’en souviendra.',
      8: 'Le groupement est soldé. La mairie lance un centre de santé : votre offre sera la bienvenue.',
    },
    argent: { chapitre: 5_000, livraison: 50_000, cloture: 18_000 }, xpBase: 50, xpPrime: { livraison: 260, cloture: 130 }, reputation: { chapitre: 4, livraison: 25, cloture: 12 },
  },
  {
    id: 'centre-sante', nom: 'Centre de santé de la Lagune', chapitres: 8, livraison: 7, client: 'client-docteur-fofana',
    messages: {
      7: 'Nos premiers patients sont soignés dans un centre propre, ventilé et sûr. Merci pour votre exigence, jusqu’à l’éclairage de secours.',
      8: 'Le décompte est soldé. Tantie Bintou m’a parlé de son marché couvert : je lui ai donné votre nom.',
    },
    argent: { chapitre: 6_000, livraison: 60_000, cloture: 20_000 }, xpBase: 55, xpPrime: { livraison: 270, cloture: 140 }, reputation: { chapitre: 4, livraison: 25, cloture: 12 },
  },
  {
    id: 'marche-couvert', nom: 'Marché couvert du Plateau', chapitres: 8, livraison: 7, client: 'client-tantie-bintou',
    messages: {
      7: 'Soixante étals à l’abri de la pluie et du soleil : les commerçantes vendent dans un vrai marché. Le garba est offert, passe quand tu veux !',
      8: 'Les loyers remboursent le prêt, et il reste de quoi entretenir la halle. L’université cherche une entreprise sérieuse : je leur ai parlé de toi.',
    },
    argent: { chapitre: 7_000, livraison: 70_000, cloture: 22_000 }, xpBase: 60, xpPrime: { livraison: 280, cloture: 150 }, reputation: { chapitre: 5, livraison: 30, cloture: 14 },
  },
  {
    id: 'residence-universitaire', nom: 'Résidence universitaire des Bâtisseurs', chapitres: 8, livraison: 7, client: 'client-professeur-ndri',
    messages: {
      7: 'Les étudiants sont installés, à temps pour la rentrée. La préfabrication a tenu ses promesses.',
      8: 'La Régie des eaux prépare un château d’eau pour les Jardins : nous vous avons recommandés.',
    },
    argent: { chapitre: 8_000, livraison: 80_000, cloture: 25_000 }, xpBase: 65, xpPrime: { livraison: 290, cloture: 160 }, reputation: { chapitre: 5, livraison: 30, cloture: 15 },
  },
  {
    id: 'chateau-eau', nom: 'Château d’eau des Jardins', chapitres: 8, livraison: 7, client: 'client-regie-yeo',
    messages: {
      7: 'Le château d’eau est en service : six mille habitants ont l’eau au robinet, sous une pression régulière.',
      8: 'Le dossier est clos. Un ouvrage qui dessert tout un quartier : bravo à toute l’équipe.',
    },
    argent: { chapitre: 9_000, livraison: 90_000, cloture: 30_000 }, xpBase: 70, xpPrime: { livraison: 300, cloture: 180 }, reputation: { chapitre: 6, livraison: 35, cloture: 18 },
  },
];
/** Les dossiers, avec le rang de leur premier chapitre dans tout le fil rouge. */
export const DOSSIERS = DOSSIERS_SANS_RANG.map((d, i) => ({ ...d, debut: DOSSIERS_SANS_RANG.slice(0, i).reduce((n, x) => n + x.chapitres, 0) }));
export const CAMPAGNE = { chapitres: DOSSIERS.reduce((n, d) => n + d.chapitres, 0) } as const;
/** Le dossier d'un chapitre (rang dans le fil rouge), et la place du chapitre dans ce dossier. */
export function dossierDe(chapitre: number) {
  const dossier = DOSSIERS.find(d => chapitre < d.debut + d.chapitres) ?? DOSSIERS[DOSSIERS.length - 1];
  return { dossier, rang: chapitre - dossier.debut };
}

export interface ProgresCampagne { chapitres: number; termineeLe: string | null }

/** Progression bornée : un JSON abîmé ou absent repart du premier chapitre. La date de fin ne vaut que pour un fil rouge
 * entièrement clos : une campagne finie à la livraison d'un immeuble, ou à la fin d'un dossier, reprend au chapitre suivant. */
export function lireCampagne(brut: unknown): ProgresCampagne {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const n = Math.floor(Number(c.chapitres));
  const le = typeof c.termineeLe === 'string' && Number.isFinite(Date.parse(c.termineeLe)) ? c.termineeLe : null;
  const chapitres = Number.isFinite(n) ? Math.max(0, Math.min(CAMPAGNE.chapitres, n)) : 0;
  return { chapitres, termineeLe: chapitres >= CAMPAGNE.chapitres ? le : null };
}

/** Gains d'un chapitre selon sa note, avant le facteur des besoins sur l'XP : le barème de son dossier. La réception, qui
 * livre l'immeuble, rapporte bien plus ; le dernier chapitre du dossier, qui le clôt, un peu plus. */
export function gainsChapitre(chapitre: number, note: number) {
  const reussi = note >= NOTE_CHAPITRE;
  if (!reussi) return { reussi, xp: 0, argent: 0, reputation: 0 };
  const { dossier: d, rang } = dossierDe(chapitre);
  const quand = rang === d.livraison - 1 ? 'livraison' : rang === d.chapitres - 1 ? 'cloture' : 'chapitre';
  return {
    reussi,
    xp: d.xpBase + Math.round(note / 2) + (quand === 'chapitre' ? 0 : d.xpPrime[quand]),
    argent: d.argent[quand],
    reputation: d.reputation[quand],
  };
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
      // Le chapitre validé appartient à ce dossier : sa réception livre l'immeuble, et son client écrit aux grands moments.
      const { dossier, rang } = dossierDe(chapitre);
      if (rang + 1 === dossier.livraison) {
        await tx.carriereHistorique.create({ data: { userId, type: 'CHANTIER_LIVRE', details: { campagne: dossier.id, nom: dossier.nom } } });
      }
      const message = dossier.messages[rang + 1];
      if (message) {
        const client = await tx.pnj.findUnique({ where: { slug: dossier.client }, select: { id: true } });
        if (client) await tx.userMessage.create({ data: { userId, pnjId: client.id, contenu: message } });
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
