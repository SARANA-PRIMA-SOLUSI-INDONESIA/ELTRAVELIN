-- Allow custom tour/rental bookings outside catalog.
ALTER TABLE `TourBooking` ADD COLUMN `priceUnit` ENUM('PER_PAX', 'PER_VEHICLE', 'PER_DAY') NOT NULL DEFAULT 'PER_PAX';

-- Backfill priceUnit from catalog service when linked.
UPDATE `TourBooking` tb
INNER JOIN `TourService` ts ON tb.`serviceId` = ts.`id`
SET tb.`priceUnit` = ts.`priceUnit`;

-- Make serviceId optional + SetNull on delete (keep booking history).
ALTER TABLE `TourBooking` DROP FOREIGN KEY `TourBooking_serviceId_fkey`;
ALTER TABLE `TourBooking` MODIFY `serviceId` VARCHAR(191) NULL;
ALTER TABLE `TourBooking` ADD CONSTRAINT `TourBooking_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `TourService`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
