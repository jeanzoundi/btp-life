-- CreateEnum
CREATE TYPE "RareteItem" AS ENUM ('COMMUN', 'PROFESSIONNEL', 'RARE', 'EXPERT', 'LEGENDAIRE');

-- CreateEnum
CREATE TYPE "SlotAvatar" AS ENUM ('CASQUE', 'TENUE', 'LUNETTES', 'OUTIL', 'ECUSSON', 'CADRE');

-- CreateTable
CREATE TABLE "ItemAvatar" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "categorie" "SlotAvatar" NOT NULL,
    "rarete" "RareteItem" NOT NULL DEFAULT 'COMMUN',
    "metierRequis" TEXT,
    "niveauRequis" INTEGER NOT NULL DEFAULT 1,
    "configPatch" JSONB NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserItemAvatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "obtenuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "equipe" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserItemAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemAvatar_slug_key" ON "ItemAvatar"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserItemAvatar_userId_itemId_key" ON "UserItemAvatar"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "UserItemAvatar" ADD CONSTRAINT "UserItemAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItemAvatar" ADD CONSTRAINT "UserItemAvatar_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemAvatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
