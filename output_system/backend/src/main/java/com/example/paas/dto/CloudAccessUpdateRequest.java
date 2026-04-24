package com.example.paas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * Cloud利用可否更新リクエストDTO
 *
 * <p>PUT /api/users/{id}/cloud-access のリクエストボディを受け取るためのデータ転送オブジェクト。
 * api.mdのOpenAPI定義のCloudAccessUpdateRequestスキーマに対応する。</p>
 *
 * <p>リクエスト例:</p>
 * <pre>
 * {
 *   "cloudAccess": [
 *     { "cloudProvider": "AWS", "isEnabled": true },
 *     { "cloudProvider": "GCP", "isEnabled": false },
 *     { "cloudProvider": "Azure", "isEnabled": true }
 *   ]
 * }
 * </pre>
 *
 * <p>バリデーション:</p>
 * <ul>
 *   <li>cloudAccessはnullまたは空でないこと</li>
 *   <li>各エントリのcloudProviderはAWS/GCP/Azureのいずれかであること</li>
 *   <li>各エントリのisEnabledはnullでないこと</li>
 * </ul>
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloudAccessUpdateRequest {

    /**
     * Cloud利用可否の更新リスト
     * AWS/GCP/Azureの各エントリを含む
     */
    @NotEmpty(message = "cloudAccessは1件以上必要です")
    @Valid
    private List<CloudAccessEntry> cloudAccess;

    /**
     * Cloud利用可否の個別エントリ
     *
     * <p>1つのクラウドプロバイダーに対する利用可否の設定を表す。</p>
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CloudAccessEntry {

        /**
         * クラウドプロバイダー名
         * 取りうる値: "AWS", "GCP", "Azure"
         */
        @NotNull(message = "cloudProviderは必須です")
        @Pattern(regexp = "^(AWS|GCP|Azure)$", message = "cloudProviderはAWS、GCP、Azureのいずれかである必要があります")
        private String cloudProvider;

        /**
         * アクセス権の有効/無効フラグ
         * true: 利用可（有効）、false: 利用不可（無効）
         */
        @NotNull(message = "isEnabledは必須です")
        private Boolean isEnabled;
    }
}
