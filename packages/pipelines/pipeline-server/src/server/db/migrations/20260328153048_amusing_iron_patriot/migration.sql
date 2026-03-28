ALTER TABLE `execution_traces` ADD `start_timestamp` real;--> statement-breakpoint
DROP INDEX IF EXISTS `execution_traces_workspace_timestamp_idx`;--> statement-breakpoint
CREATE INDEX `execution_traces_execution_start_idx` ON `execution_traces` (`execution_id`,`start_timestamp`);