-- AlterTable
ALTER TABLE "public"."BundleCampaign" ADD COLUMN     "isUploaded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."CustomCampaign" ADD COLUMN     "isUploaded" BOOLEAN NOT NULL DEFAULT false;
