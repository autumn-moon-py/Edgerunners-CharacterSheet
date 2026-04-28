import type { SheetData } from "./sheet-data"

export const PROFICIENCY_SLOT_LIMIT = 6

const DEFAULT_PROFICIENCY = [true, false, false, false, false, false] as const

export const createDefaultProficiency = (): boolean[] => [...DEFAULT_PROFICIENCY]

export const normalizeProficiency = (proficiency?: SheetData["proficiency"]): boolean[] => {
  if (Array.isArray(proficiency) && proficiency.length > 0) {
    return Array.from({ length: PROFICIENCY_SLOT_LIMIT }, (_, index) => Boolean(proficiency[index]))
  }

  if (typeof proficiency === "number" && Number.isFinite(proficiency)) {
    const litCount = Math.max(1, Math.min(Math.trunc(proficiency), PROFICIENCY_SLOT_LIMIT))
    return Array.from({ length: PROFICIENCY_SLOT_LIMIT }, (_, index) => index < litCount)
  }

  return createDefaultProficiency()
}

export const getProficiencyCount = (proficiency?: SheetData["proficiency"]): number => {
  if (Array.isArray(proficiency) && proficiency.length > 0) {
    return normalizeProficiency(proficiency).filter(Boolean).length
  }

  if (typeof proficiency === "number" && Number.isFinite(proficiency)) {
    return Math.max(1, Math.min(Math.trunc(proficiency), PROFICIENCY_SLOT_LIMIT))
  }

  return 1
}
