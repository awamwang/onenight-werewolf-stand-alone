import { defineStore } from 'pinia'
import { computed, ref, shallowRef, triggerRef } from 'vue'
import { DEFAULT_OPERATE_TIMEOUT, DEFAULT_PLAYER_COUNT, STORAGE_KEYS } from '@/config'
import { Game, GameStatusEnum, LEFT_ROLE_COUNT } from '@/core'

export type OperateStage = 'pass' | 'act' | 'result'

function readStoredNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const useGameStore = defineStore('game', () => {
  const game = shallowRef(
    new Game(
      readStoredNumber(STORAGE_KEYS.playerCount, DEFAULT_PLAYER_COUNT),
      readStoredNumber(STORAGE_KEYS.operateTimeout, DEFAULT_OPERATE_TIMEOUT),
    ),
  )
  const rolesString = ref(localStorage.getItem(STORAGE_KEYS.rolesString) || '')
  const operateStage = ref<OperateStage>('pass')
  const operateArgs = ref<number[]>([])
  const operateResult = ref('')
  /** 第一轮每个玩家看到的完整结果文本，供第二轮按原样回看（不含换牌后的最新身份） */
  const 上轮结果文本 = ref<Record<number, string>>({})
  const killResult = ref('')

  const status = computed(() => game.value.status)
  const curPosition = computed(() => game.value.curPosition)
  const curPlayer = computed(() => game.value.curPlayer)

  /** Game 为 class 实例，shallowRef 不会追踪内部字段变更，变更后需手动触发 */
  function touchGame(): void {
    triggerRef(game)
  }

  function rolesCount(): number {
    return rolesString.value.split('、').filter(Boolean).length
  }

  function syncRolesToPlayerCount(): void {
    const expected = game.value.playerCount + LEFT_ROLE_COUNT
    if (rolesCount() !== expected && game.value.defaultRoleNames.length) {
      rolesString.value = game.value.defaultRoleNames.join('、')
    }
  }

  function syncDefaultRoles(): void {
    if (!rolesString.value && game.value.defaultRoleNames.length) {
      rolesString.value = game.value.defaultRoleNames.join('、')
    }
  }

  function setPlayerCount(value: number): void {
    game.value.playerCount = value
    syncRolesToPlayerCount()
    touchGame()
  }

  function setOperateTimeout(value: number): void {
    game.value.operateTimeout = value
    touchGame()
  }

  function saveConfig(): void {
    localStorage.setItem(STORAGE_KEYS.playerCount, String(game.value.playerCount))
    localStorage.setItem(STORAGE_KEYS.operateTimeout, String(game.value.operateTimeout))
    localStorage.setItem(STORAGE_KEYS.rolesString, rolesString.value)
  }

  function confirmConfig(): void {
    syncRolesToPlayerCount()
    game.value.setRoleNames(rolesString.value)
    game.value.startRuleShow()
    saveConfig()
    touchGame()
  }

  function confirmRule(): void {
    game.value.startOperate1()
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
    touchGame()
  }

  function confirmPassPhone(): void {
    operateStage.value = 'act'
  }

  function finishOperate1(): void {
    if (!game.value.curPlayer) return
    operateResult.value = game.value.curPlayer.role.operate1(game.value.curPosition)(
      operateArgs.value,
    )
    // 原样留档：第二轮只回看这一份文本，避免重新计算时暴露换牌后的身份
    上轮结果文本.value[game.value.curPosition] = operateResult.value
    operateStage.value = 'result'
    touchGame()
  }

  function nextOperate1(): void {
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
    game.value.operate1(game.value.curPosition + 1)
    touchGame()
  }

  function finishOperate2(): void {
    if (!game.value.curPlayer) return
    operateResult.value = game.value.curPlayer.role.operate2(game.value.curPosition)()
    operateStage.value = 'result'
    touchGame()
  }

  function nextOperate2(): void {
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
    game.value.operate2(game.value.curPosition + 1)
    touchGame()
  }

  function finishArgue(): void {
    killResult.value = game.value.getKillResult()(operateArgs.value)
    touchGame()
  }

  function restart(): void {
    const playerCount = readStoredNumber(STORAGE_KEYS.playerCount, DEFAULT_PLAYER_COUNT)
    const operateTimeout = readStoredNumber(
      STORAGE_KEYS.operateTimeout,
      DEFAULT_OPERATE_TIMEOUT,
    )
    const storedRoles = localStorage.getItem(STORAGE_KEYS.rolesString) || ''
    game.value = new Game(playerCount, operateTimeout)
    rolesString.value = storedRoles || game.value.defaultRoleNames.join('、')
    syncRolesToPlayerCount()
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
    上轮结果文本.value = {}
    killResult.value = ''
  }

  // 初始化默认角色串
  syncDefaultRoles()
  if (!rolesString.value) {
    rolesString.value = game.value.defaultRoleNames.join('、')
  }

  return {
    game,
    rolesString,
    operateStage,
    operateArgs,
    operateResult,
    上轮结果文本,
    killResult,
    status,
    curPosition,
    curPlayer,
    GameStatusEnum,
    setPlayerCount,
    setOperateTimeout,
    confirmConfig,
    confirmRule,
    confirmPassPhone,
    finishOperate1,
    nextOperate1,
    finishOperate2,
    nextOperate2,
    finishArgue,
    restart,
    saveConfig,
  }
})
