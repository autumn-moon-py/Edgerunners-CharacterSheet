"use client"

import { useEffect, useCallback, useState, useMemo } from "react"
import { StandardCard, createEmptyCard, CardType, ALL_CARD_TYPES } from "@/card/card-types"
import { BaseCardModal, ModalHeader, ModalFilterBar } from "./base"
import { ContentStates, InfiniteCardGrid } from "./display"
import { MultiSelectFilter } from "./filters"
import { CardTypeSidebar } from "./card-selection/CardTypeSidebar"
import { useCardFiltering } from "@/hooks/use-card-filtering"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { CustomCardCreatorModal } from "./custom-card-creator-modal"
import { getActiveCharacterId } from "@/lib/multi-character-storage"
import { useSheetStore } from "@/lib/sheet-store"

const FAVORITES_TAB_ID = 'favorites'

interface CardSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (card: StandardCard) => void
  selectedCardIndex: number
  initialTab?: string
}

/**
 * 卡牌选择模态框
 *
 * 重构后的简化版本：
 * - 状态内部管理（通过 useCardFiltering hook）
 * - 使用 BaseCardModal 底座
 * - 使用统一的筛选器组件
 * - 代码量从 991 行减少到 ~140 行
 */
export function CardSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedCardIndex,
  initialTab,
}: CardSelectionModalProps) {
  // === 使用简化的筛选 Hook ===
  const {
    filteredCards,
    classOptions,
    levelOptions,
    batchOptions,
    state,
    actions,
    loading,
    error,
  } = useCardFiltering(initialTab)
  const favoriteDomainCardIds = useSheetStore((store) => store.sheetData.favoriteDomainCardIds)
  const toggleFavoriteDomainCard = useSheetStore((store) => store.toggleFavoriteDomainCard)


  // 本地搜索词（modal 关闭后自动清空）
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const [activeViewTab, setActiveViewTab] = useState<string | null>(null)

  // 刷新触发器（用于卡牌动画）
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 自定义卡牌模态框状态
  const [customCardModalOpen, setCustomCardModalOpen] = useState(false)

  const isFavoritesView = activeViewTab === FAVORITES_TAB_ID
  const isDomainContext = state.activeTab === CardType.Domain || isFavoritesView

  const favoriteDomainCards = useMemo(() => {
    const favoriteIds = new Set(favoriteDomainCardIds)
    return filteredCards.filter((card) => card.type === CardType.Domain && favoriteIds.has(card.id))
  }, [filteredCards, favoriteDomainCardIds])

  const cardsForCurrentView = isFavoritesView ? favoriteDomainCards : filteredCards
  const sidebarActiveTab = isFavoritesView ? FAVORITES_TAB_ID : state.activeTab
  const showDomainFavorites = state.activeTab === CardType.Domain || isFavoritesView

  // 本地搜索过滤（在 useCardFiltering 结果基础上再过滤）
  const searchedCards = useMemo(() => {
    if (!searchTerm.trim()) return cardsForCurrentView
    const term = searchTerm.toLowerCase()
    return cardsForCurrentView.filter(card =>
      card.name?.toLowerCase().includes(term) ||
      card.description?.toLowerCase().includes(term) ||
      card.cardSelectDisplay?.item1?.toLowerCase().includes(term) ||
      card.cardSelectDisplay?.item2?.toLowerCase().includes(term) ||
      card.cardSelectDisplay?.item3?.toLowerCase().includes(term)
    )
  }, [cardsForCurrentView, searchTerm])

  // === 无限滚动 ===
  const { displayedItems, hasMore, loadMore, scrollRef } = useInfiniteScroll({
    items: searchedCards,
    pageSize: 30,
  })

  // === 副作用 ===

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const updateLayout = () => {
      setIsMobileLayout(window.innerWidth <= 768)
    }

    updateLayout()
    window.addEventListener("resize", updateLayout)
    return () => window.removeEventListener("resize", updateLayout)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setActiveViewTab(null)
      setSearchTerm('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!showDomainFavorites && activeViewTab === FAVORITES_TAB_ID) {
      setActiveViewTab(null)
    }
  }, [activeViewTab, showDomainFavorites])

  // 筛选结果变化时触发动画（滚动重置由 useInfiniteScroll 内部处理）
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [searchedCards])

  // === 事件处理 ===

  const handleCardClick = useCallback((card: StandardCard) => {
    const cardToSelect = { ...card }
    if (!cardToSelect.type) {
      cardToSelect.type = state.activeTab
    }
    onSelect(cardToSelect)
    onClose()
  }, [state.activeTab, onSelect, onClose])

  const handleClearSelection = useCallback(() => {
    onSelect(createEmptyCard())
    onClose()
  }, [onSelect, onClose])

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setSearchTerm('')
    actions.resetAll()
  }, [actions])

  // Tab 切换
  const handleTabChange = useCallback((tab: string) => {
    if (tab === FAVORITES_TAB_ID) {
      setActiveViewTab(FAVORITES_TAB_ID)
      actions.setActiveTab(CardType.Domain)
      return
    }

    setActiveViewTab(null)
    actions.setActiveTab(tab)
  }, [actions])

  const mobileTypeOptions = useMemo(
    () => {
      const options: Array<{ value: string; label: string }> = [CardType.Domain, CardType.Profession, CardType.Subclass, CardType.Ancestry, CardType.Community].map((type) => ({
        value: type,
        label: ALL_CARD_TYPES.get(type) || type,
      }))

      if (showDomainFavorites) {
        options.splice(1, 0, {
          value: FAVORITES_TAB_ID,
          label: '收藏',
        })
      }

      return options
    },
    [showDomainFavorites],
  )

  // === 渲染 ===

  return (
    <>
    <BaseCardModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      sidebar={
        isMobileLayout ? undefined : (
        <CardTypeSidebar
          activeTab={sidebarActiveTab}
          onTabChange={handleTabChange}
          showDomainFavorites={showDomainFavorites}
        />
        )
      }
      header={
        <ModalHeader
          title={`选择卡牌 #${selectedCardIndex + 1}`}
          onClose={onClose}
          actions={
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSelection}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                清除选择
              </Button>
            </>
          }
        />
      }
    >
      <ModalFilterBar>
        {isMobileLayout ? (
          <MultiSelectFilter
            label="类型"
            options={mobileTypeOptions}
            selected={[sidebarActiveTab]}
            onChange={(types) => handleTabChange(types[types.length - 1] || CardType.Domain)}
            placeholder="领域"
            allSelectedText="当前类型"
            countSuffix="项已选"
            showSelectAll={false}
            className="min-w-[88px]"
          />
        ) : null}
        <MultiSelectFilter
          label="卡包"
          options={batchOptions.map(b => ({ value: b.id, label: `${b.name} (${b.cardCount})` }))}
          selected={state.selectedBatches}
          onChange={actions.setBatches}
          placeholder="未选卡包"
          allSelectedText="全部卡包"
          countSuffix="包已选"
          showSearch
          searchPlaceholder="搜索卡包..."
        />
        <MultiSelectFilter
          label="类别"
          options={classOptions}
          selected={state.selectedClasses}
          onChange={actions.setClasses}
          placeholder="未选类别"
          allSelectedText="全部类别"
          countSuffix="类已选"
          disabled={classOptions.length === 0}
        />
        <MultiSelectFilter
          label="等级"
          options={levelOptions}
          selected={state.selectedLevels}
          onChange={actions.setLevels}
          placeholder="未选等级"
          allSelectedText="全部等级"
          countSuffix="级已选"
          disabled={levelOptions.length === 0}
        />
        <div className="flex min-w-[200px] flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder=""
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleResetFilters}
            className="shrink-0 bg-gray-500 hover:bg-gray-600 text-white"
          >
            重置筛选
          </Button>
        </div>
      </ModalFilterBar>

        <div
          id="cardSelectionScrollable"
          ref={scrollRef}
          className={`flex-1 overflow-y-auto ${isMobileLayout ? "p-2" : "p-4"}`}
        >
        <ContentStates
          loading={loading}
          error={error}
          empty={searchedCards.length === 0}
          emptyMessage={isFavoritesView ? '还没有收藏的领域卡' : '未找到符合条件的卡牌'}
          loadingMessage="加载卡牌中..."
        >
          <InfiniteCardGrid
            cards={displayedItems}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onCardClick={handleCardClick}
            isTextMode={isMobileLayout ? true : undefined}
            totalCount={searchedCards.length}
            scrollableTarget="cardSelectionScrollable"
            refreshTrigger={refreshTrigger}
            className={isMobileLayout ? "gap-2" : "gap-6"}
            autoHeightCards={isMobileLayout}
            showFavoriteButton={isDomainContext}
            favoriteCardIds={favoriteDomainCardIds}
            onFavoriteToggle={(card) => toggleFavoriteDomainCard(card.id)}
          />
        </ContentStates>
      </div>
    </BaseCardModal>

    <CustomCardCreatorModal
      isOpen={customCardModalOpen}
      onClose={() => setCustomCardModalOpen(false)}
      onCreate={(card) => {
        onSelect(card)
        setCustomCardModalOpen(false)
        onClose()
      }}
      characterId={getActiveCharacterId() || "default"}
    />
  </>
  )
}
