"use client"

import type { SheetData } from "@/lib/sheet-data"

function PrintTextBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <h3 className="mb-1 text-[12px] font-bold text-center text-gray-900">{title}</h3>
      <div className="min-h-[220px] rounded-[3px] border border-gray-400 bg-white px-3 py-2 text-[11px] leading-[1.35] whitespace-pre-wrap break-words text-gray-800">
        {value || ""}
      </div>
    </div>
  )
}

interface MobilePrintPageTwoTextPreviewProps {
  sheetData: SheetData
}

export function MobilePrintPageTwoTextPreview({ sheetData }: MobilePrintPageTwoTextPreviewProps) {
  return (
    <div className="grid grid-cols-3 gap-1 mt-2 p-1">
      <PrintTextBlock title="角色简介" value={sheetData.characterBackground} />
      <PrintTextBlock title="背景故事" value={sheetData.adventureNotes?.backstory || ""} />
      <PrintTextBlock title="GM笔记" value={sheetData.characterMotivation} />
    </div>
  )
}
