-- Un certificat ne se délivre qu'une fois par joueur : la délivrance automatique (src/certificats) s'appuie sur cet
-- index pour ne jamais en créer deux, même quand deux requêtes arrivent en même temps. Aucun certificat n'a encore été
-- délivré ; si des doublons existaient, seul le premier est gardé.
DELETE FROM "UserCertificat" a
  USING "UserCertificat" b
  WHERE a."userId" = b."userId" AND a."certificatId" = b."certificatId" AND a."id" > b."id";

CREATE UNIQUE INDEX "UserCertificat_userId_certificatId_key" ON "UserCertificat"("userId", "certificatId");
