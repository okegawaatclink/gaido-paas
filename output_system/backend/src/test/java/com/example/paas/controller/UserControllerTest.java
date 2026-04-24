package com.example.paas.controller;

import com.example.paas.dto.CloudAccessUpdateRequest;
import com.example.paas.dto.CloudAccessUpdateRequest.CloudAccessEntry;
import com.example.paas.dto.CloudAccessResponse;
import com.example.paas.dto.UserResponse;
import com.example.paas.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserControllerのユニットテスト
 *
 * <p>このテストクラスではUserControllerのHTTPエンドポイントをテストする。
 * @WebMvcTest を使用して、サーブレットコンテキストのみをロードし、
 * UserServiceはMockitoでモック化する。</p>
 *
 * <p>テスト対象のエンドポイント:</p>
 * <ul>
 *   <li>GET /api/users/{id} - ユーザー詳細取得</li>
 *   <li>PUT /api/users/{id}/cloud-access - Cloud利用可否更新</li>
 * </ul>
 */
@WebMvcTest(UserController.class)
@DisplayName("UserController テスト")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    /** テスト用ユーザーレスポンス（管理者） */
    private UserResponse adminUserResponse;
    /** テスト用CloudAccessレスポンスリスト */
    private List<CloudAccessResponse> cloudAccessResponses;

    /**
     * テスト前のセットアップ
     *
     * <p>各テストで共通して使用するテストデータを初期化する。</p>
     */
    @BeforeEach
    void setUp() {
        // CloudAccessレスポンスの準備
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

        // 管理者ユーザーレスポンスの準備
        adminUserResponse = UserResponse.builder()
            .id(1L)
            .employeeId("E001")
            .name("田中 太郎")
            .email("tanaka.admin@example.com")
            .department("情報システム部")
            .position("部長")
            .isAdmin(true)
            .cloudAccess(cloudAccessResponses)
            .build();
    }

    // ========================================================================
    // GET /api/users/{id} テスト
    // ========================================================================

    /**
     * 【テスト対象】GET /api/users/{id}
     * 【テスト内容】存在するユーザーIDを指定した場合
     * 【期待結果】ユーザー詳細（cloudAccess付き）が200で返ること
     */
    @Test
    @DisplayName("should return user detail when user exists")
    @WithMockUser
    void getUserById_shouldReturnUserDetail_whenUserExists() throws Exception {
        // Arrange
        when(userService.findById(1L)).thenReturn(adminUserResponse);

        // Act & Assert
        mockMvc.perform(get("/api/users/1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.employeeId").value("E001"))
            .andExpect(jsonPath("$.name").value("田中 太郎"))
            .andExpect(jsonPath("$.email").value("tanaka.admin@example.com"))
            .andExpect(jsonPath("$.department").value("情報システム部"))
            .andExpect(jsonPath("$.position").value("部長"))
            .andExpect(jsonPath("$.admin").value(true))
            .andExpect(jsonPath("$.cloudAccess", hasSize(3)))
            .andExpect(jsonPath("$.cloudAccess[0].cloudProvider").value("AWS"))
            .andExpect(jsonPath("$.cloudAccess[0].enabled").value(true))
            .andExpect(jsonPath("$.cloudAccess[1].cloudProvider").value("GCP"))
            .andExpect(jsonPath("$.cloudAccess[1].enabled").value(false))
            .andExpect(jsonPath("$.cloudAccess[2].cloudProvider").value("Azure"))
            .andExpect(jsonPath("$.cloudAccess[2].enabled").value(true));

        verify(userService, times(1)).findById(1L);
    }

    /**
     * 【テスト対象】GET /api/users/{id}
     * 【テスト内容】存在しないユーザーIDを指定した場合
     * 【期待結果】404 Not Foundが返ること
     */
    @Test
    @DisplayName("should return 404 when user does not exist")
    @WithMockUser
    void getUserById_shouldReturn404_whenUserNotFound() throws Exception {
        // Arrange
        when(userService.findById(999L))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません: id=999"));

        // Act & Assert
        mockMvc.perform(get("/api/users/999")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());

        verify(userService, times(1)).findById(999L);
    }

    /**
     * 【テスト対象】GET /api/users/{id}
     * 【テスト内容】未認証ユーザーがアクセスした場合
     * 【期待結果】401 Unauthorizedが返ること
     */
    @Test
    @DisplayName("should return 401 when user is not authenticated")
    void getUserById_shouldReturn401_whenNotAuthenticated() throws Exception {
        // Act & Assert（認証なしでアクセス）
        mockMvc.perform(get("/api/users/1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());

        // Serviceは呼ばれないはず
        verify(userService, never()).findById(anyLong());
    }

    // ========================================================================
    // PUT /api/users/{id}/cloud-access テスト
    // ========================================================================

    /**
     * 【テスト対象】PUT /api/users/{id}/cloud-access
     * 【テスト内容】正常なリクエストでCloud利用可否を更新した場合
     * 【期待結果】更新後のユーザー詳細が200で返ること
     */
    @Test
    @DisplayName("should update cloud access and return updated user when request is valid")
    @WithMockUser
    void updateCloudAccess_shouldReturnUpdatedUser_whenRequestIsValid() throws Exception {
        // Arrange: 更新リクエスト（AWS→true, GCP→true, Azure→false）
        CloudAccessUpdateRequest request = CloudAccessUpdateRequest.builder()
            .cloudAccess(List.of(
                CloudAccessEntry.builder().cloudProvider("AWS").isEnabled(true).build(),
                CloudAccessEntry.builder().cloudProvider("GCP").isEnabled(true).build(),
                CloudAccessEntry.builder().cloudProvider("Azure").isEnabled(false).build()
            ))
            .build();

        // 更新後レスポンス（GCPがtrueになった）
        UserResponse updatedResponse = UserResponse.builder()
            .id(1L)
            .employeeId("E001")
            .name("田中 太郎")
            .email("tanaka.admin@example.com")
            .department("情報システム部")
            .position("部長")
            .isAdmin(true)
            .cloudAccess(List.of(
                CloudAccessResponse.builder().id(1L).cloudProvider("AWS").isEnabled(true).build(),
                CloudAccessResponse.builder().id(2L).cloudProvider("GCP").isEnabled(true).build(),
                CloudAccessResponse.builder().id(3L).cloudProvider("Azure").isEnabled(false).build()
            ))
            .build();

        when(userService.updateCloudAccess(eq(1L), any(CloudAccessUpdateRequest.class)))
            .thenReturn(updatedResponse);

        // Act & Assert
        mockMvc.perform(put("/api/users/1/cloud-access")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.cloudAccess", hasSize(3)))
            .andExpect(jsonPath("$.cloudAccess[0].cloudProvider").value("AWS"))
            .andExpect(jsonPath("$.cloudAccess[0].enabled").value(true))
            .andExpect(jsonPath("$.cloudAccess[1].cloudProvider").value("GCP"))
            .andExpect(jsonPath("$.cloudAccess[1].enabled").value(true))
            .andExpect(jsonPath("$.cloudAccess[2].cloudProvider").value("Azure"))
            .andExpect(jsonPath("$.cloudAccess[2].enabled").value(false));

        verify(userService, times(1)).updateCloudAccess(eq(1L), any(CloudAccessUpdateRequest.class));
    }

    /**
     * 【テスト対象】PUT /api/users/{id}/cloud-access
     * 【テスト内容】存在しないユーザーIDを指定した場合
     * 【期待結果】404 Not Foundが返ること
     */
    @Test
    @DisplayName("should return 404 when user does not exist on cloud access update")
    @WithMockUser
    void updateCloudAccess_shouldReturn404_whenUserNotFound() throws Exception {
        // Arrange
        CloudAccessUpdateRequest request = CloudAccessUpdateRequest.builder()
            .cloudAccess(List.of(
                CloudAccessEntry.builder().cloudProvider("AWS").isEnabled(true).build()
            ))
            .build();

        when(userService.updateCloudAccess(eq(999L), any(CloudAccessUpdateRequest.class)))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません: id=999"));

        // Act & Assert
        mockMvc.perform(put("/api/users/999/cloud-access")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound());

        verify(userService, times(1)).updateCloudAccess(eq(999L), any(CloudAccessUpdateRequest.class));
    }

    /**
     * 【テスト対象】PUT /api/users/{id}/cloud-access
     * 【テスト内容】不正なcloudProviderを含むリクエストを送信した場合
     * 【期待結果】400 Bad Requestが返ること
     *
     * 【入力例】cloudProvider: "INVALID"（AWS/GCP/Azure以外）
     */
    @Test
    @DisplayName("should return 400 when cloudProvider is invalid")
    @WithMockUser
    void updateCloudAccess_shouldReturn400_whenCloudProviderIsInvalid() throws Exception {
        // Arrange: 不正なcloudProviderを含むリクエスト
        String invalidRequest = """
            {
              "cloudAccess": [
                { "cloudProvider": "INVALID", "isEnabled": true }
              ]
            }
            """;

        // Act & Assert
        mockMvc.perform(put("/api/users/1/cloud-access")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(invalidRequest))
            .andExpect(status().isBadRequest());

        // バリデーションエラーのためServiceは呼ばれないはず
        verify(userService, never()).updateCloudAccess(anyLong(), any());
    }

    /**
     * 【テスト対象】PUT /api/users/{id}/cloud-access
     * 【テスト内容】cloudAccessが空リストのリクエストを送信した場合
     * 【期待結果】400 Bad Requestが返ること
     */
    @Test
    @DisplayName("should return 400 when cloudAccess list is empty")
    @WithMockUser
    void updateCloudAccess_shouldReturn400_whenCloudAccessIsEmpty() throws Exception {
        // Arrange: 空リストを含むリクエスト
        String emptyRequest = """
            {
              "cloudAccess": []
            }
            """;

        // Act & Assert
        mockMvc.perform(put("/api/users/1/cloud-access")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(emptyRequest))
            .andExpect(status().isBadRequest());

        verify(userService, never()).updateCloudAccess(anyLong(), any());
    }

    /**
     * 【テスト対象】PUT /api/users/{id}/cloud-access
     * 【テスト内容】未認証ユーザーがアクセスした場合
     * 【期待結果】401 Unauthorizedが返ること
     */
    @Test
    @DisplayName("should return 401 when user is not authenticated on cloud access update")
    void updateCloudAccess_shouldReturn401_whenNotAuthenticated() throws Exception {
        // Arrange
        String validRequest = """
            {
              "cloudAccess": [
                { "cloudProvider": "AWS", "isEnabled": true }
              ]
            }
            """;

        // Act & Assert（認証なしでアクセス）
        mockMvc.perform(put("/api/users/1/cloud-access")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(validRequest))
            .andExpect(status().isUnauthorized());

        // Serviceは呼ばれないはず
        verify(userService, never()).updateCloudAccess(anyLong(), any());
    }
}
