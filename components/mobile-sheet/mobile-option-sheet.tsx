"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"

interface MobileOptionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  options: string[]
  onSelect: (value: string) => void
}

export function MobileOptionSheet({
  open,
  onOpenChange,
  title,
  options,
  onSelect,
}: MobileOptionSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-gray-200 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-t-2xl"
        >
          <div className="border-b border-gray-200 px-4 py-3 text-left">
            <DialogTitle className="text-base font-semibold text-gray-900">{title}</DialogTitle>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
            <div className="grid gap-2">
              {options.map((option) => (
                <button
                  key={`${title}-${option}`}
                  type="button"
                  onClick={() => {
                    onSelect(option)
                    onOpenChange(false)
                  }}
                  className="border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-800"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
