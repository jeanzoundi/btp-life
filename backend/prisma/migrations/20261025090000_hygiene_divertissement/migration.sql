-- Deux nouveaux besoins : l'hygiène (douche, sport) et le divertissement (télé, loisirs).
ALTER TABLE "UserCarriere" ADD COLUMN "hygiene" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "divertissement" INTEGER NOT NULL DEFAULT 80;
