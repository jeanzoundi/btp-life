-- Rang d'un cours dans son module. Le seed met désormais les cours à jour sur place au lieu de les recréer (recréer un
-- cours effaçait en cascade les UserCours des joueurs) : l'ordre d'insertion ne suffit plus à garder l'ordre des
-- données. Les cours existants restent à 0 jusqu'au prochain seed ; le catalogue les départage par id, donc par ordre de
-- création, comme avant.
ALTER TABLE "Cours" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;
