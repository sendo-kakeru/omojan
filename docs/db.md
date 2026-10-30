# DBについて

## 各種DB

- 本番: `omojan-main-prod`
  - 基本はmainブランチマージ時にworkflowでmigration
  - 手動で行う必要がある場合はローカル環境から手動migration実行
- STG: `omojan-main-stg`
  - 基本はstagingブランチマージ時にworkflowでmigration
  - 手動で行う必要がある場合はローカル環境から手動migration実行
- ローカル: `omojan-main-local-{developer}`
  - 開発者ごとに`omojan-main-stg` → `omojan-main-local-{developer}`をbranchingして開発
- E2E（ローカル）: `omojan-main-e2e`
  - ローカルでのE2Eテスト実行用
- E2E（CI）: `omojan-e2e-{GitHub Actions run_id}-{run_attempt}`
  - GitHub Actionsの実行ごとに動的に作成・削除される一時的なDB
  - `omojan-main-e2e`をベースに複製して作成
- ユニットテスト: ローカルファイル
  - `packages/db/src/local.db`をテスト実行時にコピーして使用している

## スキーマ変更フロー

1. `packages/db/src/schemas/` 配下のスキーマファイルを編集
2. `turso auth login` でCLIをログイン
3. `pnpm run db:changed --filter @repo/db` を実行
   - マイグレーションファイル生成（`db:gen`）
   - ローカル・E2E DBへの適用（`db:migrate:local`, `db:migrate:e2e`）
   - ローカルDBダンプ（`db:dump`）
4. 既存データの変換が必要な場合、生成されたマイグレーションファイルにSQL文を手動で追加する
5. 生成されたマイグレーションファイル（`packages/db/src/migrations/`）をコミットに含める
6. STG・本番への適用はブランチマージ時にGitHub Actionsで自動実行
   - `staging`ブランチへのマージ → STG DBに適用
   - `main`ブランチへのマージ → 本番DBに適用

## インデックスの命名規約

`{テーブル名}_{列名}_{idx|unique}` とする。

- 列名はDB上の列名（スネークケース）をそのまま使い、`_id` なども省略しない
- 複合インデックスは列をインデックスの定義順に `_` で連結する
- 末尾は通常のインデックスは `idx`、UNIQUE インデックスは `unique`
  - drizzle の `.unique()` で自動生成される名前もこの形式になる

例:

- `player_game_id_idx`（`player (game_id)`）
- `game_status_updated_at_idx`（`game (status, updated_at)`）
- `vote_player_id_round_id_unique`（`vote (player_id, round_id)` の UNIQUE）

## 件数カウンター（`game_counter`）の更新ルール

終了済みゲームの総件数は、`count()` による全件走査を避けるため `game_counter` テーブル（`status = 'finished'` の行）で管理している。
詳細は `docs/design-docs/finished-game-counter.md` を参照。

- ゲームを finished にする処理、または finished のゲームを操作する処理を追加する場合は、同一トランザクションで `game_counter` を更新すること
  - 現状アプリケーションで更新しているのは `GameService.endGame`（finished でないゲームを finished に更新できた場合のみ +1）のみ
- finished のゲームの削除は、Cleanup（`CleanupService.runAll`）の最後に行う再計算で件数を合わせるため、個別の更新は不要
- 更新を忘れても、Cleanup（cron 2時間ごと）の再計算で最大2時間以内に修復される

## ゲームの勝者（`player.is_winner`）の更新ルール

勝者はゲーム終了時に `player.is_winner` に保存し、結果は一覧・ユーザー統計の勝者はここから読んでいる。
詳細は `docs/design-docs/game-winner-column.md` を参照。

- ゲームを finished にする処理を追加する場合は、同一トランザクションで `player.is_winner` も更新すること
  - 現状アプリケーションで更新しているのは `GameService.endGame`（finished でないゲームを finished に更新できた場合のみ）のみ
- `game_counter` と異なり定期的な再計算は行わないため、更新を忘れると修復されない
  - 取りこぼしが見つかった場合は、`packages/db/src/migrations/0005_daily_wolfpack.sql` のバックフィル SQL を再実行する
