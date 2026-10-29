import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { modererMessage, type MotifSignalement } from './moderation';

// Le monde en ligne sur des fonctions serverless, sans connexion permanente : chaque joueur signale sa position toutes
// les quelques secondes et reçoit en retour les voisins vus récemment ; le chat se relit de la même façon.

export const EMOTES = ['salut', 'rire', 'bravo', 'danse', 'pouce', 'reflexion'] as const;
export type Emote = (typeof EMOTES)[number];

export const REGLES_EN_LIGNE = {
  /** Un joueur qui ne s'est pas signalé depuis ce délai a quitté la ville. */
  presenceMs: 45_000,
  /** Une émote reste au-dessus de la tête ce temps-là. */
  emoteMs: 8_000,
  voisinsMax: 20,
  messagesMax: 40,
  longueurMessage: 200,
  /** Délai minimal entre deux messages d'un même joueur, et fenêtre où le même texte est refusé. */
  intervalleMessageMs: 3_000,
  repetitionMs: 30_000,
  /** Signalements de joueurs différents qui retirent un message du chat en attendant la modération. */
  signalementsPourRetirer: 3,
} as const;

/** Bornes de la ville (les mêmes que la position sauvegardée, voir nettoyerEtatMonde). */
const BORNES = { x: [-118, 118], z: [-120, 66] } as const;
const borner = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : 0));

/** Nom montré aux voisins : le nom du personnage ou le pseudo, jamais le nom réel du compte. */
export function nomPublic(user: { pseudo: string | null; avatar: { nomPersonnage: string } | null }) {
  return user.avatar?.nomPersonnage?.trim() || user.pseudo?.trim() || 'Bâtisseur';
}

const LIEN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ci|fr|io|me|ly|gg|xyz)\b)/i;

/** Nettoie un message du chat : caractères de contrôle retirés, espaces resserrés ; refuse le vide, le trop long et les liens. */
export function nettoyerMessage(brut: string): string {
  // eslint-disable-next-line no-control-regex
  const texte = brut.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!texte) throw new BadRequestException('Le message est vide.');
  if (texte.length > REGLES_EN_LIGNE.longueurMessage) throw new BadRequestException(`Pas plus de ${REGLES_EN_LIGNE.longueurMessage} caractères.`);
  if (LIEN.test(texte)) throw new BadRequestException('Les liens ne passent pas dans le chat du quartier.');
  return texte;
}

const AVEC_NOM = { user: { select: { pseudo: true, banni: true, avatar: { select: { nomPersonnage: true, config: true } } } } } as const;

@Injectable()
export class EnLigneService {
  constructor(private readonly prisma: PrismaService) {}

  /** Signale la position du joueur (et une émote) puis renvoie les voisins présents. */
  async signaler(userId: string, position: { x: number; z: number; lieu?: string | null; emote?: string | null }, maintenant = new Date()) {
    const emote = position.emote && (EMOTES as readonly string[]).includes(position.emote) ? position.emote : null;
    const donnees = {
      x: borner(position.x, BORNES.x),
      z: borner(position.z, BORNES.z),
      lieu: position.lieu ? position.lieu.slice(0, 40) : null,
      // Sans nouvelle émote, la précédente reste (elle s'éteint d'elle-même après quelques secondes).
      ...(emote ? { emote, emoteLe: maintenant } : {}),
    };
    await this.prisma.presenceMonde.upsert({ where: { userId }, create: { userId, ...donnees }, update: donnees });
    return this.voisins(userId, maintenant);
  }

  /** Les autres joueurs vus récemment, avec leur personnage et l'émote encore visible. */
  async voisins(userId: string, maintenant = new Date()) {
    const presences = await this.prisma.presenceMonde.findMany({
      where: { userId: { not: userId }, majLe: { gte: new Date(maintenant.getTime() - REGLES_EN_LIGNE.presenceMs) }, user: { banni: false } },
      orderBy: { majLe: 'desc' },
      take: REGLES_EN_LIGNE.voisinsMax,
      select: { userId: true, x: true, z: true, lieu: true, emote: true, emoteLe: true, ...AVEC_NOM },
    });
    return presences.map((p) => ({
      userId: p.userId,
      nom: nomPublic(p.user),
      avatarConfig: p.user.avatar?.config ?? null,
      x: p.x,
      z: p.z,
      lieu: p.lieu,
      emote: p.emote && p.emoteLe && maintenant.getTime() - p.emoteLe.getTime() < REGLES_EN_LIGNE.emoteMs ? p.emote : null,
    }));
  }

