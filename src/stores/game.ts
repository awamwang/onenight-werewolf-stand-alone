import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { DEFAULT_OPERATE_TIMEOUT, DEFAULT_PLAYER_COUNT, STORAGE_KEYS } from '@/config'
import { Game, GameStatusEnum } from '@/core'

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
  const killResult = ref('')

  const status = computed(() => game.value.status)
  const curPosition = computed(() => game.value.curPosition)
  const curPlayer = computed(() => game.value.curPlayer)

  function syncDefaultRoles(): void {
    if (!rolesString.value && game.value.defaultRoleNames.length) {
      rolesString.value = game.value.defaultRoleNames.join('、')
    }
  }

  function setPlayerCount(value: number): void {
    game.value.playerCount = value
    if (!localStorage.getItem(STORAGE_KEYS.rolesString)) {
      rolesString.value = game.value.defaultRoleNames.join('、')
    }
  }

  function saveConfig(): void {
    localStorage.setItem(STORAGE_KEYS.playerCount, String(game.value.playerCount))
    localStorage.setItem(STORAGE_KEYS.operateTimeout, String(game.value.operateTimeout))
    localStorage.setItem(STORAGE_KEYS.rolesString, rolesString.value)
  }

  function confirmConfig(): void {
    game.value.setRoleNames(rolesString.value)
    game.value.startRuleShow()
    saveConfig()
  }

  function confirmRule(): void {
    game.value.startOperate1()
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
  }

  function confirmPassPhone(): void {
    operateStage.value = 'act'
  }

  function finishOperate1(): void {
    if (!game.value.curPlayer) return
    operateResult.value = game.value.curPlayer.role.operate1(game.value.curPosition)(
      operateArgs.value,
    )
    operateStage.value = 'result'
  }

  function nextOperate1(): void {
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
    game.value.operate1(game.value.curPosition + 1)
  }

  function finishOperate2(): void {
    if (!game.value.curPlayer) return
    operateResult.value = game.value.curPlayer.role.operate2(game.value.curPosition)()
    operateStage.value = 'result'
  }

  function nextOperate2(): void {
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
    game.value.operate2(game.value.curPosition + 1)
  }

  function finishArgue(): void {
    killResult.value = game.value.getKillResult()(operateArgs.value)
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
    operateStage.value = 'pass'
    operateArgs.value = []
    operateResult.value = ''
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
    killResult,
    status,
    curPosition,
    curPlayer,
    GameStatusEnum,
    setPlayerCount,
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
