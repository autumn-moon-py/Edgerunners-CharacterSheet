/**
 * SheetData 迁移模块
 * 
 * 提供统一的数据迁移接口，处理各种历史数据格式的兼容性问题
 * 
 * 主要功能：
 * 1. 页面可见性字段迁移
 * 2. inventory_cards 字段添加
 * 3. 其他历史兼容性处理
 */

import type {
  SheetData,
  AdventureNotesLifePathData,
  AdventureNotesRelationshipEntry,
} from './sheet-data'
import { defaultSheetData } from './default-sheet-data'
import { createEmptyCard } from '@/card/card-types'

/**
 * 迁移选项接口
 */
export interface MigrationOptions {
  // 保留接口以保持向后兼容，但不再需要
}

/**
 * 页面可见性字段迁移
 * 统一压缩为当前仍在使用的 adventureNotes 开关
 */
function migratePageVisibility(data: SheetData): SheetData {
  const currentVisibility = data.pageVisibility as Record<string, boolean> | undefined
  const migrated = {
    ...data,
    pageVisibility: {
      adventureNotes: Boolean(currentVisibility?.adventureNotes)
    }
  }

  console.log('[Migration] Normalized pageVisibility')
  return migrated
}

/**
 * inventory_cards 字段迁移
 * 为缺少库存卡牌字段的旧数据添加空卡牌数组
 */
function migrateInventoryCards(data: SheetData): SheetData {
  if (data.inventory_cards) {
    return data
  }

  const migrated = { ...data }
  migrated.inventory_cards = Array(20).fill(0).map(() => createEmptyCard())
  console.log('[Migration] Added inventory_cards field')

  return migrated
}

function createEmptyRelationshipEntry(): AdventureNotesRelationshipEntry {
  return {
    name: '',
    relation: '',
    identity: '',
    circle: '',
    detail: '',
    detailExtra: '',
  }
}

function normalizeRelationshipEntry(entry?: AdventureNotesRelationshipEntry): AdventureNotesRelationshipEntry {
  return {
    ...createEmptyRelationshipEntry(),
    ...(entry || {}),
  }
}

function normalizeRelationshipList(
  entries?: AdventureNotesRelationshipEntry[],
  limit = 3
): AdventureNotesRelationshipEntry[] | undefined {
  if (!Array.isArray(entries)) {
    return undefined
  }

  return entries.slice(0, limit).map(normalizeRelationshipEntry)
}

function migrateLifePathData(lifePath?: AdventureNotesLifePathData): AdventureNotesLifePathData {
  const source = lifePath || {}
  const migrated: AdventureNotesLifePathData = { ...source }

  const normalizedFriends = normalizeRelationshipList(source.friends)
  if (normalizedFriends && normalizedFriends.length > 0) {
    migrated.friends = normalizedFriends
  }

  const normalizedEnemies = normalizeRelationshipList(source.enemies)
  if (normalizedEnemies && normalizedEnemies.length > 0) {
    migrated.enemies = normalizedEnemies
  }

  if (source.loveProfile) {
    migrated.loveProfile = normalizeRelationshipEntry(source.loveProfile)
  }

  return migrated
}

function migrateCheckedUpgrades(data: SheetData): SheetData {
  const source = data.checkedUpgrades

  if (source && typeof source === 'object') {
    return {
      ...data,
      checkedUpgrades: {
        ...source,
        tier1: source.tier1 ?? {},
        tier2: source.tier2 ?? {},
        tier3: source.tier3 ?? {},
      }
    }
  }

  return {
    ...data,
    checkedUpgrades: {
      tier1: {},
      tier2: {},
      tier3: {},
    }
  }
}

/**
 * 冒险笔记字段迁移
 * 为缺少冒险笔记字段的旧数据添加默认结构
 */
