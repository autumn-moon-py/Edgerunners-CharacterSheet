"use client"

import type React from "react"
import { useRef } from "react"
import { useSheetStore, useSafeSheetData } from "@/lib/sheet-store";
import { createEmptyCard, type StandardCard } from "@/card/card-types"

// Import sections
import { CharacterDescriptionSection } from "@/components/character-sheet-page-two-sections/character-description-section"
import { CardDeckSection } from "@/components/character-sheet-page-two-sections/card-deck-section"
import { UpgradeSection } from "@/components/character-sheet-page-two-sections/upgrade-section"
import { PageHeader } from "@/components/page-header"

export default function CharacterSheetPageTwo() {
  const { setSheetData: setFormData } = useSheetStore();
  const safeFormData = useSafeSheetData();

  // 使用ref来避免无限循环
  const isUpdatingRef = useRef(false)

  // Handle card changes
  const handleCardChange = (index: number, card: StandardCard) => {
    if (isUpdatingRef.current) return

    // 检查是否是空卡牌，如果是则不记录日志
    const isEmptyCard = !card || (!card.name && (!card.type || card.type === "unknown"))

    if (!isEmptyCard) {
      console.log(`[handleCardChange] 更新聚焦卡牌 #${index}:`, card)
    }

    isUpdatingRef.current = true

    setFormData((prev) => {
      const newCards = [...(prev.cards || [])]
      newCards[index] = card
      return { ...prev, cards: newCards }
    })

    // 重置标志
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }

  // Handle inventory card changes
  const handleInventoryCardChange = (index: number, card: StandardCard) => {
    if (isUpdatingRef.current) return

    // 检查是否是空卡牌，如果是则不记录日志
    const isEmptyCard = !card || (!card.name && (!card.type || card.type === "unknown"))

    if (!isEmptyCard) {
      console.log(`[handleInventoryCardChange] 更新库存卡牌 #${index}:`, card)
    }

    isUpdatingRef.current = true

    setFormData((prev) => {
      const newInventoryCards = [...(prev.inventory_cards || Array(20).fill(0).map(() => createEmptyCard()))]
      newInventoryCards[index] = card
      return { ...prev, inventory_cards: newInventoryCards }
    })

    // 重置标志
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }

  // 已移除聚焦卡牌变更处理函数 - 功能由双卡组系统取代

  // Update form data when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <>
      {/* 固定位置的按钮 - 移除建卡指引按钮，因为已经移到父组件 */}
      {/* 固定位置的按钮已移至父组件 */}
      <div></div>

      <div className="w-full max-w-[210mm] mx-auto">
        <div
          className="a4-page p-2 bg-white text-gray-800 shadow-lg print:shadow-none rounded-md"
          style={{ width: "210mm" }}
        >
          {/* Header - 调整职业名称显示框的大小 */}
          <PageHeader />

          {/* Character Description Section */}
          <CharacterDescriptionSection formData={safeFormData} handleInputChange={handleInputChange} />

          {/* Card Deck Section */}
          <CardDeckSection
          formData={safeFormData}
          onCardChange={handleCardChange}
          onInventoryCardChange={handleInventoryCardChange}
        />

          <div className="page-two-upgrade-section mt-3 grid grid-cols-3 gap-3 print:hidden">
            <UpgradeSection
              tier={1}
              title="T2 等级 2-4"
              description="当你到达2级时：获得一项额外+2经历，人性值+5，熟练度标记+1。"
              formData={safeFormData}
            />
            <UpgradeSection
              tier={2}
              title="T3 等级 5-7"
              description="当你到达5级时：获得一项额外+2经历，人性值+10，清除所有属性升级标记，熟练度标记+1。"
              formData={safeFormData}
            />
            <UpgradeSection
              tier={3}
              title="T4 等级 8-10"
              description="当你到达8级时：获得一项额外+2经历，人性值+15，清除所有属性升级标记，熟练度标记+1。"
              formData={safeFormData}
            />
          </div>
        </div>
      </div>
    </>
  )
}
