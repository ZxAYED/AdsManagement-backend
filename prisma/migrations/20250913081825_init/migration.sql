/*
  Warnings:

  - Added the required column `status` to the `BundleCampaingn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `BundleCampaingn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."CAMPAIGN_STATUS" ADD VALUE 'pending';

-- AlterTable
ALTER TABLE "public"."BundleCampaingn" ADD COLUMN     "status" "public"."CAMPAIGN_STATUS" NOT NULL,
ADD COLUMN     "type" "public"."CAMPAIGN_TYPE" NOT NULL;

-- CreateTable
CREATE TABLE "public"."BundlePayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundlePayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BundlePayment" ADD CONSTRAINT "BundlePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundlePayment" ADD CONSTRAINT "BundlePayment_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
