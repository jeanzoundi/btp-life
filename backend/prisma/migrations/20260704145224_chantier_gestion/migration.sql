-- AlterTable
ALTER TABLE "ChantierPhase" ADD COLUMN     "besoins" JSONB;

-- AlterTable
ALTER TABLE "OuvrierVirtuel" ADD COLUMN     "salaireJournalier" INTEGER NOT NULL DEFAULT 15000,
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'actif';

-- AlterTable
ALTER TABLE "UserChantier" ADD COLUMN     "avancementPhases" JSONB,
ADD COLUMN     "stock" JSONB;
