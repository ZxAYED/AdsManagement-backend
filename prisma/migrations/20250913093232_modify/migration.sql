/*
  Warnings:

  - You are about to drop the column `userId` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Campaign" DROP CONSTRAINT "Campaign_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Campaign" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
