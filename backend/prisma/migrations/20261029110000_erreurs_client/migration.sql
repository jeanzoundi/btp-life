-- Les erreurs JavaScript remontées par le navigateur des joueurs, regroupées par signature (sans lien avec un compte).
CREATE TABLE "ErreurClient" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "pile" TEXT,
    "chemin" TEXT,
    "navigateur" TEXT,
    "version" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "premiereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolueLe" TIMESTAMP(3),

    CONSTRAINT "ErreurClient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ErreurClient_signature_key" ON "ErreurClient"("signature");
CREATE INDEX "ErreurClient_resolueLe_derniereLe_idx" ON "ErreurClient"("resolueLe", "derniereLe");
