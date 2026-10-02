-- AlterTable
ALTER TABLE `Booking`
    ADD COLUMN `pickupLat` DOUBLE NULL,
    ADD COLUMN `pickupLng` DOUBLE NULL,
    ADD COLUMN `pickupDistanceKm` DOUBLE NULL;
