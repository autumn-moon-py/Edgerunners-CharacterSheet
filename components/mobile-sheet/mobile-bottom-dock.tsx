"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useState } from "react"
import { Download, FileText, FileType, Code, Dice5, FolderOpen, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileBottomDockProps {
  onPrintAll: () => void
  onOpenSealDiceExport: () => void
  onQuickExportPDF: () => void
  onQuickExportHTML: () => void
  onOpenCharacterManagement: () => void
  onQuickCreateArchive: () => void
  onQuickImportFromHTML: () => void
}

export function MobileBottomDock(props: MobileBottomDockProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-5 right-4 z-30 print:hidden">
        <Button
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-gray-950 p-0 text-white shadow-lg hover:bg-gray-800"
          aria-label="打开快捷操作"
        >
          <FolderOpen className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-gray-200 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-t-2xl"
          >
            <div className="border-b border-gray-200 px-4 py-3 text-left">
              <DialogTitle className="text-base font-semibold text-gray-900">快捷操作</DialogTitle>
            </div>

            <div className="grid gap-4 px-4 py-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">导出</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-12 justify-start rounded-lg" onClick={() => { setOpen(false); props.onPrintAll() }}>
                    <FileText className="mr-2 h-4 w-4" />预览
                  </Button>
                  <Button variant="outline" className="h-12 justify-start rounded-lg" onClick={() => { setOpen(false); props.onQuickExportHTML() }}>
                    <Code className="mr-2 h-4 w-4" />HTML
                  </Button>
                  <Button variant="outline" className="h-12 justify-start rounded-lg" onClick={() => { setOpen(false); props.onOpenSealDiceExport() }}>
                    <Dice5 className="mr-2 h-4 w-4" />骰子
                  </Button>
                  <div></div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">存档</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-12 justify-start rounded-lg" onClick={() => { setOpen(false); props.onOpenCharacterManagement() }}>
                    <FolderOpen className="mr-2 h-4 w-4" />管理
                  </Button>
                  <Button variant="outline" className="h-12 justify-start rounded-lg" onClick={() => { setOpen(false); props.onQuickCreateArchive() }}>
                    <Plus className="mr-2 h-4 w-4" />新建
                  </Button>
                  <Button variant="outline" className="col-span-2 h-12 justify-start rounded-lg" onClick={() => { setOpen(false); props.onQuickImportFromHTML() }}>
                    <Upload className="mr-2 h-4 w-4" />从 HTML 导入
                  </Button>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}
