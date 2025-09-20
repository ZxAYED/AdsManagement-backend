-- AlterTable
ALTER TABLE "public"."CustomCampaign" ADD COLUMN     "contentIds" TEXT[];

-- AlterTable
ALTER TABLE "public"."CustomPayment" ADD COLUMN     "contentIds" TEXT[];

-- CreateTable
CREATE TABLE "public"."CustomContent" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomContent" ADD CONSTRAINT "CustomContent_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomContent" ADD CONSTRAINT "CustomContent_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "public"."Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
