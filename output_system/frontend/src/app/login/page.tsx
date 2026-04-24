/**
 * ログインページ
 *
 * PaaS管理システムのログイン画面。
 * screens.mdのワイヤーフレームに準拠:
 * - Header: PaaS管理システム
 * - KeyCloakでログインボタン
 *
 * Server Componentとして実装し、ログインボタンのみClient Component（LoginButton）を使用する。
 * 認証済みユーザーがこのページにアクセスした場合は /my-access にリダイレクトする。
 */

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginButton } from "@/components/auth/LoginButton";

/**
 * ログインページコンポーネント
 *
 * 認証済みユーザーは /my-access にリダイレクト。
 * 未認証ユーザーにはログイン画面を表示する。
 */
export default async function LoginPage() {
  // 認証済みの場合はリダイレクト
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/my-access");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        {/* ヘッダー: screens.mdワイヤーフレームの "Header: PaaS管理システム" */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            PaaS管理システム
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            クラウド利用管理ポータルへようこそ
          </p>
        </div>

        {/* ログインセクション */}
        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-gray-500">
            社内アカウントでサインインしてください
          </p>
          {/* ログインボタン: Client ComponentでsignIn('keycloak')を呼び出す */}
          <LoginButton />
        </div>

        {/* 補足情報 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            KeyCloakのアカウントをお持ちでない場合は
            <br />
            システム管理者にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}
