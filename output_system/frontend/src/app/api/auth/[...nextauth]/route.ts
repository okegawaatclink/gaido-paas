/**
 * NextAuth.js ルートハンドラー
 *
 * Next.js App Router形式のRoute Handlerとして実装する。
 * `/api/auth/*` へのすべてのリクエストをNextAuth.jsが処理する。
 * - `/api/auth/signin`: サインイン（KeyCloakへのOIDCリダイレクト）
 * - `/api/auth/callback/keycloak`: KeyCloakからのコールバック受信
 * - `/api/auth/signout`: サインアウト
 * - `/api/auth/session`: セッション情報の取得
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.jsのルートハンドラーをエクスポートする。
 * App RouterではGETとPOSTの両メソッドをエクスポートする必要がある。
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
