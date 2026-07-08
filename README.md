# かくれんぼシステム (Hidenseek System)

学校でかくれんぼをするための、リアルタイム管理システムです。

## 機能

### 運営機能
- 参加者（隠れる側）の登録・削除
- 全参加者への一斉連絡
- 後鬼が捕まった人の配信

### 隠れる側機能
- 隠れる側限定のリアルタイムチャット
- 運営からの連絡受信

### セキュリティ
- 鬼と運営のための認証機能（JWT）
- パスワードハッシュ化（bcrypt）

## 技術スタック

- **フロント:** React + TypeScript
- **バック:** Node.js (Express) + TypeScript
- **リアルタイム通信:** Socket.io
- **データベース:** PostgreSQL
- **認証:** JWT + bcrypt

## セットアップ

### 必須要件
- Node.js (v16以上)
- PostgreSQL

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/Daikick1029/Ritz-.git
cd Ritz-

# バックエンドの依存関係をインストール
npm install

# フロントエンドの依存関係をインストール
cd client
npm install
cd ..

# 環境変数ファイルの作成
cp .env.example .env
```

### 開発環境の起動

```bash
# バックエンド + フロントエンドを同時に起動
npm run dev
```

バックエンドは `http://localhost:5000` で起動します。
フロントエンドは `http://localhost:3000` で起動します。

## プロジェクト構成

```
├── src/                      # バックエンドソースコード
│   ├── server.ts            # メインサーバー
│   ├── types/               # TypeScript型定義
│   ├── routes/              # APIルート
│   ├── middleware/          # Express middleware
│   ├── services/            # ビジネスロジック
│   └── socket/              # Socket.io イベントハンドラ
├── client/                   # フロントエンド (React)
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # API通信
│   │   └── App.tsx          # メインアプリ
│   └── package.json
├── docker-compose.yml        # Docker設定
├── .env.example             # 環境変数テンプレート
└── README.md                # このファイル
```

## ライセンス

MIT

## 作成者

Daikick1029
