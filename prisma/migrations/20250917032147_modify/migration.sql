-- AlterTable
ALTER TABLE "public"."BundleCampaign" ADD COLUMN     "paymentId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."BundleCampaign" ADD CONSTRAINT "BundleCampaign_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."BundlePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
