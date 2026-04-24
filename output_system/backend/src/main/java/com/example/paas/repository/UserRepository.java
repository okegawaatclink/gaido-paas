package com.example.paas.repository;

import com.example.paas.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ユーザーリポジトリ
 *
 * <p>usersテーブルへのCRUD操作を提供するSpring Data JPAリポジトリ。
 * CrudRepositoryを継承することで、基本的なCRUD操作（findById, save, delete等）が
 * 自動的に実装される。</p>
 *
 * <p>カスタムクエリメソッドはメソッド名からSpring Data JPAがSQLを自動生成する
 * （例: findByEmployeeId → SELECT * FROM users WHERE employee_id = ?）。</p>
 *
 * <p>N+1問題の回避:
 * ユーザー一覧取得時はcloudAccessesを一括でfetch joinするため、
 * @EntityGraph(attributePaths = {"cloudAccesses"}) を付与したメソッドを使用する。</p>
 */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

    /**
     * 社員IDでユーザーを検索する
     *
     * <p>ログイン時やAPI呼び出し時に社員IDでユーザーを特定するために使用する。
     * employee_idにはUNIQUE制約があるため、結果は0件または1件になる。</p>
     *
     * @param employeeId 検索する社員ID（例: "E001"）
     * @return 該当するユーザー。存在しない場合はOptional.empty()
     */
    Optional<User> findByEmployeeId(String employeeId);

    /**
     * メールアドレスでユーザーを検索する
     *
     * <p>KeyCloakのトークンに含まれるメールアドレスでDBユーザーを特定するために使用する。
     * emailには NOT NULL 制約のみ（UNIQUEではない）があるが、実運用では一意を期待する。</p>
     *
     * @param email 検索するメールアドレス（例: "tanaka.admin@example.com"）
     * @return 該当するユーザー。存在しない場合はOptional.empty()
     */
    Optional<User> findByEmail(String email);

    /**
     * 管理者フラグでユーザーリストを検索する
     *
     * <p>管理者一覧または一般社員一覧を取得するために使用する。</p>
     *
     * @param isAdmin 管理者フラグ（true: 管理者、false: 一般社員）
     * @return 該当するユーザーリスト
     */
    Iterable<User> findByIsAdmin(boolean isAdmin);

    /**
     * 全ユーザーをcloudAccesses付きで取得する（N+1問題回避）
     *
     * <p>@Query + @EntityGraph により cloudAccesses を LEFT JOIN FETCH で一括取得する。
     * これにより、N件のユーザーに対してN回のSQLが発行されるN+1問題を防ぐ。
     * ユーザー一覧API（GET /api/users）で使用する。</p>
     *
     * <p>メソッド名はSpring Data JPAのクエリ生成対象外にするため、
     * 明示的に @Query を指定する。</p>
     *
     * @return 全ユーザーのリスト（各ユーザーのcloudAccessesが初期化済み）
     */
    @EntityGraph(attributePaths = {"cloudAccesses"})
    @Query("SELECT u FROM User u")
    List<User> findAllWithCloudAccesses();

    /**
     * キーワードで部分一致検索を行い、cloudAccesses付きでユーザーを取得する
     *
     * <p>社員ID・氏名・部署でOR条件の大文字小文字を無視した部分一致検索を行う。
     * @EntityGraph により cloudAccesses を LEFT JOIN FETCH で一括取得する。</p>
     *
     * <p>検索条件: employee_id ILIKE %keyword% OR name ILIKE %keyword% OR department ILIKE %keyword%
     * ※ PostgreSQLのILIKEを使用して大文字小文字を区別しない検索を実現する。</p>
     *
     * <p>ユーザー検索API（GET /api/users/search?q=xxx）で使用する。</p>
     *
     * @param keyword 検索キーワード（部分一致、大文字小文字を区別しない）
     * @return 検索結果のユーザーリスト（各ユーザーのcloudAccessesが初期化済み）
     */
    @EntityGraph(attributePaths = {"cloudAccesses"})
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.employeeId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.department) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchByKeywordWithCloudAccesses(@Param("keyword") String keyword);
}
