-- 重複する投票レコードを削除（同一player_id・round_idの組み合わせで最も古いレコードのみ残す）
DELETE FROM `vote`
WHERE `rowid` NOT IN (
  SELECT MIN(`rowid`)
  FROM `vote`
  GROUP BY `player_id`, `round_id`
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vote_player_round_unique` ON `vote` (`player_id`,`round_id`);