# ようこそOmojanへ

## 環境
全てCloudflare Workers

- 本番サイト: `omojan.com`
- STGサイト: `stg.omojan.com`
- 本番 API: `api.omojan.com`
- STG API: `api-stg.omojan.com`
- データベース: Cloudflare D1

## ローカル開発でのD1マイグレーション
- 初回のみ `pnpm --filter @repo/api run migrate:local` でローカルSQLiteにマイグレーションを適用
- `wrangler dev --local` 実行前に必要な場合は同コマンドを再実行

