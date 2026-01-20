-- CreateTable
CREATE TABLE "CarModel" (
    "id" SERIAL NOT NULL,
    "make" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "generation" TEXT,
    "yearStart" INTEGER,
    "yearEnd" INTEGER,
    "bodyStyle" TEXT,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineConfiguration" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "fuelType" TEXT NOT NULL,
    "displacementCc" INTEGER,
    "cylinders" INTEGER,
    "aspiration" TEXT,
    "powerHp" INTEGER,
    "torqueNm" INTEGER,
    "transmissionType" TEXT,
    "drivetrain" TEXT,

    CONSTRAINT "EngineConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelEngine" (
    "id" SERIAL NOT NULL,
    "carModelId" INTEGER NOT NULL,
    "engineConfigurationId" INTEGER NOT NULL,
    "trimName" TEXT,
    "yearStart" INTEGER,
    "yearEnd" INTEGER,

    CONSTRAINT "ModelEngine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCar" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "modelEngineId" INTEGER NOT NULL,
    "nickname" TEXT,
    "year" INTEGER,
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
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_make_modelName_generation_yearStart_key" ON "CarModel"("make", "modelName", "generation", "yearStart");

-- CreateIndex
CREATE UNIQUE INDEX "ModelEngine_carModelId_engineConfigurationId_trimName_yearS_key" ON "ModelEngine"("carModelId", "engineConfigurationId", "trimName", "yearStart");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_settingKey_key" ON "UserSetting"("userId", "settingKey");

-- AddForeignKey
ALTER TABLE "ModelEngine" ADD CONSTRAINT "ModelEngine_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelEngine" ADD CONSTRAINT "ModelEngine_engineConfigurationId_fkey" FOREIGN KEY ("engineConfigurationId") REFERENCES "EngineConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCar" ADD CONSTRAINT "UserCar_modelEngineId_fkey" FOREIGN KEY ("modelEngineId") REFERENCES "ModelEngine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
