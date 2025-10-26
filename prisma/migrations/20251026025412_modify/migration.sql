-- CreateEnum
CREATE TYPE "public"."USER_STATUS" AS ENUM ('active', 'blocked');

-- CreateEnum
CREATE TYPE "public"."USER_ROLE" AS ENUM ('customer', 'admin');

-- CreateEnum
CREATE TYPE "public"."ORGANISATION_ROLE" AS ENUM ('advertiser', 'agency');

-- CreateEnum
CREATE TYPE "public"."SCREEN_AVAILABILITY" AS ENUM ('available', 'maintenance');

-- CreateEnum
CREATE TYPE "public"."SCREEN_STATUS" AS ENUM ('active', 'occupied');

-- CreateEnum
CREATE TYPE "public"."BUNDLE_STATUS" AS ENUM ('ongoing', 'expired');

-- CreateEnum
CREATE TYPE "public"."PAYMENT_STATUS" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "public"."CAMPAIGN_TYPE" AS ENUM ('bundle', 'custom');

-- CreateEnum
CREATE TYPE "public"."CAMPAIGN_STATUS" AS ENUM ('notPaid', 'pending', 'running', 'completed');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "organisation_name" TEXT NOT NULL,
    "role" "public"."USER_ROLE" NOT NULL,
    "organisation_role" "public"."ORGANISATION_ROLE" NOT NULL,
    "otp" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_reset_otp" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."USER_STATUS" NOT NULL DEFAULT 'active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Screen" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "screen_name" TEXT NOT NULL,
    "screen_size" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "lat" TEXT NOT NULL,
    "lng" TEXT NOT NULL,
    "imageUrls" JSONB NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "availability" "public"."SCREEN_AVAILABILITY" NOT NULL,
    "status" "public"."SCREEN_STATUS" NOT NULL,
    "location" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavouriteScreen" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavouriteScreen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomCampaign" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "public"."CAMPAIGN_STATUS" NOT NULL,
    "type" "public"."CAMPAIGN_TYPE" NOT NULL DEFAULT 'custom',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "contentUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomPayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentUrls" TEXT[],

    CONSTRAINT "CustomPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomContent" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bundle" (
    "id" TEXT NOT NULL,
    "bundle_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "img_url" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "status" "public"."BUNDLE_STATUS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Banner" (
    "id" TEXT NOT NULL,
    "img_url" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "text" TEXT,
    "isSeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "notificationDetail" TEXT NOT NULL,
    "isSeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BundlePayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "contentUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundlePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BundleCampaign" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "public"."CAMPAIGN_STATUS" NOT NULL,
    "type" "public"."CAMPAIGN_TYPE" NOT NULL,
    "contentUrls" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleCampaign_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."_CampaignScreens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampaignScreens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PaymentScreens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PaymentScreens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_BundleScreens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BundleScreens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Screen_slug_key" ON "public"."Screen"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "public"."Bundle"("slug");

-- CreateIndex
CREATE INDEX "_CampaignScreens_B_index" ON "public"."_CampaignScreens"("B");

-- CreateIndex
CREATE INDEX "_PaymentScreens_B_index" ON "public"."_PaymentScreens"("B");

-- CreateIndex
CREATE INDEX "_BundleScreens_B_index" ON "public"."_BundleScreens"("B");

-- AddForeignKey
ALTER TABLE "public"."FavouriteScreen" ADD CONSTRAINT "FavouriteScreen_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "public"."Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavouriteScreen" ADD CONSTRAINT "FavouriteScreen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomCampaign" ADD CONSTRAINT "CustomCampaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomPayment" ADD CONSTRAINT "CustomPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomPayment" ADD CONSTRAINT "CustomPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."CustomCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomContent" ADD CONSTRAINT "CustomContent_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "public"."Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Banner" ADD CONSTRAINT "Banner_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundlePayment" ADD CONSTRAINT "BundlePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundlePayment" ADD CONSTRAINT "BundlePayment_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleCampaign" ADD CONSTRAINT "BundleCampaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleCampaign" ADD CONSTRAINT "BundleCampaign_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."BundlePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleCampaign" ADD CONSTRAINT "BundleCampaign_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleContent" ADD CONSTRAINT "BundleContent_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleContent" ADD CONSTRAINT "BundleContent_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "public"."Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CampaignScreens" ADD CONSTRAINT "_CampaignScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CustomCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CampaignScreens" ADD CONSTRAINT "_CampaignScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PaymentScreens" ADD CONSTRAINT "_PaymentScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CustomPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PaymentScreens" ADD CONSTRAINT "_PaymentScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BundleScreens" ADD CONSTRAINT "_BundleScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BundleScreens" ADD CONSTRAINT "_BundleScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
