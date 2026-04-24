# WebAPI一覧

## エンドポイント一覧

### バックエンド API（Spring MVC）

| # | メソッド | パス | 説明 | ロール |
|---|---------|------|------|--------|
| 1 | GET | /api/users | ユーザー一覧取得 | 管理者 |
| 2 | GET | /api/users/search | ユーザー検索 | 管理者 |
| 3 | GET | /api/users/{id} | ユーザー詳細取得 | 管理者 |
| 4 | PUT | /api/users/{id}/cloud-access | Cloud利用可否更新 | 管理者 |
| 5 | GET | /api/users/me | 自分の情報取得 | 全ユーザー |
| 6 | GET | /api/users/me/cloud-access | 自分のCloud利用可否取得 | 全ユーザー |

### BFF API（Next.js API Routes）

| # | メソッド | パス | 説明 |
|---|---------|------|------|
| 1 | GET/POST | /api/auth/[...nextauth] | NextAuth.js認証ハンドラ |
| 2 | GET | /api/auth/session | セッション情報取得 |
| 3 | ALL | /api/proxy/[...path] | Spring MVCへのプロキシ |

## OpenAPI定義

```yaml
openapi: 3.0.3
info:
  title: PaaS管理システム API
  description: 社内プライベートクラウドのアクセス制御管理API
  version: 1.0.0

paths:
  /api/users:
    get:
      summary: ユーザー一覧取得
      tags:
        - users
      responses:
        '200':
          description: ユーザー一覧
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserResponse'
        '401':
          description: 未認証
        '403':
          description: 権限不足

  /api/users/search:
    get:
      summary: ユーザー検索
      tags:
        - users
      parameters:
        - name: q
          in: query
          description: 検索キーワード（社員ID、氏名、部署で部分一致検索）
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 検索結果
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserResponse'
        '401':
          description: 未認証
        '403':
          description: 権限不足

  /api/users/{id}:
    get:
      summary: ユーザー詳細取得
      tags:
        - users
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: ユーザー詳細
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserDetailResponse'
        '401':
          description: 未認証
        '403':
          description: 権限不足
        '404':
          description: ユーザー不在

  /api/users/{id}/cloud-access:
    put:
      summary: Cloud利用可否更新
      tags:
        - cloud-access
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CloudAccessUpdateRequest'
      responses:
        '200':
          description: 更新完了
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserDetailResponse'
        '401':
          description: 未認証
        '403':
          description: 権限不足
        '404':
          description: ユーザー不在

  /api/users/me:
    get:
      summary: 自分の情報取得
      tags:
        - users
      responses:
        '200':
          description: 自分のユーザー情報
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '401':
          description: 未認証

  /api/users/me/cloud-access:
    get:
      summary: 自分のCloud利用可否取得
      tags:
        - cloud-access
      responses:
        '200':
          description: 自分のCloud利用可否
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CloudAccessResponse'
        '401':
          description: 未認証

components:
  schemas:
    UserResponse:
      type: object
      properties:
        id:
          type: integer
          format: int64
        employeeId:
          type: string
        name:
          type: string
        email:
          type: string
        department:
          type: string
        position:
          type: string
        isAdmin:
          type: boolean
        cloudAccess:
          type: array
          items:
            $ref: '#/components/schemas/CloudAccessResponse'

    UserDetailResponse:
      allOf:
        - $ref: '#/components/schemas/UserResponse'

    CloudAccessResponse:
      type: object
      properties:
        id:
          type: integer
          format: int64
        cloudProvider:
          type: string
          enum:
            - AWS
            - GCP
            - Azure
        isEnabled:
          type: boolean

    CloudAccessUpdateRequest:
      type: object
      properties:
        cloudAccess:
          type: array
          items:
            type: object
            properties:
              cloudProvider:
                type: string
                enum:
                  - AWS
                  - GCP
                  - Azure
              isEnabled:
                type: boolean
            required:
              - cloudProvider
              - isEnabled
      required:
        - cloudAccess
```
