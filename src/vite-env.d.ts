/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE: string
  readonly VITE_DEV_HOST: string
  readonly VITE_DEV_PORT: string
  readonly VITE_PREVIEW_HOST: string
  readonly VITE_PREVIEW_PORT: string
  readonly VITE_PREVIEW_ALLOWED_HOSTS?: string
  /** 大厅地址；有值时首页显示返回大厅 */
  readonly VITE_LOBBY_URL?: string
  readonly VITE_PWA_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
