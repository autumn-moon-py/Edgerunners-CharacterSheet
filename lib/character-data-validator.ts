/**
 * 角色数据验证器 - 通用的数据验证和清理功能
 * 
 * 功能：
 * 1. 验证角色数据的基本结构和必需字段
 * 2. 数据类型检查和转换
 * 3. 数据清理和标准化
 * 4. 兼容性检查和警告
 */

import { SheetData } from './sheet-data'
import { StandardCard } from '@/card/card-types'
import { defaultSheetData } from './default-sheet-data'
import type { AttributeValue, CheckedUpgrades } from './sheet-data'
import { migrateSheetData } from './sheet-data-migration'

export interface ValidationResult {
  valid: boolean
  data?: SheetData
  error?: string
  warnings: string[]
}

/**
 * 验证SheetData对象的基本结构
 */
export function validateSheetData(data: any): data is SheetData {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 检查必需字段
  const requiredFields = ['name', 'level', 'gold', 'experience', 'hope', 'inventory', 'cards']
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.warn(`Missing required field: ${field}`)
      return false
    }
  }

  // 检查数组字段（hope 已改为 number，不在此检查）
  const arrayFields = ['gold', 'experience', 'inventory', 'cards']
  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      console.warn(`Field ${field} should be an array`)
      return false
    }
  }

  // hope 字段支持 number 或 boolean[] 两种格式（向后兼容）
  if (typeof data.hope !== 'number' && !Array.isArray(data.hope)) {
    console.warn('Field hope should be a number or boolean array')
    return false
  }

  // 检查卡组结构，允许空槽卡存在
  if (data.cards.some((card: unknown) => !isValidCard(card))) {
    console.warn('Invalid card structure in cards array')
    return false
  }

  if (Array.isArray(data.inventory_cards) && data.inventory_cards.some((card: unknown) => !isValidCard(card))) {
    console.warn('Invalid card structure in inventory_cards array')
    return false
  }

  return true
}

/**
 * 验证卡牌对象是否有效
 */
export function isValidCard(card: any): card is StandardCard {
  return card &&
    typeof card === 'object' &&
    typeof card.id === 'string' &&
    typeof card.name === 'string' &&
    card.type !== undefined
}

/**
 * 清理和标准化数据
 */
