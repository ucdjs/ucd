ALTER TABLE `execution_traces` RENAME COLUMN `timestamp` TO `start_timestamp`;--> statement-breakpoint
ALTER TABLE `execution_logs` ADD `level` text;--> statement-breakpoint
ALTER TABLE `execution_logs` ADD `source` text;--> statement-breakpoint
ALTER TABLE `execution_traces` ADD `duration_ms` real;--> statement-breakpoint
ALTER TABLE `execution_traces` ADD `end_timestamp` integer NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_execution_traces` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`execution_id` text NOT NULL,
	`trace_id` text,
	`span_id` text,
	`parent_span_id` text,
	`kind` text NOT NULL,
	`start_timestamp` real,
	`duration_ms` real,
	`end_timestamp` integer NOT NULL,
	`data` text NOT NULL,
	CONSTRAINT `fk_execution_traces_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_execution_traces_execution_id_executions_id_fk` FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_execution_traces`(`id`, `workspace_id`, `execution_id`, `trace_id`, `span_id`, `parent_span_id`, `kind`, `start_timestamp`, `data`) SELECT `id`, `workspace_id`, `execution_id`, `trace_id`, `span_id`, `parent_span_id`, `kind`, `start_timestamp`, `data` FROM `execution_traces`;--> statement-breakpoint
DROP TABLE `execution_traces`;--> statement-breakpoint
ALTER TABLE `__new_execution_traces` RENAME TO `execution_traces`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `execution_traces_workspace_timestamp_idx`;--> statement-breakpoint
CREATE INDEX `execution_traces_workspace_execution_idx` ON `execution_traces` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE INDEX `execution_traces_execution_start_idx` ON `execution_traces` (`execution_id`,`start_timestamp`);