/**
 * トップページ（リダイレクト）
 *
 * ルートパス（/）にアクセスした場合、認証状態に応じてリダイレクトする。
 * - 認証済み: /my-access（自分のCloud利用状況ページ）へリダイレクト
 * - 未認証: /login（ログイン画面）へリダイレクト
 *
 * middlewareで /my-access は保護されているため、
 * 未認証ユーザーが /my-access にアクセスすると /login にリダイレクトされる。
 */
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * トップページコンポーネント
 *
 * 認証状態を確認して適切なページにリダイレクトする。
 * - 認証済みユーザー: /my-access にリダイレクト
 * - 未認証ユーザー: /login にリダイレクト（middlewareも保護しているが明示的に処理）
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    // 認証済み: My Accessページへ
    redirect("/my-access");
  } else {
    // 未認証: ログインページへ
    redirect("/login");
  }
}
