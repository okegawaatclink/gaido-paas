/**
 * ルートレイアウト
 *
 * Next.js App Routerのルートレイアウト。
 * 全ページに共通するHTMLの骨格とグローバルスタイルを定義する。
 * SessionProviderでラップすることで全クライアントコンポーネントで
 * useSession()フックが使用できるようになる。
 */
import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "PaaS管理ポータル",
  description: "クラウド利用管理システム",
};

/**
 * ルートレイアウトコンポーネント
 * @param children - 子コンポーネント（各ページの内容）
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {/* SessionProviderでラップ: useSession()をアプリ全体で使用可能にする */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
