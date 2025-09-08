/*
  Warnings:

  - You are about to drop the column `adminId` on the `Screen` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Screen" DROP CONSTRAINT "Screen_adminId_fkey";

-- AlterTable
ALTER TABLE "public"."Screen" DROP COLUMN "adminId";
