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
 * Server Componentとして実装し、バックエンドAPIからデータを取得する。
 *
 * データ取得フロー:
 * 1. このServer ComponentがBFFプロキシの /api/proxy/users/me/cloud-access を呼び出す
 * 2. BFFプロキシがセッションのJWTトークンを付与してバックエンドに転送
 * 3. バックエンドがJWTの "email" クレームでDBユーザーを特定しCloudAccessを返す
 *
 * 参考:
 * - api.md: GET /api/users/me/cloud-access エンドポイント定義
 * - screens.md: マイアクセス画面ワイヤーフレーム
 * - Next.js Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
 */

import { MainLayout } from "@/components/layout/main-layout";
import { AccessStatusCard } from "@/components/my-access/access-status-card";
import { getMyCloudAccess, type CloudAccessResponse } from "@/lib/api-client";

/**
 * サポートするクラウドプロバイダーの定義
 *
 * DBにデータがない場合のフォールバック表示にも使用する。
 * 表示順はAPI定義に従いAWS→GCP→Azureの順とする。
 */
const SUPPORTED_CLOUD_PROVIDERS: Array<"AWS" | "GCP" | "Azure"> = ["AWS", "GCP", "Azure"];

/**
 * マイアクセスページコンポーネント
 *
 * 一般社員が自分のCloud利用状況を確認するページ。
 * Server Componentとして実装し、バックエンドAPIから直接データを取得する。
 * ヘッダー付きのMainLayoutを使用する。
 *
 * エラーハンドリング:
 * - APIエラー（ネットワーク障害、401、500等）の場合はエラーメッセージを表示する
 * - DBにCloudAccessデータがない場合は「利用不可」として表示する
 */
export default async function MyAccessPage() {
  // Cloud利用可否データを取得する
  // エラーが発生した場合はキャッチしてエラー表示に切り替える
  let cloudAccessList: CloudAccessResponse[] = [];
  let fetchError: string | null = null;

  try {
    // BFFプロキシ経由でバックエンドの GET /api/users/me/cloud-access を呼び出す
    // Server ComponentからはBFFプロキシ（/api/proxy/...）へのfetchを使用する
    cloudAccessList = await getMyCloudAccess();
  } catch (error) {
    // APIエラーが発生した場合はエラーメッセージを設定する
    // ユーザーには具体的なエラー詳細ではなく、分かりやすいメッセージを表示する
    console.error("[MyAccessPage] Cloud利用可否の取得に失敗しました:", error);
    fetchError = "クラウドサービスのアクセス状況を取得できませんでした。時間をおいてから再度お試しください。";
  }

  /**
   * クラウドプロバイダーに対応するCloudAccessResponseを返すヘルパー関数
   *
   * DBにデータが存在しないクラウドプロバイダーの場合は「利用不可」として扱う。
   *
   * @param provider クラウドプロバイダー名
   * @returns CloudAccessResponse または利用不可のデフォルト値
   */
  function getCloudAccessForProvider(
    provider: "AWS" | "GCP" | "Azure"
  ): { cloudProvider: "AWS" | "GCP" | "Azure"; isEnabled: boolean } {
    // APIから取得したリストから対応するプロバイダーのデータを検索する
    const found = cloudAccessList.find((ca) => ca.cloudProvider === provider);
    // 見つからない場合はデフォルト値（利用不可）を返す
    return found ?? { cloudProvider: provider, isEnabled: false };
  }

  return (
    <MainLayout>
      <div>
        {/* ページタイトル */}
        <h2 className="text-2xl font-bold text-gray-900">マイアクセス状況</h2>
        <p className="mt-2 text-sm text-gray-600">
          現在のクラウドサービスへのアクセス権を確認できます。
        </p>

        {/* エラーメッセージ表示エリア */}
        {fetchError && (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold" aria-hidden="true">⚠</span>
              <p className="text-sm text-red-700">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Cloud利用可否カード表示エリア */}
        {/* screens.mdワイヤーフレームに従い、3列グリッドでカードを並べる */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SUPPORTED_CLOUD_PROVIDERS.map((provider) => {
            const accessData = getCloudAccessForProvider(provider);
            return (
              <AccessStatusCard
                key={provider}
                cloudProvider={accessData.cloudProvider}
                isEnabled={accessData.isEnabled}
              />
            );
          })}
        </div>

        {/* 最終更新時刻の表示（ページ読み込み時刻） */}
        <p className="mt-6 text-xs text-gray-400">
          ※ このページの情報はページ読み込み時点のものです。
          最新の状態を確認する場合はページを再読み込みしてください。
        </p>
      </div>
    </MainLayout>
  );
}
