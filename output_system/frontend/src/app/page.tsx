/**
 * トップページ（リダイレクト）
 *
 * ルートパス（/）にアクセスした場合、
 * 認証後は自分のCloud利用状況ページ（/my-access）へリダイレクトする。
 * 未認証の場合はNextAuth.jsの設定により自動的にログインページへリダイレクトされる。
 */
import { redirect } from "next/navigation";

/**
 * トップページコンポーネント
 * - 認証済みユーザーは /my-access にリダイレクト
 */
export default function HomePage() {
  // 認証チェックはmiddlewareで行い、ここでは常にリダイレクト
  redirect("/my-access");
}
