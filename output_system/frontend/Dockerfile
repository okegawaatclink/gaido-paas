# フロントエンド（Next.js）Dockerfile
#
# ベースイメージ: ubuntu:24.04
# 理由: constraints.mdの規約により、AI Agent containerと同じベースイメージを使用する
#       異なるベースイメージを使うとaptパッケージのバージョン違いが発生する可能性がある
#
# マルチステージビルドを採用:
# Stage 1 (deps): 依存パッケージのインストール
# Stage 2 (builder): Next.jsアプリのビルド
# Stage 3 (runner): 本番実行環境（最小構成）

# =============================================================================
# Stage 1: deps - Node.js依存パッケージのインストール
# =============================================================================
FROM ubuntu:24.04 AS deps

# ビルド時の対話プロンプトを抑制
ENV DEBIAN_FRONTEND=noninteractive

# 必要なパッケージのインストール
# - curl: Node.jsインストールスクリプト取得用
# - ca-certificates: HTTPS通信用
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 企業プロキシ用SSL証明書のコピー（オプション）
# ビルドコンテキストはdocker-compose.ymlでリポジトリルートに設定しているため、
# ssl-certificates/ディレクトリを直接参照できる
COPY ssl-certificates/ /etc/ssl/certs/custom/

# SSL証明書をシステムCAストアに登録（証明書ファイルが存在する場合のみ）
RUN if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      cp /etc/ssl/certs/custom/netskope.cer /usr/local/share/ca-certificates/netskope.crt && \
      update-ca-certificates && \
      echo "Custom CA certificate registered to system CA store"; \
    fi

# Node.js 20 LTSのインストール（NodeSourceリポジトリ経由）
# Node.js 20はNext.js 14+の要件を満たすLTSバージョン
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# package.jsonと.npmrcのコピー（依存インストールのみに必要なファイル）
# ソースコードより先にコピーすることで、ソース変更時のキャッシュ活用が可能
COPY output_system/frontend/package.json ./
COPY output_system/frontend/.npmrc ./

# npm依存パッケージのインストール
# NODE_EXTRA_CA_CERTSを同一RUN内で設定することでSSL証明書を有効化
RUN if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/custom/netskope.cer; \
    fi && \
    npm install --frozen-lockfile 2>/dev/null || npm install

# =============================================================================
# Stage 2: builder - Next.jsアプリのビルド
# =============================================================================
FROM deps AS builder

WORKDIR /app

# ソースコードのコピー
COPY output_system/frontend/ .

# NODE_PATH環境変数: node_modulesを明示的に指定
ENV NODE_PATH=/app/node_modules

# Next.jsビルド
# next.config.tsのoutput: "standalone"により、実行に必要な最小ファイルセットを.next/standaloneに生成
RUN if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/custom/netskope.cer; \
    fi && \
    npm run build

# =============================================================================
# Stage 3: runner - 本番実行環境
# =============================================================================
FROM ubuntu:24.04 AS runner

ENV DEBIAN_FRONTEND=noninteractive

# 本番環境に必要な最小パッケージ
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# SSL証明書（ランタイムでも必要な場合に対応）
COPY ssl-certificates/ /etc/ssl/certs/custom/
RUN if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      cp /etc/ssl/certs/custom/netskope.cer /usr/local/share/ca-certificates/netskope.crt && \
      update-ca-certificates; \
    fi

# Node.js 20 LTSのインストール
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# セキュリティ: rootユーザーではなく専用ユーザーで実行
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

WORKDIR /app

# Next.js standaloneビルドの成果物をコピー
# standaloneモードは必要最小限のファイルのみを含む自己完結型サーバーを生成する
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# ポート設定: instance-config.mdのフロントエンドホストポートに対応
EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# NODE_EXTRA_CA_CERTS: Node.jsランタイムでカスタムCA証明書を信頼
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/custom/netskope.cer

# アプリケーション起動
CMD ["node", "server.js"]
