-- CreateTable
CREATE TABLE "Make" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,

    CONSTRAINT "Make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" UUID NOT NULL,
    "makeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bodyStyle" TEXT,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelYear" (
    "id" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "ModelYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engine" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "configuration" TEXT,
    "displacementLiters" DOUBLE PRECISION,
    "displacementCc" INTEGER,
    "cylinders" INTEGER,
    "fuelType" TEXT,
    "aspiration" TEXT,
    "horsepower" INTEGER,
    "torqueNm" INTEGER,

    CONSTRAINT "Engine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transmission" (
    "id" UUID NOT NULL,
    "type" TEXT,
    "gears" INTEGER,

    CONSTRAINT "Transmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drivetrain" (
    "id" UUID NOT NULL,
    "type" TEXT,
    "description" TEXT,

    CONSTRAINT "Drivetrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelYearEngine" (
    "id" UUID NOT NULL,
    "engineId" UUID NOT NULL,
    "modelYearId" UUID NOT NULL,

    CONSTRAINT "ModelYearEngine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelYearTransmission" (
    "id" UUID NOT NULL,
    "modelYearId" UUID NOT NULL,
    "transmissionId" UUID NOT NULL,

    CONSTRAINT "ModelYearTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelYearDrivetrain" (
    "id" UUID NOT NULL,
    "modelYearId" UUID NOT NULL,
    "drivetrainId" UUID NOT NULL,

    CONSTRAINT "ModelYearDrivetrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCar" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "modelYearId" UUID NOT NULL,
    "engineId" UUID NOT NULL,
    "transmissionId" UUID NOT NULL,
    "drivetrainId" UUID NOT NULL,
    "nickname" TEXT,
    "vin" TEXT,
    "licensePlate" TEXT,
    "color" TEXT,
    "mileageKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Make_name_key" ON "Make"("name");

-- CreateIndex
CREATE INDEX "Model_makeId_idx" ON "Model"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "Model_makeId_name_bodyStyle_key" ON "Model"("makeId", "name", "bodyStyle");

-- CreateIndex
CREATE INDEX "ModelYear_modelId_idx" ON "ModelYear"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelYear_modelId_year_key" ON "ModelYear"("modelId", "year");

-- CreateIndex
CREATE INDEX "Engine_code_idx" ON "Engine"("code");

-- CreateIndex
CREATE INDEX "ModelYearEngine_modelYearId_idx" ON "ModelYearEngine"("modelYearId");

-- CreateIndex
CREATE INDEX "ModelYearEngine_engineId_idx" ON "ModelYearEngine"("engineId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelYearEngine_engineId_modelYearId_key" ON "ModelYearEngine"("engineId", "modelYearId");

-- CreateIndex
CREATE INDEX "ModelYearTransmission_modelYearId_idx" ON "ModelYearTransmission"("modelYearId");

-- CreateIndex
CREATE INDEX "ModelYearTransmission_transmissionId_idx" ON "ModelYearTransmission"("transmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelYearTransmission_modelYearId_transmissionId_key" ON "ModelYearTransmission"("modelYearId", "transmissionId");

-- CreateIndex
CREATE INDEX "ModelYearDrivetrain_modelYearId_idx" ON "ModelYearDrivetrain"("modelYearId");

-- CreateIndex
CREATE INDEX "ModelYearDrivetrain_drivetrainId_idx" ON "ModelYearDrivetrain"("drivetrainId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelYearDrivetrain_modelYearId_drivetrainId_key" ON "ModelYearDrivetrain"("modelYearId", "drivetrainId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "UserCar_userId_idx" ON "UserCar"("userId");

-- CreateIndex
CREATE INDEX "UserCar_modelYearId_idx" ON "UserCar"("modelYearId");

-- CreateIndex
CREATE INDEX "UserCar_engineId_idx" ON "UserCar"("engineId");

-- CreateIndex
CREATE INDEX "UserCar_transmissionId_idx" ON "UserCar"("transmissionId");

-- CreateIndex
CREATE INDEX "UserCar_drivetrainId_idx" ON "UserCar"("drivetrainId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_settingKey_key" ON "UserSetting"("userId", "settingKey");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "Make"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYear" ADD CONSTRAINT "ModelYear_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYearEngine" ADD CONSTRAINT "ModelYearEngine_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "Engine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYearEngine" ADD CONSTRAINT "ModelYearEngine_modelYearId_fkey" FOREIGN KEY ("modelYearId") REFERENCES "ModelYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYearTransmission" ADD CONSTRAINT "ModelYearTransmission_modelYearId_fkey" FOREIGN KEY ("modelYearId") REFERENCES "ModelYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYearTransmission" ADD CONSTRAINT "ModelYearTransmission_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "Transmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYearDrivetrain" ADD CONSTRAINT "ModelYearDrivetrain_modelYearId_fkey" FOREIGN KEY ("modelYearId") REFERENCES "ModelYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelYearDrivetrain" ADD CONSTRAINT "ModelYearDrivetrain_drivetrainId_fkey" FOREIGN KEY ("drivetrainId") REFERENCES "Drivetrain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_modelYearId_fkey" FOREIGN KEY ("modelYearId") REFERENCES "ModelYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "Engine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "Transmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_drivetrainId_fkey" FOREIGN KEY ("drivetrainId") REFERENCES "Drivetrain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
