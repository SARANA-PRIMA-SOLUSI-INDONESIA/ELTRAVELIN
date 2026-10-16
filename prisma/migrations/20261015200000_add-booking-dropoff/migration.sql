-- AlterTable
ALTER TABLE `Booking`
    ADD COLUMN `dropoffRequested` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `dropoffCity` VARCHAR(191) NULL,
    ADD COLUMN `dropoffZone` VARCHAR(191) NULL,
    ADD COLUMN `dropoffAddress` VARCHAR(191) NULL,
    ADD COLUMN `dropoffNote` VARCHAR(191) NULL,
    ADD COLUMN `dropoffFee` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `dropoffLat` DOUBLE NULL,
    ADD COLUMN `dropoffLng` DOUBLE NULL,
    ADD COLUMN `dropoffDistanceKm` DOUBLE NULL;
