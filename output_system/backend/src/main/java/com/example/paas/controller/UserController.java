package com.example.paas.controller;

import com.example.paas.dto.UserResponse;
import com.example.paas.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * ユーザーAPIコントローラー
 *
 * <p>管理者向けのユーザー管理APIエンドポイントを提供するREST Controllerクラス。
 * api.mdのOpenAPI定義に従ってエンドポイントを実装する。</p>
 *
 * <p>実装するエンドポイント:</p>
 * <ul>
 *   <li>GET /api/users - 全ユーザー一覧取得（cloudAccess付き）</li>
 *   <li>GET /api/users/search?q=xxx - ユーザー検索（社員ID・氏名・部署で部分一致）</li>
 * </ul>
 *
 * <p>認証: OAuth2 JWTトークン必須（SecurityConfig.javaで制御）。
 * 管理者ロールの確認はSpring Securityで行うが、現時点では認証のみ確認し
 * 認可（管理者ロールのみ許可）はフロントエンドのミドルウェアで制御する。</p>
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "users", description = "ユーザー管理API")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    /**
     * ユーザーサービス（コンストラクタインジェクション）
     */
    private final UserService userService;

    /**
     * 全ユーザー一覧を取得する
     *
     * <p>GET /api/users に対応するエンドポイント。
     * 全ユーザーの情報（社員ID・氏名・部署・CloudAccess）をリストで返す。
     * ページネーションなし（全件取得）。</p>
     *
     * <p>CloudAccessはユーザーごとにAWS/GCP/Azure計3件のレコードを含む。
     * N+1問題を回避するため、fetch joinで一括取得している。</p>
     *
     * @return ユーザー一覧（CloudAccess付き）のResponseEntity
     */
    @GetMapping
    @Operation(
        summary = "ユーザー一覧取得",
        description = "全ユーザーの情報をCloudAccess付きで取得する（ページネーションなし）"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "ユーザー一覧",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = UserResponse.class))
            )
        ),
        @ApiResponse(responseCode = "401", description = "未認証"),
        @ApiResponse(responseCode = "403", description = "権限不足")
    })
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        log.info("GET /api/users - 全ユーザー取得リクエスト");

        List<UserResponse> users = userService.findAll();

        log.info("GET /api/users - 取得件数: {}", users.size());
        return ResponseEntity.ok(users);
    }

    /**
     * ユーザーをキーワード検索する
     *
     * <p>GET /api/users/search?q=xxx に対応するエンドポイント。
     * 社員ID・氏名・部署でOR条件の部分一致検索（大文字小文字区別なし）を行う。</p>
     *
     * <p>検索キーワードが空の場合は全件を返す（getAllUsers()と同等）。</p>
     *
     * @param q 検索キーワード（社員ID・氏名・部署で部分一致）
     * @return 検索結果のユーザーリスト（CloudAccess付き）のResponseEntity
     */
    @GetMapping("/search")
    @Operation(
        summary = "ユーザー検索",
        description = "社員ID・氏名・部署でOR条件の部分一致検索（大文字小文字区別なし）を行う"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "検索結果",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = UserResponse.class))
            )
        ),
        @ApiResponse(responseCode = "401", description = "未認証"),
        @ApiResponse(responseCode = "403", description = "権限不足")
    })
    public ResponseEntity<List<UserResponse>> searchUsers(
            @Parameter(description = "検索キーワード（社員ID、氏名、部署で部分一致検索）", required = true)
            @RequestParam("q") String q) {

        log.info("GET /api/users/search - 検索リクエスト: q={}", q);

        List<UserResponse> users = userService.search(q);

        log.info("GET /api/users/search - 検索件数: {}, keyword={}", users.size(), q);
        return ResponseEntity.ok(users);
    }
}
