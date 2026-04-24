/**
 * ユーザー詳細画面（管理者専用）
 *
 * 管理者が特定のユーザーの詳細情報を確認し、Cloud利用可否を編集する画面。
 * screens.mdのユーザー詳細画面ワイヤーフレームに準拠:
 * - Header: PaaS管理システム | 管理者名 | ログアウト（MainLayoutで提供）
 * - 「← ユーザー一覧に戻る」リンク
 * - ユーザー情報カード: 社員ID / 氏名 / メール / 部署 / 役職
 * - Cloud利用可否カード: AWS / GCP / Azure のトグルスイッチ
 * - 保存ボタン: トグル変更をAPIに送信
 *
 * アクセス権:
 * - このページは管理者（isAdmin=true）のみアクセス可能
 * - middleware.ts でロールチェックが行われる（一般社員は /my-access にリダイレクト）
 *
 * データフロー:
 * 1. ページ初回表示時: BFFプロキシ経由でユーザー詳細を取得
 * 2. トグルを切り替え: ローカル状態を更新（楽観的UI更新なし）
 * 3. 保存ボタン押下: BFFプロキシ経由でCloud利用可否を更新
 *
 * PBI #9: 管理者がCloud利用可否を付与・剥奪できる
 */

"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { CloudAccessToggle } from "@/components/users/cloud-access-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast, ToastState } from "@/components/ui/toast";
import { getUserById, updateCloudAccess } from "@/lib/api-client";
import type { UserResponse, CloudAccessResponse } from "@/lib/api-client";

/**
 * ユーザー詳細ページコンポーネントのProps
 */
interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * ユーザー詳細ページコンポーネント
 *
 * ユーザー詳細情報の表示とCloud利用可否の編集機能を提供する。
 * 保存ボタン押下で一括更新を行う（トグル変更ごとには保存しない）。
 *
 * 状態管理:
 * - user: 取得したユーザー詳細（CloudAccess付き）
 * - localCloudAccess: 編集中のCloudAccess状態（トグル切り替えで更新）
 * - isLoading: データ取得中のローディング状態
 * - isSaving: API呼び出し中の保存状態
 * - error: エラーメッセージ（取得または保存失敗時）
 * - toast: トースト通知の状態
 */
