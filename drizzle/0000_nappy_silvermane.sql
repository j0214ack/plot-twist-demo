CREATE TABLE `semantic_rate_limits` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer NOT NULL,
	`updated_at` integer NOT NULL
);
