ALTER TABLE `execution_traces` ADD `trace_id` text;--> statement-breakpoint
ALTER TABLE `execution_traces` ADD `parent_span_id` text;--> statement-breakpoint
DROP INDEX IF EXISTS `events_workspace_execution_idx`;--> statement-breakpoint
DROP TABLE `events`;