function migrateAdventureNotes(data: SheetData): SheetData {
  if (data.adventureNotes) {
    return {
      ...data,
      adventureNotes: {
        ...defaultSheetData.adventureNotes,
        ...data.adventureNotes,
        lifePath: migrateLifePathData(data.adventureNotes.lifePath)
      }
    }
  }

  const migrated = { ...data }
  migrated.adventureNotes = {
    ...defaultSheetData.adventureNotes,
    lifePath: migrateLifePathData(),
    characterProfile: {},
    playerInfo: {},
    backstory: '',
    milestones: '',
    adventureLog: Array(8).fill(null).map(() => ({
      name: '',
      levelRange: '',
      trauma: '',
      date: ''
    }))
  }
  
  console.log('[Migration] Added adventureNotes field')
  return migrated
}

/**
 * Hope 字段从 boolean[] 迁移到 number
 */
function migrateHopeToNumber(data: SheetData): SheetData {
  // 如果 hope 已经是 number，跳过
  if (typeof data.hope === 'number') {
    // 确保 hopeMax 存在
    if (!data.hopeMax) {
      const migrated = { ...data }
      migrated.hopeMax = 6
      console.log('[Migration] Added default hopeMax')
      return migrated
    }
    return data
  }

  // 如果 hope 是 boolean[]，进行转换
  if (Array.isArray(data.hope)) {
    const migrated = { ...data }
    const hopeArray = data.hope as boolean[]
    const lastLit = hopeArray.lastIndexOf(true)
    migrated.hope = lastLit >= 0 ? lastLit + 1 : 0
    migrated.hopeMax = hopeArray.length || 6

    console.log(`[Migration] Converted hope from boolean[] to number: ${migrated.hope}/${migrated.hopeMax}`)
    return migrated
  }

  // 其他情况，设置默认值
  const migrated = { ...data }
  migrated.hope = 0
  migrated.hopeMax = 6
  console.log('[Migration] Set default hope values')
  return migrated
}

/**
 * 清理废弃字段
 * 移除不再使用的字段，保持数据结构清洁
 */
function cleanupDeprecatedFields(data: SheetData): SheetData {
  const migrated = { ...data }

  // 移除废弃的字段
  if ('includePageThreeInExport' in migrated) {
    delete (migrated as any).includePageThreeInExport
    console.log('[Migration] Removed deprecated includePageThreeInExport field')
  }

  ;[
    'inventoryWeapon1Name',
    'inventoryWeapon1Trait',
    'inventoryWeapon1Damage',
    'inventoryWeapon1Feature',
    'inventoryWeapon1Primary',
    'inventoryWeapon1Secondary',
    'inventoryWeapon2Name',
    'inventoryWeapon2Trait',
    'inventoryWeapon2Damage',
    'inventoryWeapon2Feature',
    'inventoryWeapon2Primary',
    'inventoryWeapon2Secondary',
    'armorTemplate',
    'notebook',
    'companionImage',
    'companionDescription',
    'companionRange',
    'companionStress',
    'companionEvasion',
    'companionStressMax',
    'companionName',
    'companionWeapon',
    'companionExperience',
    'companionExperienceValue',
    'trainingOptions',
  ].forEach((field) => {
    if (field in migrated) {
      delete (migrated as Record<string, unknown>)[field]
    }
  })

  return migrated
}

/**
 * 主迁移函数 - 统一入口点
 * 
 * @param data 待迁移的数据（可能是不完整的 SheetData）
 * @param options 迁移选项，包含外部依赖
 * @returns 完整的已迁移 SheetData
 */
export function migrateSheetData(
  data: Partial<SheetData> | any, 
  _options: MigrationOptions = {}
): SheetData {
  // 1. 确保基本结构，与默认数据合并
  let migrated: SheetData = {
    ...defaultSheetData,
    ...data
  }

  // 2. 应用各项迁移（按依赖顺序执行）
  migrated = migratePageVisibility(migrated)
  migrated = migrateInventoryCards(migrated)
  migrated = migrateCheckedUpgrades(migrated)
  migrated = migrateAdventureNotes(migrated)

  // Phase 1: Hope 字段迁移
  migrated = migrateHopeToNumber(migrated)

  // 3. 清理废弃字段（最后执行）
  migrated = cleanupDeprecatedFields(migrated)

  return migrated
}

