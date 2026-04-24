# ディレクトリ構成

## フロントエンド / BFF（Next.js）

```
output_system/
├── docker-compose.yml          # 全サービス統合起動
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .npmrc                  # min-release-age=7
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # ルートレイアウト
│   │   │   ├── page.tsx                # トップページ（リダイレクト）
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # ログインページ
│   │   │   ├── my-access/
│   │   │   │   └── page.tsx            # 自分のCloud利用状況閲覧
│   │   │   └── admin/
│   │   │       └── users/
│   │   │           ├── page.tsx        # ユーザー一覧・検索
│   │   │           └── [id]/
│   │   │               └── page.tsx    # ユーザー詳細・アクセス権編集
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/
│   │   │   │   │   └── route.ts        # NextAuth.js OIDC handler
│   │   │   │   └── session/
│   │   │   │       └── route.ts        # セッション情報取得
│   │   │   └── proxy/
│   │   │       └── [...path]/
│   │   │           └── route.ts        # Spring MVCへのAPIプロキシ
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn/uiコンポーネント
│   │   │   ├── layout/
│   │   │   │   ├── header.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── main-layout.tsx
│   │   │   ├── users/
│   │   │   │   ├── user-table.tsx
│   │   │   │   ├── user-search.tsx
│   │   │   │   └── cloud-access-toggle.tsx
│   │   │   └── my-access/
│   │   │       └── access-status-card.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts                 # NextAuth.js設定
│   │   │   ├── keycloak-admin.ts       # KeyCloak Admin APIクライアント
│   │   │   ├── api-client.ts           # バックエンドAPIクライアント
│   │   │   └── utils.ts
│   │   └── types/
│   │       ├── user.ts
│   │       └── cloud-access.ts
│   └── public/
│       └── favicon.ico
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/paas/
│   │   │   │   ├── PaasApplication.java
│   │   │   │   ├── controller/
│   │   │   │   │   └── UserController.java
│   │   │   │   ├── service/
│   │   │   │   │   └── UserService.java
│   │   │   │   ├── repository/
│   │   │   │   │   └── UserRepository.java
│   │   │   │   ├── model/
│   │   │   │   │   ├── User.java
│   │   │   │   │   └── CloudAccess.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── UserResponse.java
│   │   │   │   │   ├── UserSearchRequest.java
│   │   │   │   │   └── CloudAccessUpdateRequest.java
│   │   │   │   └── config/
│   │   │   │       ├── WebConfig.java
│   │   │   │       └── OpenApiConfig.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   │           └── V1__init.sql
│   │   └── test/
│   │       └── java/com/example/paas/
│   │           ├── controller/
│   │           │   └── UserControllerTest.java
│   │           └── service/
│   │               └── UserServiceTest.java
│   └── mvnw
└── keycloak/
    └── realm-export.json           # KeyCloakレルム設定
```
