"use client"

import { useEffect, useState } from "react"
import { useSafeSheetData, useSheetStore } from "@/lib/sheet-store"

function MobilePageTwoField({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
      <div className="mb-1 pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{title}</div>
      {children}
    </div>
  )
}

function MobilePageTwoTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-[3px] border border-gray-300 bg-white px-3 py-2 text-sm leading-5 text-gray-900 outline-none transition focus:border-gray-900 ${className || ""}`}
    />
  )
}

export function MobilePageTwoTextSection() {
  const safeFormData = useSafeSheetData()
  const setSheetData = useSheetStore((state) => state.setSheetData)
  const [isBackstoryFullscreen, setIsBackstoryFullscreen] = useState(false)

  useEffect(() => {
    if (!isBackstoryFullscreen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isBackstoryFullscreen])

  const backstoryValue = safeFormData.adventureNotes?.backstory || ""

  const handleCharacterBackgroundChange = (value: string) => {
    setSheetData({ characterBackground: value })
  }

  const handleBackstoryChange = (value: string) => {
    setSheetData((prev) => ({
      ...prev,
      adventureNotes: {
        ...prev.adventureNotes,
        backstory: value,
      },
    }))
  }

  const handleGmNotesChange = (value: string) => {
    setSheetData({ characterMotivation: value })
  }

  return (
    <>
      <div className="space-y-2">
        <MobilePageTwoField title="角色简介">
          <MobilePageTwoTextarea
            value={safeFormData.characterBackground || ""}
            onChange={(event) => handleCharacterBackgroundChange(event.target.value)}
            placeholder=""
            className="h-[2.6rem] min-h-[2.6rem] overflow-y-auto"
          />
        </MobilePageTwoField>

        <MobilePageTwoField title="背景故事">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBackstoryFullscreen(true)}
              className="absolute right-2 top-2 z-10 rounded-[3px] border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-700"
            >
              展开
            </button>
            <MobilePageTwoTextarea
              value={backstoryValue}
              onChange={(event) => handleBackstoryChange(event.target.value)}
              placeholder=""
              className="h-[4.4rem] min-h-[4.4rem] overflow-y-auto pr-14"
            />
          </div>
        </MobilePageTwoField>

        <MobilePageTwoField title="GM笔记">
          <MobilePageTwoTextarea
            value={safeFormData.characterMotivation || ""}
            onChange={(event) => handleGmNotesChange(event.target.value)}
            placeholder=""
            className="h-[2.6rem] min-h-[2.6rem] overflow-y-auto"
          />
        </MobilePageTwoField>
      </div>

      {isBackstoryFullscreen ? (
        <div className="fixed inset-0 z-[70] bg-white p-3 print:hidden">
          <div className="mx-auto flex h-full max-w-3xl flex-col">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2">
              <div className="text-base font-semibold text-gray-900">背景故事</div>
              <button
                type="button"
                onClick={() => setIsBackstoryFullscreen(false)}
                className="rounded-[3px] border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
              >
                关闭
              </button>
            </div>

            <MobilePageTwoTextarea
              value={backstoryValue}
              onChange={(event) => handleBackstoryChange(event.target.value)}
              placeholder=""
              className="mt-3 flex-1 min-h-0 overflow-y-auto"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
