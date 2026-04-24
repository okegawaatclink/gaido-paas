-- V1: 初期スキーマ作成
-- PaaS管理ポータルの基本テーブルを定義する
-- db.mdのテーブル定義に準拠（BIGSERIALサロゲートキー使用）

-- ユーザーテーブル: システム利用者（社員）の基本情報
-- KeyCloakで認証された社員をDBで管理するためのテーブル
CREATE TABLE IF NOT EXISTS users (
    -- サロゲートキー（自動採番）
    id BIGSERIAL PRIMARY KEY,
    -- 社員ID（一意。例: E001, E002）
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    -- 氏名
    name VARCHAR(100) NOT NULL,
    -- メールアドレス（KeyCloakと対応）
    email VARCHAR(255) NOT NULL,
    -- 部署名
    department VARCHAR(100),
    -- 役職
    position VARCHAR(100),
    -- 管理者フラグ（trueの場合、管理者権限を持つ）
    is_admin BOOLEAN NOT NULL DEFAULT false,
    -- レコード作成日時
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- レコード最終更新日時
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- cloud_accessテーブル: ユーザーのクラウドサービスへのアクセス権管理
-- AWSs・GCP・Azureのアクセス許可状況を管理する
CREATE TABLE IF NOT EXISTS cloud_access (
    -- サロゲートキー（自動採番）
    id BIGSERIAL PRIMARY KEY,
    -- アクセス権を持つユーザーのID（外部キー）
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- クラウドプロバイダー名（AWS/GCP/Azure）
    cloud_provider VARCHAR(20) NOT NULL,
    -- アクセス権の有効/無効フラグ（trueの場合、利用可能）
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    -- レコード作成日時
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- レコード最終更新日時
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- 同一ユーザーの同一クラウドプロバイダーへの重複登録を防ぐ複合ユニーク制約
    CONSTRAINT uq_cloud_access_user_provider UNIQUE (user_id, cloud_provider)
);

-- インデックス: 検索性能の向上
-- 社員IDによる検索（ログイン時に使用）
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
-- ユーザーIDによるcloud_access検索（一覧表示に使用）
CREATE INDEX IF NOT EXISTS idx_cloud_access_user_id ON cloud_access(user_id);
