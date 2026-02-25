/*
  Warnings:

  - You are about to drop the column `image` on the `Make` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Make" DROP COLUMN "image",
ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "imageURL" TEXT;
