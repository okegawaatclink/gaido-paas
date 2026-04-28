/**
 * NextAuth.js 設定モジュール
 *
 * KeyCloak OIDCプロバイダーを使用した認証設定を定義する。
 * - Authorization Code Flow（PKCE非必須のconfidentialクライアント）
 * - JWTセッションストラテジー
 * - アクセストークン・リフレッシュトークンをJWTに保持
 * - トークン有効期限切れ時の自動リフレッシュ
 * - セッションタイムアウト: 8時間
 */

import type { NextAuthOptions, Account } from "next-auth";
import type { JWT } from "next-auth/jwt";
// KeycloakProviderはコンテナ内/外のURL差異に対応できないため、
// カスタムOAuthプロバイダーとして定義する

/**
 * KeyCloakのトークンエンドポイントに対してリフレッシュリクエストを送信し、
 * 新しいアクセストークンを取得する。
 *
 * @param refreshToken - 現在のリフレッシュトークン
 * @returns 新しいアクセストークン・リフレッシュトークン・有効期限を含むオブジェクト
 * @throws リフレッシュ失敗時はエラーをスロー
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}> {
  const issuerUrl = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error("Missing KeyCloak environment variables for token refresh");
  }

  // KeyCloakのトークンエンドポイントURL
  const tokenEndpoint = `${issuerUrl}/protocol/openid-connect/token`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Token refresh failed: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    // expires_inは秒単位。現在時刻（ms）+ expires_in(ms)でUnixタイムスタンプを計算
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * NextAuth.js 設定オブジェクト
 *
 * KeyCloakプロバイダーを使用したOIDC認証設定。
 * JWT callbackでアクセストークンとリフレッシュトークンをセッションに格納し、
 * 有効期限切れ時に自動でリフレッシュを行う。
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // KeyCloakプロバイダー設定（カスタムOAuth）
    // Docker環境ではコンテナ間通信（サーバーサイド）とブラウザアクセスでURLが異なる:
    //   サーバーサイド: http://keycloak:8080（コンテナ名で通信）
    //   ブラウザ側: http://localhost:8081（ホストポート経由）
    // wellKnownを使うとディスカバリ結果がauthorizationを上書きしてしまうため、
    // 全エンドポイントを明示的に指定する
    {
      id: "keycloak",
      name: "KeyCloak",
      type: "oauth",
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      idToken: true,
      // authorization: ブラウザがリダイレクトされるURL → KEYCLOAK_ISSUER_EXTERNAL（localhost経由）
      authorization: {
        url: `${process.env.KEYCLOAK_ISSUER_EXTERNAL ?? process.env.KEYCLOAK_ISSUER!}/protocol/openid-connect/auth`,
        params: { scope: "openid email profile" },
      },
      // token/userinfo/jwks: サーバーサイドで呼ぶURL → KEYCLOAK_ISSUER（コンテナ間通信）
      token: `${process.env.KEYCLOAK_ISSUER!}/protocol/openid-connect/token`,
      userinfo: `${process.env.KEYCLOAK_ISSUER!}/protocol/openid-connect/userinfo`,
      // jwks_endpoint: IDトークンの署名検証に使用するJWKS URI（サーバーサイド）
      jwks_endpoint: `${process.env.KEYCLOAK_ISSUER!}/protocol/openid-connect/certs`,
      // issuer: IDトークン検証時のiss値
      // KeyCloakはブラウザがアクセスしたURLをIDトークンのiss claimに使用するため、
      // KEYCLOAK_ISSUER_EXTERNAL（localhost経由）と一致させる
      issuer: process.env.KEYCLOAK_ISSUER_EXTERNAL ?? process.env.KEYCLOAK_ISSUER!,
      checks: ["state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
        };
      },
    },
  ],

  session: {
    // JWTストラテジー: セッションはサーバーサイドDBではなくJWTに格納
    strategy: "jwt",
    // セッションタイムアウト: 8時間（28800秒）
    maxAge: 28800,
  },

  callbacks: {
    /**
     * JWT コールバック
     *
     * JWTトークンが作成・更新されるたびに呼ばれる。
     * アクセストークン・リフレッシュトークン・有効期限・管理者フラグをJWTに格納し、
     * アクセストークンの有効期限切れ時に自動リフレッシュを行う。
     *
     * @param token - 現在のJWT
     * @param account - 認証プロバイダーからのアカウント情報（初回ログイン時のみ）
     * @param user - ユーザー情報（初回ログイン時のみ）
     * @returns 更新されたJWT
     */
    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT;
      account?: Account | null;
      user?: unknown;
    }) {
      // 初回ログイン時: AccountからトークンをJWTに格納
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // expires_atはUNIXタイムスタンプ（秒単位）
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 300 * 1000; // デフォルト5分

        // KeyCloakのアクセストークンからロールを取得してis_adminフラグを設定
        if (account.access_token) {
          try {
            // JWTのペイロード部分（Base64）をデコード
            const payload = JSON.parse(
              Buffer.from(
                account.access_token.split(".")[1],
                "base64"
              ).toString()
            );
            // realm_access.roles に "paas-admin" が含まれるか確認
            const realmRoles: string[] =
              payload?.realm_access?.roles ?? [];
            token.isAdmin = realmRoles.includes("paas-admin");
          } catch {
            token.isAdmin = false;
          }
        }

        return token;
      }

      // 以降のリクエスト: アクセストークンの有効期限を確認し、必要に応じてリフレッシュ
      const expiresAt = token.expiresAt as number | undefined;
      // 有効期限の60秒前にリフレッシュを開始（バッファを設ける）
      const shouldRefresh =
        expiresAt !== undefined && Date.now() > expiresAt - 60 * 1000;

      if (!shouldRefresh) {
        // トークンがまだ有効: そのまま返す
        return token;
      }

      // アクセストークンの有効期限切れ: リフレッシュトークンで更新
      try {
        const refreshToken = token.refreshToken as string;
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshed = await refreshAccessToken(refreshToken);
        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt,
          // リフレッシュ後のアクセストークンからもロールを再取得
          isAdmin: (() => {
            try {
              const payload = JSON.parse(
                Buffer.from(
                  refreshed.accessToken.split(".")[1],
                  "base64"
                ).toString()
              );
              const realmRoles: string[] =
                payload?.realm_access?.roles ?? [];
              return realmRoles.includes("paas-admin");
            } catch {
              return token.isAdmin;
            }
          })(),
          error: undefined,
        };
      } catch (error) {
        // リフレッシュ失敗: エラーをトークンに記録してセッションに伝達
        console.error("Failed to refresh access token:", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },

    /**
     * Session コールバック
     *
     * クライアントからセッション情報が要求されるたびに呼ばれる。
     * JWTから必要な情報をセッションオブジェクトにコピーする。
     *
     * @param session - 現在のセッション
     * @param token - JWTトークン
     * @returns クライアントに返すセッションオブジェクト
     */
    async session({ session, token }: { session: unknown; token: JWT }) {
      const s = session as {
        user?: { email?: string };
        accessToken?: string;
        isAdmin?: boolean;
        error?: string;
        expires: string;
      };

      // セッションにアクセストークンと管理者フラグを追加
      s.accessToken = token.accessToken as string | undefined;
      s.isAdmin = token.isAdmin as boolean | undefined;
      // リフレッシュエラーをセッションに伝達（クライアント側で再ログインを促す）
      s.error = token.error as string | undefined;

      return s;
    },
  },

  pages: {
    // カスタムログインページのパスを指定
    signIn: "/login",
  },
};
