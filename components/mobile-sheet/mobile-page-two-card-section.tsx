"use client"

import { useMemo, useRef, useState } from "react"
import { CardSelectionModal } from "@/components/modals/card-selection-modal"
import { useCardActions, useSafeSheetData } from "@/lib/sheet-store"
import { createEmptyCard, getVariantRealType, isEmptyCard, isVariantCard, type StandardCard } from "@/card/card-types"
import { getCardTypeName, convertToStandardCard } from "@/card"
import { formatDomainCardLoadLabel, formatDomainCardPrice } from "@/lib/domain-card-price"

type DeckType = "focused" | "inventory"

function getSpecialSlotLabel(index: number): string {
  switch (index) {
    case 0:
      return "职业"
    case 1:
      return "子职业"
    case 2:
      return "种族一"
    case 3:
      return "种族二"
    case 4:
      return "社群"
    default:
      return "普通"
  }
}

function getDisplayTypeName(card: StandardCard): string {
  if (isVariantCard(card)) {
    const realType = getVariantRealType(card)
    if (realType) {
      return getCardTypeName(realType)
    }
  }

  const typeName = getCardTypeName(card.type)
  if (card.type.includes("domain") && card.level) {
    return `${typeName} Lv.${card.level}`
  }

  return typeName
}

function MobileDeckCard({
  card,
  index,
  isSpecial,
  isEmptySlot,
  showPrice,
  onSelect,
  onDelete,
  onMoveCard,
}: {
  card: StandardCard
  index: number
  isSpecial: boolean
  isEmptySlot?: boolean
  showPrice?: boolean
  onSelect: () => void
  onDelete: () => void
  onMoveCard?: () => void
}) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const standardCard = card && typeof card === "object" && "type" in card && "name" in card ? (card as StandardCard) : convertToStandardCard(card)
  const displayItem3 = standardCard?.type === "domain" ? formatDomainCardLoadLabel(standardCard.cardSelectDisplay?.item3) || "" : standardCard?.cardSelectDisplay?.item3 || ""
  const domainPriceLabel = standardCard?.type === "domain" ? formatDomainCardPrice(standardCard.level) : null
  const hasCard = card?.name && !isEmptyCard(card)

  const startHold = () => {
    if (!onMoveCard) {
      return
    }

    holdTimerRef.current = setTimeout(() => {
      onMoveCard()
      holdTimerRef.current = null
    }, 450)
  }

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  return (
    <div className={`rounded-[3px] border bg-white p-2 ${isSpecial ? "border-yellow-300" : "border-gray-200"}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className={`text-[10px] font-medium ${isSpecial ? "text-yellow-700" : "text-gray-500"}`}>
          {isSpecial ? getSpecialSlotLabel(index) : getDisplayTypeName(standardCard)}
        </div>
        {!isSpecial && hasCard ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-gray-400"
            title="删除卡牌"
          >
            ×
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onSelect}
        onMouseDown={startHold}
        onMouseUp={clearHold}
        onMouseLeave={clearHold}
        onTouchStart={startHold}
        onTouchEnd={clearHold}
        onTouchCancel={clearHold}
        disabled={isSpecial}
        className={`w-full text-left ${isSpecial ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="truncate text-sm font-semibold text-gray-900">{hasCard ? standardCard.name : "空卡位"}</div>
        {hasCard ? (
          <div className="mt-[5px] flex items-center gap-2 text-[10px] text-gray-500">
            <span className="min-w-0 truncate">{standardCard.cardSelectDisplay?.item1 || ""}</span>
            <span className="whitespace-nowrap">{displayItem3}</span>
            <span className="whitespace-nowrap font-medium text-emerald-600">{showPrice && domainPriceLabel ? domainPriceLabel : ""}</span>
          </div>
        ) : (
          <div className="mt-1 text-[10px] text-gray-400">{isSpecial ? "" : isEmptySlot ? "点击添加卡牌" : "点击选择卡牌"}</div>
        )}
      </button>
    </div>
  )
}

export function MobilePageTwoCardSection() {
  const formData = useSafeSheetData()
  const { deleteCard, moveCard, updateCard } = useCardActions()
  const [activeDeck, setActiveDeck] = useState<DeckType>("focused")
  const [cardSelectionModalOpen, setCardSelectionModalOpen] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)

  const focusedCards = useMemo(() => {
    return Array.from({ length: 20 }, (_, index) => formData.cards?.[index] || createEmptyCard())
  }, [formData.cards])

  const inventoryCards = useMemo(() => {
    return Array.from({ length: 20 }, (_, index) => formData.inventory_cards?.[index] || createEmptyCard())
  }, [formData.inventory_cards])

  const currentCards = activeDeck === "focused" ? focusedCards : inventoryCards
  const filledFocusedCount = focusedCards.filter((card) => !isEmptyCard(card)).length
  const filledInventoryCount = inventoryCards.filter((card) => !isEmptyCard(card)).length

  const visibleCards = useMemo(() => {
    if (activeDeck === "focused") {
      const specialCards = focusedCards.slice(0, 5)
      const domainCards = focusedCards.slice(5).filter((card) => !isEmptyCard(card))
      const nextOpenIndex = Math.min(5 + domainCards.length, 19)

      return [
        ...specialCards.map((card, index) => ({ card, index, isSpecial: true })),
        ...domainCards.map((card, offset) => ({ card, index: offset + 5, isSpecial: false })),
        ...(domainCards.length < 15
          ? [{ card: createEmptyCard(), index: nextOpenIndex, isSpecial: false, isEmptySlot: true }]
          : []),
      ]
    }

    const cards = inventoryCards.filter((card) => !isEmptyCard(card))

    return cards.map((card, index) => ({ card, index, isSpecial: false }))
  }, [activeDeck, focusedCards, inventoryCards])

  const handleCardClick = (index: number) => {
    if (activeDeck === "focused" && index < 5) {
      return
    }

    setSelectedCardIndex(index)
    setCardSelectionModalOpen(true)
  }

  return (
    <div className="space-y-2">
      <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveDeck("focused")}
              className={`rounded-[3px] px-3 py-1 text-xs font-medium ${activeDeck === "focused" ? "border border-gray-900 bg-white text-gray-900" : "text-gray-500"}`}
            >
              聚焦卡组 {filledFocusedCount}/20
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck("inventory")}
              className={`rounded-[3px] px-3 py-1 text-xs font-medium ${activeDeck === "inventory" ? "border border-gray-900 bg-white text-gray-900" : "text-gray-500"}`}
            >
              库存卡组 {filledInventoryCount}/20
            </button>
          </div>
          <div className="text-[10px] text-gray-900">长按卡牌切换卡组</div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {visibleCards.map(({ card, index, isSpecial, isEmptySlot }) => (
            <MobileDeckCard
              key={`${activeDeck}-${index}`}
              card={card}
              index={index}
              isSpecial={isSpecial}
              isEmptySlot={isEmptySlot}
              showPrice={true}
              onSelect={() => handleCardClick(index)}
              onDelete={() => deleteCard(index, activeDeck === "inventory")}
              onMoveCard={
                !isSpecial && !isEmptySlot
                  ? () => {
                      moveCard(index, activeDeck === "inventory", activeDeck !== "inventory")
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {selectedCardIndex !== null ? (
        <CardSelectionModal
          isOpen={cardSelectionModalOpen}
          onClose={() => setCardSelectionModalOpen(false)}
          onSelect={(card) => {
            updateCard(selectedCardIndex, card, activeDeck === "inventory")
            setCardSelectionModalOpen(false)
            setSelectedCardIndex(null)
          }}
          selectedCardIndex={selectedCardIndex}
          initialTab="domain"
        />
      ) : null}
    </div>
  )
}
