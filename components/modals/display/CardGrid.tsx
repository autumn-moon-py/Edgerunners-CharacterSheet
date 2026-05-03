"use client"

import React from "react"
import { CardType, type StandardCard, type ExtendedStandardCard } from "@/card/card-types"
import { ImageCard } from "@/components/ui/image-card"
import { SelectableCard } from "@/components/ui/selectable-card"
import { useTextModeStore } from "@/lib/text-mode-store"
import { cn } from "@/lib/utils"

interface CardGridProps<T extends StandardCard | ExtendedStandardCard> {
  cards: T[]
  onCardClick?: (card: T) => void
  isTextMode?: boolean
  selectedCardId?: string
  refreshTrigger?: number
  className?: string
  autoHeightCards?: boolean
  showFavoriteButton?: boolean
  favoriteCardIds?: string[]
  onFavoriteToggle?: (card: T) => void
}

export function CardGrid<T extends StandardCard | ExtendedStandardCard>({
  cards, onCardClick, isTextMode: isTextModeProp,
  selectedCardId, refreshTrigger, className, autoHeightCards = false,
  showFavoriteButton = false, favoriteCardIds, onFavoriteToggle,
}: CardGridProps<T>) {
  const { isTextMode: globalTextMode } = useTextModeStore()
  const isTextMode = isTextModeProp ?? globalTextMode
  const useMasonryColumns = isTextMode && autoHeightCards
  const favoriteIdSet = new Set(favoriteCardIds ?? [])

  return (
    <div
      className={cn(
        useMasonryColumns
          ? "columns-2 [column-gap:0.5rem]"
          : "grid gap-4 justify-items-center",
        !useMasonryColumns && (isTextMode
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"),
        className
      )}
    >
      {cards.map((card, index) =>
        isTextMode ? (
          <SelectableCard
            key={card.id}
            card={card}
            onClick={() => onCardClick?.(card)}
            isSelected={card.id === selectedCardId}
            autoHeight={autoHeightCards}
            showFavoriteButton={showFavoriteButton && card.type === CardType.Domain}
            isFavorite={favoriteIdSet.has(card.id)}
            onFavoriteToggle={() => onFavoriteToggle?.(card)}
          />
        ) : (
          <ImageCard
            key={card.id}
            card={card}
            onClick={() => onCardClick?.(card)}
            isSelected={card.id === selectedCardId}
            priority={index < 6}
            refreshTrigger={refreshTrigger}
            autoHeight={autoHeightCards}
            showFavoriteButton={showFavoriteButton && card.type === CardType.Domain}
            isFavorite={favoriteIdSet.has(card.id)}
            onFavoriteToggle={() => onFavoriteToggle?.(card)}
          />
        )
      )}
    </div>
  )
}
