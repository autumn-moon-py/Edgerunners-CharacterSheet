"use client"

import { Button } from "@/components/ui/button"

interface MobilePreviewDockProps {
  onExportHTML: () => void
  onOpenSealDiceExport: () => void
  onClose: () => void
}

export function MobilePreviewDock({
  onExportHTML,
  onOpenSealDiceExport,
  onClose,
}: MobilePreviewDockProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white px-3 py-3 print:hidden">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button onClick={onExportHTML} variant="outline" className="h-11 rounded-[3px]">
          导出 HTML
        </Button>
        <Button onClick={onOpenSealDiceExport} variant="outline" className="h-11 rounded-[3px]">
          导出到骰子
        </Button>
        <Button onClick={onClose} variant="outline" className="h-11 rounded-[3px] border-red-300 text-red-600 hover:bg-red-50">
          返回编辑
        </Button>
      </div>
    </div>
  )
}
