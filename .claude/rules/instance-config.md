# インスタンス設定

Output System Containerの接続情報。
他のrulesやagentファイルから参照される。

## Output System Container

| 設定 | 値 |
|------|-----|
| コンテナ名（フロントエンド） | okegawaatclink-gaido-paas-output-system |
| コンテナ名（バックエンド） | okegawaatclink-gaido-paas-output-system-backend |
| Dockerネットワーク名 | okegawaatclink-gaido-paas-network |
| フロントエンドホストポート | 3001 |
| バックエンドホストポート | 3002 |
| コンテナ外からアクセスする時のフロントエンドURL | http://localhost:3001 |
| コンテナ外からアクセスする時のバックエンドURL | http://localhost:3002 |
| コンテナ内からアクセスする時のフロントエンドURL | http://okegawaatclink-gaido-paas-output-system:3001 |
| コンテナ内からアクセスする時のバックエンドURL | http://okegawaatclink-gaido-paas-output-system-backend:3002 |
