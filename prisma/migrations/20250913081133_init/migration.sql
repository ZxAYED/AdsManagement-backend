-- CreateTable
CREATE TABLE "public"."BundleCampaingn" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "BundleCampaingn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BundleCampaingn" ADD CONSTRAINT "BundleCampaingn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleCampaingn" ADD CONSTRAINT "BundleCampaingn_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