export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = use(params);
  const userId = parseInt(id, 10);

  /** 取得したユーザー詳細 */
  const [user, setUser] = useState<UserResponse | null>(null);

  /**
   * 編集中のCloudAccess状態（ローカル）
   * トグルを切り替えると更新され、保存ボタン押下でAPIに送信される
   */
  const [localCloudAccess, setLocalCloudAccess] = useState<CloudAccessResponse[]>([]);

  /** データ取得中のローディング状態 */
  const [isLoading, setIsLoading] = useState(true);

  /** API呼び出し中の保存状態 */
  const [isSaving, setIsSaving] = useState(false);

  /** エラーメッセージ（取得または保存失敗時） */
  const [error, setError] = useState<string | null>(null);

  /** トースト通知の状態 */
  const [toast, setToast] = useState<ToastState | null>(null);

  /**
   * ユーザー詳細を取得する関数
   *
   * BFFプロキシ経由でユーザー詳細を取得し、状態に設定する。
   */
  const fetchUser = useCallback(async () => {
    if (isNaN(userId)) {
      setError("無効なユーザーIDです。");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedUser = await getUserById(userId);
      setUser(fetchedUser);
      // ローカルのCloudAccess状態を初期化する
      setLocalCloudAccess([...fetchedUser.cloudAccess]);
    } catch (err) {
      console.error("ユーザー詳細取得エラー:", err);

      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("Not Found")) {
          setError("指定されたユーザーが見つかりません。");
        } else if (err.message.includes("Unauthorized") || err.message.includes("401")) {
          setError("セッションが切れました。再度ログインしてください。");
        } else {
          setError("ユーザー情報の取得に失敗しました。しばらくしてから再試行してください。");
        }
      } else {
        setError("予期しないエラーが発生しました。");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 初回マウント時にユーザー詳細を取得する
   */
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * トグル切り替え時のハンドラー
   *
   * CloudAccessToggleコンポーネントからトグル変更が通知された際に呼ばれる。
   * ローカルのCloudAccess状態を更新する（APIは呼ばない）。
   *
   * @param provider Cloud種別（"AWS" | "GCP" | "Azure"）
   * @param enabled 新しい有効/無効状態
   */
  const handleToggle = useCallback(
    (provider: "AWS" | "GCP" | "Azure", enabled: boolean) => {
      setLocalCloudAccess((prev) =>
        prev.map((ca) =>
          ca.cloudProvider === provider ? { ...ca, isEnabled: enabled } : ca
        )
      );
    },
    []
  );

  /**
   * 保存ボタン押下時のハンドラー
   *
   * ローカルのCloudAccess状態をAPIに送信して保存する。
   * 保存成功時にトースト通知を表示し、失敗時はエラートーストを表示する。
   */
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      // Cloud利用可否を更新する
      const updatedUser = await updateCloudAccess(userId, {
        cloudAccess: localCloudAccess.map((ca) => ({
          cloudProvider: ca.cloudProvider,
          isEnabled: ca.isEnabled,
        })),
      });

      // 取得したデータで状態を更新する
      setUser(updatedUser);
      setLocalCloudAccess([...updatedUser.cloudAccess]);

      // 成功トーストを表示する
      setToast({ type: "success", message: "Cloud利用可否を保存しました。" });
    } catch (err) {
      console.error("Cloud利用可否更新エラー:", err);

      // エラートーストを表示する
      setToast({
        type: "error",
        message: "保存に失敗しました。しばらくしてから再試行してください。",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * トースト通知を閉じる
   */
  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);

  // ==========================================================================
  // レンダリング
  // ==========================================================================

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </MainLayout>
    );
  }

  if (error && !user) {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* 戻るリンク */}
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            data-testid="back-to-list-link"
          >
            ← ユーザー一覧に戻る
          </Link>

          {/* エラーメッセージ */}
          <div
            className="rounded-md bg-red-50 p-4 border border-red-200"
            role="alert"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ← ユーザー一覧に戻るリンク */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
          data-testid="back-to-list-link"
        >
          ← ユーザー一覧に戻る
        </Link>

        {/* ページタイトル */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ユーザー詳細</h2>
          <p className="mt-1 text-sm text-gray-600">
            ユーザー情報の確認とCloud利用可否の変更ができます。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ユーザー情報カード */}
          <Card data-testid="user-info-card">
            <CardHeader>
              <CardTitle className="text-lg">ユーザー情報</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {/* 社員ID */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    社員ID
                  </dt>
                  <dd
                    className="mt-1 font-mono text-sm font-medium text-gray-900"
                    data-testid="user-employee-id"
                  >
                    {user.employeeId}
                  </dd>
                </div>

                {/* 氏名 */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    氏名
                  </dt>
                  <dd
                    className="mt-1 text-sm font-medium text-gray-900"
                    data-testid="user-name"
                  >
                    {user.name}
                  </dd>
                </div>

                {/* メール */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    メールアドレス
                  </dt>
                  <dd
                    className="mt-1 text-sm text-gray-900"
                    data-testid="user-email"
                  >
                    {user.email}
                  </dd>
                </div>

                {/* 部署 */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    部署
                  </dt>
                  <dd
                    className="mt-1 text-sm text-gray-900"
                    data-testid="user-department"
                  >
                    {user.department ?? "—"}
                  </dd>
                </div>

                {/* 役職 */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    役職
                  </dt>
                  <dd
                    className="mt-1 text-sm text-gray-900"
                    data-testid="user-position"
                  >
                    {user.position ?? "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Cloud利用可否カード */}
          <Card data-testid="cloud-access-card">
            <CardHeader>
              <CardTitle className="text-lg">Cloud利用可否</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* CloudAccessトグルリスト */}
                {localCloudAccess.length > 0 ? (
                  localCloudAccess.map((cloudAccess) => (
                    <CloudAccessToggle
                      key={cloudAccess.cloudProvider}
                      cloudAccess={cloudAccess}
                      onToggle={handleToggle}
                      isSaving={isSaving}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Cloud利用可否情報が設定されていません。
                  </p>
                )}

                {/* 保存ボタン */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    data-testid="save-button"
                    className="min-w-24"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        {/* ローディングスピナー */}
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        保存中...
                      </span>
                    ) : (
                      "保存"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* トースト通知 */}
      <Toast toast={toast} onClose={handleToastClose} />
    </MainLayout>
  );
}
