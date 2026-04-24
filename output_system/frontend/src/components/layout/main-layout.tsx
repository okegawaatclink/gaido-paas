/**
 * メインレイアウトコンポーネント
 *
 * ヘッダー（Header）と メインコンテンツ（children）を組み合わせた
 * 認証済みユーザー向けの共通レイアウト。
 *
 * 使用場所:
 * - /my-access/* （一般社員向け）
 * - /admin/* （管理者向け）
 *
 * 構造:
 * ```
 * <div>
 *   <Header />
 *   <main>
 *     {children}
 *   </main>
 * </div>
 * ```
 */

import { Header } from "@/components/layout/header";

/**
 * MainLayout コンポーネントの Props
 */
interface MainLayoutProps {
  /** ページ固有のコンテンツ */
  children: React.ReactNode;
}

/**
 * メインレイアウトコンポーネント
 *
 * 認証済みユーザー向けの共通レイアウト。
 * ヘッダーとメインコンテンツ領域で構成される。
 *
 * @param children - ページ固有のコンテンツ（各ページのJSX）
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 共通ヘッダー: タイトル・ユーザー名・ログアウトボタンを表示 */}
      <Header />

      {/* メインコンテンツエリア */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
