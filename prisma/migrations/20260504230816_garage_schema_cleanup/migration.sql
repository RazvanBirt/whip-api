/*
  Warnings:

  - You are about to drop the column `drivetrainId` on the `UserCar` table. All the data in the column will be lost.
  - You are about to drop the column `engineId` on the `UserCar` table. All the data in the column will be lost.
  - You are about to drop the column `transmissionId` on the `UserCar` table. All the data in the column will be lost.
  - You are about to alter the column `vin` on the `UserCar` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(17)`.

*/
-- DropForeignKey
ALTER TABLE "UserCar" DROP CONSTRAINT "UserCar_drivetrainId_fkey";

-- DropForeignKey
ALTER TABLE "UserCar" DROP CONSTRAINT "UserCar_engineId_fkey";

-- DropForeignKey
ALTER TABLE "UserCar" DROP CONSTRAINT "UserCar_transmissionId_fkey";

-- DropIndex
DROP INDEX "Drivetrain_type_description_key";

-- DropIndex
DROP INDEX "Model_name_key";

-- DropIndex
DROP INDEX "Transmission_type_key";

-- DropIndex
DROP INDEX "UserCar_drivetrainId_idx";

-- DropIndex
DROP INDEX "UserCar_engineId_idx";

-- DropIndex
DROP INDEX "UserCar_transmissionId_idx";

-- AlterTable
ALTER TABLE "UserCar" DROP COLUMN "drivetrainId",
DROP COLUMN "engineId",
DROP COLUMN "transmissionId",
ALTER COLUMN "vin" SET DATA TYPE VARCHAR(17);

-- CreateIndex
CREATE INDEX "UserCar_userId_versionConfigId_idx" ON "UserCar"("userId", "versionConfigId");
