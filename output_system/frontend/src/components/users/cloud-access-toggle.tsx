/**
 * CloudAccessToggleコンポーネント
 *
 * AWS/GCP/Azureのクラウドアクセス権をトグルスイッチで表示・切り替えるコンポーネント。
 * screens.mdのユーザー詳細画面ワイヤーフレームに準拠する:
 * - Cloud利用可否トグルスイッチ（AWS/GCP/Azure各1つ）
 *
 * 機能:
 * - Cloud種別のラベルを表示
 * - 現在の利用可否状態をトグルスイッチで表示
 * - トグルを切り替えると onToggle コールバックを呼び出す
 * - 保存中（isSaving）の場合はトグルを無効化する
 */

"use client";

import { Switch } from "@/components/ui/switch";
import type { CloudAccessResponse } from "@/lib/api-client";

/**
 * CloudAccessToggleコンポーネントのProps
 */
interface CloudAccessToggleProps {
  /**
   * クラウドアクセス情報
   * cloudProvider名とisEnabled状態を持つ
   */
  cloudAccess: CloudAccessResponse;

  /**
   * トグル切り替え時のコールバック
   * @param provider - Cloud種別（"AWS" | "GCP" | "Azure"）
   * @param enabled - 新しい有効/無効状態
   */
  onToggle: (provider: "AWS" | "GCP" | "Azure", enabled: boolean) => void;

  /**
   * 保存中フラグ
   * trueの場合、トグルを無効化して操作を防ぐ
   */
  isSaving?: boolean;
}

/**
 * CloudプロバイダーごとのUI設定
 *
 * 各クラウドプロバイダーの表示色やアイコン文字を定義する。
 */
const CLOUD_PROVIDER_CONFIG: Record<
  string,
  { label: string; colorClass: string; abbr: string }
> = {
  AWS: {
    label: "AWS",
    // AWSのブランドカラー（オレンジ系）
    colorClass: "text-orange-600",
    abbr: "AWS",
  },
  GCP: {
    label: "GCP",
    // GCPのブランドカラー（青系）
    colorClass: "text-blue-600",
    abbr: "GCP",
  },
  Azure: {
    label: "Azure",
    // Azureのブランドカラー（水色系）
    colorClass: "text-sky-600",
    abbr: "Az",
  },
};

/**
 * CloudAccessToggleコンポーネント
 *
 * 1つのCloudプロバイダーのアクセス権をトグルスイッチで表示する。
 * トグルを切り替えると親コンポーネントに通知する。
 *
 * @param cloudAccess - クラウドアクセス情報（cloudProvider, isEnabled）
 * @param onToggle - トグル切り替え時のコールバック
 * @param isSaving - 保存中フラグ（trueの場合はトグルを無効化）
 */
export function CloudAccessToggle({
  cloudAccess,
  onToggle,
  isSaving = false,
}: CloudAccessToggleProps) {
  const provider = cloudAccess.cloudProvider as "AWS" | "GCP" | "Azure";
  const config = CLOUD_PROVIDER_CONFIG[provider];

  /**
   * トグル切り替え時のハンドラー
   *
   * @param checked - 新しいチェック状態
   */
  const handleCheckedChange = (checked: boolean) => {
    onToggle(provider, checked);
  };

  return (
    <div
      className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"
      data-testid={`cloud-access-toggle-${provider.toLowerCase()}`}
    >
      {/* Cloud種別ラベルエリア */}
      <div className="flex items-center gap-3">
        {/* Cloud種別の略称バッジ */}
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-current text-xs font-bold ${config.colorClass}`}
          aria-hidden="true"
        >
          {config.abbr}
        </div>

        {/* Cloud種別のラベルと現在の状態 */}
        <div>
          <p className={`text-sm font-semibold ${config.colorClass}`}>
            {config.label}
          </p>
          <p className="text-xs text-gray-500">
            {cloudAccess.isEnabled ? "利用可" : "利用不可"}
          </p>
        </div>
      </div>

      {/* トグルスイッチ */}
      <Switch
        checked={cloudAccess.isEnabled}
        onCheckedChange={handleCheckedChange}
        disabled={isSaving}
        aria-label={`${config.label}の利用可否を切り替える`}
        data-testid={`switch-${provider.toLowerCase()}`}
      />
    </div>
  );
}
