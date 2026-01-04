PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_player_card` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text,
	`submission_id` text,
	`text` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_player_card`("created_at", "updated_at", "game_id", "id", "player_id", "round_id", "submission_id", "text") SELECT "created_at", "updated_at", "game_id", "id", "player_id", "round_id", "submission_id", "text" FROM `player_card`;--> statement-breakpoint
DROP TABLE `player_card`;--> statement-breakpoint
ALTER TABLE `__new_player_card` RENAME TO `player_card`;--> statement-breakpoint
PRAGMA foreign_keys=ON;