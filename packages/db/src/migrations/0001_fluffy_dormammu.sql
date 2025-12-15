ALTER TABLE `player_card` ADD `text` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `player_card_text_unique` ON `player_card` (`text`);--> statement-breakpoint
ALTER TABLE `round_theme` ADD `text` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `round_theme_text_unique` ON `round_theme` (`text`);