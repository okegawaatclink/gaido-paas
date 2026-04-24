# バックエンド（Spring MVC）Dockerfile
#
# ベースイメージ: ubuntu:24.04
# 理由: constraints.mdの規約により、AI Agent containerと同じベースイメージを使用する
#       異なるベースイメージを使うとaptパッケージのバージョン違いが発生する可能性がある
#
# マルチステージビルドを採用:
# Stage 1 (builder): Maven + Java 21でビルド
# Stage 2 (runner): JRE 21で本番実行（最小構成）

# =============================================================================
# Stage 1: builder - Mavenビルド
# =============================================================================
FROM ubuntu:24.04 AS builder

# ビルド時の対話プロンプトを抑制
ENV DEBIAN_FRONTEND=noninteractive

# Java 21 LTSとMavenのインストール
# - openjdk-21-jdk: Spring MVC (Java 21)のコンパイルに必要
# - maven: pom.xmlによる依存解決とビルド
RUN apt-get update && apt-get install -y \
    openjdk-21-jdk \
    maven \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 企業プロキシ用SSL証明書のコピー（オプション）
# ビルドコンテキストはdocker-compose.ymlでリポジトリルートに設定
COPY ssl-certificates/ /etc/ssl/certs/custom/

# SSL証明書をシステムCAストアに登録（Mavenのhttps通信にも適用される）
RUN if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      cp /etc/ssl/certs/custom/netskope.cer /usr/local/share/ca-certificates/netskope.crt && \
      update-ca-certificates && \
      echo "Custom CA certificate registered to system CA store"; \
    fi && \
    # Javaのトラストストアにも証明書を追加（JavaはOSのCAストアを直接使用しない）
    if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      keytool -importcert \
        -noprompt \
        -trustcacerts \
        -alias netskope \
        -file /etc/ssl/certs/custom/netskope.cer \
        -keystore /usr/lib/jvm/java-21-openjdk-amd64/lib/security/cacerts \
        -storepass changeit 2>/dev/null || true; \
    fi

WORKDIR /app

# pom.xmlを先にコピーして依存解決をキャッシュ
# ソースコード変更時に毎回依存をダウンロードしなくて済む
COPY output_system/backend/pom.xml .

# 依存パッケージのダウンロード（ソースなしでビルドエラーを起こさせずに依存のみ取得）
RUN mvn dependency:go-offline -B

# ソースコードのコピー
COPY output_system/backend/src ./src

# Mavenビルド: テストスキップでJARを生成
# テストはCI/CDパイプラインで実行するため、Dockerビルド時はスキップ
RUN mvn clean package -DskipTests -B

# =============================================================================
# Stage 2: runner - 本番実行環境（JREのみ）
# =============================================================================
FROM ubuntu:24.04 AS runner

ENV DEBIAN_FRONTEND=noninteractive

# JRE 21のインストール（JDKは不要）
RUN apt-get update && apt-get install -y \
    openjdk-21-jre-headless \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# SSL証明書（ランタイムでもKeyCloakとのHTTPS通信に必要な場合に対応）
COPY ssl-certificates/ /etc/ssl/certs/custom/
RUN if [ -f /etc/ssl/certs/custom/netskope.cer ]; then \
      cp /etc/ssl/certs/custom/netskope.cer /usr/local/share/ca-certificates/netskope.crt && \
      update-ca-certificates && \
      # JavaのトラストストアにもCA証明書を追加
      keytool -importcert \
        -noprompt \
        -trustcacerts \
        -alias netskope \
        -file /etc/ssl/certs/custom/netskope.cer \
        -keystore /usr/lib/jvm/java-21-openjdk-amd64/lib/security/cacerts \
        -storepass changeit 2>/dev/null || true; \
    fi

# セキュリティ: rootユーザーではなく専用ユーザーで実行
RUN groupadd --gid 1001 spring && \
    useradd --uid 1001 --gid spring --shell /bin/bash --create-home spring

WORKDIR /app

# ビルドステージからJARファイルをコピー
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring

# ポート設定: instance-config.mdのバックエンドホストポートに対応
EXPOSE 3002

# JVMオプション:
# - server: サーバー最適化JITを有効化
# - XX:+UseContainerSupport: Dockerコンテナのリソース制限を認識
# - Dspring.profiles.active: 本番プロファイルを指定
ENV JAVA_OPTS="-server -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# アプリケーション起動
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
