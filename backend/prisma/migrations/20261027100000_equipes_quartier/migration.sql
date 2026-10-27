-- Les équipes de quartier : un chef, des membres (un joueur n'est que dans une équipe à la fois) et les invitations.
CREATE TABLE "EquipeQuartier" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipeQuartier_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EquipeQuartier_chefId_idx" ON "EquipeQuartier"("chefId");
ALTER TABLE "EquipeQuartier" ADD CONSTRAINT "EquipeQuartier_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MembreEquipe" (
    "userId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "rejointLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembreEquipe_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX "MembreEquipe_equipeId_idx" ON "MembreEquipe"("equipeId");
ALTER TABLE "MembreEquipe" ADD CONSTRAINT "MembreEquipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembreEquipe" ADD CONSTRAINT "MembreEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "EquipeQuartier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InvitationEquipe" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "deId" TEXT NOT NULL,
    "versId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationEquipe_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InvitationEquipe_equipeId_versId_key" ON "InvitationEquipe"("equipeId", "versId");
CREATE INDEX "InvitationEquipe_versId_idx" ON "InvitationEquipe"("versId");
ALTER TABLE "InvitationEquipe" ADD CONSTRAINT "InvitationEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "EquipeQuartier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationEquipe" ADD CONSTRAINT "InvitationEquipe_deId_fkey" FOREIGN KEY ("deId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationEquipe" ADD CONSTRAINT "InvitationEquipe_versId_fkey" FOREIGN KEY ("versId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
