-- stopTimesJson often exceeds VARCHAR(191) when many stops have custom times.
ALTER TABLE `Schedule` MODIFY `stopTimesJson` TEXT NULL;
ALTER TABLE `ScheduleTemplate` MODIFY `stopTimesJson` TEXT NULL;
