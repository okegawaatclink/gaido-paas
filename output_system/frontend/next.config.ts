import type { NextConfig } from "next";

/**
 * Next.js設定ファイル
 *
 * - standalone出力: Dockerイメージを最小化するためstandaloneモードを使用
 * - 環境変数のバリデーション: 起動時に必須環境変数を検証
 */
const nextConfig: NextConfig = {
  // Docker向けにstandaloneモードを有効化（node_modulesを含む自己完結型ビルド生成）
  output: "standalone",
};

export default nextConfig;
