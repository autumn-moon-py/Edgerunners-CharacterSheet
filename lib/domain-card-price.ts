const DOMAIN_CARD_PRICE_RULES = [
    { maxLevel: 4, multiplier: 500 },
    { maxLevel: 7, multiplier: 1000 },
    { maxLevel: 10, multiplier: 5000 },
] as const

const DOMAIN_CARD_LOAD_PATTERN = /(?:RC|负荷)\.?\s*(\d+)/i
const isDisplayText = (value: string | null | undefined): value is string => Boolean(value)

function normalizeDomainCardLevel(level?: number | string): number | null {
    if (typeof level === "number") {
        if (!Number.isFinite(level) || level <= 0) {
            return null
        }
        return Math.trunc(level)
    }

    if (typeof level === "string") {
        const matched = level.match(/\d+/)
        if (!matched) {
            return null
        }

        const parsedLevel = Number.parseInt(matched[0], 10)
        if (!Number.isFinite(parsedLevel) || parsedLevel <= 0) {
            return null
        }

        return parsedLevel
    }

    return null
}

export function getDomainCardPriceMultiplier(level?: number | string): number | null {
    const normalizedLevel = normalizeDomainCardLevel(level)
    if (normalizedLevel === null) {
        return null
    }

    const matchedRule = DOMAIN_CARD_PRICE_RULES.find((rule) => normalizedLevel <= rule.maxLevel)
    return matchedRule?.multiplier ?? null
}

export function getDomainCardPrice(level?: number | string): number | null {
    const normalizedLevel = normalizeDomainCardLevel(level)
    const multiplier = getDomainCardPriceMultiplier(normalizedLevel ?? undefined)

    if (normalizedLevel === null || multiplier === null) {
        return null
    }

    return normalizedLevel * multiplier
}

export function formatDomainCardPrice(level?: number | string): string | null {
    const price = getDomainCardPrice(level)
    if (price === null) {
        return null
    }

    return `${price}€`
}

export function getDomainCardPriceLabel(level?: number | string, prefix = "价格 "): string | null {
    const formattedPrice = formatDomainCardPrice(level)
    if (!formattedPrice) {
        return null
    }

    return `${prefix}${formattedPrice}`
}

export function compactDisplayItems(values: Array<string | null | undefined>): string[] {
    return values.filter(isDisplayText)
}

export function formatDomainCardLoadLabel(value?: string | null): string | null {
    if (!value) {
        return null
    }

    const match = value.match(DOMAIN_CARD_LOAD_PATTERN)
    if (!match) {
        return value
    }

    return `负荷${match[1]}`
}
