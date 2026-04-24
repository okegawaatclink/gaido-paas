-- V2: シードデータ投入
-- 初期動作確認用のユーザーデータとクラウドアクセスデータを投入する
-- 管理者1名 + 一般社員3名、各ユーザーにAWS/GCP/Azureのcloud_accessレコードを設定

-- usersテーブルへのシードデータ投入
-- 重複投入を防ぐため、employee_idの一致で既存レコードを確認してからINSERTする
INSERT INTO users (employee_id, name, email, department, position, is_admin)
VALUES
    -- 管理者ユーザー 1名
    -- システム管理者として全機能にアクセス可能
    ('E001', '田中 管理太郎', 'tanaka.admin@example.com', '情報システム部', 'システム管理者', true),

    -- 一般社員ユーザー 3名
    -- 自分のクラウドアクセス状況を確認・申請する一般利用者
    ('E002', '佐藤 花子', 'sato.hanako@example.com', '営業部', '主任', false),
    ('E003', '鈴木 一郎', 'suzuki.ichiro@example.com', '開発部', 'エンジニア', false),
    ('E004', '高橋 美咲', 'takahashi.misaki@example.com', '人事部', '担当', false)
ON CONFLICT (employee_id) DO NOTHING;

-- cloud_accessテーブルへのシードデータ投入
-- 各ユーザーにAWS/GCP/Azureの3件を設定し、一部を有効/無効で混在させる
-- 動作確認しやすいよう、管理者は全て有効、一般社員は一部のみ有効にする
INSERT INTO cloud_access (user_id, cloud_provider, is_enabled)
SELECT u.id, ca.cloud_provider, ca.is_enabled
FROM users u
CROSS JOIN (VALUES
    -- 管理者（E001）: 全クラウドを有効
    ('E001', 'AWS',   true),
    ('E001', 'GCP',   true),
    ('E001', 'Azure', true),
    -- 佐藤さん（E002）: AWSのみ有効
    ('E002', 'AWS',   true),
    ('E002', 'GCP',   false),
    ('E002', 'Azure', false),
    -- 鈴木さん（E003）: GCPとAzureが有効
    ('E003', 'AWS',   false),
    ('E003', 'GCP',   true),
    ('E003', 'Azure', true),
    -- 高橋さん（E004）: 全て無効（申請前の状態）
    ('E004', 'AWS',   false),
    ('E004', 'GCP',   false),
    ('E004', 'Azure', false)
) AS ca(employee_id, cloud_provider, is_enabled)
WHERE u.employee_id = ca.employee_id
ON CONFLICT (user_id, cloud_provider) DO NOTHING;
