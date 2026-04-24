/**
 * 自分のCloud利用状況閲覧ページ
 *
 * ログインユーザー自身のクラウドサービスへのアクセス権状況を表示する。
 * Server Componentとして実装し、バックエンドAPIからデータを取得する。
 */
export default function MyAccessPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold text-foreground">
        自分のCloud利用状況
      </h1>
      <p className="mt-4 text-muted-foreground">
        現在のクラウドサービスへのアクセス権を確認できます。
      </p>
    </div>
  );
}
