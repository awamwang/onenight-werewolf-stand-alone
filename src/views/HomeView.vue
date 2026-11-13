<template>
  <main id="主内容" tabindex="-1" class="home" aria-labelledby="home-title">
    <header class="hero">
      <p class="eyebrow"><span class="moon" aria-hidden="true"></span>单机 · 传手机</p>
      <h1 id="home-title">一夜狼人杀</h1>
      <p class="sub">配置人数与牌组，轮流传递手机完成夜行动，再集体讨论投票</p>
      <p class="meta"><span aria-hidden="true">🌙</span> 一夜定胜负 · 3–9 人 · 含 3 张底牌</p>
    </header>

    <section class="panel" aria-labelledby="config-title">
      <div class="panel-head">
        <h2 id="config-title">开局配置</h2>
        <p>设置会保存在本机，下次自动带入</p>
      </div>

      <div class="field" role="group" aria-labelledby="field-players">
        <span class="field-label" id="field-players">
          <span aria-hidden="true">👥</span>
          游戏人数
          <small>3–9 人</small>
        </span>
        <el-input-number
          v-model="playerCount"
          :min="3"
          :max="9"
          controls-position="right"
          aria-labelledby="field-players"
          @change="onPlayerCountChange"
        />
      </div>

      <div class="field" role="group" aria-labelledby="field-timeout">
        <span class="field-label" id="field-timeout">
          <span aria-hidden="true">⏱️</span>
          操作提示秒数
          <small>5–120 秒</small>
        </span>
        <el-input-number
          v-model="operateTimeout"
          :min="5"
          :max="120"
          controls-position="right"
          aria-labelledby="field-timeout"
        />
      </div>

      <div
        class="field block"
        role="group"
        aria-labelledby="field-roles"
        aria-describedby="field-roles-hint"
      >
        <div class="field-head">
          <span class="field-label" id="field-roles">
            <span aria-hidden="true">🃏</span>
            角色牌组
          </span>
          <span class="count" :class="{ warn: !牌组有效 }" role="status">
            {{ 牌组进度 }}
          </span>
        </div>

        <div class="preset-list" role="group" aria-label="默认配置">
          <button
            v-for="preset in 预设列表"
            :key="preset.id"
            type="button"
            class="preset"
            :class="{ active: 当前预设 === preset.id }"
            :aria-pressed="当前预设 === preset.id"
            @click="应用预设(preset.id)"
          >
            <span class="preset-icon" aria-hidden="true">{{ preset.icon }}</span>
            <span class="preset-body">
              <strong>{{ preset.名称 }}</strong>
              <small>{{ preset.描述 }}</small>
            </span>
            <span class="preset-check" aria-hidden="true">
              {{ 当前预设 === preset.id ? '✓' : '' }}
            </span>
          </button>
        </div>

        <div class="role-pool" role="group" aria-labelledby="pool-title">
          <p class="group-title" id="pool-title">
            <span aria-hidden="true">🃏</span>
            逐张调整 · 点 − / + 决定每种角色放几张
          </p>
          <div class="role-cards">
            <div
              v-for="资料 in 角色池"
              :key="资料.名称"
              class="role-card"
              :class="{ used: 角色张数(资料.名称) > 0 }"
            >
              <span class="role-icon" aria-hidden="true">{{ 资料.图标 }}</span>
              <span class="role-info">
                <strong class="role-name">{{ 资料.名称 }}</strong>
                <small class="role-desc">{{ 资料.一句话 }}</small>
              </span>
              <span class="role-actions">
                <button
                  type="button"
                  class="chip-btn"
                  :disabled="角色张数(资料.名称) === 0"
                  :aria-label="`移除一张${资料.名称}，当前 ${角色张数(资料.名称)} 张`"
                  @click="增减角色(资料.名称, -1)"
                >
                  −
                </button>
                <span class="role-count" :aria-label="`当前 ${角色张数(资料.名称)} 张`">
                  {{ 角色张数(资料.名称) }}
                </span>
                <button
                  type="button"
                  class="chip-btn"
                  :disabled="牌组数量 >= 需要张数"
                  :aria-label="`添加一张${资料.名称}，当前 ${角色张数(资料.名称)} 张`"
                  @click="增减角色(资料.名称, 1)"
                >
                  +
                </button>
              </span>
            </div>
          </div>
        </div>

        <p class="field-hint" id="field-roles-hint">{{ 牌组提示 }}</p>
      </div>

      <el-button type="primary" class="primary-btn" :disabled="!牌组有效" @click="start">
        <span aria-hidden="true">▶</span>
        开始游戏
      </el-button>
      <p v-if="error" class="error" role="alert">
        <span aria-hidden="true">!</span>
        {{ error }}
      </p>
    </section>

    <a v-if="lobbyUrl" class="btn-lobby" :href="lobbyUrl">
      <span aria-hidden="true">←</span>
      返回游戏大厅
    </a>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { availableRoles, LEFT_ROLE_COUNT, type RoleName } from '@/core'
