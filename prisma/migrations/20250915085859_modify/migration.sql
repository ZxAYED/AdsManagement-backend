-- CreateTable
CREATE TABLE "public"."FavouriteScreen" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavouriteScreen_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."FavouriteScreen" ADD CONSTRAINT "FavouriteScreen_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "public"."Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavouriteScreen" ADD CONSTRAINT "FavouriteScreen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
