/**
 * NextAuth.js セッションプロバイダーコンポーネント
 *
 * NextAuth.jsの `SessionProvider` はクライアントコンポーネントであるため、
 * App RouterのServer Componentであるlayout.tsxで直接使用できない。
 * このラッパーコンポーネントで"use client"ディレクティブを付けて
 * クライアントコンポーネントとして使用できるようにする。
 *
 * 参考: https://next-auth.js.org/getting-started/client#sessionprovider
 */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * SessionProviderコンポーネントのProps型定義
 */
interface SessionProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
  /** SSRで渡す初期セッション（オプション: ハイドレーション高速化） */
  session?: Session | null;
}

/**
 * セッションプロバイダー
 *
 * アプリケーション全体でuseSession()フックが使用できるようにするための
 * クライアントコンポーネントラッパー。
 *
 * @param children - 子コンポーネント
 * @param session - 初期セッション（オプション）
 */
export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
