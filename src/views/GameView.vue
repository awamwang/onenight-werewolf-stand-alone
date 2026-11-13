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

          <div v-if="需要选择目标" class="target-group" role="group" aria-labelledby="targets-title">
            <div class="group-head">
              <p class="group-title" id="targets-title">{{ 选择标题 }}</p>
              <span class="select-count" role="status" aria-live="polite">{{ 选择进度 }}</span>
            </div>
            <p class="group-hint" id="targets-hint" role="status" aria-live="polite">
              {{ 选择提示 }}
            </p>
            <el-checkbox-group
              v-model="selectedTargets"
              class="targets"
              aria-describedby="targets-hint"
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
          </div>
          <p v-else class="hint">无需选择目标，直接完成操作即可</p>

          <el-button type="primary" class="full" :disabled="!可提交" @click="onFinishOperate1">
            完成操作
          </el-button>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </template>

        <template v-else-if="store.status === GameStatusEnum.OPERATE2 && store.operateStage === 'act'">
          <p class="hint">{{ 第二轮提示 }}</p>
          <el-button type="primary" class="full" @click="onFinishOperate2">查看结果</el-button>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </template>

        <template v-else-if="store.operateStage === 'result'">
          <div class="result-block">
            <p class="result-label">{{ 结果标签 }}</p>
            <div class="result-text" aria-live="polite">
              <template v-if="有高亮信息">
                <template v-for="(片段, index) in 结果片段" :key="index">
                  <button
                    v-if="片段.可点"
                    type="button"
                    class="result-token"
                    :aria-label="`已读「${片段.文本}」，交给下一位`"
                    @click="onNext"
                  >
                    {{ 片段.文本 }}
                  </button>
                  <span v-else>{{ 片段.文本 }}</span>
                </template>
              </template>
              <button
                v-else
                type="button"
                class="result-plain"
                aria-label="已读结果，交给下一位"
                @click="onNext"
              >
                {{ 本轮展示文本 }}
              </button>
            </div>
            <p class="next-hint">{{ 继续提示 }}</p>
          </div>
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

const 角色名 = computed(() => store.curPlayer?.role.roleName ?? '')
const 需要选择目标 = computed(() => (store.curPlayer?.role.operateTargets.length ?? 0) > 0)

/** 底牌位编号大于玩家人数 */
function 是底牌(target: number): boolean {
  return target > store.game.playerCount
}

/** 选择规则前移到 UI：写入 store 前先按角色裁剪，避免提交时才由 core 报错 */
const selectedTargets = computed({
  get: () => store.operateArgs,
  set: (value: number[]) => {
    if (角色名.value === '预言家') {
      // 预言家二选一：查验 1 名玩家，或查看 2 张底牌（两者互斥）
      const 玩家 = value.filter((t) => !是底牌(t))
      store.operateArgs =
        玩家.length > 0 ? [玩家[玩家.length - 1]!] : value.filter(是底牌).slice(-2)
      return
    }
    store.operateArgs = value.slice(-maxSelectable())
  },
})

const 选择标题 = computed(() => {
  switch (角色名.value) {
    case '预言家':
      return '查验目标'
    case '强盗':
      return '抢夺目标'
    case '捣蛋鬼':
      return '交换目标'
    case '酒鬼':
      return '交换底牌'
    default:
      return '选择操作目标'
  }
})

const 选择进度 = computed(() => {
  const sel = store.operateArgs
  if (角色名.value === '预言家') {
    return sel.some((t) => !是底牌(t)) ? '1 / 1' : `${sel.filter(是底牌).length} / 2`
  }
  return `${sel.length} / ${maxSelectable()}`
})

const 选择提示 = computed(() => {
  const sel = store.operateArgs
  switch (角色名.value) {
    case '预言家': {
      const 玩家数 = sel.filter((t) => !是底牌(t)).length
      const 底牌数 = sel.filter(是底牌).length
      if (玩家数 === 1) return '已选 1 名玩家，直接完成操作即可'
      if (底牌数 === 2) return '已选 2 张底牌，直接完成操作即可'
      if (底牌数 === 1) return '已选 1 张底牌，需再选 1 张底牌'
      return '二选一：查验 1 名玩家，或查看 2 张底牌（不能查验自己）'
    }
    case '捣蛋鬼':
      return sel.length === 2
        ? '已选 2 名玩家，可以交换'
        : `需选 2 名玩家（不能选自己），当前 ${sel.length} 名`
    case '强盗':
      return sel.length === 1 ? '已选 1 名玩家，可以抢夺' : '选择 1 名玩家（不能选自己）'
    case '酒鬼':
      return sel.length === 1 ? '已选 1 张底牌，可以交换' : '选择 1 张底牌'
    default:
      return ''
  }
})

