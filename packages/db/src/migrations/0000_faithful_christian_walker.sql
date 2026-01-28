CREATE TABLE `game` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`password` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`time_limit` integer NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `player` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`game_token_hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_cpu` integer DEFAULT false NOT NULL,
	`is_host` integer DEFAULT false NOT NULL,
	`player_name` text NOT NULL,
	`seat` integer NOT NULL,
	`user_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_game_token_hash_unique` ON `player` (`game_token_hash`);--> statement-breakpoint
CREATE TABLE `player_card` (
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
CREATE TABLE `round` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`round_no` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `round_theme` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `submission` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`position` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`email` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sub` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sub_unique` ON `user` (`sub`);--> statement-breakpoint
CREATE TABLE `vote` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade
);
