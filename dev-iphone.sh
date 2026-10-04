#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# 設定
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

# デフォルト値
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_PORT=5173
BACKEND_PORT=3000

# Rustup / Cargo の環境を読み込む
if [[ -f "$HOME/.cargo/env" ]]; then
    source "$HOME/.cargo/env"
fi
# ============================================================
# .env.local 読み込み
# ============================================================

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE が見つかりません。"
    echo
    echo "以下の内容で作成してください:"
    echo
    echo "TAILSCALE_HOST=your-host.your-tailnet.ts.net"
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${TAILSCALE_HOST:?TAILSCALE_HOST が .env.local に設定されていません}"


# ============================================================
# 必要なコマンドの確認
# ============================================================

for cmd in cargo npm tailscale; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: '$cmd' が見つかりません。"
        exit 1
    fi
done

if [[ ! -d "$FRONTEND_DIR" ]]; then
    echo "Error: Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

if [[ ! -d "$BACKEND_DIR" ]]; then
    echo "Error: Backend directory not found: $BACKEND_DIR"
    exit 1
fi


# ============================================================
# Tailscale 接続確認
# ============================================================

if ! tailscale status >/dev/null 2>&1; then
    echo "Error: Tailscale が起動していないか、ログインされていません。"
    echo "sudo tailscale up"
    echo "などで接続を確認してください。"
    exit 1
fi


# ============================================================
# 終了処理
# ============================================================

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo
    echo "Stopping development servers..."

    if [[ -n "$FRONTEND_PID" ]]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi

    if [[ -n "$BACKEND_PID" ]]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi

    wait 2>/dev/null || true

    echo "Stopped."
}

trap cleanup EXIT INT TERM


# ============================================================
# Rust backend
# ============================================================

echo "Starting Rust backend..."
echo "  http://127.0.0.1:$BACKEND_PORT"

(
    cd "$BACKEND_DIR"
    cargo run
) &

BACKEND_PID=$!


# ============================================================
# React / Vite
# ============================================================

echo
echo "Starting React frontend..."
echo "  http://127.0.0.1:$FRONTEND_PORT"

(
    cd "$FRONTEND_DIR"

    # Tailscale Serve の *.ts.net Host をViteで許可する。
    export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$TAILSCALE_HOST"

    npm run dev
) &

FRONTEND_PID=$!


# ============================================================
# Tailscale Serve
# ============================================================

echo
echo "Configuring Tailscale Serve..."

sudo tailscale serve --bg "$FRONTEND_PORT"


# ============================================================
# 起動完了
# ============================================================

echo
echo "============================================================"
echo " Ready"
echo "============================================================"
echo
echo "Frontend:"
echo "  http://127.0.0.1:$FRONTEND_PORT"
echo
echo "Backend:"
echo "  http://127.0.0.1:$BACKEND_PORT"
echo
echo "iPhone:"
echo "  https://$TAILSCALE_HOST"
echo
echo "Press Ctrl+C to stop Rust and Vite."
echo
echo "============================================================"
echo

# Rust または Vite のどちらかが終了するまで待つ
wait -n "$BACKEND_PID" "$FRONTEND_PID"

echo
echo "One of the development servers stopped."