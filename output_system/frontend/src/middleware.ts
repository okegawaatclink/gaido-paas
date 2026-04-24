/**
 * Next.js Middleware（認証・ロールベースアクセス制御）
 *
 * 全ページリクエストに対して認証チェックとロールチェックを行う。
 *
 * 処理フロー:
 * 1. 公開ルート（/login, /api/auth）はそのまま通す
 * 2. 未認証ユーザーは /login にリダイレクト
 * 3. /admin/* は管理者（isAdmin=true）のみ許可。一般社員は /my-access にリダイレクト
 * 4. 認証済みユーザーが /login にアクセスした場合: ロールに応じてリダイレクト
 *
 * 参考:
 * - https://next-auth.js.org/configuration/nextjs#middleware
 * - https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { JWT } from "next-auth/jwt";

/**
 * withAuth ミドルウェア
 *
 * NextAuth.jsの `withAuth` でラップすることで、
 * req.nextauth.token（JWT）が自動的に取得される。
 * Edge Runtimeで動作するため、Node.js専用APIは使用不可。
 *
 * @param req - NextAuth拡張されたリクエストオブジェクト（req.nextauth.token を含む）
 * @returns NextResponse（リダイレクト or 通過）
 */
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    // JWT から isAdmin フラグを取得
    const token = req.nextauth.token as (JWT & { isAdmin?: boolean }) | null;
    const isAdmin = token?.isAdmin === true;

    // /admin/* へのアクセス: 管理者のみ許可
    if (pathname.startsWith("/admin")) {
      if (!isAdmin) {
        // 一般社員が /admin に直接アクセスした場合 → /my-access へリダイレクト
        return NextResponse.redirect(new URL("/my-access", req.url));
      }
    }

    // その他の保護ルートは認証済みであればそのまま通す
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * 認証チェックコールバック
       *
       * このコールバックで false を返すと、未認証ユーザーは pages.signIn（/login）にリダイレクトされる。
       * withAuth の middleware 関数は、このコールバックが true を返した場合のみ実行される。
       *
       * @param token - JWTトークン（未認証の場合は null）
       * @returns 認証済みかどうか
       */
      authorized: ({ token }) => {
        // token が存在すれば認証済みと判断
        return !!token;
      },
    },
    pages: {
      // 未認証時のリダイレクト先（NextAuth.jsの signIn ページ）
      signIn: "/login",
    },
  }
);

/**
 * Middlewareを適用するルートのマッチャー設定
 *
 * 以下のルートは認証チェック・ロールチェックを行う:
 * - /my-access/*: 一般ユーザー向けCloudアクセス状況ページ
 * - /admin/*: 管理者向けページ
 *
 * 以下のルートは認証チェック対象外（公開ルート）:
 * - /login: ログインページ（NextAuthが自動的に除外）
 * - /api/auth/*: NextAuth.jsのAPIルート（NextAuthが自動的に除外）
 * - /_next/*: Next.jsの静的アセット
 */
export const config = {
  matcher: [
    "/my-access/:path*",
    "/admin/:path*",
  ],
};
