import type { VariantArmorData, VariantWeaponData } from "@/lib/equipment-variants"

const WEAPON_PRICE_BY_NAME: Record<string, number> = {
  "轻型近战": 100,
  "中型手枪": 200,
  "弓弩": 300,
  "中型近战": 300,
  "重型手枪": 400,
  "突击步枪": 400,
  "冲锋枪": 500,
  "霰弹枪": 500,
  "超重型手枪": 1000,
  "重型近战": 1200,
  "重型冲锋枪": 1500,
  "超重型近战": 1800,
  "狙击步枪": 8500,
  "榴弹发射器": 13000,
  "火箭筒": 18000,
}

const ARMOR_PRICE_BY_NAME: Record<string, number> = {
  "日常衣物": 200,
  "凯夫拉": 300,
  "轻型装甲夹克": 500,
  "中型装甲夹克": 1500,
  "重型装甲夹克": 1800,
  "重型战术护甲": 2000,
}

const BASE_PRICE_BY_LEVEL: Record<string, number> = {
  T1: 100,
  T2: 1000,
  T3: 5000,
  T4: 10000,
}

const MAX_PRICE_BY_LEVEL: Record<string, number> = {
  T1: 500,
  T2: 2000,
  T3: 10000,
  T4: 20000,
}

const PRICE_STEP_BY_LEVEL: Record<string, number> = {
  T1: 100,
  T2: 500,
  T3: 2500,
  T4: 10000,
}

function normalizeText(value?: string): string {
  return String(value || "").trim()
}

function applyFeaturePremium(level: string, price: number, featureName?: string): number {
  if (!normalizeText(featureName)) {
    return price
  }

  const step = PRICE_STEP_BY_LEVEL[level] ?? 0
  const max = MAX_PRICE_BY_LEVEL[level] ?? price
  return Math.min(price + step, max)
}

export function formatEquipmentPrice(price?: number): string {
  return typeof price === "number" && Number.isFinite(price) && price > 0 ? `${price}` : ""
}

export function getWeaponPrice(weapon?: Partial<VariantWeaponData>): number | undefined {
  const name = normalizeText(weapon?.名称)
  if (name && name in WEAPON_PRICE_BY_NAME) {
    return WEAPON_PRICE_BY_NAME[name]
  }

  const level = normalizeText(weapon?.等级)
  const basePrice = BASE_PRICE_BY_LEVEL[level]
  if (!basePrice) {
    return undefined
  }

  return applyFeaturePremium(level, basePrice, weapon?.特性名称)
}

export function getArmorPrice(armor?: Partial<VariantArmorData>): number | undefined {
  const name = normalizeText(armor?.名称)
  if (name && name in ARMOR_PRICE_BY_NAME) {
    return ARMOR_PRICE_BY_NAME[name]
  }

  const level = normalizeText(armor?.等级)
  const basePrice = BASE_PRICE_BY_LEVEL[level]
  if (!basePrice) {
    return undefined
  }

  return applyFeaturePremium(level, basePrice, armor?.特性名称)
}
