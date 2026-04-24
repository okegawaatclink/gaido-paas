package com.example.paas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * クラウドアクセスエンティティ
 *
 * <p>ユーザーのクラウドサービス（AWS/GCP/Azure）へのアクセス権を表すJPAエンティティ。
 * cloud_accessテーブル（db.mdのテーブル定義）に対応する。</p>
 *
 * <p>1ユーザーにつきAWS・GCP・Azureの各1件、計3件のレコードを持つことを想定する。
 * (user_id, cloud_provider)の複合ユニーク制約により重複を防ぐ。</p>
 */
@Entity
@Table(
    name = "cloud_access",
    uniqueConstraints = {
        // (user_id, cloud_provider)の複合ユニーク制約（db.mdの仕様に準拠）
        @UniqueConstraint(
            name = "uq_cloud_access_user_provider",
            columnNames = {"user_id", "cloud_provider"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloudAccess {

    /**
     * サロゲートキー（BIGSERIALで自動採番）
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * アクセス権を持つユーザー
     *
     * <p>Userエンティティへの多対一関連。
     * user_idカラムを外部キーとして使用する。
     * 遅延ロードで関連するユーザー情報を取得する。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * クラウドプロバイダー名
     * 取りうる値: "AWS", "GCP", "Azure"
     */
    @Column(name = "cloud_provider", nullable = false, length = 20)
    private String cloudProvider;

    /**
     * アクセス権の有効/無効フラグ
     * trueの場合、当該クラウドへのアクセスが許可されている
     * デフォルトはfalse（無効）
     */
    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean isEnabled = false;

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
