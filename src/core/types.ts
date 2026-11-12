export const LEFT_ROLE_COUNT = 3

export const GameStatusEnum = {
  CONFIG: 1,
  RULE: 2,
  OPERATE1: 3,
  OPERATE2: 4,
  ARGUE: 5,
  VOTE: 6,
  RESULT: 7,
} as const

export type GameStatus = (typeof GameStatusEnum)[keyof typeof GameStatusEnum]

export type RoleName =
  | '狼人'
  | '爪牙'
  | '预言家'
  | '强盗'
  | '捣蛋鬼'
  | '失眠者'
  | '酒鬼'
  | '村民'
  | '守卫'
  | '皮匠'

export const availableRoles: Record<RoleName, 1> = {
  狼人: 1,
  爪牙: 1,
  预言家: 1,
  强盗: 1,
  捣蛋鬼: 1,
  失眠者: 1,
  酒鬼: 1,
  村民: 1,
  守卫: 1,
  皮匠: 1,
}

export const roleNamesSet: Record<number, RoleName[]> = {
  3: ['狼人', '狼人', '预言家', '强盗', '捣蛋鬼', '村民'],
  4: ['狼人', '狼人', '预言家', '强盗', '捣蛋鬼', '村民', '村民'],
  5: ['狼人', '狼人', '预言家', '强盗', '捣蛋鬼', '村民', '村民', '村民'],
  6: ['狼人', '狼人', '爪牙', '预言家', '强盗', '捣蛋鬼', '失眠者', '村民', '村民'],
  7: ['狼人', '狼人', '爪牙', '预言家', '强盗', '捣蛋鬼', '失眠者', '村民', '村民', '村民'],
  8: ['狼人', '狼人', '爪牙', '预言家', '强盗', '捣蛋鬼', '失眠者', '守卫', '守卫', '村民', '村民'],
  9: ['狼人', '狼人', '爪牙', '预言家', '强盗', '捣蛋鬼', '酒鬼', '村民', '村民', '村民', '村民', '村民'],
}

export interface OperateLogEntry {
  roleName: string
  operate: string
}
