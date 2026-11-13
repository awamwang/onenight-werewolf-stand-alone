<template>
  <div
    class="pass-phone-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pass-title"
    aria-describedby="pass-hint"
    @keydown="handleTrapTab"
  >
    <div class="content">
      <div class="pass-top">
        <p class="eyebrow">隐私交接</p>
        <h2 class="title" id="pass-title">请将手机传给</h2>
        <p class="player-name">{{ playerName }}</p>
        <p class="privacy-hint" id="pass-hint">
          <span aria-hidden="true">🔒</span>
          确认后仅本人查看，请勿让旁人看到屏幕
        </p>
      </div>

      <div class="pass-bottom">
        <button
          ref="buttonRef"
          class="confirm-button"
          type="button"
          :class="{ pressing: isPressing }"
          :disabled="confirmed"
          :aria-label="按钮文案"
          aria-describedby="pass-action-hint"
          @click="handleFastClick"
          @pointerdown="handlePointerDown"
          @pointerup="handlePointerUp"
          @pointerleave="handlePointerUp"
          @pointercancel="handlePointerUp"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
        >
          <span class="button-text">{{ 按钮文案 }}</span>
          <span
            v-if="需要长按"
            class="progress-bar"
            role="progressbar"
            aria-label="长按进度"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="进度百分比"
            :style="progressBarStyle"
          ></span>
        </button>
        <p class="action-hint" id="pass-action-hint">{{ 操作提示 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { LONG_PRESS_DURATION } from '@/config'

const props = defineProps<{
  playerName: string
}>()

const emit = defineEmits<{
  confirmed: []
}>()

const buttonRef = ref<HTMLButtonElement | null>(null)
const isPressing = ref(false)
const progress = ref(0)
const startTime = ref(0)
const animationFrameId = ref<number | null>(null)
const confirmed = ref(false)

/** 配置为 0 时是「点击即确认」，文案与进度条都随配置自洽 */
const 需要长按 = computed(() => LONG_PRESS_DURATION > 0)
const 进度百分比 = computed(() => Math.round(progress.value))
const 按钮文案 = computed(() => {
  if (confirmed.value) return '已确认，正在进入…'
  return `我是${props.playerName}，${需要长按.value ? '长按查看' : '点击查看'}`
})
const 操作提示 = computed(() =>
  需要长按.value
    ? `按住按钮约 ${(LONG_PRESS_DURATION / 1000).toFixed(1)} 秒，进度走满后自动进入`
    : '点击按钮即可进入，键盘用户可按 Enter 或空格',
)

function fireConfirmed() {
  if (confirmed.value) return
  confirmed.value = true
  emit('confirmed')
}

function handleFastClick(event: MouseEvent) {
  if (LONG_PRESS_DURATION !== 0) return
  event.preventDefault()
  event.stopPropagation()
  fireConfirmed()
}

const progressBarStyle = computed(() => ({
  width: `${progress.value}%`,
}))

function handlePointerDown(event: PointerEvent) {
  if (LONG_PRESS_DURATION === 0) return
  event.preventDefault()
  if (isPressing.value) return

  isPressing.value = true
  progress.value = 0
  startTime.value = performance.now()

  if (buttonRef.value) {
    buttonRef.value.setPointerCapture(event.pointerId)
  }

  animateProgress()
}

function animateProgress() {
  if (!isPressing.value) return

  const elapsed = performance.now() - startTime.value
  progress.value = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100)

  if (progress.value < 100) {
    animationFrameId.value = requestAnimationFrame(animateProgress)
  } else {
    isPressing.value = false
    fireConfirmed()
  }
}

function handlePointerUp(event: PointerEvent) {
  if (!isPressing.value) return

  isPressing.value = false
  progress.value = 0

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }

  if (buttonRef.value) {
    buttonRef.value.releasePointerCapture(event.pointerId)
  }
}

/** 键盘路径：长按配置下用 Enter / 空格模拟按住，点击配置下由原生 click 处理 */
function handleKeyDown(event: KeyboardEvent) {
  if (!需要长按.value || event.repeat || isPressing.value || confirmed.value) return
  if (event.key !== ' ' && event.key !== 'Enter') return

  event.preventDefault()
  isPressing.value = true
  progress.value = 0
  startTime.value = performance.now()
  animateProgress()
}

function handleKeyUp(event: KeyboardEvent) {
  if ((event.key !== ' ' && event.key !== 'Enter') || !isPressing.value) return

  isPressing.value = false
  progress.value = 0

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }
}

/** 模态遮罩：Tab 不跑到背景内容，焦点始终留在确认按钮 */
function handleTrapTab(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  event.preventDefault()
  buttonRef.value?.focus()
}

onMounted(() => {
  // 遮罩出现即接管焦点，键盘用户无需先穿越背景内容
  buttonRef.value?.focus()
})

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
})
</script>

<style scoped>
.pass-phone-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(233, 184, 114, 0.12), transparent 55%),
    rgba(6, 12, 8, 0.97);
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0 var(--space-6);
  box-sizing: border-box;
  touch-action: none;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-8);
  width: 100%;
  max-width: 420px;
  min-height: 100dvh;
  padding: calc(var(--space-12) + env(safe-area-inset-top, 0px)) 0
    calc(var(--space-6) + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.pass-top,
.pass-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pass-top {
  margin-top: auto;
  gap: var(--space-4);
}

.eyebrow {
  margin: 0;
  padding: 5px 12px;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: 500;
  color: var(--color-text-muted);
}

.player-name {
  margin: 0;
  font-size: 2.75rem;
  line-height: var(--line-height-tight);
  font-weight: 700;
  text-align: center;
  color: var(--color-primary);
  text-shadow: 0 0 32px rgba(233, 184, 114, 0.28);
}

.privacy-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-2) 0 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  text-align: center;
  line-height: var(--line-height);
}

.pass-bottom {
  margin-bottom: auto;
  gap: var(--space-3);
  width: 100%;
}

.confirm-button {
  position: relative;
  width: 100%;
  max-width: 360px;
  min-height: 56px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-primary-ink);
  font-size: var(--font-size-subtitle);
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--shadow-glow);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.confirm-button:hover {
  background: var(--color-primary-hover);
}

.confirm-button:active,
.confirm-button.pressing {
  transform: scale(0.98);
}

.confirm-button:disabled {
  opacity: 0.7;
  cursor: default;
}

.button-text {
  position: relative;
  z-index: 1;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(42, 28, 8, 0.3);
  transition: width 0.05s linear;
  pointer-events: none;
}

.action-hint {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-caption);
  text-align: center;
  line-height: var(--line-height);
}

@media (max-height: 560px) {
  .content {
    padding-top: var(--space-6);
  }

  .player-name {
    font-size: 2.25rem;
  }
}
</style>