export function cleanAndNormalizeData(data: any): SheetData {
  // 创建一个新的对象，只保留有效的字段
  const cleaned: SheetData = {
    name: String(data.name || ''),
    level: String(data.level || '1'),
    proficiency: Array.isArray(data.proficiency) ? data.proficiency : (typeof data.proficiency === 'number' ? data.proficiency : 0),

    // 字符串字段
    ancestry1: data.ancestry1 ? String(data.ancestry1) : undefined,
    ancestry2: data.ancestry2 ? String(data.ancestry2) : undefined,
    profession: String(data.profession || ''),
    community: String(data.community || ''),
    subclass: data.subclass ? String(data.subclass) : undefined,

    // 卡牌引用
    professionRef: data.professionRef || undefined,
    ancestry1Ref: data.ancestry1Ref || undefined,
    ancestry2Ref: data.ancestry2Ref || undefined,
    communityRef: data.communityRef || undefined,
    subclassRef: data.subclassRef || undefined,

    // 属性值
    evasion: data.evasion ? String(data.evasion) : undefined,
    agility: migrateAttributeValue(data.agility),
    strength: migrateAttributeValue(data.strength),
    finesse: migrateAttributeValue(data.finesse),
    instinct: migrateAttributeValue(data.instinct),
    presence: migrateAttributeValue(data.presence),
    knowledge: migrateAttributeValue(data.knowledge),

    // 数组字段 - 确保都是数组
    gold: Array.isArray(data.gold) ? data.gold : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    experienceValues: Array.isArray(data.experienceValues) ? data.experienceValues : undefined,

    // Hope 验证和转换（支持 number 和 boolean[] 两种格式）
    hope: (() => {
      if (typeof data.hope === 'number') {
        return Math.max(0, Math.min(data.hope, data.hopeMax || 12))
      }
      if (Array.isArray(data.hope)) {
        const lastLit = data.hope.lastIndexOf(true)
        return lastLit >= 0 ? lastLit + 1 : 0
      }
      return 0
    })(),

    hopeMax: (() => {
      if (typeof data.hopeMax === 'number') {
        return Math.max(1, Math.min(data.hopeMax, 12))
      }
      if (Array.isArray(data.hope)) {
        return data.hope.length || 6
      }
      return 6
    })(),

    hp: Array.isArray(data.hp) ? data.hp : undefined,
    stress: Array.isArray(data.stress) ? data.stress : undefined,
    armorBoxes: Array.isArray(data.armorBoxes) ? data.armorBoxes : undefined,
    inventory: Array.isArray(data.inventory) ? data.inventory : [],

    // 角色描述
    characterBackground: data.characterBackground ? String(data.characterBackground) : undefined,
    characterAppearance: data.characterAppearance ? String(data.characterAppearance) : undefined,
    characterMotivation: data.characterMotivation ? String(data.characterMotivation) : undefined,
    characterImage: data.characterImage ? String(data.characterImage) : undefined,

    // 卡牌
    cards: Array.isArray(data.cards) ? data.cards.filter(isValidCard) : [],
    inventory_cards: Array.isArray(data.inventory_cards) ? data.inventory_cards.filter(isValidCard) : undefined,
    favoriteDomainCardIds: Array.isArray(data.favoriteDomainCardIds)
      ? Array.from(new Set(
          data.favoriteDomainCardIds.flatMap((value: unknown) => {
            if (typeof value !== 'string') {
              return []
            }

            const normalizedValue = value.trim()
            return normalizedValue ? [normalizedValue] : []
          })
        ))
      : [],
    checkedUpgrades: normalizeCheckedUpgrades(data.checkedUpgrades),

    // 战斗相关
    minorThreshold: data.minorThreshold ? String(data.minorThreshold) : undefined,
    majorThreshold: data.majorThreshold ? String(data.majorThreshold) : undefined,
    armorValue: data.armorValue ? String(data.armorValue) : undefined,
    armorBonus: data.armorBonus ? String(data.armorBonus) : undefined,
    armorMax: typeof data.armorMax === 'number' ? data.armorMax : undefined,
    humanityInitialBase: data.humanityInitialBase ? String(data.humanityInitialBase) : undefined,
    humanityCurrent: data.humanityCurrent ? String(data.humanityCurrent) : undefined,
    humanityCyberLoad: data.humanityCyberLoad ? String(data.humanityCyberLoad) : undefined,
    hpMax: typeof data.hpMax === 'number' ? data.hpMax : undefined,
    stressMax: typeof data.stressMax === 'number' ? data.stressMax : undefined,

    // 武器信息
    primaryWeaponName: data.primaryWeaponName ? String(data.primaryWeaponName) : undefined,
    primaryWeaponTrait: data.primaryWeaponTrait ? String(data.primaryWeaponTrait) : undefined,
    primaryWeaponDamage: data.primaryWeaponDamage ? String(data.primaryWeaponDamage) : undefined,
    primaryWeaponFeature: data.primaryWeaponFeature ? String(data.primaryWeaponFeature) : undefined,
    secondaryWeaponName: data.secondaryWeaponName ? String(data.secondaryWeaponName) : undefined,
    secondaryWeaponTrait: data.secondaryWeaponTrait ? String(data.secondaryWeaponTrait) : undefined,
    secondaryWeaponDamage: data.secondaryWeaponDamage ? String(data.secondaryWeaponDamage) : undefined,
    secondaryWeaponFeature: data.secondaryWeaponFeature ? String(data.secondaryWeaponFeature) : undefined,

    // 护甲信息
    armorName: data.armorName ? String(data.armorName) : undefined,
    armorBaseScore: data.armorBaseScore ? String(data.armorBaseScore) : undefined,
    armorThreshold: data.armorThreshold ? String(data.armorThreshold) : undefined,
    armorFeature: data.armorFeature ? String(data.armorFeature) : undefined,

    // 页面可见性
    pageVisibility: data.pageVisibility && typeof data.pageVisibility === 'object'
      ? {
          adventureNotes: Boolean(data.pageVisibility.adventureNotes),
        }
      : undefined,

    // 冒险笔记数据 - 直接传递，让迁移函数处理  
    adventureNotes: data.adventureNotes || undefined
  }

  return cleaned
}

