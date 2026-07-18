import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAvatarDto, SetProfilActuelDto, SetMetierCibleDto } from './dto/carriere.dto';
import { BesoinsService } from './besoins.service';
import { EpargneService } from './epargne.service';
import { xpRequisPourNiveau } from './progression.service';
import { AvatarItemsService } from './avatar-items.service';

/** Seuil pour se reconvertir en entrepreneur — voir CarriereService.devenirEntrepreneur. */
export const SEUIL_ENTREPRENEUR = { niveauMin: 30, ordreMin: 3 };

@Injectable()
export class CarriereService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly besoins: BesoinsService,
    private readonly epargne: EpargneService,
    private readonly avatarItems: AvatarItemsService,
  ) {}

  async me(userId: string) {
    // Le déclin des besoins et l'intérêt de l'épargne sont calculés à chaque consultation
    // (approche "paresseuse", sans tâche planifiée).
    const carriere = await this.besoins.actualiser(userId);
    await this.epargne.actualiser(userId);
    const complet = await this.prisma.userCarriere.findUnique({
      where: { userId },
      include: { profilActuel: true, metierCible: true, referentielPays: true },
    });
    if (!complet) throw new NotFoundException('Carrière introuvable');
    const avatar = await this.prisma.avatar.findUnique({ where: { userId } });
    const parcours = await this.prisma.parcours.findFirst({
      where: { userId },
      orderBy: { genereLe: 'desc' },
    });
    return { ...complet, energie: carriere.energie, moral: carriere.moral, faim: carriere.faim, social: carriere.social, avatar, parcours };
  }

  async upsertAvatar(userId: string, dto: UpdateAvatarDto) {
    const { config, ...champs } = dto;
    const data = { ...champs, ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}) };
    return this.prisma.avatar.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async setProfilActuel(userId: string, dto: SetProfilActuelDto) {
    const profil = await this.prisma.profil.findUnique({ where: { id: dto.profilId } });
    if (!profil) throw new NotFoundException('Profil introuvable');
    const carriereActuelle = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { niveau: true, xp: true } });
    // Ne jamais rétrograder : cette route est censée servir à l'onboarding (premier choix de
    // profil), mais si elle est rappelée plus tard (onglet resté ouvert, retour arrière) sur un
    // joueur qui a déjà progressé, niveauDepart du profil ne doit jamais faire reculer son niveau.
    const niveau = Math.max(1, profil.niveauDepart, carriereActuelle?.niveau ?? 1);
    // On fixe aussi l'XP au minimum requis pour ce niveau — sinon le premier gain d'XP (une
    // simple mission) recalcule niveau = xpToNiveau(xp) à partir d'un xp resté proche de 0, et
    // écrase silencieusement le niveau de départ du profil choisi.
    const xpMinimum = xpRequisPourNiveau(niveau);
    const resultat = await this.prisma.userCarriere.update({
      where: { userId },
      data: {
        profilActuelId: profil.id,
        niveau,
        xp: Math.max(carriereActuelle?.xp ?? 0, xpMinimum),
      },
    });
    await this.avatarItems.debloquerItemsEligibles(userId, `metier:${profil.slug}`);
    return resultat;
  }

  async setMetierCible(userId: string, dto: SetMetierCibleDto) {
    const metier = await this.prisma.metierCible.findUnique({ where: { id: dto.metierCibleId } });
    if (!metier) throw new NotFoundException('Métier cible introuvable');
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { metierCibleId: metier.id },
    });
  }

  async genererParcours(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({
      where: { userId },
      include: { profilActuel: true, metierCible: true },
    });
    if (!carriere?.profilActuel || !carriere?.metierCible) {
      throw new BadRequestException("Profil actuel et métier cible requis avant de générer le parcours");
    }

    const profilsFamille = await this.prisma.profil.findMany({
      where: { famille: carriere.metierCible.famille },
      orderBy: { ordre: 'asc' },
    });

    const etapes = profilsFamille
      .filter((p) => p.ordre >= carriere.profilActuel!.ordre)
      .map((p, index) => ({
        profilId: p.id,
        slug: p.slug,
        nom: p.nom,
        ordre: p.ordre,
        complete: index === 0,
      }));

    return this.prisma.parcours.create({
      data: {
        userId,
        etapes,
        etapeCourante: 0,
      },
    });
  }

  /** Évalue les conditions d'une règle de promotion et retourne la liste des conditions non remplies. */
  private async evaluerConditions(
    userId: string,
    carriere: { niveau: number; reputation: number },
    conditions: Record<string, unknown>,
  ): Promise<string[]> {
    const manquants: string[] = [];

    if (typeof conditions.reputationMin === 'number' && carriere.reputation < conditions.reputationMin) {
      manquants.push(`Réputation ${conditions.reputationMin} requise (actuelle : ${carriere.reputation})`);
    }
    if (typeof conditions.niveauMin === 'number' && carriere.niveau < conditions.niveauMin) {
      manquants.push(`Niveau ${conditions.niveauMin} requis (actuel : ${carriere.niveau})`);
    }
    if (Array.isArray(conditions.competences)) {
      const requis = conditions.competences as Array<{ slug: string; niveau: number }>;
      // Deux requêtes groupées (au lieu de 2 par compétence requise) : les compétences par slug, puis
      // les niveaux du joueur pour ces compétences.
      const competences = await this.prisma.competence.findMany({
        where: { slug: { in: requis.map((r) => r.slug) } },
      });
      const parSlug = new Map(competences.map((c) => [c.slug, c]));
      const userCompetences = await this.prisma.userCompetence.findMany({
        where: { userId, competenceId: { in: competences.map((c) => c.id) } },
      });
      const niveauParCompetence = new Map(userCompetences.map((uc) => [uc.competenceId, uc.niveauActuel]));

      for (const req of requis) {
        const competence = parSlug.get(req.slug);
        if (!competence) continue;
        const niveauActuel = niveauParCompetence.get(competence.id) ?? 0;
        if (niveauActuel < req.niveau) {
          manquants.push(`${competence.nom} niveau ${req.niveau} (actuel : ${niveauActuel})`);
        }
      }
    }
    if (typeof conditions.chantiersReussis === 'number') {
      const count = await this.prisma.userChantier.count({
        where: { userId, statut: 'termine', noteFinale: { in: ['A', 'B'] } },
      });
      if (count < conditions.chantiersReussis) {
        manquants.push(`${conditions.chantiersReussis} chantiers réussis requis (actuel : ${count})`);
      }
    }
    return manquants;
  }

  /** Résumé lisible des conditions d'une règle, pour affichage même quand le poste est verrouillé. */
  private resumeConditions(conditions: Record<string, unknown>): string[] {
    const lignes: string[] = [];
    if (typeof conditions.niveauMin === 'number') lignes.push(`Niveau ${conditions.niveauMin}`);
    if (typeof conditions.reputationMin === 'number') lignes.push(`Réputation ${conditions.reputationMin}`);
    if (typeof conditions.chantiersReussis === 'number') lignes.push(`${conditions.chantiersReussis} chantier(s) réussi(s)`);
    if (Array.isArray(conditions.competences)) {
      for (const req of conditions.competences as Array<{ slug: string; niveau: number }>) {
        lignes.push(`${req.slug.replace(/-/g, ' ')} niv. ${req.niveau}`);
      }
    }
    if (conditions.examenMissionId) lignes.push("Examen de passage à réussir");
    return lignes;
  }

  /**
   * Le parcours reste entièrement flexible : à chaque étape, quatre pistes réelles restent
   * ouvertes en parallèle — continuer sa formation, postuler à une offre, se spécialiser
   * (promotion dans la filière actuelle) ou créer son entreprise. Rien n'est figé sur un seul
   * rail : ce carrefour rassemble les quatre pour que le joueur choisisse, plutôt que de ne
   * lui montrer que la prochaine promotion.
   */
  async prochaineEtape(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } });

    // Piste 1 : se spécialiser — la promotion suivante dans la filière actuelle (comportement historique).
    let specialisation: { regle: unknown; manquants: string[]; eligible: boolean } | null = null;
    if (carriere?.profilActuelId) {
      const regle = await this.prisma.reglePromotion.findFirst({
        where: { profilSourceId: carriere.profilActuelId },
        include: { profilCible: true },
      });
      if (regle) {
        const manquants = await this.evaluerConditions(userId, carriere, (regle.conditions as Record<string, unknown>) ?? {});
        specialisation = { regle, manquants, eligible: manquants.length === 0 };
      }
    }
    // Rétro-compatible avec l'ancienne forme de réponse (regle/manquants à la racine),
    // toujours utilisée par le frontend en plus du nouveau bundle ci-dessous.
    const compat = specialisation ?? { regle: null, manquants: [] as string[] };

    // Piste 2 : continuer sa formation — missions accessibles pas encore réussies.
    const missionsDisponibles = carriere
      ? await this.prisma.mission.count({
          where: {
            statut: 'PUBLIE',
            niveauRequis: { lte: carriere.niveau },
            NOT: { userMissions: { some: { userId, statut: 'REUSSIE' } } },
          },
        })
      : 0;

    // Piste 3 : postuler à une offre — celles où le joueur remplit déjà niveau + réputation.
    const offresOuvertes = await this.prisma.offreEmploi.findMany({ where: { statut: 'publiee' } });
    const offresEligibles = carriere
      ? offresOuvertes.filter((o) => o.niveauMin <= carriere.niveau && o.reputationMin <= carriere.reputation).length
      : 0;

    // Piste 4 : créer son entreprise — réservée à ceux qui ont fait leurs preuves (voir
    // SEUIL_ENTREPRENEUR), pas accessible dès le premier jour.
    const entreprise = {
      dejaEntrepreneur: carriere?.profilActuel?.famille === 'ENTREPRENEUR',
      nomEntreprise: carriere?.nomEntreprise ?? null,
      eligible: !!carriere && carriere.niveau >= SEUIL_ENTREPRENEUR.niveauMin && (carriere.profilActuel?.ordre ?? 0) >= SEUIL_ENTREPRENEUR.ordreMin,
      niveauRequis: SEUIL_ENTREPRENEUR.niveauMin,
    };

    return {
      ...compat,
      aUnProfil: !!carriere?.profilActuelId,
      specialisation,
      formation: { missionsDisponibles },
      offres: { eligibles: offresEligibles, total: offresOuvertes.length },
      entreprise,
    };
  }

  /**
   * Reconversion vers l'entrepreneuriat : accessible à tout moment, quelle que soit la filière
   * actuelle — contrairement à `setProfilActuel` (réservé à l'onboarding), niveau/xp/réputation
   * sont préservés, ce n'est pas un reset mais un changement de cap. Le nom d'entreprise est
   * optionnel ici (le joueur peut le choisir tout de suite ou plus tard via renommerEntreprise).
   */
  async devenirEntrepreneur(userId: string, nomEntreprise?: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    if (carriere.profilActuel?.famille === 'ENTREPRENEUR') {
      throw new BadRequestException('Tu es déjà dans la filière entrepreneuriale');
    }
    // Se lancer exige d'avoir fait ses preuves : niveau 30 minimum ET avoir dépassé le tout
    // premier poste de sa filière actuelle (ordre >= 3) — sinon un joueur tout juste sorti de
    // l'onboarding pourrait devenir "chef d'entreprise" en un clic.
    if (carriere.niveau < SEUIL_ENTREPRENEUR.niveauMin || (carriere.profilActuel?.ordre ?? 0) < SEUIL_ENTREPRENEUR.ordreMin) {
      throw new BadRequestException(
        `Il faut au moins le niveau ${SEUIL_ENTREPRENEUR.niveauMin} et avoir progressé dans ta filière actuelle pour te lancer (niveau actuel : ${carriere.niveau})`,
      );
    }
    const profilEntree = await this.prisma.profil.findFirst({ where: { famille: 'ENTREPRENEUR', ordre: 1 } });
    if (!profilEntree) throw new NotFoundException('Filière entrepreneuriale introuvable');

    const nomPropre = nomEntreprise?.trim();
    const maj = await this.prisma.userCarriere.update({
      where: { userId },
      data: { profilActuelId: profilEntree.id, ...(nomPropre ? { nomEntreprise: nomPropre } : {}) },
      include: { profilActuel: true },
    });
    await this.prisma.carriereHistorique.create({
      data: {
        userId,
        type: 'CREATION_ENTREPRISE',
        profilId: profilEntree.id,
        details: { depuis: carriere.profilActuel?.slug ?? null, nomEntreprise: nomPropre ?? null },
      },
    });
    return maj;
  }

  /** Renomme l'entreprise — réservé à la filière ENTREPRENEUR, modifiable à tout moment ensuite. */
  async renommerEntreprise(userId: string, nom: string) {
    const nomPropre = nom.trim();
    if (!nomPropre) throw new BadRequestException('Le nom ne peut pas être vide');
    if (nomPropre.length > 60) throw new BadRequestException('Le nom est trop long (60 caractères max)');

    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } });
    if (carriere?.profilActuel?.famille !== 'ENTREPRENEUR') {
      throw new BadRequestException("Réservé aux entrepreneurs — crée ton entreprise avant de la nommer");
    }
    return this.prisma.userCarriere.update({ where: { userId }, data: { nomEntreprise: nomPropre } });
  }

  /**
   * Arbre de carrière complet de la famille du profil actuel : chaque poste avec son statut
   * (atteint / actuel / prochain / verrouille) et les conditions de la transition qui y mène.
   * Les postes non encore accessibles sont "grisés" côté frontend.
   */
  async arbreCarriere(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({
      where: { userId },
      include: { profilActuel: true },
    });
    if (!carriere?.profilActuel) return { famille: null, postes: [] };

    const famille = carriere.profilActuel.famille;
    const profils = await this.prisma.profil.findMany({ where: { famille }, orderBy: { ordre: 'asc' } });
    const ordreActuel = carriere.profilActuel.ordre;

    // Toutes les règles de la famille, indexées par profil cible.
    const regles = await this.prisma.reglePromotion.findMany({
      where: { profilCibleId: { in: profils.map((p) => p.id) } },
    });
    const regleVersProfil = new Map(regles.map((r) => [r.profilCibleId, r]));

    const postes: Array<{
      profilId: string;
      slug: string;
      nom: string;
      description: string | null;
      ordre: number;
      statut: 'atteint' | 'actuel' | 'prochain' | 'verrouille';
      estSommet: boolean;
      conditions: string[];
      manquants: string[];
      eligible: boolean;
    }> = [];
    for (let i = 0; i < profils.length; i++) {
      const p = profils[i];
      const regle = regleVersProfil.get(p.id);
      const conditions = (regle?.conditions as Record<string, unknown>) ?? {};

      let statut: 'atteint' | 'actuel' | 'prochain' | 'verrouille';
      if (p.ordre < ordreActuel) statut = 'atteint';
      else if (p.ordre === ordreActuel) statut = 'actuel';
      else if (p.ordre === ordreActuel + 1) statut = 'prochain';
      else statut = 'verrouille';

      // Les manquants ne sont calculés que pour la prochaine étape (les suivantes sont encore hors de portée).
      const manquants = statut === 'prochain' && regle ? await this.evaluerConditions(userId, carriere, conditions) : [];

      postes.push({
        profilId: p.id,
        slug: p.slug,
        nom: p.nom,
        description: p.description,
        ordre: p.ordre,
        statut,
        estSommet: i === profils.length - 1,
        conditions: regle ? this.resumeConditions(conditions) : [],
        manquants,
        eligible: statut === 'prochain' ? manquants.length === 0 : false,
      });
    }

    return {
      famille,
      profilActuel: carriere.profilActuel.nom,
      postes,
    };
  }

  /** Série de jours consécutifs avec au moins une mission terminée. */
  async streak(userId: string) {
    const missions = await this.prisma.userMission.findMany({
      where: { userId, termineeLe: { not: null } },
      select: { termineeLe: true },
    });
    const jours = new Set(missions.map((m) => m.termineeLe!.toISOString().slice(0, 10)));
    const unJour = 24 * 60 * 60 * 1000;
    const cle = (d: Date) => d.toISOString().slice(0, 10);

    const aujourdhui = new Date();
    const aJoueAujourdhui = jours.has(cle(aujourdhui));
    // La série court jusqu'à aujourd'hui, ou jusqu'à hier si on n'a pas encore joué aujourd'hui.
    let curseur = aJoueAujourdhui ? aujourdhui : new Date(aujourdhui.getTime() - unJour);
    let serie = 0;
    while (jours.has(cle(curseur))) {
      serie += 1;
      curseur = new Date(curseur.getTime() - unJour);
    }
    return { jours: serie, aJoueAujourdhui };
  }

  /** Top 20 par XP + rang du joueur courant. */
  async classement(userId: string) {
    const top = await this.prisma.userCarriere.findMany({
      where: { user: { role: 'USER', banni: false } },
      orderBy: [{ xp: 'desc' }, { updatedAt: 'asc' }],
      take: 20,
      select: {
        userId: true,
        niveau: true,
        xp: true,
        reputation: true,
        profilActuel: { select: { nom: true } },
        user: { select: { pseudo: true, nom: true, avatar: { select: { nomPersonnage: true, config: true } } } },
      },
    });
    const mienne = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { xp: true } });
    const devant = await this.prisma.userCarriere.count({
      where: { user: { role: 'USER', banni: false }, xp: { gt: mienne?.xp ?? 0 } },
    });
    return {
      top: top.map((c, i) => ({
        rang: i + 1,
        estMoi: c.userId === userId,
        nom: c.user.avatar?.nomPersonnage ?? c.user.pseudo ?? c.user.nom,
        avatarConfig: c.user.avatar?.config ?? null,
        profil: c.profilActuel?.nom ?? null,
        niveau: c.niveau,
        xp: c.xp,
        reputation: c.reputation,
      })),
      monRang: devant + 1,
    };
  }

  /**
   * Les autres joueurs réellement actifs récemment — pour peupler le monde virtuel
   * de vraies personnes plutôt que de PNJ scriptés (jeu interconnecté).
   *
   * Pensé pour tenir avec plusieurs milliers de comptes : on ne trie/limite jamais sur toute
   * la table. On prend d'abord un bassin borné (200) des plus récemment actifs — requête bon
   * marché quelle que soit la taille totale de la base — puis on tire un échantillon aléatoire
   * dedans, pour que ce ne soit pas toujours les 6 mêmes power users qui monopolisent le monde.
   */
  async joueursActifs(userId: string, limite = 24) {
    const depuis = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // actifs dans les 30 derniers jours
    const bassin = await this.prisma.userCarriere.findMany({
      where: {
        userId: { not: userId },
        updatedAt: { gte: depuis },
        user: { role: 'USER', banni: false },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        userId: true,
        niveau: true,
        reputation: true,
        profilActuel: { select: { nom: true } },
        user: { select: { pseudo: true, nom: true, avatar: { select: { nomPersonnage: true, config: true } } } },
      },
    });

    // Échantillon aléatoire (Fisher-Yates partiel) dans le bassin — rotation équitable.
    const echantillon = [...bassin];
    for (let i = echantillon.length - 1; i > 0 && i >= echantillon.length - limite; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [echantillon[i], echantillon[j]] = [echantillon[j], echantillon[i]];
    }
    const joueurs = echantillon.slice(-limite);

    return joueurs.map((j) => ({
      userId: j.userId,
      nom: j.user.avatar?.nomPersonnage ?? j.user.pseudo ?? j.user.nom,
      avatarConfig: j.user.avatar?.config ?? null,
      profil: j.profilActuel?.nom ?? null,
      niveau: j.niveau,
      reputation: j.reputation,
    }));
  }

  /** Fiche publique d'un joueur (données non sensibles uniquement) — consultable en cliquant sur lui dans le monde. */
  async profilPublic(userId: string, cibleId: string) {
    if (userId === cibleId) throw new BadRequestException("C'est toi !");
    const carriere = await this.prisma.userCarriere.findUnique({
      where: { userId: cibleId },
      select: {
        niveau: true,
        xp: true,
        reputation: true,
        profilActuel: { select: { nom: true } },
        metierCible: { select: { nom: true } },
        traits: true,
        user: {
          select: {
            pseudo: true,
            nom: true,
            role: true,
            banni: true,
            avatar: { select: { nomPersonnage: true, config: true } },
            _count: { select: { userBadges: true, userCertificats: true } },
          },
        },
      },
    });
    if (!carriere || carriere.user.role !== 'USER' || carriere.user.banni) {
      throw new NotFoundException('Joueur introuvable');
    }
    return {
      nom: carriere.user.avatar?.nomPersonnage ?? carriere.user.pseudo ?? carriere.user.nom,
      avatarConfig: carriere.user.avatar?.config ?? null,
      niveau: carriere.niveau,
      xp: carriere.xp,
      reputation: carriere.reputation,
      profil: carriere.profilActuel?.nom ?? null,
      metierCible: carriere.metierCible?.nom ?? null,
      traits: (carriere.traits as string[] | null) ?? [],
      nbBadges: carriere.user._count.userBadges,
      nbCertificats: carriere.user._count.userCertificats,
    };
  }

  /** Choix des traits de personnalité (2 à 3), fait une seule fois à l'onboarding — modifiable ensuite depuis le profil. */
  async setTraits(userId: string, traits: string[]) {
    if (!Array.isArray(traits) || traits.length < 1 || traits.length > 3) {
      throw new BadRequestException('Choisis entre 1 et 3 traits');
    }
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { traits: traits as unknown as Prisma.InputJsonValue },
    });
  }
}
