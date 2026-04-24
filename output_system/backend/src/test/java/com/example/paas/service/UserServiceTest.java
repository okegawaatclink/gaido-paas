package com.example.paas.service;

import com.example.paas.dto.UserResponse;
import com.example.paas.model.CloudAccess;
import com.example.paas.model.User;
import com.example.paas.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * UserServiceのユニットテスト
 *
 * <p>このテストクラスではUserServiceのビジネスロジックをテストする。
 * UserRepositoryはMockitoでモック化し、DBアクセスを行わない単体テストとする。</p>
 *
 * <p>テスト対象のメソッド:</p>
 * <ul>
 *   <li>findAll() - 全ユーザー取得</li>
 *   <li>search(keyword) - キーワード検索</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService テスト")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    /** テスト用ユーザー1（管理者） */
    private User adminUser;
    /** テスト用ユーザー2（一般社員） */
    private User generalUser;
    /** テスト用CloudAccessリスト（AWS有効） */
    private List<CloudAccess> cloudAccesses;

    /**
     * テスト前のセットアップ
     *
     * <p>各テストで共通して使用するテストデータを初期化する。</p>
     */
    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();

        // 管理者ユーザーのCloudAccess
        CloudAccess awsAccess = CloudAccess.builder()
                .id(1L)
                .cloudProvider("AWS")
                .isEnabled(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        CloudAccess gcpAccess = CloudAccess.builder()
                .id(2L)
                .cloudProvider("GCP")
                .isEnabled(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        CloudAccess azureAccess = CloudAccess.builder()
                .id(3L)
                .cloudProvider("Azure")
                .isEnabled(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        cloudAccesses = List.of(awsAccess, gcpAccess, azureAccess);

        // 管理者ユーザー
        adminUser = User.builder()
                .id(1L)
                .employeeId("E001")
                .name("田中 太郎")
                .email("tanaka.admin@example.com")
                .department("情報システム部")
                .position("部長")
                .isAdmin(true)
                .cloudAccesses(cloudAccesses)
                .createdAt(now)
                .updatedAt(now)
                .build();
        // CloudAccessにuserを設定
        cloudAccesses.forEach(ca -> ca.setUser(adminUser));

        // 一般社員ユーザーのCloudAccess
        CloudAccess satoAwsAccess = CloudAccess.builder()
                .id(4L)
                .cloudProvider("AWS")
                .isEnabled(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        CloudAccess satoGcpAccess = CloudAccess.builder()
                .id(5L)
                .cloudProvider("GCP")
                .isEnabled(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        CloudAccess satoAzureAccess = CloudAccess.builder()
                .id(6L)
                .cloudProvider("Azure")
                .isEnabled(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // 一般社員ユーザー
        generalUser = User.builder()
                .id(2L)
                .employeeId("E002")
                .name("佐藤 花子")
                .email("sato.hanako@example.com")
                .department("営業部")
                .position("主任")
                .isAdmin(false)
                .cloudAccesses(List.of(satoAwsAccess, satoGcpAccess, satoAzureAccess))
                .createdAt(now)
                .updatedAt(now)
                .build();
        satoAwsAccess.setUser(generalUser);
        satoGcpAccess.setUser(generalUser);
        satoAzureAccess.setUser(generalUser);
    }

    // ========================================================================
    // findAll() テスト
    // ========================================================================

    /**
     * 【テスト対象】UserService#findAll
     * 【テスト内容】ユーザーが存在する場合
     * 【期待結果】全ユーザーのリストをUserResponseに変換して返すこと
     */
    @Test
    @DisplayName("should return all users when users exist")
    void findAll_shouldReturnAllUsers() {
        // Arrange
        when(userRepository.findAllWithCloudAccesses()).thenReturn(List.of(adminUser, generalUser));

        // Act
        List<UserResponse> result = userService.findAll();

        // Assert
        assertThat(result).hasSize(2);

        // 管理者ユーザーの検証
        UserResponse adminResponse = result.get(0);
        assertThat(adminResponse.getEmployeeId()).isEqualTo("E001");
        assertThat(adminResponse.getName()).isEqualTo("田中 太郎");
        assertThat(adminResponse.getDepartment()).isEqualTo("情報システム部");
        assertThat(adminResponse.isAdmin()).isTrue();
        assertThat(adminResponse.getCloudAccess()).hasSize(3);

        // CloudAccessの検証
        assertThat(adminResponse.getCloudAccess().get(0).getCloudProvider()).isEqualTo("AWS");
        assertThat(adminResponse.getCloudAccess().get(0).isEnabled()).isTrue();
        assertThat(adminResponse.getCloudAccess().get(1).getCloudProvider()).isEqualTo("GCP");
        assertThat(adminResponse.getCloudAccess().get(1).isEnabled()).isFalse();

        // 一般社員ユーザーの検証
        UserResponse generalResponse = result.get(1);
        assertThat(generalResponse.getEmployeeId()).isEqualTo("E002");
        assertThat(generalResponse.getName()).isEqualTo("佐藤 花子");
        assertThat(generalResponse.isAdmin()).isFalse();

        // Repositoryが1回呼ばれることを確認
        verify(userRepository, times(1)).findAllWithCloudAccesses();
    }

    /**
     * 【テスト対象】UserService#findAll
     * 【テスト内容】ユーザーが存在しない場合
     * 【期待結果】空のリストを返すこと
     */
    @Test
    @DisplayName("should return empty list when no users exist")
    void findAll_shouldReturnEmptyList_whenNoUsersExist() {
        // Arrange
        when(userRepository.findAllWithCloudAccesses()).thenReturn(List.of());

        // Act
        List<UserResponse> result = userService.findAll();

        // Assert
        assertThat(result).isEmpty();
        verify(userRepository, times(1)).findAllWithCloudAccesses();
    }

    // ========================================================================
    // search(keyword) テスト
    // ========================================================================

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】有効なキーワードで検索した場合
     * 【期待結果】キーワードに一致するユーザーのリストを返すこと
     */
    @Test
    @DisplayName("should return matching users when keyword is valid")
    void search_shouldReturnMatchingUsers_whenKeywordIsValid() {
        // Arrange（社員IDで検索: "E001"）
        when(userRepository.searchByKeywordWithCloudAccesses("E001")).thenReturn(List.of(adminUser));

        // Act
        List<UserResponse> result = userService.search("E001");

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmployeeId()).isEqualTo("E001");
        assertThat(result.get(0).getName()).isEqualTo("田中 太郎");

        // searchByKeywordWithCloudAccessesが1回呼ばれることを確認
        verify(userRepository, times(1)).searchByKeywordWithCloudAccesses("E001");
        verify(userRepository, never()).findAllWithCloudAccesses();
    }

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】氏名で検索した場合
     * 【期待結果】氏名に一致するユーザーのリストを返すこと
     */
    @Test
    @DisplayName("should return matching users when searching by name")
    void search_shouldReturnMatchingUsers_whenSearchingByName() {
        // Arrange（氏名で検索: "佐藤"）
        when(userRepository.searchByKeywordWithCloudAccesses("佐藤")).thenReturn(List.of(generalUser));

        // Act
        List<UserResponse> result = userService.search("佐藤");

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("佐藤 花子");
        assertThat(result.get(0).getDepartment()).isEqualTo("営業部");
    }

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】部署で検索した場合
     * 【期待結果】部署に一致するユーザーのリストを返すこと
     */
    @Test
    @DisplayName("should return matching users when searching by department")
    void search_shouldReturnMatchingUsers_whenSearchingByDepartment() {
        // Arrange（部署で検索: "情報システム"）
        when(userRepository.searchByKeywordWithCloudAccesses("情報システム")).thenReturn(List.of(adminUser));

        // Act
        List<UserResponse> result = userService.search("情報システム");

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDepartment()).isEqualTo("情報システム部");
    }

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】検索結果が0件の場合
     * 【期待結果】空のリストを返すこと
     */
    @Test
    @DisplayName("should return empty list when no users match the keyword")
    void search_shouldReturnEmptyList_whenNoUsersMatch() {
        // Arrange（存在しないキーワードで検索）
        when(userRepository.searchByKeywordWithCloudAccesses("存在しない")).thenReturn(List.of());

        // Act
        List<UserResponse> result = userService.search("存在しない");

        // Assert
        assertThat(result).isEmpty();
        verify(userRepository, times(1)).searchByKeywordWithCloudAccesses("存在しない");
    }

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】キーワードがnullの場合
     * 【期待結果】全件を返すこと（findAll()と同等）
     */
    @Test
    @DisplayName("should return all users when keyword is null")
    void search_shouldReturnAllUsers_whenKeywordIsNull() {
        // Arrange
        when(userRepository.findAllWithCloudAccesses()).thenReturn(List.of(adminUser, generalUser));

        // Act
        List<UserResponse> result = userService.search(null);

        // Assert
        assertThat(result).hasSize(2);
        // findAllWithCloudAccessesが呼ばれることを確認（searchByKeywordWithCloudAccessesは呼ばれない）
        verify(userRepository, times(1)).findAllWithCloudAccesses();
        verify(userRepository, never()).searchByKeywordWithCloudAccesses(anyString());
    }

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】キーワードが空文字の場合
     * 【期待結果】全件を返すこと（findAll()と同等）
     */
    @Test
    @DisplayName("should return all users when keyword is empty string")
    void search_shouldReturnAllUsers_whenKeywordIsEmpty() {
        // Arrange
        when(userRepository.findAllWithCloudAccesses()).thenReturn(List.of(adminUser, generalUser));

        // Act
        List<UserResponse> result = userService.search("");

        // Assert
        assertThat(result).hasSize(2);
        verify(userRepository, times(1)).findAllWithCloudAccesses();
        verify(userRepository, never()).searchByKeywordWithCloudAccesses(anyString());
    }

    /**
     * 【テスト対象】UserService#search
     * 【テスト内容】キーワードが空白文字のみの場合
     * 【期待結果】全件を返すこと（findAll()と同等）
     */
    @Test
    @DisplayName("should return all users when keyword contains only whitespace")
    void search_shouldReturnAllUsers_whenKeywordIsBlank() {
        // Arrange
        when(userRepository.findAllWithCloudAccesses()).thenReturn(List.of(adminUser, generalUser));

        // Act
        List<UserResponse> result = userService.search("   ");

        // Assert
        assertThat(result).hasSize(2);
        verify(userRepository, times(1)).findAllWithCloudAccesses();
        verify(userRepository, never()).searchByKeywordWithCloudAccesses(anyString());
    }
}
