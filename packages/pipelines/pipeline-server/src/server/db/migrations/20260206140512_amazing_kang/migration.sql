CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`execution_id` text NOT NULL,
	`type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text,
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `executions` (
	`id` text PRIMARY KEY NOT NULL,
	`pipeline_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`versions` text,
	`summary` text,
	`graph` text,
	`error` text
);
