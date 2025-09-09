/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Bundle` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Screen` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Bundle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Bundle" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "public"."Bundle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Screen_slug_key" ON "public"."Screen"("slug");
