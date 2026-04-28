import type { ImportData } from "./card-types"

export type PackageCardType =
  | "profession"
  | "ancestry"
  | "community"
  | "subclass"
  | "domain"
  | "variant"

type LooseCard = Record<string, unknown>

function sanitizeProfessionCard(card: LooseCard): LooseCard {
  const sanitized = { ...card }
  delete sanitized.简介
  delete sanitized.起始物品
  return sanitized
}

function sanitizeSubclassCard(card: LooseCard): LooseCard {
  const sanitized = { ...card }
  delete sanitized.施法
  delete sanitized.施法属性
  return sanitized
}

export function sanitizeCardForPackageType<T>(type: PackageCardType, card: T): T {
  if (!card || typeof card !== "object") {
    return card
  }

  switch (type) {
    case "profession":
      return sanitizeProfessionCard(card as LooseCard) as T
    case "subclass":
      return sanitizeSubclassCard(card as LooseCard) as T
    default:
      return { ...(card as LooseCard) } as T
  }
}

export function sanitizeImportData<T extends ImportData>(data: T): T {
  const cloned = JSON.parse(JSON.stringify(data)) as T
  const sanitized = cloned as T & Record<string, unknown>

  delete sanitized.isModified
  delete sanitized.lastSaved

  if (Array.isArray(cloned.profession)) {
    cloned.profession = cloned.profession.map(card =>
      sanitizeCardForPackageType("profession", card)
    ) as T["profession"]
  }

  if (Array.isArray(cloned.subclass)) {
    cloned.subclass = cloned.subclass.map(card =>
      sanitizeCardForPackageType("subclass", card)
    ) as T["subclass"]
  }

  return cloned
}
