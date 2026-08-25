-- Tambahkan unique index untuk dedup race-safe pada materialisasi on-demand.
CREATE UNIQUE INDEX `Schedule_templateId_departureTime_isDeleted_key`
ON `Schedule`(`templateId`, `departureTime`, `isDeleted`);