  /** Les derniers messages du quartier, du plus ancien au plus récent ; avec `depuis`, seulement les suivants.
   * Les messages retirés et ceux des comptes bannis disparaissent du fil. */
  async messages(depuis?: string) {
    const apres = depuis && Number.isFinite(Date.parse(depuis)) ? new Date(depuis) : null;
    const lignes = await this.prisma.messageQuartier.findMany({
      where: { masque: false, user: { banni: false }, ...(apres ? { createdAt: { gt: apres } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: REGLES_EN_LIGNE.messagesMax,
      select: { id: true, texte: true, createdAt: true, userId: true, ...AVEC_NOM },
    });
    return lignes.reverse().map((m) => ({ id: m.id, userId: m.userId, nom: nomPublic(m.user), texte: m.texte, envoyeLe: m.createdAt.toISOString() }));
  }

  /** Publie un message dans le chat du quartier, grossièretés masquées et numéros de téléphone retirés. */
  async ecrire(userId: string, brut: string, maintenant = new Date()) {
    const { texte, modere } = modererMessage(nettoyerMessage(brut));
    if (modere && !/[\p{L}\p{N}]/u.test(texte.replaceAll('[numéro masqué]', ''))) throw new BadRequestException('Ce message ne passe pas : reste correct avec le quartier.');
    const [user, dernier] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true, banni: true, avatar: { select: { nomPersonnage: true } } } }),
      this.prisma.messageQuartier.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { texte: true, createdAt: true } }),
    ]);
    if (!user || user.banni) throw new ForbiddenException('Ton compte ne peut pas écrire dans le chat.');
    if (dernier) {
      const ecart = maintenant.getTime() - dernier.createdAt.getTime();
      if (ecart < REGLES_EN_LIGNE.intervalleMessageMs) throw new BadRequestException('Doucement : un message toutes les trois secondes.');
      if (ecart < REGLES_EN_LIGNE.repetitionMs && dernier.texte.toLowerCase() === texte.toLowerCase()) throw new BadRequestException('Tu viens d’écrire la même chose.');
    }
    const message = await this.prisma.messageQuartier.create({ data: { userId, texte }, select: { id: true, createdAt: true } });
    return { id: message.id, userId, nom: nomPublic({ pseudo: user.pseudo, avatar: user.avatar ? { nomPersonnage: user.avatar.nomPersonnage } : null }), texte, envoyeLe: message.createdAt.toISOString(), modere };
  }

  /** Signale un message à la modération (une fois par joueur) ; au troisième signalement, il quitte le chat en attendant. */
  async signalerMessage(userId: string, messageId: string, motif: MotifSignalement) {
    const message = await this.prisma.messageQuartier.findUnique({ where: { id: messageId }, select: { userId: true, masque: true } });
    if (!message) throw new NotFoundException('Ce message n’existe plus.');
    if (message.userId === userId) throw new BadRequestException('Tu ne peux pas signaler ton propre message.');
    try {
      await this.prisma.signalementMessage.create({ data: { messageId, signaleurId: userId, motif } });
    } catch (e) {
      // Déjà signalé par ce joueur : rien de plus à faire.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { signale: true, retire: message.masque };
      throw e;
    }
    if (message.masque) return { signale: true, retire: true };
    const enAttente = await this.prisma.signalementMessage.count({ where: { messageId, traiteLe: null } });
    if (enAttente < REGLES_EN_LIGNE.signalementsPourRetirer) return { signale: true, retire: false };
    await this.prisma.messageQuartier.update({ where: { id: messageId }, data: { masque: true } });
    return { signale: true, retire: true };
  }
}
