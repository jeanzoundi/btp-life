-- Le chantier du quartier, où l'on travaille avec Yao sans avoir son propre chantier : avancement de l'ouvrage, journées
-- faites, ouvrages livrés et dernière journée payée (JourneeChantierService).
ALTER TABLE "UserCarriere" ADD COLUMN "chantierQuartier" JSONB;
