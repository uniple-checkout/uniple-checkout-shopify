ALTER TABLE "ShopSettings" ADD COLUMN "x402LastSyncSynced" INTEGER;
ALTER TABLE "ShopSettings" ADD COLUMN "x402LastSyncActive" INTEGER;
ALTER TABLE "ShopSettings" ADD COLUMN "x402LastSyncInactive" INTEGER;
ALTER TABLE "ShopSettings" ADD COLUMN "x402LastSyncSkipped" INTEGER;
ALTER TABLE "ShopSettings" ADD COLUMN "x402LastSyncError" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN "x402LastSyncAt" DATETIME;
