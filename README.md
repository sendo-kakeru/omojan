# ようこそ Omojan へ

## 環境

全て Cloudflare Workers

- 本番サイト: `omojan.com`
- STG サイト: `stg.omojan.com`
- 本番 API: `api.omojan.com`
- STG API: `api-stg.omojan.com`

用語

- 本番: production/prod
- STG: staging/stg
- 開発(現時点でローカル環境も含む): development/dev

## ブランチ名規約

- `main`: 本番環境用ブランチ（直接プッシュ禁止）
- `staging`: STG 環境用ブランチ（直接プッシュ禁止）
- `develop`: 開発用の統合ブランチ
- `feature/*`: 新機能開発用ブランチ
- `fix/*`: 軽微な修正用ブランチ
- `bugfix/*`: バグ修正用ブランチ
- `hotfix/*`: 本番環境の緊急修正用ブランチ
- `chore/*`: 雑務・依存関係更新用ブランチ
- `refactor/*`: リファクタリング用ブランチ
- `docs/*`: ドキュメント更新用ブランチ
- `revert/*`: コミット取り消し用ブランチ

## コミットメッセージ規約

### フォーマット

```
<type>(<scope>): <title>
<body>
```

例

```
feat(api): 変更内容の概要

詳細な説明（必要に応じて）
```

### 構成

1. 件名行: `<type>(<scope>): 変更内容の概要`（70 文字以内）
2. 空行: 件名と本文の間に必須
3. 本文: Why を重視（必要に応じて）
   - What よりも Why を記述
   - 箇条書きは `-` を使用
   - 破壊的変更: `BREAKING CHANGE:` で始める
   - 日本語

### type 一覧

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `perf`: パフォーマンス改善
- `test`: テストの追加や修正
- `refactor`: バグ修正や機能追加を含まないコード変更
- `chore`: ビルドプロセスやツールの変更
- `revert`: revert 用
