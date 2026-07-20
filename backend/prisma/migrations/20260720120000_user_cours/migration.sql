-- CreateTable
CREATE TABLE "UserCours" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "termineLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCours_userId_idx" ON "UserCours"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCours_userId_coursId_key" ON "UserCours"("userId", "coursId");

-- AddForeignKey
ALTER TABLE "UserCours" ADD CONSTRAINT "UserCours_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCours" ADD CONSTRAINT "UserCours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
