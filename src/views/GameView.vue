<template>
  <div class="game">
    <header class="top">
      <button class="link" type="button" @click="onRestart">重新开始</button>
      <span class="phase">{{ phaseLabel }}</span>
    </header>

    <!-- 规则说明 -->
    <section v-if="store.status === GameStatusEnum.RULE" class="card">
      <h2>夜晚开始</h2>
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

      <section v-else class="card">
        <h2>{{ store.curPosition }}号玩家操作</h2>

        <template v-if="store.status === GameStatusEnum.OPERATE1 && store.operateStage === 'act'">
          <p class="role">
            你的身份是
            <strong>{{ store.curPlayer?.role.roleName }}</strong>
          </p>
          <p class="guide">{{ store.curPlayer?.role.operateGuide }}</p>

          <el-checkbox-group
            v-if="(store.curPlayer?.role.operateTargets.length ?? 0) > 0"
            v-model="selectedTargets"
            class="targets"
          >
            <el-checkbox
              v-for="target in store.curPlayer?.role.operateTargets || []"
              :key="target"
              :value="target"
              :disabled="isTargetDisabled(target)"
            >
              {{ targetLabel(target) }}
            </el-checkbox>
          </el-checkbox-group>
          <p v-else class="hint">无需选择目标，直接完成操作即可</p>

          <el-button type="primary" class="full" @click="onFinishOperate1">完成操作</el-button>
          <p v-if="error" class="error">{{ error }}</p>
        </template>

        <template v-else-if="store.status === GameStatusEnum.OPERATE2 && store.operateStage === 'act'">
          <el-button type="primary" class="full" @click="onFinishOperate2">查看结果</el-button>
          <p v-if="error" class="error">{{ error }}</p>
        </template>

        <template v-else-if="store.operateStage === 'result'">
          <div class="result" v-html="store.operateResult"></div>
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
    <section v-else-if="store.status === GameStatusEnum.ARGUE" class="card">
      <h2>请开始你们的表演</h2>
      <p class="hint">选择投票处决对象（可选底牌位）</p>
      <el-radio-group v-model="voteTarget" class="targets column">
        <el-radio v-for="target in store.game.getKillTargets()" :key="target" :value="target">
          {{ targetLabel(target) }}
        </el-radio>
      </el-radio-group>
      <el-button type="primary" class="full" @click="onVote">投票</el-button>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <!-- 结果 -->
    <section v-else-if="store.status === GameStatusEnum.RESULT" class="card">
      <h2>游戏结束</h2>
      <p class="result">{{ store.killResult }}</p>
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
          {{ key }}号：{{ log.roleName }}，{{ log.operate }}
        </li>
      </ol>
      <el-button type="primary" class="full" @click="onRestart">再来一局</el-button>
    </section>

    <section v-else class="card">
      <p>对局状态异常，请重新开始</p>
      <el-button type="primary" class="full" @click="onRestart">返回配置</el-button>
    </section>
  </div>
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
  overflow: auto;
  padding: 16px 16px 40px;
  background: linear-gradient(180deg, #142014 0%, #0b120b 100%);
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.link {
  background: none;
  border: none;
  color: #ff8a8a;
  text-decoration: underline;
  padding: 8px;
  cursor: pointer;
}

.phase {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.card {
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card h2 {
  margin: 0;
  font-size: 1.35rem;
}

.card h3 {
  margin: 8px 0 0;
  font-size: 1rem;
  color: var(--color-text-muted);
}

.rule,
.guide,
.hint {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.role {
  text-align: center;
  font-size: 1.1rem;
}

.role strong {
  color: var(--color-accent);
  font-size: 1.35rem;
  margin-left: 6px;
}

.targets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.targets.column {
  flex-direction: column;
  align-items: flex-start;
}

.full {
  width: 100%;
  height: 48px;
}

.result {
  color: var(--color-accent);
  font-size: 1.1rem;
  line-height: 1.6;
}

.log {
  color: var(--color-text-subtle);
  font-size: 0.9rem;
}

.final-list,
.log-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.final-list li,
.log-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.error {
  margin: 0;
  color: #ff8a8a;
}
</style>
