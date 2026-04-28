"use client"

import { isVariantCard, type ExtendedStandardCard } from "@/card/card-types"
import { useUnifiedCardStore } from "@/card/stores/unified-card-store"

export interface VariantWeaponData {
  id: string
  名称: string
  等级: string
  属性: string
  范围: string
  伤害: string
  负荷: string
  特性名称: string
  描述: string
}

export interface VariantArmorData {
  id: string
  名称: string
  等级: string
  伤害阈值: string
  护甲值: number
  特性名称: string
  描述: string
}

const toText = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim()
  }

  if (value == null) {
    return ""
  }

  return String(value).trim()
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  const parsed = Number.parseInt(toText(value), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const isVariantOfType = (card: ExtendedStandardCard, type: string): boolean =>
  isVariantCard(card) && card.variantSpecial?.realType === type

export function buildVariantFeatureText(featureName?: string, description?: string): string {
  const name = toText(featureName)
  const desc = toText(description)

  if (!name && !desc) {
    return ""
  }

  return `${name ? `${name}: ` : ""}${desc}`.trim()
}

export function buildWeaponSummary(weapon?: Partial<VariantWeaponData>): string {
  if (!weapon) {
    return ""
  }

  return [toText(weapon.属性), toText(weapon.范围), toText(weapon.负荷)]
    .filter(Boolean)
    .join(" / ")
}

export function extractWeaponVariants(cards: ExtendedStandardCard[]): VariantWeaponData[] {
  return cards
    .filter((card) => isVariantOfType(card, "武器"))
    .map((card) => ({
      id: card.id,
      名称: toText(card.name || card.headerDisplay),
      等级: toText(card.level),
      属性: toText(card.variantSpecial?.属性),
      范围: toText(card.variantSpecial?.范围),
      伤害: toText(card.variantSpecial?.伤害),
      负荷: toText(card.variantSpecial?.负荷),
      特性名称: toText(card.variantSpecial?.特性名称),
      描述: toText(card.variantSpecial?.描述 || card.description),
    }))
    .filter((weapon) => weapon.名称)
}

export function extractArmorVariants(cards: ExtendedStandardCard[]): VariantArmorData[] {
  return cards
    .filter((card) => isVariantOfType(card, "护甲"))
    .map((card) => ({
      id: card.id,
      名称: toText(card.name || card.headerDisplay),
      等级: toText(card.level),
      伤害阈值: toText(card.variantSpecial?.伤害阈值),
      护甲值: toNumber(card.variantSpecial?.护甲值),
      特性名称: toText(card.variantSpecial?.特性名称),
      描述: toText(card.variantSpecial?.描述 || card.description),
    }))
    .filter((armor) => armor.名称)
}

export function loadWeaponVariantsFromStore(): VariantWeaponData[] {
  const store = useUnifiedCardStore.getState()
  if (!store.initialized) {
    return []
  }

  return extractWeaponVariants(store.loadAllCards())
}

export function loadArmorVariantsFromStore(): VariantArmorData[] {
  const store = useUnifiedCardStore.getState()
  if (!store.initialized) {
    return []
  }

  return extractArmorVariants(store.loadAllCards())
}