import { 查找角色资料 } from '@/角色资料'
import { useGameStore } from '@/stores/game'

const store = useGameStore()
const router = useRouter()
const lobbyUrl = (import.meta.env.VITE_LOBBY_URL as string | undefined)?.trim() || ''
const error = ref('')

const playerCount = ref(store.game.playerCount)
const operateTimeout = ref(store.game.operateTimeout)

/** 点击式配置的角色池：合法角色 + 图标 + 一句话描述 */
const 角色池 = (Object.keys(availableRoles) as RoleName[]).map((名称) => ({
  ...查找角色资料(名称),
}))
const 需要张数 = computed(() => playerCount.value + LEFT_ROLE_COUNT)
const 牌组数组 = computed(() => store.rolesString.split(/[、,，\s]+/).filter(Boolean))
const 牌组数量 = computed(() => 牌组数组.value.length)
const 牌组有效 = computed(() => 牌组数量.value === 需要张数.value)

const 牌组进度 = computed(() => `已选 ${牌组数量.value} / ${需要张数.value} 张`)
const 牌组提示 = computed(() => {
  const 差额 = 需要张数.value - 牌组数量.value
  const 方案 = 当前预设.value === '自定义' ? '自定义牌组' : 当前预设.value
  if (差额 === 0) {
    return `${方案} · 共 ${需要张数.value} 张 = ${playerCount.value} 人 + ${LEFT_ROLE_COUNT} 张底牌，可以开局`
  }
  if (差额 > 0) return `${方案} · 还差 ${差额} 张，请点击 + 补齐`
  return `${方案} · 多出 ${-差额} 张，请点击 − 移除`
})

interface 预设方案 {
  id: string
  名称: string
  描述: string
  icon: string
  牌组: string[]
}

/** 三套默认配置都随人数派生，张数恒等于「人数 + 3 张底牌」 */
const 标准牌组 = computed(() => [...store.game.defaultRoleNames])
function 生成新手局(标准: string[]): string[] {
  return 标准.map((r) => (r === '狼人' || r === '预言家' || r === '村民' ? r : '村民'))
}
function 生成进阶局(标准: string[]): string[] {
  const 结果 = [...标准]
  const 新增 = ['皮匠', '酒鬼']
  let i = 0
  for (let idx = 结果.length - 1; idx >= 0 && i < 新增.length; idx -= 1) {
    if (结果[idx] === '村民') {
      结果[idx] = 新增[i]!
      i += 1
    }
  }
  return 结果
}
const 预设列表 = computed<预设方案[]>(() => {
  const 标准 = 标准牌组.value
  return [
    { id: '标准局', 名称: '标准局', 描述: '按人数推荐，攻守最均衡', icon: '🎲', 牌组: 标准 },
    {
      id: '新手局',
      名称: '新手局',
      描述: '只留狼人、预言家与村民',
      icon: '🌙',
      牌组: 生成新手局(标准),
    },
    {
      id: '进阶局',
      名称: '进阶局',
      描述: '加入皮匠与酒鬼，身份更扑朔迷离',
      icon: '🎭',
      牌组: 生成进阶局(标准),
    },
  ]
})

function 相同牌组(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')
}
const 当前预设 = computed(
  () => 预设列表.value.find((p) => 相同牌组(p.牌组, 牌组数组.value))?.id ?? '自定义',
)
/** 人数变化时按当前方案重新派生，避免自定义牌组被静默重置 */
const 选中预设 = ref(当前预设.value)
// 手动加减后若牌组恰好还原成某套预设，内部选中态也要跟着回到该预设
watch(当前预设, (v) => {
  选中预设.value = v
})

function 角色张数(role: string): number {
  return 牌组数组.value.filter((r) => r === role).length
}

function 应用预设(id: string): void {
  const preset = 预设列表.value.find((p) => p.id === id)
  if (!preset) return
  store.rolesString = preset.牌组.join('、')
  选中预设.value = id
}

function 增减角色(role: string, delta: number): void {
  const 当前 = [...牌组数组.value]
  if (delta > 0) {
    if (当前.length >= 需要张数.value) return
    当前.push(role)
  } else {
    const idx = 当前.lastIndexOf(role)
    if (idx < 0) return
    当前.splice(idx, 1)
  }
  store.rolesString = 当前.join('、')
  选中预设.value = '自定义'
}

watch(operateTimeout, (v) => {
  store.setOperateTimeout(v)
})

