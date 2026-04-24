# HANDOVER

## 技術スタック
- フロントエンド: Next.js 14 (App Router, TypeScript), shadcn/ui + Tailwind CSS
- バックエンド: Spring Boot 3.x, Java 21 LTS, Spring MVC, Spring Data JPA
- DB: PostgreSQL 16 + Flyway (マイグレーション管理)
- IdP: KeyCloak (OIDC)
- BFF: Next.js API Routes + NextAuth.js
- APIドキュメント: springdoc-openapi

## ディレクトリ構成
```
output_system/
├── docker-compose.yml          # 全4サービス統合起動
├── frontend/
│   ├── Dockerfile              # ubuntu:24.04, Node.js 20, マルチステージ
│   ├── package.json
│   ├── .npmrc                  # min-release-age=7 (サプライチェーン対策)
│   ├── next.config.mjs         # standalone出力 (注: .ts不可, .mjsを使用)
│   ├── tailwind.config.ts
│   └── src/app/                # App Router pages
├── backend/
│   ├── Dockerfile              # ubuntu:24.04, Java 21, マルチステージ
│   ├── pom.xml                 # Spring Boot 3.4.x, Flyway, JPA含む
│   └── src/main/
│       ├── java/com/example/paas/
│       │   ├── PaasApplication.java
│       │   ├── model/
│       │   │   ├── User.java           # usersテーブル対応エンティティ
│       │   │   └── CloudAccess.java    # cloud_accessテーブル対応エンティティ
│       │   └── repository/
│       │       ├── UserRepository.java
│       │       └── CloudAccessRepository.java
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               ├── V1__init.sql    # users/cloud_accessテーブル定義
│               └── V2__seed.sql    # 初期シードデータ
└── keycloak/
    └── realm-export.json       # realmテンプレート
```

## ビルド・起動方法
```bash
cd output_system
docker compose build
docker compose up -d
```

## 設計判断
- next.config.mjs採用: Next.js 14はnext.config.tsを未サポート。.mjs形式を使用すること
- マルチステージビルド: フロント/バックともにマルチステージでイメージサイズ削減
- standalone出力: Next.jsのoutput: "standalone"でDocker向けに最適化
- KeyCloak healthcheck: curlがKeyCloakコンテナに未インストール。/dev/tcpで代替
- KeyCloak port 8081: ホスト8080はphpmyadminが使用中。8081:8080でマッピング
- ビルドコンテキスト: ssl-certificates/がルート階層のためdocker-compose.ymlのcontextを`..`に設定
- JPA ddl-auto=validate: Flywayでスキーマ管理するためHibernateのDDL自動生成は無効化、差異検出のみ
- cloud_accessシードはCROSS JOIN+WHERE: user_idを事前に知らずINSERT可能。employee_idで結合してuser_idを解決

## はまりポイント
- KeyCloakにcurlがない: healthcheckで`/bin/sh`の`/dev/tcp`を使ってTCP接続確認
- Port 8080/3001/3002は別プロジェクト(dataagent)が使用中: 環境制約、設定は正しい
- next.config.tsはNext.js 14未対応: `.mjs`にリネームが必要
- PostgreSQLのTIMESTAMP型: application.ymlのJPA設定はLocalDateTime型との対応。TIMESTAMP WITH TIME ZONEではなくTIMESTAMP（タイムゾーンなし）を使用

## 実装済み機能
- PBI #4: docker compose upで全4サービス（frontend/backend/postgres/keycloak）が起動する基盤
- PBI #5: DBスキーマとシードデータ自動投入（Flyway V1/V2, JPA Entity/Repository）
