-- V1: 初期スキーマ作成
-- PaaS管理ポータルの基本テーブルを定義する

-- ユーザーテーブル: システム利用者の基本情報
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- KeyCloakのサブジェクト識別子（一意）
    keycloak_id VARCHAR(255) NOT NULL UNIQUE,
    -- メールアドレス（ログインID）
    email VARCHAR(255) NOT NULL UNIQUE,
    -- 表示名
    display_name VARCHAR(255) NOT NULL,
    -- ロール: 'user' または 'admin'
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- cloud_accessテーブル: ユーザーのクラウドサービスへのアクセス権管理
CREATE TABLE IF NOT EXISTS cloud_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- アクセス権を持つユーザー（外部キー）
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- クラウドサービス名（例: 'aws', 'azure', 'gcp'）
    service_name VARCHAR(100) NOT NULL,
    -- アクセス権の有効/無効フラグ
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- 同一ユーザーの同一サービスへの重複登録を防ぐ
    UNIQUE (user_id, service_name)
);

-- インデックス: ユーザー検索の高速化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_cloud_access_user_id ON cloud_access(user_id);
