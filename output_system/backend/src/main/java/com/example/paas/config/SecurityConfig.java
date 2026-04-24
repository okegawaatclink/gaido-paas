package com.example.paas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Spring Security設定クラス
 *
 * KeyCloak JWTトークン検証（OAuth2 Resource Server）を設定する。
 * - /actuator/health, /actuator/info: Docker Composeのhealthcheckに使用するため認証不要
 * - /v3/api-docs, /swagger-ui/**: springdoc-openapiのドキュメントアクセスに認証不要
 * - その他のエンドポイント: JWTトークン認証必須
 *
 * Spring Security 6.x + OAuth2 Resource Serverの動作:
 * BearerTokenAuthenticationFilterはpermitAllより先に動作するため、
 * パブリックエンドポイント専用のFilterChainを@Order(1)で優先的に適用し、
 * そのFilterChainにはoauth2ResourceServerを含めない。
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * パブリックエンドポイント用のSecurityFilterChain（認証不要）
     *
     * @Order(1)で優先的に適用される。
     * OAuth2 Resource Serverを含まないため、BearerTokenAuthenticationFilterが適用されない。
     * Actuatorのヘルスチェック、OpenAPIドキュメントへのアクセスを認証なしで許可する。
     *
     * @param http HttpSecurityオブジェクト
     * @return SecurityFilterChain設定済みインスタンス
     * @throws Exception 設定エラー時
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicSecurityFilterChain(HttpSecurity http) throws Exception {
        // パブリックアクセスを許可するパス
        // 注意: /error も含める（Spring Bootのエラーハンドラーがforwardするため）
        RequestMatcher publicPaths = new OrRequestMatcher(
            new AntPathRequestMatcher("/actuator/**"),
            new AntPathRequestMatcher("/v3/api-docs/**"),
            new AntPathRequestMatcher("/swagger-ui/**"),
            new AntPathRequestMatcher("/swagger-ui.html"),
            new AntPathRequestMatcher("/error")
        );

        http
            // このFilterChainは指定パスにのみ適用する
            .securityMatcher(publicPaths)
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            // REST APIのためCSRFは無効化
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    /**
     * 保護されたエンドポイント用のSecurityFilterChain（JWT認証必須）
     *
     * @Order(2)でpublicSecurityFilterChainより後に適用される。
     * KeyCloakのJWTトークンを検証する。
     *
     * @param http HttpSecurityオブジェクト
     * @return SecurityFilterChain設定済みインスタンス
     * @throws Exception 設定エラー時
     */
    @Bean
    @Order(2)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // その他のエンドポイントはすべてJWT認証が必要
                .anyRequest().authenticated()
            )
            // OAuth2 Resource Server: KeyCloakのJWTトークンを検証する
            // issuer-uriはapplication.ymlのkeycloak.issuerから自動設定される
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {
                    // JWT検証設定: application.ymlのissuer-uriで自動構成
                })
            )
            // REST APIのためCSRFは無効化（APIクライアントはCSRFトークンを持てないため）
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
