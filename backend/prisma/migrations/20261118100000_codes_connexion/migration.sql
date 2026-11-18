-- Entrer avec un code reçu par mail, sans mot de passe : un code à 6 chiffres par demande, gardé sous forme d'empreinte,
-- valable 10 minutes et 5 essais (AuthService.demanderCode / verifierCode).
CREATE TABLE "CodeConnexion" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "essais" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeConnexion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CodeConnexion_email_creeLe_idx" ON "CodeConnexion"("email", "creeLe");
