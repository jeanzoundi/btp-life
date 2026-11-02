import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CertificatsService } from '../certificats/certificats.service';
import { avancementCursus, chargerEtatCursus, CURSUS } from './cursus';

@Injectable()
export class CursusService {
  private readonly logger = new Logger(CursusService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificats: CertificatsService,
  ) {}

  /** Où en est le cursus de l'étudiant (rien sans formation choisie) ; un diplôme mérité est délivré au passage. */
  async etat(userId: string) {
    const { formation, etat } = await chargerEtatCursus(this.prisma, userId);
    if (!formation) return { formation: null, cursus: null };
    const avancement = avancementCursus(formation, etat);
    let diplome = avancement.diplomeMerite;
    if (diplome) {
      try { await this.certificats.delivrer(userId); }
      catch { this.logger.warn('Diplôme mérité, délivrance reportée'); diplome = false; }
    }
    return { formation, cursus: { titre: CURSUS[formation].titre, diplome: { ...CURSUS[formation].diplome, obtenu: diplome }, etapes: avancement.etapes } };
  }
}
