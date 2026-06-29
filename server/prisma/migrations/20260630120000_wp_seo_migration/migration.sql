-- CreateTable
CREATE TABLE "WpSeoMigrationRun" (
    "id" TEXT NOT NULL,
    "externalJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "exportType" TEXT NOT NULL,
    "options" JSONB,
    "sourceUrl" TEXT,
    "phase" TEXT,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WpSeoMigrationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WpSeoMigrationRecord" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL DEFAULT 0,
    "recordType" TEXT NOT NULL DEFAULT '',
    "objectId" TEXT,
    "postType" TEXT,
    "taxonomy" TEXT,
    "termId" TEXT,
    "currentUrl" TEXT,
    "slug" TEXT,
    "titleWp" TEXT,
    "recommendedAction" TEXT,
    "nextjsTargetUrl" TEXT,
    "seoPriority" TEXT,
    "notes" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WpSeoMigrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WpSeoMigrationRun_externalJobId_key" ON "WpSeoMigrationRun"("externalJobId");

-- CreateIndex
CREATE INDEX "WpSeoMigrationRun_status_startedAt_idx" ON "WpSeoMigrationRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "WpSeoMigrationRecord_runId_createdAt_idx" ON "WpSeoMigrationRecord"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "WpSeoMigrationRecord_runId_recordType_idx" ON "WpSeoMigrationRecord"("runId", "recordType");

-- CreateIndex
CREATE INDEX "WpSeoMigrationRecord_currentUrl_idx" ON "WpSeoMigrationRecord"("currentUrl");

-- CreateIndex
CREATE INDEX "WpSeoMigrationRecord_slug_idx" ON "WpSeoMigrationRecord"("slug");

-- AddForeignKey
ALTER TABLE "WpSeoMigrationRecord" ADD CONSTRAINT "WpSeoMigrationRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WpSeoMigrationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
