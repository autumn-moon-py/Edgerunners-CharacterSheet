"use client"

import { isEmptyCard, type StandardCard } from "@/card/card-types"
import { formatDomainCardLoadLabel, formatDomainCardPrice } from "@/lib/domain-card-price"

function MobilePrintDeckCard({ card }: { card: StandardCard }) {
  const displayItem3 = card.type === "domain" ? formatDomainCardLoadLabel(card.cardSelectDisplay?.item3) || "" : card.cardSelectDisplay?.item3 || ""
  const domainPriceLabel = card.type === "domain" ? formatDomainCardPrice(card.level) : null

  return (
    <div className="rounded-[3px] border border-gray-200 bg-white p-2">
      <div className="truncate text-sm font-semibold text-gray-900">{card.name}</div>
      <div className="mt-[5px] flex items-center gap-2 text-[10px] text-gray-500">
        <span className="min-w-0 truncate">{card.cardSelectDisplay?.item1 || ""}</span>
        <span className="whitespace-nowrap">{displayItem3}</span>
        <span className="whitespace-nowrap font-medium text-emerald-600">{domainPriceLabel || ""}</span>
      </div>
    </div>
  )
}

interface MobilePrintPageTwoCardPageProps {
  title: string
  cards: StandardCard[]
}

export function MobilePrintPageTwoCardPage({ title, cards }: MobilePrintPageTwoCardPageProps) {
  const validCards = cards.filter((card) => !isEmptyCard(card))

  if (validCards.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="pl-[3px] text-sm font-semibold text-gray-900">{title}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {validCards.map((card) => (
          <MobilePrintDeckCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
