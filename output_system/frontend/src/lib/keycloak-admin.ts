/**
 * KeyCloak Admin APIクライアント
 *
 * BFFレイヤーからKeyCloakのAdmin APIを呼び出すためのクライアントモジュール。
 * Cloud利用可否変更時に、DBへの更新と並行してKeyCloakのロールを同期する。
 *
 * アーキテクチャ:
 * BFF(Next.js) → DB更新（バックエンド経由）
 *              → KeyCloak Admin API（ロール同期）
 *
 * 認証方式:
 * - Client Credentials Flow（サービスアカウント認証）
 * - 環境変数: KEYCLOAK_ADMIN_URL, KEYCLOAK_ADMIN_CLIENT_ID, KEYCLOAK_ADMIN_CLIENT_SECRET
 *
 * CloudプロバイダーとKeyCloakロールのマッピング:
 * - AWS  → paas-aws-user
 * - GCP  → paas-gcp-user
 * - Azure → paas-azure-user
 *
 * 設計判断:
 * - KeyCloak同期失敗時もDB更新は成功とする（最終的整合性）
 * - エラー時はリトライではなくログ記録（運用で対応）
 * - サービスアカウントのアクセストークンはモジュールレベルでキャッシュし、
 *   有効期限が近づいたら自動更新する
 *
 * 参考:
 * - KeyCloak Admin REST API: https://www.keycloak.org/docs-api/latest/rest-api/index.html
 * - Client Credentials Grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.4
 */

/**
 * CloudプロバイダーとKeyCloakロール名のマッピング
 *
 * DBに保存されるcloudProvider名をKeyCloakのロール名に変換するための対応表。
 * KeyCloakのrealm-export.jsonのroles.realmセクションにこれらのロールが必要。
 */
const CLOUD_PROVIDER_ROLE_MAP: Record<string, string> = {
  AWS: "paas-aws-user",
  GCP: "paas-gcp-user",
  Azure: "paas-azure-user",
};

/**
 * サービスアカウントのアクセストークンキャッシュ
 *
 * 不必要なトークンリクエストを避けるため、取得したトークンをモジュールスコープでキャッシュする。
 * 有効期限の30秒前に再取得する（30秒のバッファ）。
 */
let cachedToken: {
  accessToken: string;
  /** アクセストークンの有効期限（Unixタイムスタンプ、ミリ秒） */
  expiresAt: number;
} | null = null;

/**
 * 環境変数からKeyCloakのAdmin API設定を取得する
 *
 * @returns KeyCloak Admin APIの接続設定
 * @throws 必要な環境変数が設定されていない場合はエラーをスロー
 */
function getKeyCloakAdminConfig(): {
  adminUrl: string;
  clientId: string;
  clientSecret: string;
  realm: string;
} {
  const adminUrl = process.env.KEYCLOAK_ADMIN_URL;
  const clientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;

  if (!adminUrl || !clientId || !clientSecret) {
    throw new Error(
      "Missing KeyCloak Admin API environment variables: KEYCLOAK_ADMIN_URL, KEYCLOAK_ADMIN_CLIENT_ID, KEYCLOAK_ADMIN_CLIENT_SECRET"
    );
  }

  return {
    adminUrl: adminUrl.replace(/\/$/, ""),
    clientId,
    clientSecret,
    realm: "paas",
  };
}

/**
 * サービスアカウント認証でアクセストークンを取得する
 *
 * キャッシュが有効な場合はキャッシュからトークンを返す。
 * キャッシュが無効（未取得または期限切れ）の場合はKeyCloakのトークンエンドポイントから取得する。
 *
 * @returns アクセストークン（文字列）
 * @throws 認証失敗時はエラーをスロー
 */
