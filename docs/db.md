# DBについて

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
- E2E（CI）: `omojan-e2e-pr{PR番号}-{コミットSHA}`
  - PRごとに動的に作成・削除される一時的なDB
  - `omojan-main-e2e`をベースに複製して作成
- ユニットテスト: ローカルファイル
  - `packages/db/src/local.db`をテスト実行時にコピーして使用している
