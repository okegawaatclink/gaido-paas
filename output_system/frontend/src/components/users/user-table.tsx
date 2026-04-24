/**
 * ユーザーテーブルコンポーネント
 *
 * ユーザー一覧を表形式で表示するコンポーネント。
 * screens.mdのワイヤーフレームに準拠:
 * T["テーブル: 社員ID | 氏名 | 部署 | AWS | GCP | Azure"]
 *
 * 機能:
 * - ユーザー一覧をテーブルで表示
 * - Cloud利用可否を視覚的に表示（可: 緑バッジ、不可: 赤バッジ）
 * - ユーザー行クリックで詳細画面（/admin/users/[id]）に遷移
 * - データなし時の空状態表示
 * - ローディング状態のスケルトン表示
 */

"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserResponse, CloudAccessResponse } from "@/lib/api-client";

/**
 * UserTableコンポーネントの Props
 */
interface UserTableProps {
  /**
   * 表示するユーザーリスト
   * CloudAccess付きのUserResponseの配列
   */
  users: UserResponse[];

  /**
   * ローディング状態フラグ
   * trueの場合、スケルトンローダーを表示する
   */
  isLoading?: boolean;
}

/**
 * Cloud利用可否バッジコンポーネント
 *
 * Cloud利用可否（isEnabled）をバッジで視覚的に表示する。
 * - 有効（可）: 緑色のバッジ
 * - 無効（不可）: 赤色のバッジ
 *
 * @param isEnabled アクセス権の有効/無効フラグ
 */
function CloudAccessBadge({ isEnabled }: { isEnabled: boolean }) {
  if (isEnabled) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
        data-testid="cloud-access-enabled"
      >
        可
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
      data-testid="cloud-access-disabled"
    >
      不可
    </span>
  );
}

/**
 * 指定したcloudProviderのCloudAccessをリストから取得するヘルパー関数
 *
 * @param cloudAccesses CloudAccessのリスト
 * @param provider 取得するプロバイダー名（"AWS" | "GCP" | "Azure"）
 * @returns 該当するCloudAccess、見つからない場合はundefined
 */
function getCloudAccess(
  cloudAccesses: CloudAccessResponse[],
  provider: "AWS" | "GCP" | "Azure"
): CloudAccessResponse | undefined {
  return cloudAccesses.find((ca) => ca.cloudProvider === provider);
}

/**
 * テーブルスケルトンローダーコンポーネント
 *
 * データ読み込み中にスケルトン表示してUXを向上させる。
 */
function TableSkeleton() {
  // スケルトン行を5行表示する
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {/* 各列にスケルトンを表示 */}
          {Array.from({ length: 6 }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * ユーザーテーブルコンポーネント
 *
 * ユーザー一覧をテーブル形式で表示し、行クリックで詳細画面に遷移する。
 * ローディング中はスケルトンを表示し、データなし時は空状態メッセージを表示する。
 *
 * @param users 表示するユーザーリスト
 * @param isLoading ローディング状態フラグ
 */
export function UserTable({ users, isLoading = false }: UserTableProps) {
  const router = useRouter();

  /**
   * ユーザー行クリック時の遷移処理
   *
   * 管理者がユーザーの詳細を確認・編集するため /admin/users/[id] に遷移する。
   *
   * @param userId クリックされたユーザーのID
   */
  const handleRowClick = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        {/* テーブルヘッダー */}
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">社員ID</TableHead>
            <TableHead className="font-semibold text-gray-700">氏名</TableHead>
            <TableHead className="font-semibold text-gray-700">部署</TableHead>
            <TableHead className="text-center font-semibold text-gray-700">
              AWS
            </TableHead>
            <TableHead className="text-center font-semibold text-gray-700">
              GCP
            </TableHead>
            <TableHead className="text-center font-semibold text-gray-700">
              Azure
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* テーブルボディ */}
        <TableBody>
          {/* ローディング中はスケルトンを表示 */}
          {isLoading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            /* データなし時の空状態 */
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-sm text-gray-500"
                data-testid="user-table-empty"
              >
                ユーザーが見つかりませんでした
              </TableCell>
            </TableRow>
          ) : (
            /* ユーザーリストの表示 */
            users.map((user) => {
              const awsAccess = getCloudAccess(user.cloudAccess, "AWS");
              const gcpAccess = getCloudAccess(user.cloudAccess, "GCP");
              const azureAccess = getCloudAccess(user.cloudAccess, "Azure");

              return (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user.id)}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  data-testid={`user-row-${user.id}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    // キーボードアクセシビリティ: EnterキーまたはSpaceキーで遷移
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(user.id);
                    }
                  }}
                  role="button"
                  aria-label={`${user.name}の詳細を表示`}
                >
                  {/* 社員ID */}
                  <TableCell className="font-mono text-sm font-medium text-gray-900">
                    {user.employeeId}
                  </TableCell>

                  {/* 氏名 */}
                  <TableCell className="font-medium text-gray-900">
                    {user.name}
                  </TableCell>

                  {/* 部署（未設定の場合は「-」表示） */}
                  <TableCell className="text-gray-600">
                    {user.department ?? "-"}
                  </TableCell>

                  {/* AWS利用可否 */}
                  <TableCell className="text-center">
                    {awsAccess ? (
                      <CloudAccessBadge isEnabled={awsAccess.isEnabled} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>

                  {/* GCP利用可否 */}
                  <TableCell className="text-center">
                    {gcpAccess ? (
                      <CloudAccessBadge isEnabled={gcpAccess.isEnabled} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>

                  {/* Azure利用可否 */}
                  <TableCell className="text-center">
                    {azureAccess ? (
                      <CloudAccessBadge isEnabled={azureAccess.isEnabled} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* フッター: ユーザー数表示 */}
      {!isLoading && users.length > 0 && (
        <div className="border-t px-4 py-2 text-xs text-gray-500">
          {users.length}件のユーザーが表示されています
        </div>
      )}
    </div>
  );
}
