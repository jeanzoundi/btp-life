-- AlterTable
ALTER TABLE "UserCarriere" ALTER COLUMN "reputation" SET DEFAULT 500;

-- Rééquilibrage économique : la réputation passe de l'échelle 0-100 à 0-1000 (plus de
-- granularité sur une progression qui va désormais jusqu'au niveau 100), et l'argent personnel
-- (missions, chantiers, promotions, besoins) est multiplié par 10 pour rester proportionnel aux
-- budgets de chantiers en millions. On rescale les valeurs existantes en même temps que le code
-- applicatif (missions.service.ts, chantiers.service.ts, promotions.service.ts,
-- besoins.service.ts, progression.service.ts) pour ne pas pénaliser les joueurs déjà en cours de
-- partie — sans ça, leur réputation/argent actuels deviendraient une fraction dérisoire des
-- nouveaux seuils du même jour.
UPDATE "UserCarriere" SET "reputation" = LEAST(1000, "reputation" * 10);
UPDATE "UserCarriere" SET "argentVirtuel" = "argentVirtuel" * 10, "epargne" = "epargne" * 10;
