/*
  Warnings:

  - Added the required column `isFeatured` to the `Screen` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Screen" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL;
