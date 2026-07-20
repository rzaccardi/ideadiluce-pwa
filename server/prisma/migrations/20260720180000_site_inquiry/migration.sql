-- CreateTable
CREATE TABLE "SiteInquiry" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "productCode" TEXT,
    "brand" TEXT,
    "quantity" INTEGER,
    "usage" TEXT,
    "urgency" TEXT,
    "locale" TEXT,
    "attachmentMeta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteInquiry_kind_idx" ON "SiteInquiry"("kind");

-- CreateIndex
CREATE INDEX "SiteInquiry_email_idx" ON "SiteInquiry"("email");

-- CreateIndex
CREATE INDEX "SiteInquiry_status_idx" ON "SiteInquiry"("status");

-- CreateIndex
CREATE INDEX "SiteInquiry_createdAt_idx" ON "SiteInquiry"("createdAt");
