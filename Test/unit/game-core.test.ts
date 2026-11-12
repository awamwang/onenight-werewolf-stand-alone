import { describe, expect, it } from 'vitest'
import { Game, GameStatusEnum, LEFT_ROLE_COUNT, Role } from '../../src/core'

describe('Game core', () => {
  it('默认牌组数量 = 人数 + 底牌', () => {
    const game = new Game(8)
    expect(game.defaultRoleNames.length).toBe(8 + LEFT_ROLE_COUNT)
  })

  it('发牌后玩家与底牌位齐全', () => {
    const game = new Game(5)
    game.setRoleNames(game.defaultRoleNames.join('、'))
    game.startRuleShow()
    expect(Object.keys(game.players).length).toBe(5 + LEFT_ROLE_COUNT)
    expect(game.status).toBe(GameStatusEnum.RULE)
  })

  it('杀掉狼人则平民胜利', () => {
    const game = new Game(3)
    game.setRoleNames(game.defaultRoleNames.join('、'))
    game.startRuleShow()
    // 强制 1 号为狼人
    game.finalPlayers[1].role.roleName = '狼人'
    const result = game.getKillResult()([1])
    expect(result).toContain('平民胜利')
    expect(game.status).toBe(GameStatusEnum.RESULT)
  })

  it('酒鬼 operate1 接收 list 参数并可缓存交换', () => {
    const game = new Game(3)
    game.setRoleNames(['狼人', '狼人', '酒鬼', '预言家', '强盗', '村民'].join('、'))
    game.startRuleShow()
    const drunkPos = 1
    game.players[drunkPos].role.roleName = '酒鬼'
    const role = new Role('酒鬼', game)
    const center = game.playerCount + 1
    const text = role.operate1(drunkPos)([center])
    expect(text).toContain('撒酒疯')
    expect(game.operateCache['酒鬼']).toEqual([drunkPos, center])
    expect(game.operateLog[drunkPos].operate).toBe(`${center}号`)
  })

  it('强盗缓存交换会在 finishOperate1 生效', () => {
    const game = new Game(3)
    game.setRoleNames(game.defaultRoleNames.join('、'))
    game.startRuleShow()
    const robberPos = 1
    const otherPos = 2
    game.finalPlayers[robberPos].role.roleName = '强盗'
    game.finalPlayers[otherPos].role.roleName = '村民'
    const beforeOther = game.finalPlayers[otherPos].role.roleName
    const beforeRobber = game.finalPlayers[robberPos].role.roleName
    game.operateCache['强盗'] = [robberPos, otherPos]
    game.finishOperate1()
    expect(game.finalPlayers[robberPos].role.roleName).toBe(beforeOther)
    expect(game.finalPlayers[otherPos].role.roleName).toBe(beforeRobber)
  })
})
