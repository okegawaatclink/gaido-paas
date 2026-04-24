/**
 * ユーザー一覧・検索ページ（管理者専用）
 *
 * 管理者がユーザーの一覧を表示し、社員ID・氏名・部署で検索できる画面。
 * screens.mdのワイヤーフレームに準拠:
 * - Header: PaaS管理システム | 管理者名 | ログアウト（MainLayoutで提供）
 * - 検索バー: 社員ID / 氏名 / 部署
 * - テーブル: 社員ID | 氏名 | 部署 | AWS | GCP | Azure
 *
 * アクセス権:
 * - このページは管理者（isAdmin=true）のみアクセス可能
 * - middleware.ts でロールチェックが行われる（一般社員は /my-access にリダイレクト）
 *
 * データフロー:
 * 1. ページ初回表示時: BFFプロキシ経由で全ユーザー一覧を取得
 * 2. 検索バー入力時: 300msのdebounce後にBFFプロキシ経由でユーザー検索を実行
 *
 * PBI #8: ユーザー一覧表示・検索機能
 * PBI #9: ユーザー詳細・Cloud利用可否更新（ユーザー行クリックで遷移）
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { UserTable } from "@/components/users/user-table";
import { UserSearch } from "@/components/users/user-search";
import { getUsers, searchUsers } from "@/lib/api-client";
import type { UserResponse } from "@/lib/api-client";

/**
 * ユーザー一覧ページコンポーネント
 *
 * 管理者向けのユーザー管理画面。
 * ユーザー一覧の取得・表示・検索機能を提供する。
 *
 * 状態管理:
 * - users: 表示するユーザーリスト（全件または検索結果）
 * - isLoading: データ取得中のローディング状態
 * - error: エラーメッセージ（取得失敗時に表示）
 * - searchKeyword: 現在の検索キーワード
 */
export default function AdminUsersPage() {
  /** 表示するユーザーリスト */
  const [users, setUsers] = useState<UserResponse[]>([]);

  /** ローディング状態（初期ロードまたは検索中） */
  const [isLoading, setIsLoading] = useState(true);

  /** エラーメッセージ（取得失敗時） */
  const [error, setError] = useState<string | null>(null);

  /** 現在の検索キーワード */
  const [searchKeyword, setSearchKeyword] = useState("");

  /**
   * ユーザーデータを取得する関数
   *
   * キーワードが空の場合は全ユーザー一覧を取得し、
   * キーワードがある場合は部分一致検索を実行する。
   *
   * @param keyword 検索キーワード（空の場合は全件取得）
   */
  const fetchUsers = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let result: UserResponse[];

      if (keyword.trim() === "") {
        // キーワードなし: 全ユーザー一覧を取得
        result = await getUsers();
      } else {
        // キーワードあり: 部分一致検索を実行
        result = await searchUsers(keyword);
      }

      setUsers(result);
    } catch (err) {
      // エラーハンドリング: エラーメッセージを設定して空リストにする
      console.error("ユーザー取得エラー:", err);

      if (err instanceof Error) {
        // 認証エラーの場合は再ログインを促す
        if (err.message.includes("Unauthorized") || err.message.includes("401")) {
          setError("セッションが切れました。再度ログインしてください。");
        } else {
          setError("ユーザー一覧の取得に失敗しました。しばらくしてから再試行してください。");
        }
      } else {
        setError("予期しないエラーが発生しました。");
      }

      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 初回マウント時に全ユーザー一覧を取得する
   */
  useEffect(() => {
    fetchUsers("");
  }, [fetchUsers]);

  /**
   * 検索キーワード変更時のハンドラー
   *
   * UserSearchコンポーネントからdebounce後の値が渡される。
   * キーワードを更新してユーザーデータを再取得する。
   *
   * @param keyword debounce後の検索キーワード
   */
  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    fetchUsers(keyword);
  }, [fetchUsers]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ページタイトルエリア */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>
          <p className="mt-1 text-sm text-gray-600">
            ユーザーの一覧表示とクラウドアクセス権の管理ができます。
          </p>
        </div>

        {/* 検索バーエリア */}
        <div className="flex items-center justify-between">
          <UserSearch
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {/* 検索結果件数の表示（検索中でない場合） */}
          {!isLoading && searchKeyword && (
            <p className="text-sm text-gray-500">
              「{searchKeyword}」の検索結果: {users.length}件
            </p>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="rounded-md bg-red-50 p-4 border border-red-200"
            role="alert"
            data-testid="error-message"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {/* エラーアイコン */}
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ユーザーテーブルエリア */}
        <UserTable users={users} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
}
