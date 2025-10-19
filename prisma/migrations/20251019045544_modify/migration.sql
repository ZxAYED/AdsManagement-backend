/*
  Warnings:

  - Changed the type of `imageUrls` on the `Screen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Screen" DROP COLUMN "imageUrls",
ADD COLUMN     "imageUrls" JSONB NOT NULL;
