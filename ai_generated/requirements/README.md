# 要件ファイル

## ドキュメント一覧

| ドキュメント | 内容 |
|---|---|
| [architecture.md](architecture.md) | システム構成図 |
| [file_structure.md](file_structure.md) | ディレクトリ構成 |
| [db.md](db.md) | ER図 |
| [screens.md](screens.md) | 画面一覧・遷移図 |
| [api.md](api.md) | WebAPI一覧 |
| [devops.md](devops.md) | デプロイ構造・コマンド |

## 確定要件

### プロジェクト概要

社内プライベートクラウド（AWS/GCP/Azure）へのアクセス制御を管理するPaaS管理アプリケーション。
KeyCloakをIdPとし、OIDCによる認証・認可を実装する。

### 機能要件

#### ユーザーロール

| ロール | 説明 | 判定方法 |
|--------|------|----------|
| 管理者 | ユーザー一覧・検索、Cloud利用可否の付与・剥奪 | DBのis_adminフラグで判定 |
| 一般社員 | 自分のCloud利用可否状況を閲覧 | デフォルトロール |

#### 管理者機能

- ユーザー一覧表示（全件表示、ページネーションなし）
- ユーザー検索（社員ID、氏名、部署等で検索）
- 各Cloudへのアクセス権付与・剥奪（AWS/GCP/Azure単位）
- アクセス権変更時にKeyCloakのロール/グループを自動同期

#### 一般社員機能

- 自分のCloud利用可否状況の閲覧（AWS/GCP/Azure各々の利用可否）

#### スコープ外

- 利用申請フロー（承認ワークフロー）
- 各Cloudとの実際の連携（他システムが担当）
- DBデータ連携（別プロセスで投入済みの前提）
- 操作ログ・監査ログ
- ダッシュボード・利用状況サマリー
- エラーページ（404/500等）のカスタマイズ

### 非機能要件

| 項目 | 要件 |
|------|------|
| 想定ユーザー数 | 1000人以上（大規模） |
| レスポンス時間 | 画面表示3秒以内 |
| セッションタイムアウト | 8時間 |
| 対応ブラウザ | Chrome |
| 表示言語 | 日本語のみ |
| 配布形態 | 社内利用のみ |
| ITリテラシー | 高い（専門用語使用可、効率的なUI） |

### 技術選定

| カテゴリ | 選定技術 | 選定理由 |
|---------|---------|---------|
| フロントエンド/BFF | Next.js（App Router） | ユーザー指定。App RouterはArchitectが最新・Server Components対応として選定 |
| UIライブラリ | shadcn/ui + Tailwind CSS | Architectが軽量・カスタマイズ性・App Router親和性を考慮して選定 |
| バックエンド | Spring MVC (Java 21 LTS) | ユーザー指定。Java 21はVirtual Threads等の新機能対応 |
| データベース | PostgreSQL | ユーザー指定 |
| IdP | KeyCloak（OIDC） | ユーザー指定。OIDCはモダンでNext.jsとの親和性が高い |
| API通信 | REST API | BFF→バックエンド間の通信。シンプルで標準的 |
| APIドキュメント | springdoc-openapi | Spring Bootと統合した自動生成 |

### アーキテクチャ

#### レイヤー構成

| レイヤー | 技術 | 役割 |
|---------|------|------|
| フロントエンド | Next.js App Router | 画面表示（SSR/CSR） |
| BFF | Next.js API Routes | 認証（OIDC）、トークン検証・リフレッシュ、APIプロキシ、KeyCloak Admin API連携 |
| バックエンド | Spring MVC | ユーザー情報CRUD API |
| データベース | PostgreSQL | ユーザーデータ永続化 |
| IdP | KeyCloak | 認証・認可基盤（OIDC） |

#### BFFの役割

1. **認証**: KeyCloakとのOIDCフロー（ログイン/ログアウト）処理
2. **トークン管理**: JWTトークンの検証・リフレッシュ
3. **APIプロキシ**: フロントエンドからのリクエストをSpring MVCバックエンドに中継
4. **KeyCloak同期**: アクセス権変更時にKeyCloak Admin APIでロール/グループを同期

### 管理対象Cloud

| Cloud | 管理内容 |
|-------|---------|
| AWS | 利用可否（有効/無効） |
| GCP | 利用可否（有効/無効） |
| Azure | 利用可否（有効/無効） |

## 開発プロセス設定

- コードレビュー: なし
- 画面設計: AIにお任せ

## 専門家分析

### PO分析

- **MVP範囲**: 管理者によるユーザー検索・Cloud利用可否管理 + 一般社員の自身の利用状況閲覧
- **スコープ制御**: 利用申請フロー、Cloud連携、監査ログ等を明確にスコープ外として定義
- **YAGNI適用**: ダッシュボード、ページネーション、多言語対応等を排除し、最小限のMVPに集中

### Architect分析

- **3層アーキテクチャ**: Next.js(BFF) → Spring MVC → PostgreSQL + KeyCloak
- **技術選定根拠**: ユーザー指定技術を尊重しつつ、AIが最適なバージョン・ライブラリを選定
- **KeyCloak同期**: BFFレイヤーでKeyCloakAdmin APIを呼び出し、DBとKeyCloakの一貫性を確保

### QA分析

- **テスト戦略**: Chrome単一ブラウザでのE2Eテスト + Spring MVCのユニットテスト
- **品質基準**: レスポンス3秒以内、認証フローの正常動作
- **当たり前品質**: 認証・認可（エッジケース網羅必須）

### Security分析

- **認証**: KeyCloak OIDC（Authorization Code Flow）
- **セッション管理**: 8時間タイムアウト、JWTトークンベース
- **権限管理**: DBフラグベース（is_admin）+ KeyCloakロール同期
- **社内利用限定**: 外部公開なし、社内ネットワーク内での運用
