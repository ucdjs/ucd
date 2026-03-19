CREATE TABLE `execution_traces` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`execution_id` text NOT NULL,
	`span_id` text,
	`kind` text NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text NOT NULL,
	CONSTRAINT `fk_execution_traces_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_execution_traces_execution_id_executions_id_fk` FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `executions` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `executions` ADD `file_id` text;--> statement-breakpoint
CREATE INDEX `execution_traces_workspace_execution_idx` ON `execution_traces` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE INDEX `execution_traces_workspace_timestamp_idx` ON `execution_traces` (`workspace_id`,`timestamp`);