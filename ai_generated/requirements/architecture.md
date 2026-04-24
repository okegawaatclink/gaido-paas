# システム構成図

## 全体アーキテクチャ

```mermaid
flowchart TB
    subgraph "Client"
        Browser["Browser (Chrome)"]
    end

    subgraph "Frontend / BFF Layer"
        NextJS["Next.js App Router"]
        BFF["BFF (API Routes)"]
    end

    subgraph "Backend Layer"
        Spring["Spring MVC (Java 21)"]
        SpringDoc["springdoc-openapi"]
    end

    subgraph "Data Layer"
        PostgreSQL["PostgreSQL"]
    end

    subgraph "Identity Provider"
        KeyCloak["KeyCloak (OIDC)"]
        KCAdmin["KeyCloak Admin API"]
    end

    Browser -->|"HTTPS"| NextJS
    NextJS -->|"Server Components / CSR"| BFF
    BFF -->|"OIDC Auth Flow"| KeyCloak
    BFF -->|"Token Verify / Refresh"| KeyCloak
    BFF -->|"REST API Proxy"| Spring
    BFF -->|"Role Sync"| KCAdmin
    Spring -->|"JDBC"| PostgreSQL
    Spring --- SpringDoc
```

## シーケンス図: ログインフロー

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js BFF
    participant KC as KeyCloak
    participant S as Spring MVC
    participant DB as PostgreSQL

    B->>N: アクセス（未認証）
    N->>KC: OIDCリダイレクト
    KC->>B: ログイン画面表示
    B->>KC: 認証情報送信
    KC->>N: Authorization Code
    N->>KC: トークンリクエスト
    KC->>N: ID Token + Access Token
    N->>N: セッション確立
    N->>S: ユーザー情報取得（REST API）
    S->>DB: SELECT user
    DB->>S: ユーザーデータ
    S->>N: ユーザー情報レスポンス
    N->>B: ダッシュボード表示
```

## シーケンス図: アクセス権変更フロー

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js BFF
    participant S as Spring MVC
    participant DB as PostgreSQL
    participant KC as KeyCloak Admin API

    B->>N: アクセス権変更リクエスト
    N->>N: トークン検証（管理者チェック）
    N->>S: ユーザー情報更新（REST API）
    S->>DB: UPDATE cloud_access
    DB->>S: 更新完了
    S->>N: 更新完了レスポンス
    N->>KC: ロール/グループ同期
    KC->>N: 同期完了
    N->>B: 更新完了表示
```

## 技術選定根拠

| カテゴリ | 選定技術 | 選定理由 | 却下した代替案 |
|---------|---------|---------|---------------|
| フロントエンド/BFF | Next.js 14+ (App Router) | ユーザー指定。Server Components対応、BFF統合が容易 | Pages Router（レガシー） |
| UIライブラリ | shadcn/ui + Tailwind CSS | 軽量、カスタマイズ性高、App Router親和性 | MUI（重量級）、Ant Design（バンドルサイズ大） |
| バックエンド | Spring MVC (Java 21 LTS) | ユーザー指定。Virtual Threads、最新LTS | Java 17（旧世代） |
| DB | PostgreSQL | ユーザー指定。OSS、実績豊富 | MySQL |
| IdP連携 | KeyCloak OIDC | ユーザー指定。モダン、Next.js親和性高 | SAML 2.0（実装複雑） |
| BFF-Backend通信 | REST API | シンプル、標準的、学習コスト低 | gRPC（過剰） |
| APIドキュメント | springdoc-openapi | Spring Boot統合、自動生成 | 手動管理（保守コスト高） |
