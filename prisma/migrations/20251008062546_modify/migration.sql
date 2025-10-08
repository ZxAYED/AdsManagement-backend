/*
  Warnings:

  - You are about to drop the column `contentIds` on the `CustomCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `contentIds` on the `CustomPayment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CustomCampaign" DROP COLUMN "contentIds",
ADD COLUMN     "contentUrls" TEXT[];

-- AlterTable
ALTER TABLE "public"."CustomPayment" DROP COLUMN "contentIds",
ADD COLUMN     "contentUrls" TEXT[];
