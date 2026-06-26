-- CreateTable
CREATE TABLE "ProductTechnicalSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "specsIntro" TEXT,
    "productCode" TEXT,
    "lightSource" TEXT,
    "lampType" TEXT,
    "lampHolder" TEXT,
    "power" TEXT,
    "lightColor" TEXT,
    "colorRenderingIndex" TEXT,
    "luminousFlux" TEXT,
    "dimmable" TEXT,
    "energyClass" TEXT,
    "estimatedLifetime" TEXT,
    "dimensions" TEXT,
    "production" TEXT,
    "technicalManual" TEXT,

    CONSTRAINT "ProductTechnicalSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTechnicalSpec_productId_key" ON "ProductTechnicalSpec"("productId");

-- AddForeignKey
ALTER TABLE "ProductTechnicalSpec" ADD CONSTRAINT "ProductTechnicalSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
