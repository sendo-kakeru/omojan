# メンテナンスモード

メンテナンス中は全リクエストに対して503ページを返す。

## 切り替え方法

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. Workers & Pages > `web` を選択
3. Settings > Variables に移動
4. `MAINTENANCE_MODE` を `true` に変更
5. Save and deploy
