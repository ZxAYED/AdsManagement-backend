/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Banner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Banner" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
