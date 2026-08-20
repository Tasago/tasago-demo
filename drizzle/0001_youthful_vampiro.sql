CREATE TABLE IF NOT EXISTS `automation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`valuation_id` text NOT NULL,
	`job_type` text NOT NULL,
	`status` text DEFAULT 'Pendiente' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`result_json` text DEFAULT '{}' NOT NULL,
	`last_error` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`valuation_id`) REFERENCES `valuations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_automation_jobs_valuation_status` ON `automation_jobs` (`valuation_id`,`status`);
--> statement-breakpoint
ALTER TABLE `valuations` ADD `workflow_step` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `completion_percent` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `automation_status` text DEFAULT 'Pendiente' NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `extraction_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `technical_sheet_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `model_result_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `report_storage_key` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `valuations` ADD `review_reason` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `documents` ADD `kind` text DEFAULT 'otro' NOT NULL;
--> statement-breakpoint
ALTER TABLE `documents` ADD `processing_status` text DEFAULT 'Recibido' NOT NULL;
--> statement-breakpoint
ALTER TABLE `documents` ADD `extracted_data` text DEFAULT '{}' NOT NULL;
