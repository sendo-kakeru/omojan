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

1. `packages/db/src/schema/` 配下のスキーマファイルを編集
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
