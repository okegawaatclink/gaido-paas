package com.example.paas.repository;

import com.example.paas.model.CloudAccess;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * クラウドアクセスリポジトリ
 *
 * <p>cloud_accessテーブルへのCRUD操作を提供するSpring Data JPAリポジトリ。
 * CrudRepositoryを継承することで、基本的なCRUD操作が自動的に実装される。</p>
 *
 * <p>主にユーザーのクラウドアクセス権の一覧取得・更新に使用される。</p>
 */
@Repository
public interface CloudAccessRepository extends CrudRepository<CloudAccess, Long> {

    /**
     * ユーザーIDに紐づくクラウドアクセス権リストを取得する
     *
     * <p>ユーザーのダッシュボード表示やアクセス権一覧取得に使用する。
     * 通常、AWS/GCP/Azureの3件が返される。</p>
     *
     * @param userId 検索するユーザーのID
     * @return 該当するクラウドアクセス権リスト
     */
    List<CloudAccess> findByUserId(Long userId);

    /**
     * ユーザーIDとクラウドプロバイダー名でアクセス権を取得する
     *
     * <p>(user_id, cloud_provider)に複合ユニーク制約があるため、結果は0件または1件。
     * 特定ユーザーの特定クラウドへのアクセス権を確認・更新する際に使用する。</p>
     *
     * @param userId         検索するユーザーのID
     * @param cloudProvider  検索するクラウドプロバイダー名（例: "AWS"）
     * @return 該当するクラウドアクセス権。存在しない場合はOptional.empty()
     */
    Optional<CloudAccess> findByUserIdAndCloudProvider(Long userId, String cloudProvider);
}
