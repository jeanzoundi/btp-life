-- CreateEnum
CREATE TYPE "TypeMarche" AS ENUM ('PRIVE', 'PUBLIC');

-- AlterTable
ALTER TABLE "UserCarriere" ADD COLUMN     "nomEntreprise" TEXT;

-- AlterTable
ALTER TABLE "Chantier" ADD COLUMN     "typeMarche" "TypeMarche";
