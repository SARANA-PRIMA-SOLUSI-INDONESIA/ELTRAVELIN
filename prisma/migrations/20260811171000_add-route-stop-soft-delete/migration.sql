-- AlterTable
ALTER TABLE `RouteStop` ADD COLUMN IF NOT EXISTS `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- Replace the old sequence constraint so deleted history rows do not block
-- reusing an active sequence number.
ALTER TABLE `RouteStop` DROP FOREIGN KEY `RouteStop_routeId_fkey`;
DROP INDEX `RouteStop_routeId_sequence_key` ON `RouteStop`;
CREATE UNIQUE INDEX `RouteStop_routeId_sequence_isDeleted_key` ON `RouteStop`(`routeId`, `sequence`, `isDeleted`);
ALTER TABLE `RouteStop` ADD CONSTRAINT `RouteStop_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `Route`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
