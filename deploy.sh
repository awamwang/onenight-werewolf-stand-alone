#!/usr/bin/env bash
# 在服务器项目目录执行：构建静态资源到 dist/
# 用法：
#   ./deploy.sh
#   ssh tx-game '/opt/code/onenight-werewolf-stand-alone/deploy.sh'

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() {
  printf '[deploy] %s\n' "$*"
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '[deploy] 缺少命令: %s\n' "$1" >&2
    exit 1
  fi
}

if command -v pnpm >/dev/null 2>&1; then
  PKG=pnpm
elif command -v npm >/dev/null 2>&1; then
  PKG=npm
else
  printf '[deploy] 未找到 pnpm 或 npm，请先安装 Node.js 包管理器\n' >&2
  exit 1
fi

need_cmd node

log "工作目录: $ROOT_DIR"
log "使用: $PKG ($(node -v))"

if [[ "$PKG" == "pnpm" ]]; then
  if [[ -f pnpm-lock.yaml ]]; then
    log "安装依赖 (pnpm install --frozen-lockfile)"
    pnpm install --frozen-lockfile
  else
    log "安装依赖 (pnpm install)"
    pnpm install
  fi
  log "构建 (pnpm build)"
  pnpm build
else
  if [[ -f package-lock.json ]]; then
    log "安装依赖 (npm ci)"
    npm ci
  else
    log "安装依赖 (npm install)"
    npm install
  fi
  log "构建 (npm run build)"
  npm run build
fi

if [[ ! -f dist/index.html ]]; then
  printf '[deploy] 构建失败：未找到 dist/index.html\n' >&2
  exit 1
fi

log "完成: dist/ 已更新 ($(date '+%Y-%m-%d %H:%M:%S'))"
log "请确认 Nginx root 指向: $ROOT_DIR/dist"
