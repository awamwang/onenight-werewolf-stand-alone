import { describe, expect, it } from 'vitest'
import { availableRoles } from '../../src/core'
import { 查找角色资料, 角色资料表 } from '../../src/角色资料'

describe('角色图鉴（首页描述与对局能力说明共用）', () => {
  it('每个可用角色都有图标、一句话定位与新手向能力解释', () => {
    const 角色名列表 = Object.keys(availableRoles)
    expect(角色名列表.length).toBeGreaterThan(0)

    for (const 名称 of 角色名列表) {
      const 资料 = 查找角色资料(名称)
      expect(资料.名称, `${名称} 缺少图鉴条目`).toBe(名称)
      expect(资料.图标 && 资料.图标 !== '❓', `${名称} 缺少图标`).toBe(true)
      expect(资料.一句话.length, `${名称} 缺少一句话定位`).toBeGreaterThanOrEqual(6)
      expect(资料.能力.length, `${名称} 缺少能力解释`).toBeGreaterThanOrEqual(20)
      expect(资料.一句话.includes('暂无说明')).toBe(false)
      expect(资料.能力.includes('暂无说明')).toBe(false)
    }
  })

  it('未知角色走兜底说明，页面不会渲染空白', () => {
    const 资料 = 查找角色资料('不存在的角色')
    expect(资料.图标).toBe('❓')
    expect(资料.能力).toContain('操作提示')
    expect(查找角色资料(undefined)).toBe(查找角色资料(undefined))
  })

  it('关键角色的说明与实际规则一致', () => {
    expect(角色资料表['失眠者']!.能力).toContain('最终的角色')
    expect(角色资料表['预言家']!.能力).toContain('1 名玩家')
    expect(角色资料表['预言家']!.能力).toContain('2 张底牌')
    expect(角色资料表['捣蛋鬼']!.能力).toContain('交换')
    expect(角色资料表['皮匠']!.能力).toContain('被投票处决')
    expect(角色资料表['皮匠']!.能力).toContain('只有你一个人获胜')
  })
})
