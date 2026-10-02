-- CreateTable
CREATE TABLE `TourService` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TOUR_PACKAGE', 'DAILY_RENTAL') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDesc` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `destinations` TEXT NULL,
    `durationLabel` VARCHAR(191) NULL,
    `durationDays` INTEGER NULL,
    `durationNights` INTEGER NULL,
    `itinerary` TEXT NULL,
    `facilities` TEXT NULL,
    `includes` TEXT NULL,
    `excludes` TEXT NULL,
    `basePrice` INTEGER NOT NULL,
    `priceUnit` ENUM('PER_PAX', 'PER_VEHICLE', 'PER_DAY') NOT NULL DEFAULT 'PER_PAX',
    `minPax` INTEGER NOT NULL DEFAULT 1,
    `maxPax` INTEGER NULL,
    `vehicleId` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `gallery` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TourService_slug_key`(`slug`),
    INDEX `TourService_type_isActive_idx`(`type`, `isActive`),
    INDEX `TourService_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `inquiryCode` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `paxCount` INTEGER NOT NULL,
    `pickupLocation` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `basePrice` INTEGER NOT NULL,
    `status` ENUM('NEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TourInquiry_inquiryCode_key`(`inquiryCode`),
    INDEX `TourInquiry_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourQuote` (
    `id` VARCHAR(191) NOT NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `inquiryId` VARCHAR(191) NOT NULL,
    `pricePerUnit` INTEGER NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `discountType` VARCHAR(191) NULL,
    `discountValue` INTEGER NOT NULL DEFAULT 0,
    `discountReason` VARCHAR(191) NULL,
    `totalPrice` INTEGER NOT NULL,
    `validUntil` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TourQuote_quoteNumber_key`(`quoteNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourBooking` (
    `id` VARCHAR(191) NOT NULL,
    `bookingCode` VARCHAR(191) NOT NULL,
    `inquiryId` VARCHAR(191) NULL,
    `quoteId` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `serviceName` VARCHAR(191) NOT NULL,
    `serviceType` ENUM('TOUR_PACKAGE', 'DAILY_RENTAL') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `paxCount` INTEGER NOT NULL,
    `pickupLocation` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `basePrice` INTEGER NOT NULL,
    `discountAmount` INTEGER NOT NULL DEFAULT 0,
    `discountReason` VARCHAR(191) NULL,
    `totalPrice` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` VARCHAR(191) NULL,
    `paymentProofUrl` VARCHAR(191) NULL,
    `paymentNote` VARCHAR(191) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `settlementTime` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdByAdmin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TourBooking_bookingCode_key`(`bookingCode`),
    INDEX `TourBooking_status_idx`(`status`),
    INDEX `TourBooking_paymentMethod_idx`(`paymentMethod`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TourService` ADD CONSTRAINT `TourService_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourInquiry` ADD CONSTRAINT `TourInquiry_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `TourService`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourQuote` ADD CONSTRAINT `TourQuote_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `TourInquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourBooking` ADD CONSTRAINT `TourBooking_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `TourService`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourBooking` ADD CONSTRAINT `TourBooking_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `TourInquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourBooking` ADD CONSTRAINT `TourBooking_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `TourQuote`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;