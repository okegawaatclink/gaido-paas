/**
 * NextAuth.js 型定義拡張
 *
 * NextAuth.jsのデフォルト型定義を拡張して、
 * アプリケーション固有のフィールド（accessToken, isAdmin等）を追加する。
 *
 * 参考: https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  /**
   * Session型の拡張
   *
   * クライアント側で `useSession()` や `getServerSession()` を呼んだ際に
   * 返されるセッションオブジェクトの型定義。
   */
  interface Session extends DefaultSession {
    /** KeyCloakから取得したアクセストークン（BFF→バックエンドAPI呼び出し時に使用） */
    accessToken?: string;
    /** 管理者フラグ（KeyCloakのrealm_access.rolesに"paas-admin"が含まれる場合true） */
    isAdmin?: boolean;
    /** アクセストークンリフレッシュエラー（"RefreshAccessTokenError"等） */
    error?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT型の拡張
   *
   * NextAuth.jsがサーバーサイドでJWTトークンを処理する際の内部型定義。
   * jwt callbackで設定したカスタムフィールドをここで宣言する。
   */
  interface JWT extends DefaultJWT {
    /** KeyCloakから取得したアクセストークン */
    accessToken?: string;
    /** KeyCloakのリフレッシュトークン */
    refreshToken?: string;
    /** アクセストークンの有効期限（ミリ秒UNIXタイムスタンプ） */
    expiresAt?: number;
    /** 管理者フラグ */
    isAdmin?: boolean;
    /** トークンリフレッシュエラー */
    error?: string;
  }
}
