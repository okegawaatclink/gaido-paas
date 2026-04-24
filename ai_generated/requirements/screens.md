# 画面一覧・遷移図

## 画面一覧

| # | 画面名 | URL | ロール | 説明 |
|---|--------|-----|--------|------|
| 1 | ログイン画面 | /login | 全員 | KeyCloakへのOIDCリダイレクト |
| 2 | マイアクセス画面 | /my-access | 一般社員 | 自分のCloud利用可否状況を閲覧 |
| 3 | ユーザー一覧画面 | /admin/users | 管理者 | ユーザー一覧表示・検索 |
| 4 | ユーザー詳細画面 | /admin/users/[id] | 管理者 | ユーザー詳細・Cloud利用可否の編集 |

## 画面遷移図

```mermaid
stateDiagram-v2
    [*] --> ログイン画面
    ログイン画面 --> KeyCloak認証: "OIDCリダイレクト"
    KeyCloak認証 --> マイアクセス画面: "一般社員"
    KeyCloak認証 --> ユーザー一覧画面: "管理者"
    ユーザー一覧画面 --> ユーザー詳細画面: "ユーザー選択"
    ユーザー詳細画面 --> ユーザー一覧画面: "戻る"
    マイアクセス画面 --> [*]: "ログアウト"
    ユーザー一覧画面 --> [*]: "ログアウト"
```

## 画面ワイヤーフレーム

### ログイン画面

```mermaid
flowchart TB
    subgraph "ログイン画面"
        direction TB
        H["Header: PaaS管理システム"]
        L["KeyCloakでログインボタン"]
    end
```

### マイアクセス画面（一般社員）

```mermaid
flowchart TB
    subgraph "マイアクセス画面"
        direction TB
        H["Header: PaaS管理システム | ユーザー名 | ログアウト"]
        T["タイトル: マイアクセス状況"]
        C1["AWS: 利用可 / 利用不可"]
        C2["GCP: 利用可 / 利用不可"]
        C3["Azure: 利用可 / 利用不可"]
    end
```

### ユーザー一覧画面（管理者）

```mermaid
flowchart TB
    subgraph "ユーザー一覧画面"
        direction TB
        H["Header: PaaS管理システム | 管理者名 | ログアウト"]
        S["検索バー: 社員ID / 氏名 / 部署"]
        T["テーブル: 社員ID | 氏名 | 部署 | AWS | GCP | Azure"]
        R1["row: E001 | 山田太郎 | IT部 | 可 | 可 | 不可"]
        R2["row: E002 | 鈴木花子 | 営業部 | 不可 | 可 | 可"]
    end
```

### ユーザー詳細画面（管理者）

```mermaid
flowchart TB
    subgraph "ユーザー詳細画面"
        direction TB
        H["Header: PaaS管理システム | 管理者名 | ログアウト"]
        B["← ユーザー一覧に戻る"]
        I["ユーザー情報: 社員ID / 氏名 / メール / 部署 / 役職"]
        T["Cloud利用可否"]
        C1["AWS: トグルスイッチ"]
        C2["GCP: トグルスイッチ"]
        C3["Azure: トグルスイッチ"]
        SV["保存ボタン"]
    end
```
