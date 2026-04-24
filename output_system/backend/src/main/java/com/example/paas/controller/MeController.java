package com.example.paas.controller;

import com.example.paas.dto.CloudAccessResponse;
import com.example.paas.dto.UserResponse;
import com.example.paas.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 認証ユーザー自身の情報APIコントローラー
 *
 * <p>ログイン中のユーザーが自分自身の情報を取得するためのREST Controllerクラス。
 * api.mdのOpenAPI定義に従ってエンドポイントを実装する。</p>
 *
 * <p>実装するエンドポイント:</p>
 * <ul>
 *   <li>GET /api/users/me - 自分のユーザー情報取得（全ユーザーがアクセス可能）</li>
 *   <li>GET /api/users/me/cloud-access - 自分のCloud利用可否取得（全ユーザーがアクセス可能）</li>
 * </ul>
 *
 * <p>ルーティング競合の回避:
 * /api/users/{id}（UserController）と /api/users/me が競合する可能性があるが、
 * Springは固定パスセグメント（"me"）をパスパラメータ（{id}）より優先するため、
 * このControllerを別クラスに分けることで正しくルーティングされる。
 * 詳細: https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-requestmapping-uri-templates</p>
 *
 * <p>認証:
 * OAuth2 JWTトークン必須（SecurityConfig.javaで制御）。
 * JWTペイロードの "email" クレームでDBユーザーを特定する。
 * これにより一般社員・管理者両方がアクセスできる。</p>
 */
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "users", description = "ユーザー管理API")
@SecurityRequirement(name = "bearerAuth")
public class MeController {

    /**
     * ユーザーサービス（コンストラクタインジェクション）
     */
    private final UserService userService;

    /**
     * 認証ユーザー自身のユーザー情報を取得する
     *
     * <p>GET /api/users/me に対応するエンドポイント。
     * JWTトークンの "email" クレームを使ってDBからユーザー情報を取得する。
     * 管理者・一般社員どちらもアクセス可能。</p>
     *
     * <p>JWTクレームからのユーザー特定フロー:</p>
     * <ol>
     *   <li>Spring Securityが自動的にJWTをパース・検証する</li>
     *   <li>@AuthenticationPrincipal Jwt でJWTオブジェクトを取得する</li>
     *   <li>JWTの "email" クレームでDBのユーザーを検索する</li>
     *   <li>ユーザーが見つからない場合は404を返す</li>
     * </ol>
     *
     * @param jwt Spring SecurityがパースしたJWTトークン（認証済みユーザーのクレームを含む）
     * @return 認証ユーザー自身のユーザー情報（CloudAccess付き）のResponseEntity
     */
    @GetMapping
    @Operation(
        summary = "自分のユーザー情報取得",
        description = "認証ユーザー自身の情報（社員ID・氏名・部署・CloudAccess）を取得する"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "自分のユーザー情報",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "未認証"),
        @ApiResponse(responseCode = "404", description = "ユーザー不在")
    })
    public ResponseEntity<UserResponse> getMe(
            @AuthenticationPrincipal Jwt jwt) {

        // JWTの "email" クレームを取得する
        // KeyCloakのJWTには "email" クレームが含まれている
        String email = jwt.getClaimAsString("email");
        log.info("GET /api/users/me - 自分のユーザー情報取得リクエスト: email={}", email);

        // メールアドレスでDBユーザーを検索する
        UserResponse user = userService.findByEmail(email);

        log.info("GET /api/users/me - ユーザー情報取得完了: employeeId={}", user.getEmployeeId());
        return ResponseEntity.ok(user);
    }

    /**
     * 認証ユーザー自身のCloud利用可否を取得する
     *
     * <p>GET /api/users/me/cloud-access に対応するエンドポイント。
     * JWTトークンの "email" クレームを使ってDBからCloudAccess情報を取得する。
     * 管理者・一般社員どちらもアクセス可能。</p>
     *
     * <p>レスポンス例:</p>
     * <pre>
     * [
     *   { "id": 1, "cloudProvider": "AWS", "isEnabled": true },
     *   { "id": 2, "cloudProvider": "GCP", "isEnabled": false },
     *   { "id": 3, "cloudProvider": "Azure", "isEnabled": true }
     * ]
     * </pre>
     *
     * @param jwt Spring SecurityがパースしたJWTトークン（認証済みユーザーのクレームを含む）
     * @return 認証ユーザー自身のCloudAccessリスト（AWS/GCP/Azure各1件）のResponseEntity
     */
    @GetMapping("/cloud-access")
    @Operation(
        summary = "自分のCloud利用可否取得",
        description = "認証ユーザー自身のAWS/GCP/AzureのCloud利用可否を取得する"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "自分のCloud利用可否",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = CloudAccessResponse.class))
            )
        ),
        @ApiResponse(responseCode = "401", description = "未認証"),
        @ApiResponse(responseCode = "404", description = "ユーザー不在")
    })
    public ResponseEntity<List<CloudAccessResponse>> getMeCloudAccess(
            @AuthenticationPrincipal Jwt jwt) {

        // JWTの "email" クレームを取得する
        String email = jwt.getClaimAsString("email");
        log.info("GET /api/users/me/cloud-access - 自分のCloud利用可否取得リクエスト: email={}", email);

        // メールアドレスでDBユーザーを検索し、CloudAccess情報を取得する
        List<CloudAccessResponse> cloudAccess = userService.findCloudAccessByEmail(email);

        log.info("GET /api/users/me/cloud-access - Cloud利用可否取得完了: email={}, 件数={}", email, cloudAccess.size());
        return ResponseEntity.ok(cloudAccess);
    }
}
