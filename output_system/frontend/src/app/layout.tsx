/**
 * ルートレイアウト
 *
 * Next.js App Routerのルートレイアウト。
 * 全ページに共通するHTMLの骨格とグローバルスタイルを定義する。
 */
import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
