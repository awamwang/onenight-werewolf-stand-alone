import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { GameStatusEnum } from '../../src/core'
import { useGameStore } from '../../src/stores/game'

function installLocalStorageMock(): void {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value))
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    clear: () => {
      map.clear()
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size
    },
  })
}

describe('Game store 响应式', () => {
  beforeEach(() => {
    installLocalStorageMock()
    setActivePinia(createPinia())
  })

  it('confirmRule 后 status 计算属性应进入 OPERATE1', () => {
    const store = useGameStore()
    // 先读取一次，模拟界面已订阅 computed
    expect(store.status).toBe(GameStatusEnum.CONFIG)

    store.confirmConfig()
    expect(store.status).toBe(GameStatusEnum.RULE)

    store.confirmRule()
    expect(store.status).toBe(GameStatusEnum.OPERATE1)
    expect(store.curPosition).toBe(1)
    expect(store.operateStage).toBe('pass')
  })

  it('切换人数时若角色数量不匹配则同步默认牌组', () => {
    const store = useGameStore()
    store.setPlayerCount(5)
    expect(store.rolesString.split('、').filter(Boolean).length).toBe(8)
    store.setPlayerCount(8)
    expect(store.rolesString.split('、').filter(Boolean).length).toBe(11)
  })
})
