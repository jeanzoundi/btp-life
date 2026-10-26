-- Le monde en ligne : la présence des joueurs connectés (position et émote) et le chat du quartier.
CREATE TABLE "PresenceMonde" (
    "userId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "lieu" TEXT,
    "emote" TEXT,
    "emoteLe" TIMESTAMP(3),
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresenceMonde_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX "PresenceMonde_majLe_idx" ON "PresenceMonde"("majLe");
ALTER TABLE "PresenceMonde" ADD CONSTRAINT "PresenceMonde_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MessageQuartier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageQuartier_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MessageQuartier_createdAt_idx" ON "MessageQuartier"("createdAt");
ALTER TABLE "MessageQuartier" ADD CONSTRAINT "MessageQuartier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