function onPlayerCountChange(value: number | undefined) {
  if (!value) return
  store.setPlayerCount(value)
  if (选中预设.value !== '自定义') {
    应用预设(选中预设.value)
  } else {
    const 当前 = [...牌组数组.value]
    while (当前.length > 需要张数.value) 当前.pop()
    while (当前.length < 需要张数.value) 当前.push('村民')
    store.rolesString = 当前.join('、')
  }
}

function start() {
  error.value = ''
  try {
    store.setOperateTimeout(operateTimeout.value)
    store.setPlayerCount(playerCount.value)
    store.confirmConfig()
    router.push('/game')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}
</script>

<style scoped>
.home {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  margin-inline: auto;
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--space-8) var(--space-5)
    calc(var(--space-12) + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.hero {
  padding-top: var(--space-2);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: 5px 10px;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.moon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary);
}

.hero h1 {
  margin: var(--space-4) 0 var(--space-2);
  font-size: var(--font-size-display);
  line-height: var(--line-height-tight);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text);
}

.sub {
  margin: 0;
  max-width: 40ch;
  color: var(--color-text-muted);
  line-height: var(--line-height);
}

.meta {
  margin: var(--space-3) 0 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6) var(--space-5);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(233, 184, 114, 0.045), transparent 120px),
    var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-card);
}

.panel-head h2 {
  margin: 0;
  font-size: var(--font-size-title);
  line-height: var(--line-height-tight);
  color: var(--color-text);
}

.panel-head p {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
}

.field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--space-3);
  row-gap: var(--space-2);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-line);
  color: var(--color-text);
}

.field.block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
  border-bottom: none;
  padding-bottom: 0;
}

.field-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.field-label {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--space-2);
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--color-text);
}

.field-label small {
  font-size: var(--font-size-caption);
  font-weight: 400;
  color: var(--color-text-subtle);
  white-space: nowrap;
}

.count {
  font-size: var(--font-size-caption);
  color: var(--color-success);
  font-variant-numeric: tabular-nums;
}

.count.warn {
  color: var(--color-primary);
}

.preset-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);
}

.preset {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 64px;
  padding: var(--space-3);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.preset:hover {
  border-color: var(--color-primary);
}

.preset.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.preset-icon {
  flex: 0 0 auto;
  font-size: 1.25rem;
  line-height: 1;
}

.preset-body {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.preset-body strong {
  font-size: var(--font-size-label);
  font-weight: 600;
}

.preset-body small {
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
  line-height: 1.4;
}

.preset.active .preset-body strong,
.preset.active .preset-check {
  color: var(--color-primary);
}

.preset-check {
  flex: 0 0 16px;
  color: var(--color-primary);
  font-weight: 700;
  text-align: center;
}

.role-pool {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.group-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.role-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);
}

.role-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 64px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
}

.role-card.used {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.role-icon {
  flex: 0 0 28px;
  font-size: 1.5rem;
  line-height: 1;
  text-align: center;
}

.role-info {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.role-name {
  color: var(--color-text);
  font-size: var(--font-size-label);
  font-weight: 600;
}

.role-desc {
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
  line-height: 1.4;
}

.role-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
}

.role-count {
  min-width: 20px;
  color: var(--color-primary);
  font-size: var(--font-size-label);
  font-weight: 700;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.chip-btn {
  display: grid;
  place-items: center;
  width: var(--tap-min);
  min-height: var(--tap-min);
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-primary);
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.chip-btn:hover:not(:disabled) {
  background: var(--color-primary-soft);
}

.chip-btn:disabled {
  color: var(--color-text-subtle);
  opacity: 0.45;
  cursor: default;
}

.field-hint {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
  line-height: var(--line-height);
}

.field :deep(.el-input-number) {
  width: 152px;
  min-height: var(--tap-min);
}

.primary-btn {
  width: 100%;
  height: 52px;
  font-size: var(--font-size-subtitle);
  border-radius: var(--radius-md);
}

.primary-btn span {
  margin-right: var(--space-2);
}

.error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(244, 63, 94, 0.4);
  border-radius: var(--radius-sm);
  background: rgba(244, 63, 94, 0.1);
  color: var(--color-danger-text);
  font-size: var(--font-size-label);
}

.error span {
  display: grid;
  place-items: center;
  flex: 0 0 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-danger);
  color: #fff;
  font-weight: 700;
}

.btn-lobby {
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--tap-min);
  padding: 0 var(--space-5);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-label);
  transition:
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.btn-lobby:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

@media (min-width: 600px) {
  .preset-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .role-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 380px) {
  .home {
    padding-inline: var(--space-4);
    gap: var(--space-5);
  }

  .hero h1 {
    font-size: 1.875rem;
  }

  .panel {
    padding: var(--space-5) var(--space-4);
  }

  .field {
    column-gap: var(--space-2);
  }

  .preset-body small {
    font-size: 0.75rem;
  }
}
</style>
