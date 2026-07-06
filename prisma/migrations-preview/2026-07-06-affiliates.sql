Loaded Prisma config from prisma.config.ts.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "affiliateId" TEXT;

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "statsToken" TEXT NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateAuditLog" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_slug_key" ON "Affiliate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_statsToken_key" ON "Affiliate"("statsToken");

-- CreateIndex
CREATE INDEX "Affiliate_active_idx" ON "Affiliate"("active");

-- CreateIndex
CREATE INDEX "AffiliateAuditLog_affiliateId_idx" ON "AffiliateAuditLog"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateAuditLog_performedAt_idx" ON "AffiliateAuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "User_affiliateId_idx" ON "User"("affiliateId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateAuditLog" ADD CONSTRAINT "AffiliateAuditLog_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

