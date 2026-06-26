-- AlterTable
ALTER TABLE "Session" ADD COLUMN "impersonatedByAdminId" TEXT;

-- CreateTable
CREATE TABLE "ImpersonationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationToken_tokenHash_key" ON "ImpersonationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ImpersonationToken_userId_idx" ON "ImpersonationToken"("userId");

-- CreateIndex
CREATE INDEX "ImpersonationToken_adminUserId_idx" ON "ImpersonationToken"("adminUserId");

-- CreateIndex
CREATE INDEX "ImpersonationToken_expiresAt_idx" ON "ImpersonationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_impersonatedByAdminId_idx" ON "Session"("impersonatedByAdminId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_impersonatedByAdminId_fkey" FOREIGN KEY ("impersonatedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationToken" ADD CONSTRAINT "ImpersonationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationToken" ADD CONSTRAINT "ImpersonationToken_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
