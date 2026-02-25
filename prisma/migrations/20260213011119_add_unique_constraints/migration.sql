/*
  Warnings:

  - A unique constraint covering the columns `[type,description]` on the table `Drivetrain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[type,gears]` on the table `Transmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bodyVariantId,phaseId,name]` on the table `Version` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Drivetrain_type_description_key" ON "Drivetrain"("type", "description");

-- CreateIndex
CREATE UNIQUE INDEX "Transmission_type_gears_key" ON "Transmission"("type", "gears");

-- CreateIndex
CREATE UNIQUE INDEX "Version_bodyVariantId_phaseId_name_key" ON "Version"("bodyVariantId", "phaseId", "name");
