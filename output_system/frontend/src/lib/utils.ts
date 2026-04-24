/**
 * ユーティリティ関数モジュール
 *
 * clsx と tailwind-merge を組み合わせた cn 関数を提供する。
 * cn関数はTailwindCSSのクラス名を安全にマージするために使用する。
 *
 * 参考: https://ui.shadcn.com/docs/installation#add-a-cn-helper
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名をマージするユーティリティ関数
 *
 * clsxで条件付きクラスを処理し、tailwind-mergeでTailwindCSSの
 * クラス名の重複を解決する。
 *
 * @param inputs - マージするクラス名（文字列、オブジェクト、配列など）
 * @returns マージされたクラス名文字列
 *
 * @example
 * cn("px-4 py-2", "text-sm", { "bg-blue-500": true })
 * // → "px-4 py-2 text-sm bg-blue-500"
 *
 * cn("px-4", "px-8")  // tailwind-mergeが後者を優先
 * // → "px-8"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
