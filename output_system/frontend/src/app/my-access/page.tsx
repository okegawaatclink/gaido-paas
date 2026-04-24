/**
 * マイアクセス画面（一般社員向け）
 *
 * ログインユーザー自身のクラウドサービスへのアクセス権状況を表示する。
 * screens.mdのワイヤーフレームに準拠:
 * - Header: PaaS管理システム | ユーザー名 | ログアウト（MainLayoutで提供）
 * - タイトル: マイアクセス状況
 * - AWS: 利用可 / 利用不可
 * - GCP: 利用可 / 利用不可
 * - Azure: 利用可 / 利用不可
 *
 * Server Componentとして実装し、バックエンドAPIからデータを取得する（PBI #8で実装予定）。
 */

import { MainLayout } from "@/components/layout/main-layout";

/**
 * マイアクセスページコンポーネント
 *
 * 一般社員が自分のCloud利用状況を確認するページ。
 * ヘッダー付きのMainLayoutを使用する。
 */
export default function MyAccessPage() {
  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">マイアクセス状況</h2>
        <p className="mt-2 text-sm text-gray-600">
          現在のクラウドサービスへのアクセス権を確認できます。
        </p>

        {/*
          Cloud利用可否の表示エリア（PBI #8で実装予定）
          screens.mdワイヤーフレームの該当部分:
          - AWS: 利用可 / 利用不可
          - GCP: 利用可 / 利用不可
          - Azure: 利用可 / 利用不可
        */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">AWS</h3>
            <p className="mt-2 text-sm text-gray-500">
              アクセス状況を読み込み中...
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">GCP</h3>
            <p className="mt-2 text-sm text-gray-500">
              アクセス状況を読み込み中...
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Azure</h3>
            <p className="mt-2 text-sm text-gray-500">
              アクセス状況を読み込み中...
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
