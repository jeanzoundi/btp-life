-- Le premier quart d'heure guidé : les étapes déjà faites par le joueur et leur récompense versée une seule fois.
ALTER TABLE "UserCarriere" ADD COLUMN "premiersPas" JSONB;