function normalizeCheckedUpgrades(value: unknown): CheckedUpgrades | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const source = value as Record<string, unknown>
  const normalized: CheckedUpgrades = {
    tier1: {},
    tier2: {},
    tier3: {},
  }

  Object.entries(source).forEach(([key, bucket]) => {
    if (!bucket || typeof bucket !== 'object') {
      return
    }

    normalized[key] = Object.entries(bucket as Record<string, unknown>).reduce<Record<number, boolean>>((result, [index, checked]) => {
      const numericIndex = Number(index)
      if (!Number.isNaN(numericIndex)) {
        result[numericIndex] = Boolean(checked)
      }
      return result
    }, {})
  })

  return normalized
}

/**
 * 验证导入的数据是否与当前版本兼容
 */
export function validateCompatibility(data: SheetData): { compatible: boolean; warnings: string[] } {
  const warnings: string[] = []

  // 检查必需字段
  if (!data.name || data.name.trim() === '') {
    warnings.push('角色名称为空')
  }

  if (!data.level || data.level.trim() === '') {
    warnings.push('角色等级为空')
  }

  // 检查数组字段的完整性
  if (!Array.isArray(data.gold) || data.gold.length === 0) {
    warnings.push('欧元数据可能不完整')
  }

  if (!Array.isArray(data.experience) || data.experience.length === 0) {
    warnings.push('经验数据可能不完整')
  }

  // hope 字段已在 validateSheetData() 中验证类型，任何值（0-8）都是合法的，无需警告

  if (!Array.isArray(data.cards)) {
    warnings.push('卡牌数据缺失')
  }

  // 兼容性检查通过，如果有警告不影响导入
  return {
    compatible: true,
    warnings
  }
}

/**
 * 通用的角色数据验证和处理函数
 * 适用于JSON和HTML导入
 */
export function validateAndProcessCharacterData(rawData: any, source: 'json' | 'html' = 'json'): ValidationResult {
  try {
    console.log(`[Data Validation] 开始验证${source.toUpperCase()}数据...`)

    // 1. 基本类型检查
    if (!rawData || typeof rawData !== 'object') {
      return {
        valid: false,
        error: '数据格式无效，必须是JSON对象',
        warnings: []
      }
    }

    // 2. 结构验证
    if (!validateSheetData(rawData)) {
      return {
        valid: false,
        error: '角色数据结构验证失败，缺少必需字段或字段类型不正确',
        warnings: []
      }
    }

    // 3. 数据清理和标准化
    const cleanedData = cleanAndNormalizeData(rawData)

    // 4. 与默认数据合并（保持向后兼容）
    let mergedData: any = { 
      ...defaultSheetData, 
      ...cleanedData
    }

    // 保留特殊字段到合并后的数据中（用于向后兼容）
    if ((rawData as any).focused_card_ids) {
      mergedData.focused_card_ids = (rawData as any).focused_card_ids
    }

    // 5. 应用数据迁移
    mergedData = migrateSheetData(mergedData);
    console.log(`[Data Validation] Applied data migrations for ${source.toUpperCase()}`)

    // 6. 兼容性检查
    const compatibility = validateCompatibility(mergedData)

    console.log(`[Data Validation] ${source.toUpperCase()}数据验证成功:`, mergedData.name)

    return {
      valid: true,
      data: mergedData,
      warnings: compatibility.warnings
    }

  } catch (error) {
    console.error(`[Data Validation] ${source.toUpperCase()}数据验证失败:`, error)
    return {
      valid: false,
      error: `数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`,
      warnings: []
    }
  }
}

/**
 * 从JSON字符串验证和处理角色数据
 */
export function validateJSONCharacterData(jsonString: string): ValidationResult {
  try {
    const rawData = JSON.parse(jsonString)
    return validateAndProcessCharacterData(rawData, 'json')
  } catch (parseError) {
    return {
      valid: false,
      error: `JSON解析失败: ${parseError instanceof Error ? parseError.message : '文件格式不正确'}`,
      warnings: []
    }
  }
}

/**
 * 迁移单个属性值
 */
function migrateAttributeValue(attrValue: any): AttributeValue | undefined {
  if (!attrValue || typeof attrValue !== 'object') {
    return undefined
  }
  
  // 检查是否是有效的AttributeValue格式
  if ('checked' in attrValue && 'value' in attrValue) {
    return {
      checked: Boolean(attrValue.checked),
      value: String(attrValue.value || '')
    }
  }
  
  return undefined
}
