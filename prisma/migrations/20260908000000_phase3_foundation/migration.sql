ALTER TABLE "User" ADD COLUMN "originAddress" TEXT;
ALTER TABLE "Product" ADD COLUMN "featuredStatus" TEXT DEFAULT 'NONE';
ALTER TABLE "Product" ADD COLUMN "featuredUntil" TIMESTAMP(3);
ALTER TABLE "StoreSettings" ADD COLUMN "monthlyTarget" DOUBLE PRECISION;
