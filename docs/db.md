# DBについて

- 本番: `omojan-main-prod`
  - 基本はmainブランチマージ時にdeploy workflowでmigration
  - 手動で行う必要がある場合はローカル環境から手動migration実行
- STG: `omojan-main-stg`
  - 基本はdevelopブランチマージ時にdeploy workflowでmigration
  - 手動で行う必要がある場合はローカル環境から手動migration実行
- ローカル: `omojan-main-local-{developer}`
  - 開発者ごとに`omojan-main-stg` → `omojan-main-local-{developer}`をbranchingして開発
- テスト: ローカルファイル
  - `packages/db/src/local.db`をテスト実行時にコピーして使用している