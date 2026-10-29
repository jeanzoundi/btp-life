-- Modération du chat du quartier : un message peut être retiré (au troisième signalement ou par la modération), et
-- chaque joueur peut signaler un message une fois.
ALTER TABLE "MessageQuartier" ADD COLUMN "masque" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "SignalementMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "signaleurId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteLe" TIMESTAMP(3),
    "decision" TEXT,

    CONSTRAINT "SignalementMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SignalementMessage_traiteLe_creeLe_idx" ON "SignalementMessage"("traiteLe", "creeLe");
CREATE UNIQUE INDEX "SignalementMessage_messageId_signaleurId_key" ON "SignalementMessage"("messageId", "signaleurId");
ALTER TABLE "SignalementMessage" ADD CONSTRAINT "SignalementMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MessageQuartier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalementMessage" ADD CONSTRAINT "SignalementMessage_signaleurId_fkey" FOREIGN KEY ("signaleurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
