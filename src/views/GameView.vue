<template>
  <main id="主内容" tabindex="-1" class="game">
    <header class="top">
      <button class="restart" type="button" @click="onRestart">
        <span aria-hidden="true">↺</span>
        重新开始
      </button>
      <span class="phase" role="status" aria-live="polite">
        <span class="sr-only">当前阶段：</span>
        {{ phaseLabel }}
      </span>
    </header>

    <!-- 规则说明 -->
    <section v-if="store.status === GameStatusEnum.RULE" class="card" aria-labelledby="step-title">
      <div class="card-head">
        <p class="eyebrow">第 0 步 · 准备</p>
        <h2 id="step-title">夜晚开始</h2>
      </div>
      <p class="rule">{{ store.game.rule }}</p>
      <el-button type="primary" class="full" @click="store.confirmRule()">知道了</el-button>
    </section>

    <!-- 操作一轮 / 二轮 -->
    <template
      v-else-if="
        store.status === GameStatusEnum.OPERATE1 || store.status === GameStatusEnum.OPERATE2
      "
    >
      <PassPhoneOverlay
        v-if="store.operateStage === 'pass'"
        :key="`pass-${store.status}-${store.curPosition}`"
        :player-name="`${store.curPosition}号玩家`"
        @confirmed="store.confirmPassPhone()"
      />

      <section v-else class="card" aria-labelledby="step-title">
        <div class="card-head">
          <p class="eyebrow">{{ phaseLabel }}</p>
          <h2 id="step-title">{{ store.curPosition }}号玩家操作</h2>
        </div>

        <template v-if="store.status === GameStatusEnum.OPERATE1 && store.operateStage === 'act'">
          <div class="identity">
            <span class="identity-label">你的身份是</span>
            <strong class="identity-name">{{ store.curPlayer?.role.roleName }}</strong>
          </div>
          <p class="guide">{{ store.curPlayer?.role.operateGuide }}</p>

          <div
            v-if="(store.curPlayer?.role.operateTargets.length ?? 0) > 0"
            class="target-group"
            role="group"
            aria-labelledby="targets-title"
          >
            <p class="group-title" id="targets-title">选择操作目标</p>
            <el-checkbox-group v-model="selectedTargets" class="targets">
              <el-checkbox
                v-for="target in store.curPlayer?.role.operateTargets || []"
                :key="target"
                :value="target"
                :disabled="isTargetDisabled(target)"
              >
                {{ targetLabel(target) }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
          <p v-else class="hint">无需选择目标，直接完成操作即可</p>

          <el-button type="primary" class="full" @click="onFinishOperate1">完成操作</el-button>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </template>

        <template v-else-if="store.status === GameStatusEnum.OPERATE2 && store.operateStage === 'act'">
          <p class="hint">第二轮夜行动已就绪，查看本轮结果。</p>
          <el-button type="primary" class="full" @click="onFinishOperate2">查看结果</el-button>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </template>

        <template v-else-if="store.operateStage === 'result'">
          <div class="result-text" role="status">{{ store.operateResult }}</div>
          <p
            v-if="store.status === GameStatusEnum.OPERATE2 && store.game.operateLog[store.curPosition]"
            class="log"
          >
            上轮操作：{{ store.game.operateLog[store.curPosition].roleName }}，{{
              store.game.operateLog[store.curPosition].operate
            }}
          </p>
          <el-button type="primary" class="full" @click="onNext">下一位</el-button>
        </template>
      </section>
    </template>

    <!-- 讨论投票 -->
    <section v-else-if="store.status === GameStatusEnum.ARGUE" class="card" aria-labelledby="step-title">
      <div class="card-head">
        <p class="eyebrow">白天 · 讨论投票</p>
        <h2 id="step-title">请开始你们的表演</h2>
      </div>
      <p class="hint">讨论结束后，选择投票处决对象（可选底牌位）。</p>
      <div class="target-group" role="group" aria-labelledby="vote-title">
        <p class="group-title" id="vote-title">投票处决对象</p>
        <el-radio-group v-model="voteTarget" class="targets column">
          <el-radio v-for="target in store.game.getKillTargets()" :key="target" :value="target">
            {{ targetLabel(target) }}
          </el-radio>
        </el-radio-group>
      </div>
      <el-button type="primary" class="full" @click="onVote">投票</el-button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>

    <!-- 结果 -->
    <section v-else-if="store.status === GameStatusEnum.RESULT" class="card" aria-labelledby="step-title">
      <div class="card-head">
        <p class="eyebrow">本局结束</p>
        <h2 id="step-title">游戏结束</h2>
      </div>
      <p class="result-text" role="status">{{ store.killResult }}</p>

      <h3>最终身份</h3>
      <ul class="final-list">
        <li v-for="(player, key) in store.game.finalPlayers" :key="key">
          <span>{{ key }}号</span>
          <strong>{{ player.role.roleName }}</strong>
        </li>
      </ul>

      <h3>操作日志</h3>
      <ol class="log-list">
        <li v-for="(log, key) in store.game.operateLog" :key="key">
          <span class="log-index">{{ key }}号</span>
          <span class="log-body">{{ log.roleName }}，{{ log.operate }}</span>
        </li>
      </ol>
      <el-button type="primary" class="full" @click="onRestart">再来一局</el-button>
    </section>

    <section v-else class="card" aria-labelledby="step-title">
      <div class="card-head">
        <p class="eyebrow">状态异常</p>
        <h2 id="step-title">对局需要重来</h2>
      </div>
      <p class="hint">当前对局状态无法继续，返回配置页重新开局即可。</p>
      <el-button type="primary" class="full" @click="onRestart">返回配置</el-button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PassPhoneOverlay from '@/components/PassPhoneOverlay.vue'
import { LEFT_ROLE_COUNT } from '@/core'
import { useGameStore } from '@/stores/game'

const store = useGameStore()
const router = useRouter()
const GameStatusEnum = store.GameStatusEnum
const error = ref('')
const voteTarget = ref<number | undefined>()

const selectedTargets = computed({
  get: () => store.operateArgs,
  set: (value: number[]) => {
    const max = maxSelectable()
    store.operateArgs = value.slice(-max)
  },
})

const phaseLabel = computed(() => {
  switch (store.status) {
    case GameStatusEnum.RULE:
      return '规则'
    case GameStatusEnum.OPERATE1:
      return '夜行动 · 一'
    case GameStatusEnum.OPERATE2:
      return '夜行动 · 二'
    case GameStatusEnum.ARGUE:
      return '讨论投票'
    case GameStatusEnum.RESULT:
      return '结算'
    default:
      return '对局'
  }
})

watch(
  () => store.status,
  (status) => {
    if (status === GameStatusEnum.CONFIG) {
      router.replace('/')
    }
  },
)

function maxSelectable(): number {
  const name = store.curPlayer?.role.roleName
  if (name === '捣蛋鬼') return 2
  if (name === '预言家') return 2
  return 1
}

function isTargetDisabled(target: number): boolean {
  const name = store.curPlayer?.role.roleName
  const selected = store.operateArgs
  if (selected.includes(target)) return false
  if (selected.length >= maxSelectable()) return true
  if ((name === '强盗' || name === '捣蛋鬼') && target === store.curPosition) return true
  return false
}

function targetLabel(target: number): string {
  if (target <= store.game.playerCount) return `${target}号玩家`
  const centerIndex = target - store.game.playerCount
  return `底牌${centerIndex}（共${LEFT_ROLE_COUNT}张）`
}

function onFinishOperate1() {
  error.value = ''
  try {
    store.finishOperate1()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function onFinishOperate2() {
  error.value = ''
  try {
    store.finishOperate2()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function onNext() {
  if (store.status === GameStatusEnum.OPERATE1) {
    store.nextOperate1()
  } else {
    store.nextOperate2()
  }
}

function onVote() {
  error.value = ''
  try {
    if (voteTarget.value == null) {
      throw new Error('请选择操作目标')
    }
    store.operateArgs = [voteTarget.value]
    store.finishArgue()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function onRestart() {
  store.restart()
  router.replace('/')
}
</script>

<style scoped>
.game {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  margin-inline: auto;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 0 var(--space-5) calc(var(--space-12) + env(safe-area-inset-bottom, 0px));
}

.top {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin: 0 calc(var(--space-5) * -1) var(--space-5);
  padding: var(--space-3) var(--space-5);
  background: rgba(11, 20, 16, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-line);
}

.restart {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap-min);
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-danger-text);
  font-size: var(--font-size-label);
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.restart:hover {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.35);
}

.phase {
  padding: 6px 12px;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  white-space: nowrap;
}

.card {
  padding: var(--space-6) var(--space-5);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(233, 184, 114, 0.045), transparent 120px),
    var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.card-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.eyebrow {
  margin: 0;
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.card h2 {
  margin: 0;
  font-size: var(--font-size-title);
  line-height: var(--line-height-tight);
}

.card h3 {
  margin: var(--space-3) 0 0;
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
  font-weight: 600;
}

.rule,
.guide,
.hint {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height);
}

.rule {
  padding: var(--space-4);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-surface-raised);
}

.identity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
}

.identity-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-label);
}

.identity-name {
  color: var(--color-primary);
  font-size: var(--font-size-subtitle);
  font-weight: 700;
}

.target-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.group-title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.targets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.targets.column {
  flex-direction: column;
  align-items: stretch;
}

.targets :deep(.el-checkbox),
.targets :deep(.el-radio) {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.targets :deep(.el-checkbox:hover),
.targets :deep(.el-radio:hover) {
  border-color: var(--color-primary);
}

.targets :deep(.el-checkbox.is-checked),
.targets :deep(.el-radio.is-checked) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.full {
  width: 100%;
  height: 52px;
  font-size: var(--font-size-subtitle);
  border-radius: var(--radius-md);
}

.result-text {
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  color: var(--color-primary);
  font-size: var(--font-size-subtitle);
  font-weight: 600;
  line-height: var(--line-height);
}

.log {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
}

.final-list,
.log-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.final-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-2);
}

.final-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
  font-size: var(--font-size-label);
}

.final-list li span {
  color: var(--color-text-subtle);
}

.final-list li strong {
  color: var(--color-text);
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.log-list li {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-2) 0 var(--space-3);
  border-bottom: 1px solid var(--color-line);
  font-size: var(--font-size-caption);
}

.log-index {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-weight: 600;
}

.log-body {
  color: var(--color-text-muted);
  line-height: var(--line-height);
}

.error {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(244, 63, 94, 0.4);
  border-radius: var(--radius-sm);
  background: rgba(244, 63, 94, 0.1);
  color: var(--color-danger-text);
  font-size: var(--font-size-label);
}

@media (max-width: 380px) {
  .game {
    padding-inline: var(--space-4);
  }

  .top {
    margin-inline: calc(var(--space-4) * -1);
    padding-inline: var(--space-4);
  }

  .card {
    padding: var(--space-5) var(--space-4);
  }
}
</style>
