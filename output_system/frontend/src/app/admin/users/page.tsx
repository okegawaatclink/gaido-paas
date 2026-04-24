/**
 * ユーザー一覧・検索ページ（管理者専用）
 *
 * 管理者がユーザーの一覧を表示し、名前やIDで検索できる画面。
 * screens.mdのワイヤーフレームに準拠:
 * - Header: PaaS管理システム | 管理者名 | ログアウト（MainLayoutで提供）
 * - 検索バー: 社員ID / 氏名 / 部署
 * - テーブル: 社員ID | 氏名 | 部署 | AWS | GCP | Azure
 *
 * アクセス権:
 * - このページは管理者（isAdmin=true）のみアクセス可能
 * - middleware.ts でロールチェックが行われる（一般社員は /my-access にリダイレクト）
 *
 * ユーザー一覧・編集機能は PBI #9 で実装予定。
 */

import { MainLayout } from "@/components/layout/main-layout";

/**
 * ユーザー一覧ページコンポーネント
 *
 * 管理者向けのユーザー管理画面。
 * ヘッダー付きのMainLayoutを使用する。
 * 詳細な実装（テーブル・検索）は PBI #9 で行う。
 */
export default function AdminUsersPage() {
  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>
        <p className="mt-2 text-sm text-gray-600">
          ユーザーの一覧表示とクラウドアクセス権の管理ができます。
        </p>

        {/*
          ユーザー一覧テーブルエリア（PBI #9で実装予定）
          screens.mdワイヤーフレームの該当部分:
          - 検索バー: 社員ID / 氏名 / 部署
          - テーブル: 社員ID | 氏名 | 部署 | AWS | GCP | Azure
        */}
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            ユーザー一覧は次のリリースで表示されます（PBI #9）。
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
