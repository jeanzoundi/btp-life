-- Les offres aux appels d'offres : une offre perdue attribue le marché à un concurrent pendant 24 h (pas de relance en
-- boucle, ni d'XP de consolation répétée).
CREATE TABLE "OffreMarche" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "prixPropose" INTEGER NOT NULL,
    "gagnee" BOOLEAN NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffreMarche_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OffreMarche_userId_chantierId_creeLe_idx" ON "OffreMarche"("userId", "chantierId", "creeLe");
ALTER TABLE "OffreMarche" ADD CONSTRAINT "OffreMarche_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OffreMarche" ADD CONSTRAINT "OffreMarche_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
