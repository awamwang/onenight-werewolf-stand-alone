import { Player } from './player'
import {
  availableRoles,
  GameStatusEnum,
  LEFT_ROLE_COUNT,
  roleNamesSet,
  type GameStatus,
  type OperateLogEntry,
  type RoleName,
} from './types'
import { shuffle } from './utils'

export class Game {
  status: GameStatus = GameStatusEnum.CONFIG
  private _playerCount: number | null
  private _operateTimeout: number

  defaultRoleNames: RoleName[] = []
  roleNames: RoleName[] = []
  players: Record<number, Player> = {}
  finalPlayers: Record<number, Player> = {}
  rule = ''

  curPosition = -1
  curPlayer: Player | null = null
  operateResultShow = false

  operateCache: Record<string, number[]> = {}
  operateLog: Record<number, OperateLogEntry> = {}

  constructor(playerCount = 8, operateTimeout = 20) {
    this._playerCount = playerCount
    this._operateTimeout = operateTimeout
    this.getDefaultRoleNames(playerCount)
  }

  get playerCount(): number {
    return this._playerCount ?? 0
  }

  set playerCount(value: number | string | null) {
    const parsed = value === null || value === '' ? null : parseInt(String(value), 10) || null
    this._playerCount = parsed
    this.getDefaultRoleNames(parsed)
  }

  get operateTimeout(): number {
    return this._operateTimeout
  }

  set operateTimeout(value: number | string) {
    this._operateTimeout = Number(value) || 20
  }

  get finalRoleNames(): string[] {
    const names: string[] = []
    if (Object.keys(this.finalPlayers).length === 0) {
      return names
    }

    for (let i = this.playerCount + LEFT_ROLE_COUNT; i >= 1; i--) {
      names.unshift(this.finalPlayers[i].role.roleName)
    }
    return names
  }

  getDefaultRoleNames(playerCount: number | null): void {
    if (playerCount === null) {
      return
    }
    if (!roleNamesSet[playerCount]) {
      throw new Error('unavailable player count')
    }
    this.defaultRoleNames = roleNamesSet[playerCount]
  }

  setRoleNames(rolesString: string): void {
    const roleNames = rolesString.split('、').filter(Boolean) as RoleName[]
    this.checkRoleNames(roleNames)
    this.roleNames = roleNames
  }

  checkRoleNames(roleNames: string[]): void {
    if (roleNames.length !== this.playerCount + LEFT_ROLE_COUNT) {
      throw new Error(`wrong role count, should be ${this.playerCount + LEFT_ROLE_COUNT}`)
    }
    for (const role of roleNames) {
      if (!(role in availableRoles)) {
        throw new Error(`unavailable role "${role}"`)
      }
    }
  }

  startRuleShow(): void {
    this.getPlayers()
    this.getRule1()
    this.status = GameStatusEnum.RULE
  }

  getPlayers(): void {
    const roleNames = shuffle(this.roleNames)
    for (let position = this.playerCount + LEFT_ROLE_COUNT; position >= 1; position--) {
      this.players[position] = new Player(roleNames[position - 1]!, position, this)
      this.finalPlayers[position] = new Player(roleNames[position - 1]!, position, this)
    }
  }

  getRule1(): void {
    this.rule = `请各位玩家闭眼，按照顺时针方向传递手机，每人有${this._operateTimeout}s时间操作`
  }

  startOperate1(): void {
    this.status = GameStatusEnum.OPERATE1
    this.operate1(1)
  }

  startOperate2(): void {
    this.finishOperate1()

    if (!this.roleNames.includes('失眠者')) {
      this.status = GameStatusEnum.ARGUE
      return
    }

    this.status = GameStatusEnum.OPERATE2
    this.operate2(1)
  }

  operate1(position: number): void {
    this.operateResultShow = false
    if (position > this.playerCount) {
      this.startOperate2()
      return
    }

    this.curPlayer = this.players[position]
    this.curPosition = position
  }

  operate2(position: number): void {
    this.operateResultShow = false
    if (position > this.playerCount) {
      this.status = GameStatusEnum.ARGUE
      return
    }

    this.curPlayer = this.players[position]
    this.curPosition = position
  }

  finishOperate1(): void {
    for (const roleName of ['强盗', '捣蛋鬼', '酒鬼'] as const) {
      const cache = this.operateCache[roleName]
      if (cache) {
        this.switchRole(cache[0]!, cache[1]!)
      }
    }
  }

  getKillTargets(): number[] {
    return Array.from({ length: this.playerCount + LEFT_ROLE_COUNT }, (_, index) => index + 1)
  }

  getKillResult(): (list: number[]) => string {
    return (list) => {
      if (list.length === 0) {
        throw new Error('请选择操作目标')
      }
      if (list.length > 1) {
        throw new Error('最多票决1名玩家')
      }

      const killedPosition = list[0]!
      const killedRoleName = this.finalPlayers[killedPosition].role.roleName
      let result = ''

      if (killedPosition <= this.playerCount) {
        if (
          [
            '爪牙',
            '预言家',
            '强盗',
            '捣蛋鬼',
            '失眠者',
            '酒鬼',
            '村民',
            '守卫',
          ].includes(killedRoleName)
        ) {
          result = `${killedPosition}玩家的角色是${killedRoleName}，狼人胜利`
        }
        if (killedRoleName === '狼人') {
          result = `${killedPosition}玩家的角色是${killedRoleName}，平民胜利`
        }
        if (killedRoleName === '皮匠') {
          result = `${killedPosition}玩家的角色是${killedRoleName}，皮匠胜利`
        }
      } else if (this.finalRoleNames.slice(0, -3).includes('狼人')) {
        result = '场上有狼人，狼人胜利'
      } else {
        result = '狼人都在底牌中，平民胜利'
      }

      this.status = GameStatusEnum.RESULT
      return result
    }
  }

  findOtherPlayers(position: number, roleName: string): number[] {
    const otherRoles: number[] = []
    for (let i = this.playerCount; i >= 1; i--) {
      const player = this.players[i]
      if (player.role.roleName === roleName && player.position !== position) {
        otherRoles.unshift(player.position)
      }
    }
    return otherRoles
  }

  findPlayers(roleName: string): number[] {
    const matches: number[] = []
    for (let i = this.playerCount; i >= 1; i--) {
      const player = this.players[i]
      if (player.role.roleName === roleName) {
        matches.unshift(player.position)
      }
    }
    return matches
  }

  getRoleName(position: number): string {
    return this.players[position].role.roleName
  }

  getFinalRoleName(position: number): string {
    return this.finalPlayers[position].role.roleName
  }

  switchRole(position1: number, position2: number): void {
    const temp = this.finalPlayers[position1]
    this.finalPlayers[position1] = this.finalPlayers[position2]
    this.finalPlayers[position2] = temp
  }
}

export { GameStatusEnum, LEFT_ROLE_COUNT, availableRoles, roleNamesSet }
export type { GameStatus, RoleName, OperateLogEntry }
