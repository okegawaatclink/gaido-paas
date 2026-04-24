# その他

## KeyCloak レルム設定

### レルム構成

- レルム名: `paas-management`
- クライアント:
  - `paas-frontend`: フロントエンド用OIDCクライアント（Authorization Code Flow）
  - `paas-admin`: Admin API用クライアント（Client Credentials）
- ロール:
  - `cloud-aws`: AWSアクセス権
  - `cloud-gcp`: GCPアクセス権
  - `cloud-azure`: Azureアクセス権

### 初期セットアップ

KeyCloakの初期設定は `realm-export.json` で管理する。
Docker Compose起動時に自動インポートする。

## データ連携の前提

- DBのユーザーデータは別システムから事前に投入される
- 連携方式（バッチ/API等）は本システムのスコープ外
- 開発・テスト用にシードデータを投入するマイグレーションスクリプトを用意する

## セキュリティ考慮事項

- OIDC Authorization Code Flow + PKCE使用
- JWTトークンのサーバーサイドでの検証
- CSRF対策: NextAuth.jsのビルトイン対策を活用
- XSS対策: React/Next.jsのデフォルトエスケープを活用
- CORS: BFF経由のプロキシのため、バックエンドはBFFからのみ受付
