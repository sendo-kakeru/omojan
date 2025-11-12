PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`password` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`time_limit` integer NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_game`("created_at", "id", "updated_at", "is_private", "password", "status", "time_limit", "title") SELECT "created_at", "id", "updated_at", "is_private", "password", "status", "time_limit", "title" FROM `game`;--> statement-breakpoint
DROP TABLE `game`;--> statement-breakpoint
ALTER TABLE `__new_game` RENAME TO `game`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_player` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`game_token_hash` text NOT NULL,
	`is_host` integer DEFAULT false NOT NULL,
	`player_name` text NOT NULL,
	`seat` integer NOT NULL,
	`user_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_player`("created_at", "id", "updated_at", "game_id", "game_token_hash", "is_host", "player_name", "seat", "user_id") SELECT "created_at", "id", "updated_at", "game_id", "game_token_hash", "is_host", "player_name", "seat", "user_id" FROM `player`;--> statement-breakpoint
DROP TABLE `player`;--> statement-breakpoint
ALTER TABLE `__new_player` RENAME TO `player`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_game_token_hash_unique` ON `player` (`game_token_hash`);--> statement-breakpoint
CREATE TABLE `__new_player_card` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL,
	`word_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `word`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_player_card`("created_at", "id", "updated_at", "player_id", "round_id", "submission_id", "word_id") SELECT "created_at", "id", "updated_at", "player_id", "round_id", "submission_id", "word_id" FROM `player_card`;--> statement-breakpoint
DROP TABLE `player_card`;--> statement-breakpoint
ALTER TABLE `__new_player_card` RENAME TO `player_card`;--> statement-breakpoint
CREATE TABLE `__new_round` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`round_no` integer NOT NULL,
	`status` text DEFAULT 'submitting' NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_round`("created_at", "id", "updated_at", "game_id", "round_no", "status") SELECT "created_at", "id", "updated_at", "game_id", "round_no", "status" FROM `round`;--> statement-breakpoint
DROP TABLE `round`;--> statement-breakpoint
ALTER TABLE `__new_round` RENAME TO `round`;--> statement-breakpoint
CREATE TABLE `__new_round_theme` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`round_id` text NOT NULL,
	`word_id` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `word`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_round_theme`("created_at", "id", "updated_at", "round_id", "word_id") SELECT "created_at", "id", "updated_at", "round_id", "word_id" FROM `round_theme`;--> statement-breakpoint
DROP TABLE `round_theme`;--> statement-breakpoint
ALTER TABLE `__new_round_theme` RENAME TO `round_theme`;--> statement-breakpoint
CREATE TABLE `__new_round_winner` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_round_winner`("created_at", "id", "updated_at", "player_id", "round_id") SELECT "created_at", "id", "updated_at", "player_id", "round_id" FROM `round_winner`;--> statement-breakpoint
DROP TABLE `round_winner`;--> statement-breakpoint
ALTER TABLE `__new_round_winner` RENAME TO `round_winner`;--> statement-breakpoint
CREATE TABLE `__new_submission` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`position` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_submission`("created_at", "id", "updated_at", "player_id", "position", "round_id") SELECT "created_at", "id", "updated_at", "player_id", "position", "round_id" FROM `submission`;--> statement-breakpoint
DROP TABLE `submission`;--> statement-breakpoint
ALTER TABLE `__new_submission` RENAME TO `submission`;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`email` text NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sub` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("created_at", "id", "updated_at", "email", "image", "name", "status", "sub") SELECT "created_at", "id", "updated_at", "email", "image", "name", "status", "sub" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sub_unique` ON `user` (`sub`);--> statement-breakpoint
CREATE TABLE `__new_vote` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_vote`("created_at", "id", "updated_at", "player_id", "round_id", "submission_id") SELECT "created_at", "id", "updated_at", "player_id", "round_id", "submission_id" FROM `vote`;--> statement-breakpoint
DROP TABLE `vote`;--> statement-breakpoint
ALTER TABLE `__new_vote` RENAME TO `vote`;--> statement-breakpoint
CREATE TABLE `__new_word` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_word`("created_at", "id", "updated_at", "text") SELECT "created_at", "id", "updated_at", "text" FROM `word`;--> statement-breakpoint
DROP TABLE `word`;--> statement-breakpoint
ALTER TABLE `__new_word` RENAME TO `word`;--> statement-breakpoint
CREATE UNIQUE INDEX `word_text_unique` ON `word` (`text`);