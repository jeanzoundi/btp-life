import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Les erreurs JavaScript vues par les joueurs (écran qui plante, promesse rejetée, boucle 3D…), remontées par leur
// navigateur. Pas de service tiers : elles sont regroupées ici par signature et relues dans l'administration. Rien ne
// relie une erreur à un compte : la page (sans paramètres), le navigateur et la version du jeu suffisent à diagnostiquer.

export const REGLES_ERREURS = {
  longueurMessage: 500,
  longueurPile: 4000,
  longueurChemin: 300,
  longueurNavigateur: 300,
  /** Au-delà, une erreur jamais vue n'est plus enregistrée (les connues continuent d'être comptées). */
  plafondOuvertes: 2000,
} as const;

export interface ErreurRecue { message: string; pile?: string | null; chemin?: string | null; version?: string | null }

/** La première ligne de la pile qui situe l'erreur dans le code (fichier et position). */
function premierAppel(pile: string | null) {
  return pile?.split('\n').map((l) => l.trim()).find((l) => /:\d+:\d+/.test(l)) ?? '';
}

export function signatureErreur(message: string, pile: string | null) {
  return createHash('sha256').update(`${message}\n${premierAppel(pile)}`).digest('hex').slice(0, 32);
}

@Injectable()
export class ErreursClientService {
  constructor(private readonly prisma: PrismaService) {}

  async enregistrer(recue: ErreurRecue, navigateur: string | undefined, maintenant = new Date()) {
    const message = recue.message.trim().slice(0, REGLES_ERREURS.longueurMessage) || 'Erreur inconnue';
    const pile = recue.pile?.slice(0, REGLES_ERREURS.longueurPile) || null;
    const signature = signatureErreur(message, pile);
    // La page sans ses paramètres : un jeton ou une adresse passés dans l'URL ne sont jamais conservés.
    const derniere = {
      chemin: recue.chemin?.split(/[?#]/)[0].slice(0, REGLES_ERREURS.longueurChemin) || null,
      navigateur: navigateur?.slice(0, REGLES_ERREURS.longueurNavigateur) || null,
      version: recue.version?.slice(0, 60) || null,
      derniereLe: maintenant,
    };
    // Une erreur déjà connue est comptée ; si elle avait été marquée résolue, elle revient dans la liste.
    const compter = () => this.prisma.erreurClient.update({ where: { signature }, data: { ...derniere, occurrences: { increment: 1 }, resolueLe: null } });
    if (await this.prisma.erreurClient.findUnique({ where: { signature }, select: { id: true } })) {
      await compter();
      return { enregistree: true };
    }
    if (await this.prisma.erreurClient.count({ where: { resolueLe: null } }) >= REGLES_ERREURS.plafondOuvertes) return { enregistree: false };
    try {
      await this.prisma.erreurClient.create({ data: { signature, message, pile, ...derniere, premiereLe: maintenant } });
    } catch (e) {
      // Deux navigateurs ont remonté la même erreur au même instant : la seconde est comptée.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      await compter();
    }
    return { enregistree: true };
  }
}
