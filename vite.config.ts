import vue from '@vitejs/plugin-vue'
import path from 'path'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'

/** 规范化公共路径：空则 /，否则保证以 / 开头和结尾 */
function 规范化Base(raw: string | undefined): string {
  const value = (raw ?? '/').trim() || '/'
  if (value === '/') return '/'
  const withSlash = value.startsWith('/') ? value : `/${value}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

function 解析端口(raw: string | undefined, 默认: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 默认
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = 规范化Base(env.VITE_BASE)
  const pwaEnabled = env.VITE_PWA_ENABLED !== 'false'
  const navigateFallback = `${base}index.html`.replace(/\/{2,}/g, '/')

  return {
    base,
    plugins: [
      vue(),
      ...(pwaEnabled
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
              manifest: {
                name: '一夜狼人杀',
                short_name: '狼人杀',
                description: '一夜终极狼人杀单机传手机版',
                theme_color: '#0b1410',
                background_color: '#0b1410',
                display: 'standalone',
                orientation: 'portrait',
                scope: base,
                start_url: base,
                lang: 'zh-CN',
                icons: [
                  {
                    src: 'pwa-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
                navigateFallback,
                navigateFallbackDenylist: [/^\/api\//],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: 解析端口(env.VITE_DEV_PORT, 5174),
    },
    preview: {
      host: env.VITE_PREVIEW_HOST || '127.0.0.1',
      port: 解析端口(env.VITE_PREVIEW_PORT, 5006),
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '*.loca.lt',
        '*.ngrok-free.app',
        ...(env.VITE_PREVIEW_ALLOWED_HOSTS
          ? env.VITE_PREVIEW_ALLOWED_HOSTS.split(',')
              .map((h: string) => h.trim())
              .filter(Boolean)
          : []),
      ],
    },
    test: {
      exclude: [...configDefaults.exclude, '**/Test/e2e/**'],
    },
  }
})
