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
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_execution_logs` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`execution_id` text NOT NULL,
	`span_id` text,
	`stream` text,
	`message` text NOT NULL,
	`timestamp` integer NOT NULL,
	`payload` text,
	CONSTRAINT `execution_logs_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
	CONSTRAINT `execution_logs_execution_id_executions_id_fk` FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_execution_logs`(`id`, `workspace_id`, `execution_id`, `span_id`, `stream`, `message`, `timestamp`, `payload`) SELECT `id`, `workspace_id`, `execution_id`, `span_id`, `stream`, `message`, `timestamp`, `payload` FROM `execution_logs`;--> statement-breakpoint
DROP TABLE `execution_logs`;--> statement-breakpoint
ALTER TABLE `__new_execution_logs` RENAME TO `execution_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `execution_logs_workspace_execution_idx` ON `execution_logs` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE INDEX `execution_logs_workspace_timestamp_idx` ON `execution_logs` (`workspace_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `execution_traces_workspace_execution_idx` ON `execution_traces` (`workspace_id`,`execution_id`);--> statement-breakpoint
CREATE INDEX `execution_traces_workspace_timestamp_idx` ON `execution_traces` (`workspace_id`,`timestamp`);--> statement-breakpoint
ALTER TABLE `executions` DROP COLUMN `graph`;