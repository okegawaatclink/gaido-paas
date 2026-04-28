/**
 * KeyCloak 完全ログアウトエンドポイント
 *
 * NextAuth.js の signOut 後に呼ばれるコールバックURL として使用する。
 * NextAuth.js セッション（Cookie）の削除後、さらに KeyCloak のセッションも破棄する。
 *
 * ログアウトフロー:
 * 1. クライアントが signOut({ callbackUrl: "/api/auth/keycloak-logout" }) を呼び出す
 * 2. NextAuth.js が next-auth.session-token Cookie を削除して /api/auth/keycloak-logout にリダイレクト
 * 3. このエンドポイントが KeyCloak の end_session_endpoint に対してリダイレクトする
 * 4. KeyCloak がセッションを破棄して post_logout_redirect_uri（/login）にリダイレクト
 *
 * 参考:
 * - https://openid.net/specs/openid-connect-rpinitiated-1_0.html（RP-Initiated Logout）
 * - https://www.keycloak.org/docs/latest/securing_apps/#logout
 *
 * GET /api/auth/keycloak-logout
 */

import { NextResponse } from "next/server";

/**
 * KeyCloak ログアウトハンドラー
 *
 * KeyCloak の end_session_endpoint にリダイレクトして
 * KeyCloak 側のセッションを完全に破棄する。
 *
 * @returns KeyCloak ログアウトエンドポイントへのリダイレクトレスポンス
 */
export async function GET(request: Request) {
  const keycloakIssuer = process.env.KEYCLOAK_ISSUER;

  if (!keycloakIssuer) {
    // 環境変数が未設定の場合はログインページに戻す
    console.error("KEYCLOAK_ISSUER environment variable is not set");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // KeyCloak の end_session_endpoint URL を構築
  // OIDC仕様: {issuer}/protocol/openid-connect/logout
  const keycloakLogoutUrl = new URL(
    `${keycloakIssuer}/protocol/openid-connect/logout`
  );

  // ログアウト後に /login にリダイレクトする設定
  // post_logout_redirect_uri: ログアウト後のリダイレクト先
  // KEYCLOAK_ISSUER 例: http://keycloak:8080/realms/paas
  // フロントエンドのURLは環境変数 NEXTAUTH_URL から取得
  const nextauthUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3003";
  keycloakLogoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    `${nextauthUrl}/login`
  );

  // KeyCloak のログアウトエンドポイントにリダイレクト
  return NextResponse.redirect(keycloakLogoutUrl.toString());
}
