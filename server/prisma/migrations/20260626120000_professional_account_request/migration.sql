-- CreateTable
CREATE TABLE "ProfessionalAccountRequest" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalAccountRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalAccountRequest_email_idx" ON "ProfessionalAccountRequest"("email");

-- CreateIndex
CREATE INDEX "ProfessionalAccountRequest_status_idx" ON "ProfessionalAccountRequest"("status");

-- CreateIndex
CREATE INDEX "ProfessionalAccountRequest_createdAt_idx" ON "ProfessionalAccountRequest"("createdAt");
