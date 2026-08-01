-- Horodatage serveur du démarrage d'une mission : référence anti-triche pour le bonus chrono.
-- Nullable : les missions jouées hors ligne n'ont pas pu appeler /start.
ALTER TABLE "UserMission" ADD COLUMN "demarreeLe" TIMESTAMP(3);
