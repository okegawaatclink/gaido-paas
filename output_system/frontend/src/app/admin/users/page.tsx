/**
 * ユーザー一覧・検索ページ（管理者専用）
 *
 * 管理者がユーザーの一覧を表示し、名前やIDで検索できる画面。
 * アクセス権の変更もこの画面から行う。
 */
export default function AdminUsersPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold text-foreground">ユーザー管理</h1>
      <p className="mt-4 text-muted-foreground">
        ユーザーの一覧表示とクラウドアクセス権の管理ができます。
      </p>
    </div>
  );
}
