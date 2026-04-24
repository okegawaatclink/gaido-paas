package com.example.paas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * PaaS管理ポータル バックエンドAPIアプリケーションエントリーポイント
 *
 * <p>Spring Bootアプリケーションのメインクラス。
 * @SpringBootApplicationアノテーションにより、以下を自動設定する:
 * <ul>
 *   <li>コンポーネントスキャン（com.example.paasパッケージ配下）</li>
 *   <li>自動設定（Spring MVC, Security, JPA等）</li>
 *   <li>プロパティ設定の読み込み（application.yml）</li>
 * </ul>
 */
@SpringBootApplication
public class PaasApplication {

    /**
     * アプリケーション起動メソッド
     *
     * @param args コマンドライン引数
     */
    public static void main(String[] args) {
        SpringApplication.run(PaasApplication.class, args);
    }
}
