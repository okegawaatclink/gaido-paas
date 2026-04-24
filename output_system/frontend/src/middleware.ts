/**
 * Next.js Middleware
 *
 * 全ページリクエストに対して認証チェックを行う。
 * 未認証ユーザーが保護されたルートにアクセスしようとした場合、
 * NextAuth.jsのsignInページ（/login）にリダイレクトする。
 *
 * 参考: https://next-auth.js.org/configuration/nextjs#middleware
 */

export { default } from "next-auth/middleware";

/**
 * Middlewareを適用するルートのマッチャー設定
 *
 * 以下のルートは認証チェックを行う（未認証→/loginにリダイレクト）:
 * - /my-access/*: 一般ユーザー向けCloudアクセス状況ページ
 * - /admin/*: 管理者向けページ
 *
 * 以下のルートは認証チェック対象外（公開ルート）:
 * - /login: ログインページ
 * - /api/auth/*: NextAuth.jsのAPIルート
 * - /_next/*: Next.jsの静的アセット
 * - /public/*: 静的ファイル
 */
export const config = {
  matcher: [
    "/my-access/:path*",
    "/admin/:path*",
  ],
};
