<template>
  <div class="home">
    <header class="hero">
      <p class="eyebrow">单机传手机</p>
      <h1>一夜狼人杀</h1>
      <p class="sub">配置人数与牌组后，轮流传递手机完成夜行动与投票</p>
    </header>

    <section class="panel">
      <label class="field">
        <span>游戏人数（3–9）</span>
        <el-input-number
          v-model="playerCount"
          :min="3"
          :max="9"
          controls-position="right"
          @change="onPlayerCountChange"
        />
      </label>
      <label class="field">
        <span>操作提示秒数</span>
        <el-input-number v-model="operateTimeout" :min="5" :max="120" controls-position="right" />
      </label>
      <label class="field block">
        <span>角色（用顿号分隔，含 3 张底牌）</span>
        <el-input v-model="store.rolesString" type="textarea" :rows="3" />
      </label>
      <el-button type="primary" class="primary-btn" @click="start">开始游戏</el-button>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <a v-if="lobbyUrl" class="btn-lobby" :href="lobbyUrl">返回游戏大厅</a>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const store = useGameStore()
const router = useRouter()
const lobbyUrl = (import.meta.env.VITE_LOBBY_URL as string | undefined)?.trim() || ''
const error = ref('')

const playerCount = ref(store.game.playerCount)
const operateTimeout = ref(store.game.operateTimeout)

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
  overflow: auto;
  padding: 28px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background:
    radial-gradient(ellipse at top, rgba(120, 40, 40, 0.35), transparent 55%),
    linear-gradient(180deg, #142014 0%, #0b120b 100%);
}

.hero h1 {
  margin: 8px 0;
  font-size: 2rem;
  color: var(--color-accent);
}

.eyebrow {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.sub {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text);
}

.field.block {
  flex-direction: column;
  align-items: stretch;
}

.primary-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
}

.error {
  margin: 0;
  color: #ff8a8a;
}

.btn-lobby {
  align-self: center;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-lobby:active {
  color: #fff;
}
</style>
