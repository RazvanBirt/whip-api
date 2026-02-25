/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `Drivetrain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[type]` on the table `Transmission` will be added. If there are existing duplicate values, this will fail.
  - Made the column `doors` on table `BodyVariant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Drivetrain` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startYear` on table `Generation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `Make` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Transmission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gears` on table `Transmission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `VersionConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BodyVariant" ALTER COLUMN "doors" SET NOT NULL;

-- AlterTable
ALTER TABLE "Drivetrain" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "Generation" ALTER COLUMN "startYear" SET NOT NULL;

-- AlterTable
ALTER TABLE "Make" ALTER COLUMN "country" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transmission" ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "gears" SET NOT NULL;

-- AlterTable
ALTER TABLE "VersionConfig" ALTER COLUMN "year" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Drivetrain_type_key" ON "Drivetrain"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Transmission_type_key" ON "Transmission"("type");
