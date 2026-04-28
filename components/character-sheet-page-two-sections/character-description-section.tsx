"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import type { SheetData } from "@/lib/sheet-data"
import { useSheetStore } from "@/lib/sheet-store"

interface CharacterDescriptionSectionProps {
  formData: SheetData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function CharacterDescriptionSection({ formData, handleInputChange }: CharacterDescriptionSectionProps) {  // 基于高度限制的处理函数
  const setSheetData = useSheetStore((state) => state.setSheetData)
  const [isBackstoryFullscreen, setIsBackstoryFullscreen] = useState(false)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    const newValue = e.target.value

    // 创建一个模拟的事件对象用于更新状态
    const createSyntheticEvent = (value: string) => {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: value,
          name: e.target.name
        }
      } as React.ChangeEvent<HTMLTextAreaElement>
      return syntheticEvent
    }

    // 临时保存当前值
    const originalValue = textarea.value

    // 应用新值来测试
    textarea.value = newValue

    // 立即检查是否溢出
    const hasOverflow = textarea.scrollHeight > textarea.clientHeight + 5

    if (hasOverflow) {
    // 有溢出，恢复原值
      textarea.value = originalValue
      // 不调用 handleInputChange，保持原来的状态
    } else {
      // 没有溢出，更新 React 状态
      handleInputChange(createSyntheticEvent(newValue))
    }
  }

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

  const backstoryValue = formData.adventureNotes?.backstory || ""

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
    setSheetData((prev) => ({
      ...prev,
      characterMotivation: value,
    }))
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 mt-2 p-1">
        <div className="col-span-1 flex flex-col">
          <h3 className="text-[12px] font-bold text-center mb-1">角色简介</h3>
          <div className="flex-grow relative">
            <Textarea
              name="characterBackground"
              value={formData.characterBackground}
              onChange={handleTextareaChange}
              className="!h-[220px] !text-[11px] !border-gray-400 !leading-[1.2] !resize-none !overflow-hidden print-empty-hide"
              placeholder="写下对您的角色的概括性介绍，包括他们的过去、经历和个性特征。请注意，角色真正的性格和背景特质应当在游戏中体现出来，这里只是简短的概括和提示。"
            />
          </div>
        </div>

        <div className="col-span-1 flex flex-col">
          <h3 className="text-[12px] font-bold text-center mb-1">背景故事</h3>
          <div className="flex-grow relative">
            <button
              type="button"
              onClick={() => setIsBackstoryFullscreen(true)}
              className="absolute bottom-2 right-2 z-10 rounded border border-gray-400 bg-white/95 px-2 py-0.5 text-[10px] text-gray-700 transition-colors hover:bg-gray-100 print:hidden"
            >
              展开
            </button>
            <Textarea
              value={backstoryValue}
              onChange={(event) => handleBackstoryChange(event.target.value)}
              className="!h-[220px] !text-[11px] !border-gray-400 !leading-[1.35] !resize-none !overflow-y-auto print-empty-hide"
              placeholder="写下角色完整的背景故事、关键经历、隐秘过去与长期目标。"
            />
          </div>
        </div>

        <div className="col-span-1 flex flex-col">
          <h3 className="text-[12px] font-bold text-center mb-1">GM笔记</h3>
          <div className="flex-grow relative">
            <Textarea
              value={formData.characterMotivation || ""}
              onChange={(event) => handleGmNotesChange(event.target.value)}
              className="!h-[220px] !text-[11px] !border-gray-400 !leading-[1.35] !resize-none !overflow-y-auto print-empty-hide"
            />
          </div>
        </div>
      </div>
      {isBackstoryFullscreen && (
        <div className="fixed inset-0 z-[60] bg-white p-4 print:hidden md:p-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="flex items-center justify-between border-b border-gray-300 pb-3">
              <h2 className="text-xl font-bold text-black">背景故事</h2>
              <button
                type="button"
                onClick={() => setIsBackstoryFullscreen(false)}
                className="rounded border border-gray-400 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                关闭
              </button>
            </div>
            <Textarea
              value={backstoryValue}
              onChange={(event) => handleBackstoryChange(event.target.value)}
              className="mt-4 flex-1 !min-h-0 !w-full !resize-none !overflow-y-auto !border-gray-400 !text-sm !leading-6"
              placeholder="写下角色完整的背景故事、关键经历、隐秘过去与长期目标。"
            />
          </div>
        </div>
      )}
    </>
  )
}
