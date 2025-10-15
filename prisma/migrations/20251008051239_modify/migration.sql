/*
  Warnings:

  - You are about to drop the column `contentIds` on the `BundleCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `contentUrl` on the `BundleCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `contentIds` on the `BundlePayment` table. All the data in the column will be lost.
  - You are about to drop the column `contentUrl` on the `BundlePayment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."BundleCampaign" DROP COLUMN "contentIds",
DROP COLUMN "contentUrl",
ADD COLUMN     "contentUrls" TEXT[];

-- AlterTable
ALTER TABLE "public"."BundlePayment" DROP COLUMN "contentIds",
DROP COLUMN "contentUrl",
ADD COLUMN     "contentUrls" TEXT[];
