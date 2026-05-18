import { CardType, type StandardCard } from "@/card/card-types"
import type { SheetData } from "@/lib/sheet-data"
import { safeEvaluateExpression } from "@/lib/number-utils"

const EXCLUDED_HUMANITY_LOAD_CLASSES = new Set(["载具改装", "载具改造"])

export function getCyberwareEchoCost(card: StandardCard): number {
  if (card.type !== CardType.Domain) {
    return 0
  }

  if (card.class && EXCLUDED_HUMANITY_LOAD_CLASSES.has(card.class)) {
    return 0
  }

  if (typeof card.domainSpecial?.回想 === "number") {
    return card.domainSpecial.回想
  }

  const match = card.cardSelectDisplay?.item3?.match(/(?:RC|负荷)\.?\s*(\d+)/i)
  return match ? Number(match[1]) : 0
}

export function hasManualHumanityValue(value?: string): value is string {
  return typeof value === "string" && value.trim() !== ""
}

export function getInitialHumanityBaseFromInstinct(instinctValue?: string): number {
  return Math.max(10, safeEvaluateExpression(instinctValue || "") * 10)
}

export function resolveFrozenInitialHumanityBase(
  sheetData: Pick<SheetData, "humanityInitialBase" | "instinct">
): number {
  const frozenValue = String(sheetData.humanityInitialBase || "").trim()
  if (frozenValue !== "") {
    return safeEvaluateExpression(frozenValue)
  }

  return getInitialHumanityBaseFromInstinct(sheetData.instinct?.value)
}

export function getInitialHumanity(
  sheetData: Pick<SheetData, "humanityInitialBase" | "instinct" | "level">
): number {
  return resolveFrozenInitialHumanityBase(sheetData) + getHumanityLevelBonus(sheetData.level)
}

export function getHumanityLevelBonus(levelValue?: string): number {
  const level = safeEvaluateExpression(levelValue || "")

  if (level >= 8) {
    return 15
  }

  if (level >= 5) {
    return 10
  }

  if (level >= 2) {
    return 5
  }

  return 0
}
