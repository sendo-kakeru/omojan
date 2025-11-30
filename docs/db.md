# DBについて

- 本番: `omojan-main-prod`
  - 基本はmainブランチマージ時にworkflowでmigration
  - 手動で行う必要がある場合はローカル環境から手動migration実行
- STG: `omojan-main-stg`
  - 基本はdevelopブランチマージ時にworkflowでmigration
  - 手動で行う必要がある場合はローカル環境から手動migration実行
- ローカル: `omojan-main-local-{developer}`
  - 開発者ごとに`omojan-main-stg` → `omojan-main-local-{developer}`をbranchingして開発
- E2E: `omojan-main-e2e`
  - ローカル、CIで共通。開発者が増えたり必要になったらPR毎にDBを作成することも検討
- ユニットテスト: ローカルファイル
  - `packages/db/src/local.db`をテスト実行時にコピーして使用している