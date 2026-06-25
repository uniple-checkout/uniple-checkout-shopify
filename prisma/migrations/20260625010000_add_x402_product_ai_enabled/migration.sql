-- x402 AI purchase target switch per Shopify product variant.
ALTER TABLE "X402Product" ADD COLUMN "aiEnabled" BOOLEAN NOT NULL DEFAULT true;