async function getServiceAccountToken(): Promise<string> {
  const { adminUrl, clientId, clientSecret, realm } = getKeyCloakAdminConfig();

  // キャッシュが有効な場合はキャッシュからトークンを返す
  // 有効期限の30秒前に再取得する（バッファを設けることでトークン切れを防ぐ）
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30 * 1000) {
    return cachedToken.accessToken;
  }

  // Client Credentials Flowでトークンを取得する
  const tokenEndpoint = `${adminUrl}/realms/${realm}/protocol/openid-connect/token`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `KeyCloak Admin token request failed: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const data = await response.json();

  // トークンをキャッシュに保存する
  cachedToken = {
    accessToken: data.access_token,
    // expires_inは秒単位。現在時刻（ms）+ expires_in(ms)でUnixタイムスタンプを計算
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * KeyCloakのユーザーIDをメールアドレスで検索する
 *
 * KeyCloak Admin APIの GET /admin/realms/{realm}/users?email={email} を使用する。
 * DBのemailフィールドとKeyCloakのメールアドレスは一致していることを前提とする。
 *
 * @param email 検索するメールアドレス
 * @param accessToken KeyCloak Admin APIのアクセストークン
 * @param adminUrl KeyCloakのAdmin URL
 * @param realm KeyCloakのレルム名
 * @returns KeyCloakのユーザーID（UUID形式）
 * @throws ユーザーが見つからない場合またはAPI呼び出し失敗時はエラーをスロー
 */
async function findKeyCloakUserId(
  email: string,
  accessToken: string,
  adminUrl: string,
  realm: string
): Promise<string> {
  const searchUrl = `${adminUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`;

  const response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `KeyCloak user search failed for email=${email}: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const users = await response.json();

  if (!Array.isArray(users) || users.length === 0) {
    throw new Error(`KeyCloak user not found for email=${email}`);
  }

  // 完全一致でメールアドレスが一致するユーザーを取得（exactパラメータで絞り込み済み）
  return users[0].id;
}

/**
 * KeyCloakのレルムロール情報を取得する
 *
 * KeyCloak Admin APIの GET /admin/realms/{realm}/roles/{roleName} を使用する。
 *
 * @param roleName ロール名（例: "paas-aws-user"）
 * @param accessToken KeyCloak Admin APIのアクセストークン
 * @param adminUrl KeyCloakのAdmin URL
 * @param realm KeyCloakのレルム名
 * @returns ロール情報（id, nameを含むオブジェクト）
 * @throws ロールが見つからない場合またはAPI呼び出し失敗時はエラーをスロー
 */
