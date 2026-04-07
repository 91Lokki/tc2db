-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEALER_PURCHASE', 'USED_PURCHASE', 'USED_SALE', 'LISTING_CREATED', 'LISTING_CANCELLED', 'RACE_PRIZE', 'ACCOUNT_CLOSURE', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "flagUrl" TEXT,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "modelYear" INTEGER NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "power" INTEGER NOT NULL,
    "topSpeed" INTEGER NOT NULL,
    "carUrl" TEXT,
    "brandId" INTEGER NOT NULL,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "money" INTEGER NOT NULL DEFAULT 0,
    "regDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedCar" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "onSale" BOOLEAN NOT NULL DEFAULT false,
    "salePrice" INTEGER,
    "obtainDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyTransaction" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "counterpartyName" TEXT,
    "transTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceSchedule" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "raceDate" TIMESTAMP(3) NOT NULL,
    "status" "RaceStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "top1PlayerId" INTEGER,
    "top1Name" TEXT,
    "top2PlayerId" INTEGER,
    "top2Name" TEXT,
    "top3PlayerId" INTEGER,
    "top3Name" TEXT,

    CONSTRAINT "RaceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" SERIAL NOT NULL,
    "raceScheduleId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "ownedCarId" INTEGER NOT NULL,
    "finishRank" INTEGER NOT NULL,
    "finishTimeMs" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "prizeMoney" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonPoints" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "podiumCount" INTEGER NOT NULL DEFAULT 0,
    "raceCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_brandId_name_modelYear_key" ON "CarModel"("brandId", "name", "modelYear");

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player"("username");

-- CreateIndex
CREATE INDEX "OwnedCar_playerId_onSale_idx" ON "OwnedCar"("playerId", "onSale");

-- CreateIndex
CREATE INDEX "OwnedCar_onSale_idx" ON "OwnedCar"("onSale");

-- CreateIndex
CREATE INDEX "MoneyTransaction_playerId_transTime_idx" ON "MoneyTransaction"("playerId", "transTime");

-- CreateIndex
CREATE UNIQUE INDEX "Track_name_key" ON "Track"("name");

-- CreateIndex
CREATE INDEX "RaceSchedule_seasonYear_status_roundNumber_idx" ON "RaceSchedule"("seasonYear", "status", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RaceSchedule_seasonYear_roundNumber_key" ON "RaceSchedule"("seasonYear", "roundNumber");

-- CreateIndex
CREATE INDEX "RaceResult_playerId_finishRank_idx" ON "RaceResult"("playerId", "finishRank");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_raceScheduleId_playerId_key" ON "RaceResult"("raceScheduleId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_raceScheduleId_finishRank_key" ON "RaceResult"("raceScheduleId", "finishRank");

-- CreateIndex
CREATE INDEX "SeasonPoints_seasonYear_totalPoints_idx" ON "SeasonPoints"("seasonYear", "totalPoints");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonPoints_seasonYear_playerId_key" ON "SeasonPoints"("seasonYear", "playerId");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedCar" ADD CONSTRAINT "OwnedCar_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedCar" ADD CONSTRAINT "OwnedCar_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSchedule" ADD CONSTRAINT "RaceSchedule_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_raceScheduleId_fkey" FOREIGN KEY ("raceScheduleId") REFERENCES "RaceSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_ownedCarId_fkey" FOREIGN KEY ("ownedCarId") REFERENCES "OwnedCar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonPoints" ADD CONSTRAINT "SeasonPoints_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
