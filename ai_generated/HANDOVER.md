# HANDOVER

## 技術スタック
- フロントエンド: Next.js 14 (App Router, TypeScript), shadcn/ui + Tailwind CSS
- バックエンド: Spring Boot 3.x, Java 21 LTS, Spring MVC, Spring Data JPA
- DB: PostgreSQL 16 + Flyway (マイグレーション管理)
- IdP: KeyCloak 26.x (OIDC)
- 認証: NextAuth.js 4.x (JWT strategy, KeyCloakプロバイダー)
- APIドキュメント: springdoc-openapi

## ディレクトリ構成
```
output_system/
├── docker-compose.yml          # 全4サービス統合起動
├── frontend/
│   ├── Dockerfile
│   ├── package.json            # next-auth ^4.24.11 含む
│   ├── .npmrc                  # min-release-age=7 (サプライチェーン対策)
│   ├── next.config.mjs         # standalone出力 (注: .ts不可)
│   └── src/
│       ├── app/
│       │   ├── api/auth/[...nextauth]/route.ts  # NextAuth.jsルートハンドラー
│       │   ├── api/auth/session-info/route.ts   # セッション情報API
│       │   ├── api/auth/keycloak-logout/route.ts # KeyCloak完全ログアウトAPI
│       │   ├── login/page.tsx                   # ログイン画面（ロール別リダイレクト対応）
│       │   ├── my-access/page.tsx               # 一般社員向け画面（MainLayout適用）
│       │   ├── admin/users/page.tsx             # 管理者向けユーザー一覧画面（MainLayout適用）
│       │   └── page.tsx                         # /→ロール別リダイレクト（管理者→/admin/users, 一般→/my-access）
│       ├── components/
│       │   ├── auth/LoginButton.tsx             # signIn('keycloak')ボタン
│       │   ├── layout/header.tsx                # 共通ヘッダー（タイトル・ユーザー名・ログアウトボタン）
│       │   ├── layout/main-layout.tsx           # ヘッダー+メインコンテンツのレイアウト
│       │   ├── providers/SessionProvider.tsx    # NextAuth SessionProviderラッパー
│       │   └── ui/button.tsx                    # shadcn/ui互換ボタン
│       ├── lib/
│       │   ├── auth.ts                          # NextAuth設定（JWTリフレッシュ含む）
│       │   └── utils.ts                         # cn()ユーティリティ
│       ├── middleware.ts                        # ロールベース認証ミドルウェア（/admin/*は管理者のみ）
│       └── types/next-auth.d.ts                 # Session/JWT型拡張
├── backend/
│   ├── pom.xml                 # spring-boot-starter-actuator追加済み
│   └── src/main/java/com/example/paas/
│       ├── config/SecurityConfig.java           # Actuator認証不要, JWT認証設定
│       ├── model/User.java, CloudAccess.java
│       └── repository/UserRepository.java, CloudAccessRepository.java
└── keycloak/
    └── realm-export.json       # paasレルム（ユーザー4名, Admin APIクライアント, セッション8時間）
```

## ビルド・起動方法
```bash
cd output_system
docker compose build
docker compose up -d
# 注: ホストのPort 3001/3002が他プロジェクトに占有されている場合
# docker-compose.override.yml でports: !reset [] して起動
```

## 設計判断
- next.config.mjs採用: Next.js 14はnext.config.tsを未サポート。.mjs形式を使用すること
- KeyCloak port 8081: ホスト8080はphpmyadminが使用中。8081:8080でマッピング
- Spring Security 二重FilterChain: Actuator(/error含む)をBearerTokenAuthenticationFilterの外に出すため@Order(1)のpublicSecurityFilterChainを別定義
- bearerOnly廃止: KeyCloak 26.xでbearerOnlyが廃止。代わりにstandardFlowEnabled:falseで代替
- JWTリフレッシュバッファ60秒: 有効期限の60秒前にリフレッシュを開始。エラー時はRefreshAccessTokenErrorをセッションに伝播
- isAdmin flag: JWTのrealm_access.rolesにpaas-adminが含まれる場合true。リフレッシュ時にも再取得
- withAuth採用（middleware.ts）: NextAuth.jsのwithAuthでミドルウェアをラップ。req.nextauth.tokenでJWTが自動取得できる
- KeyCloak完全ログアウト: signOut後に/api/auth/keycloak-logout経由でKeyCloakのend_session_endpointにリダイレクト
- MainLayout: 認証済みページ共通のヘッダー+コンテンツレイアウト。HeaderはClient Component（useSession使用）

## はまりポイント
- JWT型インポート: `next-auth`からJWTはエクスポートされない。`next-auth/jwt`から取得
- Spring Security Actuator 401: BearerTokenAuthenticationFilterは.permitAll()より前に動作する。Actuator専用のFilterChain(@Order1)を作ること（/errorも含む）
- pom.xmlにActuator依存不足: application.ymlにmanagement設定を書いてもArtifactが未追加だとエンドポイントが404になる
- KeyCloak最初のimport失敗: KC 26.x ではINPUT_EXISTINGで初回起動時にpaasレルムが作成されなかった。Admin APIで手動インポート後はDB永続化されるため問題なし

## 実装済み機能
- PBI #4: docker compose upで全4サービス（frontend/backend/postgres/keycloak）が起動する基盤
- PBI #5: DBスキーマとシードデータ自動投入（Flyway V1/V2, JPA Entity/Repository）
- PBI #6: KeyCloak OIDCでログインできる（NextAuth.js JWT策略、8時間セッション、トークン自動リフレッシュ）
- PBI #7: ロールに応じた画面遷移とログアウト（withAuth middleware、ロール別リダイレクト、共通ヘッダー）
