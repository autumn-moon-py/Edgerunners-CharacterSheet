"use client"

import type React from "react"
import { CharacterDescriptionSection } from "@/components/character-sheet-page-two-sections/character-description-section"
import { useSafeSheetData } from "@/lib/sheet-store"

export function PrintPageTwoTextSummary() {
  const formData = useSafeSheetData()
  const handleInputChange = (_event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 打印/导出态只复用原组件渲染，不处理输入。
  }

  return (
    <div className="w-full max-w-[210mm] mx-auto">
      <div className="a4-page p-2 bg-white text-gray-800 shadow-lg print:shadow-none rounded-md" style={{ width: "210mm" }}>
        <CharacterDescriptionSection formData={formData} handleInputChange={handleInputChange} />
      </div>
    </div>
  )
}
