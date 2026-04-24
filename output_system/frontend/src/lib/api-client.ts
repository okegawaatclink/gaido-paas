/**
 * BFFプロキシAPIクライアント
 *
 * フロントエンドコンポーネントからBFFプロキシ（/api/proxy/*）を呼び出すための
 * クライアントライブラリ。
 *
 * このクライアントは以下を提供する:
 * - ユーザー一覧取得（getUsers）
 * - ユーザー検索（searchUsers）
 *
 * アーキテクチャ:
 * フロントエンド → BFFプロキシ（/api/proxy/*）→ バックエンド（/api/*）
 *
 * 認証:
 * BFFプロキシがセッションからJWTアクセストークンを自動付与するため、
 * このクライアントから明示的にトークンを渡す必要はない。
 *
 * エラーハンドリング:
 * - 401: 未認証（セッション切れ等）
 * - 403: 権限不足
 * - 5xx: サーバーエラー
 *
 * 参考:
 * - Next.js fetch: https://nextjs.org/docs/app/api-reference/functions/fetch
 */

/**
 * ユーザーレスポンスの型定義
 *
 * api.mdのOpenAPI定義のUserResponseスキーマに対応する。
 */
export type UserResponse = {
  /** ユーザーのサロゲートキー */
  id: number;
  /** 社員ID（例: "E001"） */
  employeeId: string;
  /** 氏名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** 部署名（未設定の場合はnull） */
  department: string | null;
  /** 役職（未設定の場合はnull） */
  position: string | null;
  /** 管理者フラグ */
  isAdmin: boolean;
  /** クラウドアクセス権リスト */
  cloudAccess: CloudAccessResponse[];
};

/**
 * クラウドアクセスレスポンスの型定義
 *
 * api.mdのOpenAPI定義のCloudAccessResponseスキーマに対応する。
 */
export type CloudAccessResponse = {
  /** クラウドアクセスレコードのID */
  id: number;
  /** クラウドプロバイダー名（"AWS" | "GCP" | "Azure"） */
  cloudProvider: "AWS" | "GCP" | "Azure";
  /** アクセス権の有効/無効フラグ */
  isEnabled: boolean;
};

/**
 * APIエラーを表すカスタムエラークラス
 *
 * fetch失敗時やHTTPエラーレスポンス時にスローされる。
 */
export class ApiError extends Error {
  /** HTTPステータスコード */
  public readonly status: number;
  /** エラーレスポンスのボディ（JSON文字列またはテキスト） */
  public readonly body: string;

