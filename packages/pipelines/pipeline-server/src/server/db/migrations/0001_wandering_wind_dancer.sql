CREATE TABLE `execution_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`execution_id` text NOT NULL,
	`span_id` text,
	`stream` text NOT NULL,
	`message` text NOT NULL,
	`timestamp` integer NOT NULL,
	`payload` text,
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE cascade
);
