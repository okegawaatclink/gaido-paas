# デプロイ構造・コマンド

## Docker Compose構成

全サービスをDocker Composeで一括管理する。

### サービス一覧

| サービス | イメージ | ポート | 説明 |
|---------|---------|--------|------|
| frontend | カスタムビルド | 3001 | Next.js（フロントエンド + BFF） |
| backend | カスタムビルド | 3002 | Spring MVC（バックエンドAPI） |
| postgres | postgres:16 | 5432 | PostgreSQL |
| keycloak | quay.io/keycloak/keycloak:latest | 8080 | KeyCloak（IdP） |

## 起動コマンド

```bash
# output_system/ ディレクトリで実行
cd output_system

# ビルド＆起動
docker compose build
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

## 環境変数

### フロントエンド（Next.js）

| 変数名 | 説明 |
|--------|------|
| NEXTAUTH_URL | NextAuth.jsのベースURL |
| NEXTAUTH_SECRET | NextAuth.jsのシークレット |
| KEYCLOAK_CLIENT_ID | KeyCloakクライアントID |
| KEYCLOAK_CLIENT_SECRET | KeyCloakクライアントシークレット |
| KEYCLOAK_ISSUER | KeyCloakのIssuer URL |
| BACKEND_URL | Spring MVCバックエンドのURL |
| KEYCLOAK_ADMIN_URL | KeyCloak Admin APIのURL |
| KEYCLOAK_ADMIN_CLIENT_ID | KeyCloak Admin用クライアントID |
| KEYCLOAK_ADMIN_CLIENT_SECRET | KeyCloak Admin用クライアントシークレット |

### バックエンド（Spring MVC）

| 変数名 | 説明 |
|--------|------|
| SPRING_DATASOURCE_URL | PostgreSQL JDBC URL |
| SPRING_DATASOURCE_USERNAME | DBユーザー名 |
| SPRING_DATASOURCE_PASSWORD | DBパスワード |

### KeyCloak

| 変数名 | 説明 |
|--------|------|
| KEYCLOAK_ADMIN | 管理者ユーザー名 |
| KEYCLOAK_ADMIN_PASSWORD | 管理者パスワード |
| KC_DB | データベース種別 |
| KC_DB_URL | PostgreSQL JDBC URL |
| KC_DB_USERNAME | DBユーザー名 |
| KC_DB_PASSWORD | DBパスワード |
