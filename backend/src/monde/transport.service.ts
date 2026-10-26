import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { facteurPrix, lireTraits } from '../carriere/traits';

// Les courses du quartier : le gbaka au forfait, le taxi compteur au kilomètre (et plus cher sous la pluie, comme à Abidjan).
// Même barème que le téléphone du jeu (frontend/src/lib/transports.ts) : un mètre du jeu vaut 25 m de la vraie ville.

export type ModePaye = 'gbaka' | 'taxi';
export const MODES_PAYES: readonly ModePaye[] = ['gbaka', 'taxi'];
const ECHELLE_DISTANCES = 25;
/** Par les rues, le quartier ne dépasse pas 600 m du jeu : au-delà, la distance déclarée est ramenée à ce plafond. */
export const DISTANCE_MAX = 600;
export const TARIFS = {
  gbaka: { forfait: 200, longTrajetKm: 4, supplement: 100 },
  taxi: { priseEnCharge: 300, parKm: 250, majorationPluie: 1.5 },
} as const;

export function prixTrajet(mode: ModePaye, distance: number, pluie = false) {
  const km = Math.min(DISTANCE_MAX, Math.max(0, distance)) * ECHELLE_DISTANCES / 1000;
  if (mode === 'gbaka') return TARIFS.gbaka.forfait + (km > TARIFS.gbaka.longTrajetKm ? TARIFS.gbaka.supplement : 0);
  return Math.round((TARIFS.taxi.priseEnCharge + km * TARIFS.taxi.parKm) * (pluie ? TARIFS.taxi.majorationPluie : 1) / 50) * 50;
}

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  /** Paie une course : le solde n'est débité que s'il suffit, en une seule écriture (deux courses simultanées ne peuvent
   * pas faire passer le solde sous zéro). */
  async payer(userId: string, mode: ModePaye, distance: number, pluie = false) {
    if (!MODES_PAYES.includes(mode)) throw new BadRequestException('Mode de transport inconnu');
    // L'économe négocie sa course : 10 % de moins, arrondi aux 50 F.
    const traits = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { traits: true } });
    const prix = Math.round(prixTrajet(mode, distance, pluie) * facteurPrix(lireTraits(traits?.traits)) / 50) * 50;
    const debit = await this.prisma.userCarriere.updateMany({ where: { userId, argentVirtuel: { gte: prix } }, data: { argentVirtuel: { decrement: prix } } });
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { argentVirtuel: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    if (!debit.count) throw new BadRequestException(`Pas assez d’argent pour ce trajet : ${prix.toLocaleString('fr-FR')} F.`);
    return { mode, prix, argentVirtuel: carriere.argentVirtuel };
  }
}
