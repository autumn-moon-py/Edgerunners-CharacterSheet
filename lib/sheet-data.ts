// types/form-data.ts

import { StandardCard } from "@/card/card-types"

// ===== 多角色系统数据结构 =====
export interface CharacterMetadata {
  id: string          // 唯一ID
  saveName: string    // 存档名称（用户为这个存档起的名字）
  lastModified: string // ISO 日期字符串
  createdAt: string   // ISO 日期字符串
  order: number       // 用于排序
}

export interface CharacterList {
  characters: CharacterMetadata[]  // 最多10个
  activeCharacterId: string | null // 当前活动角色ID
  lastUpdated: string             // ISO 日期字符串
}

// ===== 原有数据结构 =====
export interface SheetCardReference {
  id: string
  name: string
}

export interface AttributeValue {
  checked: boolean
  value: string
}

export type UpgradeCheckBucket = Record<number, boolean>

export interface CheckedUpgrades {
  tier1: UpgradeCheckBucket
  tier2: UpgradeCheckBucket
  tier3: UpgradeCheckBucket
  [key: string]: UpgradeCheckBucket
}

// ===== 冒险笔记相关类型定义 =====

export interface AdventureNotesCharacterProfile {
  race?: string          // 种族
  age?: string           // 年龄  
  gender?: string        // 性别
  height?: string        // 身高
  weight?: string        // 体重
  skinColor?: string     // 肤色
  eyeColor?: string      // 瞳色
  hairColor?: string     // 发色
  birthplace?: string    // 出生地
  faith?: string         // 信仰/理念
  otherInfo?: string     // 其他信息
}

export interface AdventureNotesPlayerInfo {
  nickname?: string      // 昵称
  preference?: string    // 偏好
  activeTime?: string    // 活动时间
  playStyle?: string     // 游戏风格
}

export interface AdventureNotesRelationshipEntry {
  name?: string
  relation?: string
  identity?: string
  circle?: string
  detail?: string
  detailExtra?: string
}

export interface AdventureNotesLifePathData {
  cultureOrigin?: string
  personality?: string
  valuedThing?: string
  treasuredBelonging?: string
  attitudeToOthers?: string
  childhoodEnvironment?: string
  familyCrisis?: string
  lifeGoal?: string
  friends?: AdventureNotesRelationshipEntry[]
  enemies?: AdventureNotesRelationshipEntry[]
  loveProfile?: AdventureNotesRelationshipEntry
}

export interface AdventureLogEntry {
  name?: string          // 冒险名称
  levelRange?: string    // 等级跨度
  trauma?: string        // 创伤
  date?: string          // 时间
}

export interface AdventureNotesData {
  // 生命路径（当前页主体）
  lifePath?: AdventureNotesLifePathData

  // 角色简介（左栏上部）
  characterProfile?: AdventureNotesCharacterProfile
  
  // 玩家信息（左栏下部）
  playerInfo?: AdventureNotesPlayerInfo
  
  // 故事内容（右栏）
  backstory?: string       // 背景故事
  milestones?: string      // 大事记
  
  // 冒险履历（右栏底部，动态数组）
  adventureLog?: AdventureLogEntry[]
}

export interface SheetData {
  // 通用属性
  name: string
  characterImage?: string
  level: string
  proficiency: number | boolean[]
  ancestry1?: string
  ancestry2?: string
  profession: string
  community: string
  subclass?: string

  // New fields for storing full card references to avoid compatibility issues
  professionRef?: SheetCardReference
  ancestry1Ref?: SheetCardReference
  ancestry2Ref?: SheetCardReference
  communityRef?: SheetCardReference
  subclassRef?: SheetCardReference

  evasion?: string
  agility?: AttributeValue
  strength?: AttributeValue
  finesse?: AttributeValue
  instinct?: AttributeValue
  presence?: AttributeValue
  knowledge?: AttributeValue
  // ===== 统一为数组类型的字段 =====
  gold: boolean[]
  experience: string[]
  experienceValues?: string[] // 经验数值，与 experience 一一对应
  hope: number        // 当前希望值 (0-hopeMax)
  hopeMax?: number    // 希望最大值，默认6
  hp?: boolean[]
  stress?: boolean[]
  armorBoxes?: boolean[]
  inventory: string[]
  characterBackground?: string
  characterAppearance?: string
  characterMotivation?: string
  cards: StandardCard[]
  inventory_cards?: StandardCard[] // 新增：库存卡组
  favoriteDomainCardIds: string[]
  checkedUpgrades?: CheckedUpgrades
  minorThreshold?: string
  majorThreshold?: string
  goldAmount?: string
  reputationAmount?: string
  armorValue?: string
  armorBonus?: string
  armorMax?: number
  humanityInitialBase?: string
  humanityCurrent?: string
  humanityCyberLoad?: string
  hpMax?: number
  stressMax?: number
  primaryWeaponName?: string
  primaryWeaponTrait?: string
  primaryWeaponDamage?: string
  primaryWeaponFeature?: string
  secondaryWeaponName?: string
  secondaryWeaponTrait?: string
  secondaryWeaponDamage?: string
  secondaryWeaponFeature?: string
  armorName?: string
  armorBaseScore?: string
  armorThreshold?: string
  armorFeature?: string
  // ===== 多角色系统新增字段已移除 focused_card_ids =====
  // focused_card_ids 字段已被移除，聚焦功能由 cards 数组直接表示
  
  // ===== 页面可见性控制 =====
  pageVisibility?: {
    adventureNotes: boolean   // 冒险笔记页
  }

  // ===== 冒险笔记数据 =====
  adventureNotes?: AdventureNotesData

  // ===== 临时索引签名，兼容动态key访问，后续逐步收敛类型安全 =====
  // [key: string]: any // 已废弃，彻底类型安全后移除
}

