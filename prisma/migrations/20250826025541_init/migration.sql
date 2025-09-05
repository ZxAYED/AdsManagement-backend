/*
  Warnings:

  - You are about to drop the column `address_Pickup_Location` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AddParcel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GetInTouch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RestrictedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShippoLineItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShippoOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tickets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AddParcel" DROP CONSTRAINT "AddParcel_addressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AddParcel" DROP CONSTRAINT "AddParcel_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AddParcel" DROP CONSTRAINT "AddParcel_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Address" DROP CONSTRAINT "Address_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Customer" DROP CONSTRAINT "Customer_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_parcelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_parcelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentMethod" DROP CONSTRAINT "PaymentMethod_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RestrictedUser" DROP CONSTRAINT "RestrictedUser_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShippoLineItem" DROP CONSTRAINT "ShippoLineItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tickets" DROP CONSTRAINT "tickets_marchentId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "address_Pickup_Location",
DROP COLUMN "businessName",
DROP COLUMN "createdAt",
DROP COLUMN "isDeleted",
DROP COLUMN "phone",
DROP COLUMN "role",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "socketId" TEXT;

-- DropTable
DROP TABLE "public"."AddParcel";

-- DropTable
DROP TABLE "public"."Address";

-- DropTable
DROP TABLE "public"."Customer";

-- DropTable
DROP TABLE "public"."GetInTouch";

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."Payment";

-- DropTable
DROP TABLE "public"."PaymentMethod";

-- DropTable
DROP TABLE "public"."RestrictedUser";

-- DropTable
DROP TABLE "public"."ShippoLineItem";

-- DropTable
DROP TABLE "public"."ShippoOrder";

-- DropTable
DROP TABLE "public"."comments";

-- DropTable
DROP TABLE "public"."tickets";

-- DropEnum
DROP TYPE "public"."ParcelStatus";

-- DropEnum
DROP TYPE "public"."ParcelType";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."PaymentType";

-- DropEnum
DROP TYPE "public"."RESTRICTED_USER_ROLE";

-- DropEnum
DROP TYPE "public"."SupportCategory";

-- DropEnum
DROP TYPE "public"."SupportPriority";

-- DropEnum
DROP TYPE "public"."SupportStatus";

-- DropEnum
DROP TYPE "public"."USER_ROLE";

-- DropEnum
DROP TYPE "public"."UserStatus";
