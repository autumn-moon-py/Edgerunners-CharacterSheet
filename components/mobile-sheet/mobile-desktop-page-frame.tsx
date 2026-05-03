"use client"

import type { ReactNode } from "react"

interface MobileDesktopPageFrameProps {
  title: string
  description: string
  children: ReactNode
}

export function MobileDesktopPageFrame({ title, description, children }: MobileDesktopPageFrameProps) {
  return (
    <div className="space-y-3">
      {description ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-amber-800">{description}</div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-2 shadow-sm">
        <div className="min-w-[210mm]">{children}</div>
      </div>
    </div>
  )
}
