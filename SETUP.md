# かくれんぼシステム セットアップガイド

## 📋 必須要件

- Node.js v16以上
- npm または yarn
- PostgreSQL (Dockerで自動起動可能)

## 🚀 クイックスタート

### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリのクローン
git clone https://github.com/Daikick1029/Ritz-.git
cd Ritz-

# ルートディレクトリで依存関係をインストール
npm install

# クライアント側の依存関係もインストール
cd client
npm install
cd ..
```

### 2. 環境変数の設定

```bash
# .env.exampleをコピーして.envファイルを作成
cp .env.example .env
```

`.env`ファイルを開いて、必要に応じて設定を変更してください。

### 3. 開発環境で起動

```bash
# バックエンド + フロントエンドを同時に起動
npm run dev
```

- バックエンド: `http://localhost:5000`
- フロントエンド: `http://localhost:3000`

### 4. テストユーザーでログイン

- **運営**
  - ユーザー名: `admin`
  - パスワード: `admin123`

- **鬼**
  - ユーザー名: `oni`
  - パスワード: `oni123`

## 🐳 Docker を使用する場合

```bash
# PostgreSQL + バックエンドを起動
docker-compose up

# 別のターミナルでフロントエンドを起動
cd client
npm start
```

## 📁 プロジェクト構造

```
Ritz-/
├── src/                          # バックエンドソースコード
│   ├── server.ts                # メインサーバー
│   ├── types/
│   │   └── index.ts            # TypeScript型定義
│   ├── routes/
│   │   ├── auth.ts             # 認証API
│   │   └── game.ts             # ゲーム管理API
│   ├── middleware/
│   │   └── auth.ts             # 認証ミドルウェア
│   ├── services/
│   │   └── gameService.ts      # ゲームロジック
│   ├── socket/
│   │   └── handlers.ts         # Socket.ioイベントハンドラ
│   └── utils/
│       └── auth.ts             # 認証ユーティリティ
├── client/                       # フロントエンド (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx       # ログインページ
│   │   │   ├── AdminDashboard.tsx  # 運営ダッシュボード
│   │   │   ├── HiderPage.tsx   # 隠れる側ページ
│   │   │   └── OniPage.tsx     # 鬼ページ
│   │   ├── App.tsx             # メインアプリ
│   │   ├── index.tsx           # エントリーポイント
│   │   ├── index.css           # グローバルスタイル
│   │   └── public/
│   │       └── index.html      # HTMLテンプレート
│   └── package.json
├── package.json                  # バックエンド依存関係
├── tsconfig.json                # TypeScript設定
├── docker-compose.yml           # Docker設定
├── Dockerfile                   # バックエンドDockerfile
├── .env.example                 # 環境変数テンプレート
├── .env.production.example      # 本番環境テンプレート
└── README.md                    # このファイル
```

## 🔧 API仕様

### 認証API

#### ログイン
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

応答:
{
  "token": "eyJhbGc...",
  "role": "admin"
}
```

#### 認証確認
```
GET /api/auth/verify
Authorization: Bearer <token>

応答:
{
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "admin"
  }
}
```

### ゲーム管理API

#### セッション開始
```
POST /api/game/session/start
Authorization: Bearer <token>
```

#### 参加者一覧取得
```
GET /api/game/participants
Authorization: Bearer <token>
```

#### 参加者追加
```
POST /api/game/participants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "太郎"
}
```

#### 参加者削除
```
DELETE /api/game/participants/:id
Authorization: Bearer <token>
```

#### 参加者捕捉
```
POST /api/game/participant/:id/capture
Authorization: Bearer <token>
```

## 🔌 Socket.ioイベント

### クライアント → サーバー

- `authenticate` - 認証
- `send_message` - メッセージ送信
- `broadcast_announcement` - 一斉連絡送信
- `participant_captured` - 参加者捕捉通知

### サーバー → クライアント

- `auth_success` - 認証成功
- `auth_error` - 認証エラー
- `receive_message` - メッセージ受信
- `announcement` - 一斉連絡受信
- `participant_captured_broadcast` - 参加者捕捉通知受信

## 🔐 セキュリティに関する注意

このシステムはデモ・学習用です。本番運用する際は以下の対応が必要です:

- ✅ JWT_SECRETを強力なランダム文字列に変更
- ✅ パスワードをハッシュ化してデータベースに保存
- ✅ HTTPS/WSS通信の有効化
- ✅ データベース認証情報の厳格な管理
- ✅ レート制限の実装
- ✅ 入力値の検証とサニタイズ

## 📝 ライセンス

MIT

## 👨‍💻 開発者

Daikick1029
