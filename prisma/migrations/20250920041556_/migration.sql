/*
  Warnings:

  - You are about to drop the column `contentUrl` on the `BundleCampaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."BundleCampaign" DROP COLUMN "contentUrl",
ADD COLUMN     "contentIds" TEXT[];

-- AlterTable
ALTER TABLE "public"."BundlePayment" ADD COLUMN     "contentIds" TEXT[];

-- CreateTable
CREATE TABLE "public"."BundleContent" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BundleContent" ADD CONSTRAINT "BundleContent_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleContent" ADD CONSTRAINT "BundleContent_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "public"."Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
