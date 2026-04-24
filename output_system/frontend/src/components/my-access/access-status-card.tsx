/**
 * CloudアクセスステータスカードコンポーネントのProps定義
 */
export type AccessStatusCardProps = {
  /**
   * クラウドプロバイダー名
   * 表示ラベルとして使用する（例: "AWS", "GCP", "Azure"）
   */
  cloudProvider: "AWS" | "GCP" | "Azure";

  /**
   * アクセス権の有効/無効フラグ
   * true: 利用可（緑表示）、false: 利用不可（グレー表示）
   */
  isEnabled: boolean;
};

/**
 * CloudプロバイダーのアイコンURLを返すヘルパー関数
 *
 * 各クラウドプロバイダーのアイコン絵文字を返す。
 * 将来的にSVGアイコンに差し替え可能。
 *
 * @param cloudProvider クラウドプロバイダー名
 * @returns 絵文字アイコン文字列
 */
function getCloudProviderIcon(cloudProvider: "AWS" | "GCP" | "Azure"): string {
  switch (cloudProvider) {
    case "AWS":
      // Amazon Web Servicesのアイコン（オレンジ系）
      return "☁️";
    case "GCP":
      // Google Cloud Platformのアイコン（マルチカラー）
      return "🌐";
    case "Azure":
      // Microsoft Azureのアイコン（青系）
      return "🔷";
    default:
      return "☁️";
  }
}

/**
 * Cloud利用可否を表示するカードコンポーネント
 *
 * 一般社員向けのマイアクセス画面でCloud利用可否を1枚のカードとして表示する。
 * screens.mdのワイヤーフレームに準拠し、以下の情報を表示する:
 * - クラウドプロバイダー名（AWS / GCP / Azure）
 * - 利用可否状態（利用可 / 利用不可）
 * - 視覚的な色分け（利用可: 緑系、利用不可: グレー系）
 *
 * shadcn/ui Cardコンポーネントを使用して実装する。
 * Tailwind CSSで利用可/不可の色分けを実装する。
 *
 * @param props AccessStatusCardProps
 * @returns カードコンポーネント
 *
 * @example
 * // 利用可の場合（緑の表示）
 * <AccessStatusCard cloudProvider="AWS" isEnabled={true} />
 *
 * @example
 * // 利用不可の場合（グレーの表示）
 * <AccessStatusCard cloudProvider="GCP" isEnabled={false} />
 */
export function AccessStatusCard({ cloudProvider, isEnabled }: AccessStatusCardProps) {
  // 利用可/不可に応じてTailwindクラスを動的に切り替える
  // 利用可: 緑系の背景・テキスト・ボーダー
  // 利用不可: グレー系の背景・テキスト・ボーダー
  const cardBorderClass = isEnabled
    ? "border-green-200"
    : "border-gray-200";

  const statusBadgeClass = isEnabled
    ? "bg-green-100 text-green-800 border border-green-200"
    : "bg-gray-100 text-gray-600 border border-gray-200";

  const statusIconClass = isEnabled
    ? "text-green-500"
    : "text-gray-400";

  const statusLabel = isEnabled ? "利用可" : "利用不可";
  const statusIcon = isEnabled ? "✓" : "✕";
  const cloudIcon = getCloudProviderIcon(cloudProvider);

  return (
    <div
      className={`rounded-lg border bg-white p-6 shadow-sm transition-all ${cardBorderClass}`}
      role="article"
      aria-label={`${cloudProvider}の利用状況: ${statusLabel}`}
    >
      {/* カードヘッダー: クラウドアイコンとプロバイダー名 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl" aria-hidden="true">
          {cloudIcon}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">
          {cloudProvider}
        </h3>
      </div>

      {/* 利用可否状態バッジ */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusBadgeClass}`}
          aria-live="polite"
        >
          {/* 利用可/不可アイコン */}
          <span className={`font-bold text-base ${statusIconClass}`} aria-hidden="true">
            {statusIcon}
          </span>
          {statusLabel}
        </span>
      </div>

      {/* 利用可の場合にのみ表示する補足メッセージ */}
      {isEnabled && (
        <p className="mt-3 text-xs text-green-600">
          このクラウドサービスにアクセスできます
        </p>
      )}

      {/* 利用不可の場合に表示する補足メッセージ */}
      {!isEnabled && (
        <p className="mt-3 text-xs text-gray-500">
          管理者にアクセス権の付与を申請してください
        </p>
      )}
    </div>
  );
}
