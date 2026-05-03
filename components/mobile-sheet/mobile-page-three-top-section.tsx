"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MobileOptionSheet } from "@/components/mobile-sheet/mobile-option-sheet"
import { LIFE_PATH_FIELDS, LIFE_PATH_LAYOUT_ROWS, type LifePathTextFieldKey } from "@/data/life-path"
import { useSafeSheetData, useSheetStore } from "@/lib/sheet-store"

function MobileLifePathField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-[3px] border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-600"
        >
          选项
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        onChange={(event) => {
          event.currentTarget.style.height = "0px"
          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
          onChange(event.target.value)
        }}
        className="min-h-[2.4rem] w-full resize-none overflow-hidden rounded-[3px] border border-gray-300 bg-white px-2 py-1 text-sm leading-5 text-gray-900 outline-none"
        placeholder=""
      />

      <MobileOptionSheet
        open={open}
        onOpenChange={setOpen}
        title={label}
        options={options}
        onSelect={onChange}
      />
    </div>
  )
}

export function MobilePageThreeTopSection() {
  const safeFormData = useSafeSheetData()
  const setSheetData = useSheetStore((state) => state.setSheetData)

  const lifePath = safeFormData.adventureNotes?.lifePath || {}
  const lifePathFieldMap = useMemo(() => new Map(LIFE_PATH_FIELDS.map((field) => [field.key, field])), [])
  const lifePathRows = useMemo(
    () =>
      LIFE_PATH_LAYOUT_ROWS.map((keys) =>
        keys.map((key) => lifePathFieldMap.get(key)).filter((field): field is (typeof LIFE_PATH_FIELDS)[number] => Boolean(field)),
      ),
    [lifePathFieldMap],
  )

  const updateLifePathField = (field: LifePathTextFieldKey, value: string) => {
    setSheetData((prev) => ({
      ...prev,
      adventureNotes: {
        ...prev.adventureNotes,
        lifePath: {
          ...prev.adventureNotes?.lifePath,
          [field]: value,
        },
      },
    }))
  }

  return (
    <div className="space-y-2">
      <div className="pl-[3px] text-sm font-semibold text-gray-900">生命路径</div>
      <div className="space-y-2">
        {lifePathRows.map((row, rowIndex) => (
          <div key={`mobile-life-row-${rowIndex}`} className="grid grid-cols-2 gap-2">
            {row.map((field) => (
              <MobileLifePathField
                key={field.key}
                label={field.label}
                value={lifePath[field.key] || ""}
                options={field.options}
                onChange={(value) => updateLifePathField(field.key, value)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
