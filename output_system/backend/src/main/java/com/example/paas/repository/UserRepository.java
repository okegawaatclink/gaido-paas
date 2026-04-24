package com.example.paas.repository;

import com.example.paas.model.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

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
}
