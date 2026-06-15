CREATE TABLE `announcement_targets` (
	`id` varchar(255) NOT NULL,
	`announcement_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `announcement_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `announcement_targets_announcement_user_idx` UNIQUE(`announcement_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_classification_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern` varchar(255) NOT NULL,
	`category` enum('FOOD_INGREDIENT','PACKAGING','LABEL_PRINTING','CLEANING','LOGISTICS','PAYMENT_OR_SERVICE_FEE','OPERATIONAL_EXPENSE','IGNORE') NOT NULL,
	`linked_entity_type` enum('ingredient','packaging','operational'),
	`linked_entity_id` int,
	`default_unit` varchar(20),
	`conversion_factor` decimal(10,4) DEFAULT '1.0000',
	`confidence` int NOT NULL DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_classification_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplier_id` int,
	`supplier_name_snapshot` varchar(255),
	`invoice_number` varchar(100),
	`purchased_at` timestamp NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`notes` text,
	`source` enum('manual','spreadsheet','xml') NOT NULL DEFAULT 'manual',
	`classification_status` enum('pending','partial','classified','ignored') NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_entry_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchase_entry_id` int NOT NULL,
	`raw_description` varchar(255) NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	`category` enum('FOOD_INGREDIENT','PACKAGING','LABEL_PRINTING','CLEANING','LOGISTICS','PAYMENT_OR_SERVICE_FEE','OPERATIONAL_EXPENSE','IGNORE'),
	`linked_entity_type` enum('ingredient','packaging','operational'),
	`linked_entity_id` int,
	`conversion_factor` decimal(10,4) DEFAULT '1.0000',
	`computed_cost_per_base_unit` decimal(12,6) DEFAULT '0.000000',
	`classification_status` enum('pending','classified','ignored') NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_entry_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(18),
	`contact_info` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dish_sizes` ADD `no_accompaniments_message` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `public_access_token` varchar(64);--> statement-breakpoint
ALTER TABLE `announcements` ADD `icon_emoji` varchar(16);--> statement-breakpoint
ALTER TABLE `announcements` ADD `visibility_scope` enum('all','authenticated','specific_users') DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `accompaniment_options` ADD `is_no_accompaniment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bi_sales_facts` ADD `is_customized` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bi_sales_facts` ADD `is_from_kit` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bi_sales_facts` ADD `macro_deviation_kcal` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `announcement_targets` ADD CONSTRAINT `announcement_targets_announcement_id_announcements_id_fk` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcement_targets` ADD CONSTRAINT `announcement_targets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_entries` ADD CONSTRAINT `purchase_entries_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD CONSTRAINT `purchase_entry_items_purchase_entry_id_purchase_entries_id_fk` FOREIGN KEY (`purchase_entry_id`) REFERENCES `purchase_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `announcement_targets_announcement_id_idx` ON `announcement_targets` (`announcement_id`);--> statement-breakpoint
CREATE INDEX `announcement_targets_user_id_idx` ON `announcement_targets` (`user_id`);--> statement-breakpoint
CREATE INDEX `bi_sales_facts_dish_id_idx` ON `bi_sales_facts` (`dish_id`);