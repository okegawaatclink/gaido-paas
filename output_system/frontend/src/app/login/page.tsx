/**
 * ログインページ
 *
 * KeyCloak OIDCフローを使用したログイン画面。
 * 「ログイン」ボタンクリックでNextAuth.jsがKeyCloakへリダイレクトする。
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            PaaS管理ポータル
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            アカウントにサインインしてください
          </p>
        </div>
        {/* ログインボタン: NextAuth.jsのsignIn関数でKeyCloakへリダイレクト */}
        <div className="mt-8">
          <p className="text-center text-sm text-muted-foreground">
            サービス起動中...
          </p>
        </div>
      </div>
    </div>
  );
}