  /**
   * ApiErrorを生成する
   *
   * @param status HTTPステータスコード
   * @param message エラーメッセージ
   * @param body エラーレスポンスのボディ
   */
  constructor(status: number, message: string, body: string = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * BFFプロキシに対してfetchリクエストを実行する内部ヘルパー関数
 *
 * エラーハンドリングを一元化し、APIエラーを適切な例外としてスローする。
 *
 * @param path BFFプロキシのパス（例: "/api/proxy/users"）
 * @param options fetchのオプション（method, body等）
 * @returns パースされたJSONレスポンス
 * @throws {ApiError} HTTPエラーが発生した場合
 */
async function proxyFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  // レスポンスボディをテキストとして取得（エラーメッセージ用）
  const responseText = await response.text();

  if (!response.ok) {
    // HTTPエラーレスポンス: ApiErrorをスロー
    let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;

    // エラーレスポンスにメッセージが含まれる場合はそれを使用
    try {
      const errorJson = JSON.parse(responseText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // JSON解析失敗: デフォルトのエラーメッセージを使用
    }

    throw new ApiError(response.status, errorMessage, responseText);
  }

  // 204 No Contentの場合はnullを返す（TypeScriptのジェネリクスを無視）
  if (response.status === 204 || !responseText) {
    return null as T;
  }

  // JSONとしてパース
  return JSON.parse(responseText) as T;
}

/**
 * 全ユーザーの一覧を取得する
 *
 * BFFプロキシ経由でバックエンドの GET /api/users を呼び出す。
 * ページネーションなし（全件取得）。
 *
 * @returns 全ユーザーのリスト（CloudAccess付き）
 * @throws {ApiError} API呼び出しに失敗した場合
 *
 * @example
 * const users = await getUsers();
 * console.log(users[0].name); // "田中 太郎"
 */
export async function getUsers(): Promise<UserResponse[]> {
  return proxyFetch<UserResponse[]>("/api/proxy/users");
}

/**
 * ユーザーをキーワードで検索する
 *
 * BFFプロキシ経由でバックエンドの GET /api/users/search?q=xxx を呼び出す。
 * 社員ID・氏名・部署でOR条件の部分一致検索（大文字小文字区別なし）を行う。
 *
 * @param keyword 検索キーワード（空文字の場合は全件を返す）
 * @returns 検索結果のユーザーリスト（CloudAccess付き）
 * @throws {ApiError} API呼び出しに失敗した場合
 *
 * @example
 * const results = await searchUsers("田中");
 * console.log(results[0].name); // "田中 太郎"
 */
export async function searchUsers(keyword: string): Promise<UserResponse[]> {
  // キーワードをURLエンコードしてクエリパラメータに付与
  const encodedKeyword = encodeURIComponent(keyword);
  return proxyFetch<UserResponse[]>(`/api/proxy/users/search?q=${encodedKeyword}`);
}

/**
 * IDでユーザー詳細を取得する
 *
 * BFFプロキシ経由でバックエンドの GET /api/users/{id} を呼び出す。
 * ユーザー情報（社員ID・氏名・メール・部署・役職）とCloudAccess情報を返す。
 *
 * @param id ユーザーのID
 * @returns ユーザー詳細（CloudAccess付き）
 * @throws {ApiError} API呼び出しに失敗した場合（404: ユーザー不在等）
 *
 * @example
 * const user = await getUserById(1);
 * console.log(user.name); // "田中 太郎"
 */
export async function getUserById(id: number): Promise<UserResponse> {
  return proxyFetch<UserResponse>(`/api/proxy/users/${id}`);
}

/**
 * Cloud利用可否更新リクエストの型定義
 *
 * api.mdのOpenAPI定義のCloudAccessUpdateRequestスキーマに対応する。
 */
export type CloudAccessUpdateRequest = {
  /** Cloud利用可否の更新リスト */
  cloudAccess: Array<{
    /** クラウドプロバイダー名（"AWS" | "GCP" | "Azure"） */
    cloudProvider: "AWS" | "GCP" | "Azure";
    /** アクセス権の有効/無効フラグ */
    isEnabled: boolean;
  }>;
};

/**
 * 認証ユーザー自身のユーザー情報を取得する
 *
 * BFFプロキシ経由でバックエンドの GET /api/users/me を呼び出す。
 * JWTトークンに含まれるemailクレームでDBユーザーを特定し、
 * 自分のユーザー情報（社員ID・氏名・メール・部署・役職・CloudAccess）を返す。
 *
 * @returns 認証ユーザー自身のユーザー情報（CloudAccess付き）
 * @throws {ApiError} API呼び出しに失敗した場合（401: 未認証、404: ユーザー不在等）
 *
 * @example
 * const me = await getMe();
 * console.log(me.name); // "佐藤 花子"
 */
export async function getMe(): Promise<UserResponse> {
  return proxyFetch<UserResponse>("/api/proxy/users/me");
}

/**
 * 認証ユーザー自身のCloud利用可否を取得する
 *
 * BFFプロキシ経由でバックエンドの GET /api/users/me/cloud-access を呼び出す。
 * JWTトークンに含まれるemailクレームでDBユーザーを特定し、
 * 自分のAWS/GCP/AzureのCloud利用可否リストを返す。
 *
 * @returns 認証ユーザー自身のCloudAccessリスト（AWS/GCP/Azure各1件）
 * @throws {ApiError} API呼び出しに失敗した場合（401: 未認証、404: ユーザー不在等）
 *
 * @example
 * const cloudAccess = await getMyCloudAccess();
 * const awsAccess = cloudAccess.find(ca => ca.cloudProvider === "AWS");
 * console.log(awsAccess?.isEnabled); // true or false
 */
export async function getMyCloudAccess(): Promise<CloudAccessResponse[]> {
  return proxyFetch<CloudAccessResponse[]>("/api/proxy/users/me/cloud-access");
}

/**
 * Cloud利用可否を更新する
 *
 * BFFプロキシ経由でバックエンドの PUT /api/users/{id}/cloud-access を呼び出す。
 * リクエストで指定されたCloudAccess設定でDBを更新し、更新後のユーザー詳細を返す。
 * BFFレイヤーでKeyCloak Admin APIを使ってロールも同期される。
 *
 * @param id ユーザーのID
 * @param request Cloud利用可否更新リクエスト
 * @returns 更新後のユーザー詳細（CloudAccess付き）
 * @throws {ApiError} API呼び出しに失敗した場合（404: ユーザー不在、400: バリデーションエラー等）
 *
 * @example
 * const updated = await updateCloudAccess(1, {
 *   cloudAccess: [
 *     { cloudProvider: "AWS", isEnabled: true },
 *     { cloudProvider: "GCP", isEnabled: false },
 *     { cloudProvider: "Azure", isEnabled: true },
 *   ]
 * });
 * console.log(updated.cloudAccess[0].isEnabled); // true
 */
export async function updateCloudAccess(
  id: number,
  request: CloudAccessUpdateRequest
): Promise<UserResponse> {
  return proxyFetch<UserResponse>(`/api/proxy/users/${id}/cloud-access`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}