/** 条件未满足时禁用主按钮，杜绝「选完点提交才报错」 */
const 可提交 = computed(() => {
  if (!需要选择目标.value) return true
  const sel = store.operateArgs
  switch (角色名.value) {
    case '预言家':
      return sel.some((t) => !是底牌(t)) || sel.filter(是底牌).length === 2
    case '捣蛋鬼':
      return sel.length === 2
    default:
      return sel.length === 1
  }
})

/** 只有这些角色需要第二轮知道换牌后的最新身份，其余角色一律回看第一轮结果 */
const 需要最新信息的角色 = new Set(['失眠者'])
const 需要最新信息 = computed(() => 需要最新信息的角色.has(角色名.value))
const 是第二轮 = computed(() => store.status === GameStatusEnum.OPERATE2)

const 上轮日志文本 = computed(() => {
  const log = store.game.operateLog[store.curPosition]
  return log ? `${log.roleName}，${log.operate}` : ''
})

/** 第二轮默认展示第一轮留档文本，绝不重新计算当前身份 */
const 本轮展示文本 = computed(() => {
  if (是第二轮.value && !需要最新信息.value) {
    return store.上轮结果文本[store.curPosition] || 上轮日志文本.value || '上一轮没有额外信息'
  }
  return store.operateResult || '本轮没有额外信息'
})

const 结果标签 = computed(() => {
  if (是第二轮.value) {
    return 需要最新信息.value ? '本轮最新信息' : '上一轮操作结果 · 不含换牌后的最新身份'
  }
  return '本轮操作结果'
})

const 第二轮提示 = computed(() =>
  需要最新信息.value
    ? '失眠者可以确认自己当前（可能已被交换）的身份。'
    : '多数角色无需重复查看，下面会原样展示你上一轮的操作结果。',
)

interface 结果片段 {
  文本: string
  可点: boolean
}

/** 把玩家号 / 底牌 / 角色名切成可点片段，让重要信息同时承担「继续」入口 */
const 关键信息 = /(\d+(?:、\d+)*号(?:玩家|狼|同伴)?|底牌\d*|狼人|爪牙|预言家|强盗|捣蛋鬼|失眠者|酒鬼|村民|守卫|皮匠)/g
const 结果片段 = computed<结果片段[]>(() => {
  const text = 本轮展示文本.value
  关键信息.lastIndex = 0
  const 片段: 结果片段[] = []
  let last = 0
  for (const match of text.matchAll(关键信息)) {
    const start = match.index ?? 0
    if (start > last) 片段.push({ 文本: text.slice(last, start), 可点: false })
    片段.push({ 文本: match[0], 可点: true })
    last = start + match[0].length
  }
  if (last < text.length) 片段.push({ 文本: text.slice(last), 可点: false })
  return 片段
})
const 有高亮信息 = computed(() => 结果片段.value.some((s) => s.可点))
const 继续提示 = computed(() =>
  有高亮信息.value
    ? '点击上方高亮的信息，确认已读并交给下一位玩家'
    : '本条结果没有可高亮的信息，点击结果文字继续',
)

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
  const name = 角色名.value
  if (name === '捣蛋鬼' || name === '预言家') return 2
  return 1
}

function isTargetDisabled(target: number): boolean {
  const name = 角色名.value
  const selected = store.operateArgs
  // 已选项始终可点，便于取消
  if (selected.includes(target)) return false

  if (name === '预言家') {
    // 玩家模式：上限 1；底牌模式：上限 2，且不能再回选玩家、不能选自己
    if (selected.some((t) => !是底牌(t))) return true
    const 已选底牌 = selected.filter(是底牌).length
    if (是底牌(target)) return 已选底牌 >= 2
    return 已选底牌 > 0 || target === store.curPosition
  }

  if ((name === '强盗' || name === '捣蛋鬼') && target === store.curPosition) return true
  return selected.length >= maxSelectable()
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

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.group-title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.select-count {
  flex: 0 0 auto;
  padding: 2px 10px;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.group-hint {
  margin: calc(var(--space-2) * -1) 0 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
  line-height: var(--line-height);
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

.result-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* 结果正文改回普通文本色，让高亮片段成为唯一焦点 */
.result-block .result-text {
  color: var(--color-text);
  font-weight: 500;
}

.result-label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.result-token {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  margin: 0 2px;
  padding: 0 8px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  line-height: 1.3;
  vertical-align: middle;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.result-token:hover {
  background: var(--color-primary-soft);
}

.result-plain {
  display: block;
  width: 100%;
  min-height: var(--tap-min);
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.result-plain:hover {
  text-decoration: underline;
}

.next-hint {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
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
