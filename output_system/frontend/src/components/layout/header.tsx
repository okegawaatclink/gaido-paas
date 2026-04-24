/**
 * ヘッダーコンポーネント
 *
 * screens.mdのワイヤーフレームに準拠:
 * - "Header: PaaS管理システム | ユーザー名 | ログアウト"
 *
 * 機能:
 * - サイトタイトル「PaaS管理システム」を表示
 * - ログインユーザー名を表示
 * - ログアウトボタン（NextAuth.js の signOut + KeyCloak セッション破棄）
 *
 * Client Component として実装する理由:
 * - useSession() フックはクライアントサイドのみで利用可能
 * - ログアウトボタンのクリックイベント処理が必要
 *
 * 参考:
 * - https://next-auth.js.org/getting-started/client#usesession
 * - https://next-auth.js.org/getting-started/client#signout
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * ヘッダーコンポーネント
 *
 * ページ上部に共通表示されるナビゲーションバー。
 * セッション情報からユーザー名を取得して表示し、
 * ログアウトボタンでセッションとKeyCloakセッションを破棄する。
 */
export function Header() {
  const { data: session } = useSession();

  /**
   * ログアウト処理
   *
   * NextAuth.js の signOut を呼び出してセッションを破棄する。
   * 同時に KeyCloak のセッションも破棄するため、
   * callbackUrl に KeyCloak のログアウトエンドポイントをラップしたパスを使用する。
   *
   * 完全ログアウトの仕組み:
   * 1. signOut() が NextAuth.js セッション（Cookieのnext-auth.session-token）を削除
   * 2. callbackUrl として /api/auth/keycloak-logout を指定
   * 3. /api/auth/keycloak-logout が KeyCloak のエンドポイント-session を破棄
   * 4. 最終的に /login にリダイレクト
   *
   * シンプルな実装として、signOut の redirectTo に /login を指定し、
   * KeyCloak セッションは post_logout_redirect_uri で /login に戻す。
   */
  const handleLogout = async () => {
    // NextAuth.jsのセッションを破棄してログインページへリダイレクト
    // KeyCloakのセッションもcallbackUrlのAPIルートで破棄する
    await signOut({
      callbackUrl: "/api/auth/keycloak-logout",
    });
  };

  // セッションからユーザー名を取得（name が未設定の場合は email を使用）
  const displayName = session?.user?.name ?? session?.user?.email ?? "ユーザー";

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* サイトタイトル */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">
            PaaS管理システム
          </h1>
        </div>

        {/* ユーザー情報とログアウトボタン */}
        <div className="flex items-center gap-4">
          {/* ログインユーザー名 */}
          <span className="text-sm text-gray-600" data-testid="header-username">
            {displayName}
          </span>

          {/* ログアウトボタン */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
