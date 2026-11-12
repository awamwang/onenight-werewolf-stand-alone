/** 长按触发时间（毫秒）；0 表示点击即确认 */
export const LONG_PRESS_DURATION = 0

export const DEFAULT_PLAYER_COUNT = 8
export const DEFAULT_OPERATE_TIMEOUT = 20

export const STORAGE_KEYS = {
  playerCount: 'werewolfPlayerCount',
  operateTimeout: 'werewolfOperateTimeout',
  rolesString: 'werewolfRolesString',
} as const
