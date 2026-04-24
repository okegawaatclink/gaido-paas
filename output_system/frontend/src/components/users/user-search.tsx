/**
 * ユーザー検索コンポーネント
 *
 * 管理者がユーザーを検索するための検索バーコンポーネント。
 * キーワード入力で即時検索（debounce適用）を行う。
 *
 * 機能:
 * - テキスト入力で検索キーワードを受け付ける
 * - 300msのdebounceを適用し、入力中の不要なAPIコールを防ぐ
 * - プレースホルダー: 「社員ID / 氏名 / 部署で検索」
 * - クリアボタンで検索をリセット
 *
 * screens.mdのワイヤーフレーム:
 * S["検索バー: 社員ID / 氏名 / 部署"]
 *
 * 参考:
 * - debounce: useEffectとsetTimeoutを組み合わせた実装
 */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

/**
 * UserSearchコンポーネントの Props
 */
interface UserSearchProps {
  /**
   * 検索キーワードが変更された時に呼ばれるコールバック関数
   * debounceが適用された後の値が渡される
   *
   * @param keyword debounce後の検索キーワード
   */
  onSearch: (keyword: string) => void;

  /**
   * 検索中フラグ（外部から渡すローディング状態）
   * trueの場合、入力フィールドを無効化する
   */
  isLoading?: boolean;
}

/**
 * ユーザー検索コンポーネント
 *
 * キーワード入力で300msのdebounceを適用してonSearchを呼び出す。
 * debounce実装: useEffectのクリーンアップ関数でsetTimeoutをキャンセルする。
 *
 * @param onSearch 検索キーワード変更時のコールバック（debounce後に呼ばれる）
 * @param isLoading ローディング状態（true時は入力無効化）
 */
export function UserSearch({ onSearch, isLoading = false }: UserSearchProps) {
  /** 入力フィールドの現在の値（UIと同期） */
  const [inputValue, setInputValue] = useState("");

  /**
   * debounce処理: inputValueが変わってから300ms後にonSearchを呼ぶ
   *
   * useEffectのクリーンアップ関数でsetTimeoutをキャンセルすることで
   * 毎回の入力で前のタイマーをリセットし、最後の入力から300ms後のみ検索を実行する。
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(inputValue);
    }, 300);

    // クリーンアップ: 次のレンダリング前にタイマーをキャンセル
    return () => clearTimeout(timeoutId);
  }, [inputValue, onSearch]);

  return (
    <div className="flex items-center gap-2">
      {/* 検索入力フィールド */}
      <div className="relative flex-1 max-w-sm">
        {/* 検索アイコン（左側） */}
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <Input
          type="text"
          placeholder="社員ID / 氏名 / 部署で検索"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          className="pl-9 pr-8"
          data-testid="user-search-input"
          aria-label="ユーザー検索"
        />

        {/* クリアボタン（入力がある場合のみ表示） */}
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="検索をクリア"
            data-testid="user-search-clear"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* ローディングインジケーター */}
      {isLoading && (
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
          aria-label="検索中"
          data-testid="user-search-loading"
        />
      )}
    </div>
  );
}
