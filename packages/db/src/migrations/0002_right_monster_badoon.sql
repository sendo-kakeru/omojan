CREATE INDEX `game_status_updated_at_idx` ON `game` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `player_game_id_idx` ON `player` (`game_id`);--> statement-breakpoint
CREATE INDEX `player_user_id_idx` ON `player` (`user_id`);