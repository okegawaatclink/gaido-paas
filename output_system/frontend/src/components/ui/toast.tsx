/**
 * Toastコンポーネント
 *
 * 画面上部または下部に一時的に表示される通知コンポーネント。
 * 操作結果（成功・エラー等）をユーザーに伝えるために使用する。
 *
 * 実装:
 * - Radix UIのToastプリミティブを使用しない独自実装
 * - CSS Transitionで表示・非表示アニメーションを実装
 * - 自動的に指定時間後に消えるタイマーを内蔵
 *
 * 用途:
 * - Cloud利用可否更新の保存成功時/失敗時の通知
 *
 * 使用方法:
 * ```tsx
 * // ToastProviderでラップ（またはページコンポーネントで直接使用）
 * const [toast, setToast] = useState<ToastState | null>(null);
 *
 * // 成功トーストを表示
 * setToast({ type: 'success', message: '保存しました' });
 *
 * // Toastコンポーネントをレンダリング
 * <Toast toast={toast} onClose={() => setToast(null)} />
 * ```
 */

"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Toastの表示状態
 *
 * @property type - トーストの種類（success/error/info）
 * @property message - 表示するメッセージ
 */
export type ToastState = {
  /** トーストの種類 */
  type: "success" | "error" | "info";
  /** 表示するメッセージ */
  message: string;
};

/**
 * ToastコンポーネントのProps
 */
interface ToastProps {
  /**
   * 表示するトースト情報
   * nullの場合は非表示
   */
  toast: ToastState | null;
  /**
   * トーストを閉じる際のコールバック
   * 自動的に消える場合にも呼ばれる
   */
  onClose: () => void;
  /**
   * 自動的に消えるまでの時間（ミリ秒）
   * デフォルト: 3000ms（3秒）
   */
  duration?: number;
}

/**
 * Toastコンポーネント
 *
 * 一時的な通知メッセージを画面右下に表示する。
 * 指定した時間（duration）が経過すると自動的に閉じる。
 *
 * @param toast - 表示するトースト情報（nullの場合は非表示）
 * @param onClose - 閉じる際のコールバック
 * @param duration - 自動消去までの時間（ms）
 */
export function Toast({ toast, onClose, duration = 3000 }: ToastProps) {
  // durationが経過したら自動的に閉じる
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // クリーンアップ: コンポーネントアンマウント時またはtoast変更時にタイマーをクリア
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  // トーストの種類に応じたスタイルを決定する
  const toastStyles = {
    success: {
      container: "bg-green-50 border-green-200",
      icon: "text-green-400",
      text: "text-green-800",
      iconPath: (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ),
    },
    error: {
      container: "bg-red-50 border-red-200",
      icon: "text-red-400",
      text: "text-red-800",
      iconPath: (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      ),
    },
    info: {
      container: "bg-blue-50 border-blue-200",
      icon: "text-blue-400",
      text: "text-blue-800",
      iconPath: (
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      ),
    },
  };

  const style = toastStyles[toast.type];

  return (
    // 固定位置で右下に配置する
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm"
      role="alert"
      aria-live="polite"
      data-testid="toast-notification"
    >
      <div
        className={cn(
          "flex items-start rounded-lg border p-4 shadow-lg",
          style.container
        )}
      >
        {/* アイコン */}
        <div className="flex-shrink-0">
          <svg
            className={cn("h-5 w-5", style.icon)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            {style.iconPath}
          </svg>
        </div>

        {/* メッセージ */}
        <div className="ml-3 flex-1">
          <p className={cn("text-sm font-medium", style.text)}>
            {toast.message}
          </p>
        </div>

        {/* 閉じるボタン */}
        <div className="ml-3 flex-shrink-0">
          <button
            type="button"
            className={cn(
              "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
              toast.type === "success" && "text-green-500 hover:bg-green-100 focus:ring-green-600",
              toast.type === "error" && "text-red-500 hover:bg-red-100 focus:ring-red-600",
              toast.type === "info" && "text-blue-500 hover:bg-blue-100 focus:ring-blue-600"
            )}
            onClick={onClose}
            aria-label="閉じる"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
