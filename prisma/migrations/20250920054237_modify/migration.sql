/*
  Warnings:

  - You are about to drop the column `bundleId` on the `CustomContent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CustomContent" DROP CONSTRAINT "CustomContent_bundleId_fkey";

-- AlterTable
ALTER TABLE "public"."CustomContent" DROP COLUMN "bundleId";
