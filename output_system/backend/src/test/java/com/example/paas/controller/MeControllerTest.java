package com.example.paas.controller;

import com.example.paas.dto.CloudAccessResponse;
import com.example.paas.dto.UserResponse;
import com.example.paas.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MeControllerのユニットテスト
 *
 * <p>このテストクラスでは認証ユーザー自身の情報を取得するAPIをテストする。
 * @WebMvcTest を使用して、サーブレットコンテキストのみをロードし、
 * UserServiceはMockitoでモック化する。</p>
 *
 * <p>JWT認証のシミュレーション:
 * Spring Security Testの {@code jwt()} ポストプロセッサーを使用して、
 * JWTトークンをモック化する。これにより実際のKeyCloak通信なしに
 * 認証済みリクエストのテストができる。</p>
 *
 * <p>テスト対象のエンドポイント:</p>
 * <ul>
 *   <li>GET /api/users/me - 自分のユーザー情報取得</li>
 *   <li>GET /api/users/me/cloud-access - 自分のCloud利用可否取得</li>
 * </ul>
 */
@WebMvcTest(MeController.class)
@DisplayName("MeController テスト")
class MeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    /** テスト用ユーザーレスポンス（一般社員） */
    private UserResponse generalUserResponse;
    /** テスト用CloudAccessレスポンスリスト */
    private List<CloudAccessResponse> cloudAccessResponses;

    /**
     * テスト前のセットアップ
     *
     * <p>各テストで共通して使用するテストデータを初期化する。</p>
     */
    @BeforeEach
    void setUp() {
        // CloudAccessレスポンスの準備（AWS有効, GCP無効, Azure有効）
        cloudAccessResponses = List.of(
            CloudAccessResponse.builder()
                .id(1L)
                .cloudProvider("AWS")
                .isEnabled(true)
                .build(),
            CloudAccessResponse.builder()
                .id(2L)
                .cloudProvider("GCP")
                .isEnabled(false)
                .build(),
            CloudAccessResponse.builder()
                .id(3L)
                .cloudProvider("Azure")
                .isEnabled(true)
                .build()
        );

        // 一般社員ユーザーレスポンスの準備
        generalUserResponse = UserResponse.builder()
            .id(2L)
            .employeeId("E002")
            .name("佐藤 花子")
            .email("sato.hanako@example.com")
            .department("営業部")
            .position("主任")
            .isAdmin(false)
            .cloudAccess(cloudAccessResponses)
            .build();
    }

    // ========================================================================
    // GET /api/users/me テスト
    // ========================================================================

    /**
     * 【テスト対象】GET /api/users/me
     * 【テスト内容】認証済みユーザーが自分の情報を取得した場合
     * 【期待結果】JWTのemailクレームでユーザーを特定し、ユーザー情報が200で返ること
     *
     * 【前提条件】
     * - JWTにemail="sato.hanako@example.com"のクレームが含まれている
     * - DBにそのメールアドレスのユーザーが存在する
     */
    @Test
    @DisplayName("should return my user info when authenticated")
    void getMe_shouldReturnMyUserInfo_whenAuthenticated() throws Exception {
        // Arrange: userService.findByEmail のモック設定
        when(userService.findByEmail("sato.hanako@example.com")).thenReturn(generalUserResponse);

        // Act & Assert: JWTトークンをモックしてリクエストを実行
        mockMvc.perform(get("/api/users/me")
                .with(jwt().jwt(builder -> builder
                    .subject("user-subject-id")
                    .claim("email", "sato.hanako@example.com")
                    .issuedAt(Instant.now())
                    .expiresAt(Instant.now().plusSeconds(3600))
                ))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(2))
            .andExpect(jsonPath("$.employeeId").value("E002"))
            .andExpect(jsonPath("$.name").value("佐藤 花子"))
            .andExpect(jsonPath("$.email").value("sato.hanako@example.com"))
            .andExpect(jsonPath("$.department").value("営業部"))
            .andExpect(jsonPath("$.position").value("主任"))
            .andExpect(jsonPath("$.admin").value(false))
            .andExpect(jsonPath("$.cloudAccess", hasSize(3)));

        verify(userService, times(1)).findByEmail("sato.hanako@example.com");
    }

    /**
     * 【テスト対象】GET /api/users/me
     * 【テスト内容】JWTのemailクレームに対応するユーザーがDBに存在しない場合
     * 【期待結果】404 Not Foundが返ること
     */
    @Test
    @DisplayName("should return 404 when user not found by email")
    void getMe_shouldReturn404_whenUserNotFoundByEmail() throws Exception {
        // Arrange: findByEmailが404をスローするようにモック設定
        when(userService.findByEmail("unknown@example.com"))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません"));

        // Act & Assert
        mockMvc.perform(get("/api/users/me")
                .with(jwt().jwt(builder -> builder
                    .subject("unknown-subject")
                    .claim("email", "unknown@example.com")
                ))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());

        verify(userService, times(1)).findByEmail("unknown@example.com");
    }

    /**
     * 【テスト対象】GET /api/users/me
     * 【テスト内容】未認証ユーザーがアクセスした場合
     * 【期待結果】401 Unauthorizedが返ること
     */
    @Test
    @DisplayName("should return 401 when not authenticated")
    void getMe_shouldReturn401_whenNotAuthenticated() throws Exception {
        // Act & Assert（JWTなしでアクセス）
        mockMvc.perform(get("/api/users/me")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());

        // Serviceは呼ばれないはず
        verify(userService, never()).findByEmail(anyString());
    }

    // ========================================================================
    // GET /api/users/me/cloud-access テスト
    // ========================================================================

    /**
     * 【テスト対象】GET /api/users/me/cloud-access
     * 【テスト内容】認証済みユーザーが自分のCloud利用可否を取得した場合
     * 【期待結果】AWS/GCP/AzureのCloud利用可否リストが200で返ること
     *
     * 【前提条件】
     * - JWTにemail="sato.hanako@example.com"のクレームが含まれている
     * - DBにそのメールアドレスのユーザーが存在し、Cloud利用可否が設定されている
     *
     * 【期待結果の詳細】
     * - AWS: isEnabled=true（利用可）
     * - GCP: isEnabled=false（利用不可）
     * - Azure: isEnabled=true（利用可）
     */
    @Test
    @DisplayName("should return my cloud access list when authenticated")
    void getMeCloudAccess_shouldReturnCloudAccessList_whenAuthenticated() throws Exception {
        // Arrange: userService.findCloudAccessByEmail のモック設定
        when(userService.findCloudAccessByEmail("sato.hanako@example.com"))
            .thenReturn(cloudAccessResponses);

        // Act & Assert: JWTトークンをモックしてリクエストを実行
        mockMvc.perform(get("/api/users/me/cloud-access")
                .with(jwt().jwt(builder -> builder
                    .subject("user-subject-id")
                    .claim("email", "sato.hanako@example.com")
                ))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$", hasSize(3)))
            .andExpect(jsonPath("$[0].cloudProvider").value("AWS"))
            .andExpect(jsonPath("$[0].enabled").value(true))
            .andExpect(jsonPath("$[1].cloudProvider").value("GCP"))
            .andExpect(jsonPath("$[1].enabled").value(false))
            .andExpect(jsonPath("$[2].cloudProvider").value("Azure"))
            .andExpect(jsonPath("$[2].enabled").value(true));

        verify(userService, times(1)).findCloudAccessByEmail("sato.hanako@example.com");
    }

    /**
     * 【テスト対象】GET /api/users/me/cloud-access
     * 【テスト内容】JWTのemailクレームに対応するユーザーがDBに存在しない場合
     * 【期待結果】404 Not Foundが返ること
     */
    @Test
    @DisplayName("should return 404 when user not found by email for cloud access")
    void getMeCloudAccess_shouldReturn404_whenUserNotFound() throws Exception {
        // Arrange: findCloudAccessByEmailが404をスローするようにモック設定
        when(userService.findCloudAccessByEmail("unknown@example.com"))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません"));

        // Act & Assert
        mockMvc.perform(get("/api/users/me/cloud-access")
                .with(jwt().jwt(builder -> builder
                    .subject("unknown-subject")
                    .claim("email", "unknown@example.com")
                ))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());

        verify(userService, times(1)).findCloudAccessByEmail("unknown@example.com");
    }

    /**
     * 【テスト対象】GET /api/users/me/cloud-access
     * 【テスト内容】未認証ユーザーがアクセスした場合
     * 【期待結果】401 Unauthorizedが返ること
     */
    @Test
    @DisplayName("should return 401 when not authenticated for cloud access")
    void getMeCloudAccess_shouldReturn401_whenNotAuthenticated() throws Exception {
        // Act & Assert（JWTなしでアクセス）
        mockMvc.perform(get("/api/users/me/cloud-access")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());

        // Serviceは呼ばれないはず
        verify(userService, never()).findCloudAccessByEmail(anyString());
    }
}
