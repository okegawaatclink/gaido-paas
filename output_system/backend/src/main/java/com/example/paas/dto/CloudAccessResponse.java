package com.example.paas.dto;

import com.example.paas.model.CloudAccess;
import lombok.Builder;
import lombok.Getter;

/**
 * Cloud利用可否レスポンスDTO
 *
 * <p>クラウドアクセス情報をAPIレスポンスとして返すためのデータ転送オブジェクト。
 * CloudAccessエンティティから必要なフィールドのみを抜き出して返す。</p>
 *
 * <p>レスポンス例:</p>
 * <pre>
 * {
 *   "id": 1,
 *   "cloudProvider": "AWS",
 *   "isEnabled": true
 * }
 * </pre>
 */
@Getter
@Builder
public class CloudAccessResponse {

    /**
     * クラウドアクセスレコードのサロゲートキー
     */
    private final Long id;

    /**
     * クラウドプロバイダー名
     * 取りうる値: "AWS", "GCP", "Azure"
     */
    private final String cloudProvider;

    /**
     * アクセス権の有効/無効フラグ
     * true: 利用可（有効）、false: 利用不可（無効）
     */
    private final boolean isEnabled;

    /**
     * CloudAccessエンティティからCloudAccessResponseを生成するファクトリメソッド
     *
     * @param cloudAccess 変換元のCloudAccessエンティティ
     * @return 変換後のCloudAccessResponseオブジェクト
     */
    public static CloudAccessResponse from(CloudAccess cloudAccess) {
        return CloudAccessResponse.builder()
                .id(cloudAccess.getId())
                .cloudProvider(cloudAccess.getCloudProvider())
                .isEnabled(cloudAccess.isEnabled())
                .build();
    }
}
