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

      <div class="field block" role="group" aria-labelledby="field-roles">
        <div class="field-head">
          <span class="field-label" id="field-roles">角色牌组</span>
          <span class="count" :class="{ warn: !牌数提示.正常 }" role="status">
            {{ 牌数提示.文本 }}
          </span>
        </div>
        <el-input
          v-model="store.rolesString"
          type="textarea"
          :rows="3"
          aria-labelledby="field-roles"
          aria-describedby="field-roles-hint"
        />
        <p class="field-hint" id="field-roles-hint">用顿号分隔角色名，牌组需含 3 张底牌。</p>
      </div>

      <el-button type="primary" class="primary-btn" @click="start">
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
import { useGameStore } from '@/stores/game'

const store = useGameStore()
const router = useRouter()
const lobbyUrl = (import.meta.env.VITE_LOBBY_URL as string | undefined)?.trim() || ''
const error = ref('')

const playerCount = ref(store.game.playerCount)
const operateTimeout = ref(store.game.operateTimeout)

/** 只做配置提示，不介入 core 的牌组校验 */
const 牌组数量 = computed(
  () => store.rolesString.split(/[、,，\s]+/).filter(Boolean).length,
)
const 牌数提示 = computed(() => {
  const 需要 = playerCount.value + 3
  const 实际 = 牌组数量.value
  if (实际 === 需要) {
    return { 文本: `已填 ${实际} 张 · 与 ${playerCount.value} 人 + 3 张底牌匹配`, 正常: true }
  }
  return { 文本: `已填 ${实际} 张 · 建议 ${需要} 张`, 正常: false }
})

watch(operateTimeout, (v) => {
  store.setOperateTimeout(v)
})

function onPlayerCountChange(value: number | undefined) {
  if (!value) return
  store.setPlayerCount(value)
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
}

.count.warn {
  color: var(--color-primary);
}

.field-hint {
  margin: calc(var(--space-2) * -1) 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
}

.field :deep(.el-input-number) {
  width: 152px;
  min-height: var(--tap-min);
}

.field :deep(.el-textarea__inner) {
  line-height: var(--line-height);
  padding: var(--space-3);
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
}
</style>
