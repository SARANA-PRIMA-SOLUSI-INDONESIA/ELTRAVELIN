-- Pickup config JSON (and other settings) exceed VARCHAR(191).
ALTER TABLE `AppSetting` MODIFY `value` TEXT NOT NULL;
