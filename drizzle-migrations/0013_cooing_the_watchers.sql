CREATE TABLE `cost_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entity_type` enum('ingredient','packaging','operational') NOT NULL,
	`entity_id` int NOT NULL,
	`previous_cost_per_base_unit` decimal(12,6) NOT NULL,
	`new_cost_per_base_unit` decimal(12,6) NOT NULL,
	`base_unit` varchar(20) NOT NULL,
	`source` varchar(50) NOT NULL,
	`purchase_entry_id` int,
	`purchase_entry_item_id` int,
	`reason` text,
	`applied_by` int,
	`applied_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cost_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ingredients` ADD `current_cost_per_base_unit` decimal(18,8) DEFAULT '0.00000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `current_cost_base_unit` varchar(20);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `last_cost_update_at` timestamp;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `last_cost_source` varchar(50);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `last_cost_purchase_item_id` int;--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `cost_applied_at` timestamp;--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `cost_applied_by` int;--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `cost_application_status` enum('pending','applied','skipped') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `cost_history` ADD CONSTRAINT `cost_history_purchase_entry_id_purchase_entries_id_fk` FOREIGN KEY (`purchase_entry_id`) REFERENCES `purchase_entries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_history` ADD CONSTRAINT `cost_history_purchase_entry_item_id_purchase_entry_items_id_fk` FOREIGN KEY (`purchase_entry_item_id`) REFERENCES `purchase_entry_items`(`id`) ON DELETE set null ON UPDATE no action;