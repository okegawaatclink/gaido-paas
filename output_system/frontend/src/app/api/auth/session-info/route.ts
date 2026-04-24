/**
 * セッション情報取得エンドポイント
 *
 * BFFからフロントエンドへのセッション情報提供エンドポイント。
 * 現在のログインユーザーのセッション情報（アクセストークン含む）を返す。
 *
 * GET /api/auth/session-info
 *
 * レスポンス:
 * - 認証済み: セッション情報（user, accessToken, isAdmin）
 * - 未認証: 401 Unauthorized
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * セッション情報取得ハンドラー
 *
 * @returns 認証済みの場合はセッション情報、未認証の場合は401エラー
 */
export async function GET() {
  // サーバーサイドでセッションを取得
  const session = (await getServerSession(authOptions)) as
    | (Session & { accessToken?: string; isAdmin?: boolean; error?: string })
    | null;

  if (!session) {
    // 未認証: 401を返す
    return NextResponse.json(
      { error: "Unauthorized", message: "認証が必要です" },
      { status: 401 }
    );
  }

  // リフレッシュエラーの場合は401を返してクライアントに再ログインを促す
  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json(
      {
        error: "TokenExpired",
        message: "セッションが期限切れです。再度ログインしてください",
      },
      { status: 401 }
    );
  }

  // セッション情報を返す（アクセストークンはサーバーサイド専用のため除外）
  return NextResponse.json({
    user: {
      name: session.user?.name,
      email: session.user?.email,
      image: session.user?.image,
    },
    isAdmin: session.isAdmin ?? false,
    expires: session.expires,
  });
}
