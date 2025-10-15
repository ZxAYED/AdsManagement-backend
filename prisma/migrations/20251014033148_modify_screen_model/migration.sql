/*
  Warnings:

  - You are about to drop the column `img_url` on the `Screen` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Screen" DROP COLUMN "img_url",
ADD COLUMN     "imageUrls" TEXT[];
