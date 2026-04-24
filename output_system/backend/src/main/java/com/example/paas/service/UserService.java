package com.example.paas.service;

import com.example.paas.dto.UserResponse;
import com.example.paas.model.User;
import com.example.paas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
