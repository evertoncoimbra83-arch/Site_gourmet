ALTER TABLE `purchase_entries` ADD CONSTRAINT `purchase_entries_fiscal_access_key_unique` UNIQUE(`fiscal_access_key`);--> statement-breakpoint
ALTER TABLE `purchase_entries` ADD `fiscal_access_key` varchar(44);--> statement-breakpoint
ALTER TABLE `purchase_entries` ADD `fiscal_document_type` varchar(10);--> statement-breakpoint
ALTER TABLE `purchase_entries` ADD `fiscal_series` varchar(20);--> statement-breakpoint
ALTER TABLE `purchase_entries` ADD `fiscal_number` varchar(50);--> statement-breakpoint
ALTER TABLE `purchase_entries` ADD `fiscal_issued_at` timestamp;--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `fiscal_code` varchar(50);--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `ean` varchar(50);--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `ncm` varchar(20);--> statement-breakpoint
ALTER TABLE `purchase_entry_items` ADD `cfop` varchar(10);