package com.example.paas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ユーザーエンティティ
 *
 * <p>PaaS管理ポータルのシステム利用者（社員）情報を表すJPAエンティティ。
 * usersテーブル（db.mdのテーブル定義）に対応する。</p>
 *
 * <p>KeyCloakで認証されたユーザーのDB側情報（部署・役職・管理者フラグ等）を管理する。
 * Cloud接続情報はCloudAccessエンティティで管理する。</p>
 *
 * <ul>
 *   <li>employee_id: 社員ID（KeyCloakのサブジェクト等と対応させる想定）</li>
 *   <li>is_admin: trueの場合、管理者として全ユーザーのcloud_accessを閲覧・更新可能</li>
 * </ul>
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    /**
     * サロゲートキー（BIGSERIALで自動採番）
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 社員ID
     * 一意制約あり。例: E001, E002
     * 業務上の識別子として使用する
     */
    @Column(name = "employee_id", nullable = false, unique = true, length = 50)
    private String employeeId;

    /**
     * 氏名
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * メールアドレス
     * KeyCloakのユーザーと対応するアドレスを設定する
     */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    /**
     * 部署名
     * 任意項目。未設定の場合はnull
     */
    @Column(name = "department", length = 100)
    private String department;

    /**
     * 役職
     * 任意項目。未設定の場合はnull
     */
    @Column(name = "position", length = 100)
    private String position;

    /**
     * 管理者フラグ
     * trueの場合、管理者として全ユーザーのアクセス権管理が可能
     * デフォルトはfalse（一般社員）
     */
    @Column(name = "is_admin", nullable = false)
    @Builder.Default
    private boolean isAdmin = false;

    /**
     * レコード作成日時
     * INSERT時に自動設定される
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * レコード最終更新日時
     * INSERT時・UPDATE時に自動設定される
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * このユーザーが持つクラウドアクセス権リスト
     *
     * <p>CloudAccessエンティティのuser_idカラムで双方向関連を構築する。
     * FetchType.LAZYを指定してN+1問題を回避する。</p>
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<CloudAccess> cloudAccesses;

    /**
     * INSERT前にcreatedAt・updatedAtを自動設定する
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * UPDATE前にupdatedAtを自動更新する
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
