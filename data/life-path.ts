export type LifePathTextFieldKey =
  | "cultureOrigin"
  | "personality"
  | "valuedThing"
  | "treasuredBelonging"
  | "attitudeToOthers"
  | "childhoodEnvironment"
  | "familyCrisis"
  | "lifeGoal"

export interface LifePathFieldConfig {
  key: LifePathTextFieldKey
  label: string
  options: string[]
}

export interface LifePathIdentityCircleOption {
  identity: string
  circle: string
}

export const LIFE_PATH_FIELDS: LifePathFieldConfig[] = [
  {
    key: "cultureOrigin",
    label: "文化起源",
    options: [
      "北美洲",
      "中美洲",
      "南美洲",
      "西欧",
      "东欧",
      "中东/北非",
      "撒哈拉以南非洲",
      "南亚",
      "东南亚",
      "东亚",
      "大洋洲/太平洋岛民",
    ],
  },
  {
    key: "personality",
    label: "个性",
    options: [
      "害羞且隐秘",
      "叛逆，反社会且暴力",
      "傲慢、自豪且孤傲",
      "情绪化、鲁莽且固执",
      "挑剔、紧张且神经质",
      "稳定且严肃",
      "傻气且头脑简单",
      "狡猾且欺诈",
      "理智且冷漠",
      "友好且外向",
    ],
  },
  {
    key: "valuedThing",
    label: "看重的东西",
    options: [
      "金钱",
      "荣誉",
      "诺言",
      "诚实",
      "知识",
      "复仇",
      "爱情",
      "力量",
      "家族",
      "友谊",
    ],
  },
  {
    key: "treasuredBelonging",
    label: "宝贵之物",
    options: [
      "武器",
      "工具",
      "衣服",
      "照片",
      "书或日记本",
      "记录",
      "乐器",
      "首饰",
      "玩具",
      "信",
    ],
  },
  {
    key: "childhoodEnvironment",
    label: "童年环境",
    options: [
      "在街头瞎跑，没有多少成年人的监督",
      "在豪宅里，高高的摩天大楼里，或在其他安全的地方",
      "在游民群体里，从一个地方搬到另一个地方",
      "在战区的中心，住在破旧的建筑或其他窝棚里",
      "在由大公司或政府控制的巨型建筑里",
      "在普通的小住宅里，比如在科罗纳多牧场的家或城市里的公寓",
    ],
  },
  {
    key: "familyCrisis",
    label: "家庭危机",
    options: [
      "有人背叛了你或你的家族，你失去了一切",
      "你或你的家族因政治或环境原因被流放或被驱逐出原来的家园",
      "你是家族中唯一的幸存者。其他人都死了或消失了",
      "你继承了一笔仇恨债，不管是因为你的行为还是你的血统",
      "你负债累累。要么是因为你自己的行为，要么是因为你的家族",
      "你被法律通缉。也许你做了，也许你没做。不管怎样，小心点",
    ],
  },
  {
    key: "attitudeToOthers",
    label: "对他人的态度",
    options: [
      "你对几乎所有人都保持中立",
      "你几乎喜欢所有人",
      "你几乎讨厌所有人",
      "人是用来利用的工具",
      "人是你路上的障碍",
      "每个人都是独特的",
      "大多数人都是垃圾",
      "建立深厚的关系很难",
      "你太容易坠入爱河",
      "所有生命都有意义。珍惜它",
    ],
  },
  {
    key: "lifeGoal",
    label: "人生目标",
    options: [
      "你需要弥补你犯下的错误",
      "你想要权力和控制权",
      "你想大捞一笔然后金盆洗手",
      "你过去遭遇了耻辱，你想纠正它",
      "名声和金钱",
      "以任何方式保护你所爱的人",
    ],
  },
]

export const LIFE_PATH_LAYOUT_ROWS: LifePathTextFieldKey[][] = [
  ["cultureOrigin", "personality", "valuedThing", "treasuredBelonging"],
  ["childhoodEnvironment", "familyCrisis"],
  ["attitudeToOthers", "lifeGoal"],
]

export const LIFE_PATH_FRIEND_OPTIONS = [
  "关系良好的前恋人",
  "一起长大的人",
  "导师或父母般的人物",
  "对你有好感的前老板",
  "已经和解的老敌人/对手",
  "分享爱好的人",
]

export const LIFE_PATH_ENEMY_OPTIONS = [
  "前朋友或恋人",
  "童年的死对头",
  "背叛过你的前老板",
  "你的亲戚",
  "前伙伴或同事",
  "不知道其存在的神秘人物",
]

export const LIFE_PATH_LOVE_OPTIONS = [
  "你的爱人死了，不是意外就是谋杀",
  "你的爱人神秘失踪了",
  "个人的目标或者仇恨使你和你的爱人分开",
  "你的爱人被监禁或流放了",
  "你的爱人离开你，跟了别人",
]

export const LIFE_PATH_IDENTITY_CIRCLE_OPTIONS: LifePathIdentityCircleOption[] = [
  { identity: "无", circle: "战区居民" },
  { identity: "中间人", circle: "公司职员" },
  { identity: "技医", circle: "边缘小队" },
  { identity: "技工", circle: "应急医护" },
  { identity: "无", circle: "帮派成员" },
  { identity: "游民", circle: "政府雇员" },
  { identity: "摇滚小子", circle: "警局雇员" },
  { identity: "佣兵", circle: "媒体从业" },
  { identity: "网行者", circle: "游民成员" },
  { identity: "无", circle: "零售店员" },
]

const uniqueValues = (values: string[]) => Array.from(new Set(values))

export const LIFE_PATH_IDENTITY_OPTIONS = uniqueValues(
  LIFE_PATH_IDENTITY_CIRCLE_OPTIONS.map(option => option.identity)
)

export const LIFE_PATH_CIRCLE_OPTIONS = uniqueValues(
  LIFE_PATH_IDENTITY_CIRCLE_OPTIONS.map(option => option.circle)
)
