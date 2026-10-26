import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { CAMPAGNE, lireCampagne } from '../carriere/campagne.service';
import { lireProgresLieux } from '../carriere/lieux.service';

// Défis du jour et de la semaine, imprévu du jour au Grand chantier. Le contenu vit en base (Evenement, Imprevu) et se
// modifie depuis l'administration. La progression se mesure sans toucher aux autres services : missions et cours par leur
// date de fin ; séances de lieu et chapitres du fil rouge par un instantané pris au début de la période ; trajets par un
// compteur. Les jours et les semaines sont ceux du calendrier réel (UTC, l'heure d'Abidjan) : une raison de revenir.

export type TypeObjectifDefi = 'seances_lieu' | 'chapitres' | 'missions' | 'cours' | 'trajets';
export const TYPES_OBJECTIFS: readonly TypeObjectifDefi[] = ['seances_lieu', 'chapitres', 'missions', 'cours', 'trajets'];
export interface DefiConfig { slug: string; titre: string; description: string; objectif: { type: TypeObjectifDefi; cible: number }; recompense: { xp: number; argent: number; reputation?: number } }
interface OptionImprevu { texte: string; retour: string; effets: { xp: number; argent: number; reputation: number } }
type Periode = 'jour' | 'semaine';
interface Totaux { seances: number; chapitres: number }
export interface EtatDefis {
  jour: string; semaine: string; baseJour: Totaux; baseSemaine: Totaux;
  trajets: { jour: number; semaine: number };
  /** Défis réclamés : slug → clé de la période (jour ou semaine) où ils l'ont été. */
  reclames: Record<string, string>;
  imprevu: { jour: string; slug: string; option: number } | null;
}

export const DEFIS_PAR_JOUR = 3;
export const DEFIS_PAR_SEMAINE = 1;
const borne = (v: unknown, min: number, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0; };

