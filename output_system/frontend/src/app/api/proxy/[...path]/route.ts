/**
 * BFFプロキシルート
 *
 * フロントエンドからのAPIリクエストをSpring MVCバックエンドに中継するBFF（Backend For Frontend）プロキシ。
 *
 * 動作概要:
 * 1. クライアントから /api/proxy/* へのリクエストを受信
 * 2. NextAuth.jsのセッションからアクセストークンを取得
 * 3. バックエンドURLを環境変数 BACKEND_URL から取得
 * 4. リクエストヘッダーにBearerトークンを付与してバックエンドに転送
 * 5. バックエンドのレスポンスをそのままクライアントに返す
 *
 * 例:
 * - GET /api/proxy/users → GET http://backend:3002/api/users
 * - GET /api/proxy/users/search?q=xxx → GET http://backend:3002/api/users/search?q=xxx
 *
 * セキュリティ:
 * - 未認証（セッションなし）の場合は401を返す
 * - セッションにアクセストークンがない場合は401を返す
 * - トークンリフレッシュエラーの場合は401を返す
 *
 * 参考:
 * - Next.js App Router Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * 認証済みセッション型（アクセストークン付き）
 */
type AuthenticatedSession = Session & {
  accessToken?: string;
  isAdmin?: boolean;
  error?: string;
};

/**
 * バックエンドURLを環境変数から取得する
 *
 * @returns バックエンドのベースURL（末尾スラッシュなし）
 * @throws 環境変数が未設定の場合はエラーをスロー
 */
function getBackendUrl(): string {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL environment variable is not set");
  }
  // 末尾スラッシュを除去して正規化
  return backendUrl.replace(/\/$/, "");
}

/**
 * セッションからアクセストークンを取得する
 *
 * @param session NextAuth.jsのセッションオブジェクト（またはnull）
 * @returns アクセストークン（文字列）
 * @throws セッションなし・トークンなし・リフレッシュエラーの場合はエラーをスロー
 */
function getAccessToken(session: AuthenticatedSession | null): string {
  if (!session) {
    throw new Error("Unauthorized: No session");
  }

  // トークンリフレッシュエラーが発生している場合は再ログインを促す
  if (session.error === "RefreshAccessTokenError") {
    throw new Error("Unauthorized: Token refresh failed");
  }

  if (!session.accessToken) {
    throw new Error("Unauthorized: No access token in session");
  }

  return session.accessToken;
}

/**
 * リクエストを転送するためのヘッダーを構築する
 *
 * セキュリティ上、フロントエンドから受け取ったヘッダーはそのまま転送せず、
 * 必要なヘッダーのみを明示的に設定する。
 *
 * @param accessToken バックエンドに渡すJWTアクセストークン
 * @param contentType リクエストボディのContent-Type（POSTやPUT時）
 * @returns バックエンドに渡すHeadersオブジェクト
 */
function buildProxyHeaders(
  accessToken: string,
  contentType?: string | null
): Headers {
  const headers = new Headers();

  // JWT Bearer認証ヘッダーを付与
  headers.set("Authorization", `Bearer ${accessToken}`);

  // Content-Typeが指定されている場合は転送（例: application/json）
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

/**
 * プロキシリクエストを実行する共通ハンドラー
 *
 * @param request Next.jsのNextRequestオブジェクト
 * @param pathSegments URLパスセグメントの配列（例: ["users", "search"]）
 * @param method HTTPメソッド（GET, POST, PUT, DELETE等）
 * @returns バックエンドのレスポンスを変換したNextResponse
 */
async function handleProxy(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  // セッション取得と認証チェック
  let session: AuthenticatedSession | null = null;
  let accessToken: string;

  try {
    session = (await getServerSession(authOptions)) as AuthenticatedSession | null;
    accessToken = getAccessToken(session);
  } catch (error) {
    // 認証エラー: 401を返す
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: error instanceof Error ? error.message : "認証エラーが発生しました",
      },
      { status: 401 }
    );
  }

  // バックエンドURLを構築
  let backendUrl: string;
  try {
    const baseUrl = getBackendUrl();
    // パスセグメントを結合してAPIパスを構成
    // 例: ["users", "search"] → /api/users/search
    const apiPath = "/api/" + pathSegments.join("/");

    // クエリパラメータをそのまま転送
    const searchParams = request.nextUrl.searchParams.toString();
    backendUrl = baseUrl + apiPath + (searchParams ? "?" + searchParams : "");
  } catch (error) {
    // サーバー設定エラー: 500を返す
    console.error("Backend URL configuration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "サーバー設定エラーが発生しました" },
      { status: 500 }
    );
  }

  // バックエンドへの転送リクエストを構築
  const contentType = request.headers.get("content-type");
  const proxyHeaders = buildProxyHeaders(accessToken, contentType);

  // リクエストボディを取得（GETやHEADリクエストにはボディなし）
  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());
  const body = hasBody ? await request.text() : undefined;

  // バックエンドにリクエストを転送
  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: method,
      headers: proxyHeaders,
      body: body,
      // fetch APIのデフォルトではリダイレクトを追跡するが、
      // プロキシではリダイレクトをそのまま返す
      redirect: "manual",
    });
  } catch (error) {
    // ネットワークエラー: バックエンドへの接続失敗
    console.error("Backend connection error:", error, "URL:", backendUrl);
    return NextResponse.json(
      {
        error: "Service Unavailable",
        message: "バックエンドサービスへの接続に失敗しました",
      },
      { status: 503 }
    );
  }

  // バックエンドのレスポンスボディを取得
  const responseBody = await backendResponse.text();

  // バックエンドのレスポンスをクライアントに返す
  // Content-Typeはバックエンドから受け取ったものを使用
  const responseContentType = backendResponse.headers.get("content-type") ?? "application/json";

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: {
      "Content-Type": responseContentType,
    },
  });
}

/**
 * GETリクエストのプロキシハンドラー
 *
 * ユーザー一覧取得（GET /api/proxy/users）や
 * ユーザー検索（GET /api/proxy/users/search?q=xxx）に対応する。
 *
 * @param request NextRequest
 * @param context ルートパラメータ（pathセグメントの配列）
 * @returns バックエンドのレスポンス
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleProxy(request, path, "GET");
}

/**
 * POSTリクエストのプロキシハンドラー
 *
 * @param request NextRequest
 * @param context ルートパラメータ（pathセグメントの配列）
 * @returns バックエンドのレスポンス
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleProxy(request, path, "POST");
}

/**
 * PUTリクエストのプロキシハンドラー
 *
 * Cloud利用可否の更新（PUT /api/proxy/users/{id}/cloud-access）に対応する。
 *
 * @param request NextRequest
 * @param context ルートパラメータ（pathセグメントの配列）
 * @returns バックエンドのレスポンス
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleProxy(request, path, "PUT");
}

/**
 * DELETEリクエストのプロキシハンドラー
 *
 * @param request NextRequest
 * @param context ルートパラメータ（pathセグメントの配列）
 * @returns バックエンドのレスポンス
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleProxy(request, path, "DELETE");
}
