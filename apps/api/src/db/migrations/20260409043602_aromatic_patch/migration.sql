CREATE TABLE `versions` (
	`version` text PRIMARY KEY,
	`major` integer NOT NULL,
	`minor` integer NOT NULL,
	`patch` integer NOT NULL,
	`documentation_url` text NOT NULL,
	`date` text,
	`url` text NOT NULL,
	`mapped_ucd_version` text,
	`status` text NOT NULL,
	`manifest_path` text,
	`snapshot_path` text,
	`file_count` integer,
	`total_size` integer,
	`published_at` integer,
	`indexed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `versions_status_idx` ON `versions` (`status`);--> statement-breakpoint
CREATE INDEX `versions_semver_idx` ON `versions` (`major`,`minor`,`patch`);--> statement-breakpoint
CREATE INDEX `versions_indexed_at_idx` ON `versions` (`indexed_at`);