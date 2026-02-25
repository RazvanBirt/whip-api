/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Engine` will be added. If there are existing duplicate values, this will fail.
  - Made the column `code` on table `Engine` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Engine" ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "Make" ADD COLUMN     "image" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Engine_code_key" ON "Engine"("code");
