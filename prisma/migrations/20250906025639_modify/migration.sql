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

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "organisation_name" TEXT NOT NULL,
    "role" "public"."USER_ROLE" NOT NULL,
    "organisation_role" "public"."ORGANISATION_ROLE" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Screen" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "screen_name" TEXT NOT NULL,
    "screen_size" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "lat" TEXT NOT NULL,
    "lng" TEXT NOT NULL,
    "img_url" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "availability" "public"."SCREEN_AVAILABILITY" NOT NULL,
    "status" "public"."SCREEN_STATUS" NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bundle" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "bundle_name" TEXT NOT NULL,
    "img_url" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "status" "public"."BUNDLE_STATUS" NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "_BundleScreens_B_index" ON "public"."_BundleScreens"("B");

-- AddForeignKey
ALTER TABLE "public"."Screen" ADD CONSTRAINT "Screen_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bundle" ADD CONSTRAINT "Bundle_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BundleScreens" ADD CONSTRAINT "_BundleScreens_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BundleScreens" ADD CONSTRAINT "_BundleScreens_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
