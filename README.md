# Rust + React プロジェクトテンプレート

Rust + Axum のバックエンドと、React + TypeScript + Vite のフロントエンドを同じリポジトリで開発するための最小構成です。サンプル画面はバックエンドのヘルス確認 API に接続します。

## 必要なツール

- Rust toolchain（edition 2024 対応）
- Node.js 22.12 以上と npm

## 起動

バックエンドを起動します。

```sh
cd backend
cargo run
```

別のターミナルでフロントエンドを起動します。

```sh
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

ブラウザーで http://localhost:5173 を開くと、バックエンドの応答状態を確認できます。フロント開発サーバーはローカルの `localhost` で待ち受けます。バックエンドのヘルス確認 API は http://127.0.0.1:3000/health です。バックエンドの既定 URL を変更する場合は `frontend/.env.local` の `VITE_API_BASE_URL` を設定してください。

## 検証

バックエンド:

```sh
cd backend
cargo fmt --check
cargo test
```

フロントエンド:

```sh
cd frontend
npm test
npm run build
```
