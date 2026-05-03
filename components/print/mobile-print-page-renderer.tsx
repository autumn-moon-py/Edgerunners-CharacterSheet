"use client"

import type { SheetData } from "@/lib/sheet-data"
import { getPrintPages } from "@/lib/page-registry"
import { MobilePrintPageOne } from "@/components/print/mobile-print-page-one"
import { MobilePrintPageTwoCardPage } from "@/components/print/mobile-print-page-two-card-page"
import { MobilePrintPageTwoTextPreview } from "@/components/print/mobile-print-page-two-text-preview"
import { MobilePrintPageThree } from "@/components/print/mobile-print-page-three"

function MobilePrintPageShell({
  printClass,
  children,
}: {
  printClass: string
  children: React.ReactNode
}) {
  return (
    <div className={`${printClass} flex justify-center px-2 py-2`}>
      <div className="w-full max-w-xl space-y-2 border border-gray-200 bg-white p-2 pb-16 shadow-sm">{children}</div>
    </div>
  )
}

interface MobilePrintPageRendererProps {
  sheetData: SheetData
}

export function MobilePrintPageRenderer({ sheetData }: MobilePrintPageRendererProps) {
  const printPages = getPrintPages(sheetData)
  const shouldRenderAdventureNotes = Boolean(sheetData.pageVisibility?.adventureNotes)

  return (
    <>
      {printPages.map((page) => {
        switch (page.id) {
          case "page1":
            return (
              <MobilePrintPageShell key={page.id} printClass={page.printClass}>
                <MobilePrintPageOne />
              </MobilePrintPageShell>
            )
          case "focused-cards":
            return (
              <MobilePrintPageShell key={page.id} printClass={page.printClass}>
                <MobilePrintPageTwoCardPage title="聚焦卡组" cards={(sheetData.cards || []).slice(1)} />
              </MobilePrintPageShell>
            )
          case "inventory-cards":
            return (
              <MobilePrintPageShell key={page.id} printClass={page.printClass}>
                <MobilePrintPageTwoCardPage title="库存卡组" cards={sheetData.inventory_cards || []} />
              </MobilePrintPageShell>
            )
          case "page2-text-summary":
            return (
              <MobilePrintPageShell key={page.id} printClass={page.printClass}>
                <MobilePrintPageTwoTextPreview sheetData={sheetData} />
              </MobilePrintPageShell>
            )
          case "page3":
            return shouldRenderAdventureNotes ? (
              <MobilePrintPageShell key={page.id} printClass={page.printClass}>
                <MobilePrintPageThree />
              </MobilePrintPageShell>
            ) : null
          default:
            return null
        }
      })}

    </>
  )
}
