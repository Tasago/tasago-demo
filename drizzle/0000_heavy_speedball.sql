CREATE TABLE `comparables` (
	`id` text PRIMARY KEY NOT NULL,
	`valuation_id` text NOT NULL,
	`source` text DEFAULT 'Manual' NOT NULL,
	`address` text NOT NULL,
	`price` integer NOT NULL,
	`surface` real NOT NULL,
	`unit_price` real NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`selected` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`valuation_id`) REFERENCES `valuations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_comparables_valuation` ON `comparables` (`valuation_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`valuation_id` text NOT NULL,
	`preference_id` text DEFAULT '' NOT NULL,
	`provider_payment_id` text DEFAULT '' NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'Pendiente' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`valuation_id`) REFERENCES `valuations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_payments_valuation` ON `payments` (`valuation_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`valuation_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`valuation_id`) REFERENCES `valuations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_documents_valuation` ON `documents` (`valuation_id`);--> statement-breakpoint
CREATE TABLE `valuations` (
	`id` text PRIMARY KEY NOT NULL,
	`folio` text NOT NULL,
	`customer_token` text NOT NULL,
	`plan` text DEFAULT 'Pro' NOT NULL,
	`owner_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`client_name` text NOT NULL,
	`client_email` text DEFAULT '' NOT NULL,
	`client_phone` text DEFAULT '' NOT NULL,
	`property_type` text NOT NULL,
	`address` text NOT NULL,
	`commune` text NOT NULL,
	`useful_surface` real NOT NULL,
	`total_surface` real DEFAULT 0 NOT NULL,
	`bedrooms` integer DEFAULT 0 NOT NULL,
	`bathrooms` integer DEFAULT 0 NOT NULL,
	`parking` integer DEFAULT 0 NOT NULL,
	`purpose` text DEFAULT 'Comercial' NOT NULL,
	`status` text DEFAULT 'Solicitud' NOT NULL,
	`fee` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'Pendiente' NOT NULL,
	`estimated_value` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_valuations_folio` ON `valuations` (`folio`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_valuations_customer_token` ON `valuations` (`customer_token`);--> statement-breakpoint
CREATE INDEX `idx_valuations_owner_created` ON `valuations` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_valuations_owner_status` ON `valuations` (`owner_id`,`status`);
--> statement-breakpoint
PRAGMA optimize;
