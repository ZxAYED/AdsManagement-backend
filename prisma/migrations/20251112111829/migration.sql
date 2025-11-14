-- CreateEnum
CREATE TYPE "USER_STATUS" AS ENUM ('active', 'blocked');

-- CreateEnum
CREATE TYPE "USER_ROLE" AS ENUM ('customer', 'admin');

-- CreateEnum
CREATE TYPE "ORGANISATION_ROLE" AS ENUM ('advertiser', 'agency');

-- CreateEnum
CREATE TYPE "SCREEN_AVAILABILITY" AS ENUM ('available', 'maintenance');

-- CreateEnum
CREATE TYPE "SCREEN_STATUS" AS ENUM ('active', 'occupied');

-- CreateEnum
CREATE TYPE "BUNDLE_STATUS" AS ENUM ('ongoing', 'expired');

-- CreateEnum
CREATE TYPE "PAYMENT_STATUS" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "CAMPAIGN_TYPE" AS ENUM ('bundle', 'custom');

-- CreateEnum
CREATE TYPE "CAMPAIGN_STATUS" AS ENUM ('notPaid', 'pending', 'running', 'completed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "organisation_name" TEXT NOT NULL,
    "role" "USER_ROLE" NOT NULL,
    "organisation_role" "ORGANISATION_ROLE" NOT NULL,
    "otp" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_reset_otp" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "USER_STATUS" NOT NULL DEFAULT 'active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screen" (
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
    "availability" "SCREEN_AVAILABILITY" NOT NULL,
    "status" "SCREEN_STATUS" NOT NULL,
    "location" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteScreen" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavouriteScreen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomCampaign" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "CAMPAIGN_STATUS" NOT NULL,
    "type" "CAMPAIGN_TYPE" NOT NULL DEFAULT 'custom',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "contentUrls" TEXT[],
    "isUploaded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomPayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentUrls" TEXT[],

    CONSTRAINT "CustomPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomContent" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "bundle_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "img_url" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "status" "BUNDLE_STATUS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "img_url" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "text" TEXT,
    "isSeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "notificationDetail" TEXT NOT NULL,
    "isSeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundlePayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PAYMENT_STATUS" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "contentUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundlePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleCampaign" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "CAMPAIGN_STATUS" NOT NULL,
    "type" "CAMPAIGN_TYPE" NOT NULL,
    "contentUrls" TEXT[],
    "isUploaded" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleContent" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampaignScreens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampaignScreens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PaymentScreens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PaymentScreens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BundleScreens" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BundleScreens_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Screen_slug_key" ON "Screen"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "Bundle"("slug");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_createdAt_idx" ON "Message"("receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "_CampaignScreens_B_index" ON "_CampaignScreens"("B");

-- CreateIndex
CREATE INDEX "_PaymentScreens_B_index" ON "_PaymentScreens"("B");

-- CreateIndex
CREATE INDEX "_BundleScreens_B_index" ON "_BundleScreens"("B");

-- AddForeignKey
ALTER TABLE "FavouriteScreen" ADD CONSTRAINT "FavouriteScreen_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteScreen" ADD CONSTRAINT "FavouriteScreen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCampaign" ADD CONSTRAINT "CustomCampaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPayment" ADD CONSTRAINT "CustomPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPayment" ADD CONSTRAINT "CustomPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CustomCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomContent" ADD CONSTRAINT "CustomContent_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundlePayment" ADD CONSTRAINT "BundlePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundlePayment" ADD CONSTRAINT "BundlePayment_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleCampaign" ADD CONSTRAINT "BundleCampaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleCampaign" ADD CONSTRAINT "BundleCampaign_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BundlePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleCampaign" ADD CONSTRAINT "BundleCampaign_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleContent" ADD CONSTRAINT "BundleContent_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleContent" ADD CONSTRAINT "BundleContent_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignScreens" ADD CONSTRAINT "_CampaignScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignScreens" ADD CONSTRAINT "_CampaignScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentScreens" ADD CONSTRAINT "_PaymentScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentScreens" ADD CONSTRAINT "_PaymentScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BundleScreens" ADD CONSTRAINT "_BundleScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BundleScreens" ADD CONSTRAINT "_BundleScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
