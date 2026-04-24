/**
 * トップページ（ロールに応じたリダイレクト）
 *
 * ルートパス（/）にアクセスした場合、認証状態とロールに応じてリダイレクトする。
 *
 * リダイレクトロジック:
 * - 未認証: /login（ログイン画面）へリダイレクト
 * - 認証済み（管理者）: /admin/users（ユーザー一覧画面）へリダイレクト
 * - 認証済み（一般社員）: /my-access（マイアクセス画面）へリダイレクト
 *
 * screens.mdの画面遷移図:
 * - KeyCloak認証（管理者）→ ユーザー一覧画面
 * - KeyCloak認証（一般社員）→ マイアクセス画面
 */
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * セッション型拡張（isAdmin フラグを含む）
 */
type ExtendedSession = Session & {
  isAdmin?: boolean;
};

/**
 * トップページコンポーネント
 *
 * 認証状態とロール（isAdmin）を確認して適切なページにリダイレクトする。
 * - 管理者（isAdmin=true）: /admin/users にリダイレクト
 * - 一般社員（isAdmin=false）: /my-access にリダイレクト
 * - 未認証: /login にリダイレクト
 */
export default async function HomePage() {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;

  if (!session) {
    // 未認証ユーザー: ログインページへ
    redirect("/login");
  }

  if (session.isAdmin) {
    // 管理者: ユーザー一覧画面へ（screens.mdのロール別遷移に従う）
    redirect("/admin/users");
  } else {
    // 一般社員: マイアクセス画面へ
    redirect("/my-access");
  }
}
