package com.example.paas.service;

import com.example.paas.dto.CloudAccessResponse;
import com.example.paas.dto.CloudAccessUpdateRequest;
import com.example.paas.dto.UserResponse;
import com.example.paas.model.CloudAccess;
import com.example.paas.model.User;
import com.example.paas.repository.CloudAccessRepository;
import com.example.paas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ユーザーサービス
 *
 * <p>ユーザー情報に関するビジネスロジックを提供するサービスクラス。
 * UserRepositoryを介してDBアクセスを行い、DTOに変換してControllerに返す。</p>
 *
 * <p>主な機能:</p>
 * <ul>
 *   <li>全ユーザー取得: findAll() → UserResponseのリスト</li>
 *   <li>キーワード検索: search(keyword) → 部分一致したUserResponseのリスト</li>
 * </ul>
 *
 * <p>N+1問題の回避:
 * cloudAccessesを一括ロードするRepositoryメソッドを使用することで、
 * N件のユーザーに対してN回のSQLを発行するN+1問題を防いでいる。</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    /**
     * ユーザーリポジトリ（コンストラクタインジェクション）
     */
    private final UserRepository userRepository;

    /**
     * クラウドアクセスリポジトリ（コンストラクタインジェクション）
     */
    private final CloudAccessRepository cloudAccessRepository;

    /**
     * 全ユーザーをcloudAccess情報付きで取得する
     *
     * <p>GET /api/users で使用する。
     * @EntityGraphを使用したfindAllWithCloudAccesses()でN+1問題を回避する。</p>
     *
     * @return 全ユーザーのUserResponseリスト（各ユーザーはcloudAccessを含む）
     */
    public List<UserResponse> findAll() {
        log.debug("全ユーザー取得を開始する");

        // cloudAccessesを一括ロード（N+1問題回避）
        List<User> users = userRepository.findAllWithCloudAccesses();

        log.debug("全ユーザー取得完了: {}件", users.size());

        // UserエンティティをUserResponse DTOに変換して返す
        return users.stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * キーワードで部分一致検索を行う
     *
     * <p>GET /api/users/search?q=xxx で使用する。
     * 社員ID・氏名・部署でOR条件の部分一致検索（大文字小文字区別なし）を行う。
     * @EntityGraphを使用してcloudAccessesを一括ロードし、N+1問題を回避する。</p>
     *
     * <p>キーワードがnullまたは空文字の場合は全件を返す。</p>
     *
     * @param keyword 検索キーワード（社員ID・氏名・部署で部分一致）
     * @return 検索結果のUserResponseリスト（各ユーザーはcloudAccessを含む）
     */
    public List<UserResponse> search(String keyword) {
        log.debug("ユーザー検索を開始する: keyword={}", keyword);

        // キーワードがnullまたは空文字の場合は全件を返す
        if (keyword == null || keyword.isBlank()) {
            log.debug("キーワードが空のため全件を返す");
            return findAll();
        }

        // 部分一致検索（cloudAccessesを一括ロード）
        List<User> users = userRepository.searchByKeywordWithCloudAccesses(keyword);

        log.debug("ユーザー検索完了: keyword={}, 件数={}", keyword, users.size());

        // UserエンティティをUserResponse DTOに変換して返す
        return users.stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * IDでユーザー詳細をcloudAccess情報付きで取得する
     *
     * <p>GET /api/users/{id} で使用する。
     * @EntityGraphを使用してcloudAccessesを一括ロードし、N+1問題を回避する。
     * ユーザーが存在しない場合は404 Not Foundをスローする。</p>
     *
     * @param id 取得するユーザーのID
     * @return ユーザー詳細のUserResponse（cloudAccess付き）
     * @throws ResponseStatusException ユーザーが存在しない場合（404）
     */
    public UserResponse findById(Long id) {
        log.debug("ユーザー詳細取得を開始する: id={}", id);

        // cloudAccessesを一括ロード（N+1問題回避）
        User user = userRepository.findByIdWithCloudAccesses(id)
                .orElseThrow(() -> {
                    log.warn("ユーザーが見つからない: id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "ユーザーが見つかりません: id=" + id);
                });

        log.debug("ユーザー詳細取得完了: id={}, employeeId={}", id, user.getEmployeeId());

        // UserエンティティをUserResponse DTOに変換して返す
        return UserResponse.from(user);
    }

    /**
     * メールアドレスでユーザーをcloudAccess情報付きで取得する
     *
     * <p>GET /api/users/me で使用する。
     * JWTの "email" クレームを使ってDBユーザーを特定するために使用する。
     * ユーザーが存在しない場合は404 Not Foundをスローする。</p>
     *
     * @param email 検索するメールアドレス（JWTの "email" クレームから取得）
     * @return ユーザー情報のUserResponse（cloudAccess付き）
     * @throws ResponseStatusException ユーザーが存在しない場合（404）
     */
    public UserResponse findByEmail(String email) {
        log.debug("メールアドレスでユーザー取得を開始する: email={}", email);

        // メールアドレスでユーザーを検索する
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("ユーザーが見つからない: email={}", email);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "ユーザーが見つかりません: email=" + email);
                });

        // cloudAccessesを一括ロード（N+1問題回避）
        // findByEmail はcloudAccessesをEager Loadしないため、IDで再取得する
        User userWithCloudAccesses = userRepository.findByIdWithCloudAccesses(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "ユーザーが見つかりません: email=" + email));

        log.debug("メールアドレスでユーザー取得完了: email={}, employeeId={}", email, userWithCloudAccesses.getEmployeeId());

        return UserResponse.from(userWithCloudAccesses);
    }

    /**
     * メールアドレスでユーザーのCloud利用可否リストを取得する
     *
     * <p>GET /api/users/me/cloud-access で使用する。
     * JWTの "email" クレームを使ってDBユーザーを特定し、そのCloudAccess情報を返す。
     * ユーザーが存在しない場合は404 Not Foundをスローする。</p>
     *
     * @param email 検索するメールアドレス（JWTの "email" クレームから取得）
     * @return CloudAccessResponseのリスト（AWS/GCP/Azure各1件）
     * @throws ResponseStatusException ユーザーが存在しない場合（404）
     */
    public List<CloudAccessResponse> findCloudAccessByEmail(String email) {
        log.debug("メールアドレスでCloud利用可否取得を開始する: email={}", email);

        // findByEmailを利用してUserResponseを取得し、その中のcloudAccessリストを返す
        // cloudAccess情報を含むUserResponseを取得するためfindByEmailを再利用する
        UserResponse userResponse = findByEmail(email);

        log.debug("メールアドレスでCloud利用可否取得完了: email={}, 件数={}", email, userResponse.getCloudAccess().size());

        return userResponse.getCloudAccess();
    }

    /**
     * Cloud利用可否を更新する
     *
     * <p>PUT /api/users/{id}/cloud-access で使用する。
     * リクエストで指定されたcloudProvider/isEnabledの組み合わせでDBを更新する。
     * 更新はトランザクション管理（@Transactional）で行う。
     * ユーザーが存在しない場合は404 Not Foundをスローする。</p>
     *
     * <p>処理フロー:</p>
     * <ol>
     *   <li>ユーザーをIDで検索（存在しない場合は404）</li>
     *   <li>リクエストの各cloudProviderに対してCloudAccessを取得・更新</li>
     *   <li>更新後のユーザー詳細をUserResponseとして返す</li>
     * </ol>
     *
     * @param id ユーザーのID
     * @param request Cloud利用可否更新リクエスト
     * @return 更新後のユーザー詳細のUserResponse（cloudAccess付き）
     * @throws ResponseStatusException ユーザーが存在しない場合（404）
     */
    @Transactional
    public UserResponse updateCloudAccess(Long id, CloudAccessUpdateRequest request) {
        log.info("Cloud利用可否更新を開始する: id={}", id);

        // ユーザーをcloudAccesses付きで取得（存在しない場合は404）
        User user = userRepository.findByIdWithCloudAccesses(id)
                .orElseThrow(() -> {
                    log.warn("ユーザーが見つからない（Cloud利用可否更新）: id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "ユーザーが見つかりません: id=" + id);
                });

        // リクエストの各エントリについてCloudAccessを更新する
        for (CloudAccessUpdateRequest.CloudAccessEntry entry : request.getCloudAccess()) {
            log.debug("Cloud利用可否を更新する: userId={}, provider={}, isEnabled={}",
                    id, entry.getCloudProvider(), entry.getIsEnabled());

            // 対象ユーザー・プロバイダーのCloudAccessを取得
            CloudAccess cloudAccess = cloudAccessRepository
                    .findByUserIdAndCloudProvider(id, entry.getCloudProvider())
                    .orElseGet(() -> {
                        // レコードが存在しない場合は新規作成
                        // （通常はシードデータで全ユーザー×3プロバイダーのレコードが作成済み）
                        log.info("CloudAccessレコードが存在しないため新規作成: userId={}, provider={}",
                                id, entry.getCloudProvider());
                        CloudAccess newAccess = CloudAccess.builder()
                                .user(user)
                                .cloudProvider(entry.getCloudProvider())
                                .isEnabled(false)
                                .build();
                        return cloudAccessRepository.save(newAccess);
                    });

            // isEnabledを更新する
            cloudAccess.setEnabled(entry.getIsEnabled());
            cloudAccessRepository.save(cloudAccess);
        }

        log.info("Cloud利用可否更新完了: id={}", id);

        // 更新後のユーザー詳細を再取得して返す
        // （トランザクション内で更新済みのユーザーをflushしてから再取得）
        User updatedUser = userRepository.findByIdWithCloudAccesses(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "ユーザーが見つかりません: id=" + id));

        return UserResponse.from(updatedUser);
    }
}