export const cleJour = (d: Date) => d.toISOString().slice(0, 10);
/** Semaine ISO 8601 (celle qui contient le jeudi), « 2026-S43 ». */
export function cleSemaine(d: Date) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const numero = Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(numero).padStart(2, '0')}`;
}
export const debutJour = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
export const debutSemaine = (d: Date) => { const j = debutJour(d); j.setUTCDate(j.getUTCDate() - ((j.getUTCDay() + 6) % 7)); return j; };

/** Tirage reproductible : le même joueur voit les mêmes défis toute la journée, d'autres demain. */
const graine = (texte: string) => { let h = 2166136261; for (let i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export function tirer<T extends { slug: string }>(pool: readonly T[], n: number, cle: string): T[] {
  return [...pool].sort((a, b) => graine(`${cle}:${a.slug}`) - graine(`${cle}:${b.slug}`) || a.slug.localeCompare(b.slug)).slice(0, n);
}

/** Un défi saisi dans l'administration n'est retenu que s'il est complet et raisonnable. */
export function lireDefi(config: unknown): DefiConfig | null {
  const c = (config && typeof config === 'object' ? config : {}) as Record<string, unknown>;
  const o = (c.objectif ?? {}) as Record<string, unknown>, r = (c.recompense ?? {}) as Record<string, unknown>;
  if (typeof c.slug !== 'string' || !c.slug || typeof c.titre !== 'string' || !TYPES_OBJECTIFS.includes(o.type as TypeObjectifDefi)) return null;
  return {
    slug: c.slug, titre: c.titre, description: typeof c.description === 'string' ? c.description : '',
    objectif: { type: o.type as TypeObjectifDefi, cible: borne(o.cible, 1, 50) || 1 },
    recompense: { xp: borne(r.xp, 0, 500), argent: borne(r.argent, 0, 20_000), reputation: borne(r.reputation, 0, 10) },
  };
}

function lireOptions(brut: unknown): OptionImprevu[] {
  if (!Array.isArray(brut)) return [];
  return brut.flatMap((o): OptionImprevu[] => {
    const x = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>, e = (x.effets ?? {}) as Record<string, unknown>;
    if (typeof x.texte !== 'string' || !x.texte) return [];
    return [{ texte: x.texte, retour: typeof x.retour === 'string' ? x.retour : '', effets: { xp: borne(e.xp, 0, 50), argent: borne(e.argent, -5000, 5000), reputation: borne(e.reputation, -5, 5) } }];
  });
}

/** L'état des défis, remis à zéro (nouvel instantané, compteurs à zéro) quand le jour ou la semaine a changé. */
export function lireEtatDefis(brut: unknown, maintenant: Date, totaux: Totaux): { etat: EtatDefis; change: boolean } {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const jour = cleJour(maintenant), semaine = cleSemaine(maintenant);
  const base = (v: unknown): Totaux => { const b = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>; return { seances: borne(b.seances, 0, 1e6), chapitres: borne(b.chapitres, 0, 1e3) }; };
  const t = (c.trajets ?? {}) as Record<string, unknown>;
  const memeJour = c.jour === jour, memeSemaine = c.semaine === semaine;
  const reclames = Object.fromEntries(Object.entries((c.reclames && typeof c.reclames === 'object' ? c.reclames : {}) as Record<string, unknown>)
    .filter(([, v]) => v === jour || v === semaine)) as Record<string, string>;
  const i = (c.imprevu ?? null) as Record<string, unknown> | null;
  const etat: EtatDefis = {
    jour, semaine,
    baseJour: memeJour ? base(c.baseJour) : { ...totaux },
    baseSemaine: memeSemaine ? base(c.baseSemaine) : { ...totaux },
    trajets: { jour: memeJour ? borne(t.jour, 0, 1e4) : 0, semaine: memeSemaine ? borne(t.semaine, 0, 1e5) : 0 },
    reclames,
    imprevu: i && i.jour === jour && typeof i.slug === 'string' ? { jour, slug: i.slug, option: borne(i.option, 0, 9) } : null,
  };
  return { etat, change: !memeJour || !memeSemaine };
}

const totauxDe = (carriere: { progresLieux: unknown; campagne: unknown }): Totaux => ({
  seances: Object.values(lireProgresLieux(carriere.progresLieux)).reduce((s, p) => s + p.seances, 0),
  chapitres: lireCampagne(carriere.campagne).chapitres,
});

type Client = PrismaService | Prisma.TransactionClient;

@Injectable()
export class DefisService {
  private readonly logger = new Logger(DefisService.name);
  constructor(private readonly prisma: PrismaService, private readonly progression: ProgressionService) {}

  /** Les défis tirés pour ce joueur aujourd'hui et cette semaine (un défi du fil rouge n'est proposé que s'il reste des chapitres). */
  private async programme(db: Client, userId: string, etat: EtatDefis, maintenant: Date) {
    const actifs = await db.evenement.findMany({ where: {
      type: { in: ['DEFI_JOUR', 'DEFI_SEMAINE'] },
      AND: [{ OR: [{ actifDu: null }, { actifDu: { lte: maintenant } }] }, { OR: [{ actifAu: null }, { actifAu: { gte: maintenant } }] }],
    } });
    // Le tirage reste stable après la réussite, y compris au dernier chapitre.
    const pool = (type: 'DEFI_JOUR' | 'DEFI_SEMAINE', base: Totaux) => actifs.filter(e => e.type === type).map(e => lireDefi(e.config)).filter((d): d is DefiConfig => d !== null && (d.objectif.type !== 'chapitres' || base.chapitres + d.objectif.cible <= CAMPAGNE.chapitres));
    return { jour: tirer(pool('DEFI_JOUR', etat.baseJour), DEFIS_PAR_JOUR, `${userId}:${etat.jour}`), semaine: tirer(pool('DEFI_SEMAINE', etat.baseSemaine), DEFIS_PAR_SEMAINE, `${userId}:${etat.semaine}`) };
  }

  private async progres(db: Client, userId: string, d: DefiConfig, periode: Periode, etat: EtatDefis, totaux: Totaux, maintenant: Date) {
    const base = periode === 'jour' ? etat.baseJour : etat.baseSemaine, debut = periode === 'jour' ? debutJour(maintenant) : debutSemaine(maintenant);
    switch (d.objectif.type) {
      case 'seances_lieu': return Math.max(0, totaux.seances - base.seances);
      case 'chapitres': return Math.max(0, totaux.chapitres - base.chapitres);
      case 'trajets': return etat.trajets[periode];
      case 'missions': return db.userMission.count({ where: { userId, statut: 'REUSSIE', termineeLe: { gte: debut } } });
      case 'cours': return db.userCours.count({ where: { userId, termineLe: { gte: debut } } });
    }
  }

  private async lire(db: Client, userId: string, maintenant: Date) {
    const carriere = await db.userCarriere.findUnique({ where: { userId }, select: { defis: true, progresLieux: true, campagne: true, niveau: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    const totaux = totauxDe(carriere);
    return { carriere, totaux, ...lireEtatDefis(carriere.defis, maintenant, totaux) };
  }

  async etat(userId: string) {
    const maintenant = new Date();
    return this.serializable(async tx => {
      const { etat, change, totaux } = await this.lire(tx, userId, maintenant);
      if (change) await tx.userCarriere.update({ where: { userId }, data: { defis: etat as unknown as Prisma.InputJsonValue } });
      const { jour, semaine } = await this.programme(tx, userId, etat, maintenant);
      const avecProgres = async (d: DefiConfig, periode: Periode) => ({
        ...d, periode, progres: Math.min(d.objectif.cible, await this.progres(tx, userId, d, periode, etat, totaux, maintenant)),
        reclame: etat.reclames[d.slug] === (periode === 'jour' ? etat.jour : etat.semaine),
      });
      return {
        jour: await Promise.all(jour.map(d => avecProgres(d, 'jour'))),
        semaine: await Promise.all(semaine.map(d => avecProgres(d, 'semaine'))),
        cleJour: etat.jour, cleSemaine: etat.semaine,
      };
    });
  }

  /** Verse la récompense d'un défi réussi, une seule fois par période. */
  async reclamer(userId: string, slug: string) {
    const maintenant = new Date();
    const r = await this.transaction(userId, async (tx) => {
      const { etat, totaux, carriere } = await this.lire(tx, userId, maintenant);
      const { jour, semaine } = await this.programme(tx, userId, etat, maintenant);
      const trouve = [...jour.map(d => ({ d, periode: 'jour' as const })), ...semaine.map(d => ({ d, periode: 'semaine' as const }))].find(x => x.d.slug === slug);
      if (!trouve) throw new NotFoundException('Ce défi n’est pas au programme du moment');
      const cle = trouve.periode === 'jour' ? etat.jour : etat.semaine;
      if (etat.reclames[slug] === cle) throw new ConflictException('Récompense déjà versée pour ce défi');
      if (await this.progres(tx, userId, trouve.d, trouve.periode, etat, totaux, maintenant) < trouve.d.objectif.cible) throw new BadRequestException('Défi pas encore réussi');
      const suivant: EtatDefis = { ...etat, reclames: { ...etat.reclames, [slug]: cle } };
      await tx.userCarriere.update({ where: { userId }, data: { defis: suivant as unknown as Prisma.InputJsonValue } });
      const { xp, argent, reputation = 0 } = trouve.d.recompense;
      const payee = await this.progression.appliquerDelta(userId, { xp, argentVirtuel: argent, reputation }, tx);
      if (!payee) throw new NotFoundException('Carrière introuvable');
      return { slug, recompense: trouve.d.recompense, ancienNiveau: carriere.niveau, nouveauNiveau: payee.niveau };
    });
    return { slug: r.slug, recompense: r.recompense };
  }

  /** Un trajet payé compte pour les défis de transport. */
  async compterTrajet(userId: string, transaction?: Prisma.TransactionClient) {
    const compter = async (tx: Prisma.TransactionClient) => {
      const { etat } = await this.lire(tx, userId, new Date());
      const suivant: EtatDefis = { ...etat, trajets: { jour: etat.trajets.jour + 1, semaine: etat.trajets.semaine + 1 } };
      await tx.userCarriere.update({ where: { userId }, data: { defis: suivant as unknown as Prisma.InputJsonValue } });
    };
    return transaction ? compter(transaction) : this.serializable(compter);
  }

  private async imprevuDuJour(db: Client, userId: string, jour: string) {
    const lignes = await db.imprevu.findMany();
    const valides = lignes.flatMap(l => {
      const d = (l.declencheur && typeof l.declencheur === 'object' ? l.declencheur : {}) as Record<string, unknown>;
      const options = lireOptions(l.options);
      return options.length >= 2 ? [{ slug: typeof d.slug === 'string' && d.slug ? d.slug : l.id, titre: l.titre, description: l.description ?? '', options }] : [];
    });
    return tirer(valides, 1, `${userId}:${jour}:imprevu`)[0] ?? null;
  }

  /** L'imprévu du jour au Grand chantier : sa situation, ses options, et la décision déjà prise s'il y en a une. */
  async imprevu(userId: string) {
    const { etat } = await this.lire(this.prisma, userId, new Date());
    const i = await this.imprevuDuJour(this.prisma, userId, etat.jour);
    if (!i) return { imprevu: null, decision: null };
    const prise = etat.imprevu?.slug === i.slug ? i.options[etat.imprevu.option] ?? null : null;
    return {
      imprevu: { slug: i.slug, titre: i.titre, description: i.description, options: i.options.map(o => o.texte) },
      decision: prise && etat.imprevu ? { option: etat.imprevu.option, retour: prise.retour, effets: prise.effets } : null,
    };
  }

  /** Une décision par jour : ses conséquences sont appliquées tout de suite (gains, perte d'argent, réputation). */
  async deciderImprevu(userId: string, option: number) {
    const maintenant = new Date();
    const r = await this.transaction(userId, async (tx) => {
      const { etat, carriere } = await this.lire(tx, userId, maintenant);
      if (etat.imprevu) throw new ConflictException('L’imprévu du jour est déjà réglé');
      const i = await this.imprevuDuJour(tx, userId, etat.jour);
      if (!i) throw new NotFoundException('Pas d’imprévu aujourd’hui');
      const choisi = i.options[option];
      if (!Number.isInteger(option) || !choisi) throw new BadRequestException('Option inconnue');
      const suivant: EtatDefis = { ...etat, imprevu: { jour: etat.jour, slug: i.slug, option } };
      await tx.userCarriere.update({ where: { userId }, data: { defis: suivant as unknown as Prisma.InputJsonValue } });
      const payee = await this.progression.appliquerDelta(userId, { xp: choisi.effets.xp, argentVirtuel: choisi.effets.argent, reputation: choisi.effets.reputation }, tx);
      if (!payee) throw new NotFoundException('Carrière introuvable');
      return { option, retour: choisi.retour, effets: choisi.effets, ancienNiveau: carriere.niveau, nouveauNiveau: payee.niveau };
    });
    return { option: r.option, retour: r.retour, effets: r.effets };
  }

  private async serializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let tentative = 0; ; tentative++) {
      try {
        return await this.prisma.$transaction(operation, { isolationLevel: 'Serializable', timeout: 10_000 });
      } catch (erreur) {
        if ((erreur as { code?: string }).code !== 'P2034' || tentative >= 2) throw erreur;
      }
    }
  }

  private async transaction<T extends { ancienNiveau: number; nouveauNiveau: number }>(userId: string, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    const resultat = await this.serializable(operation);
    // Les notifications ne doivent pas transformer un paiement validé en erreur HTTP.
    try { await this.progression.notifierNiveau(userId, resultat.ancienNiveau, resultat.nouveauNiveau); }
    catch { this.logger.warn('Notification de niveau indisponible après un défi ou un imprévu'); }
    return resultat;
  }
}
