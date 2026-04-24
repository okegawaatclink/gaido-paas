package com.example.paas.dto;

import com.example.paas.model.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ユーザーレスポンスDTO
 *
 * <p>ユーザー情報をAPIレスポンスとして返すためのデータ転送オブジェクト。
 * Userエンティティから必要なフィールドのみを抜き出して返す。
 * cloudAccessフィールドにはCloudAccessResponseのリストを含む。</p>
 *
 * <p>レスポンス例:</p>
 * <pre>
 * {
 *   "id": 1,
 *   "employeeId": "E001",
 *   "name": "田中 太郎",
 *   "email": "tanaka.admin@example.com",
 *   "department": "情報システム部",
 *   "position": "部長",
 *   "isAdmin": true,
 *   "cloudAccess": [
 *     { "id": 1, "cloudProvider": "AWS", "isEnabled": true },
 *     { "id": 2, "cloudProvider": "GCP", "isEnabled": false },
 *     { "id": 3, "cloudProvider": "Azure", "isEnabled": true }
 *   ]
 * }
 * </pre>
 *
 * <p>このDTOはapi.mdのOpenAPI定義のUserResponseスキーマに対応する。</p>
 */
@Getter
@Builder
public class UserResponse {

    /**
     * ユーザーのサロゲートキー
     */
    private final Long id;

    /**
     * 社員ID（例: "E001"）
     */
    private final String employeeId;

    /**
     * 氏名
     */
    private final String name;

    /**
     * メールアドレス
     */
    private final String email;

    /**
     * 部署名（任意。未設定の場合はnull）
     */
    private final String department;

    /**
     * 役職（任意。未設定の場合はnull）
     */
    private final String position;

    /**
     * 管理者フラグ
     * true: 管理者、false: 一般社員
     */
    private final boolean isAdmin;

    /**
     * クラウドアクセス権リスト
     * AWS/GCP/Azure各1件、計最大3件を含む
     */
    private final List<CloudAccessResponse> cloudAccess;

    /**
     * Userエンティティ（cloudAccessesを含む）からUserResponseを生成するファクトリメソッド
     *
     * <p>N+1問題を防ぐため、このメソッドを呼び出す前にUserエンティティの
     * cloudAccessesがfetch joinまたは@EntityGraphによって一括ロードされていること。</p>
     *
     * @param user 変換元のUserエンティティ（cloudAccessesが初期化済みであること）
     * @return 変換後のUserResponseオブジェクト
     */
    public static UserResponse from(User user) {
        // cloudAccessesをCloudAccessResponseのリストに変換する
        List<CloudAccessResponse> cloudAccessList = user.getCloudAccesses() != null
                ? user.getCloudAccesses().stream()
                        .map(CloudAccessResponse::from)
                        .collect(Collectors.toList())
                : List.of();

        return UserResponse.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .position(user.getPosition())
                .isAdmin(user.isAdmin())
                .cloudAccess(cloudAccessList)
                .build();
    }
}
