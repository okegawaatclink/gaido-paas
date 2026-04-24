/**
 * Inputコンポーネント
 *
 * shadcn/ui互換のInputコンポーネント。
 * HTML inputを基本にし、Tailwind CSSでスタイリングした入力フィールドを提供する。
 *
 * 参考: https://ui.shadcn.com/docs/components/input
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Inputコンポーネントの Props
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Inputコンポーネント
 *
 * フォーカス時のリング表示・ホバーエフェクト・プレースホルダースタイルを含む
 * 一般的なテキスト入力フィールド。
 *
 * @param className 追加のCSSクラス名
 * @param type input要素のtype属性（デフォルト: "text"）
 * @param props その他のHTMLInputElement属性
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // ベーススタイル: 幅・高さ・パディング・ボーダー・背景色
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          // ファイル入力時のスタイル
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // プレースホルダースタイル
          "placeholder:text-muted-foreground",
          // フォーカス時のスタイル: アウトラインを消してリングを表示
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // 無効時のスタイル
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
