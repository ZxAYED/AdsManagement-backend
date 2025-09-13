/*
  Warnings:

  - Added the required column `contentUrl` to the `CampaignScreen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `CampaignScreen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `industry` to the `CampaignScreen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CampaignScreen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `CampaignScreen` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CampaignScreen" ADD COLUMN     "contentUrl" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "industry" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;
