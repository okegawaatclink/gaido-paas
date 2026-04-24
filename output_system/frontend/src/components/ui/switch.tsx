/**
 * Switchコンポーネント
 *
 * shadcn/ui互換のトグルスイッチコンポーネント。
 * @radix-ui/react-switchをベースとし、Tailwind CSSでスタイリングする。
 *
 * 用途:
 * - Cloud利用可否のトグルスイッチ（AWS/GCP/Azure）
 *
 * アクセシビリティ:
 * - role="switch" を持ち、aria-checked で状態を表現する
 * - キーボード操作（Space）でトグル可能
 *
 * 参考: https://ui.shadcn.com/docs/components/switch
 * 参考: https://www.radix-ui.com/primitives/docs/components/switch
 */

"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * Switchコンポーネント
 *
 * @radix-ui/react-switchのRootをラップし、shadcn/uiスタイルを適用する。
 *
 * @param className - 追加のCSSクラス
 * @param checked - スイッチの状態（制御コンポーネントとして使う場合）
 * @param onCheckedChange - 状態変更時のコールバック
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // ベーススタイル: サイズ・形状・トランジション設定
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      // フォーカス時のリングスタイル（アクセシビリティ）
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // 無効時のスタイル
      "disabled:cursor-not-allowed disabled:opacity-50",
      // チェック状態（ON）: プライマリ色、未チェック状態（OFF）: グレー
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      // トランジション設定
      "transition-colors",
      className
    )}
    {...props}
    ref={ref}
  >
    {/* サム（スライダーのつまみ部分） */}
    <SwitchPrimitives.Thumb
      className={cn(
        // サムのベーススタイル
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0",
        // トランジション: チェック状態によって左右に移動
        "transition-transform",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
