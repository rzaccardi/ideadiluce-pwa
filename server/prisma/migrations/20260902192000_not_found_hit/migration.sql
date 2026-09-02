-- CreateTable
CREATE TABLE "NotFoundHit" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "queryString" TEXT,
    "referrer" TEXT,
    "referrerHost" TEXT,
    "referrerKind" TEXT NOT NULL DEFAULT 'none',
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isProbe" BOOLEAN NOT NULL DEFAULT false,
    "pathKind" TEXT NOT NULL DEFAULT 'other',
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotFoundHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotFoundHit_path_idx" ON "NotFoundHit"("path");

-- CreateIndex
CREATE INDEX "NotFoundHit_createdAt_idx" ON "NotFoundHit"("createdAt");

-- CreateIndex
CREATE INDEX "NotFoundHit_path_createdAt_idx" ON "NotFoundHit"("path", "createdAt");

-- CreateIndex
CREATE INDEX "NotFoundHit_referrerKind_idx" ON "NotFoundHit"("referrerKind");

-- CreateIndex
CREATE INDEX "NotFoundHit_isBot_idx" ON "NotFoundHit"("isBot");

-- CreateIndex
CREATE INDEX "NotFoundHit_isProbe_idx" ON "NotFoundHit"("isProbe");

-- CreateIndex
CREATE INDEX "NotFoundHit_pathKind_idx" ON "NotFoundHit"("pathKind");

-- CreateIndex
CREATE INDEX "NotFoundHit_referrerHost_idx" ON "NotFoundHit"("referrerHost");