async function getRealmRole(
  roleName: string,
  accessToken: string,
  adminUrl: string,
  realm: string
): Promise<{ id: string; name: string }> {
  const roleUrl = `${adminUrl}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`;

  const response = await fetch(roleUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `KeyCloak role lookup failed for role=${roleName}: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  return response.json();
}

/**
 * KeyCloakのユーザーにレルムロールを付与する
 *
 * KeyCloak Admin APIの POST /admin/realms/{realm}/users/{userId}/role-mappings/realm を使用する。
 * 既にロールが付与されている場合でもエラーにならない（べき等）。
 *
 * @param keycloakUserId KeyCloakのユーザーID（UUID形式）
 * @param role 付与するロール情報（id, name）
 * @param accessToken KeyCloak Admin APIのアクセストークン
 * @param adminUrl KeyCloakのAdmin URL
 * @param realm KeyCloakのレルム名
 * @throws API呼び出し失敗時はエラーをスロー
 */
async function assignRealmRole(
  keycloakUserId: string,
  role: { id: string; name: string },
  accessToken: string,
  adminUrl: string,
  realm: string
): Promise<void> {
  const assignUrl = `${adminUrl}/admin/realms/${realm}/users/${keycloakUserId}/role-mappings/realm`;

  const response = await fetch(assignUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ id: role.id, name: role.name }]),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `KeyCloak role assignment failed: userId=${keycloakUserId}, role=${role.name}: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
}

/**
 * KeyCloakのユーザーからレルムロールを剥奪する
 *
 * KeyCloak Admin APIの DELETE /admin/realms/{realm}/users/{userId}/role-mappings/realm を使用する。
 * ロールが付与されていない場合でもエラーにならない（べき等）。
 *
 * @param keycloakUserId KeyCloakのユーザーID（UUID形式）
 * @param role 剥奪するロール情報（id, name）
 * @param accessToken KeyCloak Admin APIのアクセストークン
 * @param adminUrl KeyCloakのAdmin URL
 * @param realm KeyCloakのレルム名
 * @throws API呼び出し失敗時はエラーをスロー
 */
async function removeRealmRole(
  keycloakUserId: string,
  role: { id: string; name: string },
  accessToken: string,
  adminUrl: string,
  realm: string
): Promise<void> {
  const removeUrl = `${adminUrl}/admin/realms/${realm}/users/${keycloakUserId}/role-mappings/realm`;

  const response = await fetch(removeUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ id: role.id, name: role.name }]),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `KeyCloak role removal failed: userId=${keycloakUserId}, role=${role.name}: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
}

/**
 * Cloud利用可否の変更をKeyCloakのロールに同期する
 *
 * DB更新完了後にこの関数を呼び出して、KeyCloakのロールとDBの状態を一致させる。
 *
 * 同期処理:
 * - isEnabled=true の場合: 対応するKeyCloakロールをユーザーに付与
 * - isEnabled=false の場合: 対応するKeyCloakロールをユーザーから剥奪
 *
 * エラーハンドリング:
 * - 同期失敗時はログを記録するが、例外はスローしない
 * - DB更新は既に完了しているため、同期失敗のみで処理を中断しない（最終的整合性）
 *
 * @param userEmail ユーザーのメールアドレス（KeyCloak検索キー）
 * @param cloudAccessUpdates Cloud利用可否の更新情報リスト
 * @returns 同期結果（同期成功の場合はtrue、失敗の場合はfalse）
 */
export async function syncCloudAccessToKeyCloak(
  userEmail: string,
  cloudAccessUpdates: Array<{ cloudProvider: string; isEnabled: boolean }>
): Promise<boolean> {
  let accessToken: string;
  let config: ReturnType<typeof getKeyCloakAdminConfig>;

  try {
    config = getKeyCloakAdminConfig();
  } catch (error) {
    // 環境変数未設定: 開発環境ではKeyCloak同期をスキップ
    console.warn("[KeyCloak Sync] Environment variables not set, skipping sync:", error);
    return false;
  }

  try {
    // サービスアカウントでトークンを取得する
    accessToken = await getServiceAccountToken();
    console.log(`[KeyCloak Sync] Starting sync for user: ${userEmail}`);

    // メールアドレスでKeyCloakのユーザーIDを取得する
    const keycloakUserId = await findKeyCloakUserId(
      userEmail,
      accessToken,
      config.adminUrl,
      config.realm
    );
    console.log(`[KeyCloak Sync] Found KeyCloak user: ${keycloakUserId} for email: ${userEmail}`);

    // 各Cloudプロバイダーのロールを同期する
    for (const update of cloudAccessUpdates) {
      const roleName = CLOUD_PROVIDER_ROLE_MAP[update.cloudProvider];

      if (!roleName) {
        // 対応するロールが見つからないCloudプロバイダーはスキップ
        console.warn(`[KeyCloak Sync] No role mapping found for provider: ${update.cloudProvider}`);
        continue;
      }

      try {
        // ロール情報を取得する（IDが必要なためAPIで取得）
        const role = await getRealmRole(roleName, accessToken, config.adminUrl, config.realm);

        if (update.isEnabled) {
          // Cloud利用可: ロールを付与する
          await assignRealmRole(keycloakUserId, role, accessToken, config.adminUrl, config.realm);
          console.log(`[KeyCloak Sync] Assigned role ${roleName} to user ${userEmail}`);
        } else {
          // Cloud利用不可: ロールを剥奪する
          await removeRealmRole(keycloakUserId, role, accessToken, config.adminUrl, config.realm);
          console.log(`[KeyCloak Sync] Removed role ${roleName} from user ${userEmail}`);
        }
      } catch (roleError) {
        // 個別ロールの同期失敗はログ記録してスキップ（他のロールの同期は継続）
        console.error(
          `[KeyCloak Sync] Failed to sync role ${roleName} for user ${userEmail}:`,
          roleError
        );
      }
    }

    console.log(`[KeyCloak Sync] Sync completed for user: ${userEmail}`);
    return true;
  } catch (error) {
    // 全体的な同期失敗はログ記録（DB更新は既に成功しているため処理は継続）
    console.error(`[KeyCloak Sync] Sync failed for user ${userEmail}:`, error);
    return false;
  }
}
