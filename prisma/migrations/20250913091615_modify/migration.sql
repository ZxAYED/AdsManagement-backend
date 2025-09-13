/*
  Warnings:

  - You are about to drop the `BundleCampaingn` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BundleCampaingn" DROP CONSTRAINT "BundleCampaingn_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BundleCampaingn" DROP CONSTRAINT "BundleCampaingn_customerId_fkey";

-- DropTable
DROP TABLE "public"."BundleCampaingn";

-- CreateTable
CREATE TABLE "public"."BundleCampaign" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "public"."CAMPAIGN_STATUS" NOT NULL,
    "type" "public"."CAMPAIGN_TYPE" NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleCampaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BundleCampaign" ADD CONSTRAINT "BundleCampaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleCampaign" ADD CONSTRAINT "BundleCampaign_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
