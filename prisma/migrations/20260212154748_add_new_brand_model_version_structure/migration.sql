/*
  Warnings:

  - You are about to drop the column `horsepower` on the `Engine` table. All the data in the column will be lost.
  - You are about to drop the column `bodyStyle` on the `Model` table. All the data in the column will be lost.
  - You are about to drop the column `modelYearId` on the `UserCar` table. All the data in the column will be lost.
  - You are about to drop the `ModelYear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelYearDrivetrain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelYearEngine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelYearTransmission` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[makeId,name]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `versionConfigId` to the `UserCar` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ModelYear" DROP CONSTRAINT "ModelYear_modelId_fkey";

-- DropForeignKey
ALTER TABLE "ModelYearDrivetrain" DROP CONSTRAINT "ModelYearDrivetrain_drivetrainId_fkey";

-- DropForeignKey
ALTER TABLE "ModelYearDrivetrain" DROP CONSTRAINT "ModelYearDrivetrain_modelYearId_fkey";

-- DropForeignKey
ALTER TABLE "ModelYearEngine" DROP CONSTRAINT "ModelYearEngine_engineId_fkey";

-- DropForeignKey
ALTER TABLE "ModelYearEngine" DROP CONSTRAINT "ModelYearEngine_modelYearId_fkey";

-- DropForeignKey
ALTER TABLE "ModelYearTransmission" DROP CONSTRAINT "ModelYearTransmission_modelYearId_fkey";

-- DropForeignKey
ALTER TABLE "ModelYearTransmission" DROP CONSTRAINT "ModelYearTransmission_transmissionId_fkey";

-- DropForeignKey
ALTER TABLE "UserCar" DROP CONSTRAINT "UserCar_modelYearId_fkey";

-- DropIndex
DROP INDEX "Model_makeId_name_bodyStyle_key";

-- DropIndex
DROP INDEX "UserCar_modelYearId_idx";

-- AlterTable
ALTER TABLE "Engine" DROP COLUMN "horsepower",
ADD COLUMN     "powerKw" INTEGER,
ADD COLUMN     "powerPs" INTEGER,
ADD COLUMN     "torqueLbft" INTEGER;

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "bodyStyle";

-- AlterTable
ALTER TABLE "UserCar" DROP COLUMN "modelYearId",
ADD COLUMN     "versionConfigId" UUID NOT NULL,
ALTER COLUMN "engineId" DROP NOT NULL,
ALTER COLUMN "transmissionId" DROP NOT NULL,
ALTER COLUMN "drivetrainId" DROP NOT NULL;

-- DropTable
DROP TABLE "ModelYear";

-- DropTable
DROP TABLE "ModelYearDrivetrain";

-- DropTable
DROP TABLE "ModelYearEngine";

-- DropTable
DROP TABLE "ModelYearTransmission";

-- CreateTable
CREATE TABLE "Generation" (
    "id" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BodyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyVariant" (
    "id" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "bodyTypeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "doors" INTEGER,
    "wheelbaseMm" INTEGER,
    "notes" TEXT,

    CONSTRAINT "BodyVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Version" (
    "id" UUID NOT NULL,
    "bodyVariantId" UUID NOT NULL,
    "phaseId" UUID,
    "name" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionConfig" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "year" INTEGER,
    "engineId" UUID,
    "transmissionId" UUID,
    "drivetrainId" UUID,

    CONSTRAINT "VersionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecSheet" (
    "id" UUID NOT NULL,
    "versionConfigId" UUID NOT NULL,
    "fuelType" TEXT,
    "powerPsOverride" INTEGER,
    "powerKwOverride" INTEGER,
    "torqueNmOverride" INTEGER,
    "torqueLbftOverride" INTEGER,
    "topSpeedKmh" INTEGER,
    "zeroTo100" DOUBLE PRECISION,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "wheelbaseMm" INTEGER,
    "curbWeightKg" INTEGER,
    "trunkLiters" INTEGER,
    "data" JSONB,

    CONSTRAINT "SpecSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Generation_modelId_idx" ON "Generation"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Generation_modelId_name_key" ON "Generation"("modelId", "name");

-- CreateIndex
CREATE INDEX "Phase_generationId_idx" ON "Phase"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_generationId_name_key" ON "Phase"("generationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BodyType_name_key" ON "BodyType"("name");

-- CreateIndex
CREATE INDEX "BodyVariant_generationId_idx" ON "BodyVariant"("generationId");

-- CreateIndex
CREATE INDEX "BodyVariant_bodyTypeId_idx" ON "BodyVariant"("bodyTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyVariant_generationId_bodyTypeId_name_key" ON "BodyVariant"("generationId", "bodyTypeId", "name");

-- CreateIndex
CREATE INDEX "Version_bodyVariantId_idx" ON "Version"("bodyVariantId");

-- CreateIndex
CREATE INDEX "Version_phaseId_idx" ON "Version"("phaseId");

-- CreateIndex
CREATE INDEX "VersionConfig_versionId_idx" ON "VersionConfig"("versionId");

-- CreateIndex
CREATE INDEX "VersionConfig_engineId_idx" ON "VersionConfig"("engineId");

-- CreateIndex
CREATE INDEX "VersionConfig_transmissionId_idx" ON "VersionConfig"("transmissionId");

-- CreateIndex
CREATE INDEX "VersionConfig_drivetrainId_idx" ON "VersionConfig"("drivetrainId");

-- CreateIndex
CREATE UNIQUE INDEX "VersionConfig_versionId_year_engineId_transmissionId_drivet_key" ON "VersionConfig"("versionId", "year", "engineId", "transmissionId", "drivetrainId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecSheet_versionConfigId_key" ON "SpecSheet"("versionConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "Model_makeId_name_key" ON "Model"("makeId", "name");

-- CreateIndex
CREATE INDEX "UserCar_versionConfigId_idx" ON "UserCar"("versionConfigId");

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyVariant" ADD CONSTRAINT "BodyVariant_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyVariant" ADD CONSTRAINT "BodyVariant_bodyTypeId_fkey" FOREIGN KEY ("bodyTypeId") REFERENCES "BodyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_bodyVariantId_fkey" FOREIGN KEY ("bodyVariantId") REFERENCES "BodyVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionConfig" ADD CONSTRAINT "VersionConfig_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionConfig" ADD CONSTRAINT "VersionConfig_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "Engine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionConfig" ADD CONSTRAINT "VersionConfig_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "Transmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionConfig" ADD CONSTRAINT "VersionConfig_drivetrainId_fkey" FOREIGN KEY ("drivetrainId") REFERENCES "Drivetrain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecSheet" ADD CONSTRAINT "SpecSheet_versionConfigId_fkey" FOREIGN KEY ("versionConfigId") REFERENCES "VersionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_versionConfigId_fkey" FOREIGN KEY ("versionConfigId") REFERENCES "VersionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
