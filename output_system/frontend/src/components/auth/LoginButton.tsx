/**
 * ログインボタンコンポーネント
 *
 * NextAuth.jsの `signIn()` 関数を呼び出してKeyCloakへのOIDCリダイレクトを開始する。
 * `signIn()` はブラウザサイドの関数であるため、このコンポーネントはClient Componentとする。
 *
 * 使用方法:
 * ```tsx
 * <LoginButton />
 * ```
 */

"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * ログインボタンコンポーネント
 *
 * ボタンクリック時にNextAuth.jsのsignIn('keycloak')を呼び出し、
 * KeyCloakのOIDCログイン画面へリダイレクトする。
 * callbackUrlにより認証後は/my-accessにリダイレクトされる。
 */
export function LoginButton() {
  /**
   * ログインボタンクリックハンドラー
   * NextAuth.jsのsignIn関数でKeyCloakへOIDCリダイレクトを開始する
   */
  const handleLogin = () => {
    // callbackUrl: KeyCloakでの認証後にリダイレクトされるURL
    // パス形式（相対URL）で指定することでNextAuth.jsが適切に処理する
    signIn("keycloak", { callbackUrl: "/my-access" });
  };

  return (
    <Button
      onClick={handleLogin}
      className="w-full"
      size="lg"
    >
      KeyCloakでログイン
    </Button>
  );
}
