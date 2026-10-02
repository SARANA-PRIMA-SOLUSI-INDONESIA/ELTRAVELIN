-- AlterTable
ALTER TABLE `Booking`
    ADD COLUMN `pickupRequested` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pickupCity` VARCHAR(191) NULL,
    ADD COLUMN `pickupZone` VARCHAR(191) NULL,
    ADD COLUMN `pickupAddress` VARCHAR(191) NULL,
    ADD COLUMN `pickupNote` VARCHAR(191) NULL,
    ADD COLUMN `pickupFee` INTEGER NOT NULL DEFAULT 0;
