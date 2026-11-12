<template>
  <div class="pass-phone-overlay">
    <div class="content">
      <h2 class="title">请将手机传给</h2>
      <h1 class="player-name">{{ playerName }}</h1>
      <p class="privacy-hint">确认后仅本人查看，勿让旁人看到屏幕</p>

      <button
        ref="buttonRef"
        class="confirm-button"
        :class="{ pressing: isPressing }"
        :style="buttonStyle"
        :disabled="confirmed"
        @click="handleFastClick"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerUp"
        @pointercancel="handlePointerUp"
      >
        <div class="button-content">
          <span class="button-text">我是{{ playerName }}，点击查看</span>
          <div class="progress-bar" :style="progressBarStyle"></div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { LONG_PRESS_DURATION } from '@/config'

defineProps<{
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

const buttonStyle = computed(() => ({
  height: '56px',
  width: 'calc(100% - 32px)',
  maxWidth: '360px',
}))

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
  background: rgba(8, 16, 8, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  touch-action: none;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 400px;
}

.title {
  font-size: 24px;
  color: var(--color-text-muted);
  margin: 0;
  font-weight: 500;
}

.player-name {
  font-size: 36px;
  color: var(--color-accent);
  margin: 0;
  font-weight: 700;
  text-align: center;
}

.privacy-hint {
  font-size: 13px;
  color: rgba(232, 180, 90, 0.85);
  margin: 0;
  text-align: center;
  line-height: 1.5;
}

.confirm-button {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  background: var(--color-primary-light);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.confirm-button:active,
.confirm-button.pressing {
  background: var(--color-primary-hover);
  transform: translateX(-50%) scale(0.98);
}

.button-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
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
  background: linear-gradient(90deg, rgba(180, 60, 60, 0.55), rgba(180, 60, 60, 0.85));
  transition: width 0.05s linear;
  pointer-events: none;
}
</style>
