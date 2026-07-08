import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// La hiérarchie qui accompagne le joueur — synchronisée sur sa position réelle dans sa
// famille de métier (ordre du profil actuel / ordre max de la famille) : un débutant a un
// maître de stage, un profil intermédiaire un superviseur, le sommet de la famille un chef
// d'entreprise. Pas de figure statique : elle change avec la vraie progression du joueur.
type PnjLite = { id: string; slug: string; nom: string; role: string };

@Injectable()
export class PnjService {
  constructor(private readonly prisma: PrismaService) {}

  async pnjHierarchique(userId: string): Promise<PnjLite | null> {
    const carriere = await this.prisma.userCarriere.findUnique({
      where: { userId },
      include: { profilActuel: true },
    });
    if (!carriere?.profilActuel) return this.parSlug('mentor-akissi');

    const profilsFamille = await this.prisma.profil.findMany({
      where: { famille: carriere.profilActuel.famille },
      orderBy: { ordre: 'asc' },
    });
    const ordreMax = profilsFamille.at(-1)?.ordre ?? carriere.profilActuel.ordre;
    const position = ordreMax > 0 ? carriere.profilActuel.ordre / ordreMax : 0;

    const role = position >= 0.75 ? 'CHEF_ENTREPRISE' : position >= 0.4 ? 'SUPERVISEUR' : 'MAITRE_STAGE';
    return (await this.parRole(role)) ?? this.parSlug('mentor-akissi');
  }

  private async parRole(role: string): Promise<PnjLite | null> {
    return this.prisma.pnj.findFirst({ where: { role: role as never } });
  }

  private async parSlug(slug: string): Promise<PnjLite | null> {
    return this.prisma.pnj.findUnique({ where: { slug } });
  }

  private async envoyer(userId: string, pnjId: string | undefined | null, contenu: string) {
    if (!pnjId) return null;
    return this.prisma.userMessage.create({ data: { userId, pnjId, contenu } });
  }

  // ─── Déclencheurs de progression ───

  async surPromotion(userId: string, ancienPoste: string, nouveauPoste: string) {
    const pnj = await this.pnjHierarchique(userId);
    await this.envoyer(
      userId,
      pnj?.id,
      `Félicitations pour ta promotion : ${ancienPoste} → ${nouveauPoste} ! Tu as prouvé que tu avais le niveau, je compte sur toi pour la suite.`,
    );
  }

  async surNiveauSuperieur(userId: string, niveau: number) {
    const pnj = await this.pnjHierarchique(userId);
    await this.envoyer(userId, pnj?.id, `Tu passes niveau ${niveau} ! Ta progression est suivie de près, continue comme ça.`);
  }

  async surMissionReussie(userId: string, missionNom: string) {
    const pnj = await this.pnjHierarchique(userId);
    await this.envoyer(userId, pnj?.id, `Belle réussite sur "${missionNom}" — c'est exactement le sérieux qu'on attend sur le terrain.`);
  }

  async surMissionEchouee(userId: string, missionNom: string) {
    const pnj = await this.pnjHierarchique(userId);
    await this.envoyer(
      userId,
      pnj?.id,
      `J'ai vu que "${missionNom}" ne s'est pas bien passée. Pas de panique : relis la correction et retente, c'est comme ça qu'on apprend sur le terrain.`,
    );
  }

  async surChantierLivre(userId: string, chantierNom: string, note: 'A' | 'B' | 'C' | 'D', clientPnjId?: string | null) {
    const messages: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: `Chantier "${chantierNom}" livré avec une note A — un travail exemplaire, je recommanderai tes services.`,
      B: `Chantier "${chantierNom}" livré, note B. Du bon travail, quelques réglages à affiner pour viser l'excellence.`,
      C: `Chantier "${chantierNom}" livré, note C. C'est fait, mais on peut clairement mieux faire sur le prochain.`,
      D: `Chantier "${chantierNom}" clôturé avec une note D. Ce n'était pas le résultat espéré — reprends le journal de chantier pour comprendre où ça a coincé.`,
    };
    const pnjId = clientPnjId ?? (await this.pnjHierarchique(userId))?.id;
    await this.envoyer(userId, pnjId, messages[note]);
  }
}
