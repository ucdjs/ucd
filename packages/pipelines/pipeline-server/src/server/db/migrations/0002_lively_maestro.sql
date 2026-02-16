CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`root_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `events` ADD `workspace_id` text NOT NULL;--> statement-breakpoint
CREATE INDEX `events_workspace_execution_idx` ON `events` (`workspace_id`,`execution_id`);--> statement-breakpoint
ALTER TABLE `execution_logs` ADD `workspace_id` text NOT NULL;--> statement-breakpoint
CREATE INDEX `execution_logs_workspace_execution_idx` ON `execution_logs` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE INDEX `execution_logs_workspace_timestamp_idx` ON `execution_logs` (`workspace_id`,`timestamp`);--> statement-breakpoint
ALTER TABLE `executions` ADD `workspace_id` text NOT NULL;--> statement-breakpoint
CREATE INDEX `executions_workspace_pipeline_idx` ON `executions` (`workspace_id`,`pipeline_id`);--> statement-breakpoint
CREATE INDEX `executions_workspace_started_idx` ON `executions` (`workspace_id`,`started_at`);