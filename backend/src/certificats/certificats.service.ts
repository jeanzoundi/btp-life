import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

/** Condition d'obtention d'un certificat, telle que le seed l'écrit (prisma/seed-data/carriere-data.ts). */
export type ConditionCertificat = { type: 'module'; module: string } | { type: 'metier'; profil: string };

/** Lit la condition stockée en JSON ; une condition inconnue (certificat créé à la main dans l'admin) n'est jamais délivrée automatiquement. */
export function lireCondition(brut: unknown): ConditionCertificat | null {
  const c = brut && typeof brut === 'object' ? (brut as Record<string, unknown>) : null;
  if (c?.type === 'module' && typeof c.module === 'string') return { type: 'module', module: c.module };
  if (c?.type === 'metier' && typeof c.profil === 'string') return { type: 'metier', profil: c.profil };
  return null;
}

/** Numéro imprimé sur le certificat : BTPL, l'année, puis huit caractères hexadécimaux. */
export function numeroCertificat(maintenant = new Date(), octets: Buffer = randomBytes(4)) {
  return `BTPL-${maintenant.getUTCFullYear()}-${octets.toString('hex').toUpperCase()}`;
}

type ProfilRang = { id: string; famille: string; ordre: number };
export interface EtatJoueur {
  coursLus: ReadonlySet<string>;
  /** Ids des cours de chaque module, par slug de module. */
  coursParModule: ReadonlyMap<string, readonly string[]>;
  profilActuel: ProfilRang | null;
  /** Ids des postes que le joueur a occupés (promotions, embauches) ou occupe. */
  profilsOccupes: ReadonlySet<string>;
  /** Les postes visés par les certificats, par slug. */
  profils: ReadonlyMap<string, ProfilRang>;
}

/**
 * Le certificat est-il mérité ? Module : tous ses cours lus (un module sans cours ne donne rien). Métier : le poste a été
 * occupé, ou le joueur l'a dépassé dans la même filière (une embauche directe plus haut termine aussi le parcours).
 */
export function estMerite(condition: ConditionCertificat, etat: EtatJoueur): boolean {
  if (condition.type === 'module') {
    const cours = etat.coursParModule.get(condition.module) ?? [];
    return cours.length > 0 && cours.every((id) => etat.coursLus.has(id));
  }
  const profil = etat.profils.get(condition.profil);
  if (!profil) return false;
  if (etat.profilsOccupes.has(profil.id)) return true;
  return !!etat.profilActuel && etat.profilActuel.famille === profil.famille && etat.profilActuel.ordre >= profil.ordre;
}

export interface CertificatDelivre { slug: string; nom: string; numeroUnique: string }

@Injectable()
export class CertificatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Délivre au joueur les certificats mérités qu'il n'a pas encore : appelé à la fin d'un cours, après une promotion ou
   * une embauche, et à la lecture de ses certificats (ce qui rattrape ceux mérités avant leur mise en place).
   */
  async delivrer(userId: string): Promise<CertificatDelivre[]> {
    const [certificats, recus] = await Promise.all([
      this.prisma.certificat.findMany({ select: { id: true, slug: true, nom: true, conditions: true } }),
      this.prisma.userCertificat.findMany({ where: { userId }, select: { certificatId: true } }),
    ]);
    const dejaRecus = new Set(recus.map((r) => r.certificatId));
    const candidats = certificats.flatMap((c) => {
      const condition = lireCondition(c.conditions);
      return condition && !dejaRecus.has(c.id) ? [{ ...c, condition }] : [];
    });
    if (!candidats.length) return [];

    const modules = [...new Set(candidats.flatMap((c) => (c.condition.type === 'module' ? [c.condition.module] : [])))];
    const metiers = [...new Set(candidats.flatMap((c) => (c.condition.type === 'metier' ? [c.condition.profil] : [])))];
    const [lus, coursDesModules, carriere, historique, profils] = await Promise.all([
      this.prisma.userCours.findMany({ where: { userId }, select: { coursId: true } }),
      this.prisma.moduleAcademie.findMany({ where: { slug: { in: modules } }, select: { slug: true, cours: { select: { id: true } } } }),
      this.prisma.userCarriere.findUnique({ where: { userId }, select: { profilActuel: { select: { id: true, famille: true, ordre: true } } } }),
      this.prisma.carriereHistorique.findMany({ where: { userId, profilId: { not: null } }, select: { profilId: true } }),
      this.prisma.profil.findMany({ where: { slug: { in: metiers } }, select: { id: true, slug: true, famille: true, ordre: true } }),
    ]);
    const profilActuel = carriere?.profilActuel ?? null;
    const etat: EtatJoueur = {
      coursLus: new Set(lus.map((l) => l.coursId)),
      coursParModule: new Map(coursDesModules.map((m) => [m.slug, m.cours.map((c) => c.id)])),
      profilActuel,
      profilsOccupes: new Set([...historique.flatMap((h) => (h.profilId ? [h.profilId] : [])), ...(profilActuel ? [profilActuel.id] : [])]),
      profils: new Map(profils.map((p) => [p.slug, p])),
    };

    const delivres: CertificatDelivre[] = [];
    for (const c of candidats) {
      if (!estMerite(c.condition, etat)) continue;
      const numeroUnique = await this.creer(userId, c.id);
      if (numeroUnique) delivres.push({ slug: c.slug, nom: c.nom, numeroUnique });
    }
    if (delivres.length) {
      // Un seul message, même quand le rattrapage en délivre plusieurs d'un coup.
      const [premier] = delivres;
      await this.notifications.envoyerNotification(userId, {
        type: NotificationType.BADGE,
        titre: delivres.length === 1 ? `Certificat délivré : ${premier.nom}` : `${delivres.length} certificats délivrés`,
        contenu: delivres.length === 1
          ? `N° ${premier.numeroUnique}. Il figure désormais dans tes récompenses et sur ton CV.`
          : `${delivres.map((d) => d.nom).join(' · ')}. Ils figurent désormais dans tes récompenses et sur ton CV.`,
        lien: '/app/recompenses',
      });
    }
    return delivres;
  }

  /** Crée le certificat du joueur et renvoie son numéro ; null s'il a été délivré entre-temps par une autre requête. */
  private async creer(userId: string, certificatId: string): Promise<string | null> {
    for (let essai = 0; essai < 3; essai++) {
      const numeroUnique = numeroCertificat();
      try {
        await this.prisma.userCertificat.create({ data: { userId, certificatId, numeroUnique } });
        return numeroUnique;
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') throw e;
        // Doublon : soit le certificat vient d'être délivré (index userId + certificatId), soit le numéro existe déjà et
        // on en tire un autre.
        if (await this.prisma.userCertificat.findFirst({ where: { userId, certificatId }, select: { id: true } })) return null;
      }
    }
    return null;
  }
}
