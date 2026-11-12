# 一夜狼人杀（单机传手机版）

Vue 3 + Vite 独立站，供 AWAM 棋牌大厅外链接入（同阿瓦隆模式）。

## 开发

```bash
pnpm install
pnpm dev
```

默认 http://localhost:5174/

## 生产构建

`.env.production` 中 `VITE_BASE=/werewolf/`，构建后由 nginx alias 托管 `dist/`。

```bash
pnpm build
# 服务器：./deploy.sh
```

## 大厅接入

- 路径：`/werewolf/`
- 回大厅：`VITE_LOBBY_URL=/game-lobby/`
