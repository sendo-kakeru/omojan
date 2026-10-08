DROP INDEX `vote_player_round_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `vote_player_id_round_id_unique` ON `vote` (`player_id`,`round_id`);--> statement-breakpoint
CREATE INDEX `vote_round_id_idx` ON `vote` (`round_id`);--> statement-breakpoint
CREATE INDEX `player_card_game_id_idx` ON `player_card` (`game_id`);--> statement-breakpoint
CREATE INDEX `player_card_player_id_idx` ON `player_card` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `round_game_id_round_no_unique` ON `round` (`game_id`,`round_no`);--> statement-breakpoint
CREATE INDEX `round_theme_round_id_idx` ON `round_theme` (`round_id`);--> statement-breakpoint
CREATE INDEX `submission_player_id_idx` ON `submission` (`player_id`);--> statement-breakpoint
CREATE INDEX `submission_round_id_idx` ON `submission` (`round_id`);