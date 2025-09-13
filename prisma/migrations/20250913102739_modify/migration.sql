/*
  Warnings:

  - You are about to drop the `Campaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CampaignScreen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Campaign" DROP CONSTRAINT "Campaign_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Campaign" DROP CONSTRAINT "Campaign_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CampaignScreen" DROP CONSTRAINT "CampaignScreen_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CampaignScreen" DROP CONSTRAINT "CampaignScreen_screenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_customerId_fkey";

-- DropTable
DROP TABLE "public"."Campaign";

-- DropTable
DROP TABLE "public"."CampaignScreen";

-- DropTable
DROP TABLE "public"."Payment";
