/**
 * Next.js設定ファイル
 *
 * - standalone出力: Dockerイメージを最小化するためstandaloneモードを使用
 * - Next.js 14.x はnext.config.mjs形式（ESM）をサポートする
 *   next.config.tsはNext.js 15+からサポートのため、.mjsを使用する
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Docker向けにstandaloneモードを有効化（node_modulesを含む自己完結型ビルド生成）
  output: "standalone",
};

export default nextConfig;
