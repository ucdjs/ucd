PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`execution_id` text NOT NULL,
	`type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_events`("id", "workspace_id", "execution_id", "type", "timestamp", "data") SELECT "id", "workspace_id", "execution_id", "type", "timestamp", "data" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `events_workspace_execution_idx` ON `events` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE TABLE `__new_execution_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`execution_id` text NOT NULL,
	`span_id` text,
	`stream` text NOT NULL,
	`message` text NOT NULL,
	`timestamp` integer NOT NULL,
	`payload` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_execution_logs`("id", "workspace_id", "execution_id", "span_id", "stream", "message", "timestamp", "payload") SELECT "id", "workspace_id", "execution_id", "span_id", "stream", "message", "timestamp", "payload" FROM `execution_logs`;--> statement-breakpoint
DROP TABLE `execution_logs`;--> statement-breakpoint
ALTER TABLE `__new_execution_logs` RENAME TO `execution_logs`;--> statement-breakpoint
CREATE INDEX `execution_logs_workspace_execution_idx` ON `execution_logs` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE INDEX `execution_logs_workspace_timestamp_idx` ON `execution_logs` (`workspace_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `__new_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`pipeline_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`versions` text,
	`summary` text,
	`graph` text,
	`error` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_executions`("id", "workspace_id", "pipeline_id", "status", "started_at", "completed_at", "versions", "summary", "graph", "error") SELECT "id", "workspace_id", "pipeline_id", "status", "started_at", "completed_at", "versions", "summary", "graph", "error" FROM `executions`;--> statement-breakpoint
DROP TABLE `executions`;--> statement-breakpoint
ALTER TABLE `__new_executions` RENAME TO `executions`;--> statement-breakpoint
CREATE INDEX `executions_workspace_pipeline_idx` ON `executions` (`workspace_id`,`pipeline_id`);--> statement-breakpoint
CREATE INDEX `executions_workspace_started_idx` ON `executions` (`workspace_id`,`started_at`);