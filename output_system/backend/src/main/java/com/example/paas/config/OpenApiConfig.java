package com.example.paas.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI (Swagger) 設定クラス
 *
 * <p>springdoc-openapiを使用してAPI仕様書を自動生成する設定。
 * SpringSecurityのJWT認証に対応したBearerToken認証スキームを定義する。</p>
 *
 * <p>Swagger UIには以下のURLでアクセス可能:</p>
 * <ul>
 *   <li>Swagger UI: http://localhost:3002/swagger-ui/index.html</li>
 *   <li>OpenAPI JSON: http://localhost:3002/v3/api-docs</li>
 * </ul>
 *
 * <p>SecurityConfig.javaの設定により、/v3/api-docs/** と /swagger-ui/** は
 * 認証なしでアクセス可能になっている。</p>
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "PaaS管理システム API",
        description = "社内プライベートクラウドのアクセス制御管理API",
        version = "1.0.0"
    )
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "KeyCloakから発行されたJWTアクセストークンをBearer形式で指定してください"
)
public class OpenApiConfig {
    // @OpenAPIDefinition と @SecurityScheme アノテーションで設定が完結するため、
    // Beanの定義は不要。springdoc-openapiがこのクラスをスキャンして設定を適用する。
}
